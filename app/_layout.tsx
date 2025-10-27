import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { debugLog } from '@/lib/utils/debug';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { useNotifications } from '@/lib/notifications/useNotifications';
import { requestNotificationPermissions } from '@/lib/notifications/localNotifications';

export default function RootLayout() {
  const setUser = useAuthStore((state) => state.setUser);

  // Enable auto-retry for failed messages
  useNetworkStatus();

  // Handle notification navigation
  useNotifications();

  useEffect(() => {
    debugLog('🔵 [RootLayout] Setting up auth state listener');

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      debugLog('🔵 [RootLayout] Auth state changed:', {
        isAuthenticated: !!user,
        uid: user?.uid,
        email: user?.email,
        displayName: user?.displayName,
      });
      setUser(user);

      // Request notification permissions after login
      if (user) {
        try {
          const granted = await requestNotificationPermissions();
          debugLog('🔔 [RootLayout] Notification permissions:', granted);
        } catch (error) {
          debugLog('❌ [RootLayout] Error requesting notification permissions:', error);
        }
      }
    });

    // Cleanup listener on unmount
    return () => {
      debugLog('🔵 [RootLayout] Cleaning up auth state listener');
      unsubscribe();
    };
  }, [setUser]); // Add setUser to dependencies

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="(modal)/create-group"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
