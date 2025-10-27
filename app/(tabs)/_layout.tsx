import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WHATSAPP_PALETTE } from '@/styles/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: WHATSAPP_PALETTE.primary,
        tabBarInactiveTintColor: WHATSAPP_PALETTE.tabInactive,
        tabBarActiveBackgroundColor: WHATSAPP_PALETTE.primaryMuted,
        tabBarLabelStyle: {
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        tabBarStyle: {
          borderTopColor: 'rgba(12, 132, 102, 0.15)',
        },
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="decisions"
        options={{
          title: 'Decisions',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-assistant"
        options={{
          title: 'AI Assistant',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bulb" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="debug"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
