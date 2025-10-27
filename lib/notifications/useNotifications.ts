import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import {
  getInitialNotification,
  getChatIdFromNotification,
} from './localNotifications';

/**
 * Hook to handle notification navigation
 * Listens for notification taps and navigates to the appropriate chat
 */
export function useNotifications() {
  const router = useRouter();
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  useEffect(() => {
    // Handle notification that opened the app (cold start)
    getInitialNotification().then((notification) => {
      if (notification) {
        const chatId = getChatIdFromNotification(notification);
        if (chatId) {
          console.log('📱 [Notifications] Opening app from notification:', chatId);
          // Use replace to avoid navigation stack issues on cold start
          router.replace(`/chat/${chatId}`);
        }
      }
    });

    // Listen for notification taps (app in foreground or background)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const notification = response.notification;
        const chatId = getChatIdFromNotification(notification);

        if (chatId) {
          console.log('🔔 [Notifications] User tapped notification:', chatId);
          router.push(`/chat/${chatId}`);
        }
      }
    );

    // Cleanup
    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);
}
