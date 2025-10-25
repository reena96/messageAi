import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/types/message';
import { useMessageStore } from '@/lib/store/messageStore';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  chatParticipants?: string[]; // All participants in the chat
  currentUserId?: string; // Current user's ID
  isGroupTop?: boolean;
  isGroupBottom?: boolean;
  isOptimistic?: boolean;
}

export default function MessageBubble({
  message,
  isOwnMessage,
  showAvatar = false,
  chatParticipants = [],
  currentUserId,
  isGroupTop = true,
  isGroupBottom = true,
  isOptimistic = false,
}: MessageBubbleProps) {
  const retryMessage = useMessageStore((state) => state.retryMessage);

  const handleRetry = async () => {
    console.log('🔄 [MessageBubble] Retry button tapped for message:', message.id || message.tempId);
    try {
      await retryMessage(message.chatId, message.id || message.tempId!);
      console.log('✅ [MessageBubble] Retry successful');
    } catch (error) {
      console.error('❌ [MessageBubble] Retry failed:', error);
    }
  };

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
  const optimisticStatus = message.optimisticStatus;
  const isPendingOptimistic =
    optimisticStatus === 'pending' || actualStatus === 'sending';
  const isAwaitingResolution =
    optimisticStatus && optimisticStatus !== 'confirmed';

  const statusSpokenLabel = (() => {
    switch (actualStatus) {
      case 'sending':
        return 'Sending';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return 'Read';
      case 'failed':
        return 'Failed to send';
      default:
        return 'Status unknown';
    }
  })();

  const accessibilityLabel = `${isOwnMessage ? 'You' : 'Contact'} said: ${message.text}. Status: ${statusSpokenLabel}.`;
  const accessibilityHint =
    actualStatus === 'failed'
      ? 'Double tap to retry sending this message.'
      : isPendingOptimistic
      ? 'Message is being sent.'
      : undefined;
  const accessibilityState = isPendingOptimistic ? { busy: true } : undefined;
  const accessibilityLiveRegion = isAwaitingResolution ? 'polite' : undefined;

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
    <View style={[
      styles.container,
      isOwnMessage && styles.ownMessageContainer,
      !isGroupBottom && styles.groupedContainer,
    ]}>
      {!isOwnMessage && showAvatar && (
        <View style={styles.avatarPlaceholder} />
      )}

      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
          !isGroupTop && (isOwnMessage ? styles.ownGroupedTop : styles.otherGroupedTop),
          !isGroupBottom && (isOwnMessage ? styles.ownGroupedBottom : styles.otherGroupedBottom),
          isOptimistic && styles.optimisticBubble,
          actualStatus === 'failed' && styles.failedBubble,
        ]}
        accessible
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={accessibilityState}
        accessibilityLiveRegion={accessibilityLiveRegion}
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

        {/* Retry button for failed messages */}
        {actualStatus === 'failed' && isOwnMessage && (
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        )}

        {/* Error message for failed messages */}
        {actualStatus === 'failed' && isOwnMessage && message.error && (
          <Text style={styles.errorText}>{message.error}</Text>
        )}
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
  groupedContainer: {
    marginBottom: 4,
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
  ownGroupedTop: {
    borderTopRightRadius: 4,
  },
  ownGroupedBottom: {
    borderBottomRightRadius: 4,
    marginTop: 2,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF', // WhatsApp white
    borderBottomLeftRadius: 2,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  otherGroupedTop: {
    borderTopLeftRadius: 4,
  },
  otherGroupedBottom: {
    borderBottomLeftRadius: 4,
    marginTop: 2,
  },
  failedBubble: {
    backgroundColor: '#FFE5E5',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  optimisticBubble: {
    opacity: 0.8,
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
  retryButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 4,
    fontSize: 11,
    color: '#FF3B30',
    fontStyle: 'italic',
  },
});
