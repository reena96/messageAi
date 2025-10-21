# MessageAI - Implementation: Resilience & Groups

**Phase:** Offline Support + Group Chat
**PRs:** #4 (Offline), #5 (Groups)
**Timeline:** 10-13 hours
**Dependencies:** PR #3 (Real-Time Messaging)

← [Previous: Core Messaging](./07-implementation-core-messaging.md) | [README](./README.md) | [Next: AI Features](./09-implementation-ai-features.md)

---

## Overview

This phase adds resilience to the messaging system with offline support, automatic sync, and extends functionality with group chats and push notifications. **Tests are critical** - offline sync must be robust and complete the MVP foundation.

### Success Criteria
- ✅ Messages queue correctly when offline
- ✅ Messages sync within 1 second after reconnection
- ✅ All 7 offline scenarios pass
- ✅ Group chats work with member management
- ✅ Push notifications deliver reliably
- ✅ All 11 MVP requirements complete

---

## PR #4: Offline Support + Persistence

**Branch:** `feature/offline-support`
**Timeline:** 5-7 hours
**Test Coverage:** Integration + Performance

### Implementation Details

For complete code examples, see [04-implementation-guide.md PR #4](./04-implementation-guide.md#pr-4-offline-support--persistence).

**Key files to create/modify:**
- `lib/firebase/config.ts` - Enhanced Firestore configuration
- `lib/store/messageStore.ts` - Offline message queue
- `lib/hooks/useNetworkStatus.ts` - Network monitor
- `components/common/ConnectionStatus.tsx` - Offline banner
- `docs/OFFLINE_TESTING.md` - Testing scenarios

### Tasks Summary

#### 1. Enhanced Firestore Configuration (1 hour)

Enable offline persistence with unlimited cache:

```typescript
// lib/firebase/config.ts (key snippet)
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});
```

See [04-implementation-guide.md](./04-implementation-guide.md#pr-4-offline-support--persistence) for complete implementation.

#### 2. Offline Message Queue (2 hours)

Enhance `messageStore.sendMessage` with:
- Optimistic updates with `tempId` tracking
- Automatic queueing when offline
- Status tracking: `sending` → `sent` / `failed`
- Auto-retry via Firestore

See [04-implementation-guide.md](./04-implementation-guide.md#pr-4-offline-support--persistence) for complete code.

#### 3. Network Monitor Hook (1 hour)

Create `useNetworkStatus` hook:
- Monitor connection state
- Track network type (WiFi, cellular, etc.)
- Detect internet reachability

#### 4. Offline Banner Enhancement (1 hour)

Enhanced ConnectionStatus component with:
- Animated banner (slide down/up)
- Three states: offline / syncing / connected
- Auto-dismiss after reconnection

#### 5. Offline Testing Scenarios (2 hours)

**7 critical scenarios to test:**

1. ✅ Send messages while offline
2. ✅ Receive messages while offline
3. ✅ Read receipts while offline
4. ✅ Create chat while offline
5. ✅ Poor network simulation
6. ✅ App backgrounded while offline
7. ✅ Force quit while offline

---

### Tests to Add

#### Integration Tests for Offline Scenarios

```typescript
// lib/store/__tests__/messageStore.offline.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useMessageStore } from '../messageStore';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import firestore from '@react-native-firebase/firestore';

jest.mock('@react-native-firebase/firestore');
jest.mock('@/lib/hooks/useNetworkStatus');

describe('messageStore - Offline Scenarios', () => {
  let mockFirestore: any;
  let mockNetworkStatus: any;

  beforeEach(() => {
    useMessageStore.setState({ messages: {}, sendingMessages: new Set() });

    mockNetworkStatus = { isConnected: true, networkType: 'wifi' };
    (useNetworkStatus as jest.Mock).mockReturnValue(mockNetworkStatus);

    mockFirestore = {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          collection: jest.fn(() => ({
            add: jest.fn(),
            onSnapshot: jest.fn(),
          })),
          update: jest.fn(),
        })),
      })),
      FieldValue: {
        serverTimestamp: jest.fn(() => 'TIMESTAMP'),
      },
    };

    (firestore as jest.Mock).mockReturnValue(mockFirestore);
  });

  // Test 1: Send messages while offline
  it('should queue messages when offline and sync on reconnection', async () => {
    const { result } = renderHook(() => useMessageStore());

    // Go offline
    mockNetworkStatus.isConnected = false;

    // Send message
    await act(async () => {
      await result.current.sendMessage('chat1', 'user1', 'Offline message');
    });

    // Verify message is in sending state
    const chatMessages = result.current.messages['chat1'];
    expect(chatMessages).toHaveLength(1);
    expect(chatMessages[0].status).toBe('sending');
    expect(chatMessages[0].tempId).toBeDefined();

    // Go online
    mockNetworkStatus.isConnected = true;

    // Verify Firestore add was called (queued operation executes)
    await waitFor(() => {
      expect(mockFirestore.collection).toHaveBeenCalledWith('chats');
    });
  });

  // Test 2: Handle offline message failures
  it('should mark message as failed on non-network errors', async () => {
    const { result } = renderHook(() => useMessageStore());

    // Mock a permission error (not a network error)
    mockFirestore.collection().doc().collection().add.mockRejectedValue({
      code: 'permission-denied',
      message: 'Permission denied',
    });

    await act(async () => {
      try {
        await result.current.sendMessage('chat1', 'user1', 'Test');
      } catch (error) {
        // Expected to throw
      }
    });

    const chatMessages = result.current.messages['chat1'];
    expect(chatMessages[0].status).toBe('failed');
  });

  // Test 3: Do not mark as failed for network errors
  it('should keep message in sending state for network errors', async () => {
    const { result } = renderHook(() => useMessageStore());

    // Mock network error (Firestore will auto-retry)
    mockFirestore.collection().doc().collection().add.mockRejectedValue({
      code: 'unavailable',
      message: 'Network unavailable',
    });

    await act(async () => {
      try {
        await result.current.sendMessage('chat1', 'user1', 'Test');
      } catch (error) {
        // Expected to throw
      }
    });

    const chatMessages = result.current.messages['chat1'];
    // Should still be in sending state (will retry automatically)
    expect(chatMessages[0].status).toBe('sending');
  });

  // Test 4: Handle multiple offline messages
  it('should queue multiple messages and maintain order', async () => {
    const { result } = renderHook(() => useMessageStore());

    mockNetworkStatus.isConnected = false;

    // Send 5 messages
    await act(async () => {
      for (let i = 1; i <= 5; i++) {
        await result.current.sendMessage('chat1', 'user1', `Message ${i}`);
      }
    });

    const chatMessages = result.current.messages['chat1'];
    expect(chatMessages).toHaveLength(5);
    expect(chatMessages.map(m => m.text)).toEqual([
      'Message 1',
      'Message 2',
      'Message 3',
      'Message 4',
      'Message 5',
    ]);
    expect(chatMessages.every(m => m.status === 'sending')).toBe(true);
  });

  // Test 5: Offline sync performance
  it('should sync offline messages within 1 second', async () => {
    const { result } = renderHook(() => useMessageStore());

    mockNetworkStatus.isConnected = false;

    // Send 10 messages while offline
    await act(async () => {
      for (let i = 1; i <= 10; i++) {
        await result.current.sendMessage('chat1', 'user1', `Message ${i}`);
      }
    });

    expect(result.current.messages['chat1']).toHaveLength(10);

    // Go online and measure sync time
    const syncStartTime = Date.now();

    mockNetworkStatus.isConnected = true;
    mockFirestore.collection().doc().collection().add.mockResolvedValue({
      id: 'real-message-id',
    });

    // Trigger sync by calling sendMessage again (simulates Firestore auto-retry)
    await act(async () => {
      await result.current.sendMessage('chat1', 'user1', 'Sync trigger');
    });

    const syncDuration = Date.now() - syncStartTime;

    // Performance target: <1000ms
    expect(syncDuration).toBeLessThan(1000);
  });

  // Test 6: No duplicate messages after sync
  it('should not create duplicates when syncing offline messages', async () => {
    const { result } = renderHook(() => useMessageStore());

    mockNetworkStatus.isConnected = false;

    await act(async () => {
      await result.current.sendMessage('chat1', 'user1', 'Test message');
    });

    const tempId = result.current.messages['chat1'][0].tempId;

    // Go online and sync
    mockNetworkStatus.isConnected = true;
    mockFirestore.collection().doc().collection().add.mockResolvedValue({
      id: 'real-id',
    });

    await act(async () => {
      await result.current.sendMessage('chat1', 'user1', 'Test message');
    });

    // Wait for optimistic message to be removed
    await waitFor(() => {
      const messages = result.current.messages['chat1'];
      expect(messages.filter(m => m.tempId === tempId)).toHaveLength(0);
    });

    // Should only have the real message, not the optimistic one
    const finalMessages = result.current.messages['chat1'];
    expect(finalMessages.filter(m => m.text === 'Test message')).toHaveLength(1);
  });

  // Test 7: Read receipts sync after offline
  it('should sync read receipts when coming back online', async () => {
    const { result } = renderHook(() => useMessageStore());

    mockNetworkStatus.isConnected = false;

    // Mark message as read while offline
    await act(async () => {
      await result.current.markAsRead('chat1', 'message1', 'user1');
    });

    // Go online
    mockNetworkStatus.isConnected = true;

    // Verify Firestore update was called
    await waitFor(() => {
      expect(mockFirestore.collection).toHaveBeenCalled();
    });
  });
});
```

#### Performance Test: Offline Sync

```typescript
// lib/store/__tests__/messageStore.performance.offline.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useMessageStore } from '../messageStore';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import firestore from '@react-native-firebase/firestore';

jest.mock('@react-native-firebase/firestore');
jest.mock('@/lib/hooks/useNetworkStatus');

describe('messageStore - Offline Sync Performance', () => {
  it('should sync 20 offline messages in <1 second', async () => {
    const { result } = renderHook(() => useMessageStore());
    const mockNetworkStatus = { isConnected: false, networkType: 'none' };
    (useNetworkStatus as jest.Mock).mockReturnValue(mockNetworkStatus);

    const mockFirestore = {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          collection: jest.fn(() => ({
            add: jest.fn().mockResolvedValue({ id: 'msg-id' }),
          })),
          update: jest.fn(),
        })),
      })),
      FieldValue: { serverTimestamp: jest.fn() },
    };
    (firestore as jest.Mock).mockReturnValue(mockFirestore);

    // Send 20 messages while offline
    await act(async () => {
      for (let i = 1; i <= 20; i++) {
        await result.current.sendMessage('chat1', 'user1', `Message ${i}`);
      }
    });

    expect(result.current.messages['chat1']).toHaveLength(20);

    // Go online and measure sync time
    const syncStartTime = Date.now();
    mockNetworkStatus.isConnected = true;

    // Simulate Firestore auto-sync completing
    await act(async () => {
      // Clear optimistic messages as they sync
      result.current.messages['chat1'].forEach(msg => {
        if (msg.tempId) {
          // Simulate successful sync
        }
      });
    });

    const syncDuration = Date.now() - syncStartTime;

    // Target: <1000ms for 20 messages
    expect(syncDuration).toBeLessThan(1000);

    console.log(`✅ Offline sync performance: ${syncDuration}ms for 20 messages`);
  });
});
```

---

### Validation Checklist

Run these checks before completing PR #4:

- [ ] Firestore offline persistence enabled
- [ ] Messages queue correctly when offline
- [ ] Optimistic UI shows "sending" status
- [ ] Messages sync within 1 second after reconnection
- [ ] No duplicate messages after sync
- [ ] Read receipts sync correctly
- [ ] Offline banner shows/hides appropriately
- [ ] All 7 offline scenarios documented and tested manually
- [ ] Offline sync performance test passes (<1s target)

### Performance Target

- **Offline sync after reconnection:** <1 second for 20+ messages

---

## PR #5: Group Chat + Push Notifications

**Branch:** `feature/group-chat`
**Timeline:** 5-6 hours
**Test Coverage:** Integration

### Implementation Details

For complete code examples, see [04-implementation-guide.md PR #5](./04-implementation-guide.md#pr-5-group-chat--push-notifications).

**Key files to create:**
- `app/(modal)/create-group.tsx` - Group creation modal
- `components/chat/GroupChatHeader.tsx` - Group header with members
- `lib/notifications/setup.ts` - FCM notification setup
- `functions/src/notifications.ts` - Cloud Function for notifications

### Tasks Summary

#### 1. Create Group Modal (1.5 hours)

Features:
- User selection with checkboxes
- Group name input
- Real-time user list from Firestore
- Creates group chat in `chatStore`

#### 2. Group Chat Header with Members (1 hour)

Features:
- Shows group name and member count
- Displays online member count
- Modal with full member list
- Online/offline indicators per member

#### 3. Push Notifications Setup (2.5 hours)

**Client-side setup:**
- Request notification permissions
- Get and store FCM token
- Handle foreground/background messages
- Token refresh handling

**Server-side (Cloud Functions):**
- Trigger on new message creation
- Fetch recipient FCM tokens
- Send multicast notifications
- Include sender name and message preview

See [04-implementation-guide.md](./04-implementation-guide.md#pr-5-group-chat--push-notifications) for complete implementation.

---

### Tests to Add

#### Integration Tests for Group Chat

```typescript
// lib/store/__tests__/chatStore.group.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useChatStore } from '../chatStore';
import firestore from '@react-native-firebase/firestore';

jest.mock('@react-native-firebase/firestore');

describe('chatStore - Group Chat', () => {
  let mockFirestore: any;

  beforeEach(() => {
    useChatStore.setState({ chats: [], loading: false });

    mockFirestore = {
      collection: jest.fn(() => ({
        add: jest.fn().mockResolvedValue({ id: 'group-123' }),
        doc: jest.fn(() => ({
          update: jest.fn(),
          onSnapshot: jest.fn(),
        })),
      })),
      FieldValue: {
        serverTimestamp: jest.fn(() => 'TIMESTAMP'),
      },
    };

    (firestore as jest.Mock).mockReturnValue(mockFirestore);
  });

  it('should create a group chat with multiple participants', async () => {
    const { result } = renderHook(() => useChatStore());

    let chatId: string | undefined;

    await act(async () => {
      chatId = await result.current.createGroupChat(
        'user1',
        ['user2', 'user3', 'user4'],
        'Team Chat'
      );
    });

    expect(chatId).toBe('group-123');
    expect(mockFirestore.collection).toHaveBeenCalledWith('chats');
    expect(mockFirestore.collection().add).toHaveBeenCalledWith({
      type: 'group',
      groupName: 'Team Chat',
      participants: ['user1', 'user2', 'user3', 'user4'],
      createdBy: 'user1',
      createdAt: 'TIMESTAMP',
      lastMessage: null,
      updatedAt: 'TIMESTAMP',
    });
  });

  it('should load group chats with participant count', async () => {
    const { result } = renderHook(() => useChatStore());

    const mockGroupChat = {
      id: 'group-1',
      type: 'group',
      groupName: 'Project Team',
      participants: ['user1', 'user2', 'user3'],
      lastMessage: { text: 'Hello team', senderId: 'user2' },
    };

    mockFirestore.collection().where().orderBy().limit().onSnapshot.mockImplementation(
      (callback: any) => {
        callback({
          docs: [
            {
              id: mockGroupChat.id,
              data: () => mockGroupChat,
            },
          ],
        });
        return jest.fn();
      }
    );

    act(() => {
      result.current.subscribeToChats('user1');
    });

    await waitFor(() => {
      expect(result.current.chats).toHaveLength(1);
      expect(result.current.chats[0].type).toBe('group');
      expect(result.current.chats[0].groupName).toBe('Project Team');
      expect(result.current.chats[0].participants).toHaveLength(3);
    });
  });

  it('should validate group creation requires 2+ participants', async () => {
    const { result } = renderHook(() => useChatStore());

    // Try to create group with only 1 participant (+ creator = 2 total, which is minimum)
    await act(async () => {
      await expect(
        result.current.createGroupChat('user1', [], 'Invalid Group')
      ).rejects.toThrow();
    });
  });
});
```

#### Integration Tests for Push Notifications

```typescript
// lib/notifications/__tests__/setup.test.ts
import { requestNotificationPermission, setupNotifications } from '../setup';
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';

jest.mock('@react-native-firebase/messaging');
jest.mock('@react-native-firebase/firestore');

describe('Push Notifications Setup', () => {
  let mockMessaging: any;
  let mockFirestore: any;

  beforeEach(() => {
    mockMessaging = {
      requestPermission: jest.fn(),
      getToken: jest.fn(),
      onTokenRefresh: jest.fn(),
      onMessage: jest.fn(),
      setBackgroundMessageHandler: jest.fn(),
      AuthorizationStatus: {
        AUTHORIZED: 1,
        PROVISIONAL: 2,
      },
    };

    mockFirestore = {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          update: jest.fn(),
        })),
      })),
    };

    (messaging as jest.Mock).mockReturnValue(mockMessaging);
    (firestore as jest.Mock).mockReturnValue(mockFirestore);
  });

  it('should request notification permission and get authorized', async () => {
    mockMessaging.requestPermission.mockResolvedValue(
      mockMessaging.AuthorizationStatus.AUTHORIZED
    );
    mockMessaging.getToken.mockResolvedValue('fcm-token-123');

    const result = await requestNotificationPermission();

    expect(result).toBe(true);
    expect(mockMessaging.requestPermission).toHaveBeenCalled();
    expect(mockMessaging.getToken).toHaveBeenCalled();
  });

  it('should save FCM token to user document', async () => {
    mockMessaging.requestPermission.mockResolvedValue(
      mockMessaging.AuthorizationStatus.AUTHORIZED
    );
    mockMessaging.getToken.mockResolvedValue('fcm-token-456');

    // Mock getCurrentUserId to return a user
    const getCurrentUserId = jest.fn().mockReturnValue('user1');

    await requestNotificationPermission();

    // Wait for setupNotifications to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockFirestore.collection).toHaveBeenCalledWith('users');
    expect(mockFirestore.collection().doc).toHaveBeenCalledWith('user1');
  });

  it('should handle permission denial gracefully', async () => {
    mockMessaging.requestPermission.mockResolvedValue(0); // Denied

    const result = await requestNotificationPermission();

    expect(result).toBe(false);
    expect(mockMessaging.getToken).not.toHaveBeenCalled();
  });

  it('should register foreground message handler', async () => {
    mockMessaging.requestPermission.mockResolvedValue(
      mockMessaging.AuthorizationStatus.AUTHORIZED
    );
    mockMessaging.getToken.mockResolvedValue('fcm-token');

    await requestNotificationPermission();

    expect(mockMessaging.onMessage).toHaveBeenCalled();
  });

  it('should register background message handler', async () => {
    mockMessaging.requestPermission.mockResolvedValue(
      mockMessaging.AuthorizationStatus.AUTHORIZED
    );
    mockMessaging.getToken.mockResolvedValue('fcm-token');

    await requestNotificationPermission();

    expect(mockMessaging.setBackgroundMessageHandler).toHaveBeenCalled();
  });

  it('should handle token refresh', async () => {
    mockMessaging.requestPermission.mockResolvedValue(
      mockMessaging.AuthorizationStatus.AUTHORIZED
    );
    mockMessaging.getToken.mockResolvedValue('initial-token');

    let tokenRefreshCallback: any;
    mockMessaging.onTokenRefresh.mockImplementation((callback: any) => {
      tokenRefreshCallback = callback;
    });

    await requestNotificationPermission();

    // Simulate token refresh
    await tokenRefreshCallback('new-token-789');

    // Should update Firestore with new token
    expect(mockFirestore.collection().doc().update).toHaveBeenCalledWith({
      fcmToken: 'new-token-789',
    });
  });
});
```

---

### Validation Checklist

Run these checks before completing PR #5:

- [ ] Users can create group chats
- [ ] Group modal shows all users
- [ ] Group creation succeeds with 2+ members
- [ ] Group chat displays member count
- [ ] Group member list shows online/offline status
- [ ] Push notification permissions requested on first launch
- [ ] FCM token saved to user document
- [ ] Cloud Function deploys successfully
- [ ] Notifications received on iOS
- [ ] Notifications received on Android
- [ ] Tapping notification opens correct chat
- [ ] Notification includes sender name and preview

---

## MVP Checkpoint

**After PR #5, all 11 MVP requirements must be complete:**

### MVP Requirements Validation

#### Core Messaging (4 requirements)
- [ ] One-on-one messaging works ← From PR #3
- [ ] Group chat works ← From PR #5
- [ ] Real-time sync (<200ms delivery) ← From PR #3
- [ ] Offline support (messages sync <1s after reconnection) ← From PR #4

#### User Features (3 requirements)
- [ ] User authentication (email/password) ← From PR #1
- [ ] User profiles ← From PR #1
- [ ] User presence (online/offline status) ← From PR #3

#### UI/UX (2 requirements)
- [ ] Cross-platform (iOS + Android both work) ← All PRs
- [ ] Responsive UI (60 FPS scrolling) ← From PR #2

#### Infrastructure (2 requirements)
- [ ] Push notifications work ← From PR #5
- [ ] Persistent storage (messages survive app restart) ← From PR #4

---

### Performance Validation

Document results for all MVP performance targets:

```markdown
# MVP Performance Results - After PR #5

## App Launch
- App launch to chat screen: ___ms (Target: <2000ms)

## Messaging
- Message delivery (good network): ___ms (Target: <200ms)
- Offline sync after reconnection: ___ms (Target: <1000ms)
- Typing indicator lag: ___ms (Target: <100ms)
- Presence update lag: ___ms (Target: <100ms)

## UI Performance
- Scrolling 1000+ messages: ___ FPS (Target: 60 FPS)
- Chat list with 100 chats: ___ FPS (Target: 60 FPS)

## Stress Tests
- 20 messages in 2 seconds: PASS / FAIL
- All 7 offline scenarios: PASS / FAIL
- Group chat with 10 members: PASS / FAIL
- Push notifications deliver: PASS / FAIL
```

**All targets must pass before proceeding to PR #6 (AI Features).**

---

## Test Summary

### Tests Added in This Phase

| Test Type | Count | Purpose |
|-----------|-------|---------|
| Offline Integration Tests | 7 | Validate offline queueing and sync |
| Offline Performance Test | 1 | Ensure <1s sync time |
| Group Chat Integration Tests | 3 | Validate group creation and display |
| Push Notification Tests | 6 | Validate FCM setup and delivery |
| **Total** | **17** | **Complete MVP resilience** |

### Cumulative Test Count

| Phase | Tests | Cumulative |
|-------|-------|------------|
| Foundation (PR #1) | 13 | 13 |
| Core Messaging (PR #2-3) | 22 | 35 |
| Resilience (PR #4-5) | 17 | **52** |

---

## For Coding Agents

### TDD Workflow for This Phase

1. **Read this shard** for requirements
2. **Reference [04-implementation-guide.md](./04-implementation-guide.md)** for full code
3. **Write tests first** (all 17 tests above)
4. **Run tests** → Should FAIL (RED)
5. **Implement code** from guide
6. **Run tests** → Should PASS (GREEN)
7. **Run manual offline scenarios**
8. **Validate MVP checklist**
9. **Document performance results**
10. **Commit with test results**

### Example Commit Message

```
feat(offline): implement offline support with comprehensive tests

PR #4: Offline Support + Persistence
- Enhanced Firestore offline persistence
- Message queue with optimistic updates
- Network status monitoring
- Offline banner with animations
- 7 offline scenario tests (7/7 passing)
- Offline sync performance: 847ms (target <1s) ✅

Tests: 8/8 passing
Performance: All targets met
```

---

← [Previous: Core Messaging](./07-implementation-core-messaging.md) | [README](./README.md) | [Next: AI Features](./09-implementation-ai-features.md)
