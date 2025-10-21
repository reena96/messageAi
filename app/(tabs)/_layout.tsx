import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="chats" options={{ title: 'Chats' }} />
    </Tabs>
  );
}
