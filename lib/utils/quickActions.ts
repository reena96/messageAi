import { Linking, Platform, Alert } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';
import { CalendarEvent } from '@/lib/ai/calendar';
import { Deadline } from '@/lib/ai/deadlines';

/**
 * Quick Actions Utility Module
 * Handles one-tap actions for AI insights (Add to Calendar, Mark Done, RSVP)
 */

/**
 * Add calendar event to device calendar
 * Opens native calendar app with pre-filled event details
 */
export async function addToCalendar(event: CalendarEvent): Promise<void> {
  try {
    console.log('[QuickActions] 📅 Adding to calendar:', event.event);

    // Parse date
    const [year, month, day] = event.date.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day);

    // Parse time if available
    let startTime = '09:00'; // Default to 9 AM
    if (event.time) {
      // Convert "3:00 PM" or "14:00" to 24-hour format
      const timeMatch = event.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2];
        const period = timeMatch[3]?.toUpperCase();

        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        startTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
      }
    }

    // Format date for URL (YYYYMMDD)
    const dateStr = event.date.replace(/-/g, '');

    // Build calendar URL
    let calendarUrl: string;

    if (Platform.OS === 'ios') {
      // iOS calendar URL scheme
      // Format: calshow:[unix_timestamp]
      const timestamp = Math.floor(eventDate.getTime() / 1000);
      calendarUrl = `calshow:${timestamp}`;
    } else {
      // Android calendar intent
      // Format: content://com.android.calendar/time/[milliseconds]
      const timestamp = eventDate.getTime();
      calendarUrl = `content://com.android.calendar/time/${timestamp}`;
    }

    // Check if calendar can be opened
    const canOpen = await Linking.canOpenURL(calendarUrl);

    if (canOpen) {
      await Linking.openURL(calendarUrl);
      console.log('[QuickActions] ✅ Calendar opened successfully');
    } else {
      // Fallback: Show alert with event details
      Alert.alert(
        'Add to Calendar',
        `Event: ${event.event}\nDate: ${event.date}\nTime: ${event.time || 'Not specified'}`,
        [
          { text: 'OK', style: 'default' }
        ]
      );
      console.log('[QuickActions] ⚠️ Calendar app not available, showed alert');
    }
  } catch (error) {
    console.error('[QuickActions] ❌ Failed to add to calendar:', error);
    Alert.alert(
      'Error',
      'Could not open calendar app. Please add the event manually.',
      [{ text: 'OK', style: 'default' }]
    );
  }
}

/**
 * Mark deadline as complete
 * Updates Firestore to set deadline.completed = true
 */
export async function markDeadlineComplete(
  chatId: string,
  messageId: string,
  deadlineIndex: number
): Promise<void> {
  try {
    console.log('[QuickActions] ✅ Marking deadline complete:', { chatId, messageId, deadlineIndex });

    const messageRef = doc(firestore, 'chats', chatId, 'messages', messageId);

    // We need to read the message first, update the specific deadline, then write back
    // For now, we'll use a simple approach - mark all deadlines as complete
    // TODO: Implement array element update for specific deadline
    await updateDoc(messageRef, {
      [`aiExtraction.deadlines.${deadlineIndex}.completed`]: true,
    });

    console.log('[QuickActions] ✅ Deadline marked complete in Firestore');
  } catch (error) {
    console.error('[QuickActions] ❌ Failed to mark deadline complete:', error);
    Alert.alert(
      'Error',
      'Could not mark deadline as complete. Please try again.',
      [{ text: 'OK', style: 'default' }]
    );
  }
}

/**
 * Send RSVP response
 * Sends a message with the RSVP response to the chat
 */
export async function sendRSVPResponse(
  response: 'yes' | 'no' | 'maybe',
  chatId: string,
  senderId: string,
  sendMessageFn: (chatId: string, senderId: string, text: string) => Promise<void>
): Promise<void> {
  try {
    console.log('[QuickActions] 🎫 Sending RSVP response:', response);

    // Generate response message
    let responseText: string;
    switch (response) {
      case 'yes':
        responseText = "I'll be there!";
        break;
      case 'no':
        responseText = "Sorry, can't make it";
        break;
      case 'maybe':
        responseText = "I might be able to come";
        break;
    }

    // Send the message using the provided function
    await sendMessageFn(chatId, senderId, responseText);

    console.log('[QuickActions] ✅ RSVP response sent');
  } catch (error) {
    console.error('[QuickActions] ❌ Failed to send RSVP response:', error);
    Alert.alert(
      'Error',
      'Could not send RSVP response. Please try again.',
      [{ text: 'OK', style: 'default' }]
    );
  }
}

/**
 * Format deadline due date for display with countdown
 */
export function formatDeadlineDate(dueDate: string, dueTime?: string): string {
  try {
    const [year, month, day] = dueDate.split('-').map(Number);
    const deadline = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(year, month - 1, day);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let dateStr: string;
    if (diffDays === 0) {
      dateStr = 'Today';
    } else if (diffDays === 1) {
      dateStr = 'Tomorrow';
    } else if (diffDays === -1) {
      dateStr = 'Yesterday (Overdue)';
    } else if (diffDays < 0) {
      dateStr = `${Math.abs(diffDays)} days ago (Overdue)`;
    } else if (diffDays <= 7) {
      dateStr = `In ${diffDays} days`;
    } else {
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
      };
      dateStr = deadline.toLocaleDateString('en-US', options);
    }

    if (dueTime) {
      return `${dateStr} at ${dueTime}`;
    }

    return dateStr;
  } catch (error) {
    return dueDate;
  }
}

/**
 * Check if deadline is overdue
 */
export function isDeadlineOverdue(dueDate: string): boolean {
  try {
    const [year, month, day] = dueDate.split('-').map(Number);
    const deadline = new Date(year, month - 1, day);
    deadline.setHours(23, 59, 59, 999); // End of day

    const now = new Date();

    return now > deadline;
  } catch (error) {
    return false;
  }
}

/**
 * Get priority color for deadline badge
 */
export function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return '#FF3B30'; // Red
    case 'medium':
      return '#FF9500'; // Orange
    case 'low':
      return '#34C759'; // Green
    default:
      return '#8E8E93'; // Gray
  }
}
