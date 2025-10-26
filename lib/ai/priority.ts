import { getFunctions, httpsCallable } from 'firebase/functions';
import app, { FUNCTIONS_REGION } from '@/lib/firebase/config';

/**
 * Priority interface
 * Represents the priority level of a message for busy parents
 */
export interface Priority {
  level: 'critical' | 'high' | 'medium' | 'low'; // Priority classification
  reason: string; // Why this priority was assigned
  urgency: boolean; // Requires immediate action?
  confidence: number; // 0-1 range, how confident the AI is
}

// Initialize Firebase Functions
const functions = getFunctions(app, FUNCTIONS_REGION);

/**
 * Detects message priority using AI
 * Calls Firebase Cloud Function that uses OpenAI GPT-4 Turbo
 *
 * @param text - The message text to analyze
 * @returns Promise<Priority | null> - Priority object or null if error
 */
export async function detectPriority(text: string): Promise<Priority | null> {
  try {
    console.log('[AI] 🔍 detectPriority called with text:', text);

    // Validate input
    if (!text || text.trim().length === 0) {
      console.log('[AI] ⚠️ Empty text, returning default medium priority');
      return {
        level: 'medium',
        reason: 'Empty message',
        urgency: false,
        confidence: 0.0,
      };
    }

    console.log('[AI] 📡 Calling Cloud Function for:', text.substring(0, 50) + '...');

    // Get callable reference to Cloud Function
    const priorityDetection = httpsCallable(functions, 'priorityDetection');

    console.log('[AI] 🌐 Invoking priorityDetection function...');

    // Call the function
    const result = await priorityDetection({ text });

    console.log('[AI] 📦 Received response from Cloud Function:', result);

    // Extract priority from response
    const priority = (result.data as any)?.priority;

    if (!priority) {
      console.warn('[AI] ⚠️ No priority in response, using default');
      return {
        level: 'medium',
        reason: 'Unable to determine priority',
        urgency: false,
        confidence: 0.5,
      };
    }

    console.log(`[AI] 🎯 Priority detected: ${priority.level} (urgency: ${priority.urgency})`);
    console.log('[AI] Reason:', priority.reason);

    return priority as Priority;
  } catch (error) {
    // Graceful degradation - log error and return safe default
    console.error('[AI] ❌ Priority detection error:', error);
    if (error instanceof Error) {
      console.error('[AI] Error name:', error.name);
      console.error('[AI] Error message:', error.message);
      console.error('[AI] Error stack:', error.stack);
    }

    // Return medium priority as safe default
    return {
      level: 'medium',
      reason: 'Error detecting priority',
      urgency: false,
      confidence: 0.0,
    };
  }
}

/**
 * Test cases for priority detection accuracy validation
 * Used in automated tests to verify >90% accuracy requirement
 */
export const PRIORITY_TEST_CASES = [
  // Critical priority - emergencies, sick child, safety
  {
    input: 'URGENT: Server is down!',
    expected: { level: 'critical', urgency: true },
    description: 'System emergency',
  },
  {
    input: 'Emma has fever, picking her up from school now',
    expected: { level: 'critical', urgency: true },
    description: 'Sick child - parent-specific critical',
  },
  {
    input: 'School nurse called - Jake hurt on playground',
    expected: { level: 'critical', urgency: true },
    description: 'Child injury emergency',
  },
  {
    input: 'EMERGENCY: Practice cancelled due to severe weather',
    expected: { level: 'critical', urgency: true },
    description: 'Safety-related cancellation',
  },
  {
    input: 'Water pipe burst in the classroom',
    expected: { level: 'critical', urgency: true },
    description: 'Facility emergency',
  },

  // High priority - deadlines, time-sensitive
  {
    input: 'Report due tomorrow at 9am',
    expected: { level: 'high', urgency: true },
    description: 'Next-day deadline',
  },
  {
    input: 'Permission slip needs to be signed by tomorrow morning',
    expected: { level: 'high', urgency: true },
    description: 'Parent-specific deadline',
  },
  {
    input: 'Need headcount for party by end of day',
    expected: { level: 'high', urgency: true },
    description: 'Same-day RSVP deadline',
  },
  {
    input: 'Can you pick up Sarah? I\'m stuck in traffic',
    expected: { level: 'high', urgency: true },
    description: 'Urgent pickup request',
  },
  {
    input: 'Meeting starts in 30 minutes - are you coming?',
    expected: { level: 'high', urgency: true },
    description: 'Imminent event',
  },

  // Medium priority - routine, general questions
  {
    input: 'Can you review when you get a chance?',
    expected: { level: 'medium', urgency: false },
    description: 'Non-urgent request',
  },
  {
    input: 'Parent-teacher conference scheduled for next week',
    expected: { level: 'medium', urgency: false },
    description: 'Future event notification',
  },
  {
    input: 'What should we bring to the picnic next Saturday?',
    expected: { level: 'medium', urgency: false },
    description: 'Planning question',
  },
  {
    input: 'Field trip schedule attached for next month',
    expected: { level: 'medium', urgency: false },
    description: 'Informational update',
  },
  {
    input: 'Weekly newsletter from teacher',
    expected: { level: 'medium', urgency: false },
    description: 'Regular communication',
  },

  // Low priority - casual, social
  {
    input: 'Just wanted to share this funny video',
    expected: { level: 'low', urgency: false },
    description: 'Social sharing',
  },
  {
    input: 'Thanks for the update!',
    expected: { level: 'low', urgency: false },
    description: 'Acknowledgment',
  },
  {
    input: 'Have a great weekend!',
    expected: { level: 'low', urgency: false },
    description: 'Greeting',
  },
  {
    input: 'LOL that\'s hilarious',
    expected: { level: 'low', urgency: false },
    description: 'Casual response',
  },
  {
    input: 'How are you doing?',
    expected: { level: 'low', urgency: false },
    description: 'Casual question',
  },
];
