import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';
import { CalendarEvent } from './calendar';
import { Decision } from './decisions';
import { Priority } from './priority';
import { RSVP } from './rsvp';
import { Deadline } from './deadlines';

/**
 * Save AI extraction results to Firestore aiExtraction subcollection
 * This is needed for the proactive assistant to query using collectionGroup
 */
export async function saveAIExtractionToSubcollection(
  chatId: string,
  messageId: string,
  senderId: string,
  calendarEvents: CalendarEvent[],
  decisions: Decision[],
  priority: Priority | null,
  rsvp: RSVP | null,
  deadlines: Deadline[]
): Promise<void> {
  try {
    const aiExtractionRef = collection(firestore, 'chats', chatId, 'messages', messageId, 'aiExtraction');
    const timestamp = Date.now();

    // Save calendar events
    if (calendarEvents.length > 0) {
      for (const event of calendarEvents) {
        await setDoc(doc(aiExtractionRef, `calendar-${timestamp}-${Math.random().toString(36).slice(2)}`), {
          type: 'calendar',
          userId: senderId,
          data: event,
          timestamp,
          messageId,
          chatId,
          createdAt: serverTimestamp(),
        });
      }
    }

    // Save decisions
    if (decisions.length > 0) {
      for (const decision of decisions) {
        await setDoc(doc(aiExtractionRef, `decision-${timestamp}-${Math.random().toString(36).slice(2)}`), {
          type: 'decision',
          userId: senderId,
          data: decision,
          timestamp,
          messageId,
          chatId,
          createdAt: serverTimestamp(),
        });
      }
    }

    // Save deadlines
    if (deadlines.length > 0) {
      for (const deadline of deadlines) {
        await setDoc(doc(aiExtractionRef, `deadline-${timestamp}-${Math.random().toString(36).slice(2)}`), {
          type: 'deadline',
          userId: senderId,
          data: deadline,
          timestamp,
          messageId,
          chatId,
          completed: deadline.completed || false,
          createdAt: serverTimestamp(),
        });
      }
    }

    // Save RSVP
    if (rsvp && (rsvp.isInvitation || rsvp.isResponse)) {
      await setDoc(doc(aiExtractionRef, `rsvp-${timestamp}`), {
        type: 'rsvp',
        userId: senderId,
        data: rsvp,
        timestamp,
        messageId,
        chatId,
        createdAt: serverTimestamp(),
      });
    }

    // Save priority
    if (priority && priority.level !== 'normal') {
      await setDoc(doc(aiExtractionRef, `priority-${timestamp}`), {
        type: 'priority',
        userId: senderId,
        data: priority,
        timestamp,
        messageId,
        chatId,
        createdAt: serverTimestamp(),
      });
    }

    console.log('[AI] 💾 Saved AI extraction to subcollection for proactive assistant');
  } catch (error) {
    console.error('[AI] ❌ Failed to save AI extraction to subcollection:', error);
    // Don't throw - this is not critical for message sending
  }
}
