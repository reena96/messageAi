# PR #3: Real-Time Messaging - Task Breakdown

**Estimated Time:** 7-9 hours
**Dependencies:** PR #1 (Authentication), PR #2 (Core UI)
**⚠️ CRITICAL:** This PR must meet <200ms message delivery (rubric requirement)

---

## 📚 Pre-Implementation: Context Review

Before starting, read these files in order:

1. **`docs/prd/ProductRequirements.md`**
   - Section 3.2: MVP Requirements (item 1: Real-time messaging <200ms)
   - Section 4: Success Criteria (Performance targets)

2. **`docs/architecture/TechnicalArchitecture.md`**
   - Section 3: Data Models (Message model structure)
   - Section 5: Performance Targets (<200ms message delivery)
   - Section 2: Message Flow (7-step message delivery flow)

3. **`docs/architecture/MessagingInfrastructure.md`**
   - Section 1: Real-Time Sync Patterns (Firestore listeners)
   - Section 2: Optimistic UI (immediate message display)
   - Section 3: Common Pitfalls (duplicate messages, listener cleanup)

4. **`docs/prPrompts/Pr01AuthSetup.md`**
   - Review authStore pattern (reused for messageStore)
   - Review lifecycle cleanup pattern

5. **`docs/prPrompts/Pr02CoreUI.md`**
   - Review chatStore pattern (messageStore follows same structure)
   - Review real-time listener pattern

6. **`docs/tasks/CoreMessagingTasks.md`**
   - Section "PR #3: Real-Time Messaging"

---

## 🏗️ Key Architecture References

**From TechnicalArchitecture.md:**
- Section 2: Message Flow → 7-step message delivery flow (CRITICAL for understanding)
- Section 3: Data Models → Messages Subcollection `/chats/{chatId}/messages/{messageId}`
- Section 5: Performance Targets → **<200ms delivery on good network (RUBRIC CRITICAL)**

**From MessagingInfrastructure.md:**
- Section 1: Real-Time Sync Patterns → Firestore listener setup and lifecycle
- Section 2: Optimistic UI → tempId generation and matching
- Section 3.2: Message Ordering → Timestamp handling

**Key Patterns to Reuse:**
- ✅ Store pattern from authStore and chatStore
- ✅ Real-time listener pattern from chatStore
- ✅ Error handling pattern from PR #1-2
- ✅ Performance monitoring utilities from PR #2

---

## ✅ Task Breakdown

### **Task 1: Create Message Type Definition**
**Time:** 15 minutes
**Action:** CREATE TypeScript type definitions

#### Subtask 1.1: Create `types/message.ts`
- [ ] Create new file: `types/message.ts`
- [ ] Define `Message` interface with fields:
  - `id: string`
  - `chatId: string`
  - `senderId: string`
  - `text: string`
  - `timestamp: Date`
  - `status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'`
  - `readBy: string[]` (Array of user IDs who read this message)
  - `tempId?: string` (Temporary ID before Firestore confirms)
  - `imageUrl?: string` (optional)
  - `type?: 'text' | 'image'` (optional)

**Reference:** See TechnicalArchitecture.md Section 3 for complete data model
**Pattern:** Same as User and Chat types from PR #1 and #2

---

### **Task 2: Create Message Store**
**Time:** 2 hours
**Action:** CREATE state management for messages with optimistic UI

#### Subtask 2.1: Create `lib/store/messageStore.ts`
- [ ] Create new file: `lib/store/messageStore.ts`
- [ ] Define `MessageState` interface with:
  - State: `messages: { [chatId: string]: Message[] }`, `loading: boolean`, `error: string | null`, `sendingMessages: Set<string>`
  - Actions: `subscribeToMessages`, `sendMessage`, `markAsRead`, `setTyping`, `clearError`
- [ ] Implement `subscribeToMessages(chatId)` action:
  - [ ] Query messages subcollection: `.collection('chats').doc(chatId).collection('messages')`
  - [ ] Order by `timestamp` ascending
  - [ ] Limit to 50 messages
  - [ ] Use `onSnapshot` for real-time updates
  - [ ] Return unsubscribe function for cleanup
  - [ ] Convert Firestore timestamp to Date
- [ ] Implement `sendMessage(chatId, senderId, text)` action:
  - [ ] Generate tempId: `temp-${Date.now()}-${Math.random()}`
  - [ ] Create optimistic message with `status: 'sending'`
  - [ ] Add optimistic message to state immediately (instant UI feedback)
  - [ ] Start performance tracking: `performanceMonitor.mark('message-send-${Date.now()}')`
  - [ ] Write to Firestore messages subcollection
  - [ ] Update chat's `lastMessage` and `updatedAt`
  - [ ] Measure performance: `performanceMonitor.measure('Message Send Time', mark)`
  - [ ] Remove optimistic message (real one comes via onSnapshot)
  - [ ] Log warning if duration > 200ms
  - [ ] Handle errors: mark message as `failed`
- [ ] Implement `markAsRead(chatId, messageId, userId)`:
  - [ ] Update message: `readBy: arrayUnion(userId)`
  - [ ] Don't throw errors (read receipts are not critical)
- [ ] Implement `setTyping(chatId, userId, isTyping)`:
  - [ ] Update chat: `typing.${userId}` to timestamp or null
  - [ ] Don't throw errors (typing indicators are not critical)
- [ ] Implement `clearError()` action

**Reference:** Follow authStore and chatStore patterns
**Key Patterns:**
- Optimistic UI: Show immediately, write to server, remove optimistic on confirm
- Performance monitoring: Mark start, measure duration, warn if >200ms
- Error handling: Critical errors throw, non-critical errors log

#### Subtask 2.2: Create messageStore Unit Tests
- [ ] Create new file: `lib/store/__tests__/messageStore.test.ts`
- [ ] Mock `@react-native-firebase/firestore` and `@/lib/utils/performance`
- [ ] Set up test structure with beforeEach
- [ ] Test `sendMessage`:
  - [ ] Test: Should add optimistic message immediately
  - [ ] Test: Should write message to Firestore
  - [ ] Test: Should update chat lastMessage
  - [ ] Test: Should track performance metrics
  - [ ] Test: Should handle send errors
- [ ] Test `markAsRead`:
  - [ ] Test: Should update readBy array
  - [ ] Test: Should handle errors gracefully (not throw)
- [ ] Test `subscribeToMessages`:
  - [ ] Test: Should subscribe to chat messages
  - [ ] Test: Should order messages by timestamp ascending
  - [ ] Test: Should limit to 50 messages initially
- [ ] Run tests: `npm test -- lib/store/__tests__/messageStore.test.ts`
- [ ] **Expected:** 10/10 tests passing

**Reference:** Follow test patterns from authStore and chatStore tests
**Pattern:** AAA pattern, renderHook, waitFor

---

### **Task 3: Create Chat Screen**
**Time:** 2 hours
**Action:** CREATE dynamic chat screen with real-time messaging

#### Subtask 3.1: Create `app/chat/[id].tsx`
- [ ] Create new directory: `app/chat/`
- [ ] Create new file: `app/chat/[id].tsx`
- [ ] Import dependencies:
  - [ ] `useLocalSearchParams` to get chatId from URL
  - [ ] `useAuthStore`, `useMessageStore`
  - [ ] `MessageBubble`, `TypingIndicator` components
  - [ ] `KeyboardAvoidingView`, `FlatList`, `TextInput`
- [ ] Set up state:
  - [ ] `inputText` for message input
  - [ ] `isTyping` for tracking user's typing state
  - [ ] `flatListRef` for auto-scroll
  - [ ] `typingTimeoutRef` for typing indicator debounce
- [ ] Subscribe to messages on mount:
  - [ ] Use `useEffect` with `subscribeToMessages(chatId)`
  - [ ] Return cleanup function calling `unsubscribe()`
- [ ] Mark messages as read:
  - [ ] Use `useEffect` watching `chatMessages`
  - [ ] For each unread message (not in readBy), call `markAsRead`
- [ ] Implement typing indicator:
  - [ ] On text change: set typing to true, call `setTyping(chatId, userId, true)`
  - [ ] Clear previous timeout
  - [ ] Set new timeout (2s) to stop typing: `setTyping(chatId, userId, false)`
- [ ] Implement `handleSend`:
  - [ ] Check input is not empty
  - [ ] Clear input immediately
  - [ ] Stop typing indicator
  - [ ] Call `sendMessage(chatId, userId, text)`
  - [ ] Auto-scroll to bottom after send
- [ ] Render UI:
  - [ ] Use `KeyboardAvoidingView` for iOS keyboard handling
  - [ ] Render `FlatList` with messages
  - [ ] Use `tempId || id` as key for optimistic messages
  - [ ] Render `TypingIndicator` component
  - [ ] Render input with Send button
  - [ ] Disable Send button if input empty
- [ ] Add styles for: container, messageList, inputContainer, input, sendButton

**Pattern:**
- Lifecycle management with cleanup
- Keyboard handling for mobile
- Auto-scroll to bottom on new messages

---

### **Task 4: Create Message Components**
**Time:** 1 hour
**Action:** CREATE message UI components

#### Subtask 4.1: Create `components/messages/MessageBubble.tsx`
- [ ] Create new directory: `components/messages/`
- [ ] Create new file: `components/messages/MessageBubble.tsx`
- [ ] Accept props: `message: Message`, `isOwnMessage: boolean`
- [ ] Define status icons:
  - `sending: '○'`
  - `sent: '✓'`
  - `delivered: '✓✓'`
  - `read: '✓✓'` (blue color)
  - `failed: '✗'`
- [ ] Define status colors (sending/sent/delivered: gray, read: blue, failed: red)
- [ ] Render message bubble:
  - [ ] Different alignment for own vs other messages (flex-end vs flex-start)
  - [ ] Different bubble color (own: blue, other: gray)
  - [ ] Show message text
  - [ ] Show timestamp (formatted as "3:45 PM")
  - [ ] Show status icon for own messages only
  - [ ] Red bubble background if failed
- [ ] Add styles for: container, bubble, text, footer, timestamp, status

**Pattern:** Component composition, conditional styling

#### Subtask 4.2: Create `components/messages/TypingIndicator.tsx`
- [ ] Create new file: `components/messages/TypingIndicator.tsx`
- [ ] Accept props: `chatId: string`, `currentUserId: string`
- [ ] Set up state: `typingUsers: string[]`
- [ ] Subscribe to chat document:
  - [ ] Use `useEffect` with Firestore listener on chat doc
  - [ ] Watch `typing` field (object with userId → timestamp)
  - [ ] Filter typing users: exclude current user, check timestamp <3s old
  - [ ] Update `typingUsers` state
  - [ ] Return cleanup function
- [ ] Render logic:
  - [ ] Return null if no typing users
  - [ ] Show "Someone is typing..." if 1 user
  - [ ] Show "Multiple people are typing..." if >1 user
- [ ] Add styles for: container, text (italic, gray)

**Pattern:** Real-time listener, lifecycle cleanup, conditional rendering

---

### **Task 5: Create Integration Tests**
**Time:** 30 minutes
**Action:** CREATE end-to-end messaging tests

#### Subtask 5.1: Create `__tests__/integration/messaging.test.tsx`
- [ ] Create new directory: `__tests__/integration/`
- [ ] Create new file: `__tests__/integration/messaging.test.tsx`
- [ ] Mock Firestore, authStore, expo-router
- [ ] Test: Should send and display message
  - [ ] Render ChatScreen
  - [ ] Type message in input
  - [ ] Press send button
  - [ ] Verify optimistic message appears immediately
  - [ ] Verify Firestore add called
- [ ] Test: Should receive messages in real-time
  - [ ] Mock onSnapshot to return incoming message
  - [ ] Render ChatScreen
  - [ ] Wait for message to appear
  - [ ] Verify message displayed
- [ ] Test: Should mark messages as read when viewing
  - [ ] Mock onSnapshot with unread message
  - [ ] Render ChatScreen
  - [ ] Verify markAsRead called with correct userId
- [ ] Run tests: `npm test -- __tests__/integration/messaging.test.tsx`
- [ ] **Expected:** 3/3 tests passing

**Pattern:** Integration testing with mocked dependencies

---

### **Task 6: Create Performance Tests**
**Time:** 30 minutes
**Action:** CREATE performance verification tests (RUBRIC REQUIREMENT)

#### Subtask 6.1: Create `__tests__/performance/messaging.test.ts`
- [ ] Create new directory: `__tests__/performance/`
- [ ] Create new file: `__tests__/performance/messaging.test.ts`
- [ ] Mock Firestore
- [ ] Test: Should send message in <200ms (RUBRIC)
  - [ ] Measure start time
  - [ ] Call `sendMessage`
  - [ ] Measure end time
  - [ ] Calculate duration
  - [ ] Log duration
  - [ ] Assert duration < 200ms
- [ ] Test: Should handle 20 messages in rapid succession
  - [ ] Send 20 messages with 100ms delay between each
  - [ ] Measure total time
  - [ ] Calculate average per message
  - [ ] Verify all messages sent
  - [ ] Assert total time < 5000ms
- [ ] Run tests: `npm test -- __tests__/performance/messaging.test.ts`
- [ ] **Expected:** 2/2 tests passing, <200ms verified

**⚠️ CRITICAL:** These tests verify rubric requirement

---

## 🧪 Testing & Verification

### **Task 7: Run All Tests**
**Time:** 10 minutes

- [ ] Run messageStore tests: `npm test -- lib/store/__tests__/messageStore.test.ts`
  - [ ] Verify: 10/10 tests passing
- [ ] Run integration tests: `npm test -- __tests__/integration/messaging.test.tsx`
  - [ ] Verify: 3/3 tests passing
- [ ] Run performance tests: `npm test -- __tests__/performance/messaging.test.ts`
  - [ ] Verify: 2/2 tests passing, <200ms ✅
- [ ] Run regression tests from PR #1-2:
  - [ ] `npm test -- lib/store/__tests__/authStore.test.ts` (16 tests)
  - [ ] `npm test -- lib/store/__tests__/chatStore.test.ts` (7 tests)
- [ ] Run all tests: `npm test`
  - [ ] **Expected Total:** 38/38 tests passing

### **Task 8: TypeScript Validation**
**Time:** 5 minutes

- [ ] Run TypeScript compiler: `npx tsc --noEmit`
- [ ] Verify: 0 errors
- [ ] Check Message type properly defined
- [ ] Check all imports correct

### **Task 9: Build Verification**
**Time:** 15 minutes

- [ ] Run iOS build: `npx expo run:ios`
  - [ ] Verify: Builds without errors
- [ ] Run Android build: `npx expo run:android`
  - [ ] Verify: Builds without errors

### **Task 10: Manual Testing**
**Time:** 30 minutes

**Send Message:**
- [ ] Log in, navigate to chat
- [ ] Type message, tap Send
- [ ] Verify: Message appears immediately (optimistic UI)
- [ ] Verify: Message shows sending indicator (○)
- [ ] Verify: Indicator changes to sent (✓) after confirmation
- [ ] Verify: No duplicates
- [ ] Verify: Input clears after send

**Receive Message:**
- [ ] Second device sends message
- [ ] Verify: Message appears in <200ms
- [ ] Verify: Correct sender
- [ ] Verify: Timestamp correct

**Read Receipts:**
- [ ] Send message from device A
- [ ] Open chat on device B
- [ ] Verify: Device A shows "Read" status (✓✓ in blue)

**Typing Indicators:**
- [ ] Start typing on device A
- [ ] Verify: Device B shows "typing..." within 100ms
- [ ] Stop typing
- [ ] Verify: Indicator disappears after 2s

**Performance:**
- [ ] Scroll through 50+ messages
- [ ] Verify: Smooth at 60 FPS
- [ ] Send 5 messages rapidly
- [ ] Verify: No lag, all appear instantly

---

## 📦 Deliverables Summary

**Files Created (8):**
```
✅ types/message.ts
✅ lib/store/messageStore.ts
✅ lib/store/__tests__/messageStore.test.ts
✅ app/chat/[id].tsx
✅ components/messages/MessageBubble.tsx
✅ components/messages/TypingIndicator.tsx
✅ __tests__/integration/messaging.test.tsx
✅ __tests__/performance/messaging.test.ts
```

---

## ✅ Success Criteria Checklist

- [ ] All tests passing: 38/38 (15 new + 23 regression)
- [ ] Performance tests passing: **<200ms message delivery** ⚠️ RUBRIC
- [ ] TypeScript: 0 errors
- [ ] iOS build: Success
- [ ] Android build: Success
- [ ] Messages send instantly (optimistic UI)
- [ ] Messages sync in real-time (<200ms)
- [ ] Read receipts work
- [ ] Typing indicators work
- [ ] No console errors or warnings
- [ ] No memory leaks (listeners cleaned up)
- [ ] Performance monitoring integrated

---

## 💾 Git Commit

**When ready to commit:**

```bash
git add .
git commit -m "feat(messaging): implement real-time messaging with <200ms delivery

- Real-time messaging with Firestore listeners
- Optimistic UI for instant message display
- Read receipts and typing indicators
- Performance monitoring for <200ms verification
- Message document in Firestore /chats/{chatId}/messages
- messageStore with real-time subscriptions
- Tests: 38/38 passing (15 new + 23 regression)
- Performance: <200ms delivery ✅ RUBRIC REQUIREMENT MET

Closes #3"
```

---

## 🔗 Integration Context

**What this PR builds on (from PR #1-2):**
- authStore → Get current user for senderId
- chatStore → Update lastMessage when sending
- performanceMonitor → Track message send time
- Firebase config → Firestore operations

**What this PR enables (for future PRs):**
- PR #4: Will modify messageStore to handle offline errors
- PR #5: Will use messageStore for group chat messages
- PR #10: Will use performance tests as baseline

---

## 📚 Next Steps

After PR #3 is complete and merged:

**Move to PR #4: Offline Support**
- File: `docs/prPrompts/Pr04Offline.md`
- Will modify messageStore for offline error handling
- Will test 7 offline scenarios (rubric requirement)
- Will add retry logic for failed messages
- Estimated time: 5-7 hours
