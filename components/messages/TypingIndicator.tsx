import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';

interface TypingIndicatorProps {
  chatId: string;
  currentUserId: string;
  participantDetails?: { [userId: string]: { displayName: string; photoURL?: string } };
}

export default function TypingIndicator({ chatId, currentUserId, participantDetails }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!chatId) return;

    const chatRef = doc(firestore, 'chats', chatId);
    const unsubscribe = onSnapshot(chatRef, (doc) => {
      const data = doc.data();
      if (!data?.typing) {
        setTypingUsers([]);
        return;
      }

      const typing = data.typing;
      const now = Date.now();

      // Filter typing users (exclude current user, check timestamp)
      const activeTypingUsers = Object.keys(typing).filter((userId) => {
        if (userId === currentUserId) return false;
        const timestamp = typing[userId];
        if (!timestamp) return false;

        // Handle Firestore Timestamp object
        const timestampMs = timestamp.toMillis ? timestamp.toMillis() : timestamp;
        return now - timestampMs < 3000; // 3 second window
      });

      setTypingUsers(activeTypingUsers);
    });

    return () => unsubscribe();
  }, [chatId, currentUserId]);

  if (typingUsers.length === 0) {
    return null;
  }

  // Get display names for typing users
  const getTypingText = () => {
    if (typingUsers.length === 1) {
      const userId = typingUsers[0];
      const displayName = participantDetails?.[userId]?.displayName || 'Someone';
      return `${displayName} is typing...`;
    } else if (typingUsers.length === 2) {
      const name1 = participantDetails?.[typingUsers[0]]?.displayName || 'Someone';
      const name2 = participantDetails?.[typingUsers[1]]?.displayName || 'Someone';
      return `${name1} and ${name2} are typing...`;
    } else {
      return `${typingUsers.length} people are typing...`;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{getTypingText()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
});
