# PR #5: Group Chat + Push Notifications - Task Breakdown

**Estimated Time:** 5-6 hours
**Dependencies:** PR #1 (Authentication), PR #2 (Core UI), PR #3 (Messaging), PR #4 (Offline Support)
**🎯 MVP CHECKPOINT:** This PR completes all 11 MVP requirements

**📱 NOTIFICATION APPROACH:**
- **Local Notifications** + In-App Banners (not remote push)
- Firestore real-time listeners provide instant message delivery
- Same UX as remote push, simpler implementation
- Fully testable in iOS Simulator and Android Emulator
- No native module configuration required

---

## 📚 Pre-Implementation: Context Review

Before starting, read these files in order:

1. **`docs/plans/14-push-notifications.md`** ⚠️ **READ THIS FIRST**
   - Section 11: Feasibility, Limitations, and Near-Term Possibilities
   - Section 8: Simulator & Emulator Support Matrix
   - Section 12: PR Task Checklist (Phase 1 only)

2. **`docs/prd/ProductRequirements.md`**
   - Section 3.2: MVP Requirements (all 11 requirements - this PR completes them)
   - Section 4.1: Core Features (group chat requirement)
   - Section 4.6: Push Notifications

3. **`docs/architecture/TechnicalArchitecture.md`**
   - Section 2: System Architecture → Firebase Cloud Messaging (FCM)
   - Section 3: Data Models → Chats Collection (group chat fields)
   - Section 4: Security & Firestore Rules → Group chat permissions

4. **`docs/prd/RubricAlignment.md`**
   - MVP Checklist (validate all 11 requirements after this PR)

5. **`docs/prPrompts/Pr02CoreUI.md`**
   - Review chatStore (will be MODIFIED to add group chat creation)
   - Review Chat List UI pattern

6. **`docs/prPrompts/Pr03Messaging.md`**
   - Review messageStore (already handles group messaging)

7. **`docs/tasks/CompleteImplementationGuide.md`**
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

### **Task 4: Setup Local Notifications + In-App Banners**
**Time:** 1.5 hours
**Action:** CREATE notification system using local notifications

**✅ ADVANTAGES:**
- Uses `expo-notifications` for local notifications only (no remote push setup)
- No `expo prebuild` required
- Fully testable in iOS Simulator and Android Emulator
- Firestore real-time listeners provide instant message delivery
- Same UX as remote push notifications

#### Subtask 4.1: Install Dependencies
- [ ] Run: `npx expo install expo-notifications`
- [ ] No `app.json` changes needed (local notifications work out of the box)
- [ ] No `expo prebuild` required

**Pattern:** Simple npm install, no native configuration

#### Subtask 4.2: Create `lib/notifications/localNotifications.ts`
- [ ] Create new directory: `lib/notifications/`
- [ ] Create new file: `lib/notifications/localNotifications.ts`
- [ ] Import `expo-notifications`, `Platform`
- [ ] Configure notification handler for foreground:
  ```typescript
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  ```
- [ ] Define Android notification channels:
  - `default` - Default message notifications (importance: DEFAULT)
  - `high-priority` - Urgent notifications (importance: HIGH, vibration)
- [ ] Implement `setupAndroidChannels()`:
  - [ ] Only run on `Platform.OS === 'android'`
  - [ ] Call `Notifications.setNotificationChannelAsync()` for each channel
- [ ] Implement `requestNotificationPermissions()`:
  - [ ] Get existing permission status: `Notifications.getPermissionsAsync()`
  - [ ] If not granted, request: `Notifications.requestPermissionsAsync()`
  - [ ] Call `setupAndroidChannels()` on Android
  - [ ] Return boolean (granted or not)
- [ ] Implement `scheduleMessageNotification(chatId, messageText, senderName, isGroup)`:
  - [ ] Build notification content:
    - Title: group name or sender name
    - Body: message text (truncate to 100 chars)
    - Data: `{ chatId, type: 'new_message' }`
  - [ ] Schedule immediately: `trigger: null`
  - [ ] Include sound and badge
  - [ ] Return notification ID
- [ ] Implement `getInitialNotification()`:
  - [ ] Call `Notifications.getLastNotificationResponseAsync()`
  - [ ] Return notification if present
- [ ] Implement `getChatIdFromNotification(notification)`:
  - [ ] Extract `chatId` from `notification.request.content.data`
- [ ] Implement helper functions:
  - [ ] `setBadgeCount(count)` - update app badge
  - [ ] `getBadgeCount()` - get current badge count
  - [ ] `clearAllNotifications()` - clear notification tray

**Pattern:** Local notifications only, no token storage, triggered by Firestore listener

#### Subtask 4.3: Create `lib/notifications/useNotifications.ts` Hook
- [ ] Create new file: `lib/notifications/useNotifications.ts`
- [ ] Import `useEffect`, `useRef`, `useRouter`, `expo-notifications`
- [ ] Implement `useNotifications()` hook:
  - [ ] Handle initial notification (app opened from notification)
  - [ ] Listen for notification taps: `addNotificationResponseReceivedListener()`
  - [ ] Navigate to chat: `router.push('/chat/${chatId}')`
  - [ ] Cleanup listeners on unmount

**Pattern:** React Hook for notification navigation

#### Subtask 4.4: Integrate Local Notifications into Message Listener
- [ ] Open existing file: `lib/store/messageStore.ts`
- [ ] Import `scheduleMessageNotification` from local notifications
- [ ] In existing Firestore listener (`subscribeToMessages`):
  - [ ] When new message arrives from OTHER user (not own message)
  - [ ] Check if app is in background: `AppState.currentState !== 'active'`
  - [ ] If backgrounded, call `scheduleMessageNotification()`
  - [ ] Pass chatId, message text, sender name, isGroup

**Pattern:** Trigger local notification when message arrives while app backgrounded

#### Subtask 4.5: Request Permissions in `app/_layout.tsx`
- [ ] Open existing file: `app/_layout.tsx`
- [ ] Import `useNotifications` and `requestNotificationPermissions`
- [ ] Call `useNotifications()` hook at top level
- [ ] In auth listener `useEffect`, when user logs in:
  - [ ] Call `await requestNotificationPermissions()`
  - [ ] Log result with `debugLog()`
- [ ] Handle errors gracefully (log, don't crash)

**Pattern:** Request permission after authentication, handle navigation globally

---

### **Task 5: Add In-App Notification Banner** (Optional Enhancement)
**Time:** 30 minutes
**Action:** CREATE in-app banner component for foreground messages

**📱 NOTE:** This provides better UX when app is open

#### Subtask 5.1: Create `components/notifications/InAppBanner.tsx` (Optional)
- [ ] Create new directory: `components/notifications/`
- [ ] Create new file: `components/notifications/InAppBanner.tsx`
- [ ] Build animated banner component:
  - [ ] Shows at top of screen when message arrives (app foregrounded)
  - [ ] Displays sender name, message preview
  - [ ] Auto-dismisses after 3 seconds
  - [ ] Tappable to navigate to chat
  - [ ] Slide-down animation
- [ ] Import `react-native-reanimated` for smooth animations
- [ ] Add styles: WhatsApp-style banner with shadow

**Pattern:** Optional enhancement for better foreground UX

#### Subtask 5.2: Integrate Banner into Message Listener (Optional)
- [ ] Open existing file: `lib/store/messageStore.ts`
- [ ] Import InAppBanner state management
- [ ] When new message arrives AND app is foregrounded:
  - [ ] Trigger banner display
  - [ ] Pass sender name, message text, chatId
- [ ] Banner auto-hides after 3 seconds OR when tapped

**Pattern:** Show banner for foreground messages, local notification for background

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
**Time:** 1.5-2 hours (includes device setup and debugging)

**⚠️ TESTING CONSTRAINTS:**
- Group chat: Can test fully in iOS Simulator + Android Emulator
- Push notifications: **REQUIRES physical iOS device + Android emulator with Google Play Services**
- iOS Simulator CANNOT receive remote push notifications (APNs limitation)

---

#### **Part A: Group Chat Testing (Simulator/Emulator OK)**

**Group Chat Creation:**
- [ ] Tap "New Group" button
- [ ] Select 2+ users
- [ ] Enter group name
- [ ] Tap "Create"
- [ ] Verify: Navigates to group chat screen

**Group Messaging:**
- [ ] Send message in group chat
- [ ] Verify: All participants receive message in real-time
- [ ] Check: Last message updates in chat list
- [ ] Verify: Unread counts update for other participants

**Group Member Status:**
- [ ] Open group chat
- [ ] Tap group header
- [ ] Verify: Member list modal opens
- [ ] Check: Online/offline indicators correct
- [ ] Verify: Online count matches actual online users

**Offline Group Chat:**
- [ ] Turn off network (Airplane mode)
- [ ] Send group message
- [ ] Verify: Shows "sending..." status
- [ ] Turn on network
- [ ] Verify: Syncs and all participants receive
- [ ] Check: Message status changes to "delivered"/"read"

---

#### **Part B: Push Notifications Testing (Physical Device Required)**

**Prerequisites:**
- [ ] Physical iPhone with development profile installed
- [ ] Dev build installed on device: `eas build --profile development --platform ios`
- [ ] OR Android emulator with Google Play Services (AVD with Play Store icon)
- [ ] Logged in with test account
- [ ] Notification permissions granted

**Foreground Notifications (App Open):**
- [ ] Have app open and active
- [ ] Send message from different device/account
- [ ] **Expected:** In-app notification banner appears at top
- [ ] Verify: Banner shows sender name and message preview
- [ ] Tap banner → navigates to chat
- [ ] Verify: Sound plays (check device volume not muted)

**Background Notifications (App Backgrounded):**
- [ ] Press home button (app in background, not quit)
- [ ] Send message from different device/account
- [ ] **Expected:** Lock screen notification appears
- [ ] Verify: Shows sender name, message text, time
- [ ] Tap notification → app resumes and opens correct chat
- [ ] Verify: Badge count updates on app icon

**Quit State Notifications (App Fully Closed):**
- [ ] Force quit app (swipe up from app switcher)
- [ ] Send message from different device/account
- [ ] **Expected:** Lock screen notification appears
- [ ] Tap notification → app launches and opens correct chat
- [ ] Verify: Deep linking works from cold start

**High Priority Notifications:**
- [ ] Send message with high priority content (e.g., "URGENT: Practice cancelled")
- [ ] **Expected (iOS):** Time-sensitive alert style
- [ ] **Expected (Android):** High importance notification with heads-up display
- [ ] Verify: Different sound/vibration pattern

**Group Chat Notifications:**
- [ ] Send message in group chat from different device
- [ ] **Expected:** Notification shows group name as title
- [ ] Verify: Body shows "SenderName: Message text"
- [ ] Tap notification → opens correct group chat

**Notification Permissions Denied:**
- [ ] Deny notification permissions when prompted
- [ ] Send message to user
- [ ] **Expected:** No notification appears (app should still work)
- [ ] Verify: Messages still arrive when app is opened
- [ ] Check: No crashes or errors logged

---

#### **Part C: Edge Cases & Error Handling**

**No Device Token Saved:**
- [ ] Check Firestore for user who denied permissions
- [ ] **Expected:** No devices subcollection OR token is null
- [ ] Verify: Cloud Function handles gracefully (logs "no tokens found")

**Invalid/Expired Token:**
- [ ] Manually set invalid token in Firestore
- [ ] Send message
- [ ] **Expected:** Cloud Function logs failure but doesn't crash
- [ ] Verify: Error message indicates which token failed

**Network Offline During Notification Send:**
- [ ] Disconnect Firebase emulator network
- [ ] Send message
- [ ] **Expected:** Cloud Function retries or logs timeout
- [ ] Verify: No data corruption in Firestore

**Multiple Devices for Same User:**
- [ ] Log in on physical iPhone
- [ ] Also log in on Android emulator with same account
- [ ] Send message to this user
- [ ] **Expected:** Notification appears on BOTH devices
- [ ] Verify: Both device tokens saved in devices subcollection

---

#### **Testing Checklist Summary**

**Group Chat (Testable in Simulator):**
- [ ] ✅ Create group chat
- [ ] ✅ Send/receive group messages
- [ ] ✅ View member list with online status
- [ ] ✅ Offline sync works

**Push Notifications (Requires Physical Device):**
- [ ] ✅ Foreground notification displays
- [ ] ✅ Background notification displays
- [ ] ✅ Quit state notification displays
- [ ] ✅ Tap notification opens correct chat
- [ ] ✅ High priority alerts work
- [ ] ✅ Group chat notifications formatted correctly
- [ ] ✅ Permission denied handled gracefully
- [ ] ✅ Multiple devices supported

**Common Failure Points:**
- ❌ Using iOS Simulator for remote push (won't work)
- ❌ Forgetting to run `expo prebuild` after adding expo-notifications
- ❌ Not building dev client for physical device
- ❌ Firestore rules not deployed (token writes fail)
- ❌ Android emulator without Google Play Services (no FCM)

**Debugging Tools:**
- Firebase Console → Functions → Logs (check function execution)
- Firebase Console → Firestore (verify tokens saved)
- Xcode Console (view native iOS logs)
- Expo Dev Tools → Logs (client-side logs)
- `debugLog()` statements in notification setup code

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
