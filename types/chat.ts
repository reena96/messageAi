import { User } from './user';

export interface Chat {
  id: string;
  type: 'one-on-one' | 'group';
  participants: string[]; // user IDs
  participantDetails: {
    [userId: string]: {
      displayName: string;
      photoURL?: string;
    };
  };
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Date;
  };
  unreadCount: {
    [userId: string]: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  groupName?: string; // optional, for groups
  groupPhoto?: string; // optional, for groups
}
