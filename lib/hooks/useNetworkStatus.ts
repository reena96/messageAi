import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useMessageStore } from '@/lib/store/messageStore';

export function useNetworkStatus() {
  const retryQueue = useMessageStore((state) => state.retryQueue);
  const retryMessage = useMessageStore((state) => state.retryMessage);
  const messages = useMessageStore((state) => state.messages);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // When we go from offline to online
      if (state.isConnected && retryQueue.size > 0) {
        console.log(`📶 Back online. Retrying ${retryQueue.size} messages...`);

        // Retry all queued messages
        retryQueue.forEach((messageId) => {
          // Find the chat for this message
          for (const [chatId, chatMessages] of Object.entries(messages)) {
            const message = chatMessages.find(
              (m) => m.id === messageId || m.tempId === messageId
            );
            if (message) {
              retryMessage(chatId, messageId).catch((error) => {
                console.error('Retry failed:', error);
              });
              break;
            }
          }
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [retryQueue, retryMessage, messages]);
}
