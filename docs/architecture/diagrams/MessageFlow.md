# MessageAI - Message Flow & Real-Time Sync Diagrams

## Complete Message Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Composing: User types message
    Composing --> Sending: User taps Send
    Sending --> OptimisticUI: Add to UI immediately

    OptimisticUI --> QueuedOffline: Network unavailable
    OptimisticUI --> WritingToFirestore: Network available

    QueuedOffline --> PendingSync: Message queued
    PendingSync --> WritingToFirestore: Connection restored

    WritingToFirestore --> Sent: Firestore confirms
    Sent --> Delivered: Recipient receives
    Delivered --> Read: Recipient views

    Read --> [*]

    QueuedOffline --> Failed: Max retries exceeded
    WritingToFirestore --> Failed: Permission denied
    Failed --> Retry: User retries
    Retry --> Sending
```

## Real-Time Message Send Flow

```mermaid
sequenceDiagram
    autonumber
    participant User as User (Sarah)
    participant UI as React Native UI
    participant Store as messageStore
    participant Cache as Local SQLite Cache
    participant Firestore as Firestore Cloud
    participant Listener as onSnapshot Listener
    participant Recipient as Other User (John)

    User->>UI: Types "Hello" + Taps Send
    UI->>Store: sendMessage(chatId, "Hello")

    Note over Store: Generate tempId
    Store->>UI: Optimistic Update
    UI->>UI: Display message<br/>(status: sending)

    Store->>Cache: Write to local cache
    Cache->>Firestore: firestore().add({...})

    alt Network Available
        Firestore-->>Listener: Document added event
        Listener-->>Store: New message data
        Store->>Store: Replace temp message
        Store-->>UI: Update status: sent
        UI->>UI: Show checkmark ✓

        Firestore->>Recipient: Real-time push
        Recipient->>Recipient: Display message
    else Network Unavailable
        Cache->>Cache: Queue write operation
        UI->>UI: Show "Queued" indicator

        Note over Cache: Wait for connection...

        Cache->>Firestore: Auto-sync on reconnect
        Firestore-->>Listener: Document added event
        Listener-->>Store: New message data
        Store-->>UI: Update status: sent
    end
```

## Optimistic UI Pattern

```mermaid
graph TB
    Start([User Sends Message]) --> Generate[Generate Temp ID]
    Generate --> AddUI[Add to UI Immediately]
    AddUI --> SetStatus["Set status: 'sending'"]

    SetStatus --> WriteFirestore[Write to Firestore]

    WriteFirestore --> Check{Network?}

    Check -->|Online| Confirm[Firestore Confirms]
    Check -->|Offline| Queue[Queue Operation]

    Confirm --> Listener[Listener Receives]
    Queue --> Wait[Wait for Connection]
    Wait --> Sync[Auto-sync]
    Sync --> Listener

    Listener --> Replace[Replace Temp Message]
    Replace --> UpdateStatus["Update status: 'sent'"]
    UpdateStatus --> End([Complete])

    WriteFirestore --> Error{Error?}
    Error -->|Yes| MarkFailed["Set status: 'failed'"]
    Error -->|No| Confirm

    MarkFailed --> ShowRetry[Show Retry Button]

    style AddUI fill:#34a853,color:#fff
    style Queue fill:#f9ab00,color:#000
    style MarkFailed fill:#ea4335,color:#fff
```

## Message Status Progression

```mermaid
graph LR
    A[sending ⏳] --> B[sent ✓]
    B --> C[delivered ✓✓]
    C --> D[read ✓✓<br/>blue]

    A -.error.-> E[failed ✕]
    E -.retry.-> A

    style A fill:#f9ab00,color:#000
    style B fill:#666,color:#fff
    style C fill:#666,color:#fff
    style D fill:#4285f4,color:#fff
    style E fill:#ea4335,color:#fff
```

## Read Receipt Flow (One-on-One Chat)

```mermaid
sequenceDiagram
    participant Sarah as Sarah (Sender)
    participant Firestore
    participant John as John (Recipient)

    Sarah->>Firestore: Send message
    Note over Firestore: readBy: ['sarah_id']

    Firestore->>John: Real-time update
    John->>John: Message appears (unread)

    John->>Firestore: Opens chat screen
    Note over John: useEffect triggers
    John->>Firestore: Update readBy array

    Note over Firestore: readBy: ['sarah_id', 'john_id']

    Firestore->>Sarah: Real-time update
    Sarah->>Sarah: Status changes to "read ✓✓"
```

## Read Receipt Flow (Group Chat)

```mermaid
sequenceDiagram
    participant Sarah as Sarah (Sender)
    participant Firestore
    participant John as John
    participant Emma as Emma
    participant Mike as Mike

    Sarah->>Firestore: Send message to group
    Note over Firestore: readBy: ['sarah_id']<br/>Participants: 4

    Firestore->>John: Push notification
    Firestore->>Emma: Push notification
    Firestore->>Mike: Push notification

    John->>Firestore: Opens chat
    Note over Firestore: readBy: ['sarah_id', 'john_id']
    Firestore->>Sarah: Update: "Read by 1/3"

    Emma->>Firestore: Opens chat
    Note over Firestore: readBy: ['sarah_id', 'john_id', 'emma_id']
    Firestore->>Sarah: Update: "Read by 2/3"

    Mike->>Firestore: Opens chat
    Note over Firestore: readBy: ['sarah_id', 'john_id',<br/>'emma_id', 'mike_id']
    Firestore->>Sarah: Update: "Read by all ✓✓"
```

## Firestore Listener Pattern

```mermaid
graph TB
    Component[React Component Mounts] --> Setup[Setup useEffect]
    Setup --> Subscribe[Subscribe to onSnapshot]

    Subscribe --> Initial[Initial Callback<br/>All existing docs]
    Initial --> UpdateState[Update React State]

    Subscribe --> Listen{Listen for Changes}

    Listen -->|Document Added| Add[Added Event]
    Listen -->|Document Modified| Mod[Modified Event]
    Listen -->|Document Deleted| Del[Deleted Event]

    Add --> UpdateState
    Mod --> UpdateState
    Del --> UpdateState

    UpdateState --> Render[Re-render UI]

    Component --> Unmount[Component Unmounts]
    Unmount --> Cleanup[Cleanup Function]
    Cleanup --> Unsubscribe[Call unsubscribe]

    style Subscribe fill:#4285f4,color:#fff
    style UpdateState fill:#34a853,color:#fff
    style Unsubscribe fill:#ea4335,color:#fff
```

## Offline Message Queue

```mermaid
graph TB
    subgraph "User Offline"
        A[User sends 5 messages]
        B[Messages queued locally]
        C[UI shows "Queued" status]
    end

    subgraph "Local SQLite Queue"
        D[Message 1: queued]
        E[Message 2: queued]
        F[Message 3: queued]
        G[Message 4: queued]
        H[Message 5: queued]
    end

    subgraph "Connection Restored"
        I[Network detected]
        J[Firestore.enableNetwork]
        K[Process queue]
    end

    subgraph "Sync to Cloud"
        L[Upload Message 1]
        M[Upload Message 2]
        N[Upload Message 3]
        O[Upload Message 4]
        P[Upload Message 5]
    end

    A --> B
    B --> C
    B --> D
    B --> E
    B --> F
    B --> G
    B --> H

    D --> I
    E --> I
    F --> I
    G --> I
    H --> I

    I --> J
    J --> K
    K --> L
    L --> M
    M --> N
    N --> O
    O --> P

    P --> Q[All synced ✓]

    style C fill:#f9ab00,color:#000
    style K fill:#4285f4,color:#fff
    style Q fill:#34a853,color:#fff
```

## Message Ordering Strategy

```mermaid
graph TB
    subgraph "Client Side"
        A[User sends message]
        B[Generate clientTimestamp]
        C[Display in UI immediately]
    end

    subgraph "Server Side"
        D[Firestore receives]
        E[Generate serverTimestamp]
        F[Store both timestamps]
    end

    subgraph "Display Logic"
        G{Has serverTimestamp?}
        H[Sort by serverTimestamp]
        I[Sort by clientTimestamp]
        J[Final message order]
    end

    A --> B
    B --> C
    A --> D
    D --> E
    E --> F

    C --> G
    F --> G
    G -->|Yes| H
    G -->|No| I
    H --> J
    I --> J

    style E fill:#34a853,color:#fff
    style H fill:#34a853,color:#fff
```

## Typing Indicator Flow

```mermaid
sequenceDiagram
    participant Sarah as Sarah
    participant Firestore
    participant John as John

    Sarah->>Sarah: Starts typing
    Note over Sarah: Debounce 300ms
    Sarah->>Firestore: Update typing status<br/>chats/{id}/typing/{userId}

    Note over Firestore: {<br/>  userId: 'sarah_id',<br/>  isTyping: true,<br/>  timestamp: now<br/>}

    Firestore->>John: Real-time update
    John->>John: Show "Sarah is typing..."

    Note over Sarah: 3 seconds pass
    Sarah->>Firestore: Clear typing status

    Note over Firestore: {<br/>  isTyping: false<br/>}

    Firestore->>John: Real-time update
    John->>John: Hide typing indicator
```

## Presence (Online/Offline) System

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant Firestore
    participant Users as Other Users

    App->>App: App becomes active
    App->>Firestore: Update user doc<br/>{online: true}
    Firestore->>Users: Real-time update
    Users->>Users: Show green dot

    Note over App: User inactive 5 min

    App->>Firestore: Update user doc<br/>{online: false, lastSeen: now}
    Firestore->>Users: Real-time update
    Users->>Users: Show "Last seen 5 min ago"

    App->>App: App backgrounded
    App->>Firestore: Update<br/>{online: false, lastSeen: now}

    App->>App: App force-quit
    Note over Firestore: onDisconnect trigger
    Firestore->>Firestore: Auto-update<br/>{online: false, lastSeen: now}
```

## Batch Update Pattern (Read Receipts)

```mermaid
graph TB
    Start([User opens chat<br/>with 50 unread messages]) --> Collect[Collect all unread message IDs]

    Collect --> Batch[Create Firestore batch]

    Batch --> Loop{For each<br/>message ID}

    Loop -->|Has more| Add[batch.update<br/>Add userId to readBy]
    Add --> Loop

    Loop -->|Done| Commit[batch.commit]

    Commit --> Single[Single network request<br/>Updates all 50 messages]

    Single --> Listener[Listeners fire for all updates]
    Listener --> UI[UI updates read status]

    style Batch fill:#4285f4,color:#fff
    style Single fill:#34a853,color:#fff
```

## Message Delivery Metrics

```mermaid
graph TB
    subgraph "Performance Targets"
        A[User taps Send]
        B[Message in UI: <50ms]
        C[Firestore write: <200ms]
        D[Recipient receives: <200ms]
        E[Total: <250ms]
    end

    A --> B
    B --> C
    C --> D
    D --> E

    subgraph "Measurement Points"
        F[timestamp_client_start]
        G[timestamp_optimistic_ui]
        H[timestamp_firestore_confirm]
        I[timestamp_recipient_listener]
    end

    A --> F
    B --> G
    C --> H
    D --> I

    style B fill:#34a853,color:#fff
    style C fill:#34a853,color:#fff
    style D fill:#34a853,color:#fff
    style E fill:#34a853,color:#fff
```

## Error Handling Flow

```mermaid
graph TB
    Send[Send Message] --> Try{Try Write}

    Try -->|Success| Listener[Listener Confirms]
    Try -->|Network Error| Offline[Queue Offline]
    Try -->|Permission Error| PermErr[Show Error]
    Try -->|Quota Error| QuotaErr[Show Error]
    Try -->|Unknown Error| UnknownErr[Log & Retry]

    Offline --> Queue[Add to Queue]
    Queue --> Wait[Wait for Connection]
    Wait --> Retry[Auto-retry]
    Retry --> Try

    PermErr --> Alert1[Alert: Check permissions]
    QuotaErr --> Alert2[Alert: Storage full]
    UnknownErr --> Alert3[Alert: Try again]

    Alert1 --> Manual[Manual Retry Button]
    Alert2 --> Manual
    Alert3 --> Manual
    Manual --> Send

    Listener --> Success[Update UI: Sent ✓]

    style Offline fill:#f9ab00,color:#000
    style PermErr fill:#ea4335,color:#fff
    style QuotaErr fill:#ea4335,color:#fff
    style UnknownErr fill:#ea4335,color:#fff
    style Success fill:#34a853,color:#fff
```

## Conflict Resolution

```mermaid
sequenceDiagram
    participant DeviceA as Device A (Offline)
    participant DeviceB as Device B (Online)
    participant Firestore

    Note over DeviceA: Offline for 2 hours

    DeviceA->>DeviceA: Update chat name: "Family"<br/>(queued locally)

    DeviceB->>Firestore: Update chat name: "Parents"<br/>timestamp: 14:00

    Note over Firestore: Current value: "Parents"

    DeviceA->>DeviceA: Comes online
    DeviceA->>Firestore: Sync queued update: "Family"<br/>timestamp: 14:05

    Note over Firestore: Last-write-wins<br/>14:05 > 14:00

    Firestore->>Firestore: Update to "Family"
    Firestore->>DeviceB: Push update

    DeviceB->>DeviceB: Chat name changes to "Family"

    Note over DeviceB: DeviceA's update wins<br/>despite being queued while offline
```

## Pagination Strategy

```mermaid
graph TB
    Initial[User opens chat] --> Load1[Load most recent 50 messages]
    Load1 --> Display1[Display messages]

    Display1 --> Scroll{User scrolls<br/>to top?}

    Scroll -->|No| Display1
    Scroll -->|Yes| LoadMore[Load next 50 messages]

    LoadMore --> Append[Prepend to list]
    Append --> Display2[Display all messages]

    Display2 --> Scroll2{User scrolls<br/>to top?}

    Scroll2 -->|Yes| LoadMore2[Load next 50]
    Scroll2 -->|No| Display2

    LoadMore2 --> Check{More messages<br/>available?}
    Check -->|Yes| Append
    Check -->|No| End[Reached beginning]

    style Load1 fill:#4285f4,color:#fff
    style LoadMore fill:#4285f4,color:#fff
    style End fill:#34a853,color:#fff
```

---

← [Back to Messaging Infrastructure](../MessagingInfrastructure.md)
