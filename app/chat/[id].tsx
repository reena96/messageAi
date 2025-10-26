import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  LayoutChangeEvent,
  ViewToken,
  LayoutAnimation,
} from 'react-native';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/authStore';
import { useMessageStore } from '@/lib/store/messageStore';
import { useChatMessageView } from '@/lib/store/messageSelectors';
import { useChatStore } from '@/lib/store/chatStore';
import MessageBubble from '@/components/messages/MessageBubble';
import TypingIndicator from '@/components/messages/TypingIndicator';
import AIInsightCard from '@/components/messages/AIInsightCard';
import BackButton from '@/components/navigation/BackButton';
import { MessageRow } from '@/types/messageRow';
import { ContextSummaryCard } from '@/components/messages/ContextSummaryCard';
import { requestConversationSummary, ConversationSummaryMessage } from '@/lib/ai/summary';

const estimateRowHeight = (row: MessageRow): number => {
  switch (row.type) {
    case 'day-header':
      return 40;
    case 'unread-separator':
      return 56;
    case 'summary':
      return row.collapsed ? 58 : 160;
    case 'message':
    default:
      return 96;
  }
};

const RECENT_COUNT = 25;

type SummaryPresetId = 'recent25' | 'today' | 'week' | 'twoWeeks' | 'month';

type SummaryWindow =
  | { type: 'count'; count: number }
  | { type: 'time'; durationMs: number; alignToDayStart?: boolean };

interface SummaryPreset {
  id: SummaryPresetId;
  label: string;
  window: SummaryWindow;
}

interface SummaryRange {
  startId: string | null;
  endId: string | null;
  startTimestamp: Date | null;
  endTimestamp: Date | null;
}

type SummaryStatus = 'idle' | 'loading' | 'ready' | 'error';

interface PresetSummaryState {
  status: SummaryStatus;
  summary: string | null;
  error?: string;
  signature: string | null;
  lastUpdated: number | null;
  messageCount: number;
  range: SummaryRange;
}

const SUMMARY_PRESETS: SummaryPreset[] = [
  { id: 'recent25', label: 'Last 25', window: { type: 'count', count: RECENT_COUNT } },
  {
    id: 'today',
    label: 'Today',
    window: { type: 'time', durationMs: 24 * 60 * 60 * 1000, alignToDayStart: true },
  },
  { id: 'week', label: '7 Days', window: { type: 'time', durationMs: 7 * 24 * 60 * 60 * 1000 } },
  {
    id: 'twoWeeks',
    label: '14 Days',
    window: { type: 'time', durationMs: 14 * 24 * 60 * 60 * 1000 },
  },
  {
    id: 'month',
    label: '30 Days',
    window: { type: 'time', durationMs: 30 * 24 * 60 * 60 * 1000 },
  },
];

export default function ChatScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Use proper Zustand selectors for reliable re-renders
  const subscribeToMessages = useMessageStore((state) => state.subscribeToMessages);
  const loadOlderMessages = useMessageStore((state) => state.loadOlderMessages);
  const hasMoreMessages = useMessageStore((state) => state.hasMoreMessages);
  const loadingOlder = useMessageStore((state) => state.loadingOlder);
  const sendMessage = useMessageStore((state) => state.sendMessage);
  const markAsRead = useMessageStore((state) => state.markAsRead);
  const clearUnreadCount = useMessageStore((state) => state.clearUnreadCount);
  const setActivelyViewing = useMessageStore((state) => state.setActivelyViewing);
  const setTyping = useMessageStore((state) => state.setTyping);
  const setUnreadUIState = useMessageStore((state) => state.setUnreadUIState);
  const resetUnreadUIState = useMessageStore((state) => state.resetUnreadUIState);
  const unreadUIState = useMessageStore(
    useCallback(
      (state) => (chatId ? state.unreadUI[chatId] : undefined),
      [chatId]
    )
  );

  const chats = useChatStore((state) => state.chats);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserLastSeen, setOtherUserLastSeen] = useState<Date | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true); // Track if user is at bottom of chat
  const [newMessageCount, setNewMessageCount] = useState(0); // Count of new messages when scrolled up
  const flatListRef = useRef<FlatList<MessageRow>>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const markedAsReadRef = useRef<Set<string>>(new Set()); // Track which messages we've already marked as read
  const previousMessageIdsRef = useRef<string[]>([]); // Track previous message ids for new message detection
  const initialLoadRef = useRef(true);
  const initialSeparatorShownRef = useRef(false);
  const topVisibleRowRef = useRef<string | null>(null);
  const summaryRowId = 'summary-row';
  const initialAnchorAppliedRef = useRef(false);
  const summaryRequestsRef = useRef<Record<SummaryPresetId, number>>({
    recent25: 0,
    today: 0,
    week: 0,
    twoWeeks: 0,
    month: 0,
  });
  const createInitialPresetState = (): PresetSummaryState => ({
    status: 'idle',
    summary: null,
    error: undefined,
    signature: null,
    lastUpdated: null,
    messageCount: 0,
    range: {
      startId: null,
      endId: null,
      startTimestamp: null,
      endTimestamp: null,
    },
  });
  const [presetSummaries, setPresetSummaries] = useState<
    Record<SummaryPresetId, PresetSummaryState>
  >(() => {
    const initialState = {} as Record<SummaryPresetId, PresetSummaryState>;
    SUMMARY_PRESETS.forEach((preset) => {
      initialState[preset.id] = createInitialPresetState();
    });
    return initialState;
  });
  const presetSummariesRef = useRef(presetSummaries);
  const [selectedPreset, setSelectedPreset] = useState<SummaryPresetId>('recent25');
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [summaryActive, setSummaryActive] = useState(false);

  useEffect(() => {
    presetSummariesRef.current = presetSummaries;
  }, [presetSummaries]);

  const resolvedChatId = chatId ?? '__missing__';
  const {
    rows: baseRows,
    messages: chatMessages,
    unreadCount,
    firstUnreadMessageId,
  } = useChatMessageView(resolvedChatId, user?.uid);
  const loadingOlderForChat = chatId ? loadingOlder[chatId] : false;
  const hasMoreForChat = chatId ? hasMoreMessages[chatId] : false;
  const rowHeightsRef = useRef<Map<string, number>>(new Map());
  const [layoutVersion, setLayoutVersion] = useState(0);
  const chronologicalMessages = useMemo(
    () =>
      [...chatMessages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    [chatMessages]
  );
  const currentChat = useMemo(
    () => chats.find((chat) => chat.id === chatId),
    [chats, chatId]
  );

  const selectedSummaryState = presetSummaries[selectedPreset];
  const summaryStatus = selectedSummaryState?.status ?? 'idle';
  const summaryText = selectedSummaryState?.summary ?? null;
  const summaryError = selectedSummaryState?.error;

  const summaryOptions = useMemo(
    () =>
      SUMMARY_PRESETS.map((preset) => {
        const state = presetSummaries[preset.id];
        return {
          id: preset.id,
          label: preset.label,
          status: state?.status ?? 'idle',
          summary: state?.summary ?? null,
          error: state?.error,
          lastUpdated: state?.lastUpdated ?? null,
          messageCount: state?.messageCount ?? 0,
        };
      }),
    [presetSummaries]
  );

  useEffect(() => {
    if (!chatId || unreadCount <= 0 || initialSeparatorShownRef.current) {
      return;
    }

    setUnreadUIState(chatId, {
      separatorVisible: true,
      anchorMessageId: firstUnreadMessageId ?? null,
      lastUnreadCount: unreadCount,
      separatorAcknowledged: false,
      separatorReady: false,
    });

    initialSeparatorShownRef.current = true;
  }, [chatId, firstUnreadMessageId, unreadCount, setUnreadUIState]);

  useEffect(() => {
    if (!chatId || !unreadUIState?.separatorVisible || unreadUIState.separatorReady) {
      return;
    }

    const id = requestAnimationFrame(() => {
      setUnreadUIState(chatId, { separatorReady: true });
    });

    return () => cancelAnimationFrame(id);
  }, [chatId, setUnreadUIState, unreadUIState?.separatorReady, unreadUIState?.separatorVisible]);

  const computePresetDataset = useCallback(
    (presetId: SummaryPresetId) => {
      const preset = SUMMARY_PRESETS.find((item) => item.id === presetId);
      if (!preset || chronologicalMessages.length === 0) {
        return null;
      }

      let slice = chronologicalMessages;

      if (preset.window.type === 'count') {
        const startIndex = Math.max(0, chronologicalMessages.length - preset.window.count);
        slice = chronologicalMessages.slice(startIndex);
      } else if (preset.window.type === 'time') {
        const now = new Date();
        let cutoff = new Date(now.getTime() - preset.window.durationMs);
        if (preset.window.alignToDayStart) {
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          cutoff = startOfDay;
        }
        slice = chronologicalMessages.filter((msg) => msg.timestamp >= cutoff);
      }

      if (slice.length === 0) {
        return null;
      }

      const participantDetails = currentChat?.participantDetails ?? {};

      const formattedMessages: ConversationSummaryMessage[] = slice
        .map((msg) => {
          const raw = (msg.text ?? '').trim();
          const text =
            raw.length > 0 ? raw : msg.type === 'image' ? '[Image]' : '[Message]';

          if (!text) {
            return null;
          }

          const senderLabel =
            msg.senderId === user?.uid
              ? 'You'
              : participantDetails[msg.senderId]?.displayName || msg.senderId;

          return {
            text,
            sender: senderLabel,
            timestamp: msg.timestamp.toISOString(),
          };
        })
        .filter((entry): entry is ConversationSummaryMessage => Boolean(entry?.text));

      if (formattedMessages.length === 0) {
        return null;
      }

      const startMessage = slice[0];
      const endMessage = slice[slice.length - 1];

      const signature = [
        presetId,
        startMessage?.id ?? 'none',
        endMessage?.id ?? 'none',
        formattedMessages.length,
        endMessage?.timestamp.getTime() ?? 0,
      ].join('|');

      const range: SummaryRange = {
        startId: startMessage?.id ?? null,
        endId: endMessage?.id ?? null,
        startTimestamp: startMessage?.timestamp ?? null,
        endTimestamp: endMessage?.timestamp ?? null,
      };

      return {
        preset,
        messages: formattedMessages,
        signature,
        messageCount: formattedMessages.length,
        range,
      };
    },
    [chronologicalMessages, currentChat?.participantDetails, user?.uid]
  );

  const requestSummaryForPreset = useCallback(
    async (presetId: SummaryPresetId, options?: { force?: boolean }) => {
      const dataset = computePresetDataset(presetId);

      if (!dataset) {
        setPresetSummaries((prev) => ({
          ...prev,
          [presetId]: {
            ...prev[presetId],
            status: 'idle',
            summary: null,
            error: undefined,
            signature: null,
            messageCount: 0,
            range: {
              startId: null,
              endId: null,
              startTimestamp: null,
              endTimestamp: null,
            },
          },
        }));
        return;
      }

      const currentState = presetSummariesRef.current[presetId];
      const forceRefresh = options?.force ?? false;

      if (
        !forceRefresh &&
        currentState &&
        currentState.signature === dataset.signature &&
        (currentState.status === 'ready' || currentState.status === 'loading')
      ) {
        return;
      }

      setPresetSummaries((prev) => ({
        ...prev,
        [presetId]: {
          ...prev[presetId],
          status: 'loading',
          error: undefined,
          signature: dataset.signature,
          messageCount: dataset.messageCount,
          range: dataset.range,
        },
      }));

      const requestId = (summaryRequestsRef.current[presetId] ?? 0) + 1;
      summaryRequestsRef.current[presetId] = requestId;

      try {
        const response = await requestConversationSummary({
          messages: dataset.messages,
        });

        if (summaryRequestsRef.current[presetId] !== requestId) {
          return;
        }

        setPresetSummaries((prev) => ({
          ...prev,
          [presetId]: {
            ...prev[presetId],
            status: response.summary ? 'ready' : 'error',
            summary: response.summary,
            error: response.summary ? undefined : response.error ?? 'Unable to load summary',
            signature: dataset.signature,
            messageCount: dataset.messageCount,
            range: dataset.range,
            lastUpdated: Date.now(),
          },
        }));
      } catch (error) {
        console.error('[ContextSummary] Failed to load summary', error);

        if (summaryRequestsRef.current[presetId] !== requestId) {
          return;
        }

        setPresetSummaries((prev) => ({
          ...prev,
          [presetId]: {
            ...prev[presetId],
            status: 'error',
            summary: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            signature: dataset.signature,
            messageCount: dataset.messageCount,
            range: dataset.range,
            lastUpdated: Date.now(),
          },
        }));
      }
    },
    [computePresetDataset]
  );

  useEffect(() => {
    if (chronologicalMessages.length === 0) {
      return;
    }

    SUMMARY_PRESETS.forEach((preset) => {
      requestSummaryForPreset(preset.id);
    });
  }, [chronologicalMessages, requestSummaryForPreset]);

  const handleRowLayout = (rowId: string) => (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height <= 0) return;
    const cached = rowHeightsRef.current.get(rowId);
    if (cached !== height) {
      rowHeightsRef.current.set(rowId, height);
      setLayoutVersion((version) => version + 1);
    }
  };

  const messageRows = useMemo(() => {
    if (!summaryActive) {
      return baseRows;
    }

    const summaryRow: MessageRow = {
      type: 'summary',
      id: summaryRowId,
      summary: summaryText,
      status: summaryStatus,
      collapsed: summaryCollapsed,
      error: summaryError,
    };

    const separatorIndex = baseRows.findIndex((row) => row.type === 'unread-separator');
    if (separatorIndex >= 0) {
      return [
        ...baseRows.slice(0, separatorIndex),
        summaryRow,
        ...baseRows.slice(separatorIndex),
      ];
    }

    return [summaryRow, ...baseRows];
  }, [baseRows, summaryActive, summaryCollapsed, summaryError, summaryStatus, summaryText]);

  const layoutMap = useMemo(() => {
    const offsets = new Map<string, number>();
    const lengths = new Map<string, number>();
    let runningOffset = 0;

    messageRows.forEach((row) => {
      const length = rowHeightsRef.current.get(row.id) ?? estimateRowHeight(row);
      lengths.set(row.id, length);
      offsets.set(row.id, runningOffset);
      runningOffset += length;
    });

    return { offsets, lengths };
  }, [messageRows, layoutVersion]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
    minimumViewTime: 300,
  });

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      if (!chatId || !user?.uid) return;

      let summaryVisible = false;
      let firstVisibleMessageId: string | null = null;
      let lowestIndex = Number.POSITIVE_INFINITY;

      viewableItems.forEach((token) => {
        if (!token.isViewable) return;
        const row = token.item as MessageRow | undefined;
        if (!row) return;

        if (typeof token.index === 'number' && token.index < lowestIndex) {
          lowestIndex = token.index;
        }

        if (row.type === 'summary') {
          summaryVisible = true;
          return;
        }

        if (row.type === 'message') {
          if (!firstVisibleMessageId) {
            firstVisibleMessageId = row.id;
          }

          const msg = row.message;
          const alreadyTracked = markedAsReadRef.current.has(msg.id);
          if (
            msg.senderId !== user.uid &&
            !msg.readBy.includes(user.uid) &&
            !alreadyTracked
          ) {
            markedAsReadRef.current.add(msg.id);
            markAsRead(chatId, msg.id, user.uid);
          }

          if (
            chatId &&
            unreadUIState?.anchorMessageId === row.id &&
            !unreadUIState.separatorAcknowledged
          ) {
            setUnreadUIState(chatId, { separatorAcknowledged: true });
          }
        }
      });

      if (firstVisibleMessageId) {
        topVisibleRowRef.current = firstVisibleMessageId;
      }

      if (summaryActive && !summaryVisible) {
        const summaryIndex = messageRows.findIndex((row) => row.id === summaryRowId);
        if (
          summaryIndex !== -1 &&
          lowestIndex !== Number.POSITIVE_INFINITY &&
          lowestIndex > summaryIndex
        ) {
          setSummaryActive(false);
          setSummaryCollapsed(false);
        }
      }
    },
    [
      chatId,
      markAsRead,
      messageRows,
      setUnreadUIState,
      summaryActive,
      summaryRowId,
      unreadUIState?.anchorMessageId,
      unreadUIState?.separatorAcknowledged,
      user?.uid,
    ]
  );

  const handleManualSummary = useCallback(() => {
    if (summaryActive) {
      setSummaryActive(false);
      setSummaryCollapsed(false);
      return;
    }

    setSummaryActive(true);
    setSummaryCollapsed(false);

    const currentState = presetSummariesRef.current[selectedPreset];
    if (!currentState || currentState.status === 'idle' || currentState.status === 'error') {
      requestSummaryForPreset(selectedPreset, { force: currentState?.status === 'error' });
    }
  }, [requestSummaryForPreset, selectedPreset, summaryActive]);

  const handleSelectPreset = useCallback(
    (presetId: SummaryPresetId) => {
      setSelectedPreset(presetId);
      const state = presetSummariesRef.current[presetId];
      if (!state || state.status === 'idle' || state.status === 'error') {
        requestSummaryForPreset(presetId, { force: state?.status === 'error' });
      }
    },
    [requestSummaryForPreset]
  );

  useEffect(() => {
    if (initialAnchorAppliedRef.current) return;
    if (!flatListRef.current) return;
    if (messageRows.length === 0) return;

    const summaryIndex = messageRows.findIndex((row) => row.id === summaryRowId);
    const unreadIndex = messageRows.findIndex((row) => row.type === 'unread-separator');
    const targetIndex = summaryIndex !== -1 ? summaryIndex : unreadIndex;

    if (targetIndex === -1) {
      if (unreadCount === 0) {
        initialAnchorAppliedRef.current = true;
      }
      return;
    }

    requestAnimationFrame(() => {
      try {
        flatListRef.current?.scrollToIndex({
          index: targetIndex,
          animated: false,
          viewPosition: 0.5,
        });
      } catch (error) {
        console.warn('Failed to scroll to unread anchor', error);
      } finally {
        initialAnchorAppliedRef.current = true;
      }
    });
  }, [messageRows, summaryRowId, unreadCount]);

  const getItemLayout = (_data: MessageRow[] | null | undefined, index: number) => {
    const row = messageRows[index];
    if (!row) {
      return { length: 0, offset: 0, index };
    }
    const length = layoutMap.lengths.get(row.id) ?? estimateRowHeight(row);
    const offset = layoutMap.offsets.get(row.id) ?? 0;
    return { length, offset, index };
  };

  // Get chat display name
  const getChatDisplayName = () => {
    if (!currentChat) return 'Chat';

    if (currentChat.type === 'group') {
      return currentChat.groupName || 'Group Chat';
    }

    // One-on-one chat - find the other user
    const otherUserId = currentChat.participants.find((id) => id !== user?.uid);
    if (otherUserId && currentChat.participantDetails[otherUserId]) {
      return currentChat.participantDetails[otherUserId].displayName;
    }

    return 'Chat';
  };

  // Get other user ID for one-on-one chats
  const otherUserId = currentChat?.type === 'one-on-one'
    ? currentChat.participants.find((id) => id !== user?.uid)
    : null;

  // Handle scroll position tracking
  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const atBottomNow = contentOffset.y <= 32;

    if (atBottomNow && !isAtBottom) {
      setIsAtBottom(true);
      setNewMessageCount(0);
      if (chatId) {
        setUnreadUIState(chatId, { floatingBadgeVisible: false });
      }
    } else if (!atBottomNow && isAtBottom) {
      setIsAtBottom(false);
    }
  };

  const handleEndReached = () => {
    if (!chatId || !hasMoreForChat || loadingOlderForChat) {
      return;
    }
    console.log('📜 [ChatScreen] Near top - loading older messages');
    loadOlderMessages(chatId);
  };

  // Subscribe to other user's online status (one-on-one chats only)
  useEffect(() => {
    if (!otherUserId) return;

    const userRef = doc(firestore, 'users', otherUserId);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      const userData = doc.data();
      if (userData) {
        setOtherUserOnline(userData.online || false);
        setOtherUserLastSeen(userData.lastSeen?.toDate() || null);
      }
    });

    return () => unsubscribe();
  }, [otherUserId]);

  // Subscribe to messages on mount
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = subscribeToMessages(chatId);

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]); // Only re-run when chatId changes

  // Clear unread count when chat is opened
  useEffect(() => {
    if (!chatId || !user) return;

    clearUnreadCount(chatId, user.uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, user?.uid]); // Only run when chat or user changes

  useEffect(() => {
    if (!chatId) {
      return;
    }
    return () => {
      resetUnreadUIState(chatId);
    };
  }, [chatId, resetUnreadUIState]);

  // Track that user is actively viewing this chat
  useEffect(() => {
    if (!chatId || !user) return;

    // Mark as actively viewing when entering
    setActivelyViewing(chatId, user.uid, true);

    // Keep updating the timestamp every 3 seconds to stay within the 5 second window
    const interval = setInterval(() => {
      setActivelyViewing(chatId, user.uid, true);
    }, 3000);

    // Mark as not viewing when leaving
    return () => {
      clearInterval(interval);
      setActivelyViewing(chatId, user.uid, false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, user?.uid]); // Only re-run when chat or user changes

  // Clear state when switching chats
  useEffect(() => {
    markedAsReadRef.current.clear();
    previousMessageIdsRef.current = [];
    initialLoadRef.current = true;
    initialSeparatorShownRef.current = false;
    setIsAtBottom(true);
    setNewMessageCount(0);
    SUMMARY_PRESETS.forEach((preset) => {
      summaryRequestsRef.current[preset.id] = 0;
    });
    const freshState = {} as Record<SummaryPresetId, PresetSummaryState>;
    SUMMARY_PRESETS.forEach((preset) => {
      freshState[preset.id] = createInitialPresetState();
    });
    setPresetSummaries(freshState);
    presetSummariesRef.current = freshState;
    setSelectedPreset('recent25');
    setSummaryActive(false);
    setSummaryCollapsed(false);
    topVisibleRowRef.current = null;
    initialAnchorAppliedRef.current = false;
  }, [chatId]);

  const scrollToBottom = (animated = true) => {
    if (!flatListRef.current) return;
    flatListRef.current.scrollToOffset({ offset: 0, animated });
    setIsAtBottom(true);
    setNewMessageCount(0);
    if (chatId) {
      setUnreadUIState(chatId, { floatingBadgeVisible: false });
    }
  };

  // Smart auto-scroll: only scroll if at bottom OR own message
  useEffect(() => {
    if (chatMessages.length === 0) {
      previousMessageIdsRef.current = [];
      return;
    }

    const messageIds = chatMessages.map((msg) => msg.id);

    if (initialLoadRef.current) {
      previousMessageIdsRef.current = messageIds;
      initialLoadRef.current = false;
      return;
    }

    const previousIds = previousMessageIdsRef.current;
    const previousSet = new Set(previousIds);
    const newIds = messageIds.filter((id) => !previousSet.has(id));

    if (newIds.length > 0) {
      const newMessages = chatMessages.filter((msg) => newIds.includes(msg.id));
      const hasOwnMessage = newMessages.some((msg) => msg.senderId === user?.uid);
      const newFromOthers = newMessages.filter((msg) => msg.senderId !== user?.uid);

      if (hasOwnMessage || isAtBottom) {
        scrollToBottom();
      } else if (newFromOthers.length > 0) {
        setNewMessageCount((prev) => prev + newFromOthers.length);
        if (chatId) {
          setUnreadUIState(chatId, { floatingBadgeVisible: true });
        }
      }

      if (
        chatId &&
        unreadUIState?.separatorVisible &&
        unreadUIState.separatorAcknowledged &&
        unreadUIState.separatorReady &&
        newFromOthers.length > 0
      ) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setUnreadUIState(chatId, {
          separatorVisible: false,
          floatingBadgeVisible: false,
          anchorMessageId: null,
          separatorAcknowledged: false,
          separatorReady: false,
          lastUnreadCount: 0,
        });
      }
    }

    previousMessageIdsRef.current = messageIds;
  }, [
    chatId,
    chatMessages,
    isAtBottom,
    setUnreadUIState,
    unreadUIState?.lastUnreadCount,
    unreadUIState?.separatorAcknowledged,
    unreadUIState?.separatorVisible,
    user?.uid,
  ]);

  const hasStoredUnreadBadge =
    (unreadUIState?.floatingBadgeVisible ?? false) &&
    (unreadUIState?.lastUnreadCount ?? 0) > 0;

  const showNewMessageIndicator =
    !isAtBottom && (newMessageCount > 0 || hasStoredUnreadBadge);

  const newMessageBadgeCount =
    newMessageCount > 0
      ? newMessageCount
      : unreadCount > 0
      ? unreadCount
      : unreadUIState?.lastUnreadCount ?? 0;

  // Handle typing indicator
  const handleTextChange = (text: string) => {
    setInputText(text);

    if (!user) return;

    // Set typing to true
    if (!isTyping) {
      setIsTyping(true);
      setTyping(chatId, user.uid, true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2s
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTyping(chatId, user.uid, false);
    }, 2000);
  };

  const handleSend = async () => {
    if (!user || !chatId || !inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    setTyping(chatId, user.uid, false);

    try {
      await sendMessage(chatId, user.uid, messageText);

      console.log('📜 [ChatScreen] Scrolling to bottom after sending message');
      scrollToBottom();

      if (
        unreadUIState?.separatorVisible &&
        unreadUIState.separatorAcknowledged &&
        chatId &&
        unreadUIState.separatorReady
      ) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setUnreadUIState(chatId, {
          separatorVisible: false,
          floatingBadgeVisible: false,
          anchorMessageId: null,
          separatorAcknowledged: false,
          separatorReady: false,
          lastUnreadCount: 0,
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle navigation from AI insight cards
  const handleInsightAction = (action: { type: 'calendar' | 'decisions'; data?: any }) => {
    console.log('🎯 [ChatScreen] Insight action:', action);

    if (action.type === 'calendar') {
      // Navigate to Calendar tab, passing source chat for back navigation
      router.push(`/(tabs)/calendar?fromChat=${chatId}`);
    } else if (action.type === 'decisions') {
      // Navigate to Decisions tab with filter and source chat
      const filter = action.data?.filter || 'all';
      router.push(`/(tabs)/decisions?filter=${filter}&fromChat=${chatId}`);
    }
  };

  // Format last seen
  const getLastSeenText = () => {
    if (otherUserOnline) return 'online';
    if (!otherUserLastSeen) return '';

    const now = new Date();
    const diff = now.getTime() - otherUserLastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'last seen just now';
    if (minutes < 60) return `last seen ${minutes}m ago`;
    if (hours < 24) return `last seen ${hours}h ago`;
    if (days === 1) return 'last seen yesterday';
    return `last seen ${days}d ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#000' }}>
                {getChatDisplayName()}
              </Text>
              {currentChat?.type === 'one-on-one' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  {otherUserOnline && (
                    <View style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#25D366',
                      marginRight: 4,
                    }} />
                  )}
                  <Text style={{ fontSize: 12, color: '#8E8E93' }}>
                    {getLastSeenText()}
                  </Text>
                </View>
              )}
            </View>
          ),
          headerBackTitle: 'Back',
          headerTintColor: '#007AFF',
          headerLeft: () => <BackButton />,
          headerRight: () => (
            <TouchableOpacity
              onPress={handleManualSummary}
              style={[
                styles.contextButton,
                summaryActive && styles.contextButtonActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Generate AI summary context"
            >
              <Ionicons
                name="sparkles"
                size={16}
                color={
                  summaryActive
                    ? '#FFFFFF'
                    : summaryStatus === 'loading'
                    ? '#8E8E93'
                    : '#0A84FF'
                }
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.contextButtonText,
                  summaryActive && styles.contextButtonTextActive,
                ]}
              >
                Context
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={flatListRef}
          data={messageRows}
          inverted
          renderItem={({ item }) => {
            if (item.type === 'day-header') {
              return (
                <View style={styles.dayHeader} onLayout={handleRowLayout(item.id)}>
                  <View style={styles.dayHeaderLine} />
                  <Text style={styles.dayHeaderText}>{item.label}</Text>
                  <View style={styles.dayHeaderLine} />
                </View>
              );
            }

            if (item.type === 'summary') {
              return (
                <View onLayout={handleRowLayout(item.id)}>
                  <ContextSummaryCard
                    collapsed={item.collapsed}
                    selectedPreset={selectedPreset}
                    options={summaryOptions}
                    onToggle={() => setSummaryCollapsed((prev) => !prev)}
                    onSelectPreset={handleSelectPreset}
                    onRetry={(presetId) => requestSummaryForPreset(presetId, { force: true })}
                  />
                </View>
              );
            }

            if (item.type === 'unread-separator') {
              const label = item.label ?? (item.unreadCount === 1 ? 'new message' : 'new messages');
              const displayCount = item.unreadCount;
              return (
                <View style={styles.unreadSeparator} onLayout={handleRowLayout(item.id)}>
                  <View style={styles.unreadLine} />
                  <Text style={styles.unreadText}>
                    {displayCount} {label.toUpperCase()}
                  </Text>
                  <View style={styles.unreadLine} />
                </View>
              );
            }

            const isOwnMessage = item.message.senderId === user?.uid;

            return (
              <View style={styles.messageRowWrapper} onLayout={handleRowLayout(item.id)}>
                <MessageBubble
                  message={item.message}
                  isOwnMessage={isOwnMessage}
                  chatParticipants={currentChat?.participants}
                  currentUserId={user?.uid}
                  isGroupTop={item.isGroupTop}
                  isGroupBottom={item.isGroupBottom}
                  isOptimistic={item.isOptimistic}
                />
                {item.message.aiExtraction && (
                  <AIInsightCard
                    message={item.message}
                    chatId={chatId!}
                    currentUserId={user?.uid || ''}
                    onNavigate={handleInsightAction}
                    onSendMessage={sendMessage}
                  />
                )}
              </View>
            );
          }}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
          getItemLayout={getItemLayout}
          initialNumToRender={40}
          maxToRenderPerBatch={20}
          windowSize={10}
          removeClippedSubviews={false}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 120,
          }}
          ListFooterComponent={
            loadingOlderForChat ? (
              <View style={styles.loadingOlderContainer}>
                <Text style={styles.loadingOlderText}>Loading older messages...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Send a message to start the conversation</Text>
            </View>
          }
        />

        {/* New messages indicator - show when scrolled up and new messages arrive */}
        {showNewMessageIndicator && (
          <TouchableOpacity
            style={styles.newMessageIndicator}
            onPress={() => scrollToBottom()}
            activeOpacity={0.7}
          >
            <Text style={styles.newMessageText}>
              {newMessageBadgeCount} new message
              {newMessageBadgeCount !== 1 ? 's' : ''}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        <TypingIndicator
          chatId={chatId}
          currentUserId={user?.uid || ''}
          participantDetails={currentChat?.participantDetails}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            multiline
            maxLength={1000}
            testID="message-input"
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            testID="send-button"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE5DD', // WhatsApp beige background
  },
  contextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F8FF',
  },
  contextButtonActive: {
    backgroundColor: '#0A84FF',
  },
  contextButtonText: {
    color: '#0A84FF',
    fontWeight: '600',
    fontSize: 13,
  },
  contextButtonTextActive: {
    color: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  messageList: {
    paddingVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    paddingTop: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    lineHeight: 20,
    backgroundColor: '#F8F9FA',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 120,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#3C3C43',
    letterSpacing: 0.1,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  newMessageIndicator: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366', // WhatsApp green
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    gap: 6,
  },
  newMessageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  loadingOlderContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingOlderText: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  messageRowWrapper: {
    paddingHorizontal: 0,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  dayHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D8D8DC',
  },
  dayHeaderText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: '#6E6E73',
    textTransform: 'uppercase',
  },
  unreadSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#ECE5DD', // Match WhatsApp background
  },
  unreadLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#34C759', // Green line
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: '#34C759', // iOS green
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    marginHorizontal: 8,
  },
});
