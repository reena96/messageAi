import { getFunctions, httpsCallable } from 'firebase/functions';
import app, { FUNCTIONS_REGION } from '@/lib/firebase/config';

/**
 * Deadline interface
 * Represents a deadline/task extracted from a message
 */
export interface Deadline {
  task: string; // What needs to be done
  dueDate: string; // ISO format YYYY-MM-DD
  dueTime?: string; // Time if specified
  assignedTo?: string[]; // Who is responsible
  priority?: "high" | "medium" | "low";
  completed: boolean; // Default false
  confidence: number; // 0-1 range
}

// Initialize Firebase Functions
const functions = getFunctions(app, FUNCTIONS_REGION);

/**
 * Extracts deadlines from text using AI
 * Calls Firebase Cloud Function that uses OpenAI GPT-4 Turbo
 *
 * @param text - The message text to analyze
 * @returns Promise<Deadline[]> - Array of extracted deadlines
 */
export async function extractDeadlines(text: string): Promise<Deadline[]> {
  try {
    console.log('[AI] ⏰ extractDeadlines called with text:', text);

    // Validate input
    if (!text || text.trim().length === 0) {
      console.log('[AI] ⚠️ Empty text, skipping deadline extraction');
      return [];
    }

    console.log('[AI] 📡 Calling Cloud Function for deadline extraction:', text.substring(0, 50) + '...');

    // Get callable reference to Cloud Function
    const extractDeadlinesFunction = httpsCallable(functions, 'extractDeadlines');

    console.log('[AI] 🌐 Invoking extractDeadlines function...');

    // Call the function
    const result = await extractDeadlinesFunction({ text });

    console.log('[AI] 📦 Received response from Cloud Function:', result);

    // Extract deadlines from response
    const deadlines = (result.data as any)?.deadlines || [];

    console.log(`[AI] 🎯 Parsed ${deadlines.length} deadline(s) from response`);
    if (deadlines.length > 0) {
      console.log('[AI] Deadlines:', JSON.stringify(deadlines, null, 2));
    }

    return deadlines as Deadline[];
  } catch (error) {
    // Graceful degradation - log error but don't throw
    console.error('[AI] ❌ Deadline extraction error:', error);
    if (error instanceof Error) {
      console.error('[AI] Error name:', error.name);
      console.error('[AI] Error message:', error.message);
      console.error('[AI] Error stack:', error.stack);
    }
    return [];
  }
}

/**
 * Test cases for deadline extraction accuracy validation
 * Used in automated tests to verify >90% accuracy requirement
 */
export const DEADLINE_TEST_CASES = [
  // Deadlines with date and time
  {
    input: 'Permission slip due Friday by 5pm',
    expected: { hasDeadline: true, hasDate: true, hasTime: true },
    description: 'Deadline with date and time',
  },
  {
    input: 'Project submission due tomorrow at noon',
    expected: { hasDeadline: true, hasDate: true, hasTime: true },
    description: 'Deadline with relative date and time',
  },
  {
    input: 'Book report due next Monday by end of day',
    expected: { hasDeadline: true, hasDate: true },
    description: 'Deadline with vague time',
  },

  // Urgent deadlines (high priority)
  {
    input: 'Report due tomorrow',
    expected: { hasDeadline: true, priority: 'high' },
    description: 'Urgent deadline (tomorrow)',
  },
  {
    input: 'Forms due today by 3pm',
    expected: { hasDeadline: true, priority: 'high' },
    description: 'Urgent deadline (today)',
  },

  // Medium priority deadlines
  {
    input: 'Homework due this Friday',
    expected: { hasDeadline: true, priority: 'medium' },
    description: 'This week deadline',
  },
  {
    input: 'Sign and return permission slip by Thursday',
    expected: { hasDeadline: true, priority: 'medium' },
    description: 'Week deadline with action',
  },

  // Low priority deadlines
  {
    input: 'Science fair project due end of month',
    expected: { hasDeadline: true, priority: 'low' },
    description: 'Later deadline',
  },
  {
    input: 'Reading list due next month',
    expected: { hasDeadline: true, priority: 'low' },
    description: 'Long-term deadline',
  },

  // Multiple deadlines
  {
    input: 'Code review due Monday, documentation due Wednesday',
    expected: { hasDeadline: true, multipleDeadlines: true },
    description: 'Multiple deadlines in one message',
  },
  {
    input: 'Math homework due Tuesday, English essay due Friday',
    expected: { hasDeadline: true, multipleDeadlines: true },
    description: 'Two separate assignments',
  },

  // Differentiate from events (NOT deadlines)
  {
    input: 'Meeting Friday at 3pm',
    expected: { hasDeadline: false },
    description: 'Event, not a deadline',
  },
  {
    input: 'Soccer practice tomorrow at 4pm',
    expected: { hasDeadline: false },
    description: 'Recurring activity, not deadline',
  },
  {
    input: 'Dentist appointment next week',
    expected: { hasDeadline: false },
    description: 'Appointment, not a task deadline',
  },
  {
    input: 'Birthday party Saturday',
    expected: { hasDeadline: false },
    description: 'Event, not deadline',
  },

  // Non-deadlines
  {
    input: 'How are you?',
    expected: { hasDeadline: false },
    description: 'Question, not deadline',
  },
  {
    input: 'Thanks for the update',
    expected: { hasDeadline: false },
    description: 'Acknowledgment, not deadline',
  },
  {
    input: 'Can you pick up milk?',
    expected: { hasDeadline: false },
    description: 'Request without deadline',
  },

  // Edge cases
  {
    input: 'Bring snacks to the game Friday',
    expected: { hasDeadline: true },
    description: 'Implicit deadline (event date)',
  },
  {
    input: 'RSVP by Wednesday',
    expected: { hasDeadline: true },
    description: 'RSVP deadline',
  },
];
