# PR #2: Core UI + Navigation + Performance - Task Breakdown

**Estimated Time:** 4-5 hours
**Dependencies:** PR #1 (Authentication)

---

## 📚 Pre-Implementation: Context Review

Before starting, read these files in order:

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

---

## 🏗️ Key Architecture References

**From TechnicalArchitecture.md:**
- Section 2: System Architecture → Mobile App Layer (Tab navigation)
- Section 3: Data Models → Chats Collection `/chats/{chatId}`
- Section 5: Performance Targets → Query optimization (100 chat limit)

**From MessagingInfrastructure.md:**
- Section 1: Real-Time Sync Patterns → onSnapshot pattern
- Lifecycle cleanup to prevent memory leaks

**Key Patterns to Reuse from PR #1:**
- ✅ authStore pattern (state management)
- ✅ Firebase config (Firestore access)
- ✅ Store testing pattern (AAA pattern, mocks)
- ✅ Lifecycle cleanup pattern (useEffect with unsubscribe)

---

## ✅ Task Breakdown

### **Task 1: Create Chat Type Definition**
**Time:** 15 minutes
**Action:** CREATE TypeScript type definitions

#### Subtask 1.1: Create `types/chat.ts`
- [ ] Create new file: `types/chat.ts`
- [ ] Define `Chat` interface with fields:
  - `id: string`
  - `type: 'one-on-one' | 'group'`
  - `participants: string[]` (user IDs)
  - `participantDetails: object` (userId → {displayName, photoURL})
  - `lastMessage?: object` (text, senderId, timestamp)
  - `unreadCount: object` (userId → count)
  - `createdBy: string`
  - `createdAt: Date`
  - `updatedAt: Date`
  - `groupName?: string` (optional, for groups)
  - `groupPhoto?: string` (optional, for groups)
- [ ] Import `User` type from `./user`

**Reference:** See TechnicalArchitecture.md Section 3 for complete data model
**Pattern:** Follow same structure as `types/user.ts` from PR #1

---

### **Task 2: Create Chat Store**
**Time:** 1.5 hours
**Action:** CREATE state management for chats

#### Subtask 2.1: Create `lib/store/chatStore.ts`
- [ ] Create new file: `lib/store/chatStore.ts`
- [ ] Define `ChatState` interface with:
  - State: `chats: Chat[]`, `loading: boolean`, `error: string | null`
  - Actions: `subscribeToChats`, `createOneOnOneChat`, `createGroupChat`, `clearError`
- [ ] Implement `subscribeToChats(userId)` action:
  - [ ] Query Firestore: `where('participants', 'array-contains', userId)`
  - [ ] Order by `updatedAt` descending
  - [ ] Limit to 100 chats
  - [ ] Use `onSnapshot` for real-time updates
  - [ ] Return unsubscribe function for cleanup
  - [ ] Handle errors in snapshot callback
- [ ] Implement `createOneOnOneChat(currentUserId, otherUserId, otherUserDetails)`:
  - [ ] Check if chat already exists between these users
  - [ ] Return existing chat ID if found
  - [ ] Create new chat document if not found
  - [ ] Initialize `unreadCount` for both users to 0
  - [ ] Set timestamps using `serverTimestamp()`
- [ ] Implement `createGroupChat(currentUserId, participantIds, groupName)`:
  - [ ] Combine current user + participant IDs
  - [ ] Create group chat document with all participants
  - [ ] Initialize `unreadCount` for all participants to 0
  - [ ] Set `type: 'group'` and `groupName`
- [ ] Implement `clearError()` action

**Reference:** Follow authStore pattern from `lib/store/authStore.ts`
**Key Patterns:**
- Use Zustand's `create` function
- Follow error handling pattern: `set({ loading: true, error: null })` → operation → `set({ loading: false })`
- Real-time listeners return cleanup function

#### Subtask 2.2: Create chatStore Unit Tests
- [ ] Create new file: `lib/store/__tests__/chatStore.test.ts`
- [ ] Set up test structure:
  - [ ] Mock `@react-native-firebase/firestore`
  - [ ] Create mock Firestore instance in `beforeEach`
  - [ ] Reset store state before each test
- [ ] Test `subscribeToChats`:
  - [ ] Test: Should load user chats on subscribe
  - [ ] Test: Should filter chats by user participants
  - [ ] Test: Should order chats by updatedAt descending
  - [ ] Test: Should limit chats to 100
- [ ] Test `createOneOnOneChat`:
  - [ ] Test: Should return existing chat if already exists
  - [ ] Test: Should create new chat if none exists
- [ ] Test `createGroupChat`:
  - [ ] Test: Should create group chat with participants
- [ ] Run tests: `npm test -- lib/store/__tests__/chatStore.test.ts`
- [ ] **Expected:** 7/7 tests passing

**Reference:** Follow test pattern from `lib/store/__tests__/authStore.test.ts`
**Pattern:** AAA (Arrange, Act, Assert) with renderHook and waitFor

---

### **Task 3: Create Performance Utilities**
**Time:** 30 minutes
**Action:** CREATE performance monitoring

#### Subtask 3.1: Create `lib/utils/performance.ts`
- [ ] Create new file: `lib/utils/performance.ts`
- [ ] Define `PerformanceMark` interface (name, timestamp)
- [ ] Create `PerformanceMonitor` class with:
  - [ ] Private `marks: Map` for storing marks
  - [ ] Private `measurements: Array` for storing results
  - [ ] Method `mark(name)`: Store timestamp with name
  - [ ] Method `measure(measureName, startMark, endMark?)`: Calculate duration
  - [ ] Log warning if duration > 200ms (rubric requirement)
  - [ ] Method `getMeasurements()`: Return all measurements
  - [ ] Method `clearMarks()`: Clear all marks
  - [ ] Method `clearMeasurements()`: Clear all measurements
- [ ] Export singleton instance: `export const performanceMonitor = new PerformanceMonitor()`

**Purpose:** Monitor and log performance metrics (used in PR #3 for message send timing)
**Pattern:** Singleton pattern for app-wide access
**Usage Example:**
```
performanceMonitor.mark('operation-start');
// ... do operation
performanceMonitor.measure('Operation Time', 'operation-start');
```

---

### **Task 4: Implement Tab Navigation**
**Time:** 30 minutes
**Action:** MODIFY existing tab layout, CREATE screens

#### Subtask 4.1: Modify `app/(tabs)/_layout.tsx`
- [ ] Open existing file: `app/(tabs)/_layout.tsx`
- [ ] Import `Ionicons` from `@expo/vector-icons`
- [ ] Update `Tabs` screenOptions:
  - [ ] Set `headerShown: true`
  - [ ] Set `tabBarActiveTintColor: '#007AFF'`
  - [ ] Set `tabBarInactiveTintColor: '#8E8E93'`
- [ ] Update Chats tab:
  - [ ] Add `tabBarIcon` with `chatbubbles` icon
- [ ] Add Profile tab:
  - [ ] Add `<Tabs.Screen name="profile" />`
  - [ ] Set title: 'Profile'
  - [ ] Add `tabBarIcon` with `person` icon

**What exists:** Basic tab structure from PR #1
**What's changing:** Adding icons, colors, and Profile tab

#### Subtask 4.2: Modify `app/(tabs)/chats.tsx`
- [ ] Open existing file: `app/(tabs)/chats.tsx`
- [ ] Import necessary dependencies:
  - [ ] `useChatStore` from `@/lib/store/chatStore`
  - [ ] `useAuthStore` from `@/lib/store/authStore`
  - [ ] `ConnectionStatus` component
  - [ ] React hooks: `useEffect`
  - [ ] Navigation: `router` from `expo-router`
  - [ ] UI components: `FlatList`, `TouchableOpacity`
- [ ] Set up real-time chat subscription:
  - [ ] Use `useEffect` to subscribe when user is available
  - [ ] Call `subscribeToChats(user.uid)`
  - [ ] Return cleanup function that calls `unsubscribe()`
- [ ] Create `renderChatItem` function:
  - [ ] Determine display name (group name or other user's name)
  - [ ] Render avatar with first letter
  - [ ] Render chat name and last message
  - [ ] Add `onPress` to navigate to `/chat/${item.id}`
- [ ] Handle loading state: Show "Loading chats..." when loading
- [ ] Render main view:
  - [ ] Add `<ConnectionStatus />` at top
  - [ ] Add `<FlatList>` with chats data
  - [ ] Add `ListEmptyComponent` for empty state: "No chats yet"
- [ ] Add styles for: container, chatItem, avatar, chatInfo, etc.

**What exists:** Placeholder screen from PR #1
**What's changing:** Full implementation with real-time chat list
**Pattern Reused:** useEffect cleanup pattern from PR #1 auth listener

#### Subtask 4.3: Create `app/(tabs)/profile.tsx`
- [ ] Create new file: `app/(tabs)/profile.tsx`
- [ ] Import dependencies:
  - [ ] `useAuthStore` for user data and signOut
  - [ ] `router` for navigation
  - [ ] UI components: `View`, `Text`, `TouchableOpacity`
- [ ] Get user and signOut from authStore
- [ ] Create `handleSignOut` function:
  - [ ] Call `await signOut()`
  - [ ] Navigate to login: `router.replace('/(auth)/login')`
  - [ ] Handle errors with try/catch
- [ ] Render profile UI:
  - [ ] Avatar with first letter of user's name
  - [ ] Display user's name
  - [ ] Display user's email
  - [ ] Sign Out button
- [ ] Add styles for: container, profileSection, avatar, name, email, button

**New file:** Complete profile screen with sign out functionality

---

### **Task 5: Create Connection Status Component**
**Time:** 20 minutes
**Action:** CREATE network status indicator

#### Subtask 5.1: Create `components/common/ConnectionStatus.tsx`
- [ ] Create new directory: `components/common/` (if not exists)
- [ ] Create new file: `components/common/ConnectionStatus.tsx`
- [ ] Import `NetInfo` from `@react-native-community/netinfo`
- [ ] Set up state: `isConnected` (boolean, default true)
- [ ] Use `useEffect` to set up NetInfo listener:
  - [ ] Subscribe to network state changes
  - [ ] Update `isConnected` state when network changes
  - [ ] Return cleanup function to unsubscribe
- [ ] Render logic:
  - [ ] Return `null` if connected (hide banner)
  - [ ] Show red banner with "No internet connection" if offline
- [ ] Add styles for: banner (red background), text (white)

**Purpose:** Show visual indicator when user is offline
**Pattern:** Observer pattern with NetInfo, lifecycle cleanup
**Used in:** Chats screen (and can be added to other screens)

---

## 🧪 Testing & Verification

### **Task 6: Run Tests**
**Time:** 10 minutes

- [ ] Run chatStore tests: `npm test -- lib/store/__tests__/chatStore.test.ts`
  - [ ] Verify: 7/7 tests passing
- [ ] Run regression tests: `npm test -- lib/store/__tests__/authStore.test.ts`
  - [ ] Verify: 16/16 tests passing (from PR #1)
- [ ] Run all tests: `npm test`
  - [ ] **Expected Total:** 23/23 tests passing

### **Task 7: TypeScript Validation**
**Time:** 5 minutes

- [ ] Run TypeScript compiler: `npx tsc --noEmit`
- [ ] Verify: 0 errors
- [ ] Check all imports are correct
- [ ] Check Chat type is properly defined

### **Task 8: Build Verification**
**Time:** 15 minutes

- [ ] Run iOS build: `npx expo run:ios`
  - [ ] Verify: Builds without errors
- [ ] Run Android build: `npx expo run:android`
  - [ ] Verify: Builds without errors

### **Task 9: Manual Testing**
**Time:** 20 minutes

**Tab Navigation:**
- [ ] Log in to app
- [ ] Verify: See "Chats" and "Profile" tabs at bottom
- [ ] Tap Profile tab → Profile screen displays
- [ ] Tap Chats tab → Chats screen displays

**Chat List:**
- [ ] On Chats screen
- [ ] Verify: Empty state shows "No chats yet"
- [ ] Verify: No crashes or errors

**Profile:**
- [ ] On Profile screen
- [ ] Verify: User name displays correctly
- [ ] Verify: User email displays correctly
- [ ] Verify: Avatar shows first letter of name
- [ ] Tap "Sign Out"
- [ ] Verify: Logged out successfully
- [ ] Verify: Redirected to login screen

**Connection Status:**
- [ ] Turn on airplane mode
- [ ] Verify: Red banner appears: "No internet connection"
- [ ] Turn off airplane mode
- [ ] Verify: Banner disappears

**Performance:**
- [ ] Tab switches complete in <100ms (smooth)
- [ ] No lag when navigating
- [ ] No memory leaks

---

## 📦 Deliverables Summary

**Files Created (6):**
```
✅ types/chat.ts
✅ lib/store/chatStore.ts
✅ lib/store/__tests__/chatStore.test.ts
✅ lib/utils/performance.ts
✅ components/common/ConnectionStatus.tsx
✅ app/(tabs)/profile.tsx
```

**Files Modified (2):**
```
✅ app/(tabs)/_layout.tsx (added Profile tab, icons, colors)
✅ app/(tabs)/chats.tsx (replaced placeholder with real implementation)
```

---

## ✅ Success Criteria Checklist

- [ ] All tests passing: 23/23 (7 new + 16 regression)
- [ ] TypeScript: 0 errors
- [ ] iOS build: Success
- [ ] Android build: Success
- [ ] Tab navigation works smoothly
- [ ] Chat list displays (empty state for now)
- [ ] Profile screen displays user info
- [ ] Sign out functionality works
- [ ] Connection status banner works (test with airplane mode)
- [ ] No console errors or warnings
- [ ] No memory leaks
- [ ] Code follows patterns from PR #1

---

## 💾 Git Commit

**When ready to commit:**

```bash
git add .
git commit -m "feat(ui): add tab navigation, chat list, and performance monitoring

- Tab navigation with Chats and Profile screens
- Real-time chat list with Firestore listeners
- Profile screen with sign out
- Connection status indicator for offline mode
- Performance monitoring utilities
- Chat type defined with one-on-one and group support
- chatStore with real-time subscriptions
- Tests: 23/23 passing (7 new + 16 regression)

Closes #2"
```

---

## 🔗 Integration Context

**What this PR builds on (from PR #1):**
- authStore pattern → Reused for chatStore
- Firebase config → Used for Firestore access
- Navigation structure → Filled in with real screens
- Test patterns → Reused for chatStore tests

**What this PR enables (for future PRs):**
- PR #3: Will use chatStore to update lastMessage
- PR #3: Will create `/chat/[id]` screen (navigation target)
- PR #3: Will use performanceMonitor for <200ms message delivery
- PR #5: Will use createGroupChat for group functionality

---

## 📚 Next Steps

After PR #2 is complete and merged:

**Move to PR #3: Real-Time Messaging**
- File: `docs/prPrompts/Pr03Messaging.md`
- Will create messageStore (following chatStore pattern)
- Will add chat screen with real-time message sync
- **CRITICAL:** Must meet <200ms message delivery requirement
- Estimated time: 7-9 hours
