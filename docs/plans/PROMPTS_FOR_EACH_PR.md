# Coding Agent Prompts for Each PR

This document contains the exact prompts to use when implementing each PR. Each prompt includes:
- Required context files
- Implementation task
- Test requirements
- Verification criteria

---

## PR #1: Project Setup + Authentication

### Context Files to Read:
```
1. /docs/plans/01-messageai-prd.md
   - Section 2: User Requirements (authentication requirements)
   - Section 3.2: MVP Requirements (auth flows)

2. /docs/plans/02-technical-architecture.md
   - Section 1: Tech Stack (Firebase Auth, Expo setup)
   - Section 3: Data Models (User model)
   - Section 4: Security & Firestore Rules (auth rules)

3. /docs/plans/06-implementation-foundation.md
   - Complete file (implementation details + tests)
```

### Prompt for Coding Agent:

```
You are implementing PR #1: Project Setup + Authentication for the MessageAI app.

CONTEXT FILES (read these first):
- /docs/plans/01-messageai-prd.md (User requirements, MVP checklist)
- /docs/plans/02-technical-architecture.md (Tech stack, User data model, Security rules)
- /docs/plans/06-implementation-foundation.md (Complete implementation guide with tests)

TASK:
Implement authentication system with test-driven development following these steps:

1. PROJECT SETUP:
   - Initialize Expo Custom Dev Client project with TypeScript
   - Install all dependencies listed in 06-implementation-foundation.md section 1
   - Configure app.json with Firebase plugins
   - Set up Firebase (Auth + Firestore) configuration

2. AUTHENTICATION IMPLEMENTATION:
   - Create authStore (lib/store/authStore.ts) with:
     * signUp(email, password, displayName)
     * signIn(email, password)
     * signOut()
     * setUser(user)
   - Create login screen (app/(auth)/login.tsx)
   - Create signup screen (app/(auth)/signup.tsx)
   - Set up navigation with Expo Router
   - Implement auth state persistence

3. TEST IMPLEMENTATION (CRITICAL - MUST COMPLETE):
   Write and ensure ALL tests pass:

   a) Firebase configuration tests (lib/firebase/__tests__/config.test.ts):
      - Firestore initialization
      - Auth initialization
      - Offline persistence enabled

   b) authStore unit tests (lib/store/__tests__/authStore.test.ts):
      - signUp: successful signup, error handling, loading state (3 tests)
      - signIn: successful login, invalid credentials (2 tests)
      - signOut: successful logout, offline status update (2 tests)

   c) Integration tests (__tests__/integration/auth.test.tsx):
      - Login flow (3 tests)
      - Signup flow (2 tests)
      - Complete auth flow (1 test)

4. VERIFICATION:
   Run these commands and ensure all pass:
   ```bash
   npm test -- lib/firebase/__tests__/config.test.ts
   npm test -- lib/store/__tests__/authStore.test.ts
   npm test -- __tests__/integration/auth.test.tsx
   ```

   Then manually verify:
   - User can sign up with email/password
   - User can sign in with valid credentials
   - User can sign out
   - Auth state persists after app restart
   - User document created in Firestore /users/{uid}
   - Error messages display correctly

5. SUCCESS CRITERIA:
   - ✅ All 13 tests passing (3 config + 7 unit + 6 integration)
   - ✅ TypeScript compiles with no errors
   - ✅ App builds on iOS and Android
   - ✅ Manual verification checklist complete

6. COMMIT MESSAGE:
   ```
   feat(auth): implement authentication with tests

   - Setup Expo Custom Dev Client
   - Configure Firebase Auth and Firestore
   - Implement authStore with Zustand
   - Add login/signup screens
   - Add unit tests (7/7 passing)
   - Add integration tests (6/6 passing)

   Tests: 13/13 passing ✅
   ```

IMPORTANT:
- Follow TDD: Write tests first, then implement to make them pass
- Reference 06-implementation-foundation.md for complete code examples
- All tests must pass before considering PR complete
- Do not skip any tests - they verify correctness for rubric requirements
```

**Estimated time:** 2-3 hours

---

## PR #2: Core UI + Navigation + Performance

### Context Files to Read:
```
1. /docs/plans/01-messageai-prd.md
   - Section 3.2: MVP Requirements (UI/UX requirements)

2. /docs/plans/02-technical-architecture.md
   - Section 2: System Architecture (app structure)
   - Section 3: Data Models (Chat model)
   - Section 5: Performance Targets

3. /docs/plans/07-implementation-core-messaging.md
   - PR #2 section (first part of file)
```

### Prompt for Coding Agent:

```
You are implementing PR #2: Core UI + Navigation + Performance for the MessageAI app.

CONTEXT FILES (read these first):
- /docs/plans/01-messageai-prd.md (UI/UX requirements from MVP)
- /docs/plans/02-technical-architecture.md (Chat data model, Performance targets)
- /docs/plans/07-implementation-core-messaging.md (PR #2 section only)

DEPENDENCIES:
- ✅ PR #1 must be complete (authentication working)

TASK:
Implement core UI with tab navigation and chat list following TDD:

1. TAB NAVIGATION:
   - Create tab layout (app/(tabs)/_layout.tsx) with 4 tabs:
     * Chats
     * Deadlines
     * AI Assistant
     * Profile
   - Use Ionicons for tab icons
   - Configure Expo Router

2. CHAT STORE:
   - Create chatStore (lib/store/chatStore.ts) with:
     * subscribeToChats(userId)
     * createOneOnOneChat(userId, otherUserId, otherUserData)
     * createGroupChat(userId, participantIds, groupName)
   - Implement Firestore real-time listeners
   - Handle loading and error states

3. CHAT LIST SCREEN:
   - Create chats screen (app/(tabs)/chats.tsx)
   - Use FlashList for performance (60 FPS requirement)
   - Display: chat name, last message, unread count
   - Add "New" button for group creation

4. CONNECTION STATUS:
   - Create ConnectionStatus component (components/common/ConnectionStatus.tsx)
   - Use NetInfo to detect network state
   - Show banner when offline with animation

5. PERFORMANCE MONITORING:
   - Create performance monitor (lib/utils/performance.ts)
   - Track app launch time
   - Log performance metrics

6. PROFILE SCREEN:
   - Create profile screen (app/(tabs)/profile.tsx)
   - Display user info (name, email, avatar)
   - Add sign out button

7. TEST IMPLEMENTATION (CRITICAL):

   chatStore unit tests (lib/store/__tests__/chatStore.test.ts):
   - subscribeToChats: loads user chats, filters by participant, orders by updatedAt, limits to 100 (4 tests)
   - createOneOnOneChat: returns existing chat, creates new chat (2 tests)
   - createGroupChat: creates with participants (1 test)

8. VERIFICATION:
   ```bash
   npm test -- lib/store/__tests__/chatStore.test.ts
   ```

   Manual verification:
   - Tab navigation works smoothly
   - Chat list displays user's chats
   - Connection banner appears when offline
   - FlashList scrolls at 60 FPS with 100+ chats
   - Profile shows user info
   - Sign out works

9. SUCCESS CRITERIA:
   - ✅ All 7 chatStore tests passing
   - ✅ App launch to chat screen <2 seconds
   - ✅ Scrolling performance: 60 FPS
   - ✅ TypeScript compiles with no errors

10. COMMIT MESSAGE:
    ```
    feat(ui): implement core UI and navigation with tests

    - Tab navigation with 4 tabs
    - Chat list with FlashList (60 FPS)
    - chatStore with real-time listeners
    - Connection status indicator
    - Profile screen
    - Unit tests (7/7 passing)

    Performance: App launch 1.8s (target <2s) ✅
    Tests: 7/7 passing ✅
    ```

IMPORTANT:
- Use FlashList instead of FlatList for performance
- Test with 100+ mock chats to verify scrolling performance
- Reference 07-implementation-core-messaging.md for complete code
```

**Estimated time:** 4-5 hours

---

## PR #3: Real-Time Messaging

### Context Files to Read:
```
1. /docs/plans/02-technical-architecture.md
   - Section 3: Data Models (Message model, AI-specific types)
   - Section 5: Performance Targets (message delivery <200ms)

2. /docs/plans/03-messaging-infrastructure.md
   - Section 2: Real-Time Sync Patterns (Firestore listeners)
   - Section 4: Optimistic UI (pattern implementation)
   - Section 7: Common Pitfalls & Solutions

3. /docs/plans/07-implementation-core-messaging.md
   - PR #3 section (second part of file)
```

### Prompt for Coding Agent:

```
You are implementing PR #3: Real-Time Messaging for the MessageAI app.

CONTEXT FILES (read these first):
- /docs/plans/02-technical-architecture.md (Message data model, Performance targets)
- /docs/plans/03-messaging-infrastructure.md (Real-time patterns, Optimistic UI, Pitfalls)
- /docs/plans/07-implementation-core-messaging.md (PR #3 section with complete tests)

DEPENDENCIES:
- ✅ PR #1 (authentication) and PR #2 (UI/navigation) must be complete

TASK:
Implement real-time messaging with optimistic UI and comprehensive testing:

1. MESSAGE STORE:
   - Create messageStore (lib/store/messageStore.ts) with:
     * subscribeToMessages(chatId) - real-time listener
     * sendMessage(chatId, senderId, text) - with optimistic UI
     * markAsRead(chatId, messageId, userId)
     * updateTypingStatus(chatId, userId, isTyping)
   - Implement optimistic message handling with tempId
   - Track performance with performanceMonitor

2. CHAT SCREEN:
   - Create chat screen (app/chat/[id].tsx)
   - Use FlashList for message list
   - Input with send button
   - Auto-scroll to bottom
   - Mark messages as read when viewing

3. MESSAGE COMPONENTS:
   - MessageBubble (components/messages/MessageBubble.tsx):
     * Different styles for own vs other messages
     * Status indicators (sending, sent, read)
     * Timestamp formatting
   - TypingIndicator (components/messages/TypingIndicator.tsx):
     * Animated dots
     * Show when other user is typing

4. USER PRESENCE:
   - Create usePresence hook (lib/hooks/usePresence.ts)
   - Update online status on app state changes
   - Set offline on unmount

5. TEST IMPLEMENTATION (CRITICAL - THIS IS THE CORE FEATURE):

   a) messageStore unit tests (lib/store/__tests__/messageStore.test.ts):
      - sendMessage: optimistic update, Firestore write, update lastMessage, performance tracking, error handling (5 tests)
      - markAsRead: update readBy array, error handling (2 tests)
      - subscribeToMessages: subscribe, order by timestamp, limit to 50 (3 tests)

   b) Integration tests (__tests__/integration/messaging.test.tsx):
      - Send and display message (1 test)
      - Receive messages in real-time (1 test)
      - Mark messages as read (1 test)

   c) Performance tests (__tests__/performance/messaging.test.ts):
      - Message send <200ms (1 test) ⚠️ RUBRIC REQUIREMENT
      - 20-message stress test (1 test)

6. VERIFICATION:
   ```bash
   npm test -- lib/store/__tests__/messageStore.test.ts
   npm test -- __tests__/integration/messaging.test.tsx
   npm test -- __tests__/performance/messaging.test.ts
   ```

   Manual verification:
   - Send message shows optimistic UI immediately
   - Message confirmed within 200ms on good network
   - Real-time receiving works across devices
   - Read receipts update correctly
   - Typing indicator appears within 100ms
   - User presence (online/offline) updates within 100ms
   - Scrolling 1000+ messages at 60 FPS

7. PERFORMANCE BENCHMARKING:
   Document in PERFORMANCE.md:
   - Message delivery time: ___ms (target <200ms)
   - Typing indicator lag: ___ms (target <100ms)
   - Presence update lag: ___ms (target <100ms)
   - Scrolling FPS: ___ (target 60 FPS)
   - 20-message stress test: PASS/FAIL

8. SUCCESS CRITERIA:
   - ✅ All 10 messageStore unit tests passing
   - ✅ All 3 integration tests passing
   - ✅ Both performance tests passing (especially <200ms)
   - ✅ No duplicate messages after optimistic UI sync
   - ✅ Messages display in correct order

9. COMMIT MESSAGE:
    ```
    feat(messaging): implement real-time messaging with tests

    - messageStore with optimistic UI
    - Real-time Firestore listeners
    - Read receipts and typing indicators
    - User presence tracking
    - Unit tests (10/10 passing)
    - Integration tests (3/3 passing)
    - Performance tests (2/2 passing)

    Performance: Message delivery 150ms (target <200ms) ✅
    Tests: 15/15 passing ✅
    ```

IMPORTANT:
- Message delivery <200ms is a RUBRIC REQUIREMENT - must pass
- Follow optimistic UI pattern exactly to avoid duplicates
- Reference 03-messaging-infrastructure.md Section 7 for common pitfalls
- Test with multiple devices/emulators for real-time sync validation
- Performance metrics must be documented in PERFORMANCE.md
```

**Estimated time:** 7-9 hours

---

## PR #4: Offline Support + Persistence

### Context Files to Read:
```
1. /docs/plans/03-messaging-infrastructure.md
   - Section 3: Offline-First Architecture (how react-native-firebase handles offline)
   - Section 5: Poor Network Handling
   - Section 7: Common Pitfalls (offline errors)

2. /docs/plans/08-implementation-resilience.md
   - PR #4 section (once created)

3. /docs/plans/05-rubric-alignment.md
   - Section 1: Offline scenarios (7 required tests)
```

### Prompt for Coding Agent:

```
You are implementing PR #4: Offline Support + Persistence for the MessageAI app.

CONTEXT FILES (read these first):
- /docs/plans/03-messaging-infrastructure.md (Sections 3, 5, 7 - Offline patterns, pitfalls)
- /docs/plans/08-implementation-resilience.md (PR #4 section - implementation + tests)
- /docs/plans/05-rubric-alignment.md (Section 1 - 7 offline scenarios for rubric)

DEPENDENCIES:
- ✅ PR #1, #2, #3 must be complete (messaging foundation working)

TASK:
Enhance messaging with offline-first architecture and validate all offline scenarios:

1. ENHANCED FIRESTORE CONFIGURATION:
   - Update lib/firebase/config.ts:
     * Enable offline persistence
     * Set cacheSizeBytes to UNLIMITED
     * Add network state monitoring

2. OFFLINE MESSAGE QUEUE:
   - Enhance messageStore sendMessage:
     * Queue messages when offline (Firestore handles automatically)
     * Track pending messages with tempId
     * Handle network errors gracefully
     * Don't mark as failed if network error (will auto-retry)

3. NETWORK MONITORING:
   - Create useNetworkStatus hook (lib/hooks/useNetworkStatus.ts)
   - Track: isConnected, networkType, isInternetReachable
   - Log network state changes

4. ENHANCED CONNECTION STATUS:
   - Update ConnectionStatus component:
     * Show "No connection - messages will sync when online"
     * Show "Connected - syncing messages" when reconnecting
     * Different colors for offline (orange) vs syncing (green)

5. TEST IMPLEMENTATION (CRITICAL - RUBRIC REQUIREMENT):

   7 Offline Scenario Tests (__tests__/integration/offline.test.ts):

   Scenario 1: Send messages while offline
   - Turn off network
   - Send 5 messages
   - Verify status = "sending"
   - Turn on network
   - ✅ All 5 messages sync within 1 second
   - ✅ Status changes to "sent"

   Scenario 2: Receive messages while offline
   - Device A sends message
   - Device B offline
   - Device B turns on network
   - ✅ Message appears immediately

   Scenario 3: Read receipts while offline
   - Device A sends message
   - Device B offline, opens chat (cached message)
   - Device B turns on network
   - ✅ Read receipt syncs to Device A

   Scenario 4: Create chat while offline
   - Turn off network
   - Start new chat, send message
   - ✅ Queues locally
   - Turn on network
   - ✅ Chat and message sync

   Scenario 5: Poor network (slow 3G)
   - Simulate slow network
   - Send 10 messages rapidly
   - ✅ All queue and deliver in order
   - ✅ No duplicates

   Scenario 6: App backgrounded while offline
   - Send message offline
   - Background app
   - Turn on network
   - Return to app
   - ✅ Message syncs automatically

   Scenario 7: Force quit while offline
   - Send 3 messages offline
   - Force quit app
   - Turn on network
   - Relaunch app
   - ✅ Messages still queued and sync

   Performance test:
   - Offline sync after reconnection <1 second ⚠️ RUBRIC REQUIREMENT

6. VERIFICATION:
   ```bash
   npm test -- __tests__/integration/offline.test.ts
   ```

   Manual verification (MUST TEST ALL 7 SCENARIOS):
   - Follow each scenario exactly as described
   - Document pass/fail for each
   - Measure and record offline sync time

7. OFFLINE TESTING DOCUMENT:
   Create docs/OFFLINE_TESTING.md with results:
   - Scenario 1: PASS/FAIL - Notes
   - Scenario 2: PASS/FAIL - Notes
   - ... (all 7 scenarios)
   - Offline sync performance: ___ms (target <1000ms)

8. SUCCESS CRITERIA:
   - ✅ All 7 offline scenario tests passing
   - ✅ Offline sync performance <1 second
   - ✅ No duplicate messages after sync
   - ✅ Message order preserved
   - ✅ Connection status UI works correctly

9. COMMIT MESSAGE:
    ```
    feat(offline): implement offline support with tests

    - Enhanced Firestore offline configuration
    - Message queue with automatic retry
    - Network status monitoring
    - Enhanced connection status UI
    - 7 offline scenario tests (7/7 passing)

    Performance: Offline sync 800ms (target <1s) ✅
    Tests: 7/7 passing ✅
    Rubric: All offline requirements met ✅
    ```

IMPORTANT:
- All 7 offline scenarios are RUBRIC REQUIREMENTS - must pass
- Offline sync <1 second is a performance requirement
- Test on real devices, not just emulators (network simulation more realistic)
- Reference 03-messaging-infrastructure.md Section 7 for pitfalls
- Do NOT skip manual testing - automated tests can't catch everything
```

**Estimated time:** 5-7 hours

---

## PR #5: Group Chat + Push Notifications

### Context Files to Read:
```
1. /docs/plans/02-technical-architecture.md
   - Section 3: Data Models (Chat model with group fields)
   - Section 6: Group Chat Delivery Tracking (readBy arrays)

2. /docs/plans/03-messaging-infrastructure.md
   - Section 6: Group Chat Delivery Tracking

3. /docs/plans/08-implementation-resilience.md
   - PR #5 section + MVP Checkpoint (once created)
```

### Prompt for Coding Agent:

```
You are implementing PR #5: Group Chat + Push Notifications for the MessageAI app.

CONTEXT FILES (read these first):
- /docs/plans/02-technical-architecture.md (Group chat data model)
- /docs/plans/03-messaging-infrastructure.md (Section 6 - Group delivery tracking)
- /docs/plans/08-implementation-resilience.md (PR #5 section with implementation + tests)

DEPENDENCIES:
- ✅ PR #1-4 must be complete (messaging with offline support working)

TASK:
Add group chat functionality with push notifications:

1. CREATE GROUP MODAL:
   - Create modal (app/(modal)/create-group.tsx)
   - Load all users from Firestore
   - Multi-select UI with checkboxes
   - Group name input (max 50 chars)
   - Create button (disabled until name + members selected)

2. GROUP CHAT CREATION:
   - Enhance chatStore.createGroupChat:
     * Create chat with type='group'
     * Add all participants
     * Set groupName and createdBy
     * Initialize empty unreadCount for all participants

3. GROUP CHAT HEADER:
   - Create GroupChatHeader component (components/chat/GroupChatHeader.tsx)
   - Show: group name, member count, online count
   - Tap to view member list modal
   - Member list shows: name, online/offline status (green/gray dot)
   - Subscribe to all participants' online status

4. GROUP MESSAGE HANDLING:
   - Update messageStore to handle group chats:
     * Read receipts: readBy array tracks all who read
     * Unread counts: increment for all participants except sender
     * Display: "Read by X/Y" status

5. PUSH NOTIFICATIONS:

   a) Client setup (lib/notifications/setup.ts):
      - Request notification permission
      - Get FCM token
      - Save token to user document in Firestore
      - Listen for token refresh
      - Handle foreground messages
      - Set background message handler

   b) Cloud Function (functions/src/notifications.ts):
      - Trigger on new message: /chats/{chatId}/messages/{messageId}
      - Get chat and participants
      - Get sender name
      - Get FCM tokens for recipients
      - Send multicast notification with:
        * Title: group name or sender name
        * Body: message text
        * Data: chatId, messageId, type=new_message
      - Handle APNS (iOS) and Android separately

6. TEST IMPLEMENTATION:

   a) Group chat integration tests (__tests__/integration/groupchat.test.tsx):
      - Create group with 3 participants (1 test)
      - Send message to group (1 test)
      - All participants receive message (1 test)
      - Read receipts track all readers (1 test)
      - Unread counts update correctly (1 test)

   b) Push notification tests (manual - document in checklist):
      - Notification received on iOS
      - Notification received on Android
      - Tapping notification opens correct chat
      - Notification shows sender name and preview
      - Notification works in foreground
      - Notification works in background

7. VERIFICATION:
   ```bash
   npm test -- __tests__/integration/groupchat.test.tsx

   # Deploy Cloud Function
   cd functions
   npm run deploy
   ```

   Manual verification:
   - Create group with 3+ members
   - Send messages in group
   - Verify all members receive in real-time
   - Check read receipts show correct count
   - Verify unread badges update
   - Test push notifications on both platforms
   - Tap notification and verify it opens correct chat

8. MVP CHECKPOINT:
   After PR #5, validate ALL 11 MVP requirements (from 05-rubric-alignment.md):

   Core Messaging:
   - ✅ One-on-one messaging works
   - ✅ Group chat works
   - ✅ Real-time sync <200ms
   - ✅ Offline support (7 scenarios pass)

   User Features:
   - ✅ User authentication
   - ✅ User profiles
   - ✅ User presence (online/offline)

   UI/UX:
   - ✅ Cross-platform (iOS + Android)
   - ✅ Responsive UI (60 FPS)

   Infrastructure:
   - ✅ Push notifications
   - ✅ Persistent storage

   Document MVP checkpoint results in docs/MVP_CHECKPOINT.md

9. SUCCESS CRITERIA:
   - ✅ All 5 group chat integration tests passing
   - ✅ Push notifications work on iOS and Android
   - ✅ Group member list shows online status
   - ✅ Read receipts work in groups
   - ✅ ALL 11 MVP REQUIREMENTS COMPLETE ⚠️

10. COMMIT MESSAGE:
    ```
    feat(groups): implement group chat and push notifications

    - Group chat creation with member selection
    - Group chat header with member list and online status
    - Read receipts for groups (readBy tracking)
    - Push notifications (FCM) for iOS and Android
    - Cloud Function for notification delivery
    - Integration tests (5/5 passing)

    Tests: 5/5 passing ✅
    MVP Checkpoint: 11/11 requirements complete ✅
    ```

IMPORTANT:
- Group chat + push notifications complete the MVP
- Run full MVP validation checklist before continuing
- Test push notifications on real devices (not emulators)
- Firebase Cloud Functions require billing enabled (Blaze plan)
- Document FCM token management for debugging
```

**Estimated time:** 5-6 hours

---

## PR #6-8: AI Features (Calendar, Decision, Priority, RSVP, Deadline)

### Context Files to Read:
```
1. /docs/plans/01-messageai-prd.md
   - Section 4: AI Features (all 5 required + 1 advanced)
   - Persona pain points (what AI solves)

2. /docs/plans/02-technical-architecture.md
   - Section 3: AI-Specific Types (CalendarEvent, Deadline, RSVP)
   - AI Stack details

3. /docs/plans/09-implementation-ai-features.md
   - Complete file (all 3 PRs + accuracy tests)

4. /docs/plans/05-rubric-alignment.md
   - Section 3: AI Features Implementation (accuracy >90% requirement)
```

### Prompt for Coding Agent:

```
You are implementing PR #6-8: AI Features for the MessageAI app.

CONTEXT FILES (read these first):
- /docs/plans/01-messageai-prd.md (Section 4 - AI requirements for Busy Parent persona)
- /docs/plans/02-technical-architecture.md (AI types, AI stack)
- /docs/plans/09-implementation-ai-features.md (Complete implementation + accuracy tests)
- /docs/plans/05-rubric-alignment.md (Section 3 - >90% accuracy requirement)

DEPENDENCIES:
- ✅ PR #1-5 must be complete (MVP working)
- ⚠️ OpenAI API key required (set as Firebase secret)

TASK:
Implement all 5 required AI features with >90% accuracy validation:

PR #6: AI Infrastructure + Calendar Extraction

1. CLOUD FUNCTIONS SETUP:
   - Initialize Firebase Functions (TypeScript)
   - Install dependencies: openai, firebase-functions, firebase-admin
   - Set OpenAI API key as secret:
     ```bash
     firebase functions:secrets:set OPENAI_API_KEY
     ```

2. CALENDAR EXTRACTION FUNCTION:
   - Create functions/src/ai/calendar.ts
   - Use GPT-4 Turbo with function calling
   - Extract: event, date, time, location, confidence
   - Return JSON array of CalendarEvent[]

3. CLIENT-SIDE AI SERVICE:
   - Create lib/ai/calendar.ts
   - Function: extractCalendarEvents(messageText)
   - Call Cloud Function via httpsCallable
   - Handle errors gracefully

4. DEADLINES TAB UI:
   - Update app/(tabs)/deadlines.tsx
   - Query all messages with aiExtraction.calendarEvents
   - Display in card format with date, time, location
   - Show low-confidence badge if confidence <0.8
   - Sort by date ascending

5. AUTO-EXTRACTION ON MESSAGE SEND:
   - Enhance messageStore.sendMessage
   - After message created, trigger AI extraction asynchronously
   - Update message document with aiExtraction field
   - Don't block user if AI fails

PR #7: Decision Summarization + Priority Detection

6. DECISION SUMMARIZATION FUNCTION:
   - Create functions/src/ai/decision.ts
   - Use GPT-4 with JSON mode
   - Summarize conversation thread into key decision
   - Identify: decision, participants, timestamp

7. PRIORITY DETECTION FUNCTION:
   - Create functions/src/ai/priority.ts
   - Classify message as: high, medium, low priority
   - High indicators: urgent, ASAP, deadline, important
   - Return: priority + confidence score

8. UI ENHANCEMENTS:
   - Add priority badge to messages (red=high, yellow=medium)
   - Add "Summarize" button for group chats (20+ messages)
   - Show decision summary in modal

PR #8: RSVP Tracking + Deadline Extraction

9. RSVP TRACKING FUNCTION:
   - Create functions/src/ai/rsvp.ts
   - Detect RSVP requests in messages
   - Track responses: yes, no, maybe
   - Aggregate counts
   - Return: event, responses, summary

10. DEADLINE EXTRACTION FUNCTION:
    - Create functions/src/ai/deadline.ts
    - Extract tasks with due dates
    - Prioritize by urgency
    - Return: task, dueDate, priority, reminder

11. RSVP UI:
    - Show RSVP summary in message bubble
    - Display: "5 yes, 2 no, 3 maybe, 2 no response"
    - Allow user to respond with quick actions

12. DEADLINE REMINDERS:
    - Enhance Deadlines tab to show tasks with due dates
    - Sort by due date (urgent first)
    - Show countdown: "Due in 2 days"
    - Mark complete checkbox

TEST IMPLEMENTATION (CRITICAL - ACCURACY REQUIREMENT):

13. ACCURACY TESTS (⚠️ MUST ACHIEVE >90% FOR RUBRIC):

    Create test dataset (lib/ai/__tests__/testCases.ts):
    - 20 messages for calendar extraction
    - 20 messages for priority detection
    - 20 messages for RSVP tracking
    - 20 messages for deadline extraction
    - 20 conversation threads for decision summarization

    Accuracy tests (__tests__/accuracy/ai.test.ts):

    For EACH AI feature:
    a) Run on all 20 test cases
    b) Compare to expected output
    c) Calculate accuracy: (correct / total) * 100
    d) ✅ MUST BE >90% to pass

    Example:
    ```typescript
    describe('Calendar Extraction Accuracy', () => {
      it('should achieve >90% accuracy on test dataset', async () => {
        let correct = 0;

        for (const testCase of CALENDAR_TEST_CASES) {
          const result = await extractCalendarEvents(testCase.input);

          if (matchesExpected(result, testCase.expected)) {
            correct++;
          }
        }

        const accuracy = (correct / CALENDAR_TEST_CASES.length) * 100;
        console.log(`Calendar accuracy: ${accuracy}%`);

        expect(accuracy).toBeGreaterThanOrEqual(90);
      });
    });
    ```

14. PERFORMANCE TESTS:
    - Each AI call must complete in <2 seconds ⚠️ RUBRIC REQUIREMENT
    - Test with slow network simulation
    - Show loading states in UI

15. INTEGRATION TESTS:
    - Send message with calendar event → verify extraction
    - Send urgent message → verify priority=high
    - Send RSVP request → verify tracking
    - Send message with deadline → verify extraction
    - Have conversation → verify decision summary

VERIFICATION:

```bash
# Accuracy tests (MUST PASS)
npm test -- __tests__/accuracy/ai.test.ts

# Integration tests
npm test -- __tests__/integration/ai.test.tsx

# Performance tests
npm test -- __tests__/performance/ai.test.ts

# Deploy Cloud Functions
cd functions
npm run deploy
```

Manual verification:
- Send test messages for each AI feature
- Verify extractions appear in UI
- Check accuracy manually with edge cases
- Verify AI processing time <2s
- Test loading states
- Test error handling (API failures)

ACCURACY DOCUMENTATION:

Create docs/AI_ACCURACY_REPORT.md:
```markdown
# AI Feature Accuracy Report

## Test Results

### Calendar Extraction
- Test cases: 20
- Correct: __
- Accuracy: __% (target >90%)
- Status: PASS/FAIL

### Decision Summarization
- Test cases: 20
- Correct: __
- Accuracy: __% (target >90%)
- Status: PASS/FAIL

[... for all 5 features]

## Performance

### AI Processing Time
- Calendar: __ms (target <2000ms)
- Decision: __ms (target <2000ms)
[... for all features]

## Edge Cases Tested
- Ambiguous dates (next Tuesday vs this Tuesday)
- Multiple events in one message
- Non-English messages (if applicable)
- Very long messages (>500 words)
- Messages with no extractable data
```

SUCCESS CRITERIA:
- ✅ All 5 AI features implemented
- ✅ Calendar extraction >90% accuracy
- ✅ Decision summarization >90% accuracy
- ✅ Priority detection >90% accuracy
- ✅ RSVP tracking >90% accuracy
- ✅ Deadline extraction >90% accuracy
- ✅ All AI calls <2 seconds
- ✅ UI shows loading states
- ✅ Error handling works

COMMIT MESSAGE:
```
feat(ai): implement 5 AI features with accuracy validation

PR #6: AI Infrastructure + Calendar Extraction
- Cloud Functions setup with OpenAI GPT-4
- Calendar extraction with >90% accuracy
- Deadlines tab UI

PR #7: Decision Summarization + Priority Detection
- Decision summarization with conversation threading
- Priority detection (high/medium/low)
- Priority badges in UI

PR #8: RSVP Tracking + Deadline Extraction
- RSVP request detection and response tracking
- Deadline extraction with reminders
- Enhanced Deadlines tab

Accuracy Results:
- Calendar: 95% (20/21 test cases)
- Decision: 92% (18/20 test cases)
- Priority: 94% (19/20 test cases)
- RSVP: 93% (19/20 test cases)
- Deadline: 96% (20/21 test cases)

Performance: All features <2s ✅
Tests: 25/25 accuracy + 5/5 integration + 5/5 performance ✅
Rubric: All AI requirements met ✅
```

IMPORTANT:
- >90% accuracy is NON-NEGOTIABLE for rubric
- If accuracy <90%, refine prompts and retest
- Use GPT-4 Turbo (not GPT-3.5) for better accuracy
- Test with real-world messy messages, not just clean examples
- Document all edge cases that fail
- OpenAI API costs money - use test mode efficiently
```

**Estimated time:** 12-15 hours (4-5h per PR)

---

## PR #9-11: Advanced AI + Performance + Polish

### Context Files to Read:
```
1. /docs/plans/01-messageai-prd.md
   - Section 4.2: Advanced AI Feature (Proactive Assistant)

2. /docs/plans/10-implementation-advanced.md
   - Complete file (PR #9-11 implementation + tests)

3. /docs/plans/05-rubric-alignment.md
   - Complete file (final rubric validation)
```

### Prompt for Coding Agent:

```
You are implementing PR #9-11: Advanced AI + Performance Optimization + Final Polish.

CONTEXT FILES (read these first):
- /docs/plans/01-messageai-prd.md (Section 4.2 - Proactive Assistant requirements)
- /docs/plans/10-implementation-advanced.md (Complete implementation guide + tests)
- /docs/plans/05-rubric-alignment.md (COMPLETE FILE - final validation checklist)

DEPENDENCIES:
- ✅ PR #1-8 must be complete (MVP + 5 AI features working)

TASK:

PR #9: Proactive Assistant (Advanced AI with LangChain)

1. LANGCHAIN SETUP:
   - Install: langchain, @langchain/openai
   - Create vector store for RAG (conversation history)
   - Embed past conversations for context retrieval

2. PROACTIVE ASSISTANT FUNCTION:
   - Create functions/src/ai/proactive.ts
   - Use LangChain with:
     * Conversation history retrieval (RAG)
     * Conflict detection (overlapping calendar events)
     * Alternative suggestion (reschedule options)
   - Return: conflict detected, alternatives, reasoning

3. ASSISTANT TAB UI:
   - Update app/(tabs)/ai-assistant.tsx
   - Show proactive insights:
     * "You have overlapping events on Friday"
     * Suggested alternatives with reasoning
   - Manual trigger: "Analyze my schedule"
   - Background trigger: On new calendar event

4. TESTS:
   - Proactive Assistant accuracy tests (>90%)
   - LangChain chain execution tests
   - RAG retrieval tests (correct context)
   - Conflict detection tests (true positives/negatives)

PR #10A: Performance Optimization

5. LAUNCH OPTIMIZATION:
   - Code splitting with dynamic imports
   - Lazy load non-critical screens
   - Optimize image loading (blurhash)
   - Reduce initial bundle size

6. SCROLLING OPTIMIZATION:
   - Use getItemLayout for FlashList
   - Implement removeClippedSubviews
   - Memoize components
   - Profile with React DevTools

7. NETWORK OPTIMIZATION:
   - Batch Firestore reads
   - Use composite indexes
   - Optimize query limits
   - Cache frequently accessed data

8. PERFORMANCE BENCHMARKS:
   Run and document ALL performance targets:
   - App launch to chat screen: <2s
   - Message delivery: <200ms
   - Offline sync: <1s
   - Scrolling 1000+ messages: 60 FPS
   - AI simple commands: <2s
   - Advanced AI: <15s
   - Typing indicator: <100ms
   - Presence update: <100ms

PR #10B: Testing & Bug Fixes

9. E2E APP FLOW TESTS:
   Create __tests__/e2e/appFlow.test.ts:
   - Complete user journey:
     * Sign up → Login → Create chat → Send messages → Receive → Offline → Online → AI extraction → Logout
   - Test all critical paths
   - Verify no regressions

10. BUG FIXES:
    - Review all TODO comments
    - Fix TypeScript any types
    - Handle all edge cases
    - Add error boundaries

PR #11A: Bonus Features (for extra points)

11. POLISH FEATURES:
    - Dark mode (bonus +2 points)
    - Message reactions (bonus +1 point)
    - Voice messages (bonus +2 points)
    - Link previews (bonus +1 point)
    - Read receipts with names (bonus +1 point)

12. ANIMATIONS:
    - Message send animation
    - Typing indicator animation
    - Connection status slide-in
    - Tab transitions

PR #11B: Documentation & Demo

13. DOCUMENTATION:
    Create comprehensive README.md:
    - Project overview
    - Features list
    - Tech stack
    - Setup instructions
    - Environment variables
    - Firebase configuration
    - Running the app
    - Testing
    - Troubleshooting

14. PERFORMANCE.md:
    Document ALL performance measurements with:
    - Measurement method
    - Actual results
    - Target vs actual
    - Screenshots/screen recordings

15. ARCHITECTURE DIAGRAMS:
    Create in docs/architecture/:
    - System architecture diagram
    - Data flow diagram
    - Component hierarchy diagram
    (Use draw.io, Excalidraw, or Mermaid)

16. DEMO VIDEO:
    Record 5-7 minute demo showing:
    - User signup/login
    - Send/receive messages (real-time)
    - Offline mode (turn off WiFi, send, turn on, sync)
    - Group chat with 3+ members
    - All 5 AI features working
    - Proactive Assistant
    - Both iOS and Android (side-by-side if possible)
    - Performance (smooth scrolling, fast delivery)

17. PERSONA BRAINLIFT:
    Create PERSONA_BRAINLIFT.md (1-page deliverable):
    - Busy Parent persona description
    - 5 pain points
    - How MessageAI solves each
    - AI features that address specific pain points
    - Screenshots of solutions

FINAL VALIDATION (CRITICAL):

18. COMPLETE RUBRIC CHECKLIST:
    Go through 05-rubric-alignment.md line by line:

    Section 1: Core Messaging (35 points):
    - ✅ All 11 MVP requirements
    - ✅ Real-time delivery <200ms
    - ✅ Offline 7 scenarios
    - ✅ Group chat works
    - ✅ Push notifications work

    Section 2: Mobile App Quality (20 points):
    - ✅ Cross-platform
    - ✅ 60 FPS scrolling
    - ✅ <2s app launch
    - ✅ Responsive UI
    - ✅ Error handling

    Section 3: AI Features (30 points):
    - ✅ Calendar: >90% accuracy
    - ✅ Decision: >90% accuracy
    - ✅ Priority: >90% accuracy
    - ✅ RSVP: >90% accuracy
    - ✅ Deadline: >90% accuracy
    - ✅ Proactive: >90% accuracy
    - ✅ All <2s (simple), <15s (advanced)

    Section 4: Technical Implementation (10 points):
    - ✅ Firebase security rules
    - ✅ TypeScript types
    - ✅ Code quality
    - ✅ Architecture diagrams

    Section 5: Documentation (5 points):
    - ✅ README
    - ✅ PERFORMANCE.md
    - ✅ PERSONA_BRAINLIFT.md
    - ✅ Demo video

    Bonus Points (up to +10):
    - Dark mode: +2
    - Voice messages: +2
    - Extra polish: +1-3
    - Advanced features: +1-3

    TARGET: 100/100 base + 5-10 bonus = 105-110 total

VERIFICATION:

```bash
# All tests
npm test

# E2E tests
npm test -- __tests__/e2e/

# Performance validation
npm test -- __tests__/performance/

# Type checking
npx tsc --noEmit

# Build
npx expo prebuild
npx expo run:ios --configuration Release
npx expo run:android --variant release
```

SUCCESS CRITERIA:
- ✅ All tests passing (85+ tests total)
- ✅ Proactive Assistant >90% accuracy
- ✅ All performance targets met
- ✅ E2E app flow works perfectly
- ✅ No TypeScript errors
- ✅ README complete
- ✅ Demo video recorded
- ✅ 100/100 on rubric (minimum)
- ✅ Bonus features implemented (+5-10)

COMMIT MESSAGE:
```
feat(advanced): proactive AI, performance optimization, final polish

PR #9: Proactive Assistant
- LangChain integration with RAG
- Conflict detection and alternative suggestions
- Accuracy: 94% (target >90%) ✅

PR #10A: Performance Optimization
- App launch: 1.6s (target <2s) ✅
- Code splitting and lazy loading
- All performance targets met

PR #10B: Testing & Bug Fixes
- E2E app flow tests (5/5 passing)
- Fixed 15 edge cases
- Added error boundaries

PR #11A: Bonus Features
- Dark mode (+2 points)
- Voice messages (+2 points)
- Link previews (+1 point)
- Message reactions (+1 point)
Total bonus: +6 points

PR #11B: Documentation & Demo
- Comprehensive README
- PERFORMANCE.md with all measurements
- PERSONA_BRAINLIFT.md
- Demo video (6 minutes, iOS + Android)
- Architecture diagrams

Final Score: 106/100 (100 base + 6 bonus) ✅
All Tests: 87/87 passing ✅
```

IMPORTANT:
- This is the final sprint - every detail matters for rubric
- Record performance metrics meticulously
- Demo video quality affects scoring
- Ensure both iOS and Android build in Release mode
- Test on real devices for demo video
- Review rubric checklist 3 times before submission
```

**Estimated time:** 17-23 hours

---

## Summary Table

| PR # | Title | Context Files | Key Tests | Time | Rubric Impact |
|------|-------|---------------|-----------|------|---------------|
| #1 | Auth | 01, 02, 06 | 13 tests (auth flow) | 2-3h | Authentication requirement |
| #2 | UI/Nav | 01, 02, 07 | 7 tests (chatStore) | 4-5h | UI/UX quality |
| #3 | Messaging | 02, 03, 07 | 15 tests (real-time) | 7-9h | **<200ms requirement** |
| #4 | Offline | 03, 05, 08 | 7 scenarios | 5-7h | **Offline requirement** |
| #5 | Groups | 02, 03, 08 | 5 tests + MVP | 5-6h | **MVP completion** |
| #6-8 | AI Features | 01, 02, 05, 09 | 25 accuracy tests | 12-15h | **>90% accuracy** |
| #9-11 | Advanced | 01, 05, 10 | E2E + performance | 17-23h | **100/100 target** |

**Total: 52-68 hours over 4 days**

---

## Usage Instructions

For each PR, copy the prompt above and provide it to your coding agent with:

```
Read the following context files:
[list from prompt]

Then implement according to this task description:
[task section from prompt]

Ensure all tests pass before considering complete:
[test section from prompt]

Verification criteria:
[verification section from prompt]
```

The coding agent should have access to the docs/plans/ directory to read all referenced files.
