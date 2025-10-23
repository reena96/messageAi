import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/types/message';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
}

export default function MessageBubble({ message, isOwnMessage, showAvatar = false }: MessageBubbleProps) {
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />;
      case 'sent':
        return <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.7)" />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" />;
      case 'read':
        return <Ionicons name="checkmark-done" size={14} color="#34C759" />;
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
          message.status === 'failed' && styles.failedBubble,
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
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 6,
  },
  otherMessageBubble: {
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 6,
  },
  failedBubble: {
    backgroundColor: '#FFE5E5',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  ownMessageText: {
    color: '#FFFFFF',
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
    letterSpacing: 0.05,
  },
  ownTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherTimestamp: {
    color: 'rgba(0,0,0,0.45)',
  },
  statusIcon: {
    marginLeft: 2,
  },
});
