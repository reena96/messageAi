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
import { Message, OptimisticStatus } from '@/types/message';
import { performanceMonitor } from '@/lib/utils/performance';
import { extractCalendarEvents } from '@/lib/ai/calendar';
import { extractDecisions } from '@/lib/ai/decisions';
import { detectPriority } from '@/lib/ai/priority';
import { trackRSVP } from '@/lib/ai/rsvp';
import { extractDeadlines } from '@/lib/ai/deadlines';
import { saveAIExtractionToSubcollection } from '@/lib/ai/aiExtractionStore';

type MessageEntityMap = Record<string, Message>;
type MessageIdMap = Record<string, string[]>;
type OptimisticMetadataMap = Record<string, OptimisticEntry>;

export interface UnreadUIState {
  separatorVisible: boolean;
  floatingBadgeVisible: boolean;
  anchorMessageId: string | null;
  lastUnreadCount: number;
  separatorAcknowledged: boolean;
  separatorReady: boolean;
}

export const DEFAULT_UNREAD_UI_STATE: UnreadUIState = {
  separatorVisible: false,
  floatingBadgeVisible: false,
  anchorMessageId: null,
  lastUnreadCount: 0,
  separatorAcknowledged: false,
  separatorReady: false,
};

const isUnreadUIStateEqual = (a: UnreadUIState, b: UnreadUIState) =>
  a.separatorVisible === b.separatorVisible &&
  a.floatingBadgeVisible === b.floatingBadgeVisible &&
  a.anchorMessageId === b.anchorMessageId &&
  a.lastUnreadCount === b.lastUnreadCount &&
  a.separatorAcknowledged === b.separatorAcknowledged &&
  a.separatorReady === b.separatorReady;

const cloneUnreadUIState = (state?: UnreadUIState): UnreadUIState => ({
  separatorVisible: state?.separatorVisible ?? false,
  floatingBadgeVisible: state?.floatingBadgeVisible ?? false,
  anchorMessageId:
    state?.anchorMessageId === undefined ? null : state.anchorMessageId,
  lastUnreadCount: state?.lastUnreadCount ?? 0,
  separatorAcknowledged: state?.separatorAcknowledged ?? false,
  separatorReady: state?.separatorReady ?? false,
});

const mergeUnreadUIState = (
  prev: UnreadUIState,
  patch: Partial<UnreadUIState> | UnreadUIState
): UnreadUIState => ({
  separatorVisible:
    patch.separatorVisible !== undefined ? patch.separatorVisible : prev.separatorVisible,
  floatingBadgeVisible:
    patch.floatingBadgeVisible !== undefined
      ? patch.floatingBadgeVisible
      : prev.floatingBadgeVisible,
  anchorMessageId:
    patch.anchorMessageId !== undefined ? patch.anchorMessageId : prev.anchorMessageId,
  lastUnreadCount:
    typeof patch.lastUnreadCount === 'number' ? patch.lastUnreadCount : prev.lastUnreadCount,
  separatorAcknowledged:
    patch.separatorAcknowledged !== undefined
      ? patch.separatorAcknowledged
      : prev.separatorAcknowledged,
  separatorReady:
    patch.separatorReady !== undefined ? patch.separatorReady : prev.separatorReady,
});

interface OptimisticEntry {
  clientGeneratedId: string;
  chatId: string;
  status: OptimisticStatus;
  enqueuedAt: number;
  retryCount: number;
  errorCode?: string;
  settledAt?: number;
  serverId?: string;
}

const MAX_BATCH = 50;

const buildChatMessages = (ids: string[], entities: MessageEntityMap): Message[] => {
  return ids
    .map((id) => entities[id])
    .filter((msg): msg is Message => Boolean(msg));
};

const dedupeIds = (ids: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  ids.forEach((id) => {
    if (!id || seen.has(id)) {
      return;
    }
    seen.add(id);
    result.push(id);
  });
  return result;
};

const mergeLatestWindow = (
  state: MessageState,
  chatId: string,
  incoming: Message[]
) => {
  const messageEntities: MessageEntityMap = { ...state.messageEntities };
  const optimisticMetadata: OptimisticMetadataMap = {
    ...state.optimisticMetadata,
  };
  const optimisticIdMap: Record<string, string> = {
    ...state.optimisticIdMap,
  };
  const sendingMessages = new Set(state.sendingMessages);
  const retryQueue = new Set(state.retryQueue);
  const replacements = new Map<string, string>();

  incoming.forEach((rawMessage) => {
    const incomingMessage: Message = {
      ...rawMessage,
      clientGeneratedId: rawMessage.clientGeneratedId ?? rawMessage.tempId,
    };

    const clientId = incomingMessage.clientGeneratedId;
    if (clientId) {
      const currentId = optimisticIdMap[clientId] || clientId;
      const optimisticEntity =
        messageEntities[currentId] || messageEntities[clientId];
      const optimisticInfo = optimisticMetadata[clientId];
      const now = Date.now();

      if (optimisticEntity) {
        const mergedMessage: Message = {
          ...optimisticEntity,
          ...incomingMessage,
          id: incomingMessage.id,
          status: incomingMessage.status ?? optimisticEntity.status ?? 'sent',
          tempId: optimisticEntity.tempId,
          clientGeneratedId: clientId,
          optimisticStatus: 'confirmed',
          optimisticEnqueuedAt:
            optimisticEntity.optimisticEnqueuedAt ??
            optimisticInfo?.enqueuedAt ??
            now,
          optimisticSettledAt: now,
          retryCount:
            optimisticEntity.retryCount ??
            optimisticInfo?.retryCount ??
            0,
          error: undefined,
          errorCode: undefined,
        };

        if (currentId !== incomingMessage.id) {
          delete messageEntities[currentId];
          replacements.set(currentId, incomingMessage.id);
        }

        messageEntities[incomingMessage.id] = mergedMessage;
      } else {
        const mergedMessage: Message = {
          ...incomingMessage,
          clientGeneratedId: clientId,
          optimisticStatus: 'confirmed',
          optimisticEnqueuedAt: optimisticInfo?.enqueuedAt ?? now,
          optimisticSettledAt: now,
          retryCount: optimisticInfo?.retryCount ?? 0,
          error: undefined,
          errorCode: undefined,
        };

        messageEntities[incomingMessage.id] = mergedMessage;
      }

      optimisticMetadata[clientId] = {
        clientGeneratedId: clientId,
        chatId,
        status: 'confirmed',
        enqueuedAt:
          optimisticInfo?.enqueuedAt ??
          state.optimisticMetadata[clientId]?.enqueuedAt ??
          now,
        settledAt: now,
        retryCount: optimisticInfo?.retryCount ?? 0,
        serverId: incomingMessage.id,
      };
      optimisticIdMap[clientId] = incomingMessage.id;
      sendingMessages.delete(clientId);
      retryQueue.delete(clientId);
      return;
    }

    messageEntities[incomingMessage.id] = incomingMessage;
  });

  const previousIds = state.messageIdsByChat[chatId] || [];
  const adjustedPrevious = previousIds.map(
    (id) => replacements.get(id) || id
  );
  const incomingIds = incoming.map((message) => message.id);
  const incomingSet = new Set(incomingIds);

  const optimisticIds = adjustedPrevious.filter((id) => {
    const entity = messageEntities[id];
    const clientId = entity?.clientGeneratedId || entity?.tempId;
    return (
      clientId &&
      (sendingMessages.has(clientId) || entity?.optimisticStatus === 'failed')
    );
  });

  const optimisticSet = new Set(optimisticIds);
  const preservedOlderIds = adjustedPrevious.filter(
    (id) => !incomingSet.has(id) && !optimisticSet.has(id)
  );

  const mergedIds = dedupeIds([
    ...optimisticIds,
    ...incomingIds,
    ...preservedOlderIds,
  ]);

  const messages = buildChatMessages(mergedIds, messageEntities);

  return {
    messageEntities,
    messageIdsByChat: {
      ...state.messageIdsByChat,
      [chatId]: mergedIds,
    },
    messages: {
      ...state.messages,
      [chatId]: messages,
    },
    optimisticMetadata,
    optimisticIdMap,
    sendingMessages,
    retryQueue,
  };
};

const appendOlderMessages = (
  state: MessageState,
  chatId: string,
  olderMessages: Message[]
) => {
  if (olderMessages.length === 0) {
    return {
      messageEntities: state.messageEntities,
      messageIdsByChat: state.messageIdsByChat,
      messages: state.messages,
    };
  }

  const messageEntities: MessageEntityMap = { ...state.messageEntities };
  olderMessages.forEach((message) => {
    messageEntities[message.id] = message;
  });

  const existingIds = state.messageIdsByChat[chatId] || [];
  const existingSet = new Set(existingIds);
  const mergedIds = [...existingIds];

  olderMessages.forEach((message) => {
    if (!existingSet.has(message.id)) {
      existingSet.add(message.id);
      mergedIds.push(message.id);
    }
  });

  const messages = buildChatMessages(mergedIds, messageEntities);

  return {
    messageEntities,
    messageIdsByChat: {
      ...state.messageIdsByChat,
      [chatId]: mergedIds,
    },
    messages: {
      ...state.messages,
      [chatId]: messages,
    },
  };
};

const removeMessagesById = (
  state: MessageState,
  chatId: string,
  idsToRemove: string[]
) => {
  if (idsToRemove.length === 0) {
    return {
      messageEntities: state.messageEntities,
      messageIdsByChat: state.messageIdsByChat,
      messages: state.messages,
    };
  }

  const messageEntities: MessageEntityMap = { ...state.messageEntities };
  idsToRemove.forEach((id) => {
    delete messageEntities[id];
  });

  const remainingIds = (state.messageIdsByChat[chatId] || []).filter(
    (id) => !idsToRemove.includes(id)
  );

  const messages = buildChatMessages(remainingIds, messageEntities);

  return {
    messageEntities,
    messageIdsByChat: {
      ...state.messageIdsByChat,
      [chatId]: remainingIds,
    },
    messages: {
      ...state.messages,
      [chatId]: messages,
    },
  };
};

const updateMessageEntity = (
  state: MessageState,
  chatId: string,
  messageId: string,
  updater: (message: Message) => Message
) => {
  const existing = state.messageEntities[messageId];
  if (!existing) {
    return {
      messageEntities: state.messageEntities,
      messages: state.messages,
    };
  }

  const messageEntities: MessageEntityMap = {
    ...state.messageEntities,
    [messageId]: updater(existing),
  };

  const ids = state.messageIdsByChat[chatId] || [];
  const messages = buildChatMessages(ids, messageEntities);

  return {
    messageEntities,
    messages: {
      ...state.messages,
      [chatId]: messages,
    },
  };
};

export interface MessageState {
  messages: { [chatId: string]: Message[] }; // Keyed by chatId
  messageEntities: MessageEntityMap;
  messageIdsByChat: MessageIdMap;
  loading: boolean;
  error: string | null;
  sendingMessages: Set<string>; // Track clientGeneratedIds of messages being sent
  retryQueue: Set<string>; // Track clientGeneratedIds of messages to retry
  optimisticMetadata: OptimisticMetadataMap; // Track optimistic lifecycle metadata keyed by clientGeneratedId
  optimisticIdMap: Record<string, string>; // Map clientGeneratedId -> current message id in store
  hasMoreMessages: { [chatId: string]: boolean }; // Track if more messages available
  loadingOlder: { [chatId: string]: boolean }; // Track if loading older messages
  oldestMessageDoc: { [chatId: string]: QueryDocumentSnapshot | null }; // Track oldest message for pagination
  unreadUI: { [chatId: string]: UnreadUIState }; // Per-chat UI state for unread indicators

  // Actions
  subscribeToMessages: (chatId: string) => Unsubscribe;
  loadOlderMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, senderId: string, text: string) => Promise<void>;
  retryMessage: (chatId: string, messageId: string) => Promise<void>;
  markAsRead: (chatId: string, messageId: string, userId: string) => Promise<void>;
  clearUnreadCount: (chatId: string, userId: string) => Promise<void>;
  setActivelyViewing: (chatId: string, userId: string, isViewing: boolean) => Promise<void>;
  setTyping: (chatId: string, userId: string, isTyping: boolean) => Promise<void>;
  setUnreadUIState: (
    chatId: string,
    updater:
      | Partial<UnreadUIState>
      | ((prev: UnreadUIState) => Partial<UnreadUIState> | UnreadUIState)
  ) => void;
  resetUnreadUIState: (chatId: string) => void;
  clearError: () => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  // Initial state
  messages: {},
  messageEntities: {},
  messageIdsByChat: {},
  loading: false,
  error: null,
  sendingMessages: new Set(),
  retryQueue: new Set(),
  optimisticMetadata: {},
  optimisticIdMap: {},
  hasMoreMessages: {},
  loadingOlder: {},
  oldestMessageDoc: {},
  unreadUI: {},

  // Subscribe to real-time messages for a chat (last 50 messages)
  subscribeToMessages: (chatId) => {
    try {
      set({ loading: true, error: null });

      const messagesRef = collection(firestore, 'chats', chatId, 'messages');
      // Query last 50 messages in descending order (newest first)
      const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(MAX_BATCH));

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
              clientGeneratedId: data.clientGeneratedId || undefined,
              imageUrl: data.imageUrl,
              type: data.type || 'text',
              aiExtraction: data.aiExtraction
                ? {
                    calendarEvents: data.aiExtraction.calendarEvents || undefined,
                    decisions: data.aiExtraction.decisions || undefined,
                    priority: data.aiExtraction.priority || undefined,
                    rsvp: data.aiExtraction.rsvp || undefined,
                    deadlines: data.aiExtraction.deadlines || undefined,
                    relatedItems: data.aiExtraction.relatedItems || undefined,
                    extractedAt: data.aiExtraction.extractedAt?.toDate(),
                  }
                : undefined,
            };
          });

          set((state) => {
            const merged = mergeLatestWindow(state, chatId, firestoreMessages);
            const oldestDoc = snapshot.docs[snapshot.docs.length - 1] || null;
            const hasMore = snapshot.docs.length === MAX_BATCH;

            return {
              ...merged,
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
        limit(MAX_BATCH)
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
          clientGeneratedId: data.clientGeneratedId || undefined,
          imageUrl: data.imageUrl,
          type: data.type || 'text',
          aiExtraction: data.aiExtraction ? {
            calendarEvents: data.aiExtraction.calendarEvents || undefined,
            decisions: data.aiExtraction.decisions || undefined,
            priority: data.aiExtraction.priority || undefined,
            rsvp: data.aiExtraction.rsvp || undefined,
            deadlines: data.aiExtraction.deadlines || undefined,
            relatedItems: data.aiExtraction.relatedItems || undefined,
            extractedAt: data.aiExtraction.extractedAt?.toDate(),
          } : undefined,
        };
      });

      console.log('📜 [MessageStore] Loaded', olderMessages.length, 'older messages');

      set((state) => {
        const newOldestDoc = snapshot.docs[snapshot.docs.length - 1] || null;
        const hasMore = snapshot.docs.length === MAX_BATCH;
        const merged = appendOlderMessages(state, chatId, olderMessages);

        return {
          ...merged,
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

    const clientGeneratedId = `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticEnqueuedAt = Date.now();
    const optimisticMessage: Message = {
      id: clientGeneratedId,
      chatId,
      senderId,
      text,
      timestamp: new Date(),
      status: 'sending',
      readBy: [senderId],
      tempId: clientGeneratedId,
      clientGeneratedId,
      type: 'text',
      optimisticStatus: 'pending',
      optimisticEnqueuedAt,
      retryCount: 0,
    };
    const optimisticEntry: OptimisticEntry = {
      clientGeneratedId,
      chatId,
      status: 'pending',
      enqueuedAt: optimisticEnqueuedAt,
      retryCount: 0,
    };

    // 1. Add optimistic message immediately (instant UI feedback)
    set((state) => {
      const messageEntities: MessageEntityMap = {
        ...state.messageEntities,
        [clientGeneratedId]: optimisticMessage,
      };
      const existingIds = state.messageIdsByChat[chatId] || [];
      const mergedIds = [
        clientGeneratedId,
        ...existingIds.filter((id) => id !== clientGeneratedId),
      ];
      const messages = buildChatMessages(mergedIds, messageEntities);

      return {
        messageEntities,
        messageIdsByChat: {
          ...state.messageIdsByChat,
          [chatId]: mergedIds,
        },
        messages: {
          ...state.messages,
          [chatId]: messages,
        },
        sendingMessages: new Set([...state.sendingMessages, clientGeneratedId]),
        optimisticMetadata: {
          ...state.optimisticMetadata,
          [clientGeneratedId]: optimisticEntry,
        },
        optimisticIdMap: {
          ...state.optimisticIdMap,
          [clientGeneratedId]: clientGeneratedId,
        },
      };
    });

    try {
      // 2. Check network before sending to Firestore
      const netInfo = await NetInfo.fetch();
      console.log('[MessageStore] NetInfo status before send:', {
        isConnected: netInfo?.isConnected ?? null,
        isInternetReachable: netInfo?.isInternetReachable ?? null,
        type: netInfo?.type ?? 'unknown',
        details: netInfo?.details ?? null,
      });

      if (!netInfo.isConnected) {
        // Update optimistic message to failed status
        set((state) => {
          const messageKey =
            state.optimisticIdMap[clientGeneratedId] || clientGeneratedId;
          const newSendingMessages = new Set(state.sendingMessages);
          newSendingMessages.delete(clientGeneratedId);
          const now = Date.now();

          const update = updateMessageEntity(
            state,
            chatId,
            messageKey,
            (message) => ({
              ...message,
              status: 'failed' as const,
              optimisticStatus: 'failed',
              optimisticSettledAt: now,
              error: 'No internet connection',
              errorCode: 'NETWORK_OFFLINE',
            })
          );

          return {
            ...update,
            sendingMessages: newSendingMessages,
            retryQueue: new Set([...state.retryQueue, clientGeneratedId]),
            optimisticMetadata: {
              ...state.optimisticMetadata,
              [clientGeneratedId]: {
                ...(state.optimisticMetadata[clientGeneratedId] ?? optimisticEntry),
                status: 'failed',
                settledAt: now,
                errorCode: 'NETWORK_OFFLINE',
              },
            },
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
        clientGeneratedId,
      };

      const docRef = await addDoc(messagesRef, messageData);
      const messageId = docRef.id;

      // 3.5. Trigger AI multi-feature extraction (fire-and-forget, non-blocking)
      // Run all 5 AI features in parallel
      // This runs in the background and doesn't block the message send flow
      console.log('[AI] 🚀 Starting 5-feature extraction for message:', messageId);
      Promise.all([
        extractCalendarEvents(text),
        extractDecisions(text),
        detectPriority(text),
        trackRSVP(text, chatId, messageId),
        extractDeadlines(text),
      ])
        .then(async ([calendarEvents, decisions, priority, rsvp, deadlines]) => {
          console.log('[AI] ✅ 5-feature extraction completed');
          console.log(`[AI] 📅 Calendar events: ${calendarEvents.length}`);
          console.log(`[AI] ✅ Decisions: ${decisions.length}`);
          console.log(`[AI] 🎯 Priority: ${priority?.level || 'none'}`);
          console.log(`[AI] 🎫 RSVP: ${rsvp ? 'detected' : 'none'}`);
          console.log(`[AI] ⏰ Deadlines: ${deadlines.length}`);

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

          if (rsvp && (rsvp.isInvitation || rsvp.isResponse)) {
            aiExtraction.rsvp = rsvp;
            console.log(`[AI] 🎫 RSVP: ${rsvp.isInvitation ? 'invitation' : 'response'}`);
          }

          if (deadlines.length > 0) {
            aiExtraction.deadlines = deadlines;
            console.log(`[AI] ⏰ Extracted ${deadlines.length} deadline(s)`);
          }

          // Link RSVP to calendar event if both exist (related items)
          if (rsvp?.isInvitation && calendarEvents.length > 0) {
            aiExtraction.relatedItems = {
              rsvpLinkedToEvent: calendarEvents[0].event,
            };
            console.log(`[AI] 🔗 Linked RSVP to calendar event: ${calendarEvents[0].event}`);
          }

          // Only update if we have at least one extraction result
          if (calendarEvents.length > 0 || decisions.length > 0 || priority ||
              (rsvp && (rsvp.isInvitation || rsvp.isResponse)) || deadlines.length > 0) {
            console.log(`[AI] 💾 Updating message ${messageId} with AI extraction data`);
            const messageRef = doc(firestore, 'chats', chatId, 'messages', messageId);

            // Update the message document with aiExtraction field
            await updateDoc(messageRef, { aiExtraction });

            // ALSO save to aiExtraction subcollection for proactive assistant
            await saveAIExtractionToSubcollection(
              chatId,
              messageId,
              senderId,
              calendarEvents,
              decisions,
              priority,
              rsvp,
              deadlines
            );
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

      // 5. Reconcile optimistic message in place to avoid flicker
      set((state) => {
        const now = Date.now();
        const messageEntities: MessageEntityMap = { ...state.messageEntities };
        const messageKey =
          state.optimisticIdMap[clientGeneratedId] || clientGeneratedId;
        const existing = messageEntities[messageKey] || messageEntities[clientGeneratedId];

        const reconciled: Message = existing
          ? {
              ...existing,
              id: messageId,
              status: 'sent',
              clientGeneratedId,
              tempId: undefined,
              optimisticStatus: 'confirmed',
              optimisticSettledAt: now,
              optimisticEnqueuedAt:
                existing.optimisticEnqueuedAt ?? optimisticEnqueuedAt,
              retryCount:
                existing.retryCount ??
                state.optimisticMetadata[clientGeneratedId]?.retryCount ??
                0,
              error: undefined,
              errorCode: undefined,
            }
          : {
              ...optimisticMessage,
              id: messageId,
              status: 'sent',
              clientGeneratedId,
              tempId: undefined,
              optimisticStatus: 'confirmed',
              optimisticSettledAt: now,
              optimisticEnqueuedAt,
              retryCount: 0,
              error: undefined,
              errorCode: undefined,
            };

        if (messageKey !== messageId) {
          delete messageEntities[messageKey];
        }
        messageEntities[messageId] = reconciled;

        const existingIds = state.messageIdsByChat[chatId] || [];
        const mappedIds = existingIds.map((id) =>
          id === messageKey ? messageId : id
        );
        const mergedIds = mappedIds.includes(messageId)
          ? dedupeIds(mappedIds)
          : dedupeIds([messageId, ...mappedIds]);
        const messages = buildChatMessages(mergedIds, messageEntities);

        const sendingMessages = new Set(state.sendingMessages);
        sendingMessages.delete(clientGeneratedId);

        const retryQueue = new Set(state.retryQueue);
        retryQueue.delete(clientGeneratedId);

        return {
          messageEntities,
          messageIdsByChat: {
            ...state.messageIdsByChat,
            [chatId]: mergedIds,
          },
          messages: {
            ...state.messages,
            [chatId]: messages,
          },
          sendingMessages,
          retryQueue,
          optimisticMetadata: {
            ...state.optimisticMetadata,
            [clientGeneratedId]: {
              ...(state.optimisticMetadata[clientGeneratedId] ?? optimisticEntry),
              status: 'confirmed',
              settledAt: now,
              serverId: messageId,
              errorCode: undefined,
            },
          },
          optimisticIdMap: {
            ...state.optimisticIdMap,
            [clientGeneratedId]: messageId,
          },
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
      const now = Date.now();

      // Mark optimistic message as failed
      set((state) => {
        const messageKey =
          state.optimisticIdMap[clientGeneratedId] || clientGeneratedId;
        const newSendingMessages = new Set(state.sendingMessages);
        newSendingMessages.delete(clientGeneratedId);

        const newRetryQueue = new Set(state.retryQueue);
        if (isNetworkError) {
          newRetryQueue.add(clientGeneratedId);
        }

        const update = updateMessageEntity(
          state,
          chatId,
          messageKey,
          (message) => ({
            ...message,
            status: 'failed' as const,
            optimisticStatus: 'failed',
            optimisticSettledAt: now,
            error: isNetworkError ? 'No internet connection' : 'Failed to send message',
            errorCode: isNetworkError ? 'NETWORK_ERROR' : 'SEND_FAILED',
          })
        );

        return {
          ...update,
          sendingMessages: newSendingMessages,
          retryQueue: newRetryQueue,
          error: error.message,
          optimisticMetadata: {
            ...state.optimisticMetadata,
            [clientGeneratedId]: {
              ...(state.optimisticMetadata[clientGeneratedId] ?? optimisticEntry),
              status: 'failed',
              settledAt: now,
              errorCode: isNetworkError ? 'NETWORK_ERROR' : 'SEND_FAILED',
            },
          },
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
    const failedMessage = chatMessages.find(
      (m) => m.id === messageId || m.tempId === messageId || m.clientGeneratedId === messageId
    );

    if (!failedMessage) {
      console.error('❌ [MessageStore] Message not found:', messageId);
      throw new Error('Message not found');
    }

    const clientGeneratedId =
      failedMessage.clientGeneratedId || failedMessage.tempId || failedMessage.id;
    const messageKey =
      state.optimisticIdMap[clientGeneratedId] || failedMessage.id || clientGeneratedId;

    console.log('🔄 [MessageStore] Found failed message:', {
      text: failedMessage.text.substring(0, 20),
      status: failedMessage.status,
      error: failedMessage.error,
      clientGeneratedId,
    });

    const previousMetadata = state.optimisticMetadata[clientGeneratedId];
    const retryCount =
      (previousMetadata?.retryCount ?? failedMessage.retryCount ?? 0) + 1;

    // Remove from retry queue first
    const newRetryQueue = new Set(state.retryQueue);
    newRetryQueue.delete(clientGeneratedId);
    set({ retryQueue: newRetryQueue });
    console.log('🔄 [MessageStore] Removed from retry queue. Queue size:', newRetryQueue.size);

    // Update existing failed message to "sending" status (don't create new message)
    set((state) => {
      const update = updateMessageEntity(state, chatId, messageKey, (message) => ({
        ...message,
        status: 'sending' as const,
        optimisticStatus: 'pending',
        optimisticSettledAt: undefined,
        error: undefined,
        errorCode: undefined,
        retryCount,
      }));

      return {
        ...update,
        sendingMessages: new Set([...state.sendingMessages, clientGeneratedId]),
        optimisticMetadata: {
          ...state.optimisticMetadata,
          [clientGeneratedId]: {
            ...(state.optimisticMetadata[clientGeneratedId] ?? {
              clientGeneratedId,
              chatId,
              enqueuedAt: failedMessage.optimisticEnqueuedAt ?? Date.now(),
              retryCount: 0,
            }),
            status: 'pending',
            settledAt: undefined,
            errorCode: undefined,
            retryCount,
          },
        },
        optimisticIdMap: {
          ...state.optimisticIdMap,
          [clientGeneratedId]: messageKey,
        },
      };
    });
    console.log('🔄 [MessageStore] Updated message status to "sending"');

    // Now try to send to Firestore
    try {
      // Check network
      console.log('🔄 [MessageStore] Checking network status...');
      const netInfo = await NetInfo.fetch();
      console.log('[MessageStore] NetInfo status before retry:', {
        isConnected: netInfo?.isConnected ?? null,
        isInternetReachable: netInfo?.isInternetReachable ?? null,
        type: netInfo?.type ?? 'unknown',
        details: netInfo?.details ?? null,
      });
      console.log('📶 [MessageStore] Network status:', {
        isConnected: netInfo.isConnected,
        isInternetReachable: netInfo.isInternetReachable,
        type: netInfo.type,
      });

      if (!netInfo.isConnected) {
        console.log('❌ [MessageStore] Still offline, marking as failed again');
        const now = Date.now();
        // Still offline, mark as failed again
        set((state) => {
          const newSendingMessages = new Set(state.sendingMessages);
          newSendingMessages.delete(clientGeneratedId);

          const update = updateMessageEntity(state, chatId, messageKey, (message) => ({
            ...message,
            status: 'failed' as const,
            optimisticStatus: 'failed',
            optimisticSettledAt: now,
            error: 'No internet connection',
            errorCode: 'NETWORK_OFFLINE',
            retryCount,
          }));

          return {
            ...update,
            sendingMessages: newSendingMessages,
            retryQueue: new Set([...state.retryQueue, clientGeneratedId]),
            optimisticMetadata: {
              ...state.optimisticMetadata,
              [clientGeneratedId]: {
                ...(state.optimisticMetadata[clientGeneratedId] ?? {
                  clientGeneratedId,
                  chatId,
                  enqueuedAt: failedMessage.optimisticEnqueuedAt ?? now,
                  retryCount: retryCount,
                }),
                status: 'failed',
                settledAt: now,
                errorCode: 'NETWORK_OFFLINE',
                retryCount,
              },
            },
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
        clientGeneratedId,
      };

      const docRef = await addDoc(messagesRef, messageData);
      const newMessageId = docRef.id;

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
          const isActivelyViewing =
            viewerTimestamp &&
            (now - (viewerTimestamp.toMillis ? viewerTimestamp.toMillis() : viewerTimestamp) < 5000);

          if (!isActivelyViewing) {
            updates[`unreadCount.${participantId}`] = increment(1);
          }
        }
      });

      await updateDoc(chatRef, updates);

      // Reconcile optimistic message with the authoritative payload
      set((state) => {
        const settledAt = Date.now();
        const messageEntities: MessageEntityMap = { ...state.messageEntities };
        const optimisticKey =
          state.optimisticIdMap[clientGeneratedId] || clientGeneratedId;
        const existing = messageEntities[optimisticKey] || messageEntities[clientGeneratedId] || failedMessage;

        const reconciled: Message = {
          ...existing,
          id: newMessageId,
          status: 'sent',
          clientGeneratedId,
          tempId: undefined,
          optimisticStatus: 'confirmed',
          optimisticSettledAt: settledAt,
          optimisticEnqueuedAt:
            existing.optimisticEnqueuedAt ??
            failedMessage.optimisticEnqueuedAt ??
            settledAt,
          retryCount,
          error: undefined,
          errorCode: undefined,
        };

        if (optimisticKey !== newMessageId) {
          delete messageEntities[optimisticKey];
        }
        messageEntities[newMessageId] = reconciled;

        const ids = state.messageIdsByChat[chatId] || [];
        const mappedIds = ids.map((id) =>
          id === optimisticKey ? newMessageId : id
        );
        const mergedIds = mappedIds.includes(newMessageId)
          ? dedupeIds(mappedIds)
          : dedupeIds([newMessageId, ...mappedIds]);
        const messages = buildChatMessages(mergedIds, messageEntities);

        const sendingMessages = new Set(state.sendingMessages);
        sendingMessages.delete(clientGeneratedId);

        return {
          messageEntities,
          messageIdsByChat: {
            ...state.messageIdsByChat,
            [chatId]: mergedIds,
          },
          messages: {
            ...state.messages,
            [chatId]: messages,
          },
          sendingMessages,
          retryQueue: new Set(state.retryQueue),
          optimisticMetadata: {
            ...state.optimisticMetadata,
            [clientGeneratedId]: {
              ...(state.optimisticMetadata[clientGeneratedId] ?? {
                clientGeneratedId,
                chatId,
                enqueuedAt: failedMessage.optimisticEnqueuedAt ?? settledAt,
              }),
              status: 'confirmed',
              settledAt,
              errorCode: undefined,
              retryCount,
              serverId: newMessageId,
            },
          },
          optimisticIdMap: {
            ...state.optimisticIdMap,
            [clientGeneratedId]: newMessageId,
          },
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
      const settledAt = Date.now();

      set((state) => {
        const newSendingMessages = new Set(state.sendingMessages);
        newSendingMessages.delete(clientGeneratedId);

        const newRetryQueue = new Set(state.retryQueue);
        if (isNetworkError) {
          newRetryQueue.add(clientGeneratedId);
        }

        const update = updateMessageEntity(state, chatId, messageKey, (message) => ({
          ...message,
          status: 'failed' as const,
          optimisticStatus: 'failed',
          optimisticSettledAt: settledAt,
          error: isNetworkError ? 'No internet connection' : 'Failed to send message',
          errorCode: isNetworkError ? 'NETWORK_ERROR' : 'SEND_FAILED',
          retryCount,
        }));

        return {
          ...update,
          sendingMessages: newSendingMessages,
          retryQueue: newRetryQueue,
          optimisticMetadata: {
            ...state.optimisticMetadata,
            [clientGeneratedId]: {
              ...(state.optimisticMetadata[clientGeneratedId] ?? {
                clientGeneratedId,
                chatId,
                enqueuedAt: failedMessage.optimisticEnqueuedAt ?? settledAt,
              }),
              status: 'failed',
              settledAt,
              errorCode: isNetworkError ? 'NETWORK_ERROR' : 'SEND_FAILED',
              retryCount,
            },
          },
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

  setUnreadUIState: (chatId, updater) => {
    set((state) => {
      const prevStored = state.unreadUI[chatId];
      const base = cloneUnreadUIState(prevStored);
      const patch =
        typeof updater === 'function' ? updater({ ...base }) : updater;
      const next = mergeUnreadUIState(base, patch);

      if (prevStored && isUnreadUIStateEqual(prevStored, next)) {
        return state;
      }

      return {
        unreadUI: {
          ...state.unreadUI,
          [chatId]: next,
        },
      };
    });
  },

  resetUnreadUIState: (chatId) => {
    set((state) => {
      if (!state.unreadUI[chatId]) {
        return state;
      }
      const next = { ...state.unreadUI };
      delete next[chatId];
      return { unreadUI: next };
    });
  },

  clearError: () => set({ error: null }),
}));
