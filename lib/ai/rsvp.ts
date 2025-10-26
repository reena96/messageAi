import { getFunctions, httpsCallable } from 'firebase/functions';
import app, { FUNCTIONS_REGION } from '@/lib/firebase/config';

/**
 * RSVP interface
 * Represents RSVP tracking data extracted from messages
 */
export interface RSVP {
  isInvitation: boolean; // Is this an invitation to an event?
  isResponse: boolean; // Is this an RSVP response?
  event?: string; // What event is it for
  response?: "yes" | "no" | "maybe"; // User's response
  responses?: { yes: number; no: number; maybe: number }; // Aggregate counts
  details?: string | any[] | Record<string, any>; // Additional context (may include structured metadata)
  confidence: number; // 0-1 range
}

// Initialize Firebase Functions
const functions = getFunctions(app, FUNCTIONS_REGION);

/**
 * Tracks RSVPs and invitations from text using AI
 * Calls Firebase Cloud Function that uses OpenAI GPT-4 Turbo
 *
 * @param text - The message text to analyze
 * @param chatId - Optional chat ID for aggregation
 * @param messageId - Optional message ID for aggregation
 * @returns Promise<RSVP | null> - RSVP data or null if not an RSVP
 */
export async function trackRSVP(
  text: string,
  chatId?: string,
  messageId?: string
): Promise<RSVP | null> {
  try {
    console.log('[AI] 🎫 trackRSVP called with text:', text);

    // Validate input
    if (!text || text.trim().length === 0) {
      console.log('[AI] ⚠️ Empty text, skipping RSVP tracking');
      return null;
    }

    console.log('[AI] 📡 Calling Cloud Function for RSVP tracking:', text.substring(0, 50) + '...');

    // Get callable reference to Cloud Function
    const trackRSVPFunction = httpsCallable(functions, 'trackRSVP');

    console.log('[AI] 🌐 Invoking trackRSVP function...');

    // Call the function
    const result = await trackRSVPFunction({ text, chatId, messageId });

    console.log('[AI] 📦 Received response from Cloud Function:', result);

    // Extract RSVP from response
    const rsvp = (result.data as any)?.rsvp || null;

    if (rsvp) {
      console.log('[AI] 🎯 RSVP detected:', JSON.stringify(rsvp, null, 2));
    } else {
      console.log('[AI] ℹ️ No RSVP detected in message');
    }

    return rsvp;
  } catch (error) {
    // Graceful degradation - log error but don't throw
    console.error('[AI] ❌ RSVP tracking error:', error);
    if (error instanceof Error) {
      console.error('[AI] Error name:', error.name);
      console.error('[AI] Error message:', error.message);
      console.error('[AI] Error stack:', error.stack);
    }
    return null;
  }
}

/**
 * Test cases for RSVP tracking accuracy validation
 * Used in automated tests to verify >90% accuracy requirement
 */
export const RSVP_TEST_CASES = [
  // Invitations
  {
    input: "Pizza party Friday! Who's coming?",
    expected: { isInvitation: true, isResponse: false },
    description: 'Simple invitation',
  },
  {
    input: 'Pool party Saturday at 3pm! Who can come?',
    expected: { isInvitation: true, isResponse: false },
    description: 'Invitation with time',
  },
  {
    input: "We're having a BBQ next Sunday. Let me know if you can make it!",
    expected: { isInvitation: true, isResponse: false },
    description: 'Casual invitation',
  },
  {
    input: "You're all invited to Jake's birthday party on Saturday!",
    expected: { isInvitation: true, isResponse: false },
    description: 'Birthday party invitation',
  },
  {
    input: 'Team dinner tomorrow night at 7pm. Please RSVP!',
    expected: { isInvitation: true, isResponse: false },
    description: 'Formal invitation with RSVP request',
  },

  // Yes responses
  {
    input: 'Count me in!',
    expected: { isInvitation: false, isResponse: true, response: 'yes' },
    description: 'Enthusiastic yes',
  },
  {
    input: "I'll be there!",
    expected: { isInvitation: false, isResponse: true, response: 'yes' },
    description: 'Confirmative yes',
  },
  {
    input: 'We can make it!',
    expected: { isInvitation: false, isResponse: true, response: 'yes' },
    description: 'Plural yes',
  },
  {
    input: 'Yes, see you there!',
    expected: { isInvitation: false, isResponse: true, response: 'yes' },
    description: 'Direct yes',
  },

  // No responses
  {
    input: "Sorry, can't make it",
    expected: { isInvitation: false, isResponse: true, response: 'no' },
    description: 'Polite no',
  },
  {
    input: "We won't be able to come",
    expected: { isInvitation: false, isResponse: true, response: 'no' },
    description: 'Plural no',
  },
  {
    input: "I have to pass this time",
    expected: { isInvitation: false, isResponse: true, response: 'no' },
    description: 'Indirect no',
  },
  {
    input: "Sorry, we have other plans",
    expected: { isInvitation: false, isResponse: true, response: 'no' },
    description: 'No with reason',
  },

  // Maybe responses
  {
    input: "I'll try to come but not sure",
    expected: { isInvitation: false, isResponse: true, response: 'maybe' },
    description: 'Uncertain maybe',
  },
  {
    input: 'Might be able to make it',
    expected: { isInvitation: false, isResponse: true, response: 'maybe' },
    description: 'Tentative maybe',
  },
  {
    input: "I'm not sure yet, let me check",
    expected: { isInvitation: false, isResponse: true, response: 'maybe' },
    description: 'Need to check',
  },
  {
    input: 'Possibly!',
    expected: { isInvitation: false, isResponse: true, response: 'maybe' },
    description: 'Single word maybe',
  },

  // Non-RSVP messages
  {
    input: 'What time should we meet?',
    expected: { isInvitation: false, isResponse: false },
    description: 'Question, not RSVP',
  },
  {
    input: 'Thanks for the invitation!',
    expected: { isInvitation: false, isResponse: false },
    description: 'Acknowledgment without response',
  },
  {
    input: 'Can I bring anything?',
    expected: { isInvitation: false, isResponse: false },
    description: 'Offer to contribute, not RSVP',
  },
  {
    input: 'Sounds fun!',
    expected: { isInvitation: false, isResponse: false },
    description: 'Positive comment, not commitment',
  },
];
