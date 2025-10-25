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
} from 'react-native';
import { useEffect, useState, useRef, useMemo } from 'react';
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

const estimateRowHeight = (row: MessageRow): number => {
  switch (row.type) {
    case 'day-header':
      return 40;
    case 'unread-separator':
      return 56;
    case 'message':
    default:
      return 96;
  }
};

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

  const resolvedChatId = chatId ?? '__missing__';
  const {
    rows: messageRows,
    messages: chatMessages,
    unreadCount,
  } = useChatMessageView(resolvedChatId, user?.uid);
  const loadingOlderForChat = chatId ? loadingOlder[chatId] : false;
  const hasMoreForChat = chatId ? hasMoreMessages[chatId] : false;
  const rowHeightsRef = useRef<Map<string, number>>(new Map());
  const [layoutVersion, setLayoutVersion] = useState(0);

  const handleRowLayout = (rowId: string) => (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height <= 0) return;
    const cached = rowHeightsRef.current.get(rowId);
    if (cached !== height) {
      rowHeightsRef.current.set(rowId, height);
      setLayoutVersion((version) => version + 1);
    }
  };

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

  const getItemLayout = (_data: MessageRow[] | null | undefined, index: number) => {
    const row = messageRows[index];
    if (!row) {
      return { length: 0, offset: 0, index };
    }
    const length = layoutMap.lengths.get(row.id) ?? estimateRowHeight(row);
    const offset = layoutMap.offsets.get(row.id) ?? 0;
    return { length, offset, index };
  };

  // Get current chat details
  const currentChat = chats.find((chat) => chat.id === chatId);

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

  // Mark unread messages as read (only mark new messages, not all messages every time)
  useEffect(() => {
    if (!user || chatMessages.length === 0) return;

    chatMessages.forEach((msg) => {
      // Skip if we've already marked this message as read
      if (markedAsReadRef.current.has(msg.id)) return;

      // Skip if it's our own message or already read by us
      if (msg.senderId === user.uid || msg.readBy.includes(user.uid)) {
        markedAsReadRef.current.add(msg.id);
        return;
      }

      // Mark as read and track it
      markAsRead(chatId, msg.id, user.uid);
      markedAsReadRef.current.add(msg.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages, user?.uid, chatId]); // Zustand function removed from deps

  // Clear state when switching chats
  useEffect(() => {
    markedAsReadRef.current.clear();
    previousMessageIdsRef.current = [];
    initialLoadRef.current = true;
    setIsAtBottom(true);
    setNewMessageCount(0);
  }, [chatId]);

  const scrollToBottom = (animated = true) => {
    if (!flatListRef.current) return;
    flatListRef.current.scrollToOffset({ offset: 0, animated });
    setIsAtBottom(true);
    setNewMessageCount(0);
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
      }
    }

    previousMessageIdsRef.current = messageIds;
  }, [chatMessages, isAtBottom, user?.uid]);

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

            if (item.type === 'unread-separator') {
              return (
                <View style={styles.unreadSeparator} onLayout={handleRowLayout(item.id)}>
                  <View style={styles.unreadLine} />
                  <Text style={styles.unreadText}>
                    {item.unreadCount} UNREAD MESSAGE{item.unreadCount !== 1 ? 'S' : ''}
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
        {!isAtBottom && newMessageCount > 0 && (
          <TouchableOpacity
            style={styles.newMessageIndicator}
            onPress={() => scrollToBottom()}
            activeOpacity={0.7}
          >
            <Text style={styles.newMessageText}>
              {newMessageCount} new message{newMessageCount !== 1 ? 's' : ''}
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
