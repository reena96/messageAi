# PR #5: Group Chat + Push Notifications - Task Breakdown

**Estimated Time:** 5-6 hours
**Dependencies:** PR #1 (Authentication), PR #2 (Core UI), PR #3 (Messaging), PR #4 (Offline Support)
**🎯 MVP CHECKPOINT:** This PR completes all 11 MVP requirements

---

## 📚 Pre-Implementation: Context Review

Before starting, read these files in order:

1. **`docs/prd/ProductRequirements.md`**
   - Section 3.2: MVP Requirements (all 11 requirements - this PR completes them)
   - Section 4.1: Core Features (group chat requirement)
   - Section 4.6: Push Notifications

2. **`docs/architecture/TechnicalArchitecture.md`**
   - Section 2: System Architecture → Firebase Cloud Messaging (FCM)
   - Section 3: Data Models → Chats Collection (group chat fields)
   - Section 4: Security & Firestore Rules → Group chat permissions

3. **`docs/prd/RubricAlignment.md`**
   - MVP Checklist (validate all 11 requirements after this PR)

4. **`docs/prPrompts/Pr02CoreUI.md`**
   - Review chatStore (will be MODIFIED to add group chat creation)
   - Review Chat List UI pattern

5. **`docs/prPrompts/Pr03Messaging.md`**
   - Review messageStore (already handles group messaging)

6. **`docs/tasks/CompleteImplementationGuide.md`**
   - PR #5 section for complete group chat code
   - PR #5 section for push notification setup

---

## 🏗️ Key Architecture References

**From TechnicalArchitecture.md:**
- Section 2: System Architecture → FCM for push notifications
- Section 3: Data Models → Group-specific fields (groupName, groupPhoto, createdBy)
- Section 4: Security Rules → Group chat permissions

**From ProductRequirements.md:**
- Section 4.1: Core Features → Group Chat
- Section 4.6: Push Notifications → FCM integration

**Key Patterns to Reuse:**
- ✅ chatStore pattern (extend with createGroupChat)
- ✅ messageStore (already supports group messaging)
- ✅ Real-time listeners from PR #2
- ✅ Offline support from PR #4

**Software Engineering Principles:**
- **DRY:** Group messaging reuses existing messageStore
- **Open/Closed:** chatStore extended without modifying existing methods
- **Single Responsibility:** Notification logic in Cloud Functions

---

## ✅ Task Breakdown

### **Task 1: Extend chatStore for Group Chat**
**Time:** 1 hour
**Action:** MODIFY existing chatStore

#### Subtask 1.1: Modify `lib/store/chatStore.ts`
- [ ] Open existing file: `lib/store/chatStore.ts`
- [ ] Add to `ChatState` interface:
  - [ ] `createGroupChat: (creatorId, participantIds, groupName) => Promise<string>`
- [ ] Implement `createGroupChat` method:
  - [ ] Combine creator + participant IDs into `allParticipants`
  - [ ] Fetch participant data from `/users` collection
  - [ ] Build `participantData` object (userId → {name, photoURL})
  - [ ] Initialize `unreadCount` for all participants to 0
  - [ ] Create chat document with:
    - `type: 'group'`
    - `participants: allParticipants`
    - `participantData`
    - `groupName`
    - `createdBy: creatorId`
    - `unreadCount`
    - `lastMessage: { text: 'Group created', ... }`
    - `createdAt`, `updatedAt` timestamps
  - [ ] Return chatId for navigation

**Pattern:** Follow existing chatStore method structure

#### Subtask 1.2: Create `lib/store/__tests__/chatStore.group.test.ts`
- [ ] Create new file: `lib/store/__tests__/chatStore.group.test.ts`
- [ ] Mock Firestore
- [ ] Test: Creates group chat with multiple participants
  - [ ] Verify chat document created with correct fields
  - [ ] Verify `type: 'group'`
  - [ ] Verify `groupName` set
  - [ ] Verify all participants included
- [ ] Test: Includes creator in participants array
  - [ ] Verify creator in participants list
- [ ] Test: Initializes unread count for all participants
  - [ ] Verify unreadCount has entry for each participant
- [ ] Run tests: `npm test -- chatStore.group.test.ts`
- [ ] **Expected:** 3/3 tests passing

---

### **Task 2: Create Group Creation Modal**
**Time:** 1.5 hours
**Action:** CREATE new modal screen

#### Subtask 2.1: Create `app/(modal)/create-group.tsx`
- [ ] Create new directory: `app/(modal)/`
- [ ] Create new file: `app/(modal)/create-group.tsx`
- [ ] Set up state:
  - [ ] `groupName: string`
  - [ ] `users: User[]` (all users from Firestore)
  - [ ] `selectedUsers: Set<string>` (selected user IDs)
  - [ ] `loading: boolean`
- [ ] Load users on mount:
  - [ ] Use `useEffect` to subscribe to `/users` collection
  - [ ] Filter out current user
  - [ ] Set `users` state
  - [ ] Return cleanup function
- [ ] Implement `toggleUser(userId)`:
  - [ ] Add/remove user from selectedUsers Set
- [ ] Implement `handleCreate()`:
  - [ ] Validate: groupName not empty, selectedUsers not empty
  - [ ] Call `createGroupChat(userId, selectedUserIds, groupName)`
  - [ ] Navigate to created chat: `router.replace('/chat/${chatId}')`
  - [ ] Handle errors
- [ ] Render UI:
  - [ ] Header with Cancel/Create buttons
  - [ ] Group name TextInput
  - [ ] Member count display
  - [ ] FlatList of users with checkboxes
  - [ ] Disable Create if invalid
- [ ] Add styles for: header, input, userItem, avatar, checkmark

**Pattern:** Modal presentation, multi-select UI

---

### **Task 3: Create Group Chat Header**
**Time:** 1 hour
**Action:** CREATE new component

#### Subtask 3.1: Create `components/chat/GroupChatHeader.tsx`
- [ ] Create new directory: `components/chat/`
- [ ] Create new file: `components/chat/GroupChatHeader.tsx`
- [ ] Accept props: `chat: Chat`, `onBack: () => void`
- [ ] Set up state:
  - [ ] `showMembers: boolean` (for modal)
  - [ ] `members: UserStatus[]` (member list with online status)
- [ ] Subscribe to participant status on mount:
  - [ ] Use `useEffect` to subscribe to each participant's user document
  - [ ] Track online status
  - [ ] Sort: online users first, then alphabetically
  - [ ] Return cleanup function (unsubscribe all)
- [ ] Calculate `onlineCount` from members
- [ ] Render header:
  - [ ] Back button
  - [ ] Group name (tappable to show members)
  - [ ] Member count + online count
  - [ ] Info icon
- [ ] Render members modal:
  - [ ] Modal with member list
  - [ ] Show online indicator (green/gray dot)
  - [ ] Show "Online" or "Offline" status
  - [ ] Close button
- [ ] Add styles for: header, modal, memberItem, onlineIndicator

**Pattern:** Component composition, real-time status subscriptions

#### Subtask 3.2: Modify `app/chat/[id].tsx` to use group header
- [ ] Open existing file: `app/chat/[id].tsx`
- [ ] Import `GroupChatHeader`
- [ ] Add conditional rendering:
  - [ ] If `chat.type === 'group'`: render `<GroupChatHeader>`
  - [ ] Else: render existing header

**Pattern:** Conditional rendering based on chat type

---

### **Task 4: Setup Push Notifications - Client**
**Time:** 1.5 hours
**Action:** CREATE notification setup module

#### Subtask 4.1: Create `lib/notifications/setup.ts`
- [ ] Create new directory: `lib/notifications/`
- [ ] Create new file: `lib/notifications/setup.ts`
- [ ] Import Firebase messaging, Firestore
- [ ] Implement `requestNotificationPermission(userId)`:
  - [ ] Call `messaging().requestPermission()`
  - [ ] Check if granted
  - [ ] If granted: call `setupNotifications(userId)`
  - [ ] Return boolean (granted or not)
- [ ] Implement `setupNotifications(userId)`:
  - [ ] Get FCM token: `messaging().getToken()`
  - [ ] Save token to user document: `users/{userId}.fcmToken`
  - [ ] Listen for token refresh: `messaging().onTokenRefresh()`
  - [ ] Update token in Firestore when refreshed
  - [ ] Handle foreground messages: `messaging().onMessage()`
  - [ ] Show Alert for foreground messages
- [ ] Implement `handleNotificationOpen()`:
  - [ ] Get initial notification: `messaging().getInitialNotification()`
  - [ ] Return chatId from notification data
  - [ ] Handle notification opened app: `messaging().onNotificationOpenedApp()`
  - [ ] Navigate to chat when tapped

**Pattern:** Async/await, side effects in dedicated module

#### Subtask 4.2: Modify `app/_layout.tsx` to request permission
- [ ] Open existing file: `app/_layout.tsx`
- [ ] Import `requestNotificationPermission`
- [ ] In auth listener useEffect, when user logs in:
  - [ ] Call `await requestNotificationPermission(user.uid)`
  - [ ] Log result

**Pattern:** Request permission after authentication

---

### **Task 5: Create Cloud Function for Notifications**
**Time:** 1.5 hours
**Action:** CREATE Cloud Function

#### Subtask 5.1: Create `functions/src/notifications.ts`
- [ ] Create new directory: `functions/src/`
- [ ] Create new file: `functions/src/notifications.ts`
- [ ] Import Firebase functions and admin SDK
- [ ] Initialize admin SDK if not initialized
- [ ] Implement `sendMessageNotification`:
  - [ ] Trigger: `.document('chats/{chatId}/messages/{messageId}').onCreate()`
  - [ ] Get message data from snapshot
  - [ ] Get chat document
  - [ ] Get recipients: filter out sender from participants
  - [ ] Get sender name from user document
  - [ ] Query recipient FCM tokens from user documents
  - [ ] Build notification payload:
    - Title: group name or sender name
    - Body: "${senderName}: ${message.text}"
    - Data: { chatId, messageId, type: 'new_message' }
    - APNS config: sound, badge
    - Android config: sound, channelId, priority
  - [ ] Send with `admin.messaging().sendEachForMulticast()`
  - [ ] Log success count and failures

**Pattern:** Cloud Function trigger, batch token queries

#### Subtask 5.2: Modify `functions/src/index.ts`
- [ ] Create new file: `functions/src/index.ts`
- [ ] Export `sendMessageNotification` from `./notifications`

#### Subtask 5.3: Create `functions/package.json`
- [ ] Create file: `functions/package.json`
- [ ] Add dependencies:
  - `firebase-admin`
  - `firebase-functions`
- [ ] Add devDependencies:
  - `typescript`
- [ ] Add scripts:
  - `build`: `tsc`
  - `deploy`: `firebase deploy --only functions`

#### Subtask 5.4: Deploy Cloud Function
- [ ] Navigate to functions directory: `cd functions`
- [ ] Install dependencies: `npm install`
- [ ] Build: `npm run build`
- [ ] Deploy: `firebase deploy --only functions:sendMessageNotification`

**Integration:** Automatically triggered when messages created

---

### **Task 6: Add New Group Button**
**Time:** 15 minutes
**Action:** MODIFY chat list screen

#### Subtask 6.1: Modify `app/(tabs)/chats.tsx`
- [ ] Open existing file: `app/(tabs)/chats.tsx`
- [ ] Import `Ionicons`
- [ ] Add header with title and button:
  - [ ] "Chats" title on left
  - [ ] People icon button on right
  - [ ] OnPress: `router.push('/(modal)/create-group')`
- [ ] Add styles for: header, headerTitle, newGroupButton

---

## 🧪 Testing & Verification

### **Task 7: Run All Tests**
**Time:** 10 minutes

- [ ] Run group chat tests: `npm test -- chatStore.group.test.ts`
  - [ ] Verify: 3/3 tests passing
- [ ] Run all regression tests from PR #1-4:
  - [ ] authStore (16 tests)
  - [ ] chatStore (7 tests)
  - [ ] messageStore (10 tests)
  - [ ] integration tests (3 tests)
  - [ ] performance tests (2 tests)
  - [ ] offline scenarios (7 tests)
- [ ] Run all tests: `npm test`
  - [ ] **Expected Total:** 48/48 tests passing (45 + 3 new)

### **Task 8: TypeScript Validation**
**Time:** 5 minutes

- [ ] Run TypeScript compiler: `npx tsc --noEmit`
- [ ] Verify: 0 errors

### **Task 9: Build Verification**
**Time:** 15 minutes

- [ ] Run iOS build: `npx expo run:ios`
- [ ] Run Android build: `npx expo run:android`

### **Task 10: Manual Testing**
**Time:** 45 minutes

**Group Chat Creation:**
- [ ] Tap "New Group" button
- [ ] Select 2+ users
- [ ] Enter group name
- [ ] Tap "Create"
- [ ] Verify: Navigates to group chat screen

**Group Messaging:**
- [ ] Send message in group chat
- [ ] Verify: All participants receive message
- [ ] Check: Last message updates in chat list

**Group Member Status:**
- [ ] Open group chat
- [ ] Tap group header
- [ ] Verify: Member list modal opens
- [ ] Check: Online/offline indicators correct
- [ ] Verify: Online count matches

**Push Notifications (iOS):**
- [ ] Background the app
- [ ] Send message from another user
- [ ] Verify: Notification appears
- [ ] Tap notification
- [ ] Verify: Opens correct chat

**Push Notifications (Android):**
- [ ] Same as iOS testing
- [ ] Verify: Notification sound plays
- [ ] Verify: Notification icon displays

**Offline Group Chat:**
- [ ] Turn off network
- [ ] Send group message
- [ ] Verify: Shows "sending..."
- [ ] Turn on network
- [ ] Verify: Syncs and all participants receive

---

## 🎯 MVP Checkpoint

**After this PR, validate ALL 11 MVP requirements:**

### MVP Requirements Checklist

**Core Messaging (4 requirements):**
- [ ] One-on-one messaging works (PR #3)
- [ ] **Group chat works** (PR #5 - THIS PR)
- [ ] Real-time sync (<200ms delivery) (PR #3)
- [ ] Offline support (messages sync <1s) (PR #4)

**User Features (3 requirements):**
- [ ] User authentication (email/password) (PR #1)
- [ ] User profiles (PR #1)
- [ ] User presence (online/offline status) (PR #1, PR #2)

**UI/UX (2 requirements):**
- [ ] Cross-platform (iOS + Android both work) (PR #1-5)
- [ ] Responsive UI (60 FPS scrolling) (PR #2)

**Infrastructure (2 requirements):**
- [ ] **Push notifications work** (PR #5 - THIS PR)
- [ ] Persistent storage (messages survive app restart) (PR #4)

### Performance Validation

Document results in `PERFORMANCE.md`:
- [ ] App launch to chat screen: ___ms (<2000ms target)
- [ ] Message delivery (good network): ___ms (<200ms target) ⚠️ CRITICAL
- [ ] Offline sync after reconnection: ___ms (<1000ms target) ⚠️ CRITICAL
- [ ] Typing indicator lag: ___ms (<100ms target)
- [ ] Scrolling 1000+ messages: ___ FPS (60 FPS target)
- [ ] Group chat creation: ___ms (<500ms target)
- [ ] Notification delivery: ___ms (<3s target)

**⚠️ STOP HERE IF MVP REQUIREMENTS DON'T PASS**

If all 11 MVP requirements pass, proceed to PR #6 (AI Infrastructure).

---

## 📦 Deliverables Summary

**Files Created (5):**
```
✅ app/(modal)/create-group.tsx
✅ components/chat/GroupChatHeader.tsx
✅ lib/store/__tests__/chatStore.group.test.ts
✅ lib/notifications/setup.ts
✅ functions/src/notifications.ts
✅ functions/src/index.ts (MODIFIED)
```

**Files Modified (4):**
```
✅ lib/store/chatStore.ts (added createGroupChat method)
✅ app/_layout.tsx (added notification permission request)
✅ app/(tabs)/chats.tsx (added "New Group" button)
✅ app/chat/[id].tsx (added GroupChatHeader conditional rendering)
```

**Cloud Function Deployed:**
```
✅ sendMessageNotification (Firebase Cloud Function)
```

---

## ✅ Success Criteria Checklist

- [ ] All tests passing: 48/48 (3 new + 45 regression)
- [ ] **All 11 MVP requirements complete** ⚠️ MILESTONE
- [ ] TypeScript: 0 errors
- [ ] iOS build: Success
- [ ] Android build: Success
- [ ] Users can create group chats
- [ ] Group chat displays correctly
- [ ] Group messages work
- [ ] Member status displays
- [ ] Push notifications work (iOS)
- [ ] Push notifications work (Android)
- [ ] Notification opens correct chat
- [ ] Group chats work offline
- [ ] Cloud Function deployed successfully
- [ ] Performance targets met

---

## 💾 Git Commit

**When ready to commit:**

```bash
git add .
git commit -m "feat(groups): add group chat and push notifications

- Group chat creation with member selection
- Group messaging (reuses existing messageStore)
- Group header with member list and online status
- FCM push notifications for iOS and Android
- Cloud Function triggers on message creation
- Tap notification opens correct chat
- MVP COMPLETE: All 11 requirements passing ✅
- Tests: 48/48 passing (3 new + 45 regression)

Closes #5"
```

---

## 🔗 Integration Context

**What this PR builds on (from PR #1-4):**
- authStore → User data for group members
- chatStore → Extended with createGroupChat
- messageStore → Already supports group messaging
- Offline support → Group messages queue offline

**What this PR enables (for future PRs):**
- PR #9: Proactive Assistant notifications
- Push notifications for deadline reminders
- Push notifications for RSVP updates

---

## 📚 Next Steps

After PR #5 is complete and merged:

**Next:** [Pr06AiInfrastructure.md](../prPrompts/Pr06AiInfrastructure.md)
- AI Infrastructure + Calendar Extraction
- OpenAI integration
- Message analysis
- Estimated time: 6-8 hours
