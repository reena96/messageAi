import { getFunctions, httpsCallable } from 'firebase/functions';
import app, { FUNCTIONS_REGION } from '@/lib/firebase/config';

/**
 * Decision interface
 * Represents a detected decision (pending or resolved) in a conversation
 */
export interface Decision {
  decision: string; // What was decided or being discussed
  status: 'pending' | 'resolved'; // Is it a question or agreement?
  participants?: string[]; // Who is involved (if mentioned)
  context?: string; // Brief summary of the discussion
  confidence: number; // 0-1 range, how confident the AI is
}

// Initialize Firebase Functions
const functions = getFunctions(app, FUNCTIONS_REGION);

/**
 * Extracts decisions from text using AI
 * Calls Firebase Cloud Function that uses OpenAI GPT-4 Turbo
 *
 * @param text - The message text to analyze
 * @returns Promise<Decision[]> - Array of detected decisions
 */
export async function extractDecisions(text: string): Promise<Decision[]> {
  try {
    console.log('[AI] 🔍 extractDecisions called with text:', text);

    // Validate input
    if (!text || text.trim().length === 0) {
      console.log('[AI] ⚠️ Empty text, skipping decision extraction');
      return [];
    }

    console.log('[AI] 📡 Calling Cloud Function for:', text.substring(0, 50) + '...');

    // Get callable reference to Cloud Function
    const decisionExtraction = httpsCallable(functions, 'decisionExtraction');

    console.log('[AI] 🌐 Invoking decisionExtraction function...');

    // Call the function
    const result = await decisionExtraction({ text });

    console.log('[AI] 📦 Received response from Cloud Function:', result);

    // Extract decisions from response
    const decisions = (result.data as any)?.decisions || [];

    console.log(`[AI] 🎯 Parsed ${decisions.length} decision(s) from response`);
    if (decisions.length > 0) {
      console.log('[AI] Decisions:', JSON.stringify(decisions, null, 2));
    }

    return decisions as Decision[];
  } catch (error) {
    // Graceful degradation - log error but don't throw
    console.error('[AI] ❌ Decision extraction error:', error);
    if (error instanceof Error) {
      console.error('[AI] Error name:', error.name);
      console.error('[AI] Error message:', error.message);
      console.error('[AI] Error stack:', error.stack);
    }
    return [];
  }
}

/**
 * Test cases for decision extraction accuracy validation
 * Used in automated tests to verify >90% accuracy requirement
 */
export const DECISION_TEST_CASES = [
  // Resolved decisions
  {
    input: "Let's go with option B. Everyone agreed.",
    expected: { hasDecision: true, status: 'resolved' },
    description: 'Simple resolved decision',
  },
  {
    input: 'We decided to postpone the launch until next month.',
    expected: { hasDecision: true, status: 'resolved' },
    description: 'Explicit decision statement',
  },
  {
    input: "Perfect! Let's meet at the park on Saturday then.",
    expected: { hasDecision: true, status: 'resolved' },
    description: 'Agreement with confirmation',
  },
  {
    input: "Sounds good, we'll order pizza for the party.",
    expected: { hasDecision: true, status: 'resolved' },
    description: 'Casual agreement',
  },
  {
    input: 'All agreed - practice moved to Thursday at 4pm.',
    expected: { hasDecision: true, status: 'resolved' },
    description: 'Group consensus',
  },

  // Pending decisions
  {
    input: 'Should we launch next week or wait until February?',
    expected: { hasDecision: true, status: 'pending' },
    description: 'Binary choice question',
  },
  {
    input: 'What should we bring to the potluck - snacks or dessert?',
    expected: { hasDecision: true, status: 'pending' },
    description: 'Choice between options',
  },
  {
    input: 'Need to decide on the meeting location - office or zoom?',
    expected: { hasDecision: true, status: 'pending' },
    description: 'Explicit decision needed',
  },
  {
    input: 'Should we reschedule the party or keep it as planned?',
    expected: { hasDecision: true, status: 'pending' },
    description: 'Yes/no decision',
  },
  {
    input: 'Still deciding between Tuesday 3pm or Wednesday 2pm.',
    expected: { hasDecision: true, status: 'pending' },
    description: 'Time selection in progress',
  },

  // NOT decisions (should return empty)
  {
    input: 'What time should we meet?',
    expected: { hasDecision: false },
    description: 'Simple question, not a decision',
  },
  {
    input: 'Thanks for the update!',
    expected: { hasDecision: false },
    description: 'Acknowledgment',
  },
  {
    input: 'How are you doing today?',
    expected: { hasDecision: false },
    description: 'Casual greeting',
  },
  {
    input: 'Can you send me the file?',
    expected: { hasDecision: false },
    description: 'Request for action',
  },
  {
    input: 'I will be there at 3pm.',
    expected: { hasDecision: false },
    description: 'Statement of intent',
  },
  {
    input: 'Running 10 minutes late.',
    expected: { hasDecision: false },
    description: 'Status update',
  },

  // Edge cases
  {
    input: 'We need to decide on this soon.',
    expected: { hasDecision: false }, // Too vague, no actual decision
    description: 'Vague statement about deciding',
  },
  {
    input: 'Let me think about it and get back to you.',
    expected: { hasDecision: false }, // Deferring, not deciding
    description: 'Deferred decision',
  },
  {
    input: 'Maybe we should meet Tuesday? Not sure yet.',
    expected: { hasDecision: true, status: 'pending' },
    description: 'Tentative suggestion',
  },
  {
    input: 'Final decision: We are going with vendor A.',
    expected: { hasDecision: true, status: 'resolved' },
    description: 'Explicit final decision',
  },
];
