# MessageAI - Messaging Infrastructure Deep Dive

**Version:** 1.0
**Date:** January 20, 2025

← [Back to README](./README.md) | [Technical Architecture](./02-technical-architecture.md) | [Implementation Guide](./04-implementation-guide.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Real-Time Sync Patterns](#2-real-time-sync-patterns)
3. [Offline-First Architecture](#3-offline-first-architecture)
4. [Optimistic UI](#4-optimistic-ui)
5. [Poor Network Handling](#5-poor-network-handling)
6. [Group Chat Delivery Tracking](#6-group-chat-delivery-tracking)
7. [Common Pitfalls & Solutions](#7-common-pitfalls--solutions)

---

## 1. Overview

MessageAI uses Firebase Firestore with react-native-firebase for offline-first messaging. This document explains the patterns and implementation details.

📊 **Visual Diagrams:**
- **[Message Flow Diagrams](./diagrams/MessageFlow.md)** - Complete message lifecycle, real-time sync sequences, and optimistic UI patterns
- **[Offline-First Diagrams](./diagrams/OfflineFirst.md)** - Offline scenarios, network handling, and sync recovery flows

### Key Principles

1. **Offline-first:** App works without internet, syncs when connected
2. **Real-time:** Messages appear instantly via Firestore listeners
3. **Optimistic UI:** Show messages immediately before server confirmation
4. **Conflict resolution:** Last-write-wins with Firestore server timestamps
5. **Performance:** <200ms message delivery on good network

---

## 2. Real-Time Sync Patterns

### Firestore onSnapshot Listeners

**How it works:**
```typescript
// Subscribe to messages
const unsubscribe = firestore()
  .collection('chats')
  .doc(chatId)
  .collection('messages')
  .orderBy('timestamp', 'asc')
  .limit(50)
  .onSnapshot(
    (snapshot) => {
      // Handle updates
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMessages(messages);
    },
    (error) => {
      console.error('Listener error:', error);
    }
  );

// IMPORTANT: Cleanup
return () => unsubscribe();
```

**Key behaviors:**
- **Initial callback:** Receives all existing documents
- **Subsequent callbacks:** Only changed documents
- **Offline behavior:** Uses cached data, queues updates
- **Reconnection:** Automatically receives missed updates

### Listener Lifecycle Management

**Problem:** Memory leaks from unsubscribed listeners

**Solution:** Proper cleanup in useEffect

```typescript
useEffect(() => {
  if (!chatId) return;

  // Subscribe
  const unsubscribe = subscribeToMessages(chatId);

  // Cleanup on unmount or chatId change
  return () => {
    unsubscribe();
  };
}, [chatId]);
```

### Listener Performance

**Optimize queries:**
```typescript
// ✅ GOOD: Limit initial load, paginate later
.orderBy('timestamp', 'asc')
.limit(50)

// ❌ BAD: Load everything
.orderBy('timestamp', 'asc')
// No limit - could load thousands of messages
```

**Index requirements:**
```json
{
  "collectionGroup": "messages",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "chatId", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "ASCENDING" }
  ]
}
```

---

## 3. Offline-First Architecture

### How react-native-firebase Handles Offline

**Native SQLite cache:**
- Stores all queried documents locally
- Unlimited cache size (configurable)
- Persists across app restarts
- Automatically syncs on reconnection

**Configuration:**
```typescript
import firestore from '@react-native-firebase/firestore';

firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});
```

### Write Queue

**Automatic queuing:**
```typescript
// User is OFFLINE
await firestore()
  .collection('chats')
  .doc(chatId)
  .collection('messages')
  .add({
    text: 'Hello',
    timestamp: firestore.FieldValue.serverTimestamp(),
  });

// ✅ Write queued locally
// ✅ Returns immediately with temp ID
// ✅ Auto-syncs when online
```

**How it works:**
1. **Offline write:** Stored in local queue with temporary ID
2. **Listener triggers:** Shows optimistic message in UI
3. **Connection restored:** Queue processes automatically
4. **Listener updates:** Replaces temporary ID with server ID

### Sync on Reconnection

**Automatic behavior:**
```
User offline → Send 5 messages → Go online
↓
Firestore processes queue:
  1. Send message 1 → Server confirms
  2. Send message 2 → Server confirms
  3. ...

Listener receives all confirmations → UI updates
```

**Timing:**
- Sync starts immediately on connection
- Typical sync time: <1 second for 10 messages
- Order preserved via server timestamps

### Edge Cases

**Scenario 1: App force-quit while offline**
```
1. User sends message while offline
2. User force-quits app
3. User reopens app while online
```

**Result:** ✅ Message still in queue, syncs on launch

**Why:** react-native-firebase persists queue to device storage

---

**Scenario 2: Conflicting writes**
```
Device A (offline): Update chat name to "Family"
Device B (online): Update chat name to "Parents"
Both devices reconnect
```

**Result:** Last-write-wins (determined by server timestamp)

**Mitigation:** Use transaction for critical updates

---

## 4. Optimistic UI

### Pattern: Show Immediately, Confirm Later

**Flow:**
```
1. User taps Send
2. Add to UI immediately (optimistic)
3. Write to Firestore (queued if offline)
4. Server confirms
5. Replace optimistic message with confirmed version
```

**Implementation:**

```typescript
interface Message {
  id: string;
  text: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  tempId?: string; // Client-generated ID
  timestamp: Timestamp | Date;
}

async function sendMessage(chatId: string, text: string) {
  const tempId = `temp-${Date.now()}-${Math.random()}`;

  // 1. Optimistic update
  const optimisticMessage: Message = {
    id: tempId,
    text,
    status: 'sending',
    tempId,
    timestamp: new Date(),
  };

  addMessageToUI(optimisticMessage);

  try {
    // 2. Write to Firestore
    const docRef = await firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .add({
        text,
        senderId: currentUserId,
        timestamp: firestore.FieldValue.serverTimestamp(),
        status: 'sent',
      });

    // 3. Remove optimistic message (listener will add confirmed version)
    removeMessageFromUI(tempId);

  } catch (error) {
    // 4. Mark as failed
    updateMessageStatus(tempId, 'failed');
  }
}
```

### Handling Duplicates

**Problem:** Optimistic + Listener = Same message twice

**Solution:** Track temporary IDs

```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [sendingMessages, setSendingMessages] = useState<Set<string>>(new Set());

// When sending
setSendingMessages(prev => new Set(prev).add(tempId));

// When listener confirms
useEffect(() => {
  // Filter out optimistic messages that have been confirmed
  const filtered = messages.filter(m =>
    !m.tempId || sendingMessages.has(m.tempId)
  );

  setMessages(filtered);
}, [messages, sendingMessages]);
```

### Status Indicators

```typescript
function MessageBubble({ message, isOwn }: Props) {
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Spinner />; // Or clock icon
      case 'sent':
        return <Checkmark color="gray" />;
      case 'delivered':
        return <DoubleCheckmark color="gray" />;
      case 'read':
        return <DoubleCheckmark color="blue" />;
      case 'failed':
        return <ErrorIcon color="red" />;
    }
  };

  return (
    <View>
      <Text>{message.text}</Text>
      {isOwn && getStatusIcon()}
    </View>
  );
}
```

---

## 5. Poor Network Handling

### Detecting Network State

```typescript
import NetInfo from '@react-native-community/netinfo';

function useNetworkStatus() {
  const [state, setState] = useState({
    isConnected: true,
    type: 'unknown',
    isInternetReachable: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(netState => {
      setState({
        isConnected: netState.isConnected ?? false,
        type: netState.type,
        isInternetReachable: netState.isInternetReachable,
      });
    });

    return unsubscribe;
  }, []);

  return state;
}
```

### UI Indicators

```typescript
function ConnectionBanner() {
  const { isConnected, isInternetReachable } = useNetworkStatus();

  if (isConnected && isInternetReachable) {
    return null; // All good
  }

  if (!isConnected) {
    return (
      <Banner type="warning">
        No internet - messages will sync when online
      </Banner>
    );
  }

  if (isInternetReachable === false) {
    return (
      <Banner type="error">
        Connected to WiFi but no internet access
      </Banner>
    );
  }

  return null;
}
```

### Retry Logic

**Firestore handles retries automatically, but for custom operations:**

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry on auth errors
      if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError!;
}

// Usage
await retryOperation(() =>
  cloudFunction({ data })
);
```

### Slow Network Detection

```typescript
function useSlowNetwork() {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // Cellular: Check effective type
      if (state.type === 'cellular') {
        const effectiveType = state.details?.cellularGeneration;
        setIsSlow(effectiveType === '2g' || effectiveType === '3g');
      } else {
        setIsSlow(false);
      }
    });

    return unsubscribe;
  }, []);

  return isSlow;
}

// Show warning
function MessageInput() {
  const isSlow = useSlowNetwork();

  return (
    <View>
      {isSlow && (
        <Text style={styles.warning}>
          Slow network detected - messages may take longer
        </Text>
      )}
      <TextInput />
    </View>
  );
}
```

---

## 6. Group Chat Delivery Tracking

### Read Receipts in Groups

**Challenge:** Track who read each message in a group

**Solution:** `readBy` array field

```typescript
interface Message {
  id: string;
  text: string;
  senderId: string;
  readBy: string[]; // Array of user IDs who read
  timestamp: Timestamp;
}
```

**Mark as read:**
```typescript
async function markAsRead(chatId: string, messageId: string, userId: string) {
  await firestore()
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .doc(messageId)
    .update({
      readBy: firestore.FieldValue.arrayUnion(userId),
    });
}
```

**Auto-mark when viewing:**
```typescript
useEffect(() => {
  if (!user || messages.length === 0) return;

  // Find unread messages
  const unreadMessages = messages.filter(
    m => m.senderId !== user.uid && !m.readBy?.includes(user.uid)
  );

  // Mark each as read
  unreadMessages.forEach(message => {
    markAsRead(chatId, message.id, user.uid).catch(console.error);
  });
}, [messages, user]);
```

### Display Read Status

```typescript
function MessageBubble({ message, chat }: Props) {
  const getReadStatus = () => {
    if (chat.type === 'one-on-one') {
      // Simple: read or not
      return message.readBy.length > 1 ? 'Read' : 'Delivered';
    } else {
      // Group: show count
      const readCount = message.readBy.length - 1; // Exclude sender
      const totalRecipients = chat.participants.length - 1;

      if (readCount === 0) return 'Sent';
      if (readCount === totalRecipients) return 'Read by all';
      return `Read by ${readCount}/${totalRecipients}`;
    }
  };

  return (
    <View>
      <Text>{message.text}</Text>
      <Text style={styles.status}>{getReadStatus()}</Text>
    </View>
  );
}
```

### Unread Count per User

**Store in chat document:**
```typescript
interface Chat {
  id: string;
  participants: string[];
  unreadCount: {
    [userId: string]: number;
  };
}
```

**Increment on new message:**
```typescript
async function sendMessage(chatId: string, text: string) {
  const chat = await firestore().collection('chats').doc(chatId).get();
  const participants = chat.data()?.participants || [];

  // Build update object for all recipients
  const unreadUpdates: any = {};
  participants.forEach(userId => {
    if (userId !== currentUserId) {
      unreadUpdates[`unreadCount.${userId}`] = firestore.FieldValue.increment(1);
    }
  });

  await firestore()
    .collection('chats')
    .doc(chatId)
    .update(unreadUpdates);
}
```

**Reset when viewing:**
```typescript
async function resetUnreadCount(chatId: string, userId: string) {
  await firestore()
    .collection('chats')
    .doc(chatId)
    .update({
      [`unreadCount.${userId}`]: 0,
    });
}

// Call when opening chat
useEffect(() => {
  resetUnreadCount(chatId, user.uid);
}, [chatId, user]);
```

---

## 7. Common Pitfalls & Solutions

### Pitfall 1: Listener Memory Leaks

**Problem:**
```typescript
// ❌ BAD: Listener never cleaned up
useEffect(() => {
  firestore()
    .collection('chats')
    .doc(chatId)
    .onSnapshot(snapshot => {
      setChat(snapshot.data());
    });
}, [chatId]);
```

**Solution:**
```typescript
// ✅ GOOD: Unsubscribe on cleanup
useEffect(() => {
  const unsubscribe = firestore()
    .collection('chats')
    .doc(chatId)
    .onSnapshot(snapshot => {
      setChat(snapshot.data());
    });

  return () => unsubscribe();
}, [chatId]);
```

---

### Pitfall 2: Infinite Loops

**Problem:**
```typescript
// ❌ BAD: Updates trigger listener, which updates state, which triggers effect...
useEffect(() => {
  const unsubscribe = firestore()
    .collection('users')
    .doc(userId)
    .onSnapshot(snapshot => {
      const user = snapshot.data();

      // This triggers the listener again!
      firestore()
        .collection('users')
        .doc(userId)
        .update({ lastSeen: new Date() });
    });

  return () => unsubscribe();
}, [userId]);
```

**Solution:**
```typescript
// ✅ GOOD: Use server timestamp, update from separate trigger
useEffect(() => {
  const unsubscribe = firestore()
    .collection('users')
    .doc(userId)
    .onSnapshot(snapshot => {
      setUser(snapshot.data());
    });

  return () => unsubscribe();
}, [userId]);

// Update presence separately (e.g., on app state change)
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    firestore()
      .collection('users')
      .doc(userId)
      .update({ online: true });
  }
});
```

---

### Pitfall 3: Race Conditions

**Problem:**
```typescript
// ❌ BAD: Read then write - another client might update in between
const chat = await firestore().collection('chats').doc(chatId).get();
const currentCount = chat.data()?.messageCount || 0;

await firestore()
  .collection('chats')
  .doc(chatId)
  .update({ messageCount: currentCount + 1 });
```

**Solution:**
```typescript
// ✅ GOOD: Use atomic increment
await firestore()
  .collection('chats')
  .doc(chatId)
  .update({
    messageCount: firestore.FieldValue.increment(1),
  });
```

---

### Pitfall 4: Not Using Server Timestamps

**Problem:**
```typescript
// ❌ BAD: Client timestamp - clocks may be wrong
await firestore()
  .collection('messages')
  .add({
    text: 'Hello',
    timestamp: new Date(), // Client time
  });
```

**Result:** Messages out of order if client clock is wrong

**Solution:**
```typescript
// ✅ GOOD: Server timestamp
await firestore()
  .collection('messages')
  .add({
    text: 'Hello',
    timestamp: firestore.FieldValue.serverTimestamp(),
  });
```

**For optimistic UI:**
```typescript
// Use client timestamp as fallback, but prefer server timestamp
interface Message {
  timestamp: Timestamp; // Server timestamp (canonical)
  clientTimestamp?: Date; // Fallback for ordering before server confirmation
}

// Sort messages
messages.sort((a, b) => {
  const timeA = a.timestamp?.toMillis() || a.clientTimestamp?.getTime() || 0;
  const timeB = b.timestamp?.toMillis() || b.clientTimestamp?.getTime() || 0;
  return timeA - timeB;
});
```

---

### Pitfall 5: Large Batch Updates

**Problem:**
```typescript
// ❌ BAD: Update 100 documents individually
for (const messageId of messageIds) {
  await firestore()
    .collection('messages')
    .doc(messageId)
    .update({ read: true });
}
```

**Result:** Slow, many network requests

**Solution:**
```typescript
// ✅ GOOD: Use batch writes
const batch = firestore().batch();

messageIds.forEach(messageId => {
  const ref = firestore().collection('messages').doc(messageId);
  batch.update(ref, { read: true });
});

await batch.commit(); // Single network request
```

**Firestore batch limits:**
- Max 500 operations per batch
- All-or-nothing atomicity

---

### Pitfall 6: Querying Without Indexes

**Problem:**
```typescript
// ❌ BAD: Complex query without index
const messages = await firestore()
  .collection('messages')
  .where('chatId', '==', chatId)
  .where('priority', '==', 'high')
  .orderBy('timestamp', 'desc')
  .get();

// Error: "The query requires an index"
```

**Solution:**
```typescript
// Create composite index via Firebase Console or firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "chatId", "order": "ASCENDING" },
        { "fieldPath": "priority", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Best practice:** Firestore error messages include a link to auto-create the index.

---

### Pitfall 7: Not Handling Offline Errors

**Problem:**
```typescript
// ❌ BAD: Assume network is always available
try {
  await sendMessage(chatId, text);
  showSuccessMessage();
} catch (error) {
  showErrorMessage(); // User sees error even though message will sync later
}
```

**Solution:**
```typescript
// ✅ GOOD: Distinguish network errors from real errors
try {
  await sendMessage(chatId, text);
  showSuccessMessage();
} catch (error: any) {
  if (error.code === 'unavailable') {
    // Network error - message queued, will sync later
    showInfoMessage('Message queued, will send when online');
  } else {
    // Real error
    showErrorMessage(error.message);
  }
}
```

---

## Performance Optimization

### 1. Pagination

```typescript
const PAGE_SIZE = 50;
let lastDocument: DocumentSnapshot | null = null;

async function loadMoreMessages() {
  let query = firestore()
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(PAGE_SIZE);

  if (lastDocument) {
    query = query.startAfter(lastDocument);
  }

  const snapshot = await query.get();
  lastDocument = snapshot.docs[snapshot.docs.length - 1];

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### 2. Denormalization

**Problem:** Need chat name but only have chat ID

**Bad solution:** Query users collection every time
```typescript
// ❌ SLOW
const chat = await firestore().collection('chats').doc(chatId).get();
const otherUserId = chat.data()?.participants[1];
const otherUser = await firestore().collection('users').doc(otherUserId).get();
const chatName = otherUser.data()?.displayName;
```

**Good solution:** Store denormalized data in chat document
```typescript
// ✅ FAST
interface Chat {
  id: string;
  participants: string[];
  participantData: {
    [userId: string]: {
      name: string;
      photoURL: string;
    }
  };
}

// Single read
const chat = await firestore().collection('chats').doc(chatId).get();
const chatName = chat.data()?.participantData[otherUserId]?.name;
```

**Trade-off:** Must update denormalized data when user changes name

---

### 3. Listener Scoping

```typescript
// ❌ BAD: Subscribe to all chats
useEffect(() => {
  const unsubscribe = firestore()
    .collection('chats')
    .where('participants', 'array-contains', userId)
    .onSnapshot(snapshot => {
      // Updates for ALL chats, even ones not visible
    });

  return () => unsubscribe();
}, [userId]);
```

```typescript
// ✅ GOOD: Only subscribe to visible chat
useEffect(() => {
  if (!currentChatId) return;

  const unsubscribe = firestore()
    .collection('chats')
    .doc(currentChatId)
    .onSnapshot(snapshot => {
      // Only updates for current chat
    });

  return () => unsubscribe();
}, [currentChatId]);
```

---

## Testing Offline Scenarios

### Stress Test: 20 Messages in 2 Seconds

```typescript
async function stressTest(chatId: string, userId: string) {
  console.log('Starting stress test...');
  const startTime = Date.now();

  const promises = [];
  for (let i = 0; i < 20; i++) {
    promises.push(
      sendMessage(chatId, userId, `Test message ${i + 1}`)
    );

    // Small delay between sends
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  await Promise.all(promises);

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`Stress test complete: ${duration}ms`);
  console.log(`Average: ${duration / 20}ms per message`);

  // ✅ Target: All 20 messages delivered
  // ✅ Target: <200ms average per message
  // ✅ Target: No duplicates
  // ✅ Target: Correct order
}
```

### Offline Sync Test

```typescript
async function testOfflineSync() {
  // 1. Go offline
  await firestore().disableNetwork();
  console.log('Network disabled');

  // 2. Send 5 messages
  for (let i = 0; i < 5; i++) {
    await sendMessage(chatId, userId, `Offline message ${i + 1}`);
  }
  console.log('5 messages sent while offline');

  // 3. Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 4. Go online
  const syncStartTime = Date.now();
  await firestore().enableNetwork();
  console.log('Network enabled');

  // 5. Wait for sync (listen for all 5 messages)
  return new Promise((resolve) => {
    const unsubscribe = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .where('senderId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(5)
      .onSnapshot(snapshot => {
        if (snapshot.docs.length === 5) {
          const syncEndTime = Date.now();
          const syncDuration = syncEndTime - syncStartTime;

          console.log(`Sync complete: ${syncDuration}ms`);
          // ✅ Target: <1000ms

          unsubscribe();
          resolve(syncDuration);
        }
      });
  });
}
```

---

## Summary

### Best Practices

1. **Always cleanup listeners** in useEffect return
2. **Use server timestamps** for ordering
3. **Enable offline persistence** for better UX
4. **Implement optimistic UI** for instant feedback
5. **Denormalize data** for read performance
6. **Use composite indexes** for complex queries
7. **Batch writes** when updating many documents
8. **Paginate queries** to avoid loading too much data
9. **Handle network errors gracefully** - distinguish from real errors
10. **Test offline scenarios** thoroughly

### Architecture Checklist

- [ ] Listeners properly cleaned up
- [ ] Offline persistence enabled
- [ ] Optimistic UI implemented
- [ ] Server timestamps used
- [ ] Read receipts working (readBy array)
- [ ] Typing indicators implemented
- [ ] User presence (online/offline) working
- [ ] Network status indicator in UI
- [ ] All offline scenarios tested
- [ ] Performance targets met (<200ms send, <1s sync)

---

← [Back to README](./README.md) | [Next: Implementation Guide](./04-implementation-guide.md)
