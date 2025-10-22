# PR #4: Offline Support - Task Breakdown

**Estimated Time:** 5-7 hours
**Dependencies:** PR #1 (Authentication), PR #2 (Core UI), PR #3 (Messaging)
**⚠️ CRITICAL:** This PR must pass 7 offline scenarios (rubric requirement)

---

## 📚 Pre-Implementation: Context Review

Before starting, read these files in order:

1. **`docs/prd/ProductRequirements.md`**
   - Section 3.2: MVP Requirements (item 2: Offline-first architecture)
   - Section 4.2: Performance (offline sync <1s)

2. **`docs/architecture/TechnicalArchitecture.md`**
   - Section 7: Offline Support Strategy
   - Section 2: Offline Scenario (complete offline message flow)

3. **`docs/architecture/MessagingInfrastructure.md`**
   - Section 3: Offline-First Architecture (COMPLETE 8-page deep dive - READ ENTIRE SECTION)
   - Section 5: Poor Network Handling
   - Section 7: Common Pitfalls (offline scenarios)

4. **`docs/prPrompts/Pr03Messaging.md`**
   - Review messageStore (will be MODIFIED for offline handling)
   - Review optimistic UI pattern (already handles some offline)

5. **`docs/tasks/CompleteImplementationGuide.md`**
   - PR #4 section for complete offline code examples

---

## 🏗️ Key Architecture References

**From TechnicalArchitecture.md:**
- Section 2: Offline Scenario → Complete offline message flow
- Section 5: Performance Targets → **Offline sync <1 second (RUBRIC CRITICAL)**

**From MessagingInfrastructure.md:**
- Section 3: Offline-First Architecture → Complete deep dive
  - Subsection 3.1: Automatic offline support (Firebase SDK features)
  - Subsection 3.3: What we must implement (retry queue, error detection)
  - Subsection 3.4: Network error detection patterns
- Section 5: Poor Network Handling → Retry strategies

**7 Offline Scenarios (Rubric Requirement):**
1. Send while offline → queue + retry button
2. View cached messages → served from cache
3. Auto-retry on reconnect → all queued messages send
4. Poor network (intermittent) → retry on failure
5. Connection restored mid-send → operation completes
6. Multiple failed messages → all tracked and retried
7. Sync after offline → <1s sync time (RUBRIC)

**Key Implementation Notes:**
- Firebase SDK handles most offline support (enabled in PR #1)
- PR #4 adds: network detection, retry queue, better error messages, auto-retry hook

---

## ✅ Task Breakdown

### **Task 1: Enhance messageStore for Offline**
**Time:** 1.5 hours
**Action:** MODIFY existing messageStore

#### Subtask 1.1: Modify `lib/store/messageStore.ts`
- [ ] Open existing file: `lib/store/messageStore.ts`
- [ ] Import `NetInfo` from `@react-native-community/netinfo`
- [ ] Add to `MessageState` interface:
  - [ ] `retryQueue: Set<string>` (Message IDs to retry)
  - [ ] `retryMessage: (chatId, messageId) => Promise<void>`
- [ ] MODIFY `sendMessage` to check network before sending:
  - [ ] Call `await NetInfo.fetch()` before Firestore write
  - [ ] If `!netInfo.isConnected`: mark as failed, add to retry queue, throw error
  - [ ] In catch block: better error categorization (network vs other)
  - [ ] If network error: add to retry queue
  - [ ] Set error message: "No internet connection" or "Failed to send message"
- [ ] Implement `retryMessage(chatId, messageId)`:
  - [ ] Find failed message in state
  - [ ] Remove from retry queue
  - [ ] Call `sendMessage` again with message text
- [ ] Initialize `retryQueue: new Set()` in initial state

**Reference:** Follow existing messageStore patterns
**Key Changes:**
- Network check before critical operations
- Retry queue for failed messages
- Better error messages (offline vs failed)

---

### **Task 2: Create Auto-Retry Hook**
**Time:** 1 hour
**Action:** CREATE hook to retry failed messages when online

#### Subtask 2.1: Create `lib/hooks/useNetworkStatus.ts`
- [ ] Create new directory: `lib/hooks/`
- [ ] Create new file: `lib/hooks/useNetworkStatus.ts`
- [ ] Import `NetInfo`, `useMessageStore`
- [ ] Get `retryQueue` and `retryMessage` from messageStore
- [ ] Use `useEffect` to set up NetInfo listener:
  - [ ] Subscribe to network state changes with `NetInfo.addEventListener`
  - [ ] When `state.isConnected` changes from false to true AND `retryQueue.size > 0`:
    - [ ] Log retry message
    - [ ] Loop through retryQueue
    - [ ] For each message: find its chat, call `retryMessage`
    - [ ] Handle errors (log, don't throw)
  - [ ] Return cleanup function calling `unsubscribe()`

**Pattern:** Observer pattern with NetInfo, automatic recovery

#### Subtask 2.2: Modify `app/_layout.tsx` to use hook
- [ ] Open existing file: `app/_layout.tsx`
- [ ] Import `useNetworkStatus` from `@/lib/hooks/useNetworkStatus`
- [ ] Add hook call in RootLayout: `useNetworkStatus();`
- [ ] Place after auth listener setup

**Effect:** Messages auto-retry when reconnecting

---

### **Task 3: Create Offline Scenario Tests**
**Time:** 2 hours
**Action:** CREATE tests for 7 offline scenarios (RUBRIC REQUIREMENT)

#### Subtask 3.1: Create `__tests__/offline/scenarios.test.ts`
- [ ] Create new directory: `__tests__/offline/`
- [ ] Create new file: `__tests__/offline/scenarios.test.ts`
- [ ] Mock `@react-native-firebase/firestore`, `@react-native-community/netinfo`
- [ ] Set up beforeEach to reset stores
- [ ] **Test Scenario 1: Send while offline**
  - [ ] Mock `NetInfo.fetch()` to return `isConnected: false`
  - [ ] Call `sendMessage`
  - [ ] Verify: Message marked as failed
  - [ ] Verify: Error contains "internet"
  - [ ] Verify: retryQueue size = 1
- [ ] **Test Scenario 2: View cached messages**
  - [ ] Pre-populate messageStore with cached messages
  - [ ] Mock NetInfo offline
  - [ ] Verify: Messages still accessible
  - [ ] Verify: No errors
- [ ] **Test Scenario 3: Auto-retry on reconnect**
  - [ ] Start with failed message in retry queue
  - [ ] Mock NetInfo online
  - [ ] Call `retryMessage`
  - [ ] Verify: Firestore add called
- [ ] **Test Scenario 4: Poor network (intermittent)**
  - [ ] Mock Firestore add to fail first, succeed second
  - [ ] Send message (fails)
  - [ ] Retry message (succeeds)
  - [ ] Verify: Add called twice
- [ ] **Test Scenario 5: Connection restored mid-send**
  - [ ] Start offline, connection restored during send
  - [ ] Retry message
  - [ ] Verify: Send completes
- [ ] **Test Scenario 6: Multiple failed messages**
  - [ ] Mock offline
  - [ ] Send 3 messages
  - [ ] Verify: retryQueue size = 3
  - [ ] Verify: All marked as failed
- [ ] **Test Scenario 7: Sync <1s when reconnecting** (RUBRIC)
  - [ ] Mock onSnapshot with 500ms delay
  - [ ] Subscribe to messages
  - [ ] Measure sync time
  - [ ] Verify: Sync time < 1000ms
  - [ ] Log sync time
- [ ] Run tests: `npm test -- __tests__/offline/scenarios.test.ts`
- [ ] **Expected:** 7/7 offline scenario tests passing ✅

**⚠️ CRITICAL:** All 7 tests must pass for rubric

---

### **Task 4: Enhance Error UI**
**Time:** 30 minutes
**Action:** MODIFY MessageBubble to show retry button

#### Subtask 4.1: Modify `components/messages/MessageBubble.tsx`
- [ ] Open existing file: `components/messages/MessageBubble.tsx`
- [ ] Import `useMessageStore` to get `retryMessage`
- [ ] Create `handleRetry` function:
  - [ ] Call `retryMessage(message.chatId, message.id || message.tempId)`
  - [ ] Handle errors with try/catch
- [ ] Add retry button below message footer:
  - [ ] Show only if `message.status === 'failed' && isOwnMessage`
  - [ ] `<TouchableOpacity>` with `onPress={handleRetry}`
  - [ ] Show "Tap to retry" text
- [ ] Add styles:
  - [ ] `retryButton`: marginTop 8, paddingVertical 4
  - [ ] `retryText`: red color, size 12, underline, font-weight 600

**Changes:** Add retry button for failed messages

---

## 🧪 Testing & Verification

### **Task 5: Run All Tests**
**Time:** 10 minutes

- [ ] Run offline scenario tests: `npm test -- __tests__/offline/scenarios.test.ts`
  - [ ] Verify: 7/7 tests passing ✅ **RUBRIC REQUIREMENT**
- [ ] Run regression tests from PR #1-3:
  - [ ] authStore tests (16 tests)
  - [ ] chatStore tests (7 tests)
  - [ ] messageStore tests (10 tests)
  - [ ] messaging integration tests (3 tests)
  - [ ] performance tests (2 tests)
- [ ] Run all tests: `npm test`
  - [ ] **Expected Total:** 45/45 tests passing

### **Task 6: TypeScript Validation**
**Time:** 5 minutes

- [ ] Run TypeScript compiler: `npx tsc --noEmit`
- [ ] Verify: 0 errors
- [ ] Check retry queue types correct

### **Task 7: Build Verification**
**Time:** 15 minutes

- [ ] Run iOS build: `npx expo run:ios`
- [ ] Run Android build: `npx expo run:android`

### **Task 8: Manual Testing**
**Time:** 30 minutes

**Scenario 1: Send while offline**
- [ ] Turn on airplane mode
- [ ] Send message
- [ ] Verify: Message shows as failed with error
- [ ] Verify: "Tap to retry" button appears
- [ ] Turn off airplane mode
- [ ] Tap retry
- [ ] Verify: Message sends successfully

**Scenario 2: View cached messages**
- [ ] View chat with messages
- [ ] Turn on airplane mode
- [ ] Verify: Messages still visible
- [ ] Verify: No errors
- [ ] Verify: Red offline banner shows

**Scenario 3: Auto-retry**
- [ ] Turn on airplane mode
- [ ] Send 3 messages
- [ ] Verify: All marked as failed
- [ ] Turn off airplane mode
- [ ] Verify: All messages auto-retry within 2s
- [ ] Verify: All marked as sent

**Scenario 4: Poor network**
- [ ] Enable network throttling (slow 3G)
- [ ] Send message
- [ ] Verify: Message eventually sends
- [ ] Verify: Shows sending indicator during send

**Offline sync <1s:**
- [ ] Go offline, perform actions
- [ ] Go online
- [ ] Measure time until sync complete
- [ ] Verify: <1 second

---

## 📦 Deliverables Summary

**Files Created (2):**
```
✅ lib/hooks/useNetworkStatus.ts
✅ __tests__/offline/scenarios.test.ts
```

**Files Modified (3):**
```
✅ lib/store/messageStore.ts (added retry queue, better errors)
✅ app/_layout.tsx (added useNetworkStatus hook)
✅ components/messages/MessageBubble.tsx (added retry button)
```

---

## ✅ Success Criteria Checklist

- [ ] All tests passing: 45/45 (7 new + 38 regression)
- [ ] **7 offline scenarios passing** ⚠️ RUBRIC REQUIREMENT
- [ ] **Offline sync time <1s** ⚠️ RUBRIC REQUIREMENT
- [ ] TypeScript: 0 errors
- [ ] iOS build: Success
- [ ] Android build: Success
- [ ] Messages queue when offline
- [ ] Auto-retry when back online
- [ ] Retry button works for failed messages
- [ ] Clear error messages (offline vs failed)
- [ ] Cached messages viewable offline
- [ ] No console errors or warnings
- [ ] Network listener cleaned up

---

## 💾 Git Commit

**When ready to commit:**

```bash
git add .
git commit -m "feat(offline): add full offline support with auto-retry

- Offline message detection with retry queue
- Auto-retry when reconnecting
- Enhanced error messages (offline vs failed)
- Retry buttons in UI for failed messages
- 7 offline scenarios passing ✅ RUBRIC REQUIREMENT MET
- Offline sync <1s ✅ RUBRIC REQUIREMENT MET
- Tests: 45/45 passing (7 new + 38 regression)

Closes #4"
```

---

## 🔗 Integration Context

**What this PR builds on (from PR #1-3):**
- Firebase offline persistence (PR #1) → Already enabled
- ConnectionStatus component (PR #2) → Reused throughout
- messageStore optimistic UI (PR #3) → Enhanced with retry

**What this PR enables (for future PRs):**
- PR #5: Will use same retry pattern for groups
- PR #10: Will test offline performance (<1s sync)

---

## 📚 Next Steps

After PR #4 is complete and merged:

**Move to PR #5: Groups + Push Notifications + MVP Checkpoint**
- File: `docs/prPrompts/Pr05Groups.md`
- Will create group chat functionality
- Will add push notifications (Firebase Cloud Messaging)
- **MILESTONE:** MVP complete (11/11 requirements)
- Estimated time: 5-6 hours
