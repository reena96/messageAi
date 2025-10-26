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
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { Chat } from '@/types/chat';
import { debugLog, errorLog, chatStoreSnapshotLog } from '@/lib/utils/debug';

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
  addParticipant: (chatId: string, email: string) => Promise<void>;
  removeParticipant: (chatId: string, userId: string) => Promise<void>;
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
      debugLog('💬 [ChatStore] subscribeToChats called for userId:', userId);
      set({ loading: true, error: null });

      const chatsRef = collection(firestore, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc'),
        limit(100)
      );

      debugLog('💬 [ChatStore] Firestore query constructed:', {
        collection: 'chats',
        where: `participants array-contains ${userId}`,
        orderBy: 'updatedAt desc',
        limit: 100,
      });
      debugLog('💬 [ChatStore] Setting up Firestore listener');

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          chatStoreSnapshotLog('💬 [ChatStore] Snapshot received:', {
            size: snapshot.size,
            empty: snapshot.empty,
          });

          const chats: Chat[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            chatStoreSnapshotLog('💬 [ChatStore] Processing chat document:', {
              id: doc.id,
              type: data.type,
              participants: data.participants,
              hasLastMessage: !!data.lastMessage,
            });

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

          chatStoreSnapshotLog('💬 [ChatStore] Setting chats in store:', {
            count: chats.length,
            chatIds: chats.map(c => c.id),
          });
          set({ chats, loading: false });
        },
        (error) => {
          errorLog('🔴 [ChatStore] Snapshot error:', error.message, error.code);
          set({ loading: false, error: error.message });
        }
      );

      debugLog('💬 [ChatStore] Listener setup complete, returning unsubscribe function');
      return unsubscribe;
    } catch (error: any) {
      errorLog('🔴 [ChatStore] subscribeToChats error:', error.message);
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

  // Add participant to chat
  addParticipant: async (chatId: string, email: string) => {
    try {
      set({ loading: true, error: null });

      // Find user by email
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('No user found with this email address');
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Get chat document
      const chatRef = doc(firestore, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        throw new Error('Chat not found');
      }

      const chatData = chatSnap.data();

      // Check if user is already a participant
      if (chatData.participants.includes(userId)) {
        throw new Error('User is already a participant in this chat');
      }

      // Update chat document
      await updateDoc(chatRef, {
        participants: arrayUnion(userId),
        [`participantDetails.${userId}`]: {
          displayName: userData.displayName || userData.email,
          photoURL: userData.photoURL || null,
        },
        [`unreadCount.${userId}`]: 0,
        updatedAt: serverTimestamp(),
      });

      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Remove participant from chat
  removeParticipant: async (chatId: string, userId: string) => {
    try {
      set({ loading: true, error: null });

      const chatRef = doc(firestore, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        throw new Error('Chat not found');
      }

      const chatData = chatSnap.data();

      // Check if user is a participant
      if (!chatData.participants.includes(userId)) {
        throw new Error('User is not a participant in this chat');
      }

      // Update chat document
      await updateDoc(chatRef, {
        participants: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      });

      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
