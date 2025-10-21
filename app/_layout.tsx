import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export default function RootLayout() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    // Cleanup listener on unmount
    return unsubscribe;
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
