# PR #2: Core UI + Navigation + Performance

**Estimated Time:** 4-5 hours
**Dependencies:** PR #1 (Authentication)

---

## 📚 Context Files to Read

Read these files in order for context:

1. **`docs/prd/ProductRequirements.md`**
   - Section 3.2: MVP Requirements (items 8-9: UI/navigation)
   - Section 5: Timeline (Day 1 completion target)

2. **`docs/architecture/TechnicalArchitecture.md`**
   - Section 1: Tech Stack (React Native, Expo Router, Zustand)
   - Section 3: Data Models (Chat model structure)
   - Section 6: File Structure

3. **`docs/architecture/MessagingInfrastructure.md`**
   - Section 1: Real-Time Sync Patterns (Firestore listeners)
   - Section 3.2: Optimistic UI (chat list updates)

4. **`docs/prPrompts/Pr01AuthSetup.md`**
   - Review authStore pattern (will be reused for chatStore)
   - Review store testing pattern (will be reused)

5. **`docs/tasks/CoreMessagingTasks.md`**
   - Section "PR #2: Core UI + Navigation + Performance"
   - Complete code examples and test implementation

---

## 🏗️ What Already Exists (Code Reuse)

**From PR #1:**
- ✅ **authStore** (`lib/store/authStore.ts`)
  - Pattern: State management with loading/error states
  - **Reuse:** chatStore will follow same structure
  - Available globally via: `const user = useAuthStore(state => state.user)`

- ✅ **Firebase config** (`lib/firebase/config.ts`)
  - Firestore initialized with offline persistence
  - **Reuse:** Import firestore for chat operations
  - Pattern: `import { firestore } from '@/lib/firebase/config'`

- ✅ **Navigation structure** (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`)
  - Root layout with auth listener
  - Tabs layout (placeholder)
  - **Modify:** Fill in tabs with Chats and Profile screens

- ✅ **TypeScript types** (`types/user.ts`)
  - User interface defined
  - **Reuse:** Will be referenced in Chat type

- ✅ **Store pattern** (from authStore)
  - Interface with data, loading, error
  - Actions with try/catch error handling
  - **Reuse:** chatStore follows identical pattern

- ✅ **Test patterns** (`lib/store/__tests__/authStore.test.ts`)
  - AAA pattern (Arrange, Act, Assert)
  - Mock Firestore setup
  - **Reuse:** chatStore tests follow same structure

**After this PR:**
- ✅ chatStore available globally
- ✅ Tab navigation with Chats and Profile screens
- ✅ Performance monitoring utilities
- ✅ Connection status indicator
- ✅ 7 tests passing (chatStore)

---

## ✅ Tasks Breakdown

### Task 1: Create Chat Type (15 min)

**Action:** CREATE TypeScript type definitions

#### 1.1: CREATE `types/chat.ts`

**File:** `types/chat.ts`
**Purpose:** Define Chat data model for type safety

**Implementation:**
```typescript
import { User } from './user';

export interface Chat {
  id: string;
  type: 'one-on-one' | 'group';
  participants: string[]; // Array of user IDs
  participantDetails: {
    [userId: string]: {
      displayName: string;
      photoURL?: string;
    };
  };
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Date;
  };
  unreadCount: {
    [userId: string]: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  // Group-specific fields
  groupName?: string;
  groupPhoto?: string;
}
```

**Software Engineering Principles:**
- **Type Safety:** Prevents runtime errors from wrong data types
- **Data Abstraction:** Separates Firestore schema from TypeScript types
- **Documentation:** Types serve as inline documentation

**Pattern to Follow:**
- Same as User type from PR #1
- All data models in `types/` directory
- Optional fields use `?` operator

---

### Task 2: Chat Store (1.5 hours)

**Action:** CREATE state management for chats

#### 2.1: CREATE `lib/store/chatStore.ts`

**File:** `lib/store/chatStore.ts`
**Purpose:** Manage chat list state and operations

**Implementation:**
```typescript
import { create } from 'zustand';
import { firestore } from '@/lib/firebase/config';
import { Chat } from '@/types/chat';

interface ChatState {
  chats: Chat[];
  loading: boolean;
  error: string | null;

  // Actions
  subscribeToChats: (userId: string) => () => void;
  createOneOnOneChat: (
    currentUserId: string,
    otherUserId: string,
    otherUserDetails: { displayName: string; photoURL?: string }
  ) => Promise<string>;
  createGroupChat: (
    currentUserId: string,
    participantIds: string[],
    groupName: string
  ) => Promise<string>;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  chats: [],
  loading: false,
  error: null,

  // Subscribe to user's chats (real-time listener)
  subscribeToChats: (userId) => {
    set({ loading: true, error: null });

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

          set({ chats, loading: false });
        },
        (error) => {
          console.error('Error subscribing to chats:', error);
          set({ loading: false, error: error.message });
        }
      );

    // Return unsubscribe function
    return unsubscribe;
  },

  // Create one-on-one chat (or return existing)
  createOneOnOneChat: async (currentUserId, otherUserId, otherUserDetails) => {
    try {
      set({ loading: true, error: null });

      // Check if chat already exists
      const existingChats = await firestore()
        .collection('chats')
        .where('type', '==', 'one-on-one')
        .where('participants', 'array-contains', currentUserId)
        .get();

      const existingChat = existingChats.docs.find((doc) => {
        const participants = doc.data().participants as string[];
        return participants.includes(otherUserId);
      });

      if (existingChat) {
        set({ loading: false });
        return existingChat.id;
      }

      // Create new chat
      const chatRef = await firestore()
        .collection('chats')
        .add({
          type: 'one-on-one',
          participants: [currentUserId, otherUserId],
          participantDetails: {
            [otherUserId]: otherUserDetails,
          },
          unreadCount: {
            [currentUserId]: 0,
            [otherUserId]: 0,
          },
          createdBy: currentUserId,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      set({ loading: false });
      return chatRef.id;
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Create group chat
  createGroupChat: async (currentUserId, participantIds, groupName) => {
    try {
      set({ loading: true, error: null });

      const allParticipants = [currentUserId, ...participantIds];
      const unreadCount: { [userId: string]: number } = {};
      allParticipants.forEach((id) => {
        unreadCount[id] = 0;
      });

      const chatRef = await firestore()
        .collection('chats')
        .add({
          type: 'group',
          participants: allParticipants,
          groupName,
          participantDetails: {}, // Will be populated as users join
          unreadCount,
          createdBy: currentUserId,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      set({ loading: false });
      return chatRef.id;
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
```

**Software Engineering Principles:**

1. **State Pattern:** Centralized state management (same as authStore)
2. **Observer Pattern:** Real-time listener with onSnapshot
3. **Lifecycle Management:** Return unsubscribe function for cleanup
4. **Error Handling Pattern:** Consistent try/catch (same as authStore)
5. **Separation of Concerns:** chatStore handles state, Firestore handles persistence

**Pattern to Follow (same as authStore):**
- Interface with data, loading, error
- Actions with error handling
- Real-time listeners return unsubscribe function

**Reused from authStore:**
```typescript
// Same error handling pattern
try {
  set({ loading: true, error: null });
  // ... async operation
  set({ loading: false });
} catch (error: any) {
  set({ loading: false, error: error.message });
  throw error;
}
```

#### 2.2: CREATE chatStore Unit Tests

**File:** `lib/store/__tests__/chatStore.test.ts`
**Purpose:** Test chat operations without Firebase

**Implementation:**
```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useChatStore } from '../chatStore';
import firestore from '@react-native-firebase/firestore';

jest.mock('@react-native-firebase/firestore');

describe('chatStore', () => {
  let mockFirestore: any;

  beforeEach(() => {
    useChatStore.setState({ chats: [], loading: false, error: null });

    mockFirestore = {
      collection: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        onSnapshot: jest.fn((callback) => {
          // Simulate initial data
          callback({
            docs: [
              {
                id: 'chat1',
                data: () => ({
                  type: 'one-on-one',
                  participants: ['user1', 'user2'],
                  lastMessage: { text: 'Hello', senderId: 'user2', timestamp: new Date() },
                }),
              },
            ],
          });
          return jest.fn(); // unsubscribe
        }),
        get: jest.fn(),
        add: jest.fn(),
      })),
      FieldValue: {
        serverTimestamp: jest.fn(() => 'TIMESTAMP'),
      },
    };

    (firestore as jest.Mock).mockReturnValue(mockFirestore);
  });

  describe('subscribeToChats', () => {
    it('should load user chats on subscribe', async () => {
      const { result } = renderHook(() => useChatStore());

      let unsubscribe: any;
      act(() => {
        unsubscribe = result.current.subscribeToChats('user1');
      });

      await waitFor(() => {
        expect(result.current.chats.length).toBe(1);
      });

      expect(result.current.chats[0].id).toBe('chat1');
      expect(result.current.loading).toBe(false);

      act(() => unsubscribe());
    });

    it('should filter chats by user participants', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.subscribeToChats('user1');
      });

      expect(mockFirestore.collection).toHaveBeenCalledWith('chats');
      expect(mockFirestore.collection().where).toHaveBeenCalledWith(
        'participants',
        'array-contains',
        'user1'
      );
    });

    it('should order chats by updatedAt descending', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.subscribeToChats('user1');
      });

      expect(mockFirestore.collection().orderBy).toHaveBeenCalledWith(
        'updatedAt',
        'desc'
      );
    });

    it('should limit chats to 100', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.subscribeToChats('user1');
      });

      expect(mockFirestore.collection().limit).toHaveBeenCalledWith(100);
    });
  });

  describe('createOneOnOneChat', () => {
    it('should return existing chat if already exists', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        docs: [
          {
            id: 'existing-chat',
            data: () => ({
              participants: ['user1', 'user2'],
              type: 'one-on-one',
            }),
          },
        ],
      });

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        get: mockGet,
        add: jest.fn(),
      });

      const { result } = renderHook(() => useChatStore());

      const chatId = await act(async () => {
        return await result.current.createOneOnOneChat(
          'user1',
          'user2',
          { displayName: 'User Two', photoURL: '' }
        );
      });

      expect(chatId).toBe('existing-chat');
    });

    it('should create new chat if none exists', async () => {
      const mockGet = jest.fn().mockResolvedValue({ docs: [] });
      const mockAdd = jest.fn().mockResolvedValue({ id: 'new-chat' });

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        get: mockGet,
        add: mockAdd,
      });

      const { result } = renderHook(() => useChatStore());

      const chatId = await act(async () => {
        return await result.current.createOneOnOneChat(
          'user1',
          'user2',
          { displayName: 'User Two', photoURL: 'url' }
        );
      });

      expect(chatId).toBe('new-chat');
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'one-on-one',
          participants: ['user1', 'user2'],
        })
      );
    });
  });

  describe('createGroupChat', () => {
    it('should create group chat with participants', async () => {
      const mockAdd = jest.fn().mockResolvedValue({ id: 'group-chat' });

      mockFirestore.collection.mockReturnValue({
        add: mockAdd,
      });

      const { result } = renderHook(() => useChatStore());

      const chatId = await act(async () => {
        return await result.current.createGroupChat(
          'user1',
          ['user2', 'user3'],
          'Family Chat'
        );
      });

      expect(chatId).toBe('group-chat');
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'group',
          participants: ['user1', 'user2', 'user3'],
          groupName: 'Family Chat',
          createdBy: 'user1',
        })
      );
    });
  });
});
```

**Test Pattern (same as authStore):**
- AAA pattern (Arrange, Act, Assert)
- Mock Firestore before each test
- Reset store state before each test

**Run tests:**
```bash
npm test -- lib/store/__tests__/chatStore.test.ts
# Expected: 7/7 tests passing
```

---

### Task 3: Performance Utilities (30 min)

**Action:** CREATE performance monitoring

#### 3.1: CREATE `lib/utils/performance.ts`

**File:** `lib/utils/performance.ts`
**Purpose:** Monitor and log performance metrics

**Implementation:**
```typescript
interface PerformanceMark {
  name: string;
  timestamp: number;
}

class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map();
  private measurements: Array<{ name: string; duration: number; timestamp: Date }> = [];

  mark(name: string) {
    this.marks.set(name, {
      name,
      timestamp: Date.now(),
    });
  }

  measure(measureName: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : { timestamp: Date.now() };

    if (!start || !end) {
      console.warn(`Performance mark not found: ${startMark} or ${endMark}`);
      return;
    }

    const duration = end.timestamp - start.timestamp;
    this.measurements.push({
      name: measureName,
      duration,
      timestamp: new Date(),
    });

    // Log if exceeds threshold
    if (duration > 200) {
      console.warn(`⚠️ Performance: ${measureName} took ${duration}ms (target: <200ms)`);
    } else {
      console.log(`✅ Performance: ${measureName} took ${duration}ms`);
    }

    return duration;
  }

  getMeasurements() {
    return this.measurements;
  }

  clearMarks() {
    this.marks.clear();
  }

  clearMeasurements() {
    this.measurements = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

**Software Engineering Principles:**
- **Singleton Pattern:** Single instance for entire app
- **Encapsulation:** Private marks/measurements, public methods
- **Threshold Monitoring:** Warn if >200ms (rubric requirement)

**Pattern to Follow:**
```typescript
// Usage in messageStore (PR #3)
performanceMonitor.mark('message-send-start');
await sendToFirestore();
performanceMonitor.measure('Message Send Time', 'message-send-start');
```

---

### Task 4: Tab Navigation (30 min)

**Action:** MODIFY existing tab layout, CREATE screens

#### 4.1: MODIFY `app/(tabs)/_layout.tsx`

**File:** `app/(tabs)/_layout.tsx`
**Purpose:** Add Chats and Profile tabs

**Existing code (from PR #1):**
```typescript
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="chats" options={{ title: 'Chats' }} />
    </Tabs>
  );
}
```

**MODIFY to:**
```typescript
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
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

**Changes:**
- **MODIFY:** Add tabBarActiveTintColor, tabBarInactiveTintColor
- **ADD:** Profile tab screen
- **ADD:** Icons for both tabs

#### 4.2: MODIFY `app/(tabs)/chats.tsx`

**File:** `app/(tabs)/chats.tsx`
**Purpose:** Display chat list with real-time updates

**Existing code (from PR #1):**
```typescript
import { View, Text, StyleSheet } from 'react-native';

export default function ChatsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Chats Screen - Coming in PR #2</Text>
    </View>
  );
}
```

**MODIFY to:**
```typescript
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useChatStore } from '@/lib/store/chatStore';
import { useAuthStore } from '@/lib/store/authStore';
import ConnectionStatus from '@/components/common/ConnectionStatus';

export default function ChatsScreen() {
  const user = useAuthStore((state) => state.user);
  const { chats, loading, subscribeToChats } = useChatStore();

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time chat updates
    const unsubscribe = subscribeToChats(user.uid);

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [user]);

  const renderChatItem = ({ item }: { item: any }) => {
    const otherUserId = item.participants.find((id: string) => id !== user?.uid);
    const otherUserDetails = item.participantDetails[otherUserId];
    const displayName = item.type === 'group' ? item.groupName : otherUserDetails?.displayName;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{displayName}</Text>
          {item.lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage.text}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && chats.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ConnectionStatus />
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation!</Text>
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
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});
```

**Software Engineering Principles:**
- **Lifecycle Management:** useEffect with cleanup (same as authStore listener)
- **Component Composition:** Small, focused component
- **Real-Time Updates:** onSnapshot listener from chatStore

**Pattern Reused from PR #1:**
```typescript
useEffect(() => {
  const unsubscribe = subscribeToChats(user.uid);
  return () => unsubscribe(); // Cleanup
}, [user]);
```

#### 4.3: CREATE `app/(tabs)/profile.tsx`

**File:** `app/(tabs)/profile.tsx`
**Purpose:** User profile with logout

**Implementation:**
```typescript
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/store/authStore';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.displayName?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.displayName || 'User'}</Text>
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
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
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
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
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

---

### Task 5: Connection Status Component (20 min)

**Action:** CREATE network status indicator

#### 5.1: CREATE `components/common/ConnectionStatus.tsx`

**File:** `components/common/ConnectionStatus.tsx`
**Purpose:** Show banner when offline

**Implementation:**
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (isConnected) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FF3B30',
    padding: 8,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

**Software Engineering Principles:**
- **Observer Pattern:** Listen to network state changes
- **Lifecycle Management:** Cleanup listener on unmount
- **User Feedback:** Clear visual indicator of offline state

---

## 🔄 Patterns to Follow (Software Engineering Principles)

### 1. **Store Pattern (Reused from authStore)**

**Pattern:**
```typescript
interface StoreState {
  data: Type[];
  loading: boolean;
  error: string | null;
  action: (...args) => Promise<void>;
  subscribeAction: (id: string) => () => void; // Returns unsubscribe
}
```

**Reused in:** chatStore (this PR), messageStore (PR #3)

### 2. **Real-Time Listener Pattern**

**Principle:** Firestore onSnapshot for live updates

**Pattern:**
```typescript
subscribeToSomething: (id) => {
  const unsubscribe = firestore()
    .collection('items')
    .where('field', '==', id)
    .onSnapshot(
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        set({ data, loading: false });
      },
      (error) => {
        set({ loading: false, error: error.message });
      }
    );

  return unsubscribe; // For cleanup
};
```

**Reuse in:** PR #3 (message listeners)

### 3. **Lifecycle Cleanup Pattern (Reused from PR #1)**

**Pattern:**
```typescript
useEffect(() => {
  const unsubscribe = subscribeToData();
  return () => unsubscribe();
}, [dependency]);
```

**Why:** Prevents memory leaks from active listeners

---

## 🔗 Integration Points

**From PR #1:**
1. **authStore.user** - Used to get current user ID for chat queries
2. **Firebase config** - Imported for Firestore operations
3. **Navigation structure** - Tabs filled in, screens added

**After this PR:**
1. **chatStore available globally**
   - Any component can access: `const chats = useChatStore(state => state.chats)`
   - Used in PR #3 for updating lastMessage
   - Used in PR #5 for group chat creation

2. **Chat list screen**
   - Navigates to `/chat/[id]` (will be created in PR #3)
   - Displays real-time updates from Firestore

3. **Performance utilities**
   - Used in PR #3 for message send timing
   - Used in PR #10 for performance testing

4. **Connection status**
   - Used throughout app for network awareness
   - Reused in PR #4 for offline mode testing

**For next PRs:**
- PR #3 will CREATE `/app/chat/[id].tsx` (chat screen)
- PR #3 will CREATE `lib/store/messageStore.ts` (following chatStore pattern)
- PR #3 will USE performanceMonitor for <200ms verification

---

## 🧪 Regression Testing

**Must continue passing from PR #1:**
```bash
npm test -- lib/store/__tests__/authStore.test.ts
# Expected: 16/16 tests from PR #1 still passing
```

**Why:** Ensure this PR doesn't break authentication

---

## ✅ Success Criteria

### Must Pass:

**1. All Tests Passing:**
```bash
npm test
```
- ✅ 16/16 tests from PR #1 (regression)
- ✅ 7/7 chatStore unit tests (new)
- **Total: 23/23 tests passing**

**2. TypeScript Compilation:**
```bash
npx tsc --noEmit
```
- ✅ 0 errors
- ✅ Chat type properly defined
- ✅ All imports correct

**3. Build Success:**
```bash
npx expo prebuild
npx expo run:ios
npx expo run:android
```
- ✅ iOS builds without errors
- ✅ Android builds without errors

**4. Manual Testing:**

**Tab Navigation:**
- [ ] Log in to app
- [ ] ✅ See "Chats" and "Profile" tabs at bottom
- [ ] Tap Profile tab
- [ ] ✅ Profile screen displays
- [ ] Tap Chats tab
- [ ] ✅ Chats screen displays

**Chat List:**
- [ ] On Chats screen
- [ ] ✅ Empty state shows "No chats yet"
- [ ] ✅ No crashes or errors

**Profile:**
- [ ] On Profile screen
- [ ] ✅ User name displays correctly
- [ ] ✅ User email displays correctly
- [ ] ✅ Avatar shows first letter of name
- [ ] Tap "Sign Out"
- [ ] ✅ Logged out successfully
- [ ] ✅ Redirected to login screen

**Connection Status:**
- [ ] Turn on airplane mode
- [ ] ✅ Red banner appears: "No internet connection"
- [ ] Turn off airplane mode
- [ ] ✅ Banner disappears

**Performance:**
- [ ] Tab switches complete in <100ms (smooth)
- [ ] No lag when navigating
- [ ] No memory leaks (check React DevTools)

**5. Code Quality:**
- [ ] No `console.log` statements (except in performance utils)
- [ ] No `any` types (all properly typed)
- [ ] Consistent style (Prettier/ESLint)

---

## 📦 Deliverables Checklist

**Files Created:**
```
✅ types/chat.ts
✅ lib/store/chatStore.ts
✅ lib/store/__tests__/chatStore.test.ts
✅ lib/utils/performance.ts
✅ components/common/ConnectionStatus.tsx
✅ app/(tabs)/profile.tsx
```

**Files Modified:**
```
✅ app/(tabs)/_layout.tsx (added Profile tab, icons)
✅ app/(tabs)/chats.tsx (replaced placeholder with real implementation)
```

**Total:** 6 files created, 2 files modified

---

## 💾 Commit Message

```
feat(ui): add tab navigation, chat list, and performance monitoring

**Features:**
- Tab navigation with Chats and Profile screens
- Real-time chat list with Firestore listeners
- Profile screen with sign out
- Connection status indicator for offline mode
- Performance monitoring utilities

**Data Model:**
- Chat type defined with one-on-one and group support
- Chat document created in Firestore /chats/{chatId}

**State Management:**
- chatStore with subscribeToChats, createOneOnOneChat, createGroupChat
- Real-time listener pattern for live updates
- Lifecycle cleanup to prevent memory leaks

**Tests:**
- chatStore unit tests: 7/7 passing ✅
- PR #1 regression tests: 16/16 passing ✅
- Total: 23/23 tests passing ✅

**Files Created:** 6
**Files Modified:** 2
**TypeScript Errors:** 0
**Build Status:** ✅ iOS & Android

Closes #2
```

---

## 📚 Next Steps

After PR #2 is complete and merged:

**Move to PR #3: Real-Time Messaging**
- File: `docs/prPrompts/Pr03Messaging.md`
- Will build on chatStore pattern
- Will add messageStore (following same structure)
- Will add chat screen with real-time message sync
- **CRITICAL:** Must meet <200ms message delivery (rubric requirement)
- Estimated time: 7-9 hours
