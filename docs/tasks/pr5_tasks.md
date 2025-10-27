# PR #5: Group Chat + Push Notifications - Task Breakdown

**Estimated Time:** 8-10 hours
**Dependencies:** PR #1 (Authentication), PR #2 (Core UI), PR #3 (Messaging), PR #4 (Offline Support)
**🎯 MVP CHECKPOINT:** This PR completes all 11 MVP requirements

**⚠️ IMPORTANT PREREQUISITES:**
- Physical iOS device required for push notification testing (Simulator doesn't support remote push)
- `GoogleService-Info.plist` configured for APNs
- `google-services.json` configured for FCM
- Android emulator with Google Play Services installed
- Expo project ID configured in `app.json`

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

### **Task 4: Setup Push Notifications - Client**
**Time:** 3-4 hours
**Action:** CREATE notification setup module using `expo-notifications`

**⚠️ CRITICAL CONSTRAINTS:**
- Uses `expo-notifications` (NOT `@react-native-firebase/messaging`)
- Requires `expo prebuild` for native module configuration
- iOS Simulator CANNOT test remote push - use physical device
- Android emulator requires Google Play Services

#### Subtask 4.1: Install and Configure Dependencies
- [ ] Run: `npx expo install expo-notifications expo-device`
- [ ] Update `app.json` with expo-notifications plugin:
  ```json
  "plugins": [
    "expo-router",
    "@react-native-google-signin/google-signin",
    [
      "expo-notifications",
      {
        "icon": "./assets/notification-icon.png",
        "color": "#0C8466",
        "sounds": ["./assets/notification-sound.wav"],
        "mode": "production"
      }
    ]
  ]
  ```
- [ ] Add iOS entitlements in `app.json`:
  ```json
  "ios": {
    "entitlements": {
      "aps-environment": "production"
    }
  }
  ```
- [ ] Add Android permissions in `app.json`:
  ```json
  "android": {
    "googleServicesFile": "./google-services.json",
    "permissions": ["POST_NOTIFICATIONS", "VIBRATE"]
  }
  ```
- [ ] Run: `npx expo prebuild --clean` (generates native iOS/Android projects)
- [ ] Verify: `ios/` and `android/` directories created

**Pattern:** Native module setup with Expo config plugins

#### Subtask 4.2: Create `lib/notifications/setup.ts`
- [ ] Create new directory: `lib/notifications/`
- [ ] Create new file: `lib/notifications/setup.ts`
- [ ] Import `expo-notifications`, `expo-device`, Firestore
- [ ] Configure notification handler for foreground:
  ```typescript
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  ```
- [ ] Define Android notification channels:
  - `default` - Default message notifications (importance: DEFAULT)
  - `high-priority` - Urgent notifications (importance: HIGH, vibration)
  - `digest` - Daily summaries (importance: LOW, no sound)
- [ ] Implement `setupAndroidChannels()`:
  - [ ] Only run on `Platform.OS === 'android'`
  - [ ] Call `Notifications.setNotificationChannelAsync()` for each channel
- [ ] Implement `requestNotificationPermission(userId)`:
  - [ ] Check `Device.isDevice` (return false if simulator/emulator)
  - [ ] Get existing permission status: `Notifications.getPermissionsAsync()`
  - [ ] If not granted, request: `Notifications.requestPermissionsAsync()`
  - [ ] If granted: call `setupNotifications(userId)` and `setupAndroidChannels()`
  - [ ] Return boolean (granted or not)
- [ ] Implement `setupNotifications(userId)`:
  - [ ] Get Expo Push Token: `Notifications.getExpoPushTokenAsync({ projectId })`
  - [ ] Save token to Firestore: `users/{userId}/devices/{deviceId}`
  - [ ] Token document includes: `token`, `platform`, `deviceId`, `deviceName`, `lastSeen`
  - [ ] Listen for token refresh: `Notifications.addPushTokenListener()`
  - [ ] Update token in Firestore when refreshed
  - [ ] Return cleanup function
- [ ] Implement `getInitialNotification()`:
  - [ ] Call `Notifications.getLastNotificationResponseAsync()`
  - [ ] Return notification if present
- [ ] Implement `getChatIdFromNotification(notification)`:
  - [ ] Extract `chatId` from `notification.request.content.data`
- [ ] Implement helper functions:
  - [ ] `scheduleLocalNotification()` - for future deadline reminders
  - [ ] `cancelScheduledNotification()` - cancel by identifier
  - [ ] `setBadgeCount()` - update app badge
  - [ ] `getBadgeCount()` - get current badge count

**Pattern:** Async/await, native Expo Notifications API, device token subcollection

#### Subtask 4.3: Create `lib/notifications/useNotifications.ts` Hook
- [ ] Create new file: `lib/notifications/useNotifications.ts`
- [ ] Import `useEffect`, `useRef`, `useRouter`, `expo-notifications`
- [ ] Implement `useNotifications()` hook:
  - [ ] Handle initial notification (app opened from notification)
  - [ ] Listen for foreground notifications: `addNotificationReceivedListener()`
  - [ ] Listen for notification taps: `addNotificationResponseReceivedListener()`
  - [ ] Navigate to chat: `router.push('/chat/${chatId}')`
  - [ ] Cleanup listeners on unmount

**Pattern:** React Hook for notification navigation

#### Subtask 4.4: Integrate into `app/_layout.tsx`
- [ ] Open existing file: `app/_layout.tsx`
- [ ] Import `useNotifications` and `requestNotificationPermission`
- [ ] Call `useNotifications()` hook at top level
- [ ] In auth listener `useEffect`, when user logs in:
  - [ ] Call `await requestNotificationPermission(user.uid)`
  - [ ] Log result with `debugLog()`
- [ ] Handle errors gracefully (log, don't crash)

**Pattern:** Request permission after authentication, handle navigation globally

---

### **Task 5: Create Cloud Function for Notifications**
**Time:** 2-3 hours
**Action:** CREATE Cloud Function for Expo Push Notifications

**⚠️ NOTE:** This function sends to Expo Push Notification service, NOT directly to FCM/APNs

#### Subtask 5.1: Update Firestore Rules for Device Tokens
- [ ] Open or create `firestore.rules` in project root
- [ ] Add rules for `users/{userId}/devices/{deviceId}` subcollection:
  ```
  match /users/{userId}/devices/{deviceId} {
    allow read, write: if request.auth.uid == userId;
  }
  ```
- [ ] Deploy rules: `firebase deploy --only firestore:rules`

**Pattern:** Secure device token storage per user

#### Subtask 5.2: Create `functions/src/notifications/sendMessageNotification.ts`
- [ ] Create new directory: `functions/src/notifications/`
- [ ] Create new file: `functions/src/notifications/sendMessageNotification.ts`
- [ ] Import Firebase functions, admin SDK, and `FUNCTIONS_REGION` from `../config`
- [ ] Implement `sendMessageNotification`:
  - [ ] Trigger: `.region(FUNCTIONS_REGION).firestore.document('chats/{chatId}/messages/{messageId}').onCreate()`
  - [ ] Get message data from snapshot
  - [ ] Get chat document from Firestore
  - [ ] Filter recipients (exclude sender from participants)
  - [ ] If no recipients, return early with log
  - [ ] Get sender's display name from users collection
  - [ ] Query all device tokens for recipients:
    - [ ] For each recipient: `users/{userId}/devices` where `token != null`
    - [ ] Collect tokens with platform metadata
  - [ ] If no tokens found, return early with log
  - [ ] Build notification title based on chat type:
    - [ ] Group: `chatData.groupName || 'Group Chat'`
    - [ ] One-on-one: sender's name
  - [ ] Build notification body:
    - [ ] Group: `"${senderName}: ${messageData.text}"`
    - [ ] One-on-one: `messageData.text`
    - [ ] Truncate to 100 chars if needed
  - [ ] Determine priority from AI extraction:
    - [ ] If `message.aiExtraction.priority.level` is 'critical' or 'high' → priority = 'high', channelId = 'high-priority'
    - [ ] Otherwise → priority = 'normal', channelId = 'default'
  - [ ] Build platform-specific messages using `admin.messaging().Message`:
    - [ ] For iOS: Configure APNS with sound, badge, and `interruption-level: time-sensitive` for high priority
    - [ ] For Android: Configure Android-specific settings with channelId, priority, sound
    - [ ] Include data payload: `{ chatId, messageId, senderId, type: 'new_message', priority }`
  - [ ] Send notifications: `admin.messaging().sendEach(messages)`
  - [ ] Log success and failure counts
  - [ ] For failures, log error messages (helps debug invalid tokens)
  - [ ] Return `{ success: successCount, failures: failureCount }`

**Pattern:** Cloud Function onCreate trigger, Expo Push Token delivery, platform-specific configs

#### Subtask 5.3: Update `functions/src/index.ts`
- [ ] Open existing file: `functions/src/index.ts`
- [ ] Add export: `export { sendMessageNotification } from './notifications/sendMessageNotification';`

#### Subtask 5.4: Build and Deploy Cloud Function
- [ ] Navigate to functions directory: `cd functions`
- [ ] Verify dependencies exist (should already have `firebase-admin`, `firebase-functions`)
- [ ] Build: `npm run build`
- [ ] Fix any TypeScript errors (check imports from `../config`)
- [ ] Deploy: `firebase deploy --only functions:sendMessageNotification`
- [ ] Verify deployment in Firebase Console → Functions
- [ ] Check function logs for any initialization errors

**Pattern:** Incremental deployment, verify in console before testing

#### Subtask 5.5: Test Notification Flow End-to-End
**⚠️ REQUIRES PHYSICAL iOS DEVICE**

- [ ] Build development client for physical device: `eas build --profile development --platform ios`
- [ ] Install dev client on physical iPhone
- [ ] Log in with Test User 1 on physical device
- [ ] Grant notification permissions when prompted
- [ ] Verify Expo Push Token saved in Firestore: `users/{uid}/devices/{deviceId}`
- [ ] Log in with Test User 2 on Simulator/different device
- [ ] Send message from User 2 to User 1
- [ ] **Expected:** Notification appears on User 1's physical device
- [ ] Tap notification → app opens to correct chat
- [ ] **Verify in Firebase Console:**
  - [ ] Cloud Function execution logged
  - [ ] No errors in function logs
  - [ ] Success count = 1, failures = 0

**Testing Matrix:**

| Scenario | Device State | Expected Behavior |
|----------|--------------|-------------------|
| New message | App in foreground | In-app notification banner |
| New message | App in background | Lock screen notification |
| New message | App quit/killed | Lock screen notification |
| Tap notification | Any state | Opens app to correct chat |
| High priority message | Background | Time-sensitive alert (iOS) / High importance (Android) |

**Common Issues & Fixes:**
- Token not saved → Check Firestore rules, verify `requestNotificationPermission()` called
- No notification received → Check Cloud Function logs for errors, verify token is valid Expo Push Token
- Notification received but can't tap → Check deep linking setup in `useNotifications` hook
- iOS: "This request is not supported" → Using Simulator instead of physical device

**Integration:** Automatically triggered when messages created, sends to Expo Push service

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
