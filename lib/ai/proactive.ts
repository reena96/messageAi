import { getFunctions, httpsCallable } from 'firebase/functions';
import app, { FUNCTIONS_REGION } from '@/lib/firebase/config';

/**
 * Proactive Insight Types
 */
export type InsightType = 'conflict' | 'suggestion' | 'reminder';

/**
 * Proactive Insight Interface
 */
export interface ProactiveInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number; // 0-1 range
  reasoning: string;
  alternatives?: string[];
  relatedItems: {
    type: 'calendar' | 'deadline' | 'decision' | 'rsvp';
    id: string;
    data: any;
  }[];
  timestamp: number;
  userId: string;
}

/**
 * Proactive Assistant Response
 */
export interface ProactiveAssistantResponse {
  insights: ProactiveInsight[];
  summary: string;
  timestamp: number;
}

// Initialize Firebase Functions
const functions = getFunctions(app, FUNCTIONS_REGION);

/**
 * Analyze user's schedule and get proactive insights
 * Uses LangChain + RAG to detect conflicts, deadlines, pending decisions
 *
 * @returns Promise<ProactiveAssistantResponse>
 */
export async function analyzeSchedule(): Promise<ProactiveAssistantResponse> {
  try {
    console.log('[Proactive AI] 🔍 Analyzing schedule...');

    // Get callable reference to Cloud Function
    const proactiveAssistant = httpsCallable<void, ProactiveAssistantResponse>(
      functions,
      'proactiveAssistant'
    );

    console.log('[Proactive AI] 📡 Calling proactiveAssistant function...');

    // Call the function
    const result = await proactiveAssistant();

    console.log('[Proactive AI] 📦 Received response:', {
      insightCount: result.data.insights.length,
      summary: result.data.summary.substring(0, 100),
    });

    return result.data;
  } catch (error) {
    console.error('[Proactive AI] ❌ Analysis error:', error);

    // Log detailed error info for debugging
    if (error && typeof error === 'object') {
      console.error('[Proactive AI] Error details:', {
        name: (error as any).name,
        code: (error as any).code,
        message: (error as any).message,
        details: (error as any).details,
        fullError: JSON.stringify(error, null, 2),
      });
    }

    // Check for specific error types
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string; message: string; details?: any };

      if (firebaseError.code === 'unauthenticated') {
        throw new Error('You must be logged in to use the proactive assistant.');
      } else if (firebaseError.code === 'permission-denied') {
        throw new Error('You do not have permission to access this feature.');
      } else if (firebaseError.code === 'deadline-exceeded') {
        throw new Error('Request timed out. Please try again.');
      } else if (firebaseError.code === 'internal') {
        // Show more details for internal errors
        const details = firebaseError.details || firebaseError.message;
        throw new Error(`Server error: ${details}`);
      }
    }

    // Include original error message if available
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to analyze schedule: ${errorMessage}`);
  }
}

/**
 * Submit feedback on a proactive insight
 *
 * @param insightId - The ID of the insight
 * @param vote - 'up' for thumbs up, 'down' for thumbs down
 * @param note - Optional note explaining the feedback
 * @returns Promise<{success: boolean}>
 */
export async function submitProactiveFeedback(
  insightId: string,
  vote: 'up' | 'down',
  note?: string
): Promise<{ success: boolean }> {
  try {
    console.log('[Proactive AI] 👍 Submitting feedback:', { insightId, vote });

    // Validate input
    if (!insightId || !vote) {
      throw new Error('insightId and vote are required');
    }

    if (!['up', 'down'].includes(vote)) {
      throw new Error('vote must be "up" or "down"');
    }

    // Get callable reference to Cloud Function
    const submitFeedback = httpsCallable<
      { insightId: string; vote: string; note?: string },
      { success: boolean }
    >(functions, 'submitProactiveFeedback');

    console.log('[Proactive AI] 📡 Calling submitProactiveFeedback function...');

    // Call the function
    const result = await submitFeedback({ insightId, vote, note });

    console.log('[Proactive AI] ✅ Feedback submitted successfully');

    return result.data;
  } catch (error) {
    console.error('[Proactive AI] ❌ Feedback submission error:', error);

    // Check for specific error types
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string; message: string };

      if (firebaseError.code === 'unauthenticated') {
        throw new Error('You must be logged in to submit feedback.');
      } else if (firebaseError.code === 'invalid-argument') {
        throw new Error(firebaseError.message || 'Invalid feedback data.');
      }
    }

    throw new Error('Failed to submit feedback. Please try again later.');
  }
}

/**
 * Helper to get icon name for insight type
 */
export function getInsightIcon(type: InsightType): string {
  switch (type) {
    case 'conflict':
      return 'alert-circle';
    case 'suggestion':
      return 'bulb';
    case 'reminder':
      return 'notifications';
    default:
      return 'information-circle';
  }
}

/**
 * Helper to get color for insight type
 */
export function getInsightColor(type: InsightType): string {
  switch (type) {
    case 'conflict':
      return '#FF3B30'; // Red
    case 'suggestion':
      return '#007AFF'; // Blue
    case 'reminder':
      return '#FF9500'; // Orange
    default:
      return '#8E8E93'; // Gray
  }
}

/**
 * Helper to format confidence as a percentage
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}% confidence`;
}

/**
 * Helper to get confidence badge color
 */
export function getConfidenceBadgeColor(confidence: number): string {
  if (confidence >= 0.9) {
    return '#34C759'; // Green - High confidence
  } else if (confidence >= 0.7) {
    return '#FF9500'; // Orange - Medium confidence
  } else {
    return '#8E8E93'; // Gray - Low confidence
  }
}

/**
 * Test cases for proactive assistant accuracy validation
 * Used in manual testing to verify >90% accuracy requirement
 */
export const PROACTIVE_ASSISTANT_TEST_CASES = [
  {
    scenario: 'Two events at same time',
    description: 'Should detect time conflict',
    setup: 'Create two calendar events on same day/time',
    expectedInsight: 'conflict',
    expectedConfidence: '>= 0.85',
  },
  {
    scenario: 'Deadline due tomorrow',
    description: 'Should create high-priority reminder',
    setup: 'Create deadline with due date = tomorrow',
    expectedInsight: 'reminder',
    expectedConfidence: '>= 0.9',
  },
  {
    scenario: 'Pending decision from yesterday',
    description: 'Should suggest follow-up',
    setup: 'Create pending decision from group chat',
    expectedInsight: 'suggestion',
    expectedConfidence: '>= 0.7',
  },
  {
    scenario: 'RSVP invitation without response',
    description: 'Should remind to respond',
    setup: 'Create RSVP invitation (isInvitation=true, no response)',
    expectedInsight: 'reminder',
    expectedConfidence: '>= 0.7',
  },
  {
    scenario: 'No conflicts or urgent items',
    description: 'Should return reassuring message',
    setup: 'Empty schedule or all items resolved',
    expectedInsight: null,
    expectedConfidence: null,
  },
  {
    scenario: 'Event at 3pm and 4:30pm same day',
    description: 'Should NOT detect conflict (different times)',
    setup: 'Create events with 1.5 hour gap',
    expectedInsight: null,
    expectedConfidence: null,
  },
  {
    scenario: 'Completed deadline',
    description: 'Should NOT create reminder',
    setup: 'Create deadline with completed=true',
    expectedInsight: null,
    expectedConfidence: null,
  },
  {
    scenario: 'Resolved decision',
    description: 'Should NOT suggest follow-up',
    setup: 'Create decision with status=resolved',
    expectedInsight: null,
    expectedConfidence: null,
  },
];
