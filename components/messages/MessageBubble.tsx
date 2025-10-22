import { View, Text, StyleSheet } from 'react-native';
import { Message } from '@/types/message';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const statusIcon = {
    sending: '○',
    sent: '✓',
    delivered: '✓✓',
    read: '✓✓',
    failed: '✗',
  }[message.status];

  const statusColor = {
    sending: '#999',
    sent: '#999',
    delivered: '#999',
    read: '#007AFF',
    failed: '#FF3B30',
  }[message.status];

  return (
    <View style={[styles.container, isOwnMessage && styles.ownMessageContainer]}>
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
          <Text style={styles.timestamp}>
            {message.timestamp.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
          {isOwnMessage && (
            <Text style={[styles.status, { color: statusColor }]}>{statusIcon}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#E9E9EB',
    borderBottomLeftRadius: 4,
  },
  failedBubble: {
    backgroundColor: '#FFE5E5',
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 4,
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.7,
    marginRight: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
