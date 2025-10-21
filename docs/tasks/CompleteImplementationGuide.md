# MessageAI - Implementation Guide

**Version:** 1.0
**Date:** January 20, 2025

← [Back to README](./README.md) | [Technical Architecture](./02-technical-architecture.md) | [Rubric Alignment](./05-rubric-alignment.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Development Strategy](#2-development-strategy)
3. [Git Workflow](#3-git-workflow)
4. [PR Breakdown](#4-pr-breakdown)
5. [MVP Checkpoint](#5-mvp-checkpoint)
6. [Testing Strategy](#6-testing-strategy)
7. [Performance Benchmarking](#7-performance-benchmarking)

---

## 1. Overview

### Timeline: 4-Day Sprint

**Day 1 (0-24h): MVP Core**
- PR #1: Project Setup + Authentication (2-3h)
- PR #2: Core UI + Navigation + Performance (4-5h)
- PR #3: Real-Time Messaging (7-9h)
- PR #4: Offline Support (5-7h)
- **Checkpoint:** Basic messaging works offline

**Day 2 (24-48h): MVP Complete + AI Foundation**
- PR #5: Group Chat + Push Notifications (5-6h)
- **MVP Checkpoint:** All 11 MVP requirements complete
- PR #6: AI Infrastructure + Calendar Extraction (4-5h)
- PR #7: Decision Summarization + Priority Detection (4-5h, parallel with #8)
- PR #8: RSVP Tracking + Deadline Extraction (4-5h, parallel with #7)

**Day 3 (48-72h): Advanced AI + Polish**
- PR #9: Proactive Assistant (7-9h)
- PR #10A: Performance & Launch Optimization (2-3h)
- PR #10B: Testing & Bug Fixes (5-7h)

**Day 4 (72-96h): Documentation + Bonus**
- PR #11A: Bonus Features (3-4h)
- PR #11B: Demo Video & Documentation (3-4h)
- PR #12: Voice/Video Calls (stretch, 4-6h)

---

## 2. Development Strategy

### Parallel Development Opportunities

**PRs that can run in parallel:**
- PR #7 and PR #8 (both use same AI infrastructure from PR #6)
- PR #10A and PR #10B (performance and testing)
- PR #11A and PR #11B (bonus features and documentation)

**Sequential dependencies:**
- PR #1 → PR #2 → PR #3 → PR #4 → PR #5 (MVP chain)
- PR #6 → PR #7/8 → PR #9 (AI chain)

### Risk Mitigation

**High-Risk Areas:**
1. **Offline sync reliability** (PR #4) - Allocate extra time for testing
2. **AI accuracy** (PR #6-9) - Prompt engineering critical
3. **Performance targets** (PR #10A) - Early profiling essential

**Mitigation strategies:**
- Test offline scenarios continuously starting PR #3
- Create test conversation dataset for AI features
- Profile performance after each PR

---

## 3. Git Workflow

### Branch Naming

```bash
# Feature branches
git checkout -b feature/auth-setup
git checkout -b feature/realtime-messaging
git checkout -b feature/ai-calendar-extraction

# Bugfix branches
git checkout -b fix/offline-sync-race-condition
```

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** `feat`, `fix`, `perf`, `docs`, `test`, `refactor`

**Example:**
```
feat(messaging): add real-time message listeners

- Implement Firestore onSnapshot for messages subcollection
- Add optimistic UI updates with tempId
- Handle offline queue with react-native-firebase persistence

Closes #3
```

### PR Template

```markdown
## Description
Brief description of changes

## Related PRs
- Depends on: #X
- Related to: #Y

## Testing Done
- [ ] Manual testing on iOS simulator
- [ ] Manual testing on Android emulator
- [ ] Offline scenarios tested
- [ ] Performance measured

## Rubric Alignment
- [ ] Requirement X satisfied
- [ ] Performance target Y met

## Screenshots/Videos
[Attach demo]
```

---

## 4. PR Breakdown

---

## PR #1: Project Setup + Authentication

**Timeline:** 2-3 hours
**Branch:** `feature/auth-setup`

### Goals
- Initialize Expo Custom Dev Client project
- Set up Firebase Authentication (email/password)
- Implement login/signup screens
- Configure basic navigation with Expo Router

### Tasks

**1. Project Initialization (30 min)**

```bash
# Create project
npx create-expo-app@latest messageai --template blank-typescript

cd messageai

# Install core dependencies
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

# Install Firebase
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage @react-native-firebase/messaging

# Install UI libraries
npm install zustand react-native-reanimated @shopify/flash-list expo-image

# Install utilities
npm install @react-native-community/netinfo
```

**2. Configure Expo Custom Dev Client (30 min)**

Create `app.json`:
```json
{
  "expo": {
    "name": "MessageAI",
    "slug": "messageai",
    "scheme": "messageai",
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "expo-router"
    ],
    "ios": {
      "bundleIdentifier": "com.yourname.messageai",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "package": "com.yourname.messageai",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

**3. Firebase Setup (30 min)**

```typescript
// lib/firebase/config.ts
import { FirebaseApp, initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Firebase config already in GoogleService-Info.plist and google-services.json
// No need to call initializeApp() with config object

// Enable offline persistence
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});

export { auth, firestore };
```

**4. Authentication Store (30 min)**

```typescript
// lib/store/authStore.ts
import { create } from 'zustand';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface AuthState {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  error: string | null;

  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,

  signUp: async (email, password, displayName) => {
    try {
      set({ loading: true, error: null });

      const userCredential = await auth().createUserWithEmailAndPassword(email, password);

      // Update profile
      await userCredential.user.updateProfile({ displayName });

      // Create user document
      await firestore().collection('users').doc(userCredential.user.uid).set({
        id: userCredential.user.uid,
        email,
        displayName,
        online: true,
        lastSeen: firestore.FieldValue.serverTimestamp(),
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      await auth().signInWithEmailAndPassword(email, password);
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });

      // Update user status before signing out
      const currentUser = auth().currentUser;
      if (currentUser) {
        await firestore().collection('users').doc(currentUser.uid).update({
          online: false,
          lastSeen: firestore.FieldValue.serverTimestamp(),
        });
      }

      await auth().signOut();
      set({ user: null, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  setUser: (user) => set({ user }),
}));
```

**5. Auth Screens (45 min)**

```typescript
// app/(auth)/login.tsx
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading, error } = useAuthStore();

  const handleLogin = async () => {
    try {
      await signIn(email, password);
      router.replace('/(tabs)/chats');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MessageAI</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 20,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
});
```

```typescript
// app/(auth)/signup.tsx
// Similar structure to login.tsx, but calls signUp with displayName
```

**6. Navigation Setup (30 min)**

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import auth from '@react-native-firebase/auth';

export default function RootLayout() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
```

```typescript
// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/lib/store/authStore';

export default function Index() {
  const user = useAuthStore((state) => state.user);

  if (user) {
    return <Redirect href="/(tabs)/chats" />;
  }

  return <Redirect href="/(auth)/login" />;
}
```

### Files to Create

```
messageai/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       └── chats.tsx (placeholder)
├── lib/
│   ├── firebase/
│   │   └── config.ts
│   └── store/
│       └── authStore.ts
├── types/
│   └── user.ts
├── GoogleService-Info.plist (iOS)
├── google-services.json (Android)
└── app.json
```

### Validation Criteria

- [ ] User can sign up with email/password
- [ ] User can sign in with email/password
- [ ] User can sign out
- [ ] Auth state persists across app restarts
- [ ] User document created in Firestore on signup
- [ ] Navigation redirects based on auth state
- [ ] Build succeeds with custom dev client

### Testing

```bash
# Build custom dev client
npx expo prebuild
npx expo run:ios
npx expo run:android

# Test auth flow
1. Sign up new user
2. Verify user created in Firebase Console
3. Sign out
4. Sign in with same credentials
5. Close app, reopen - should stay logged in
```

---

## PR #2: Core UI + Navigation + Performance

**Timeline:** 4-5 hours
**Branch:** `feature/core-ui`

### Goals
- Build chat list screen with tab navigation
- Implement profile screen
- Add performance monitoring
- Create reusable UI components
- Implement connection status indicator

### Tasks

**1. Tab Navigation (30 min)**

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#007AFF',
      headerShown: false,
    }}>
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
        name="deadlines"
        options={{
          title: 'Deadlines',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-assistant"
        options={{
          title: 'Assistant',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles" size={size} color={color} />
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
    </Tabs>
  );
}
```

**2. Chat Store (1 hour)**

```typescript
// lib/store/chatStore.ts
import { create } from 'zustand';
import firestore from '@react-native-firebase/firestore';
import { Chat, Message } from '@/types';

interface ChatState {
  chats: Chat[];
  loading: boolean;
  error: string | null;

  subscribeToChats: (userId: string) => () => void;
  createOneOnOneChat: (userId: string, otherUserId: string, otherUserData: any) => Promise<string>;
  createGroupChat: (userId: string, participantIds: string[], groupName: string) => Promise<string>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  loading: false,
  error: null,

  subscribeToChats: (userId: string) => {
    set({ loading: true });

    const unsubscribe = firestore()
      .collection('chats')
      .where('participants', 'array-contains', userId)
      .orderBy('updatedAt', 'desc')
      .limit(100)
      .onSnapshot(
        (snapshot) => {
          const chats = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Chat[];

          set({ chats, loading: false, error: null });
        },
        (error) => {
          console.error('Chat subscription error:', error);
          set({ error: error.message, loading: false });
        }
      );

    return unsubscribe;
  },

  createOneOnOneChat: async (userId, otherUserId, otherUserData) => {
    // Check if chat already exists
    const existingChat = await firestore()
      .collection('chats')
      .where('participants', 'array-contains', userId)
      .where('type', '==', 'one-on-one')
      .get();

    const found = existingChat.docs.find((doc) => {
      const participants = doc.data().participants;
      return participants.includes(otherUserId);
    });

    if (found) {
      return found.id;
    }

    // Create new chat
    const chatRef = await firestore().collection('chats').add({
      type: 'one-on-one',
      participants: [userId, otherUserId],
      participantData: {
        [userId]: {
          name: 'Current User', // Will be updated
          photoURL: '',
        },
        [otherUserId]: {
          name: otherUserData.displayName,
          photoURL: otherUserData.photoURL || '',
        },
      },
      lastMessage: {
        text: '',
        senderId: '',
        timestamp: firestore.FieldValue.serverTimestamp(),
      },
      unreadCount: {
        [userId]: 0,
        [otherUserId]: 0,
      },
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    return chatRef.id;
  },

  createGroupChat: async (userId, participantIds, groupName) => {
    const chatRef = await firestore().collection('chats').add({
      type: 'group',
      participants: [userId, ...participantIds],
      groupName,
      lastMessage: {
        text: '',
        senderId: '',
        timestamp: firestore.FieldValue.serverTimestamp(),
      },
      unreadCount: {},
      createdBy: userId,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    return chatRef.id;
  },
}));
```

**3. Chat List Screen (1.5 hours)**

```typescript
// app/(tabs)/chats.tsx
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/store/authStore';
import { useChatStore } from '@/lib/store/chatStore';
import { Chat } from '@/types';
import { ConnectionStatus } from '@/components/common/ConnectionStatus';

export default function ChatsScreen() {
  const user = useAuthStore((state) => state.user);
  const { chats, loading, subscribeToChats } = useChatStore();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToChats(user.uid);
    return unsubscribe;
  }, [user]);

  const renderChat = ({ item }: { item: Chat }) => {
    const otherUserId = item.participants.find((id) => id !== user?.uid);
    const chatName = item.type === 'group'
      ? item.groupName
      : item.participantData?.[otherUserId!]?.name || 'Unknown';

    const unreadCount = item.unreadCount?.[user!.uid] || 0;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{chatName}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage?.text || 'No messages yet'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && chats.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ConnectionStatus />

      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <TouchableOpacity onPress={() => router.push('/(modal)/create-group')}>
          <Text style={styles.newChat}>New</Text>
        </TouchableOpacity>
      </View>

      <FlashList
        data={chats}
        renderItem={renderChat}
        estimatedItemSize={80}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No chats yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  newChat: {
    color: '#007AFF',
    fontSize: 16,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  badge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
```

**4. Connection Status Component (45 min)**

```typescript
// components/common/ConnectionStatus.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const translateY = useSharedValue(-50);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);

      if (!connected) {
        setShowBanner(true);
        translateY.value = withTiming(0, { duration: 300 });
      } else {
        // Hide banner after brief "Connected" message
        if (showBanner) {
          setTimeout(() => {
            translateY.value = withTiming(-50, { duration: 300 });
            setTimeout(() => setShowBanner(false), 300);
          }, 2000);
        }
      }
    });

    return () => unsubscribe();
  }, [showBanner]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!showBanner) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: isConnected ? '#4CAF50' : '#FF9800' },
        animatedStyle,
      ]}
    >
      <Text style={styles.text}>
        {isConnected ? 'Connected' : 'No internet connection'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 12,
    zIndex: 1000,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});
```

**5. Performance Monitor (1 hour)**

```typescript
// lib/utils/performance.ts
import { PerformanceObserver, performance } from 'react-native-performance';

class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measurements: Array<{ name: string; duration: number }> = [];

  mark(name: string) {
    performance.mark(name);
    this.marks.set(name, Date.now());
  }

  measure(name: string, startMark: string, endMark?: string) {
    const end = endMark || `${startMark}-end`;
    performance.mark(end);

    try {
      performance.measure(name, startMark, end);

      const startTime = this.marks.get(startMark);
      const endTime = this.marks.get(end) || Date.now();

      if (startTime) {
        const duration = endTime - startTime;
        this.measurements.push({ name, duration });

        console.log(`[Performance] ${name}: ${duration}ms`);

        // Log to Firebase Analytics or custom backend
        this.logToAnalytics(name, duration);
      }
    } catch (error) {
      console.error('Performance measurement error:', error);
    }
  }

  private logToAnalytics(name: string, duration: number) {
    // TODO: Send to Firebase Analytics or custom logging service
    // For now, just console log
    if (duration > 2000) {
      console.warn(`[Performance Warning] ${name} took ${duration}ms (>2s threshold)`);
    }
  }

  getReport() {
    return this.measurements;
  }

  clear() {
    this.marks.clear();
    this.measurements = [];
    performance.clearMarks();
    performance.clearMeasures();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Usage:
// performanceMonitor.mark('app-launch');
// ... code ...
// performanceMonitor.measure('App Launch Time', 'app-launch');
```

**6. Profile Screen (45 min)**

```typescript
// app/(tabs)/profile.tsx
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useAuthStore } from '@/lib/store/authStore';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.displayName?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{user?.displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  signOutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### Files to Create

```
messageai/
├── app/(tabs)/
│   ├── _layout.tsx
│   ├── chats.tsx
│   ├── deadlines.tsx (placeholder)
│   ├── ai-assistant.tsx (placeholder)
│   └── profile.tsx
├── components/
│   └── common/
│       └── ConnectionStatus.tsx
├── lib/
│   ├── store/
│   │   └── chatStore.ts
│   └── utils/
│       └── performance.ts
└── types/
    ├── chat.ts
    └── message.ts
```

### Validation Criteria

- [ ] Tab navigation works smoothly
- [ ] Chat list displays all user's chats
- [ ] Connection status banner appears when offline
- [ ] FlashList renders 100+ chats at 60 FPS
- [ ] Profile screen displays user info
- [ ] Sign out works correctly
- [ ] Performance monitoring logs key metrics

### Performance Targets

- App launch to chat screen: <2 seconds
- Scrolling through chat list: 60 FPS
- Connection status updates: <100ms

---

## PR #3: Real-Time Messaging

**Timeline:** 7-9 hours (most critical PR)
**Branch:** `feature/realtime-messaging`

### Goals
- Implement real-time message sending/receiving
- Optimistic UI updates
- Read receipts
- Message status indicators
- Typing indicators
- User presence (online/offline)

### Tasks

**1. Message Store (2 hours)**

```typescript
// lib/store/messageStore.ts
import { create } from 'zustand';
import firestore from '@react-native-firebase/firestore';
import { Message } from '@/types';
import { performanceMonitor } from '@/lib/utils/performance';

interface MessageState {
  messages: { [chatId: string]: Message[] };
  loading: boolean;
  sendingMessages: Set<string>; // Track optimistic messages

  subscribeToMessages: (chatId: string) => () => void;
  sendMessage: (chatId: string, senderId: string, text: string) => Promise<void>;
  markAsRead: (chatId: string, messageId: string, userId: string) => Promise<void>;
  updateTypingStatus: (chatId: string, userId: string, isTyping: boolean) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: {},
  loading: false,
  sendingMessages: new Set(),

  subscribeToMessages: (chatId: string) => {
    set({ loading: true });

    performanceMonitor.mark(`messages-subscribe-${chatId}`);

    const unsubscribe = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .limit(50) // Initial load
      .onSnapshot(
        (snapshot) => {
          performanceMonitor.measure(
            `Messages Loaded (${chatId})`,
            `messages-subscribe-${chatId}`
          );

          const messages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Message[];

          set((state) => ({
            messages: {
              ...state.messages,
              [chatId]: messages,
            },
            loading: false,
          }));
        },
        (error) => {
          console.error('Message subscription error:', error);
          set({ loading: false });
        }
      );

    return unsubscribe;
  },

  sendMessage: async (chatId, senderId, text) => {
    const tempId = `temp-${Date.now()}`;
    const clientTimestamp = new Date();

    // Optimistic update
    const optimisticMessage: Message = {
      id: tempId,
      chatId,
      senderId,
      text,
      timestamp: clientTimestamp as any,
      clientTimestamp,
      status: 'sending',
      readBy: [],
    };

    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: [...chatMessages, optimisticMessage],
        },
        sendingMessages: new Set(state.sendingMessages).add(tempId),
      };
    });

    performanceMonitor.mark(`message-send-${tempId}`);

    try {
      // Add to Firestore
      const messageRef = await firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .add({
          chatId,
          senderId,
          text,
          timestamp: firestore.FieldValue.serverTimestamp(),
          status: 'sent',
          readBy: [senderId],
        });

      // Update chat's lastMessage
      await firestore()
        .collection('chats')
        .doc(chatId)
        .update({
          lastMessage: {
            text,
            senderId,
            timestamp: firestore.FieldValue.serverTimestamp(),
          },
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      performanceMonitor.measure(
        'Message Send Time',
        `message-send-${tempId}`
      );

      // Remove optimistic message (listener will add confirmed version)
      set((state) => {
        const chatMessages = state.messages[chatId] || [];
        const newSendingMessages = new Set(state.sendingMessages);
        newSendingMessages.delete(tempId);

        return {
          messages: {
            ...state.messages,
            [chatId]: chatMessages.filter((m) => m.id !== tempId),
          },
          sendingMessages: newSendingMessages,
        };
      });
    } catch (error) {
      console.error('Send message error:', error);

      // Update optimistic message to failed
      set((state) => {
        const chatMessages = state.messages[chatId] || [];
        return {
          messages: {
            ...state.messages,
            [chatId]: chatMessages.map((m) =>
              m.id === tempId ? { ...m, status: 'failed' as any } : m
            ),
          },
        };
      });

      throw error;
    }
  },

  markAsRead: async (chatId, messageId, userId) => {
    try {
      await firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .doc(messageId)
        .update({
          readBy: firestore.FieldValue.arrayUnion(userId),
        });
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  },

  updateTypingStatus: (chatId, userId, isTyping) => {
    // Use a separate collection for ephemeral typing status
    firestore()
      .collection('chats')
      .doc(chatId)
      .collection('typing')
      .doc(userId)
      .set(
        {
          isTyping,
          timestamp: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      .catch((error) => console.error('Typing status error:', error));
  },
}));
```

**2. Chat Screen (3 hours)**

```typescript
// app/chat/[id].tsx
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/store/authStore';
import { useMessageStore } from '@/lib/store/messageStore';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { TypingIndicator } from '@/components/messages/TypingIndicator';

export default function ChatScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const { messages, subscribeToMessages, sendMessage, markAsRead, updateTypingStatus } = useMessageStore();

  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlashList<any>>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const chatMessages = messages[chatId] || [];

  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = subscribeToMessages(chatId);
    return unsubscribe;
  }, [chatId]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (!user || chatMessages.length === 0) return;

    const unreadMessages = chatMessages.filter(
      (m) => m.senderId !== user.uid && !m.readBy?.includes(user.uid)
    );

    unreadMessages.forEach((message) => {
      markAsRead(chatId, message.id, user.uid);
    });
  }, [chatMessages, user]);

  const handleSend = async () => {
    if (!text.trim() || !user) return;

    const messageText = text.trim();
    setText('');

    // Stop typing indicator
    updateTypingStatus(chatId, user.uid, false);
    setIsTyping(false);

    // Scroll to bottom
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      await sendMessage(chatId, user.uid, messageText);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTextChange = (newText: string) => {
    setText(newText);

    if (!user) return;

    // Update typing indicator
    if (newText.length > 0 && !isTyping) {
      setIsTyping(true);
      updateTypingStatus(chatId, user.uid, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(chatId, user.uid, false);
    }, 2000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlashList
        ref={listRef}
        data={chatMessages}
        renderItem={({ item }) => (
          <MessageBubble message={item} isOwn={item.senderId === user?.uid} />
        )}
        estimatedItemSize={60}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <TypingIndicator chatId={chatId} currentUserId={user?.uid || ''} />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          value={text}
          onChangeText={handleTextChange}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Ionicons name="send" size={24} color={text.trim() ? '#007AFF' : '#ccc'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  messageList: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
```

**3. Message Components (2 hours)**

```typescript
// components/messages/MessageBubble.tsx
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '@/types';
import { Ionicons } from '@expo/vector-icons';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const getStatusIcon = () => {
    if (message.status === 'sending') {
      return <Ionicons name="time-outline" size={14} color="#999" />;
    }
    if (message.readBy && message.readBy.length > 1) {
      return <Ionicons name="checkmark-done" size={14} color="#007AFF" />;
    }
    if (message.status === 'sent') {
      return <Ionicons name="checkmark" size={14} color="#999" />;
    }
    return null;
  };

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>
          {message.text}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.timestamp}>
            {formatTimestamp(message.timestamp || message.clientTimestamp)}
          </Text>
          {isOwn && getStatusIcon()}
        </View>
      </View>
    </View>
  );
}

function formatTimestamp(timestamp: any): string {
  if (!timestamp) return '';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
  },
  otherBubble: {
    backgroundColor: '#E9E9EB',
  },
  text: {
    fontSize: 16,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: '#000',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
});
```

```typescript
// components/messages/TypingIndicator.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';

interface TypingIndicatorProps {
  chatId: string;
  currentUserId: string;
}

export function TypingIndicator({ chatId, currentUserId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('typing')
      .onSnapshot((snapshot) => {
        const typing = snapshot.docs
          .filter((doc) => {
            const data = doc.data();
            return doc.id !== currentUserId && data.isTyping;
          })
          .map((doc) => doc.id);

        setTypingUsers(typing);
      });

    return unsubscribe;
  }, [chatId, currentUserId]);

  useEffect(() => {
    if (typingUsers.length > 0) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1
      );
    }
  }, [typingUsers]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (typingUsers.length === 0) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.indicator, animatedStyle]}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </Animated.View>
      <Text style={styles.text}>typing...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  indicator: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999',
  },
  text: {
    marginLeft: 8,
    color: '#999',
    fontSize: 12,
  },
});
```

**4. User Presence (1 hour)**

```typescript
// lib/hooks/usePresence.ts
import { useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { AppState, AppStateStatus } from 'react-native';

export function usePresence(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    const userRef = firestore().collection('users').doc(userId);

    // Set online when app starts
    userRef.update({
      online: true,
      lastSeen: firestore.FieldValue.serverTimestamp(),
    });

    // Handle app state changes
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        userRef.update({ online: true });
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        userRef.update({
          online: false,
          lastSeen: firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    // Cleanup: set offline when unmounting
    return () => {
      subscription.remove();
      userRef.update({
        online: false,
        lastSeen: firestore.FieldValue.serverTimestamp(),
      });
    };
  }, [userId]);
}
```

### Files to Create

```
messageai/
├── app/
│   └── chat/
│       └── [id].tsx
├── components/
│   └── messages/
│       ├── MessageBubble.tsx
│       └── TypingIndicator.tsx
├── lib/
│   ├── store/
│   │   └── messageStore.ts
│   └── hooks/
│       └── usePresence.ts
└── types/
    └── message.ts
```

### Validation Criteria

- [ ] Messages send in <200ms on good network
- [ ] Optimistic UI shows message immediately
- [ ] Read receipts update correctly
- [ ] Typing indicator appears within 100ms
- [ ] User presence (online/offline) updates within 100ms
- [ ] Messages sync in real-time across devices
- [ ] No duplicate messages after reconnection

### Performance Targets

- Message delivery: <200ms
- Typing indicator lag: <100ms
- Presence update lag: <100ms
- Scrolling 1000+ messages: 60 FPS

### Testing

**Stress Test: 20 messages in 2 seconds**
```typescript
// Test in console or create test button
async function stressTest() {
  for (let i = 0; i < 20; i++) {
    await sendMessage(chatId, userId, `Test message ${i + 1}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

---

## PR #4: Offline Support + Persistence

**Timeline:** 5-7 hours
**Branch:** `feature/offline-support`

### Goals
- Enable Firestore offline persistence
- Implement message queue for offline sends
- Handle reconnection gracefully
- Add offline indicators in UI
- Test all offline scenarios

### Tasks

**1. Enhanced Firestore Configuration (1 hour)**

```typescript
// lib/firebase/config.ts (update)
import firestore from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';

// Enable offline persistence with unlimited cache
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});

// Optional: Monitor Firestore network state
let firestoreNetwork = true;

NetInfo.addEventListener((state) => {
  const isConnected = state.isConnected ?? false;

  if (isConnected && !firestoreNetwork) {
    // Reconnected - Firestore will auto-sync
    console.log('[Firestore] Network restored, syncing...');
    firestoreNetwork = true;
  } else if (!isConnected && firestoreNetwork) {
    console.log('[Firestore] Network lost, entering offline mode');
    firestoreNetwork = false;
  }
});

export { firestore };
```

**2. Offline Message Queue (2 hours)**

```typescript
// lib/store/messageStore.ts (enhance sendMessage)
sendMessage: async (chatId, senderId, text) => {
  const tempId = `temp-${Date.now()}-${Math.random()}`;
  const clientTimestamp = new Date();

  // Optimistic update
  const optimisticMessage: Message = {
    id: tempId,
    chatId,
    senderId,
    text,
    timestamp: clientTimestamp as any,
    clientTimestamp,
    status: 'sending',
    readBy: [],
    tempId, // Track for replacement
  };

  set((state) => {
    const chatMessages = state.messages[chatId] || [];
    return {
      messages: {
        ...state.messages,
        [chatId]: [...chatMessages, optimisticMessage],
      },
      sendingMessages: new Set(state.sendingMessages).add(tempId),
    };
  });

  try {
    // Firestore handles queueing automatically when offline
    const messageRef = await firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .add({
        chatId,
        senderId,
        text,
        timestamp: firestore.FieldValue.serverTimestamp(),
        status: 'sent',
        readBy: [senderId],
      });

    // Update chat's lastMessage
    await firestore()
      .collection('chats')
      .doc(chatId)
      .update({
        lastMessage: {
          text,
          senderId,
          timestamp: firestore.FieldValue.serverTimestamp(),
        },
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    // Success - remove optimistic message
    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      const newSendingMessages = new Set(state.sendingMessages);
      newSendingMessages.delete(tempId);

      return {
        messages: {
          ...state.messages,
          [chatId]: chatMessages.filter((m) => m.tempId !== tempId),
        },
        sendingMessages: newSendingMessages,
      };
    });

    console.log(`[Message] Sent successfully: ${messageRef.id}`);
  } catch (error: any) {
    console.error('Send message error:', error);

    // Only mark as failed if it's NOT a network error
    // (network errors will auto-retry via Firestore)
    if (error.code !== 'unavailable') {
      set((state) => {
        const chatMessages = state.messages[chatId] || [];
        return {
          messages: {
            ...state.messages,
            [chatId]: chatMessages.map((m) =>
              m.tempId === tempId ? { ...m, status: 'failed' as any } : m
            ),
          },
        };
      });
    }

    throw error;
  }
},
```

**3. Network Monitor Hook (1 hour)**

```typescript
// lib/hooks/useNetworkStatus.ts
import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [networkType, setNetworkType] = useState<string>('unknown');
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
      setNetworkType(state.type);
      setIsInternetReachable(state.isInternetReachable);

      console.log('[Network]', {
        connected: state.isConnected,
        type: state.type,
        reachable: state.isInternetReachable,
      });
    });

    return () => unsubscribe();
  }, []);

  return {
    isConnected,
    networkType,
    isInternetReachable,
  };
}
```

**4. Offline Banner Enhancement (1 hour)**

```typescript
// components/common/ConnectionStatus.tsx (enhance)
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export function ConnectionStatus() {
  const { isConnected, networkType } = useNetworkStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const translateY = useSharedValue(-60);

  useEffect(() => {
    if (!isConnected) {
      setWasOffline(true);
      setShowBanner(true);
      translateY.value = withTiming(0, { duration: 300 });
    } else if (wasOffline) {
      // Show "Syncing..." then "Connected"
      setShowBanner(true);
      translateY.value = withTiming(0, { duration: 300 });

      setTimeout(() => {
        translateY.value = withTiming(-60, { duration: 300 });
        setTimeout(() => {
          setShowBanner(false);
          setWasOffline(false);
        }, 300);
      }, 2000);
    }
  }, [isConnected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!showBanner) return null;

  const getBannerConfig = () => {
    if (!isConnected) {
      return {
        color: '#FF9800',
        icon: 'cloud-offline-outline' as const,
        text: 'No connection - messages will sync when online',
      };
    } else if (wasOffline) {
      return {
        color: '#4CAF50',
        icon: 'cloud-done-outline' as const,
        text: 'Connected - syncing messages',
      };
    } else {
      return {
        color: '#4CAF50',
        icon: 'checkmark-circle' as const,
        text: 'Connected',
      };
    }
  };

  const config = getBannerConfig();

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: config.color },
        animatedStyle,
      ]}
    >
      <Ionicons name={config.icon} size={18} color="#fff" />
      <Text style={styles.text}>{config.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50, // Account for notch
    paddingBottom: 12,
    paddingHorizontal: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
```

**5. Offline Testing Scenarios (2 hours)**

Create test document:

```markdown
# Offline Testing Scenarios

## Scenario 1: Send messages while offline
1. Turn off WiFi/cellular
2. Send 5 messages in chat
3. Verify messages show "sending" status
4. Turn on WiFi/cellular
5. ✅ All 5 messages should sync within 1 second
6. ✅ Messages should show "sent" status

## Scenario 2: Receive messages while offline
1. Device A: Send message to Device B
2. Device B: Offline
3. Device B: Turn on WiFi
4. ✅ Message should appear immediately

## Scenario 3: Read receipts while offline
1. Device A: Send message
2. Device B: Offline, open chat (message loads from cache)
3. Device B: Turn on WiFi
4. ✅ Read receipt should sync to Device A

## Scenario 4: Create chat while offline
1. Turn off WiFi
2. Start new chat, send message
3. ✅ Should queue locally
4. Turn on WiFi
5. ✅ Chat and message should sync

## Scenario 5: Poor network simulation
1. Use network throttling (slow 3G)
2. Send 10 messages rapidly
3. ✅ All should queue and deliver in order
4. ✅ No duplicates

## Scenario 6: App backgrounded while offline
1. Send message while offline
2. Background app
3. Turn on WiFi
4. Return to app
5. ✅ Message should sync automatically

## Scenario 7: Force quit while offline
1. Send 3 messages while offline
2. Force quit app
3. Turn on WiFi
4. Relaunch app
5. ✅ Messages should still be queued and sync
```

Run these tests manually and document results.

### Files to Create

```
messageai/
├── lib/
│   ├── firebase/
│   │   └── config.ts (enhanced)
│   ├── hooks/
│   │   └── useNetworkStatus.ts
│   └── store/
│       └── messageStore.ts (enhanced)
├── components/
│   └── common/
│       └── ConnectionStatus.tsx (enhanced)
└── docs/
    └── OFFLINE_TESTING.md
```

### Validation Criteria

- [ ] Messages queue correctly when offline
- [ ] Messages sync within 1 second after reconnection
- [ ] No duplicate messages after sync
- [ ] Read receipts sync correctly
- [ ] Offline banner shows connection status
- [ ] All 7 offline scenarios pass

### Performance Target

- Offline sync after reconnection: <1 second

---

## PR #5: Group Chat + Push Notifications

**Timeline:** 5-6 hours
**Branch:** `feature/group-chat`

### Goals
- Implement group chat creation
- Add group member management
- Display group member list with online status
- Set up push notifications (FCM)
- Test group messaging scenarios

### Tasks

**1. Create Group Modal (1.5 hours)**

```typescript
// app/(modal)/create-group.tsx
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import { useAuthStore } from '@/lib/store/authStore';
import { useChatStore } from '@/lib/store/chatStore';

interface User {
  id: string;
  displayName: string;
  photoURL?: string;
  email: string;
}

export default function CreateGroupModal() {
  const user = useAuthStore((state) => state.user);
  const { createGroupChat } = useChatStore();

  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load users
    const unsubscribe = firestore()
      .collection('users')
      .onSnapshot((snapshot) => {
        const allUsers = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((u) => u.id !== user?.uid) as User[];

        setUsers(allUsers);
      });

    return unsubscribe;
  }, [user]);

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.size === 0 || !user) {
      return;
    }

    setLoading(true);
    try {
      const chatId = await createGroupChat(
        user.uid,
        Array.from(selectedUsers),
        groupName.trim()
      );

      router.replace(`/chat/${chatId}`);
    } catch (error) {
      console.error('Create group error:', error);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Group</Text>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={loading || !groupName.trim() || selectedUsers.size === 0}
        >
          <Text style={[
            styles.create,
            (!groupName.trim() || selectedUsers.size === 0) && styles.createDisabled
          ]}>
            {loading ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Group name"
        value={groupName}
        onChangeText={setGroupName}
        maxLength={50}
      />

      <Text style={styles.sectionTitle}>
        Add Members ({selectedUsers.size})
      </Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => toggleUser(item.id)}
          >
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.userName}>{item.displayName}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
            </View>

            {selectedUsers.has(item.id) && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cancel: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  create: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  createDisabled: {
    opacity: 0.5,
  },
  input: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 16,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
```

**2. Group Chat Header with Members (1 hour)**

```typescript
// components/chat/GroupChatHeader.tsx
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { Chat } from '@/types';

interface GroupChatHeaderProps {
  chat: Chat;
  onBack: () => void;
}

interface UserStatus {
  id: string;
  displayName: string;
  online: boolean;
}

export function GroupChatHeader({ chat, onBack }: GroupChatHeaderProps) {
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<UserStatus[]>([]);

  useEffect(() => {
    if (chat.type !== 'group') return;

    // Subscribe to all participants' status
    const unsubscribes = chat.participants.map((userId) =>
      firestore()
        .collection('users')
        .doc(userId)
        .onSnapshot((doc) => {
          if (!doc.exists) return;

          const userData = doc.data();
          setMembers((prev) => {
            const filtered = prev.filter((m) => m.id !== userId);
            return [
              ...filtered,
              {
                id: userId,
                displayName: userData?.displayName || 'Unknown',
                online: userData?.online || false,
              },
            ].sort((a, b) => {
              // Online users first
              if (a.online && !b.online) return -1;
              if (!a.online && b.online) return 1;
              return a.displayName.localeCompare(b.displayName);
            });
          });
        })
    );

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [chat]);

  const onlineCount = members.filter((m) => m.online).length;

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => setShowMembers(true)}
        >
          <Text style={styles.groupName}>{chat.groupName}</Text>
          <Text style={styles.memberCount}>
            {chat.participants.length} members • {onlineCount} online
          </Text>
        </TouchableOpacity>

        <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
      </View>

      <Modal
        visible={showMembers}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMembers(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Group Members</Text>
            <TouchableOpacity onPress={() => setShowMembers(false)}>
              <Ionicons name="close" size={28} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {members.map((member) => (
            <View key={member.id} style={styles.memberItem}>
              <View style={styles.memberInfo}>
                <View style={[
                  styles.onlineIndicator,
                  { backgroundColor: member.online ? '#4CAF50' : '#ccc' }
                ]} />
                <Text style={styles.memberName}>{member.displayName}</Text>
              </View>
              <Text style={styles.memberStatus}>
                {member.online ? 'Online' : 'Offline'}
              </Text>
            </View>
          ))}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  memberName: {
    fontSize: 16,
  },
  memberStatus: {
    fontSize: 14,
    color: '#666',
  },
});
```

**3. Push Notifications Setup (2.5 hours)**

```typescript
// lib/notifications/setup.ts
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('[Notifications] Permission granted');
      await setupNotifications();
      return true;
    } else {
      console.log('[Notifications] Permission denied');
      return false;
    }
  } catch (error) {
    console.error('[Notifications] Permission error:', error);
    return false;
  }
}

async function setupNotifications() {
  try {
    // Get FCM token
    const fcmToken = await messaging().getToken();
    console.log('[FCM] Token:', fcmToken);

    // Save token to user document
    const userId = getCurrentUserId(); // Implement this
    if (userId && fcmToken) {
      await firestore()
        .collection('users')
        .doc(userId)
        .update({ fcmToken });
    }

    // Listen for token refresh
    messaging().onTokenRefresh(async (newToken) => {
      console.log('[FCM] Token refreshed:', newToken);
      if (userId) {
        await firestore()
          .collection('users')
          .doc(userId)
          .update({ fcmToken: newToken });
      }
    });

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('[FCM] Foreground message:', remoteMessage);
      // Show in-app notification or update UI
    });

    // Handle background messages (requires Cloud Function)
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('[FCM] Background message:', remoteMessage);
    });
  } catch (error) {
    console.error('[Notifications] Setup error:', error);
  }
}

function getCurrentUserId(): string | null {
  // Get from auth store
  return null; // Implement this
}
```

```typescript
// functions/src/notifications.ts (Cloud Function)
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const sendMessageNotification = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    const chatId = context.params.chatId;

    // Get chat document
    const chatDoc = await admin.firestore().collection('chats').doc(chatId).get();
    if (!chatDoc.exists) return;

    const chat = chatDoc.data()!;
    const recipients = chat.participants.filter((id: string) => id !== message.senderId);

    // Get sender info
    const senderDoc = await admin.firestore().collection('users').doc(message.senderId).get();
    const senderName = senderDoc.data()?.displayName || 'Someone';

    // Get FCM tokens for recipients
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where(admin.firestore.FieldPath.documentId(), 'in', recipients)
      .get();

    const tokens = usersSnapshot.docs
      .map((doc) => doc.data().fcmToken)
      .filter((token) => token);

    if (tokens.length === 0) return;

    // Send notification
    const payload: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: chat.type === 'group' ? chat.groupName : senderName,
        body: message.text,
      },
      data: {
        chatId,
        messageId: snapshot.id,
        type: 'new_message',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      android: {
        notification: {
          sound: 'default',
          channelId: 'messages',
        },
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(payload);
      console.log(`[Notifications] Sent: ${response.successCount}/${tokens.length}`);
    } catch (error) {
      console.error('[Notifications] Send error:', error);
    }
  });
```

### Files to Create

```
messageai/
├── app/
│   └── (modal)/
│       └── create-group.tsx
├── components/
│   └── chat/
│       └── GroupChatHeader.tsx
├── lib/
│   └── notifications/
│       └── setup.ts
└── functions/
    └── src/
        ├── index.ts
        └── notifications.ts
```

### Validation Criteria

- [ ] Users can create group chats
- [ ] Group chat shows member count and online status
- [ ] Group member list displays with online/offline indicators
- [ ] Push notifications work on iOS
- [ ] Push notifications work on Android
- [ ] Notification includes sender name and message preview
- [ ] Tapping notification opens the correct chat

---

## 5. MVP Checkpoint

**After PR #5, validate all 11 MVP requirements:**

### MVP Requirements Checklist

#### Core Messaging (4 requirements)
- [ ] One-on-one messaging works
- [ ] Group chat works
- [ ] Real-time sync (<200ms delivery)
- [ ] Offline support (messages sync <1s after reconnection)

#### User Features (3 requirements)
- [ ] User authentication (email/password)
- [ ] User profiles
- [ ] User presence (online/offline status)

#### UI/UX (2 requirements)
- [ ] Cross-platform (iOS + Android both work)
- [ ] Responsive UI (60 FPS scrolling)

#### Infrastructure (2 requirements)
- [ ] Push notifications work
- [ ] Persistent storage (messages survive app restart)

### Performance Validation

Run all performance tests and document results:

```markdown
# MVP Performance Results

## App Launch
- [ ] App launch to chat screen: ___ms (<2000ms target)

## Messaging
- [ ] Message delivery (good network): ___ms (<200ms target)
- [ ] Offline sync after reconnection: ___ms (<1000ms target)
- [ ] Typing indicator lag: ___ms (<100ms target)
- [ ] Presence update lag: ___ms (<100ms target)

## UI Performance
- [ ] Scrolling 1000+ messages: ___ FPS (60 FPS target)
- [ ] Chat list with 100 chats: ___ FPS (60 FPS target)

## Stress Tests
- [ ] 20 messages in 2 seconds: PASS/FAIL
- [ ] All 7 offline scenarios: PASS/FAIL
```

**If all MVP requirements pass, proceed to AI features. If not, fix issues before continuing.**

---

## PR #6: AI Infrastructure + Calendar Extraction

**Timeline:** 4-5 hours
**Branch:** `feature/ai-calendar`

### Goals
- Set up Cloud Functions for AI processing
- Implement calendar event extraction (AI Feature #1)
- Test accuracy (must be >90%)
- Add loading states in UI

### Tasks

**1. Cloud Functions Setup (1 hour)**

```bash
cd messageai
firebase init functions
# Choose TypeScript
# Install dependencies
```

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import OpenAI from 'openai';

const openaiApiKey = defineSecret('OPENAI_API_KEY');

export const calendarExtraction = functions.https.onCall(
  { secrets: [openaiApiKey] },
  async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { messageText } = data;

    if (!messageText) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'messageText is required'
      );
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey.value(),
    });

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a calendar event extraction assistant. Extract calendar events from messages.
Return a JSON array of events with these fields:
- event: string (event name)
- date: string (ISO format YYYY-MM-DD)
- time: string (optional, HH:MM AM/PM format)
- location: string (optional)
- confidence: number (0-1, how confident you are)

If no events found, return empty array.`,
          },
          {
            role: 'user',
            content: messageText,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      return {
        events: result.events || [],
        usage: completion.usage,
      };
    } catch (error: any) {
      console.error('[AI] Calendar extraction error:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  }
);
```

**2. AI Service Client (1 hour)**

```typescript
// lib/ai/calendar.ts
import functions from '@react-native-firebase/functions';

export interface CalendarEvent {
  event: string;
  date: string;
  time?: string;
  location?: string;
  confidence: number;
}

export async function extractCalendarEvents(messageText: string): Promise<CalendarEvent[]> {
  try {
    const calendarExtraction = functions().httpsCallable('calendarExtraction');
    const result = await calendarExtraction({ messageText });

    return result.data.events || [];
  } catch (error) {
    console.error('[AI] Calendar extraction error:', error);
    return [];
  }
}

// Test cases for validation
export const CALENDAR_TEST_CASES = [
  {
    input: "Soccer practice is tomorrow at 4pm at the community center",
    expected: {
      event: "Soccer practice",
      hasTime: true,
      hasLocation: true,
    },
  },
  {
    input: "Don't forget parent-teacher conference on Friday, January 26th at 3:30 PM",
    expected: {
      event: "parent-teacher conference",
      hasTime: true,
      hasLocation: false,
    },
  },
  {
    input: "Birthday party next Saturday!",
    expected: {
      event: "Birthday party",
      hasTime: false,
      hasLocation: false,
    },
  },
  {
    input: "Can you pick up milk?", // No event
    expected: null,
  },
];
```

**3. Calendar View Component (1.5 hours)**

```typescript
// app/(tabs)/deadlines.tsx
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useAuthStore } from '@/lib/store/authStore';
import { CalendarEvent } from '@/lib/ai/calendar';
import { Ionicons } from '@expo/vector-icons';

interface MessageWithEvents {
  id: string;
  chatId: string;
  text: string;
  events: CalendarEvent[];
  timestamp: any;
}

export default function DeadlinesScreen() {
  const user = useAuthStore((state) => state.user);
  const [messagesWithEvents, setMessagesWithEvents] = useState<MessageWithEvents[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Query all chats user is part of
    const unsubscribe = firestore()
      .collection('chats')
      .where('participants', 'array-contains', user.uid)
      .onSnapshot(async (chatsSnapshot) => {
        const allEvents: MessageWithEvents[] = [];

        for (const chatDoc of chatsSnapshot.docs) {
          const messagesSnapshot = await firestore()
            .collection('chats')
            .doc(chatDoc.id)
            .collection('messages')
            .where('aiExtraction.calendarEvents', '!=', null)
            .get();

          messagesSnapshot.docs.forEach((messageDoc) => {
            const data = messageDoc.data();
            if (data.aiExtraction?.calendarEvents?.length > 0) {
              allEvents.push({
                id: messageDoc.id,
                chatId: chatDoc.id,
                text: data.text,
                events: data.aiExtraction.calendarEvents,
                timestamp: data.timestamp,
              });
            }
          });
        }

        // Sort by date
        allEvents.sort((a, b) => {
          const dateA = new Date(a.events[0]?.date || 0);
          const dateB = new Date(b.events[0]?.date || 0);
          return dateA.getTime() - dateB.getTime();
        });

        setMessagesWithEvents(allEvents);
        setLoading(false);
      });

    return unsubscribe;
  }, [user]);

  const renderEvent = ({ item }: { item: MessageWithEvents }) => (
    <View style={styles.eventCard}>
      {item.events.map((event, index) => (
        <View key={index} style={styles.event}>
          <View style={styles.eventIcon}>
            <Ionicons name="calendar" size={24} color="#007AFF" />
          </View>

          <View style={styles.eventDetails}>
            <Text style={styles.eventName}>{event.event}</Text>
            <Text style={styles.eventDate}>
              {formatDate(event.date)} {event.time && `• ${event.time}`}
            </Text>
            {event.location && (
              <Text style={styles.eventLocation}>
                <Ionicons name="location" size={12} /> {event.location}
              </Text>
            )}
            <Text style={styles.eventSource} numberOfLines={1}>
              From: {item.text}
            </Text>
          </View>

          {event.confidence < 0.8 && (
            <View style={styles.lowConfidenceBadge}>
              <Text style={styles.badgeText}>?</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar Events</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Text>Loading...</Text>
        </View>
      ) : messagesWithEvents.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No calendar events found</Text>
          <Text style={styles.emptySubtext}>
            AI will automatically extract dates and events from your messages
          </Text>
        </View>
      ) : (
        <FlatList
          data={messagesWithEvents}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  event: {
    flexDirection: 'row',
    gap: 12,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDetails: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  eventSource: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  lowConfidenceBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});
```

**4. Auto-extraction on Message Send (1.5 hours)**

```typescript
// lib/store/messageStore.ts (enhance sendMessage)
sendMessage: async (chatId, senderId, text) => {
  // ... existing optimistic update code ...

  try {
    // Add to Firestore
    const messageRef = await firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .add({
        chatId,
        senderId,
        text,
        timestamp: firestore.FieldValue.serverTimestamp(),
        status: 'sent',
        readBy: [senderId],
      });

    // Trigger AI extraction asynchronously (don't await)
    extractAndUpdateAI(chatId, messageRef.id, text).catch(console.error);

    // ... rest of existing code ...
  } catch (error) {
    // ... existing error handling ...
  }
},

async function extractAndUpdateAI(chatId: string, messageId: string, text: string) {
  try {
    // Extract calendar events
    const events = await extractCalendarEvents(text);

    if (events.length > 0) {
      await firestore()
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .doc(messageId)
        .update({
          'aiExtraction.calendarEvents': events,
        });

      console.log(`[AI] Extracted ${events.length} calendar events`);
    }
  } catch (error) {
    console.error('[AI] Extraction error:', error);
  }
}
```

### Validation Criteria

- [ ] Calendar extraction accuracy >90% on test cases
- [ ] Events display in Deadlines tab
- [ ] AI processing completes in <2 seconds
- [ ] Low-confidence events are marked
- [ ] UI shows loading state during extraction

### Testing

Run test cases and measure accuracy:

```typescript
// Test script
async function testCalendarExtraction() {
  let correct = 0;
  const total = CALENDAR_TEST_CASES.length;

  for (const testCase of CALENDAR_TEST_CASES) {
    const events = await extractCalendarEvents(testCase.input);

    if (testCase.expected === null) {
      if (events.length === 0) correct++;
    } else {
      if (events.length > 0 &&
          events[0].event.toLowerCase().includes(testCase.expected.event.toLowerCase())) {
        correct++;
      }
    }
  }

  const accuracy = (correct / total) * 100;
  console.log(`Accuracy: ${accuracy.toFixed(1)}%`);
  return accuracy >= 90;
}
```

---

## 6. Testing Strategy

### Unit Tests

```typescript
// __tests__/lib/ai/calendar.test.ts
import { extractCalendarEvents, CALENDAR_TEST_CASES } from '@/lib/ai/calendar';

describe('Calendar Extraction', () => {
  it('should extract event from simple message', async () => {
    const events = await extractCalendarEvents(
      "Soccer practice tomorrow at 4pm"
    );

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].event.toLowerCase()).toContain('soccer');
    expect(events[0].time).toBeTruthy();
  });

  it('should return empty array for non-event message', async () => {
    const events = await extractCalendarEvents("Can you pick up milk?");
    expect(events.length).toBe(0);
  });

  it('should pass all test cases with >90% accuracy', async () => {
    // Run accuracy test
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/messaging.test.ts
describe('Messaging Flow', () => {
  it('should send message and sync across devices', async () => {
    // Test real-time sync
  });

  it('should handle offline send and sync on reconnection', async () => {
    // Test offline queue
  });
});
```

### E2E Tests (Manual)

Create test checklist:

```markdown
# E2E Testing Checklist

## Authentication
- [ ] Sign up new user
- [ ] Sign in existing user
- [ ] Sign out
- [ ] Auth state persists after app restart

## Messaging
- [ ] Send one-on-one message
- [ ] Receive message in real-time
- [ ] Messages display correctly
- [ ] Read receipts work
- [ ] Typing indicators work

## Offline
- [ ] Send message while offline
- [ ] Message syncs on reconnection
- [ ] No duplicates after sync

## Group Chat
- [ ] Create group chat
- [ ] Send group message
- [ ] View group members
- [ ] Online/offline status updates

## AI Features
- [ ] Calendar extraction works
- [ ] Events display in Deadlines tab
- [ ] Accuracy >90%
```

---

## 7. Performance Benchmarking

### Performance Logger

```typescript
// lib/utils/performanceLogger.ts
interface PerformanceEntry {
  metric: string;
  value: number;
  timestamp: Date;
  context?: any;
}

class PerformanceLogger {
  private entries: PerformanceEntry[] = [];

  log(metric: string, value: number, context?: any) {
    const entry: PerformanceEntry = {
      metric,
      value,
      timestamp: new Date(),
      context,
    };

    this.entries.push(entry);
    console.log(`[Performance] ${metric}: ${value}ms`, context || '');

    // Check thresholds
    this.checkThreshold(metric, value);
  }

  private checkThreshold(metric: string, value: number) {
    const thresholds: Record<string, number> = {
      'app-launch': 2000,
      'message-send': 200,
      'offline-sync': 1000,
      'ai-extraction': 2000,
    };

    const threshold = thresholds[metric];
    if (threshold && value > threshold) {
      console.warn(`[Performance] ${metric} exceeded threshold: ${value}ms > ${threshold}ms`);
    }
  }

  getReport() {
    return this.entries;
  }

  exportToMarkdown(): string {
    let md = '# Performance Report\n\n';
    md += '| Metric | Value (ms) | Timestamp |\n';
    md += '|--------|------------|----------|\n';

    this.entries.forEach((entry) => {
      md += `| ${entry.metric} | ${entry.value} | ${entry.timestamp.toISOString()} |\n`;
    });

    return md;
  }
}

export const performanceLogger = new PerformanceLogger();
```

---

## Next Steps

Continue with remaining PRs:
- PR #7-8: More AI features (parallel development)
- PR #9: Proactive Assistant
- PR #10A-B: Performance & Testing
- PR #11A-B: Bonus & Documentation
- PR #12: Voice/Video (stretch)

**Total implementation time: ~80-90 hours across 4 days.**

---

← [Back to README](./README.md)
