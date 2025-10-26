import { useCallback, useMemo } from 'react';
import {
  useMessageStore,
  MessageState,
  DEFAULT_UNREAD_UI_STATE,
} from './messageStore';
import { Message } from '@/types/message';
import { MessageListViewModel, MessageRow } from '@/types/messageRow';

const GROUPING_WINDOW_MS = 2 * 60 * 1000;
const EMPTY_MESSAGES: Message[] = [];

const pad = (value: number) => value.toString().padStart(2, '0');

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatDayLabel = (date: Date) => {
  const today = new Date();
  if (isSameDay(date, today)) {
    return 'Today';
  }

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

const isWithinGroupingWindow = (a?: Message, b?: Message) => {
  if (!a || !b) return false;
  return Math.abs(a.timestamp.getTime() - b.timestamp.getTime()) <= GROUPING_WINDOW_MS;
};

export const useChatMessageView = (
  chatId: string,
  currentUserId?: string
): MessageListViewModel => {
  const selectMessages = useCallback(
    (state: MessageState) => state.messages[chatId] ?? EMPTY_MESSAGES,
    [chatId]
  );
  const selectUnreadUI = useCallback(
    (state: MessageState) => state.unreadUI[chatId],
    [chatId]
  );

  const messages = useMessageStore(selectMessages);
  const unreadUI = useMessageStore(selectUnreadUI);

  return useMemo(() => {
    const rows: MessageRow[] = [];
    if (messages.length === 0) {
      return {
        rows,
        messages,
        unreadCount: 0,
        firstUnreadMessageId: null,
        firstUnreadIndex: null,
      };
    }

    let unreadCount = 0;
    let firstUnreadIndex: number | null = null;

    if (currentUserId) {
      messages.forEach((message, index) => {
        const isUnread =
          message.senderId !== currentUserId &&
          !message.readBy.includes(currentUserId);

        if (isUnread) {
          unreadCount += 1;
          if (firstUnreadIndex === null) {
            firstUnreadIndex = index;
          }
        }
      });
    }

    let unreadInserted = false;
    let lastDateKey: string | null = null;

    const persistedUnreadUI = unreadUI ?? DEFAULT_UNREAD_UI_STATE;

    let separatorIndex: number | null = null;

    if (persistedUnreadUI.separatorVisible) {
      if (persistedUnreadUI.anchorMessageId) {
        const anchorIdx = messages.findIndex(
          (msg) => msg.id === persistedUnreadUI.anchorMessageId
        );
        if (anchorIdx !== -1) {
          separatorIndex = anchorIdx;
        }
      }
      if (separatorIndex === null && firstUnreadIndex !== null) {
        separatorIndex = firstUnreadIndex;
      }
    } else if (unreadCount > 0 && firstUnreadIndex !== null) {
      separatorIndex = firstUnreadIndex;
    }

    const displayUnreadCount = persistedUnreadUI.lastUnreadCount;

    messages.forEach((message, index) => {
      const dateKey = getDateKey(message.timestamp);
      if (dateKey !== lastDateKey) {
        rows.push({
          type: 'day-header',
          id: `day-${chatId}-${dateKey}`,
          dateKey,
          label: formatDayLabel(message.timestamp),
        });
        lastDateKey = dateKey;
      }

      const isUnread =
        !!currentUserId &&
        message.senderId !== currentUserId &&
        !message.readBy.includes(currentUserId);

      const shouldInsertSeparator =
        separatorIndex !== null &&
        !unreadInserted &&
        index === separatorIndex &&
        persistedUnreadUI.separatorVisible &&
        persistedUnreadUI.separatorReady;

      if (shouldInsertSeparator) {
        rows.push({
          type: 'unread-separator',
          id: `unread-${chatId}`,
          unreadCount: displayUnreadCount,
        });
        unreadInserted = true;
      }

      const prevMessage = index > 0 ? messages[index - 1] : undefined;
      const nextMessage = index < messages.length - 1 ? messages[index + 1] : undefined;

      const sameSenderAsPrev = prevMessage?.senderId === message.senderId;
      const sameSenderAsNext = nextMessage?.senderId === message.senderId;

      const isGroupBottom = !(sameSenderAsPrev && isWithinGroupingWindow(prevMessage, message));
      const isGroupTop = !(sameSenderAsNext && isWithinGroupingWindow(nextMessage, message));

      rows.push({
        type: 'message',
        id: message.id,
        message,
        isGroupTop,
        isGroupBottom,
        isOptimistic:
          message.optimisticStatus === 'pending' ||
          message.status === 'sending' ||
          (!message.optimisticStatus && Boolean(message.tempId)),
      });
    });

    const firstUnreadMessageId =
      unreadCount > 0
        ? messages[firstUnreadIndex ?? -1]?.id ?? null
        : separatorIndex !== null
        ? messages[separatorIndex]?.id ?? null
        : null;

    return {
      rows,
      messages,
      unreadCount,
      firstUnreadMessageId,
      firstUnreadIndex,
    };
  }, [chatId, currentUserId, messages, unreadUI]);
};
