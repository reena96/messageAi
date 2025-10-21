# MessageAI - Technical Architecture

**Version:** 1.0
**Date:** January 20, 2025

← [Back to Main PRD](./01-messageai-prd.md)

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [System Architecture](#2-system-architecture)
3. [Data Models](#3-data-models)
4. [Security & Firestore Rules](#4-security--firestore-rules)
5. [Performance Targets](#5-performance-targets)

---

## 1. Tech Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo Custom Dev Client** - Enables native modules + Expo ecosystem
- **TypeScript** - Type safety, better DX
- **Expo Router** - File-based navigation
- **Zustand** - Lightweight state management
- **react-native-reanimated** - 60 FPS animations
- **@shopify/flash-list** - Performant list rendering

### Backend
- **Firebase Firestore** - Real-time NoSQL database, offline-first
- **Firebase Authentication** - Email/password auth
- **Firebase Cloud Functions** - Serverless AI processing (Node.js/TypeScript)
- **Firebase Cloud Messaging (FCM)** - Push notifications
- **Firebase Storage** - User avatars, images, voice messages

### Local Storage
- **@react-native-firebase/firestore** - Native offline persistence (SQLite)
- **expo-sqlite** - Optional backup for local caching

### AI Stack
- **OpenAI GPT-4 Turbo** - LLM for all AI features
- **AI SDK by Vercel** - 5 required features (simple extractions)
- **LangChain** - Advanced feature (Proactive Assistant)
- **RAG Pipeline** - Conversation history retrieval

### Additional Libraries
```json
{
  "expo-image": "Progressive image loading with blurhash",
  "expo-notifications": "Push notification handling",
  "expo-av": "Voice message recording (bonus)",
  "@react-native-community/netinfo": "Network status detection",
  "react-native-gesture-handler": "Gesture support",
  "zustand": "State management"
}
```

---

## 2. System Architecture

📊 **[View Visual Diagrams](./diagrams/SystemArchitecture.md)** - Interactive Mermaid diagrams showing all architecture layers, component dependencies, and data flows.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Mobile App Layer                        │
│         (React Native + Expo Custom Dev Client)          │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Screens    │  │  Components  │  │   Zustand    │  │
│  │  (Expo       │  │  (Messages,  │  │   Stores     │  │
│  │   Router)    │  │   Chat, AI)  │  │              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│         └─────────────────┴─────────────────┘           │
└───────────────────────────┼─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│           Local Storage Layer (Offline Support)          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  react-native-firebase Native SQLite Cache       │   │
│  │  • Message queue for offline sends               │   │
│  │  • Local message persistence                     │   │
│  │  • Auto-sync on reconnection                     │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Firebase Backend                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Firestore   │  │   Firebase   │  │    Cloud     │  │
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
│                 AI Processing Layer                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │           OpenAI GPT-4 Turbo API                 │   │
│  │  • Calendar extraction (function calling)        │   │
│  │  • Decision summarization (JSON mode)            │   │
│  │  • Priority detection (classification)           │   │
│  │  • RSVP tracking (structured extraction)         │   │
│  │  • Deadline extraction (function calling)        │   │
│  │  • Proactive Assistant (LangChain + RAG)         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Message Flow

```
User Sends Message:
  1. User types message, taps Send
  2. OPTIMISTIC: Add to UI immediately (tempId, status: "sending")
  3. Write to Firestore (or queue if offline)
  4. Firestore confirms → UPDATE: status = "sent"
  5. Recipient's listener receives → displays message
  6. Recipient views chat → UPDATE: readBy array
  7. Sender sees read receipt

Offline Scenario:
  1. User offline → message queued in local SQLite
  2. Message shows "sending..." in UI
  3. Connection returns → Firestore auto-sends queued writes
  4. Listener updates status to "sent"
```

---

## 3. Data Models

📊 **[View Data Model Diagrams](./diagrams/DataModels.md)** - Entity relationship diagrams, collection structures, and data relationship visualizations.

### Users Collection: `/users/{userId}`

```typescript
interface User {
  id: string;                  // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;           // Profile picture URL
  online: boolean;             // Real-time presence
  lastSeen: Timestamp;         // Last active time
  fcmToken?: string;           // For push notifications
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `online` (for filtering online users)
- `lastSeen` (for sorting by activity)

---

### Chats Collection: `/chats/{chatId}`

```typescript
interface Chat {
  id: string;
  type: 'one-on-one' | 'group';
  participants: string[];      // Array of user IDs
  
  // Denormalized for performance
  participantData: {
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
  createdBy?: string;          // User who created group
}
```

**Indexes:**
- `participants` (array-contains for user's chats)
- `updatedAt` (for sorting chat list)

---

### Messages Subcollection: `/chats/{chatId}/messages/{messageId}`

```typescript
interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;        // Server timestamp (canonical)
  status: 'sending' | 'sent' | 'delivered' | 'read';

  // Read receipts
  readBy: string[];            // Array of user IDs who read

  // Client-side only (optimistic UI)
  tempId?: string;             // Temporary ID before server assigns
  clientTimestamp?: Date;      // Fallback for ordering

  // Media (optional)
  imageUrl?: string;
  voiceUrl?: string;
  voiceDuration?: number;      // Seconds

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

**Indexes:**
- `timestamp` (for ordering messages)
- `senderId` (for filtering by sender)

---

### AI-Specific Types

```typescript
interface CalendarEvent {
  event: string;               // "Soccer practice"
  date: string;                // ISO date: "2025-01-22"
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
  reminder?: Timestamp;        // When to send notification
  completed: boolean;
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

## 4. Security & Firestore Rules

### Security Principles

1. **Authentication Required:** All reads/writes require authenticated user
2. **User Privacy:** Users can only access chats they're participants in
3. **Data Validation:** Enforce data types, prevent malicious data
4. **Rate Limiting:** Prevent abuse (handled by Cloud Functions)

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Users Collection
    match /users/{userId} {
      // Users can read any user (for profiles, online status)
      allow read: if isSignedIn();
      
      // Users can only write their own document
      allow write: if isOwner(userId);
    }

    // Chats Collection
    match /chats/{chatId} {
      // Can read if you're a participant
      allow read: if isSignedIn() && 
                     request.auth.uid in resource.data.participants;
      
      // Can create if you're in the participants list
      allow create: if isSignedIn() && 
                       request.auth.uid in request.resource.data.participants;
      
      // Can update if you're a participant (for lastMessage, unreadCount)
      allow update: if isSignedIn() && 
                       request.auth.uid in resource.data.participants;
      
      // Can delete if you created it
      allow delete: if isSignedIn() && 
                       request.auth.uid == resource.data.createdBy;

      // Messages Subcollection
      match /messages/{messageId} {
        // Can read if you're a participant of the parent chat
        allow read: if isSignedIn() && 
                       request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        
        // Can create if you're a participant AND you're the sender
        allow create: if isSignedIn() && 
                         request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants &&
                         request.auth.uid == request.resource.data.senderId;
        
        // Can update if you're a participant (for read receipts)
        allow update: if isSignedIn() && 
                         request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        
        // Can delete only your own messages
        allow delete: if isSignedIn() && 
                         request.auth.uid == resource.data.senderId;
      }
    }
  }
}
```

### API Key Security

**Never expose API keys in client code!**

```typescript
// ✅ GOOD: API keys in Cloud Functions (server-side)
// functions/src/index.ts
import { defineSecret } from 'firebase-functions/params';

const openaiApiKey = defineSecret('OPENAI_API_KEY');

export const calendarExtraction = onCall(
  { secrets: [openaiApiKey] },
  async (request) => {
    const apiKey = openaiApiKey.value();
    // Use apiKey securely
  }
);
```

```typescript
// ❌ BAD: Never do this!
const OPENAI_API_KEY = "sk-..."; // Exposed in client bundle
```

**Set secrets:**
```bash
firebase functions:secrets:set OPENAI_API_KEY
```

---

## 5. Performance Targets

### Rubric Requirements

| Metric | Target | Measurement Method | Where to Optimize |
|--------|--------|-------------------|-------------------|
| App launch to chat screen | <2 seconds | React Native Performance Monitor | Code splitting, lazy loading, minimize initial bundle |
| Message delivery (good network) | <200ms | Custom performance logger | Native Firestore listeners, minimal processing |
| Offline sync after reconnection | <1 second | Custom performance logger | Batch sync, efficient Firestore queries |
| Scrolling through 1000+ messages | 60 FPS | React DevTools Profiler | FlashList, getItemLayout, removeClippedSubviews |
| AI simple commands | <2 seconds | Cloud Function logs | Optimized prompts, function calling, caching |
| Advanced AI (Proactive Assistant) | <15 seconds | Cloud Function logs | Response streaming, optimized LangChain chains |
| Typing indicator lag | <100ms | Manual testing | Debounced updates, Firestore realtime listeners |
| Presence update lag | <100ms | Manual testing | Native listeners, minimal state updates |

### Firestore Query Optimization

**Indexes Required:**
```json
{
  "indexes": [
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "chatId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "chats",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "participants", "arrayConfig": "CONTAINS" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Query Limits:**
- Initial message load: 50 messages
- Pagination: 50 messages per page
- Chat list: 100 chats
- Real-time listener: Limit to active chat only

---

## File Structure

```
messageai/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── chats.tsx
│   │   ├── profile.tsx
│   │   ├── deadlines.tsx
│   │   └── ai-assistant.tsx
│   ├── (modal)/
│   │   └── create-group.tsx
│   ├── chat/
│   │   └── [id].tsx
│   ├── _layout.tsx
│   └── index.tsx
│
├── components/
│   ├── messages/
│   ├── chat/
│   ├── group/
│   ├── ai/
│   └── common/
│
├── lib/
│   ├── firebase/
│   ├── store/
│   ├── ai/
│   ├── hooks/
│   ├── theme/
│   └── utils/
│
├── types/
│   ├── message.ts
│   ├── chat.ts
│   ├── user.ts
│   └── ai.ts
│
├── functions/
│   ├── src/
│   │   ├── index.ts
│   │   ├── ai/
│   │   └── utils/
│   └── package.json
│
└── docs/
    └── plans/
        ├── 01-messageai-prd.md
        ├── 02-technical-architecture.md (this file)
        ├── 03-messaging-infrastructure.md
        ├── 04-implementation-guide.md
        └── 05-rubric-alignment.md
```

---

**Next:** Read [03-messaging-infrastructure.md](./03-messaging-infrastructure.md) for deep dive on offline-first patterns.
