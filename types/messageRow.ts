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
}
