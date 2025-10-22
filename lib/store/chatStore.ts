import { create } from 'zustand';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  getDocs,
  serverTimestamp,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { Chat } from '@/types/chat';

interface ChatState {
  chats: Chat[];
  loading: boolean;
  error: string | null;

  // Actions
  subscribeToChats: (userId: string) => Unsubscribe;
  createOneOnOneChat: (
    currentUserId: string,
    otherUserId: string,
    otherUserDetails: { displayName: string; photoURL?: string }
  ) => Promise<string>;
  createGroupChat: (
    currentUserId: string,
    participantIds: string[],
    groupName: string,
    currentUserDetails: { displayName: string; photoURL?: string },
    participantDetails: { [userId: string]: { displayName: string; photoURL?: string } }
  ) => Promise<string>;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  chats: [],
  loading: false,
  error: null,

  // Subscribe to chats
  subscribeToChats: (userId: string) => {
    try {
      set({ loading: true, error: null });

      const chatsRef = collection(firestore, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc'),
        limit(100)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const chats: Chat[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              type: data.type,
              participants: data.participants,
              participantDetails: data.participantDetails,
              lastMessage: data.lastMessage
                ? {
                    text: data.lastMessage.text,
                    senderId: data.lastMessage.senderId,
                    timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
                  }
                : undefined,
              unreadCount: data.unreadCount || {},
              createdBy: data.createdBy,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              groupName: data.groupName,
              groupPhoto: data.groupPhoto,
            };
          });

          set({ chats, loading: false });
        },
        (error) => {
          set({ loading: false, error: error.message });
        }
      );

      return unsubscribe;
    } catch (error: any) {
      set({ loading: false, error: error.message });
      return () => {};
    }
  },

  // Create one-on-one chat
  createOneOnOneChat: async (currentUserId, otherUserId, otherUserDetails) => {
    try {
      set({ loading: true, error: null });

      // Check if chat already exists
      const chatsRef = collection(firestore, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', currentUserId),
        where('type', '==', 'one-on-one')
      );

      const snapshot = await getDocs(q);
      const existingChat = snapshot.docs.find((doc) => {
        const data = doc.data();
        return (
          data.participants.includes(otherUserId) &&
          data.participants.length === 2
        );
      });

      if (existingChat) {
        set({ loading: false });
        return existingChat.id;
      }

      // Create new chat
      const chatData = {
        type: 'one-on-one',
        participants: [currentUserId, otherUserId],
        participantDetails: {
          [otherUserId]: otherUserDetails,
        },
        unreadCount: {
          [currentUserId]: 0,
          [otherUserId]: 0,
        },
        createdBy: currentUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(chatsRef, chatData);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Create group chat
  createGroupChat: async (
    currentUserId,
    participantIds,
    groupName,
    currentUserDetails,
    participantDetails
  ) => {
    try {
      set({ loading: true, error: null });

      // Combine current user + participant IDs
      const allParticipants = [currentUserId, ...participantIds];

      // Initialize unread count for all participants
      const unreadCount: { [userId: string]: number } = {};
      allParticipants.forEach((userId) => {
        unreadCount[userId] = 0;
      });

      // Combine participant details
      const allParticipantDetails = {
        [currentUserId]: currentUserDetails,
        ...participantDetails,
      };

      const chatsRef = collection(firestore, 'chats');
      const chatData = {
        type: 'group',
        participants: allParticipants,
        participantDetails: allParticipantDetails,
        unreadCount,
        groupName,
        createdBy: currentUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(chatsRef, chatData);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
