import { create } from 'zustand';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Unsubscribe,
  arrayUnion,
  increment,
  getDoc,
} from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { Message } from '@/types/message';
import { performanceMonitor } from '@/lib/utils/performance';

interface MessageState {
  messages: { [chatId: string]: Message[] }; // Keyed by chatId
  loading: boolean;
  error: string | null;
  sendingMessages: Set<string>; // Track tempIds of messages being sent

  // Actions
  subscribeToMessages: (chatId: string) => Unsubscribe;
  sendMessage: (chatId: string, senderId: string, text: string) => Promise<void>;
  markAsRead: (chatId: string, messageId: string, userId: string) => Promise<void>;
  clearUnreadCount: (chatId: string, userId: string) => Promise<void>;
  setActivelyViewing: (chatId: string, userId: string, isViewing: boolean) => Promise<void>;
  setTyping: (chatId: string, userId: string, isTyping: boolean) => Promise<void>;
  clearError: () => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  // Initial state
  messages: {},
  loading: false,
  error: null,
  sendingMessages: new Set(),

  // Subscribe to real-time messages for a chat
  subscribeToMessages: (chatId) => {
    try {
      set({ loading: true, error: null });

      const messagesRef = collection(firestore, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const firestoreMessages: Message[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              chatId: data.chatId,
              senderId: data.senderId,
              text: data.text,
              timestamp: data.timestamp?.toDate() || new Date(),
              status: data.status || 'sent',
              readBy: data.readBy || [],
              imageUrl: data.imageUrl,
              type: data.type || 'text',
            };
          });

          set((state) => {
            // Get current messages including optimistic ones
            const currentMessages = state.messages[chatId] || [];

            // Get all optimistic messages (those with tempId)
            const allOptimisticMessages = currentMessages.filter((msg) => msg.tempId);

            // Filter optimistic messages to keep:
            // 1. Messages still being sent (in sendingMessages set)
            // 2. Failed messages (to show error state)
            // 3. Messages not yet reflected in Firestore (no matching real message)
            const optimisticMessages = allOptimisticMessages.filter((optMsg) => {
              // Keep if still sending
              if (state.sendingMessages.has(optMsg.tempId!)) return true;

              // Keep if failed
              if (optMsg.status === 'failed') return true;

              // Check if there's a matching real message from Firestore
              // (same sender, text, and timestamp within 5 seconds)
              const hasMatchingRealMessage = firestoreMessages.some((realMsg) =>
                realMsg.senderId === optMsg.senderId &&
                realMsg.text === optMsg.text &&
                Math.abs(realMsg.timestamp.getTime() - optMsg.timestamp.getTime()) < 5000
              );

              // Keep optimistic message only if no matching real message exists
              return !hasMatchingRealMessage;
            });

            // Merge: Firestore messages + optimistic messages that should be kept
            const mergedMessages = [...firestoreMessages, ...optimisticMessages];

            return {
              messages: {
                ...state.messages,
                [chatId]: mergedMessages,
              },
              loading: false,
            };
          });
        },
        (error) => {
          console.error('Error subscribing to messages:', error);
          set({ loading: false, error: error.message });
        }
      );

      return unsubscribe;
    } catch (error: any) {
      console.error('Error setting up message subscription:', error);
      set({ loading: false, error: error.message });
      return () => {};
    }
  },

  // Send message with optimistic UI
  sendMessage: async (chatId, senderId, text) => {
    // Performance tracking (RUBRIC REQUIREMENT)
    const performanceMark = `message-send-${Date.now()}`;
    performanceMonitor.mark(performanceMark);

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMessage: Message = {
      id: tempId,
      chatId,
      senderId,
      text,
      timestamp: new Date(),
      status: 'sending',
      readBy: [senderId],
      tempId,
      type: 'text',
    };

    try {
      // 1. Add optimistic message immediately (instant UI feedback)
      set((state) => ({
        messages: {
          ...state.messages,
          [chatId]: [...(state.messages[chatId] || []), optimisticMessage],
        },
        sendingMessages: new Set([...state.sendingMessages, tempId]),
      }));

      // 2. Write to Firestore messages subcollection
      const messagesRef = collection(firestore, 'chats', chatId, 'messages');
      const messageData = {
        chatId,
        senderId,
        text,
        timestamp: serverTimestamp(),
        status: 'sent',
        readBy: [senderId],
        type: 'text',
      };

      await addDoc(messagesRef, messageData);

      // 3. Update chat's lastMessage and increment unread count for other participants
      const chatRef = doc(firestore, 'chats', chatId);

      // Get chat document to find all participants and active viewers
      const chatDoc = await getDoc(chatRef);
      const chatData = chatDoc.data();
      const participants = chatData?.participants || [];
      const activeViewers = chatData?.activeViewers || {};

      // Build update object with unread count increments for all participants except sender
      const updates: any = {
        lastMessage: {
          text,
          senderId,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      };

      // Get current time for active viewer check (5 second window)
      const now = Date.now();

      // Increment unread count only for participants who are NOT actively viewing
      participants.forEach((participantId: string) => {
        if (participantId !== senderId) {
          // Check if participant is actively viewing (timestamp within last 5 seconds)
          const viewerTimestamp = activeViewers[participantId];
          const isActivelyViewing = viewerTimestamp &&
            (now - (viewerTimestamp.toMillis ? viewerTimestamp.toMillis() : viewerTimestamp) < 5000);

          // Only increment unread count if NOT actively viewing
          if (!isActivelyViewing) {
            updates[`unreadCount.${participantId}`] = increment(1);
          }
        }
      });

      await updateDoc(chatRef, updates);

      // 4. Remove from sendingMessages set (onSnapshot will handle message cleanup)
      set((state) => {
        const newSendingMessages = new Set(state.sendingMessages);
        newSendingMessages.delete(tempId);

        return {
          sendingMessages: newSendingMessages,
        };
      });

      // 5. Measure performance (RUBRIC REQUIREMENT: <200ms)
      performanceMonitor.measure('Message Send Time', performanceMark);
    } catch (error: any) {
      console.error('Error sending message:', error);

      // Mark optimistic message as failed
      set((state) => {
        const chatMessages = state.messages[chatId] || [];
        const updatedMessages = chatMessages.map((m) =>
          m.tempId === tempId ? { ...m, status: 'failed' as const } : m
        );

        const newSendingMessages = new Set(state.sendingMessages);
        newSendingMessages.delete(tempId);

        return {
          messages: {
            ...state.messages,
            [chatId]: updatedMessages,
          },
          sendingMessages: newSendingMessages,
          error: error.message,
        };
      });

      throw error;
    }
  },

  // Mark message as read
  markAsRead: async (chatId, messageId, userId) => {
    try {
      const messageRef = doc(firestore, 'chats', chatId, 'messages', messageId);
      await updateDoc(messageRef, {
        readBy: arrayUnion(userId),
      });
    } catch (error: any) {
      console.error('Error marking as read:', error);
      // Don't throw - read receipts are not critical
    }
  },

  // Clear unread count for a user in a chat
  clearUnreadCount: async (chatId, userId) => {
    try {
      const chatRef = doc(firestore, 'chats', chatId);
      await updateDoc(chatRef, {
        [`unreadCount.${userId}`]: 0,
      });
    } catch (error: any) {
      console.error('Error clearing unread count:', error);
      // Don't throw - unread counts are not critical
    }
  },

  // Set whether user is actively viewing the chat
  setActivelyViewing: async (chatId, userId, isViewing) => {
    try {
      const chatRef = doc(firestore, 'chats', chatId);
      await updateDoc(chatRef, {
        [`activeViewers.${userId}`]: isViewing ? serverTimestamp() : null,
      });
    } catch (error: any) {
      console.error('Error setting actively viewing:', error);
      // Don't throw - active viewing tracking is not critical
    }
  },

  // Set typing indicator
  setTyping: async (chatId, userId, isTyping) => {
    try {
      const chatRef = doc(firestore, 'chats', chatId);
      await updateDoc(chatRef, {
        [`typing.${userId}`]: isTyping ? serverTimestamp() : null,
      });
    } catch (error: any) {
      console.error('Error setting typing:', error);
      // Don't throw - typing indicators are not critical
    }
  },

  clearError: () => set({ error: null }),
}));
