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
} from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/authStore';
import { useMessageStore } from '@/lib/store/messageStore';
import { useChatStore } from '@/lib/store/chatStore';
import MessageBubble from '@/components/messages/MessageBubble';
import TypingIndicator from '@/components/messages/TypingIndicator';

export default function ChatScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { messages, subscribeToMessages, sendMessage, markAsRead, clearUnreadCount, setActivelyViewing, setTyping } = useMessageStore();
  const { chats } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserLastSeen, setOtherUserLastSeen] = useState<Date | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const markedAsReadRef = useRef<Set<string>>(new Set()); // Track which messages we've already marked as read
  const hasScrolledToUnreadRef = useRef(false); // Track if we've scrolled to unread on initial load
  const initialUnreadIndexRef = useRef<number>(-1); // Save initial unread index
  const initialUnreadCountRef = useRef<number>(0); // Save initial unread count

  const chatMessages = messages[chatId] || [];

  // Get current chat details FIRST (need this for unread count)
  const currentChat = chats.find((chat) => chat.id === chatId);

  // Get chat-level unread count BEFORE we clear it
  const chatLevelUnreadCount = currentChat?.unreadCount?.[user?.uid || ''] || 0;

  // Find the first unread message for the current user (current state)
  const currentUnreadIndex = chatMessages.findIndex(
    (msg) => msg.senderId !== user?.uid && !msg.readBy.includes(user?.uid || '')
  );

  // Use saved initial values for display
  const firstUnreadIndex = initialUnreadIndexRef.current;
  const unreadCount = initialUnreadCountRef.current;

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

  // Capture initial unread state BEFORE marking messages as read
  useEffect(() => {
    if (!user || chatMessages.length === 0) return;

    // Only capture once when messages first load
    if (initialUnreadIndexRef.current === -1) {
      // Find first unread message by iterating through ALL messages
      let foundIndex = -1;
      let foundCount = 0;

      for (let i = 0; i < chatMessages.length; i++) {
        const msg = chatMessages[i];
        const isUnread = msg.senderId !== user.uid && !msg.readBy.includes(user.uid);

        if (isUnread) {
          foundCount++;
          if (foundIndex === -1) {
            foundIndex = i; // First unread message index
          }
        }
      }

      if (foundIndex !== -1) {
        initialUnreadIndexRef.current = foundIndex;
        initialUnreadCountRef.current = foundCount;
      } else if (chatLevelUnreadCount > 0) {
        // Fallback: use chat-level count
        // Find the Nth message from the end where N = chatLevelUnreadCount
        const estimatedIndex = Math.max(0, chatMessages.length - chatLevelUnreadCount);
        initialUnreadIndexRef.current = estimatedIndex;
        initialUnreadCountRef.current = chatLevelUnreadCount;
      }
    }
  }, [chatMessages.length, user, chatLevelUnreadCount]);

  // Clear marked-as-read tracking when switching chats
  useEffect(() => {
    markedAsReadRef.current.clear();
    hasScrolledToUnreadRef.current = false; // Reset scroll tracking
    initialUnreadIndexRef.current = -1; // Reset unread index
    initialUnreadCountRef.current = 0; // Reset unread count
  }, [chatId]);

  // Scroll to first unread message or bottom on initial load
  useEffect(() => {
    if (!user || chatMessages.length === 0 || hasScrolledToUnreadRef.current) return;

    // Use requestAnimationFrame for smooth, immediate scroll on next frame
    const animationFrame = requestAnimationFrame(() => {
      const scrollTimeout = setTimeout(() => {
        if (firstUnreadIndex !== -1) {
          // There are unread messages - scroll to center of screen (WhatsApp style)
          try {
            flatListRef.current?.scrollToIndex({
              index: firstUnreadIndex,
              animated: false,
              viewPosition: 0.5, // Position at CENTER of screen - shows context above and unread below
            });
          } catch (error) {
            // If scrollToIndex fails, fallback to scrollToEnd
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        } else {
          // No unread messages - scroll to bottom
          flatListRef.current?.scrollToEnd({ animated: false });
        }
        hasScrolledToUnreadRef.current = true;
      }, 50); // Reduced delay for faster initial render

      return () => clearTimeout(scrollTimeout);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [chatMessages.length, firstUnreadIndex, user]);

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
    if (!user || !inputText.trim()) return;

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

      // Scroll to bottom after sending (user sent a message)
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    } catch (error) {
      console.error('Failed to send message:', error);
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
        }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          renderItem={({ item, index }) => {
            const shouldShowSeparator = index === firstUnreadIndex && firstUnreadIndex !== -1;

            return (
              <>
                {/* Show "Unread Messages" separator before first unread message */}
                {shouldShowSeparator && (
                  <View style={styles.unreadSeparator}>
                    <View style={styles.unreadLine} />
                    <Text style={styles.unreadText}>
                      {unreadCount} UNREAD MESSAGE{unreadCount !== 1 ? 'S' : ''}
                    </Text>
                    <View style={styles.unreadLine} />
                  </View>
                )}
                <MessageBubble
                  message={item}
                  isOwnMessage={item.senderId === user?.uid}
                  chatParticipants={currentChat?.participants}
                  currentUserId={user?.uid}
                />
              </>
            );
          }}
          keyExtractor={(item) => item.id || item.tempId || ''}
          contentContainerStyle={styles.messageList}
          onScrollToIndexFailed={(info) => {
            // Handle out of range - retry after a delay
            const wait = new Promise((resolve) => setTimeout(resolve, 100));
            wait.then(() => {
              if (info.index < chatMessages.length) {
                flatListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: false,
                  viewPosition: 0.5, // Center position for consistency
                });
              } else {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            });
          }}
          initialNumToRender={50}
          maxToRenderPerBatch={20}
          windowSize={10}
          removeClippedSubviews={false}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Send a message to start the conversation</Text>
            </View>
          }
        />

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
