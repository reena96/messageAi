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
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { firestore } from '../firebase/config';
import { Message } from '@/types/message';
import { performanceMonitor } from '@/lib/utils/performance';
import { extractCalendarEvents } from '@/lib/ai/calendar';
import { extractDecisions } from '@/lib/ai/decisions';
import { detectPriority } from '@/lib/ai/priority';

interface MessageState {
  messages: { [chatId: string]: Message[] }; // Keyed by chatId
  loading: boolean;
  error: string | null;
  sendingMessages: Set<string>; // Track tempIds of messages being sent
  retryQueue: Set<string>; // Track tempIds of messages to retry
  hasMoreMessages: { [chatId: string]: boolean }; // Track if more messages available
  loadingOlder: { [chatId: string]: boolean }; // Track if loading older messages
  oldestMessageDoc: { [chatId: string]: QueryDocumentSnapshot | null }; // Track oldest message for pagination

  // Actions
  subscribeToMessages: (chatId: string) => Unsubscribe;
  loadOlderMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, senderId: string, text: string) => Promise<void>;
  retryMessage: (chatId: string, messageId: string) => Promise<void>;
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
  retryQueue: new Set(),
  hasMoreMessages: {},
  loadingOlder: {},
  oldestMessageDoc: {},

  // Subscribe to real-time messages for a chat (last 50 messages)
  subscribeToMessages: (chatId) => {
    try {
      set({ loading: true, error: null });

      const messagesRef = collection(firestore, 'chats', chatId, 'messages');
      // Query last 50 messages in descending order (newest first)
      const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));

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
              aiExtraction: data.aiExtraction ? {
                calendarEvents: data.aiExtraction.calendarEvents || undefined,
                decisions: data.aiExtraction.decisions || undefined,
                priority: data.aiExtraction.priority || undefined,
                extractedAt: data.aiExtraction.extractedAt?.toDate(),
              } : undefined,
            };
          }).reverse(); // Reverse to get chronological order (oldest first)

          set((state) => {
            // Get current messages including optimistic ones
            const currentMessages = state.messages[chatId] || [];

            // Get all optimistic messages (those with tempId)
            const allOptimisticMessages = currentMessages.filter((msg) => msg.tempId);

            // Keep optimistic messages that are:
            // 1. Still being sent (in sendingMessages set), OR
            // 2. Failed (to show error state with retry button)
            // Successful messages are removed immediately after send (lines 237-254)
            const optimisticMessages = allOptimisticMessages.filter((optMsg) => {
              return (
                state.sendingMessages.has(optMsg.tempId!) ||
                optMsg.status === 'failed'
              );
            });

            // Merge: Firestore messages + optimistic messages that should be kept
            const mergedMessages = [...firestoreMessages, ...optimisticMessages];

            // Track oldest message document for pagination
            const oldestDoc = snapshot.docs[snapshot.docs.length - 1] || null;
            const hasMore = snapshot.docs.length === 50; // If we got 50, there might be more

            return {
              messages: {
                ...state.messages,
                [chatId]: mergedMessages,
              },
              oldestMessageDoc: {
                ...state.oldestMessageDoc,
                [chatId]: oldestDoc,
              },
              hasMoreMessages: {
                ...state.hasMoreMessages,
                [chatId]: hasMore,
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

  // Load older messages (pagination)
  loadOlderMessages: async (chatId) => {
    const state = get();

    // Don't load if already loading or no more messages
    if (state.loadingOlder[chatId] || !state.hasMoreMessages[chatId]) {
      console.log('📜 [MessageStore] Skip loading older - already loading or no more messages');
      return;
    }

    const oldestDoc = state.oldestMessageDoc[chatId];
    if (!oldestDoc) {
      console.log('📜 [MessageStore] No oldest doc found');
      return;
    }

    try {
      console.log('📜 [MessageStore] Loading older messages for chat:', chatId);

      set((state) => ({
        loadingOlder: { ...state.loadingOlder, [chatId]: true },
      }));

      const messagesRef = collection(firestore, 'chats', chatId, 'messages');
      const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        startAfter(oldestDoc),
        limit(50)
      );

      const snapshot = await getDocs(q);

      const olderMessages: Message[] = snapshot.docs.map((doc) => {
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
          aiExtraction: data.aiExtraction ? {
            calendarEvents: data.aiExtraction.calendarEvents || undefined,
            decisions: data.aiExtraction.decisions || undefined,
            priority: data.aiExtraction.priority || undefined,
            extractedAt: data.aiExtraction.extractedAt?.toDate(),
          } : undefined,
        };
      }).reverse(); // Reverse to chronological order

      console.log('📜 [MessageStore] Loaded', olderMessages.length, 'older messages');

      set((state) => {
        const currentMessages = state.messages[chatId] || [];
        const newOldestDoc = snapshot.docs[snapshot.docs.length - 1] || null;
        const hasMore = snapshot.docs.length === 50;

        return {
          messages: {
            ...state.messages,
            [chatId]: [...olderMessages, ...currentMessages], // Prepend older messages
          },
          oldestMessageDoc: {
            ...state.oldestMessageDoc,
            [chatId]: newOldestDoc,
          },
          hasMoreMessages: {
            ...state.hasMoreMessages,
            [chatId]: hasMore,
          },
          loadingOlder: {
            ...state.loadingOlder,
            [chatId]: false,
          },
        };
      });
    } catch (error: any) {
      console.error('Error loading older messages:', error);
      set((state) => ({
        loadingOlder: { ...state.loadingOlder, [chatId]: false },
      }));
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

    // 1. Add optimistic message immediately (instant UI feedback)
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), optimisticMessage],
      },
      sendingMessages: new Set([...state.sendingMessages, tempId]),
    }));

    try {
      // 2. Check network before sending to Firestore
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected) {
        // Update optimistic message to failed status
        set((state) => {
          const chatMessages = state.messages[chatId] || [];
          const updatedMessages = chatMessages.map((m) =>
            m.tempId === tempId
              ? { ...m, status: 'failed' as const, error: 'No internet connection' }
              : m
          );

          const newSendingMessages = new Set(state.sendingMessages);
          newSendingMessages.delete(tempId);

          return {
            messages: { ...state.messages, [chatId]: updatedMessages },
            sendingMessages: newSendingMessages,
            retryQueue: new Set([...state.retryQueue, tempId]),
          };
        });

        throw new Error('No internet connection. Message will be sent when online.');
      }

      // 3. Write to Firestore messages subcollection
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

      const docRef = await addDoc(messagesRef, messageData);
      const messageId = docRef.id;

      // 3.5. Trigger AI multi-feature extraction (fire-and-forget, non-blocking)
      // Run calendar, decision, and priority extraction in parallel
      // This runs in the background and doesn't block the message send flow
      console.log('[AI] 🚀 Starting multi-feature extraction for message:', messageId);
      Promise.all([
        extractCalendarEvents(text),
        extractDecisions(text),
        detectPriority(text),
      ])
        .then(([calendarEvents, decisions, priority]) => {
          console.log('[AI] ✅ Multi-feature extraction completed');
          console.log(`[AI] 📅 Calendar events: ${calendarEvents.length}`);
          console.log(`[AI] ✅ Decisions: ${decisions.length}`);
          console.log(`[AI] 🎯 Priority: ${priority?.level || 'none'}`);

          // Build AI extraction object with all features
          const aiExtraction: any = {
            extractedAt: serverTimestamp(),
          };

          if (calendarEvents.length > 0) {
            aiExtraction.calendarEvents = calendarEvents;
            console.log(`[AI] 📅 Extracted ${calendarEvents.length} calendar event(s)`);
          }

          if (decisions.length > 0) {
            aiExtraction.decisions = decisions;
            console.log(`[AI] ✅ Extracted ${decisions.length} decision(s)`);
          }

          if (priority) {
            aiExtraction.priority = priority;
            console.log(`[AI] 🎯 Priority: ${priority.level} (urgency: ${priority.urgency})`);
          }

          // Only update if we have at least one extraction result
          if (calendarEvents.length > 0 || decisions.length > 0 || priority) {
            console.log(`[AI] 💾 Updating message ${messageId} with AI extraction data`);
            const messageRef = doc(firestore, 'chats', chatId, 'messages', messageId);
            return updateDoc(messageRef, { aiExtraction });
          } else {
            console.log('[AI] ℹ️ No AI features extracted from message');
          }
        })
        .catch((err) => {
          // Log error but don't fail the message send
          console.error('[AI] ❌ Multi-feature extraction failed (non-critical):', err);
          console.error('[AI] Error details:', err.message, err.stack);
        });

      // 4. Update chat's lastMessage and increment unread count for other participants
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

      // 5. Remove optimistic message and clear from sendingMessages
      // (Firestore onSnapshot will add the real message with proper ID)
      set((state) => {
        const newSendingMessages = new Set(state.sendingMessages);
        newSendingMessages.delete(tempId);

        // Remove the optimistic message from state
        const chatMessages = state.messages[chatId] || [];
        const updatedMessages = chatMessages.filter((m) => m.tempId !== tempId);

        return {
          messages: {
            ...state.messages,
            [chatId]: updatedMessages,
          },
          sendingMessages: newSendingMessages,
        };
      });

      // 6. Measure performance (RUBRIC REQUIREMENT: <200ms)
      performanceMonitor.measure('Message Send Time', performanceMark);
    } catch (error: any) {
      console.error('Error sending message:', error);

      // Better error categorization (case-insensitive)
      const errorMessage = (error.message || '').toLowerCase();
      const isNetworkError =
        error.code === 'unavailable' ||
        errorMessage.includes('network') ||
        errorMessage.includes('internet') ||
        errorMessage.includes('offline');

      // Mark optimistic message as failed
      set((state) => {
        const chatMessages = state.messages[chatId] || [];
        const updatedMessages = chatMessages.map((m) =>
          m.tempId === tempId
            ? {
                ...m,
                status: 'failed' as const,
                error: isNetworkError
                  ? 'No internet connection'
                  : 'Failed to send message',
              }
            : m
        );

        const newSendingMessages = new Set(state.sendingMessages);
        newSendingMessages.delete(tempId);

        const newRetryQueue = new Set(state.retryQueue);
        if (isNetworkError) {
          newRetryQueue.add(tempId);
        }

        return {
          messages: {
            ...state.messages,
            [chatId]: updatedMessages,
          },
          sendingMessages: newSendingMessages,
          retryQueue: newRetryQueue,
          error: error.message,
        };
      });

      throw error;
    }
  },

  // Retry failed message
  retryMessage: async (chatId, messageId) => {
    console.log('🔄 [MessageStore] Retry initiated for message:', messageId, 'in chat:', chatId);

    const state = get();
    const chatMessages = state.messages[chatId] || [];
    const failedMessage = chatMessages.find((m) => m.id === messageId || m.tempId === messageId);

    if (!failedMessage) {
      console.error('❌ [MessageStore] Message not found:', messageId);
      throw new Error('Message not found');
    }

    console.log('🔄 [MessageStore] Found failed message:', {
      text: failedMessage.text.substring(0, 20),
      status: failedMessage.status,
      error: failedMessage.error,
    });

    // Remove from retry queue first
    const newRetryQueue = new Set(state.retryQueue);
    newRetryQueue.delete(messageId);
    set({ retryQueue: newRetryQueue });
    console.log('🔄 [MessageStore] Removed from retry queue. Queue size:', newRetryQueue.size);

    // Update existing failed message to "sending" status (don't create new message)
    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      const updatedMessages = chatMessages.map((m) =>
        (m.id === messageId || m.tempId === messageId)
          ? { ...m, status: 'sending' as const, error: undefined }
          : m
      );

      return {
        messages: { ...state.messages, [chatId]: updatedMessages },
        sendingMessages: new Set([...state.sendingMessages, messageId]),
      };
    });
    console.log('🔄 [MessageStore] Updated message status to "sending"');

    // Now try to send to Firestore
    try {
      // Check network
      console.log('🔄 [MessageStore] Checking network status...');
      const netInfo = await NetInfo.fetch();
      console.log('📶 [MessageStore] Network status:', {
        isConnected: netInfo.isConnected,
        isInternetReachable: netInfo.isInternetReachable,
        type: netInfo.type,
      });

      if (!netInfo.isConnected) {
        console.log('❌ [MessageStore] Still offline, marking as failed again');
        // Still offline, mark as failed again
        set((state) => {
          const chatMessages = state.messages[chatId] || [];
          const updatedMessages = chatMessages.map((m) =>
            (m.id === messageId || m.tempId === messageId)
              ? { ...m, status: 'failed' as const, error: 'No internet connection' }
              : m
          );

          const newSendingMessages = new Set(state.sendingMessages);
          newSendingMessages.delete(messageId);

          return {
            messages: { ...state.messages, [chatId]: updatedMessages },
            sendingMessages: newSendingMessages,
            retryQueue: new Set([...state.retryQueue, messageId]),
          };
        });

        throw new Error('Still offline');
      }

      // Send to Firestore
      const messagesRef = collection(firestore, 'chats', chatId, 'messages');
      const messageData = {
        chatId,
        senderId: failedMessage.senderId,
        text: failedMessage.text,
        timestamp: serverTimestamp(),
        status: 'sent',
        readBy: [failedMessage.senderId],
        type: failedMessage.type || 'text',
      };

      await addDoc(messagesRef, messageData);

      // Update chat's lastMessage
      const chatRef = doc(firestore, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      const chatData = chatDoc.data();
      const participants = chatData?.participants || [];
      const activeViewers = chatData?.activeViewers || {};

      const updates: any = {
        lastMessage: {
          text: failedMessage.text,
          senderId: failedMessage.senderId,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      };

      const now = Date.now();
      participants.forEach((participantId: string) => {
        if (participantId !== failedMessage.senderId) {
          const viewerTimestamp = activeViewers[participantId];
          const isActivelyViewing = viewerTimestamp &&
            (now - (viewerTimestamp.toMillis ? viewerTimestamp.toMillis() : viewerTimestamp) < 5000);

          if (!isActivelyViewing) {
            updates[`unreadCount.${participantId}`] = increment(1);
          }
        }
      });

      await updateDoc(chatRef, updates);

      // Remove optimistic message and clear from sendingMessages
      // (Firestore onSnapshot will add the real message)
      set((state) => {
        const newSendingMessages = new Set(state.sendingMessages);
        newSendingMessages.delete(messageId);

        // Remove the optimistic/failed message from state
        const chatMessages = state.messages[chatId] || [];
        const updatedMessages = chatMessages.filter(
          (m) => m.id !== messageId && m.tempId !== messageId
        );

        return {
          messages: {
            ...state.messages,
            [chatId]: updatedMessages,
          },
          sendingMessages: newSendingMessages,
        };
      });
    } catch (error: any) {
      console.error('Retry failed:', error);

      // Mark as failed again
      const errorMessage = (error.message || '').toLowerCase();
      const isNetworkError =
        error.code === 'unavailable' ||
        errorMessage.includes('network') ||
        errorMessage.includes('internet') ||
        errorMessage.includes('offline');

      set((state) => {
        const chatMessages = state.messages[chatId] || [];
        const updatedMessages = chatMessages.map((m) =>
          (m.id === messageId || m.tempId === messageId)
            ? {
                ...m,
                status: 'failed' as const,
                error: isNetworkError ? 'No internet connection' : 'Failed to send message',
              }
            : m
        );

        const newSendingMessages = new Set(state.sendingMessages);
        newSendingMessages.delete(messageId);

        const newRetryQueue = new Set(state.retryQueue);
        if (isNetworkError) {
          newRetryQueue.add(messageId);
        }

        return {
          messages: { ...state.messages, [chatId]: updatedMessages },
          sendingMessages: newSendingMessages,
          retryQueue: newRetryQueue,
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
