import { Message } from './message';

export type MessageRow =
  | {
      type: 'day-header';
      id: string;
      dateKey: string;
      label: string;
    }
  | {
      type: 'unread-separator';
      id: string;
      unreadCount: number;
      label?: string;
    }
  | {
      type: 'summary';
      id: string;
      summary: string | null;
      status: 'idle' | 'loading' | 'ready' | 'error';
      collapsed: boolean;
      error?: string;
    }
  | {
      type: 'message';
      id: string;
      message: Message;
      isGroupTop: boolean;
      isGroupBottom: boolean;
      isOptimistic: boolean;
    };

export interface MessageListViewModel {
  rows: MessageRow[];
  messages: Message[];
  unreadCount: number;
  firstUnreadMessageId: string | null;
  firstUnreadIndex: number | null;
}
