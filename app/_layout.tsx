import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import auth from '@react-native-firebase/auth';

export default function RootLayout() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = auth().onAuthStateChanged((user) => {
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
