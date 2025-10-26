import { useCallback, useMemo } from 'react';
import { useMessageStore, MessageState } from './messageStore';
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

  const messages = useMessageStore(selectMessages);

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
        unreadCount > 0 &&
        !unreadInserted &&
        firstUnreadIndex !== null &&
        index === firstUnreadIndex;

      if (shouldInsertSeparator) {
        rows.push({
          type: 'unread-separator',
          id: `unread-${chatId}`,
          unreadCount,
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
      firstUnreadIndex !== null ? messages[firstUnreadIndex]?.id ?? null : null;

    return {
      rows,
      messages,
      unreadCount,
      firstUnreadMessageId,
      firstUnreadIndex,
    };
  }, [chatId, currentUserId, messages]);
};
