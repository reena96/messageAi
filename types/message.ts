import { CalendarEvent } from '@/lib/ai/calendar';
import { Decision } from '@/lib/ai/decisions';
import { Priority } from '@/lib/ai/priority';
import { RSVP } from '@/lib/ai/rsvp';
import { Deadline } from '@/lib/ai/deadlines';

export type OptimisticStatus = 'pending' | 'confirmed' | 'failed';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  readBy: string[]; // Array of user IDs who read this message

  // Optimistic UI support
  tempId?: string; // Temporary ID before Firestore confirms (legacy field)
  clientGeneratedId?: string; // Stable optimistic identifier for reconciliation
  optimisticStatus?: OptimisticStatus;
  optimisticEnqueuedAt?: number;
  optimisticSettledAt?: number;
  retryCount?: number;

  // Error handling
  error?: string; // Error message for failed messages
  errorCode?: string;

  // Optional features
  imageUrl?: string;
  type?: 'text' | 'image';

  // Edit/Delete tracking
  editedAt?: Date;
  deletedAt?: Date;
  deletedBy?: string;
  hiddenFor?: string[]; // Array of user IDs who have hidden this message

  // AI extraction
  aiExtraction?: {
    calendarEvents?: CalendarEvent[];
    decisions?: Decision[];
    priority?: Priority;
    rsvp?: RSVP;
    deadlines?: Deadline[];
    relatedItems?: {
      rsvpLinkedToEvent?: string;
      [key: string]: any;
    };
    extractedAt?: Date;
  };
}
