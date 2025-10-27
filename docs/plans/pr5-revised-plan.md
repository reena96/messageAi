# PR #5 Revised Plan: Group Chat Only

**Last Updated:** 2025-10-26
**Decision:** Split original PR5 into two separate PRs based on feasibility analysis

---

## Executive Summary

After analyzing `/docs/plans/14-push-notifications.md` and reviewing implementation constraints, we're **splitting the original PR5** into two focused PRs:

1. **PR5 (Revised): Group Chat** - Complete group chat functionality (3-4 hours)
2. **PR6 (New): Push Notifications Foundation** - Phase 1 push notifications (6-8 hours)

**Rationale:**
- Push notifications require native module setup (`expo prebuild`), physical device testing, and platform-specific credentials
- Original PR5 timeline (5-6 hours total) was unrealistic for both features
- Group chat can be fully tested in simulator; push notifications cannot
- Separating concerns allows MVP completion verification before tackling complex native setup

---

## What Changed from Original PR5

### ❌ Removed from PR5 (Moved to PR6)
- All push notification client setup
- Cloud Function for sending notifications
- FCM/APNs token management
- Notification permission handling
- Deep linking from notifications

### ✅ Kept in PR5 (Group Chat Focus)
- Group chat creation with participant selection
- Group messaging (reuses existing messageStore)
- Group chat header with member list and online status
- "New Group" button in chat list

### 📦 New PR6 Scope (Push Notifications Foundation)
- `expo-notifications` setup with `expo prebuild`
- Permission explainer UI
- Device token storage (Firestore subcollection)
- Cloud Function: `sendMessageNotification`
- Notification tap → chat navigation
- Android notification channels
- **Testing on physical iOS device + Android emulator**

---

## PR5 Revised: Group Chat Implementation

### Timeline: 3-4 hours

### Task Breakdown

#### **Task 1: Extend chatStore for Group Chat** (1 hour)

**File:** `lib/store/chatStore.ts`

Add `createGroupChat` method:
```typescript
createGroupChat: async (
  currentUserId: string,
  participantIds: string[],
  groupName: string,
  currentUserDetails: { displayName: string; photoURL?: string },
  participantDetails: { [userId: string]: { displayName: string; photoURL?: string } }
) => Promise<string>
```

Implementation steps:
1. Combine creator + participants into `allParticipants`
2. Fetch participant data from `/users` collection
3. Build `participantData` mapping
4. Initialize `unreadCount` for all participants
5. Create chat document with:
   - `type: 'group'`
   - `participants: allParticipants`
   - `participantData`
   - `groupName`
   - `createdBy: currentUserId`
   - `lastMessage` (group created system message)
   - Timestamps

**Testing:**
- Unit test: Group chat document created with correct structure
- Unit test: Creator included in participants
- Unit test: Unread counts initialized for all

---

#### **Task 2: Create Group Creation Modal** (1.5 hours)

**File:** `app/(modal)/create-group.tsx`

UI Components:
1. Group name TextInput
2. User selection list (checkboxes)
3. Member count display
4. Create/Cancel buttons

State management:
- `groupName: string`
- `selectedUsers: Set<string>`
- `users: User[]` (from Firestore)
- `loading: boolean`

Validation:
- Group name required
- At least 1 participant selected (besides creator)
- Disable Create button if invalid

Navigation:
- On success: `router.replace('/chat/${chatId}')`
- On cancel: `router.back()`

---

#### **Task 3: Group Chat Header Component** (1 hour)

**File:** `components/chat/GroupChatHeader.tsx`

Features:
1. Display group name
2. Show member count + online count
3. Tappable to open members modal
4. Info icon button

Members Modal:
- List all participants
- Show online/offline status (green/gray dot)
- Display "Online" / "Offline" text
- Real-time status updates via Firestore listeners

**File:** `app/chat/[id].tsx` (modify)

Add conditional header rendering:
```typescript
{chatData.type === 'group' ? (
  <GroupChatHeader chat={chatData} onBack={() => router.back()} />
) : (
  // Existing one-on-one header
)}
```

---

#### **Task 4: Add "New Group" Button** (15 minutes)

**File:** `app/(tabs)/chats.tsx`

Add header with:
- "Chats" title (left)
- People icon button (right)
- `onPress`: Navigate to `/create-group` modal

---

#### **Task 5: Testing & Verification** (30 minutes)

**Unit Tests:**
- `chatStore.group.test.ts`: 3 tests for group creation
- Run existing regression tests (ensure no breaks)

**Manual Testing (iOS Simulator + Android Emulator):**
1. Create group chat with 3+ users
2. Verify group appears in chat list
3. Send message in group → all participants receive
4. Open group header → view members list
5. Check online/offline indicators update
6. Verify unread counts work for all participants

**TypeScript:**
- Run `npx tsc --noEmit` → 0 errors

**Build:**
- Verify app builds successfully

---

### Success Criteria for PR5

- [ ] Users can create group chats with 2+ participants
- [ ] Group name is required and displays correctly
- [ ] Group messaging works (all participants receive messages)
- [ ] Group header shows member count + online status
- [ ] Tapping header opens members modal
- [ ] Members modal shows real-time online/offline status
- [ ] "New Group" button navigates to creation modal
- [ ] All existing tests pass
- [ ] 3 new tests for group chat creation pass
- [ ] TypeScript compilation: 0 errors
- [ ] App builds successfully on iOS + Android

**MVP Status After PR5:**
- ✅ One-on-one messaging (PR #3)
- ✅ Group chat (PR #5) ← NEW
- ✅ Real-time sync (PR #3)
- ✅ Offline support (PR #4)
- ✅ User authentication (PR #1)
- ✅ User profiles (PR #1)
- ✅ User presence (PR #1, #2)
- ✅ Cross-platform (PR #1-5)
- ✅ Responsive UI (PR #2)
- ❌ Push notifications (PR #6) ← DEFERRED
- ✅ Persistent storage (PR #4)

**MVP Completion:** 10/11 requirements (91%)

---

## PR6 Preview: Push Notifications Foundation (Phase 1)

### Timeline: 6-8 hours

**IMPORTANT:** This is a complex PR requiring:
- Native module configuration (`expo prebuild`)
- Platform-specific credential files
- Physical iOS device for testing (Simulator doesn't support remote push)
- Android emulator with Google Play Services

### Prerequisites (Before Starting PR6)

1. **iOS APNs Setup:**
   - Apple Developer account access
   - Generate APNs key/certificate
   - Add to Firebase project
   - Update `GoogleService-Info.plist`

2. **Android FCM Setup:**
   - Ensure `google-services.json` is up-to-date
   - Firebase Cloud Messaging enabled
   - Android SHA-1 fingerprints registered

3. **Physical Device Access:**
   - iOS device (iPhone) for remote push testing
   - Logged into Apple Developer account
   - Android emulator with Google Play Services

4. **Expo Configuration:**
   - Confirm EAS Build setup
   - Ensure `expo-notifications` compatibility
   - Verify project ID in `app.json`

### Scope for PR6 (Phase 1 Only)

**In Scope:**
- ✅ `expo-notifications` installation and configuration
- ✅ Permission explainer screen (pre-permission UI)
- ✅ Permission request flow
- ✅ Expo Push Token acquisition
- ✅ Token storage in Firestore (`users/{uid}/devices/{deviceId}`)
- ✅ Cloud Function: `sendMessageNotification` (basic)
- ✅ Notification tap → deep link to chat
- ✅ Android notification channels (Default, High Priority, Digest)
- ✅ Foreground notification display
- ✅ Basic logging and error handling

**Out of Scope (Deferred to Phase 2-3):**
- ❌ AI-driven priority routing (immature AI signals)
- ❌ Digest notifications (requires scheduling infrastructure)
- ❌ Quiet hours / Do Not Disturb
- ❌ Per-chat notification preferences UI
- ❌ Actionable notifications (RSVP buttons, quick actions)
- ❌ Local notification scheduling
- ❌ Advanced parent workflows (carpool, medication, etc.)
- ❌ Notification analytics and engagement tracking
- ❌ Fallback to email/SMS on failure

### Testing Strategy for PR6

**Development:**
1. Use physical iOS device connected to Mac
2. Build dev client: `eas build --profile development --platform ios`
3. Install on device
4. Test permission flow in app

**Testing Matrix:**

| State | iOS Device | Android Emulator |
|-------|-----------|------------------|
| **Foreground** | ✅ Notification displayed in-app | ✅ Notification displayed in-app |
| **Background** | ✅ Banner appears | ✅ Banner appears |
| **Quit/Killed** | ✅ Banner appears | ✅ Banner appears |
| **Tap Notification** | ✅ Opens chat | ✅ Opens chat |
| **Permission Denied** | ✅ Graceful fallback | ✅ Graceful fallback |

**Cannot Test:**
- ❌ iOS Simulator (no APNs support)
- ❌ Web browser (requires different implementation)

---

## Deferred Features (Phase 2-3)

### Phase 2: AI Integration & Preferences (Future PR)
- Wire AI outputs to notification priority
- Build Notification Preferences UI
- Implement quiet hours
- Add per-chat mute settings
- Foreground notification banners with quick actions
- Digest view (in-app)

### Phase 3: Advanced Workflows (Future PR)
- Carpool reminders
- Medication scheduling
- Payment tracking
- Safety check-ins
- Packing checklists
- AI chat recaps
- Task follow-ups

---

## Why This Split Makes Sense

### Technical Reasons:
1. **Native complexity isolation** - Group chat is pure React Native; push requires native modules
2. **Testing independence** - Group chat testable in simulator; push needs real devices
3. **Dependency management** - `expo prebuild` changes project structure significantly
4. **Incremental risk** - Validate group chat works before adding push complexity

### Product Reasons:
1. **MVP clarity** - Can claim "10/11 MVP features" after PR5, "11/11" after PR6
2. **User testing** - Ship group chat to beta users while perfecting push notifications
3. **Stakeholder communication** - Easier to explain "group chat done, push in progress"

### Engineering Reasons:
1. **Code review size** - Smaller PRs = faster reviews = less context switching
2. **Rollback safety** - Can revert push changes without affecting group chat
3. **Timeline accuracy** - Realistic estimates vs. compressed timelines that slip

---

## Next Steps

1. **Immediate (PR5):** Implement group chat following revised task breakdown above
2. **Before PR6:** Complete all prerequisite setup (APNs, credentials, physical device access)
3. **PR6 Planning:** Create detailed `pr6_tasks.md` with Phase 1 scope only

---

## Questions to Resolve Before PR6

- [ ] Do we have access to APNs keys/certificates?
- [ ] Is `google-services.json` configured for FCM?
- [ ] Do we have a physical iOS device for testing?
- [ ] Is the Android emulator image with Google Play Services installed?
- [ ] Have we run `expo prebuild` before, or will this be first time?
- [ ] What's the fallback if push notifications fail? (In-app polling? Email?)
- [ ] Should we implement a "notification permission education" screen first?

---

## Summary

**Original PR5:**
- ❌ Too ambitious (group chat + push in 5-6 hours)
- ❌ Underestimated push notification complexity
- ❌ Didn't account for native module setup time
- ❌ Ignored simulator testing limitations

**Revised Approach:**
- ✅ PR5: Group chat only (3-4 hours, fully testable in simulator)
- ✅ PR6: Push notifications Phase 1 (6-8 hours, requires physical device)
- ✅ Realistic timelines based on actual constraints
- ✅ Clear success criteria for each PR
- ✅ Explicit list of deferred features
- ✅ Pre-requisite checklist before starting PR6

**Result:** Higher confidence in delivery, better code quality, clearer progress tracking.
