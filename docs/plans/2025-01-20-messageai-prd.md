# MessageAI Product Requirements Document

**Project:** MessageAI - Cross-Platform Messaging App with AI Features
**Persona:** Busy Parent/Caregiver
**Timeline:** 4-Day Sprint (MVP: 24h, Early: 96h, Final: 168h)
**Platform:** React Native + Expo Custom Dev Client
**Date:** January 20, 2025
**Version:** 1.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User Persona Deep Dive](#2-user-persona-deep-dive)
3. [Technical Architecture](#3-technical-architecture)
4. [Core Messaging Infrastructure Deep Dive](#4-core-messaging-infrastructure-deep-dive)
5. [Implementation Plan (PR-Based)](#5-implementation-plan-pr-based)
6. [Stretch Goals & Future Enhancements](#6-stretch-goals--future-enhancements)
7. [Rubric Alignment & Success Criteria](#7-rubric-alignment--success-criteria)

---

## 1. Executive Summary

### 1.1 Project Overview

**MessageAI** is a production-quality messaging application built for **Busy Parents/Caregivers** who need to coordinate complex family schedules across multiple group chats while managing work, home, and family responsibilities.

**Core Value Proposition:**
"MessageAI helps busy parents coordinate family schedules, track decisions, and never miss important information—even when juggling a thousand things at once. The app works reliably offline, syncs seamlessly when reconnected, and uses AI to extract calendar events, deadlines, and RSVPs from casual conversation."

**Key Differentiators:**
- **Rock-solid offline-first messaging** (survives poor connections, force-quits, airplane mode)
- **AI features purpose-built for parents** (not generic chatbot features)
- **Production-quality infrastructure** (passes rigorous stress tests)
- **Cross-platform** (iOS + Android from single codebase)

### 1.2 Success Criteria

**MVP Checkpoint (24 hours):**
- ✅ All 11 MVP requirements (one-on-one chat, real-time, persistence, optimistic UI, online/offline status, timestamps, auth, group chat, read receipts, push notifications, local deployment)
- ✅ Passes Ash's 7 stress tests (offline scenarios, force-quit, poor network, 20 rapid messages, group chat)
- ✅ Performance benchmarks documented (sub-200ms messages, sub-1s sync)

**Final Submission (96 hours):**
- ✅ 5 required AI features + 1 advanced feature (Proactive Assistant)
- ✅ All features >90% accuracy
- ✅ Demo video (5-7 min) with both devices visible
- ✅ Comprehensive documentation with architecture diagrams
- ✅ Target: 100/100 points on rubric

### 1.3 Timeline Overview

| Phase | Duration | Focus | Deliverable |
|-------|----------|-------|-------------|
| **Day 1** | 0-24h | MVP - Core Messaging | ✅ All 11 MVP requirements + benchmarks |
| **Day 2** | 24-48h | AI Features (1-3) | 3/6 AI features working |
| **Day 3** | 48-72h | Advanced AI + Performance | All AI features + optimization |
| **Day 4** | 72-96h | Testing + Demo + Docs | 🚀 Final submission ready |

---

## 2. User Persona Deep Dive

### 2.1 Persona: Busy Parent/Caregiver

**Who They Are:**
- Parents managing kids' schedules (school, sports, activities, playdates)
- Coordinating with other parents, teachers, coaches, caregivers
- Juggling full-time work + household management + family responsibilities
- Active in 3-5 group chats: school parents, sports teams, family coordination, neighborhood

**Demographics:**
- Age: 30-45
- Tech-savvy but time-constrained
- Smartphone is primary communication device
- Often messaging on-the-go (school pickup, commute, errands)

### 2.2 Core Pain Points (with Real Scenarios)

#### **Pain Point 1: Schedule Juggling**

**Scenario:**
Sarah is in a soccer team parent group chat. Coach sends: *"Practice moved to 4pm Tuesday instead of 3pm."* This message is buried in 50+ messages about snack schedules and carpool arrangements. Sarah doesn't see it until Wednesday morning. Her son misses practice.

**Current Solution:**
Manually scrolling through group chats, screenshotting important dates, transferring to calendar app manually. Often misses updates or double-books activities.

**MessageAI Solution:**
AI automatically extracts "Practice moved to 4pm Tuesday" → creates calendar event → notifies Sarah proactively. No manual intervention needed.

---

#### **Pain Point 2: Missing Deadlines/Commitments**

**Scenario:**
Teacher mentions in passing: *"Permission slip for field trip due Friday, $20 check needed."* Sarah reads it Monday morning but forgets by Friday. Her daughter can't go on the field trip.

**Current Solution:**
Screenshots, todo apps, sticky notes. Easy to forget when juggling 10 different responsibilities.

**MessageAI Solution:**
AI extracts deadline: "Permission slip due Friday" → creates reminder → sends notification Thursday evening. Also extracts "$20 check" as action item.

---

#### **Pain Point 3: Decision Fatigue**

**Scenario:**
Parent group planning: *"Where should we go Saturday for the kids' playdate?"* spawns 30 messages over 2 days. Pizza place? Park? Someone's house? Sarah has to re-read the entire thread to remember what was decided.

**Current Solution:**
Scroll through long threads, try to remember who said what, often ask "wait, what did we decide?"

**MessageAI Solution:**
AI decision summarization: "After discussing pizza place (too expensive) and Sarah's house (unavailable), group decided on Central Park at 2pm Saturday. Bring snacks."

---

#### **Pain Point 4: Information Overload**

**Scenario:**
Sarah has 100+ messages across 5 group chats daily. 95 are casual conversation, 5 are urgent (schedule changes, sick kid pickup, payment reminders). She misses urgent messages in the noise.

**Current Solution:**
Constantly checking phone, fear of missing important info, notification fatigue.

**MessageAI Solution:**
AI priority detection highlights urgent messages with red badge: "URGENT: Sam has fever, pick up from school early."

---

#### **Pain Point 5: RSVP Tracking**

**Scenario:**
Sarah's daughter's birthday party. Invitation sent to 15 families via group chat. Responses trickle in over a week. Sarah manually counts: "Did Alex's mom respond? I think so... let me scroll up..."

**Current Solution:**
Manual tracking, re-asking people who didn't respond, difficult to know final headcount.

**MessageAI Solution:**
AI automatically tracks RSVPs: "8 yes, 2 no, 3 maybe, 2 no response" with names listed. Sarah knows exactly who's coming.

---

### 2.3 User Stories

#### **Core Messaging User Stories:**

1. **As a parent, I want to send messages that appear instantly** so I can coordinate in real-time (e.g., "Running 5 min late for pickup")

2. **As a parent, I want messages to work offline** so I can message from anywhere (subway, school basement, rural areas)

3. **As a parent, I want to see read receipts** so I know if urgent messages were seen ("Did coach see that my son can't make practice?")

4. **As a parent, I want group chats** so I can coordinate with multiple families at once

5. **As a parent, I want messages to persist after force-quit** so I never lose important information

6. **As a parent, I want typing indicators** so I know someone is responding to my urgent question

7. **As a parent, I want online/offline status** so I know if someone is available to respond

---

#### **AI Feature User Stories:**

8. **As a parent, I want calendar events auto-extracted** so I never miss schedule changes buried in group chats

9. **As a parent, I want decisions summarized** so I know what was decided without re-reading 30 messages

10. **As a parent, I want priority messages highlighted** so I focus on what's urgent (sick kid, schedule changes) and can skim the rest

11. **As a parent, I want RSVPs tracked automatically** so I know who's coming to events without manual counting

12. **As a parent, I want deadlines extracted** so I don't miss permission slips, payments, or commitments

13. **As a parent, I want proactive conflict detection** so I don't accidentally double-book soccer practice and doctor appointments

---

### 2.4 Success Metrics (Post-Launch)

How we'd measure success with real users:

- **Time saved:** Average 15-20 minutes daily (no manual calendar entry, no re-reading threads)
- **Missed events:** Reduce from 2-3/month to near-zero
- **Stress reduction:** Qualitative feedback on reduced "fear of missing important info"
- **Adoption:** Primary messaging app for family coordination

---

## 3. Technical Architecture

### 3.1 Tech Stack

#### **Frontend**
- **React Native** (cross-platform mobile framework)
- **Expo Custom Dev Client** (enables native modules + Expo ecosystem)
- **TypeScript** (type safety, better developer experience)
- **Expo Router** (file-based navigation, type-safe routing)
- **Zustand** (lightweight state management)
- **react-native-reanimated** (smooth 60 FPS animations)

#### **Backend**
- **Firebase Firestore** (real-time NoSQL database, offline-first)
- **Firebase Authentication** (email/password, social login)
- **Firebase Cloud Functions** (serverless AI processing)
- **Firebase Cloud Messaging (FCM)** (push notifications)
- **Firebase Storage** (user avatars, images, voice messages)

#### **Local Storage**
- **react-native-firebase** (native offline persistence via SQLite)
- **expo-sqlite** (optional backup for local message caching)

#### **AI Stack**
- **OpenAI GPT-4 Turbo** (LLM for all AI features)
- **AI SDK by Vercel** (5 required features - simple extractions)
- **LangChain** (1 advanced feature - Proactive Assistant with multi-step reasoning)
- **RAG Pipeline** (conversation history retrieval for context)

#### **Additional Libraries**
- **expo-image** (progressive image loading with blurhash)
- **expo-notifications** (push notification handling)
- **expo-av** (voice message recording - bonus feature)
- **NetInfo** (network connection detection)

---

### 3.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App Layer                      │
│  (React Native + Expo Custom Dev Client)                │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Screens    │  │  Components  │  │  Zustand     │  │
│  │  (Expo       │  │  (Messages,  │  │  Stores      │  │
│  │   Router)    │  │   Chat, AI)  │  │              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│         └─────────────────┴─────────────────┘           │
│                           │                             │
└───────────────────────────┼─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Local Storage Layer (Offline)               │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  react-native-firebase Native SQLite Cache       │   │
│  │  - Message queue for offline sends               │   │
│  │  - Local message persistence                     │   │
│  │  - Auto-sync on reconnection                     │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Firebase Backend                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Firestore   │  │   Firebase   │  │   Cloud      │  │
│  │  (Real-time  │  │     Auth     │  │  Functions   │  │
│  │   Database)  │  │              │  │  (AI Calls)  │  │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘  │
│         │                                    │           │
│         │  ┌──────────────┐  ┌──────────────┴───────┐  │
│         │  │   Storage    │  │  Cloud Messaging     │  │
│         │  │  (Images)    │  │  (Push Notifs)       │  │
│         │  └──────────────┘  └──────────────────────┘  │
└─────────┼──────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                   AI Processing Layer                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              OpenAI GPT-4 Turbo API              │   │
│  │  - Calendar extraction (function calling)        │   │
│  │  - Decision summarization (JSON mode)            │   │
│  │  - Priority detection (classification)           │   │
│  │  - RSVP tracking (structured extraction)         │   │
│  │  - Deadline extraction (function calling)        │   │
│  │  - Proactive Assistant (LangChain agent + RAG)   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

### 3.3 Data Models

#### **Users Collection** (`/users/{userId}`)
```typescript
interface User {
  id: string;                  // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;           // Profile picture
  online: boolean;             // Real-time presence
  lastSeen: Timestamp;         // Last active time
  fcmToken?: string;           // Push notification token
  createdAt: Timestamp;
}
```

---

#### **Chats Collection** (`/chats/{chatId}`)
```typescript
interface Chat {
  id: string;
  type: 'one-on-one' | 'group';
  participants: string[];      // Array of user IDs
  participantData: {           // Denormalized for quick access
    [userId: string]: {
      name: string;
      photoURL: string;
    }
  };
  lastMessage: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
  };
  unreadCount: {               // Per-user unread count
    [userId: string]: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Group chat specific
  groupName?: string;
  groupPhoto?: string;
  createdBy?: string;
}
```

---

#### **Messages Subcollection** (`/chats/{chatId}/messages/{messageId}`)
```typescript
interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;        // Server timestamp for ordering
  status: 'sending' | 'sent' | 'delivered' | 'read';

  // Read receipts (for group chats)
  readBy: string[];            // Array of user IDs who read

  // Optimistic UI (client-side only)
  tempId?: string;             // Temporary ID before server assigns real ID

  // Media (optional)
  imageUrl?: string;
  voiceUrl?: string;

  // AI Extractions (optional)
  aiExtraction?: {
    calendarEvents?: CalendarEvent[];
    deadlines?: Deadline[];
    rsvp?: RSVP;
    priority?: 'high' | 'medium' | 'low';
    decision?: string;
  };
}
```

---

#### **AI-Specific Types**
```typescript
interface CalendarEvent {
  event: string;               // "Soccer practice"
  date: string;                // ISO date
  time?: string;               // "4:00 PM"
  location?: string;
  extractedFrom: string;       // Original message text
  confidence: number;          // 0-1 confidence score
}

interface Deadline {
  task: string;                // "Permission slip"
  dueDate: string;             // ISO date
  priority: 'high' | 'medium' | 'low';
  extractedFrom: string;
  reminder?: Timestamp;        // When to send reminder
}

interface RSVP {
  event: string;               // "Birthday party"
  responses: {
    [userId: string]: 'yes' | 'no' | 'maybe';
  };
  summary: {
    yes: number;
    no: number;
    maybe: number;
    noResponse: number;
  };
}
```

---

### 3.4 Security - Firestore Rules

**Basic Security Model:**
- Users can only read/write their own user document
- Chat participants can read/write messages in their chats
- Users can only create chats they're a participant in
- Group chat members can add/remove participants (if creator)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Chats - participants only
    match /chats/{chatId} {
      allow read: if request.auth.uid in resource.data.participants;
      allow create: if request.auth.uid in request.resource.data.participants;
      allow update: if request.auth.uid in resource.data.participants;

      // Messages subcollection
      match /messages/{messageId} {
        allow read: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        allow create: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants
                      && request.auth.uid == request.resource.data.senderId;
        allow update: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }
  }
}
```

**Rate Limiting:**
- Cloud Functions: 20 AI requests per minute per user
- Message send: No limit (Firestore handles this)
- User creation: 5 per hour per IP (Firebase Auth default)

---

### 3.5 Performance Targets (Rubric Requirements)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| App launch to chat screen | <2 seconds | React Native Performance Monitor |
| Message delivery (good network) | <200ms | Custom performance logger |
| Offline sync after reconnection | <1 second | Custom performance logger |
| Scrolling through 1000+ messages | 60 FPS | React DevTools Profiler |
| AI simple commands (calendar, priority) | <2 seconds | Cloud Function logs |
| Advanced AI (Proactive Assistant) | <15 seconds | Cloud Function logs |
| Typing indicator lag | <100ms | Manual testing |
| Presence update lag | <100ms | Manual testing |

**All measurements will be documented in `PERFORMANCE.md`**

---

## 4. Core Messaging Infrastructure Deep Dive

*This is your priority section - 6-8 pages of deep technical guidance*

### 4.1 Real-Time Sync Patterns with Firestore

#### **How Firestore Real-Time Listeners Work**

Firestore provides `onSnapshot` listeners that automatically receive updates when data changes on the server. For messaging apps, this is the core of real-time functionality.

**Key Concepts:**
1. **Persistent Connection:** WebSocket connection to Firestore servers
2. **Local Cache:** All data cached locally (SQLite on device)
3. **Automatic Sync:** Changes sync bidirectionally (client ↔ server)
4. **Offline Support:** Listeners continue to work with local cache when offline

**Basic Pattern:**
```typescript
import firestore from '@react-native-firebase/firestore';

// Attach listener
const unsubscribe = firestore()
  .collection('chats')
  .doc(chatId)
  .collection('messages')
  .orderBy('timestamp', 'asc')
  .onSnapshot(
    (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Update UI
      setMessages(messages);
    },
    (error) => {
      console.error('Listener error:', error);
    }
  );

// CRITICAL: Detach when component unmounts
return () => unsubscribe();
```

---

#### **Listener Lifecycle Management**

**The Problem:**
Firestore listeners are persistent connections. If not managed properly, they cause:
- Memory leaks (listener never detaches)
- Multiple listeners on same data (every re-render creates new listener)
- Battery drain (background connections)

**The Solution: Custom Hook Pattern**

```typescript
// lib/hooks/useMessages.ts
import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { Message } from '../types';

export const useMessages = (chatId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only attach listener if chatId exists
    if (!chatId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Attach listener
    const unsubscribe = firestore()
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .limit(100) // Limit for performance
      .onSnapshot(
        (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Message[];

          setMessages(msgs);
          setLoading(false);
        },
        (err) => {
          console.error('Message listener error:', err);
          setError(err);
          setLoading(false);
        }
      );

    // CLEANUP: Detach listener when component unmounts or chatId changes
    return () => {
      console.log('Detaching message listener for chat:', chatId);
      unsubscribe();
    };
  }, [chatId]); // Re-attach if chatId changes

  return { messages, loading, error };
};
```

**Usage in Component:**
```typescript
// app/chat/[id].tsx
import { useMessages } from '../../lib/hooks/useMessages';

export default function ChatScreen() {
  const { id: chatId } = useLocalSearchParams();
  const { messages, loading, error } = useMessages(chatId);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <MessageList messages={messages} />;
}
```

**Benefits:**
- ✅ Listener automatically detaches on unmount
- ✅ No memory leaks
- ✅ Re-attaches when chatId changes
- ✅ Loading and error states handled

---

#### **Performance Optimization: Query Limits**

**The Problem:**
Loading all messages (thousands) on every chat open is slow and wastes bandwidth.

**The Solution: Pagination + Infinite Scroll**

```typescript
export const useMessagesPaginated = (chatId: string, pageSize = 50) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Load initial messages
  useEffect(() => {
    const unsubscribe = firestore()
      .collection('chats/${chatId}/messages')
      .orderBy('timestamp', 'desc') // Most recent first
      .limit(pageSize)
      .onSnapshot((snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setMessages(msgs.reverse()); // Reverse for chronological order in UI
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === pageSize);
      });

    return () => unsubscribe();
  }, [chatId]);

  // Load more (older messages)
  const loadMore = async () => {
    if (!hasMore || !lastDoc) return;

    const snapshot = await firestore()
      .collection(`chats/${chatId}/messages`)
      .orderBy('timestamp', 'desc')
      .startAfter(lastDoc)
      .limit(pageSize)
      .get();

    const olderMsgs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setMessages(prev => [...olderMsgs.reverse(), ...prev]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    setHasMore(snapshot.docs.length === pageSize);
  };

  return { messages, loadMore, hasMore };
};
```

**Rubric Target: 60 FPS scrolling through 1000+ messages**
This pagination ensures we only render 50-100 messages initially, then load more on scroll.

---

### 4.2 Offline-First Architecture

**The Offline-First Principle:**
> "The app should work perfectly offline. Users shouldn't even know they're offline until they try to receive new messages."

#### **How react-native-firebase Handles Offline**

**Automatic Offline Persistence:**
```typescript
// lib/firebase/config.ts
import firestore from '@react-native-firebase/firestore';

// Enable offline persistence (default is true, but explicit is better)
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED
});
```

**What This Does:**
1. ✅ All Firestore data cached in native SQLite database
2. ✅ Reads served from cache first (instant), then sync from server
3. ✅ Writes queued locally if offline, sent when reconnected
4. ✅ Listeners continue to work with local cache
5. ✅ Conflicts resolved with last-write-wins (Firestore default)

---

#### **Offline Message Queue Implementation**

**The Pattern: Optimistic UI with Server Confirmation**

**Step 1: User Sends Message**
```typescript
// lib/store/messageStore.ts
import { create } from 'zustand';
import firestore from '@react-native-firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

interface MessageStore {
  messages: Message[];
  sendMessage: (chatId: string, text: string, senderId: string) => Promise<void>;
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],

  sendMessage: async (chatId, text, senderId) => {
    const tempId = uuidv4(); // Generate temporary ID

    // Step 1: OPTIMISTIC - Add to local state immediately
    const optimisticMessage: Message = {
      id: tempId,
      tempId,
      chatId,
      senderId,
      text,
      timestamp: firestore.Timestamp.now(), // Client timestamp
      status: 'sending',
      readBy: [senderId]
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage]
    }));

    try {
      // Step 2: Write to Firestore
      const docRef = await firestore()
        .collection(`chats/${chatId}/messages`)
        .add({
          senderId,
          text,
          timestamp: firestore.FieldValue.serverTimestamp(), // Server timestamp
          status: 'sent',
          readBy: [senderId]
        });

      // Step 3: Update local message with real ID
      set((state) => ({
        messages: state.messages.map(msg =>
          msg.tempId === tempId
            ? { ...msg, id: docRef.id, status: 'sent', tempId: undefined }
            : msg
        )
      }));

      // Step 4: Update chat's lastMessage
      await firestore()
        .collection('chats')
        .doc(chatId)
        .update({
          lastMessage: {
            text,
            senderId,
            timestamp: firestore.FieldValue.serverTimestamp()
          },
          updatedAt: firestore.FieldValue.serverTimestamp()
        });

    } catch (error) {
      console.error('Send message error:', error);

      // Step 5: Mark as failed (allow retry)
      set((state) => ({
        messages: state.messages.map(msg =>
          msg.tempId === tempId
            ? { ...msg, status: 'failed', error: error.message }
            : msg
        )
      }));
    }
  }
}));
```

**What Happens When Offline:**
1. ✅ Optimistic message appears instantly in UI
2. ✅ Firestore queues write locally (native SQLite)
3. ✅ Status shows "sending..."
4. ✅ When connection returns, Firestore auto-sends queued writes
5. ✅ Status updates to "sent" via listener
6. ✅ If device force-quit, queued writes persist and send on next app open

---

#### **Retry Logic for Failed Messages**

```typescript
// lib/store/messageStore.ts (continued)

interface MessageStore {
  // ... previous methods
  retryMessage: (tempId: string) => Promise<void>;
}

// Add to store
retryMessage: async (tempId) => {
  const message = get().messages.find(m => m.tempId === tempId);
  if (!message) return;

  // Update status to sending
  set((state) => ({
    messages: state.messages.map(msg =>
      msg.tempId === tempId ? { ...msg, status: 'sending', error: undefined } : msg
    )
  }));

  // Retry send
  await get().sendMessage(message.chatId, message.text, message.senderId);
}
```

**UI Component:**
```typescript
// components/messages/MessageBubble.tsx
export function MessageBubble({ message }) {
  const retryMessage = useMessageStore(state => state.retryMessage);

  return (
    <View>
      <Text>{message.text}</Text>

      {message.status === 'sending' && <ActivityIndicator size="small" />}
      {message.status === 'failed' && (
        <TouchableOpacity onPress={() => retryMessage(message.tempId)}>
          <Text style={{ color: 'red' }}>Failed. Tap to retry</Text>
        </TouchableOpacity>
      )}
      {message.status === 'sent' && <Text>✓</Text>}
      {message.status === 'delivered' && <Text>✓✓</Text>}
      {message.status === 'read' && <Text style={{ color: 'blue' }}>✓✓</Text>}
    </View>
  );
}
```

---

#### **Conflict Resolution Strategies**

**Scenario: Two Users Offline, Both Edit Same Message**

**Firestore Default: Last-Write-Wins**
- User A (offline): Updates message text at 10:00am
- User B (offline): Updates same message text at 10:05am
- Both reconnect at 10:10am
- Firestore accepts the write with the latest server timestamp
- User B's edit wins, User A's is lost

**For Messaging Apps: This is Usually Fine**
- Messages are rarely edited (most apps don't allow editing)
- If implementing message editing, warn user "This message may have been updated by someone else"

**Alternative: Operational Transformation (OT) / CRDTs**
- Advanced conflict resolution (like Google Docs)
- Not needed for basic messaging
- Only implement if building collaborative editing features

---

#### **Handling App Force-Quit Mid-Send**

**The Problem:**
User sends message → app crashes or is force-quit → message lost?

**The Solution: react-native-firebase Persistence**

**What Happens:**
1. User sends message
2. Optimistic UI shows message
3. Firestore queues write to native SQLite
4. App force-quit before write completes
5. **On app reopen:** Firestore automatically sends queued writes
6. Message delivers successfully

**No additional code needed** - react-native-firebase handles this automatically with native persistence.

**Testing This:**
```bash
# Test scenario
1. Turn on airplane mode
2. Send 5 messages (they queue)
3. Force-quit app (swipe away)
4. Turn off airplane mode
5. Reopen app
6. ✅ All 5 messages should send automatically
```

---

### 4.3 Optimistic UI Updates

**The Goal:**
Messages appear instantly when user taps "Send", then update with server confirmation. No waiting for server round-trip (200ms minimum).

**Full Implementation:**

```typescript
// lib/store/messageStore.ts - Complete optimistic pattern

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],

  sendMessage: async (chatId, text, senderId) => {
    const tempId = uuidv4();
    const now = new Date();

    // OPTIMISTIC: Add to UI immediately
    const optimisticMsg: Message = {
      id: tempId,
      tempId,
      chatId,
      senderId,
      text,
      timestamp: firestore.Timestamp.fromDate(now),
      status: 'sending',
      readBy: [senderId],
      createdAt: now // Client timestamp for ordering
    };

    set((state) => ({
      messages: [...state.messages, optimisticMsg]
    }));

    try {
      // SERVER: Write to Firestore
      const docRef = await firestore()
        .collection(`chats/${chatId}/messages`)
        .add({
          senderId,
          text,
          timestamp: firestore.FieldValue.serverTimestamp(),
          status: 'sent',
          readBy: [senderId]
        });

      // UPDATE: Replace optimistic message with server version
      // Note: Listener will also update this, but we update immediately for UX
      set((state) => ({
        messages: state.messages.map(msg =>
          msg.tempId === tempId
            ? { ...msg, id: docRef.id, status: 'sent', tempId: undefined }
            : msg
        )
      }));

    } catch (error) {
      // FAILURE: Mark as failed, allow retry
      set((state) => ({
        messages: state.messages.map(msg =>
          msg.tempId === tempId
            ? { ...msg, status: 'failed', error: error.message }
            : msg
        )
      }));
    }
  }
}));
```

---

**Preventing UI Flickering:**

**The Problem:**
Optimistic message appears → Listener receives same message from server → Duplicate message or flickering

**The Solution: De-duplication Logic**

```typescript
// lib/hooks/useMessages.ts - Enhanced with de-duplication

export const useMessages = (chatId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const messageStore = useMessageStore();

  useEffect(() => {
    const unsubscribe = firestore()
      .collection(`chats/${chatId}/messages`)
      .orderBy('timestamp', 'asc')
      .onSnapshot((snapshot) => {
        const serverMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];

        // MERGE: Combine server messages with optimistic messages
        const optimisticMessages = messageStore.messages.filter(
          msg => msg.status === 'sending' || msg.status === 'failed'
        );

        // De-duplicate: Remove optimistic messages that now have server versions
        const dedupedOptimistic = optimisticMessages.filter(
          optMsg => !serverMessages.some(serverMsg =>
            serverMsg.text === optMsg.text &&
            serverMsg.senderId === optMsg.senderId &&
            Math.abs(serverMsg.timestamp.toMillis() - optMsg.timestamp.toMillis()) < 5000
          )
        );

        // COMBINE: Server messages + remaining optimistic messages
        const allMessages = [
          ...serverMessages,
          ...dedupedOptimistic
        ].sort((a, b) =>
          a.timestamp.toMillis() - b.timestamp.toMillis()
        );

        setMessages(allMessages);
      });

    return () => unsubscribe();
  }, [chatId]);

  return { messages };
};
```

---

### 4.4 Poor Network Handling

#### **Network State Detection**

```typescript
// lib/hooks/useNetworkStatus.ts
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setConnectionType(state.type); // 'wifi', 'cellular', 'none'
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, connectionType };
};
```

---

#### **Connection Status UI**

```typescript
// components/common/ConnectionBanner.tsx
import { useNetworkStatus } from '../../lib/hooks/useNetworkStatus';

export function ConnectionBanner() {
  const { isConnected, connectionType } = useNetworkStatus();
  const pendingCount = useMessageStore(state =>
    state.messages.filter(m => m.status === 'sending').length
  );

  if (isConnected) return null; // Don't show when online

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        ⚠️ Offline - {pendingCount} message{pendingCount !== 1 ? 's' : ''} pending
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFA500',
    padding: 8,
    alignItems: 'center'
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
```

**Rubric Requirement: ✅ Clear UI indicators for connection status and pending messages**

---

#### **Firestore's Built-In Resilience**

**What Firestore Handles Automatically:**

1. **Exponential Backoff:** Retries failed requests with increasing delays
2. **Request Queuing:** Queues writes when offline, sends in order when reconnected
3. **Timeout Handling:** Times out slow requests, retries automatically
4. **Packet Loss Handling:** Detects and recovers from dropped packets

**You Don't Need to Implement:**
- Manual retry logic for Firestore operations (it's automatic)
- Request queuing (handled by native persistence)
- Timeout detection (Firestore does this)

**You DO Need to Implement:**
- User feedback (loading states, error messages)
- Optimistic UI (show messages before confirmation)
- Connection status indicators

---

### 4.5 Group Chat Message Delivery Tracking

#### **The Challenge: Read Receipts for Multiple Recipients**

**Naive Approach (Don't Do This):**
```typescript
// ❌ BAD: N queries for N participants
for (const participantId of chat.participants) {
  const hasRead = await checkIfUserRead(messageId, participantId);
  // This scales poorly
}
```

**Efficient Approach: Array-Union Updates**

**Data Model:**
```typescript
interface Message {
  // ... other fields
  readBy: string[]; // Array of user IDs who have read
}
```

**Mark as Read (Atomic Update):**
```typescript
// lib/firebase/firestore.ts
export const markMessageAsRead = async (
  chatId: string,
  messageId: string,
  userId: string
) => {
  await firestore()
    .collection(`chats/${chatId}/messages`)
    .doc(messageId)
    .update({
      readBy: firestore.FieldValue.arrayUnion(userId)
    });
};
```

**Why This Works:**
- ✅ `arrayUnion` is atomic (no race conditions)
- ✅ Only adds userId if not already present (no duplicates)
- ✅ Single write operation (efficient)

**Display Read Receipts:**
```typescript
// components/chat/ReadReceipt.tsx
export function ReadReceipt({ message, chat }) {
  const currentUserId = useAuthStore(state => state.user.id);

  // Only show for sent messages (not received)
  if (message.senderId !== currentUserId) return null;

  const totalParticipants = chat.participants.length;
  const readCount = message.readBy?.length || 0;
  const deliveredCount = totalParticipants; // Assume all participants received

  if (readCount === totalParticipants) {
    return <Text style={styles.read}>✓✓ Read by all</Text>;
  } else if (readCount > 1) {
    return <Text style={styles.delivered}>✓✓ Read by {readCount - 1}</Text>;
  } else {
    return <Text style={styles.sent}>✓ Delivered</Text>;
  }
}
```

**Detailed Read Receipt Modal:**
```typescript
// Long-press message → Show who read
export function ReadReceiptModal({ message, participants }) {
  const readByUsers = participants.filter(p =>
    message.readBy?.includes(p.id)
  );
  const unreadUsers = participants.filter(p =>
    !message.readBy?.includes(p.id)
  );

  return (
    <Modal>
      <Text>Read by ({readByUsers.length})</Text>
      {readByUsers.map(user => (
        <View key={user.id}>
          <Text>{user.name} ✓</Text>
        </View>
      ))}

      <Text>Not read yet ({unreadUsers.length})</Text>
      {unreadUsers.map(user => (
        <View key={user.id}>
          <Text>{user.name}</Text>
        </View>
      ))}
    </Modal>
  );
}
```

**Rubric Requirement: ✅ Read receipts show who's read each message**

---

### 4.6 App Lifecycle & Background Handling

#### **React Native App States:**

1. **Active:** App in foreground, fully interactive
2. **Background:** App not visible (home button pressed)
3. **Inactive:** Transitioning between states (e.g., phone call)

#### **Handling Background Messages**

**The Problem:**
User backgrounds app → receives message → needs to sync when foregrounding

**The Solution: AppState Listener**

```typescript
// lib/hooks/useAppState.ts
import { useEffect } from 'react';
import { AppState } from 'react-native';
import firestore from '@react-native-firebase/firestore';

export const useAppStateSync = () => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App foregrounded - sync triggered');
        // Firestore automatically syncs, but we can force it
        firestore().disableNetwork().then(() => {
          firestore().enableNetwork();
        });
      }
    });

    return () => subscription.remove();
  }, []);
};
```

**react-native-firebase Handles This Automatically:**
- ✅ Listeners persist in background (native code)
- ✅ Messages received while backgrounded sync on foreground
- ✅ No manual intervention needed

**Battery Efficiency:**
- Firestore uses persistent WebSocket connection
- Native code (not JavaScript) handles background updates
- Minimal battery impact (similar to native apps)

**Rubric Requirement: ✅ Battery efficient (no excessive background activity)**

---

### 4.7 The 20-Message Stress Test

**Rubric Requirement:**
> "Zero visible lag during rapid messaging (20+ messages)"

#### **Challenges:**

1. **UI Performance:** FlatList re-renders on every message
2. **Firestore Writes:** 20 simultaneous writes
3. **Optimistic Updates:** 20 messages added to state instantly
4. **Message Ordering:** Server timestamps may arrive out of order

#### **Solutions:**

**1. FlatList Optimization:**
```typescript
// components/messages/MessageList.tsx
import { FlashList } from '@shopify/flash-list'; // Better than FlatList

export function MessageList({ messages }) {
  const renderMessage = useCallback(({ item }) => (
    <MessageBubble message={item} />
  ), []);

  return (
    <FlashList
      data={messages}
      renderItem={renderMessage}
      estimatedItemSize={80} // Height of typical message bubble
      keyExtractor={(item) => item.id || item.tempId}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={20}
      windowSize={21}
      initialNumToRender={30}
    />
  );
}
```

**Why FlashList:**
- ✅ Up to 10x better performance than FlatList
- ✅ Better memory management
- ✅ Smooth 60 FPS even with 1000+ items

**2. Debounced State Updates:**
```typescript
// Prevent excessive re-renders
import { useDebouncedValue } from './hooks';

export function ChatScreen() {
  const messages = useMessageStore(state => state.messages);
  const debouncedMessages = useDebouncedValue(messages, 100); // 100ms debounce

  return <MessageList messages={debouncedMessages} />;
}
```

**3. Firestore Batching:**
```typescript
// For bulk operations (not typical user behavior, but good practice)
const batch = firestore().batch();

messages.forEach(msg => {
  const ref = firestore().collection(`chats/${chatId}/messages`).doc();
  batch.set(ref, msg);
});

await batch.commit(); // Single network round-trip
```

**4. Message Ordering with Timestamps:**

**The Problem:** Client timestamps can be wrong (device clock off)

**The Solution:** Server timestamps + client-side ordering

```typescript
// Always use server timestamp for canonical ordering
{
  timestamp: firestore.FieldValue.serverTimestamp(),
  clientTimestamp: new Date().toISOString() // Fallback for optimistic UI
}

// Query with server timestamp
.orderBy('timestamp', 'asc')
```

**Testing Script:**
```typescript
// Test 20 rapid messages
const testRapidMessages = async () => {
  const promises = [];
  for (let i = 0; i < 20; i++) {
    promises.push(
      sendMessage(chatId, `Rapid message ${i + 1}`, userId)
    );
  }
  await Promise.all(promises);
  console.log('20 messages sent simultaneously');
};
```

**Expected Result:**
- ✅ All 20 messages appear instantly (optimistic)
- ✅ UI remains smooth (60 FPS)
- ✅ All messages sync to server
- ✅ Correct ordering maintained

---

### 4.8 Common Pitfalls & Solutions

#### **Pitfall 1: Memory Leaks from Listeners**

**The Problem:**
```typescript
// ❌ BAD: Listener never detached
useEffect(() => {
  firestore()
    .collection('messages')
    .onSnapshot((snapshot) => {
      setMessages(snapshot.docs);
    });
  // Missing cleanup!
}, []);
```

**The Solution:**
```typescript
// ✅ GOOD: Cleanup function
useEffect(() => {
  const unsubscribe = firestore()
    .collection('messages')
    .onSnapshot((snapshot) => {
      setMessages(snapshot.docs);
    });

  return () => unsubscribe(); // Detach on unmount
}, []);
```

---

#### **Pitfall 2: Infinite Loops from Listener Dependencies**

**The Problem:**
```typescript
// ❌ BAD: Infinite loop
const [filter, setFilter] = useState({ chatId });

useEffect(() => {
  const unsubscribe = firestore()
    .collection('messages')
    .where('chatId', '==', filter.chatId)
    .onSnapshot(() => { /* ... */ });

  return () => unsubscribe();
}, [filter]); // Re-attaches every time filter object changes (even if chatId same)
```

**The Solution:**
```typescript
// ✅ GOOD: Depend on primitive value
useEffect(() => {
  const unsubscribe = firestore()
    .collection('messages')
    .where('chatId', '==', chatId)
    .onSnapshot(() => { /* ... */ });

  return () => unsubscribe();
}, [chatId]); // Only re-attaches when chatId changes
```

---

#### **Pitfall 3: Race Conditions in Optimistic Updates**

**The Problem:**
```typescript
// ❌ BAD: Race condition
const sendMessage = async (text) => {
  setMessages([...messages, optimisticMsg]); // Old messages array
  await firestore().add(msg);
  setMessages([...messages, serverMsg]); // Still old messages array
};
```

**The Solution:**
```typescript
// ✅ GOOD: Functional state updates
const sendMessage = async (text) => {
  setMessages(prev => [...prev, optimisticMsg]); // Latest state
  await firestore().add(msg);
  setMessages(prev => prev.map(m =>
    m.tempId === optimisticMsg.tempId ? serverMsg : m
  ));
};
```

---

#### **Pitfall 4: Timestamp Ordering Issues**

**The Problem:**
Messages appear out of order when clients have different clock times

**The Solution:**
Always use server timestamps for ordering:
```typescript
// ✅ GOOD: Server timestamp
{
  timestamp: firestore.FieldValue.serverTimestamp()
}

// Query
.orderBy('timestamp', 'asc')
```

---

#### **Pitfall 5: Security Rules Blocking Legitimate Writes**

**The Problem:**
```javascript
// ❌ BAD: Too restrictive
match /messages/{messageId} {
  allow write: if request.auth.uid == resource.data.senderId;
  // Blocks updates from other users (like read receipts)
}
```

**The Solution:**
```javascript
// ✅ GOOD: Allow participants to update
match /messages/{messageId} {
  allow create: if request.auth.uid == request.resource.data.senderId;
  allow update: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
}
```

---

## 5. Implementation Plan (PR-Based)

*This section contains the complete PR breakdown with all rubric requirements integrated*

### 5.1 Implementation Strategy

**Build in Phases:**
- **Phase 1 (Day 1):** MVP - Core messaging infrastructure
- **Phase 2 (Days 2-3):** AI Features
- **Phase 3 (Day 4):** Testing, Performance, Documentation

**PR Philosophy:**
- Each PR is a shippable increment
- Test before merging
- Merge to main frequently (at least daily)
- Use feature branches
- Parallel PRs where safe

**Git Workflow:**
```bash
main (protected)
├── feature/setup-and-auth (PR #1)
├── feature/core-ui (PR #2)
├── feature/realtime-messaging (PR #3)
├── feature/offline-support (PR #4) ─┐
├── feature/group-chat-notifications (PR #5) ─┘ (parallel)
├── feature/ai-infrastructure (PR #6)
├── feature/decision-priority (PR #7) ─┐
├── feature/rsvp-deadlines (PR #8) ─┘ (parallel)
├── feature/proactive-assistant (PR #9)
├── perf/launch-optimization (PR #10A)
├── fix/final-testing (PR #10B)
├── feature/bonus-features (PR #11A)
├── docs/final-submission (PR #11B)
└── feature/voice-video-calls (PR #12) (stretch)
```

---

### 5.2 Complete File Structure

```
messageai/
├── app/                          # Expo Router app directory
│   ├── (auth)/                   # Auth screens (stack)
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                   # Main app tabs
│   │   ├── _layout.tsx
│   │   ├── chats.tsx            # Chat list
│   │   ├── profile.tsx          # User profile
│   │   ├── deadlines.tsx        # Deadline list (AI feature)
│   │   └── ai-assistant.tsx     # AI chat interface
│   ├── (modal)/
│   │   └── create-group.tsx     # Group creation modal
│   ├── chat/
│   │   └── [id].tsx             # Dynamic chat detail screen
│   ├── _layout.tsx              # Root layout
│   └── index.tsx                # Entry point
│
├── components/
│   ├── messages/
│   │   ├── MessageBubble.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   ├── TypingIndicator.tsx
│   │   ├── ImageMessage.tsx
│   │   └── VoiceMessage.tsx
│   ├── chat/
│   │   ├── ChatListItem.tsx
│   │   ├── OnlineStatus.tsx
│   │   └── ReadReceipt.tsx
│   ├── group/
│   │   ├── MemberList.tsx
│   │   └── MemberListItem.tsx
│   ├── ai/
│   │   ├── CalendarEventCard.tsx
│   │   ├── DeadlineCard.tsx
│   │   ├── RSVPTracker.tsx
│   │   ├── PriorityBadge.tsx
│   │   ├── DecisionSummary.tsx
│   │   ├── ConflictAlert.tsx
│   │   ├── AILoadingSpinner.tsx
│   │   ├── AIErrorMessage.tsx
│   │   ├── SuggestionFeedback.tsx
│   │   ├── ReactionPicker.tsx
│   │   └── LinkPreview.tsx
│   └── common/
│       ├── ConnectionBanner.tsx
│       ├── PendingMessageIndicator.tsx
│       ├── ProgressiveImage.tsx
│       ├── ErrorBoundary.tsx
│       └── LoadingSpinner.tsx
│
├── lib/
│   ├── firebase/
│   │   ├── config.ts            # Firebase initialization
│   │   ├── auth.ts              # Auth helpers
│   │   ├── firestore.ts         # Firestore helpers
│   │   ├── messaging.ts         # Push notification setup
│   │   └── presence.ts          # Online/offline presence
│   ├── store/
│   │   ├── authStore.ts         # Zustand: auth state
│   │   ├── chatStore.ts         # Zustand: chats state
│   │   └── messageStore.ts      # Zustand: messages state
│   ├── ai/
│   │   ├── calendar-extraction.ts
│   │   ├── decision-summary.ts
│   │   ├── priority-detection.ts
│   │   ├── rsvp-tracking.ts
│   │   ├── deadline-extraction.ts
│   │   └── proactive-assistant.ts
│   ├── hooks/
│   │   ├── useMessages.ts
│   │   ├── useChats.ts
│   │   ├── useAuth.ts
│   │   ├── useNetworkStatus.ts
│   │   └── useAppState.ts
│   ├── theme/
│   │   ├── colors.ts
│   │   └── ThemeProvider.tsx
│   └── utils/
│       ├── date-utils.ts
│       ├── message-utils.ts
│       ├── offline-queue.ts
│       ├── performance-monitor.ts
│       ├── performance-logger.ts
│       └── lazy-load.ts
│
├── types/
│   ├── message.ts
│   ├── chat.ts
│   ├── user.ts
│   └── ai.ts
│
├── functions/                    # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts
│   │   ├── ai/
│   │   │   ├── calendar.ts
│   │   │   ├── decision.ts
│   │   │   ├── priority.ts
│   │   │   ├── rsvp.ts
│   │   │   ├── deadline.ts
│   │   │   ├── proactive.ts
│   │   │   └── transcription.ts
│   │   └── utils/
│   │       ├── openai-client.ts
│   │       ├── langchain-setup.ts
│   │       └── link-unfurl.ts
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   ├── plans/
│   │   └── 2025-01-20-messageai-prd.md (this document)
│   ├── architecture/
│   │   ├── system-architecture.png
│   │   ├── data-flow.png
│   │   └── component-hierarchy.png
│   ├── PERFORMANCE.md
│   ├── BATTERY_OPTIMIZATION.md
│   └── PERSONA_BRAINLIFT.md
│
├── assets/
│   ├── images/
│   └── fonts/
│
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── package.json
├── tsconfig.json
├── app.json
├── eas.json                     # EAS Build config for custom dev client
└── README.md
```

---

### 5.3 Detailed PR Breakdown

## **PHASE 1: MVP (Day 1 - 24 hours)**

---

### **PR #1: Project Setup + Authentication**

**Branch:** `feature/setup-and-auth`
**Time:** 2-3 hours
**Rubric Impact:** Technical Implementation (5 pts)
**Dependencies:** None

**Tasks:**

**PR #1.1: Initialize Expo custom dev client project**
- **Commands:**
  ```bash
  npx create-expo-app messageai --template blank-typescript
  cd messageai
  npx expo install expo-dev-client
  eas build:configure
  ```
- **Files Created:**
  - `package.json`
  - `app.json`
  - `eas.json`
  - `tsconfig.json`
  - `.gitignore`
- **Validation:**
  - ✅ `npx expo start` runs without errors
  - ✅ TypeScript compilation works

**PR #1.2: Install and configure react-native-firebase**
- **Commands:**
  ```bash
  npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/messaging
  ```
- **Files Edited:**
  - `package.json`
  - `app.json` (add Firebase plugin)
- **Validation:**
  - ✅ Build completes: `eas build --profile development --platform ios`
  - ✅ Firebase modules import without errors

**PR #1.3: Create Firebase project and configuration**
- **Files Created:**
  - `lib/firebase/config.ts`
  - `google-services.json` (Android - download from Firebase Console)
  - `GoogleService-Info.plist` (iOS - download from Firebase Console)
  - `firebase.json`
  - `firestore.rules`
  - `firestore.indexes.json`
- **Validation:**
  - ✅ Firebase project created in console
  - ✅ Firebase initializes: `firebase.apps.length > 0`

**PR #1.4: Build authentication screens and logic**
- **Files Created:**
  - `app/(auth)/login.tsx`
  - `app/(auth)/signup.tsx`
  - `lib/firebase/auth.ts`
  - `types/user.ts`
- **Validation:**
  - ✅ Can navigate to login/signup screens
  - ✅ Auth functions defined

**PR #1.5: Setup auth state management with Zustand**
- **Files Created:**
  - `lib/store/authStore.ts`
  - `lib/hooks/useAuth.ts`
- **Files Edited:**
  - `app/_layout.tsx`
- **Validation:**
  - ✅ Auth state persists across screens
  - ✅ `useAuth()` hook works

**PR #1.6: Validate authentication flow**
- **Test Cases:**
  - ✅ Sign up creates user
  - ✅ Login with correct credentials works
  - ✅ Login with wrong credentials fails
  - ✅ Auth state persists after app restart
  - ✅ Logout clears auth state

**Commit & Push:**
```bash
git checkout -b feature/setup-and-auth
git add .
git commit -m "feat: project setup and authentication

- Initialize Expo custom dev client
- Configure react-native-firebase
- Setup Firebase project
- Implement authentication screens
- Add auth state management with Zustand
- Test authentication flow

Rubric: Technical Implementation (5 pts)"
git push origin feature/setup-and-auth
```

---

*(Due to length constraints, I'll write the remaining PRs in the next response. This document is already very comprehensive. Should I continue with the remaining PRs or would you like me to finalize this PRD and save it?)*

---

**Current Progress:**
- ✅ Section 1: Executive Summary
- ✅ Section 2: User Persona Deep Dive
- ✅ Section 3: Technical Architecture
- ✅ Section 4: Core Messaging Infrastructure Deep Dive (complete 8 pages)
- ⏳ Section 5: Implementation Plan (PR #1 detailed, need to complete PR #2-#12)
- ⏳ Section 6: Stretch Goals
- ⏳ Section 7: Rubric Alignment

**Should I:**
**A) Continue writing all PRs in detail** (will be very long, 30+ pages total)
**B) Finish with summarized PRs** (referring to the detailed breakdown we already discussed)
**C) Save this PRD now and create a separate "Implementation Guide" document with all PR details

**What's your preference?**
