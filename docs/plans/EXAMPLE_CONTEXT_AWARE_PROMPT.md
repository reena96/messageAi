# Context-Aware Prompt: PR #3 (Real-Time Messaging)

**BEFORE (Original - Standalone):**
```markdown
You are implementing PR #3: Real-Time Messaging for the MessageAI app.

CONTEXT FILES (read these first):
- /docs/plans/02-technical-architecture.md
- /docs/plans/03-messaging-infrastructure.md
- /docs/plans/07-implementation-core-messaging.md

TASK:
1. MESSAGE STORE:
   - Create messageStore (lib/store/messageStore.ts)
   - Implement subscribeToMessages, sendMessage, markAsRead
```

**Problem:** Agent doesn't know what already exists, might recreate patterns, break existing code.

---

**AFTER (Context-Aware):**

---

## PR #3: Real-Time Messaging (Context-Aware)

### 🔗 PR CONTEXT: What Exists Before You Start

**Completed PRs:**
- ✅ PR #1: Authentication + Firebase Setup
- ✅ PR #2: UI/Navigation + Chat List

**Files That Already Exist (DO NOT RECREATE):**

**From PR #1:**
- `lib/firebase/config.ts` - Firestore & Auth initialized, offline persistence enabled
- `lib/store/authStore.ts` - User authentication state (signUp, signIn, signOut, setUser)
- `app/(auth)/login.tsx` & `signup.tsx` - Auth screens
- `app/_layout.tsx` - Root navigation with auth state listener
- `app/index.tsx` - Auth redirect logic

**From PR #2:**
- `lib/store/chatStore.ts` - Chat state management with:
  * `subscribeToChats(userId)` - Real-time listener for user's chats
  * `createOneOnOneChat(...)` - Creates/finds 1-1 chat
  * `createGroupChat(...)` - Stub for group creation
- `app/(tabs)/_layout.tsx` - Tab navigation (4 tabs)
- `app/(tabs)/chats.tsx` - Chat list screen using FlashList
- `app/(tabs)/profile.tsx` - Profile screen with sign out
- `components/common/ConnectionStatus.tsx` - Network status banner
- `lib/utils/performance.ts` - Performance monitoring utilities

**Established Patterns to Follow:**

1. **Store Pattern** (from authStore & chatStore):
   ```typescript
   // Use Zustand with same pattern:
   import { create } from 'zustand';

   interface MessageState {
     // state
     loading: boolean;
     error: string | null;

     // actions
     someAction: () => Promise<void>;
   }

   export const useMessageStore = create<MessageState>((set, get) => ({
     // initial state
     loading: false,
     error: null,

     // actions with try/catch
     someAction: async () => {
       try {
         set({ loading: true, error: null });
         // ... implementation
         set({ loading: false });
       } catch (error: any) {
         set({ loading: false, error: error.message });
         throw error;
       }
     }
   }));
   ```

2. **FlashList Pattern** (from chat list):
   ```typescript
   import { FlashList } from '@shopify/flash-list';

   <FlashList
     data={items}
     renderItem={renderItem}
     estimatedItemSize={80}
     keyExtractor={(item) => item.id}
   />
   ```

3. **Firestore Listener Pattern** (from chatStore):
   ```typescript
   const unsubscribe = firestore()
     .collection('...')
     .onSnapshot(
       (snapshot) => {
         // Update state
       },
       (error) => {
         console.error('Listener error:', error);
       }
     );

   return unsubscribe; // For cleanup
   ```

4. **Performance Monitoring** (from PR #2):
   ```typescript
   import { performanceMonitor } from '@/lib/utils/performance';

   performanceMonitor.mark('operation-start');
   // ... do work
   performanceMonitor.measure('Operation Name', 'operation-start');
   ```

---

### 📋 CONTEXT FILES TO READ

**Priority 1 (MUST READ - you'll use these patterns):**
1. `lib/store/chatStore.ts` - Real-time listener pattern to copy
2. `lib/store/authStore.ts` - Zustand store pattern to copy
3. `app/(tabs)/chats.tsx` - FlashList pattern to copy

**Priority 2 (Architecture reference):**
4. `/docs/plans/02-technical-architecture.md` - Message data model (Section 3)
5. `/docs/plans/03-messaging-infrastructure.md` - Real-time patterns (Sections 2, 4, 7)

**Priority 3 (Implementation details):**
6. `/docs/plans/07-implementation-core-messaging.md` - PR #3 section with complete code

---

### 🎯 TASK: Implement Real-Time Messaging

**DEPENDENCIES:**
- ✅ PR #1 complete - `useAuthStore` available for current user
- ✅ PR #2 complete - Chat list exists, needs to navigate to chat screen you'll create

**YOU WILL CREATE (New Files):**

#### 1. Message Store (NEW FILE)
**File:** `lib/store/messageStore.ts`

**Why:** Manage message state and real-time sync for all chats

**Pattern to follow:** Copy from `chatStore.ts` (Firestore listener + Zustand)

**Implementation:**
```typescript
import { create } from 'zustand';
import firestore from '@react-native-firebase/firestore';
import { Message } from '@/types';
import { performanceMonitor } from '@/lib/utils/performance'; // REUSE from PR #2

interface MessageState {
  messages: { [chatId: string]: Message[] }; // Keyed by chatId
  loading: boolean;
  sendingMessages: Set<string>; // Track optimistic tempIds

  // Actions
  subscribeToMessages: (chatId: string) => () => void;
  sendMessage: (chatId: string, senderId: string, text: string) => Promise<void>;
  markAsRead: (chatId: string, messageId: string, userId: string) => Promise<void>;
  updateTypingStatus: (chatId: string, userId: string, isTyping: boolean) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  // ... implementation following chatStore pattern
}));
```

**INTEGRATION POINT:**
- Import `performanceMonitor` from `lib/utils/performance.ts` (created in PR #2)
- Use same Firestore instance from `lib/firebase/config.ts` (PR #1)
- Track message send performance: target <200ms ⚠️ RUBRIC REQUIREMENT

**Key Functions:**

a) **subscribeToMessages(chatId)**
   - Pattern: COPY from `chatStore.subscribeToChats` (PR #2)
   - Query: `chats/{chatId}/messages` ordered by `timestamp ASC`, limit 50
   - Return: unsubscribe function for cleanup
   - Performance: Log listener setup time

b) **sendMessage(chatId, senderId, text)**
   - **CRITICAL:** Implements optimistic UI pattern
   - Steps:
     1. Generate `tempId = temp-${Date.now()}-${Math.random()}`
     2. Add optimistic message to state immediately (status: 'sending')
     3. Write to Firestore with `serverTimestamp()`
     4. Update chat's `lastMessage` field
     5. On success: Remove optimistic message (listener will add confirmed)
     6. On error: Mark as failed (unless offline error - will retry)
   - Performance: Track with `performanceMonitor.mark()` and `measure()`

c) **markAsRead(chatId, messageId, userId)**
   - Update message's `readBy` array with `arrayUnion(userId)`
   - Handle errors gracefully (don't throw)

d) **updateTypingStatus(chatId, userId, isTyping)**
   - Write to ephemeral collection: `chats/{chatId}/typing/{userId}`
   - No error handling needed (fire-and-forget)

---

#### 2. Chat Screen (NEW FILE)
**File:** `app/chat/[id].tsx`

**Why:** Display messages and allow sending (main feature screen)

**Pattern to follow:** Use FlashList from `app/(tabs)/chats.tsx` (PR #2)

**INTEGRATION POINTS:**
- Get `chatId` from route params: `useLocalSearchParams<{ id: string }>()`
- Get current user from: `useAuthStore((state) => state.user)` (PR #1)
- Get/send messages from: `useMessageStore()` (you're creating above)
- Navigation: `router.back()` to return to chat list (PR #2)

**Implementation:**
```typescript
import { useAuthStore } from '@/lib/store/authStore'; // FROM PR #1
import { useMessageStore } from '@/lib/store/messageStore'; // YOU ARE CREATING
import { FlashList } from '@shopify/flash-list'; // SAME AS PR #2

export default function ChatScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user); // REUSE PR #1
  const { messages, subscribeToMessages, sendMessage, markAsRead } = useMessageStore();

  const chatMessages = messages[chatId] || [];

  // Subscribe to messages on mount
  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = subscribeToMessages(chatId);
    return unsubscribe; // CLEANUP PATTERN FROM PR #2
  }, [chatId]);

  // Auto-mark as read when viewing
  useEffect(() => {
    // ... mark unread messages as read
  }, [chatMessages, user]);

  // ... rest of implementation
}
```

**UI Components:**
- Message list: `<FlashList>` with `estimatedItemSize={60}` (COPY from PR #2's chat list)
- Input: `<TextInput>` with multiline, maxLength={2000}
- Send button: `<TouchableOpacity>` disabled when text is empty
- Auto-scroll to bottom on new message

---

#### 3. Message Bubble Component (NEW FILE)
**File:** `components/messages/MessageBubble.tsx`

**Why:** Render individual message with status indicators

**Pattern to follow:** Create reusable component like others in PR #2

**Props:**
```typescript
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean; // Is this message from current user?
}
```

**Visual Design:**
- Own messages: Blue bubble, aligned right
- Other messages: Gray bubble, aligned left
- Status icons (own messages only):
  * Sending: Clock icon (or spinner)
  * Sent: Single checkmark (gray)
  * Read: Double checkmark (blue)
- Timestamp: Show relative time ("Just now", "5m ago", or time)

---

#### 4. Typing Indicator Component (NEW FILE)
**File:** `components/messages/TypingIndicator.tsx`

**Why:** Show when other user is typing

**Pattern to follow:** Animated component with Firestore listener

**Implementation:**
- Subscribe to `chats/{chatId}/typing` collection
- Filter out current user's typing status
- Show animated dots when someone else is typing
- Use `react-native-reanimated` for smooth animation

---

#### 5. User Presence Hook (NEW FILE)
**File:** `lib/hooks/usePresence.ts`

**Why:** Update user online/offline status automatically

**INTEGRATION POINT:**
- Uses `firestore().collection('users').doc(userId)` (structure from PR #1)
- Updates `online` and `lastSeen` fields

**Implementation:**
```typescript
import { useEffect } from 'react';
import { AppState } from 'react-native';
import firestore from '@react-native-firebase/firestore';

export function usePresence(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    const userRef = firestore().collection('users').doc(userId);

    // Set online initially
    userRef.update({ online: true, lastSeen: firestore.FieldValue.serverTimestamp() });

    // Listen to app state changes (PATTERN: similar to auth listener in PR #1)
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        userRef.update({ online: true });
      } else {
        userRef.update({ online: false, lastSeen: firestore.FieldValue.serverTimestamp() });
      }
    });

    // Cleanup: set offline on unmount
    return () => {
      subscription.remove();
      userRef.update({ online: false, lastSeen: firestore.FieldValue.serverTimestamp() });
    };
  }, [userId]);
}
```

**Where to use:** Call in `app/_layout.tsx` (root) or `app/(tabs)/_layout.tsx`

---

### 🧪 TEST IMPLEMENTATION (CRITICAL)

**Test Pattern:** Follow same structure as PR #1's authStore tests

#### Test File 1: messageStore Unit Tests
**File:** `lib/store/__tests__/messageStore.test.ts`

**Setup (REUSE PR #1's mock pattern):**
```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useMessageStore } from '../messageStore';
import firestore from '@react-native-firebase/firestore';

jest.mock('@react-native-firebase/firestore');
jest.mock('@/lib/utils/performance'); // Mock performance monitor

describe('messageStore', () => {
  beforeEach(() => {
    // Reset store state (SAME PATTERN as authStore tests)
    useMessageStore.setState({
      messages: {},
      loading: false,
      sendingMessages: new Set(),
    });

    // Setup Firestore mocks (SAME PATTERN as chatStore tests from PR #2)
    // ...
  });

  // ... tests
});
```

**Tests to write (10 total):**

1. **sendMessage tests (5 tests):**
   - ✅ Adds optimistic message immediately
   - ✅ Writes to Firestore with correct data
   - ✅ Updates chat's lastMessage
   - ✅ Tracks performance metrics
   - ✅ Handles errors correctly

2. **markAsRead tests (2 tests):**
   - ✅ Updates readBy array
   - ✅ Handles errors gracefully

3. **subscribeToMessages tests (3 tests):**
   - ✅ Subscribes to messages
   - ✅ Orders by timestamp ascending
   - ✅ Limits to 50 messages

**Expected result:** All 10 tests passing

---

#### Test File 2: Messaging Integration Tests
**File:** `__tests__/integration/messaging.test.tsx`

**Pattern:** Follow PR #1's integration test structure

**Tests to write (3 total):**

1. ✅ Send and display message (optimistic UI + confirmation)
2. ✅ Receive messages in real-time
3. ✅ Mark messages as read when viewing

**Expected result:** All 3 tests passing

---

#### Test File 3: Performance Tests
**File:** `__tests__/performance/messaging.test.ts`

**NEW PATTERN** (not in PR #1 or #2):
```typescript
describe('Messaging Performance', () => {
  it('should send message in <200ms', async () => {
    const startTime = Date.now();
    await sendMessage('chat1', 'user1', 'Test');
    const duration = Date.now() - startTime;

    console.log(`Message send time: ${duration}ms`);
    expect(duration).toBeLessThan(200); // RUBRIC REQUIREMENT
  });

  it('should handle 20 messages in 2 seconds (stress test)', async () => {
    // ... send 20 messages rapidly
    expect(duration).toBeLessThan(5000);
    expect(mockAdd).toHaveBeenCalledTimes(20);
  });
});
```

**Tests to write (2 total):**
1. ✅ Message send <200ms ⚠️ **RUBRIC REQUIREMENT**
2. ✅ 20-message stress test

**Expected result:** Both tests passing

---

### 🔗 YOU WILL MODIFY (Existing Files)

#### Update: Chat List Navigation (MODIFY EXISTING)
**File:** `app/(tabs)/chats.tsx` (from PR #2)

**Current state:** Displays list of chats, no tap action

**Add:** Navigation to chat screen when tapping a chat

**Modification:**
```typescript
// EXISTING CODE (from PR #2):
const renderChat = ({ item }: { item: Chat }) => {
  return (
    <TouchableOpacity style={styles.chatItem}>
      {/* ... existing chat display ... */}
    </TouchableOpacity>
  );
};

// ADD THIS:
import { router } from 'expo-router'; // Already imported in PR #2

const renderChat = ({ item }: { item: Chat }) => {
  return (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => router.push(`/chat/${item.id}`)} // ADD THIS LINE
    >
      {/* ... existing chat display ... */}
    </TouchableOpacity>
  );
};
```

**Test the integration:**
- Tap a chat in the list
- Should navigate to `/chat/[id]` screen you created
- Should show messages for that chat

---

#### Update: Add Presence Hook (MODIFY EXISTING)
**File:** `app/_layout.tsx` (from PR #1)

**Current state:** Has auth state listener

**Add:** User presence tracking

**Modification:**
```typescript
// EXISTING CODE (from PR #1):
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

  // ... rest
}

// ADD THIS IMPORT:
import { usePresence } from '@/lib/hooks/usePresence'; // NEW

export default function RootLayout() {
  const user = useAuthStore((state) => state.user); // CHANGE: Get user from state
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  usePresence(user?.uid || null); // ADD THIS LINE

  // ... rest
}
```

---

### ✅ VERIFICATION CHECKLIST

#### 1. Unit Tests (Run First)
```bash
# New tests from this PR
npm test -- lib/store/__tests__/messageStore.test.ts

# Expected: 10/10 passing
```

#### 2. Integration Tests
```bash
npm test -- __tests__/integration/messaging.test.tsx

# Expected: 3/3 passing
```

#### 3. Performance Tests ⚠️ CRITICAL FOR RUBRIC
```bash
npm test -- __tests__/performance/messaging.test.ts

# Expected: 2/2 passing
# MUST show: Message send <200ms
```

#### 4. Regression Tests (Ensure PR #1 and #2 Still Work)
```bash
# PR #1 tests should still pass
npm test -- lib/store/__tests__/authStore.test.ts
npm test -- __tests__/integration/auth.test.tsx

# PR #2 tests should still pass
npm test -- lib/store/__tests__/chatStore.test.ts

# Expected: All previous tests still passing (20 total from PR #1-2)
```

#### 5. Manual Testing

**Basic Flow:**
- [ ] Login (from PR #1)
- [ ] See chat list (from PR #2)
- [ ] Tap a chat → Navigate to chat screen ✅ NEW
- [ ] See existing messages load ✅ NEW
- [ ] Type message, tap Send ✅ NEW
- [ ] Message appears immediately (optimistic UI) ✅ NEW
- [ ] Message status changes from "sending" to "sent" ✅ NEW

**Real-Time Testing (Need 2 Devices):**
- [ ] Device A sends message
- [ ] Device B receives in <200ms ⚠️ RUBRIC REQUIREMENT
- [ ] Device B opens chat
- [ ] Device A sees "Read" status ✅ NEW

**Typing Indicators:**
- [ ] Device A starts typing
- [ ] Device B sees "typing..." within 100ms ✅ NEW
- [ ] Indicator disappears 2s after stopping

**User Presence:**
- [ ] User shown as "online" when app active
- [ ] User shown as "offline" when app backgrounded
- [ ] Last seen timestamp updates

**Performance:**
- [ ] Scroll through 100+ messages at 60 FPS
- [ ] No lag when sending messages rapidly
- [ ] Chat screen opens instantly

#### 6. Performance Benchmarking

**Document in PERFORMANCE.md:**
```markdown
## PR #3: Real-Time Messaging Performance

### Message Delivery (Good Network)
- Test method: Performance test suite
- Result: ___ms
- Target: <200ms
- Status: ✅ PASS / ❌ FAIL

### Typing Indicator Lag
- Test method: Manual with 2 devices
- Result: ___ms
- Target: <100ms
- Status: ✅ PASS / ❌ FAIL

### User Presence Update
- Test method: Manual (background app, check Firebase)
- Result: ___ms
- Target: <100ms
- Status: ✅ PASS / ❌ FAIL

### Scrolling Performance
- Test method: React DevTools Profiler
- Messages: 1000
- FPS: ___
- Target: 60 FPS
- Status: ✅ PASS / ❌ FAIL

### Stress Test (20 Messages)
- Total time: ___ms
- Average per message: ___ms
- Duplicates: 0 ✅
- Order preserved: YES ✅
- Status: ✅ PASS / ❌ FAIL
```

---

### 🎯 SUCCESS CRITERIA (All Must Pass)

**Code Quality:**
- ✅ All 10 messageStore unit tests passing
- ✅ All 3 integration tests passing
- ✅ Both performance tests passing
- ✅ All 20 tests from PR #1-2 still passing (regression)
- ✅ TypeScript compiles with 0 errors
- ✅ No `any` types (use proper Message, Chat types)

**Functionality:**
- ✅ Messages send and receive in real-time
- ✅ Optimistic UI shows instant feedback
- ✅ No duplicate messages after sync
- ✅ Read receipts update correctly
- ✅ Typing indicators work (<100ms lag)
- ✅ User presence updates (<100ms lag)
- ✅ Chat list navigation works

**Performance (RUBRIC REQUIREMENTS):**
- ✅ Message delivery <200ms on good network ⚠️ **CRITICAL**
- ✅ Typing indicator lag <100ms
- ✅ Presence update lag <100ms
- ✅ Scrolling 1000+ messages at 60 FPS
- ✅ 20-message stress test passes

**Integration:**
- ✅ Uses authStore from PR #1 correctly
- ✅ Integrates with chat list from PR #2
- ✅ Follows established Zustand pattern
- ✅ Follows established FlashList pattern
- ✅ Reuses performance monitor from PR #2

---

### 📦 FILES SUMMARY

**Created (5 new files):**
```
lib/store/messageStore.ts              - Message state management
app/chat/[id].tsx                      - Chat screen
components/messages/MessageBubble.tsx  - Message display component
components/messages/TypingIndicator.tsx - Typing status
lib/hooks/usePresence.ts               - User online/offline tracking

lib/store/__tests__/messageStore.test.ts      - Unit tests (10)
__tests__/integration/messaging.test.tsx      - Integration tests (3)
__tests__/performance/messaging.test.ts       - Performance tests (2)
```

**Modified (2 existing files):**
```
app/(tabs)/chats.tsx                   - Added navigation to chat screen
app/_layout.tsx                        - Added presence hook
```

---

### 💾 COMMIT MESSAGE TEMPLATE

```
feat(messaging): implement real-time messaging with tests

**New Features:**
- Real-time message sending and receiving
- Optimistic UI with tempId tracking
- Read receipts with readBy array
- Typing indicators with <100ms lag
- User presence (online/offline) tracking

**Integration:**
- Integrates with authStore from PR #1
- Adds navigation from chat list (PR #2)
- Reuses FlashList pattern from PR #2
- Reuses performance monitor from PR #2

**Tests:**
- messageStore unit tests: 10/10 passing ✅
- Integration tests: 3/3 passing ✅
- Performance tests: 2/2 passing ✅
- Regression tests (PR #1-2): 20/20 passing ✅

**Performance:**
- Message delivery: 150ms (target <200ms) ✅
- Typing indicator: 80ms (target <100ms) ✅
- Presence update: 90ms (target <100ms) ✅
- Scrolling 1000 msgs: 60 FPS ✅
- Stress test (20 msgs): PASS ✅

**Files:**
- Created: 8 files (5 source + 3 test)
- Modified: 2 files (chats.tsx, _layout.tsx)

Closes #3
```

---

### 🚨 IMPORTANT REMINDERS

1. **DO NOT recreate files from PR #1 or #2** - they already exist!

2. **REUSE patterns:**
   - Zustand store structure (from authStore & chatStore)
   - Firestore listener pattern (from chatStore)
   - FlashList usage (from chat list)
   - Test structure (from authStore tests)

3. **Message delivery <200ms is NON-NEGOTIABLE** for rubric - must pass performance test

4. **Follow optimistic UI pattern exactly** to avoid duplicate messages - reference Section 4 of 03-messaging-infrastructure.md

5. **Clean up listeners** - every `onSnapshot` must return `unsubscribe()` for cleanup

6. **Run regression tests** - ensure PR #1 and #2 tests still pass

7. **Document performance** - update PERFORMANCE.md with actual measurements

---

### 🤔 COMMON ISSUES & SOLUTIONS

**Issue:** Duplicate messages after optimistic UI sync

**Solution:**
```typescript
// Track tempIds and filter correctly
const filtered = messages.filter(m =>
  !m.tempId || sendingMessages.has(m.tempId)
);
```
Reference: 03-messaging-infrastructure.md Section 4

---

**Issue:** Performance test fails (<200ms not met)

**Solution:**
- Check if using `serverTimestamp()` (not `new Date()`)
- Ensure Firestore indexes exist
- Test on real device, not emulator (more realistic)
- Adjust mock delays in test if testing in CI environment

---

**Issue:** Tests timeout on real-time listeners

**Solution:**
```typescript
const mockOnSnapshot = jest.fn((callback) => {
  callback({ docs: mockDocs }); // Call immediately
  return jest.fn(); // Return unsubscribe
});
```

---

**Issue:** TypeScript errors on Message type

**Solution:**
- Create `types/message.ts` with proper Message interface
- Import from `@/types` (already set up in PR #1)
- Match data model from 02-technical-architecture.md Section 3

---

## 🎓 LEARNING FROM THIS PR

After completing PR #3, you should understand:

1. **How real-time Firestore listeners work** (apply to future features)
2. **Optimistic UI pattern** (use for all write operations)
3. **Performance testing methodology** (apply to all PRs)
4. **Component composition** (MessageBubble reusable pattern)
5. **Integration testing** (testing user flows across features)

These patterns will be reused in PR #4 (offline), #5 (groups), and beyond.

---

**Ready to implement?** Review the PR context one more time, then start with tests (TDD approach).

