import { CalendarEvent } from '@/lib/ai/calendar';
import { Decision } from '@/lib/ai/decisions';
import { Priority } from '@/lib/ai/priority';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  readBy: string[]; // Array of user IDs who read this message

  // Optimistic UI support
  tempId?: string; // Temporary ID before Firestore confirms

  // Error handling
  error?: string; // Error message for failed messages

  // Optional features
  imageUrl?: string;
  type?: 'text' | 'image';

  // AI extraction
  aiExtraction?: {
    calendarEvents?: CalendarEvent[];
    decisions?: Decision[];
    priority?: Priority;
    extractedAt?: Date;
  };
}
