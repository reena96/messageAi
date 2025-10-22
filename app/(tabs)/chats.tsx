import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useChatStore } from '@/lib/store/chatStore';
import { useAuthStore } from '@/lib/store/authStore';
import ConnectionStatus from '@/components/common/ConnectionStatus';
import { Chat } from '@/types/chat';

export default function ChatsScreen() {
  const { chats, loading, subscribeToChats } = useChatStore();
  const { user } = useAuthStore();

  // Set up real-time chat subscription
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToChats(user.uid);

    // Cleanup on unmount
    return () => {
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

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{displayName}</Text>
          {item.lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage.text}
            </Text>
          )}
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
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
});
