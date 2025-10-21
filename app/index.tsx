import { Redirect } from 'expo-router';
import { useAuthStore } from '@/lib/store/authStore';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const user = useAuthStore((state) => state.user);

  // Show loading while auth state initializes
  if (user === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/chats" />;
  }

  return <Redirect href="/(auth)/login" />;
}
