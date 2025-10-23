import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useChatStore } from '@/lib/store/chatStore';
import { useAuthStore } from '@/lib/store/authStore';
import ConnectionStatus from '@/components/common/ConnectionStatus';
import { Chat } from '@/types/chat';
import { debugLog } from '@/lib/utils/debug';

export default function ChatsScreen() {
  const { chats, loading, subscribeToChats } = useChatStore();
  const { user } = useAuthStore();

  debugLog('💬 [ChatsScreen] Render:', {
    hasUser: !!user,
    userId: user?.uid,
    chatsCount: chats.length,
    loading,
  });

  // Set up real-time chat subscription
  useEffect(() => {
    debugLog('💬 [ChatsScreen] useEffect triggered:', {
      hasUser: !!user,
      userId: user?.uid,
    });

    if (!user) {
      debugLog('💬 [ChatsScreen] No user, skipping subscription');
      return;
    }

    debugLog('💬 [ChatsScreen] Calling subscribeToChats for user:', user.uid);
    const unsubscribe = subscribeToChats(user.uid);

    // Cleanup on unmount
    return () => {
      debugLog('💬 [ChatsScreen] Cleaning up chat subscription');
      unsubscribe();
    };
  }, [user, subscribeToChats]);

  const renderChatItem = ({ item }: { item: Chat }) => {
    // Determine display name
    let displayName = '';
    if (item.type === 'group') {
      displayName = item.groupName || 'Group Chat';
    } else {
      // One-on-one chat - find the other user
      const otherUserId = item.participants.find((id) => id !== user?.uid);
      if (otherUserId && item.participantDetails[otherUserId]) {
        displayName = item.participantDetails[otherUserId].displayName;
      }
    }

    // Get first letter for avatar
    const avatarLetter = displayName.charAt(0).toUpperCase();

    // Get unread count for current user
    const unreadCount = user ? item.unreadCount[user.uid] || 0 : 0;

    // Format timestamp
    const formatTimestamp = (date: Date) => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });
      } else if (days === 1) {
        return 'Yesterday';
      } else if (days < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }
    };

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push(`/chat/${item.id}`)}
        activeOpacity={0.6}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {displayName}
            </Text>
            {item.lastMessage && (
              <Text style={styles.timestamp}>
                {formatTimestamp(item.lastMessage.timestamp)}
              </Text>
            )}
          </View>
          <View style={styles.chatFooter}>
            {item.lastMessage && (
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage.text}
              </Text>
            )}
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && chats.length === 0) {
    return (
      <View style={styles.container}>
        <ConnectionStatus />
        <View style={styles.centered}>
          <Text style={styles.text}>Loading chats...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ConnectionStatus />
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.text}>No chats yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  text: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '500',
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    letterSpacing: 0.1,
  },
  timestamp: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '400',
    marginLeft: 8,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 15,
    color: '#8E8E93',
    flex: 1,
    fontWeight: '400',
    lineHeight: 20,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
