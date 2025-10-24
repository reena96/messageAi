import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { debugLog } from '@/lib/utils/debug';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';

export default function RootLayout() {
  const setUser = useAuthStore((state) => state.setUser);

  // Enable auto-retry for failed messages
  useNetworkStatus();

  useEffect(() => {
    debugLog('🔵 [RootLayout] Setting up auth state listener');

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      debugLog('🔵 [RootLayout] Auth state changed:', {
        isAuthenticated: !!user,
        uid: user?.uid,
        email: user?.email,
        displayName: user?.displayName,
      });
      setUser(user);
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
    </Stack>
  );
}
