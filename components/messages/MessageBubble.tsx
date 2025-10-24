import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/types/message';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  chatParticipants?: string[]; // All participants in the chat
  currentUserId?: string; // Current user's ID
}

export default function MessageBubble({
  message,
  isOwnMessage,
  showAvatar = false,
  chatParticipants = [],
  currentUserId,
}: MessageBubbleProps) {

  // Compute actual message status based on readBy array
  const getActualStatus = (): Message['status'] => {
    // Failed messages
    if (message.status === 'failed') return 'failed';

    // Sending messages (optimistic UI)
    if (message.status === 'sending') return 'sending';

    // For own messages, compute status based on who has read it
    if (isOwnMessage && currentUserId) {
      const otherParticipants = chatParticipants.filter(id => id !== currentUserId);

      if (otherParticipants.length === 0) {
        return 'sent'; // No other participants (shouldn't happen)
      }

      // Check how many other participants have read the message
      const readByOthers = otherParticipants.filter(id => message.readBy.includes(id));

      if (readByOthers.length === otherParticipants.length) {
        // All other participants have read it
        return 'read';
      } else if (readByOthers.length > 0) {
        // Some (but not all) have read it - show as read in group, delivered in 1-on-1
        return otherParticipants.length === 1 ? 'read' : 'read'; // Blue checkmarks when anyone reads
      } else {
        // Message delivered but not read yet
        return 'delivered';
      }
    }

    return message.status;
  };

  const actualStatus = getActualStatus();

  const getStatusIcon = () => {
    switch (actualStatus) {
      case 'sending':
        return <Ionicons name="time-outline" size={14} color="rgba(0,0,0,0.4)" />;
      case 'sent':
        return <Ionicons name="checkmark" size={14} color="rgba(0,0,0,0.4)" />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={14} color="rgba(0,0,0,0.4)" />;
      case 'read':
        return <Ionicons name="checkmark-done" size={14} color="#4FC3F7" />; // WhatsApp blue
      case 'failed':
        return <Ionicons name="alert-circle" size={14} color="#FF3B30" />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, isOwnMessage && styles.ownMessageContainer]}>
      {!isOwnMessage && showAvatar && (
        <View style={styles.avatarPlaceholder} />
      )}

      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
          actualStatus === 'failed' && styles.failedBubble,
        ]}
      >
        <Text
          style={[styles.text, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}
        >
          {message.text}
        </Text>
        <View style={styles.footer}>
          <Text style={[
            styles.timestamp,
            isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp
          ]}>
            {message.timestamp.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
          {isOwnMessage && (
            <View style={styles.statusIcon}>
              {getStatusIcon()}
            </View>
          )}
        </View>
      </View>

      {isOwnMessage && showAvatar && (
        <View style={styles.avatarPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 8,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.08,
    shadowRadius: 1.5,
    elevation: 1,
  },
  ownMessageBubble: {
    backgroundColor: '#DCF8C6', // WhatsApp green
    borderBottomRightRadius: 2,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF', // WhatsApp white
    borderBottomLeftRadius: 2,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  failedBubble: {
    backgroundColor: '#FFE5E5',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  ownMessageText: {
    color: '#000000', // WhatsApp uses black text on green
  },
  otherMessageText: {
    color: '#000000',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 4,
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0,
  },
  ownTimestamp: {
    color: 'rgba(0,0,0,0.45)', // WhatsApp timestamp on green
  },
  otherTimestamp: {
    color: 'rgba(0,0,0,0.45)',
  },
  statusIcon: {
    marginLeft: 2,
  },
});
