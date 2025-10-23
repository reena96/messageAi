import { Redirect } from 'expo-router';
import { useAuthStore } from '@/lib/store/authStore';
import { ActivityIndicator, View } from 'react-native';
import { debugLog } from '@/lib/utils/debug';

export default function Index() {
  const user = useAuthStore((state) => state.user);

  debugLog('🔵 [Index] Render - auth state:', {
    user: user === undefined ? 'undefined' : user === null ? 'null' : 'authenticated',
    uid: user?.uid,
  });

  // Show loading while auth state initializes
  if (user === undefined) {
    debugLog('🔵 [Index] Auth state undefined - showing loading');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (user) {
    debugLog('🔵 [Index] User authenticated - redirecting to chats');
    return <Redirect href="/(tabs)/chats" />;
  }

  debugLog('🔵 [Index] No user - redirecting to login');
  return <Redirect href="/(auth)/login" />;
}
