import { getFunctions, httpsCallable } from 'firebase/functions';
import app, { FUNCTIONS_REGION } from '@/lib/firebase/config';

/**
 * Calendar Event interface
 * Represents an extracted calendar event from a message
 */
export interface CalendarEvent {
  event: string; // Event name/description
  date: string; // ISO format YYYY-MM-DD
  time?: string; // e.g., "3:00 PM", "14:00"
  location?: string; // Event location if mentioned
  confidence: number; // 0-1 range, how confident the AI is
}

// Initialize Firebase Functions
const functions = getFunctions(app, FUNCTIONS_REGION);

/**
 * Extracts calendar events from text using AI
 * Calls Firebase Cloud Function that uses OpenAI GPT-4 Turbo
 *
 * @param text - The message text to analyze
 * @returns Promise<CalendarEvent[]> - Array of extracted calendar events
 */
export async function extractCalendarEvents(text: string): Promise<CalendarEvent[]> {
  try {
    console.log('[AI] 🔍 extractCalendarEvents called with text:', text);

    // Validate input
    if (!text || text.trim().length === 0) {
      console.log('[AI] ⚠️ Empty text, skipping extraction');
      return [];
    }

    console.log('[AI] 📡 Calling Cloud Function for:', text.substring(0, 50) + '...');

    // Get callable reference to Cloud Function
    const calendarExtraction = httpsCallable(functions, 'calendarExtraction');

    console.log('[AI] 🌐 Invoking calendarExtraction function...');

    // Call the function
    const result = await calendarExtraction({ text });

    console.log('[AI] 📦 Received response from Cloud Function:', result);

    // Extract events from response
    const events = (result.data as any)?.events || [];

    console.log(`[AI] 🎯 Parsed ${events.length} calendar event(s) from response`);
    if (events.length > 0) {
      console.log('[AI] Events:', JSON.stringify(events, null, 2));
    }

    return events as CalendarEvent[];
  } catch (error) {
    // Graceful degradation - log error but don't throw
    console.error('[AI] ❌ Calendar extraction error:', error);
    if (error instanceof Error) {
      console.error('[AI] Error name:', error.name);
      console.error('[AI] Error message:', error.message);
      console.error('[AI] Error stack:', error.stack);
    }
    return [];
  }
}

/**
 * Test cases for calendar extraction accuracy validation
 * Used in automated tests to verify >90% accuracy requirement
 */
export const CALENDAR_TEST_CASES = [
  // Events with time
  {
    input: 'Soccer practice tomorrow at 4pm',
    expected: {hasEvent: true, hasTime: true, hasDate: true},
    description: 'Simple event with relative date and time',
  },
  {
    input: "Parent-teacher conference Friday, Jan 26th at 3:30 PM",
    expected: {hasEvent: true, hasTime: true, hasDate: true},
    description: 'Event with specific date and time',
  },
  {
    input: 'Dentist appointment next Tuesday at 2pm',
    expected: {hasEvent: true, hasTime: true, hasDate: true},
    description: 'Event with relative date (next Tuesday)',
  },
  {
    input: 'Birthday party next Saturday at 2pm at the park',
    expected: {hasEvent: true, hasTime: true, hasDate: true, hasLocation: true},
    description: 'Event with date, time, and location',
  },
  {
    input: "Don't forget the team meeting tomorrow at 10am in room 204",
    expected: {hasEvent: true, hasTime: true, hasDate: true, hasLocation: true},
    description: 'Event with location (room number)',
  },

  // Events without specific time
  {
    input: 'Field trip next Friday',
    expected: {hasEvent: true, hasDate: true},
    description: 'Event with date but no time',
  },
  {
    input: 'School is closed next Monday for holiday',
    expected: {hasEvent: true, hasDate: true},
    description: 'All-day event',
  },

  // Multiple events
  {
    input: 'Dentist Monday at 2pm, then soccer practice Wednesday at 5pm',
    expected: {hasEvent: true, multipleEvents: true},
    description: 'Multiple events in one message',
  },
  {
    input: 'We have practice Tuesday and Thursday at 4pm',
    expected: {hasEvent: true, multipleEvents: true},
    description: 'Recurring event on multiple days',
  },

  // Non-events (should return empty)
  {
    input: 'Can you pick up milk?',
    expected: {hasEvent: false},
    description: 'Simple request, not an event',
  },
  {
    input: 'Thanks for the update!',
    expected: {hasEvent: false},
    description: 'Acknowledgment, not an event',
  },
  {
    input: 'How are you doing?',
    expected: {hasEvent: false},
    description: 'Question, not an event',
  },
  {
    input: 'I went to the store yesterday',
    expected: {hasEvent: false},
    description: 'Past event, should not extract',
  },
  {
    input: 'What time is it?',
    expected: {hasEvent: false},
    description: 'Time question, not an event',
  },

  // Edge cases
  {
    input: 'Meeting sometime next week',
    expected: {hasEvent: false}, // Too vague, low confidence
    description: 'Vague date - should have low confidence',
  },
  {
    input: 'Remind me to call John',
    expected: {hasEvent: false}, // Task, not calendar event
    description: 'Reminder/task, not a scheduled event',
  },
  {
    input: 'Practice moved to Thursday at 4pm',
    expected: {hasEvent: true, hasTime: true, hasDate: true},
    description: 'Schedule change notification',
  },
  {
    input: 'No school tomorrow',
    expected: {hasEvent: true, hasDate: true},
    description: 'Cancellation/all-day event',
  },
  {
    input: 'Game at 3pm (location TBD)',
    expected: {hasEvent: true, hasTime: true},
    description: 'Event with uncertain location',
  },
  {
    input: 'Concert Friday night at 7:30 PM at City Hall',
    expected: {hasEvent: true, hasTime: true, hasDate: true, hasLocation: true},
    description: 'Event with all details',
  },
];
