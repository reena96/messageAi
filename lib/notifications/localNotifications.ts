import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Android notification channels
export const NOTIFICATION_CHANNELS = {
  DEFAULT: {
    id: 'default',
    name: 'Messages',
    description: 'New message notifications',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  },
  HIGH_PRIORITY: {
    id: 'high-priority',
    name: 'Urgent Messages',
    description: 'High priority and urgent messages',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  },
};

/**
 * Set up Android notification channels
 */
async function setupAndroidChannels() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(
      NOTIFICATION_CHANNELS.DEFAULT.id,
      NOTIFICATION_CHANNELS.DEFAULT
    );
    await Notifications.setNotificationChannelAsync(
      NOTIFICATION_CHANNELS.HIGH_PRIORITY.id,
      NOTIFICATION_CHANNELS.HIGH_PRIORITY
    );
  }
}

/**
 * Request notification permissions
 * @returns Promise<boolean> - Whether permission was granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ [Notifications] Permission denied');
      return false;
    }

    console.log('✅ [Notifications] Permission granted');

    // Set up Android notification channels
    await setupAndroidChannels();

    return true;
  } catch (error) {
    console.error('❌ [Notifications] Error requesting permission:', error);
    return false;
  }
}

/**
 * Schedule a local notification for a new message
 * @param chatId - The chat ID
 * @param messageText - The message text
 * @param senderName - The sender's name
 * @param isGroup - Whether this is a group chat
 * @param isHighPriority - Whether this is a high priority message
 * @returns Promise<string> - The notification identifier
 */
export async function scheduleMessageNotification(
  chatId: string,
  messageText: string,
  senderName: string,
  isGroup: boolean = false,
  isHighPriority: boolean = false
): Promise<string> {
  try {
    // Truncate message text if too long
    const truncatedText = messageText.length > 100
      ? messageText.substring(0, 97) + '...'
      : messageText;

    // Build notification content
    const title = senderName;
    const body = isGroup ? truncatedText : truncatedText;

    // Choose channel based on priority
    const channelId = isHighPriority
      ? NOTIFICATION_CHANNELS.HIGH_PRIORITY.id
      : NOTIFICATION_CHANNELS.DEFAULT.id;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          chatId,
          type: 'new_message',
          priority: isHighPriority ? 'high' : 'normal',
        },
        sound: 'default',
        ...(Platform.OS === 'android' && {
          channelId,
        }),
      },
      trigger: null, // Schedule immediately
    });

    console.log('✅ [Notifications] Scheduled notification:', identifier);
    return identifier;
  } catch (error) {
    console.error('❌ [Notifications] Error scheduling notification:', error);
    throw error;
  }
}

/**
 * Get the notification that launched the app (if any)
 * @returns Promise<Notifications.Notification | null>
 */
export async function getInitialNotification(): Promise<Notifications.Notification | null> {
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    return response?.notification || null;
  } catch (error) {
    console.error('❌ [Notifications] Error getting initial notification:', error);
    return null;
  }
}

/**
 * Extract chatId from notification data
 * @param notification - The notification
 * @returns string | null - The chatId if present
 */
export function getChatIdFromNotification(
  notification: Notifications.Notification
): string | null {
  return notification.request.content.data?.chatId as string | null;
}

/**
 * Set badge count
 * @param count - The badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('❌ [Notifications] Error setting badge count:', error);
  }
}

/**
 * Get current badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('❌ [Notifications] Error getting badge count:', error);
    return 0;
  }
}

/**
 * Clear all notifications from the notification tray
 */
export async function clearAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
    console.log('✅ [Notifications] Cleared all notifications');
  } catch (error) {
    console.error('❌ [Notifications] Error clearing notifications:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ [Notifications] Cancelled all scheduled notifications');
  } catch (error) {
    console.error('❌ [Notifications] Error cancelling notifications:', error);
  }
}
