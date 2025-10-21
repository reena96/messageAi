# MessageAI - Offline-First Architecture Diagrams

## Offline-First Philosophy

```mermaid
mindmap
  root((Offline-First<br/>Design))
    Core Principles
      Local-first storage
      Optimistic updates
      Background sync
      Conflict resolution
    User Benefits
      Works anywhere
      No loading spinners
      Instant interactions
      Reliable experience
    Technical Implementation
      SQLite cache
      Write queue
      Auto-retry
      Server timestamps
```

## Complete Offline Flow

```mermaid
stateDiagram-v2
    [*] --> Online: App starts with connection

    Online --> CheckingNetwork: Monitor network status
    CheckingNetwork --> Online: Connection stable
    CheckingNetwork --> Offline: Connection lost

    Offline --> QueueingWrites: User sends messages
    QueueingWrites --> PendingSync: Messages queued
    PendingSync --> Offline: Still no connection
    PendingSync --> Syncing: Connection restored

    Syncing --> ProcessQueue: Upload queued data
    ProcessQueue --> UpdatingUI: Confirm writes
    UpdatingUI --> Online: Sync complete

    Online --> ReadingCache: User opens chat
    ReadingCache --> DisplayData: Show cached data
    DisplayData --> Online: Continue using app

    Note right of QueueingWrites: All writes go to local queue<br/>UI shows "Sending..." status
    Note right of Syncing: Automatic background process<br/>No user intervention needed
```

## Offline Scenario 1: Send While Offline

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant UI
    participant LocalCache as SQLite Cache
    participant NetworkMonitor
    participant Firestore

    User->>UI: Send message
    UI->>NetworkMonitor: Check connection

    NetworkMonitor-->>UI: Offline

    UI->>LocalCache: Store in queue
    LocalCache-->>UI: Queued successfully

    UI->>UI: Display message<br/>Status: "Queued"

    Note over User,Firestore: Time passes... (seconds to hours)

    NetworkMonitor->>NetworkMonitor: Detects connection

    NetworkMonitor->>LocalCache: Trigger sync
    LocalCache->>Firestore: Upload queued writes

    Firestore-->>LocalCache: Confirm writes
    LocalCache->>UI: Update status
    UI->>UI: Show "Sent ✓"
```

## Offline Scenario 2: Receive While Offline

```mermaid
sequenceDiagram
    participant User as User (Offline)
    participant LocalCache as Local Cache
    participant Firestore
    participant Sender as Other User (Online)

    Sender->>Firestore: Send message

    Note over User,Firestore: User is offline - doesn't receive yet

    Firestore->>Firestore: Store message

    Note over User: User comes online

    User->>Firestore: Reconnect
    Firestore->>Firestore: Detect connection
    Firestore->>User: Push missed messages

    User->>LocalCache: Store in cache
    LocalCache->>User: Update UI

    User->>User: Display new messages<br/>with notification
```

## Offline Scenario 3: App Force-Quit

```mermaid
graph TB
    Start([User using app offline]) --> Send1[Send Message 1]
    Send1 --> Queue1[Queue in SQLite]
    Queue1 --> Send2[Send Message 2]
    Send2 --> Queue2[Queue in SQLite]

    Queue2 --> ForceQuit[User force-quits app]
    ForceQuit --> Persist[Writes persisted to disk]

    Persist --> Wait[App closed for hours]

    Wait --> Reopen[User reopens app]
    Reopen --> Init[App initializes]
    Init --> CheckQueue{Check SQLite<br/>for queued writes?}

    CheckQueue -->|Yes| Found[Found 2 pending messages]
    Found --> Network{Network<br/>available?}

    Network -->|Yes| Sync[Sync immediately]
    Network -->|No| WaitOnline[Wait for connection]

    WaitOnline --> Sync
    Sync --> Complete[Messages sent ✓]

    style ForceQuit fill:#ea4335,color:#fff
    style Persist fill:#34a853,color:#fff
    style Complete fill:#34a853,color:#fff
```

## Network State Management

```mermaid
graph TB
    subgraph "Network Monitoring"
        A[NetInfo Listener]
        B[Connection Type]
        C[Internet Reachable]
    end

    A --> B
    A --> C

    B --> WiFi[WiFi]
    B --> Cellular[Cellular 3G/4G/5G]
    B --> None[No Connection]

    C --> Yes[Internet Available]
    C --> No[No Internet]
    C --> Unknown[Unknown]

    subgraph "App State"
        D[Online Mode]
        E[Offline Mode]
        F[Poor Connection Mode]
    end

    WiFi --> Yes
    Cellular --> Yes
    Yes --> D

    WiFi --> No
    Cellular --> No
    None --> E
    No --> E

    Cellular --> Unknown
    Unknown --> F

    subgraph "UI Indicators"
        G[Green: Online]
        H[Red: Offline]
        I[Yellow: Poor Connection]
    end

    D --> G
    E --> H
    F --> I

    style D fill:#34a853,color:#fff
    style E fill:#ea4335,color:#fff
    style F fill:#f9ab00,color:#000
```

## SQLite Cache Architecture

```mermaid
graph TB
    subgraph "React Native Firebase"
        A[Native Module]
        B[Firestore SDK]
    end

    subgraph "Native SQLite Cache"
        C[Query Cache]
        D[Write Queue]
        E[Metadata Store]
    end

    subgraph "Cached Data"
        F[Users]
        G[Chats]
        H[Messages]
        I[Pending Writes]
    end

    A --> B
    B --> C
    B --> D
    B --> E

    C --> F
    C --> G
    C --> H
    D --> I

    subgraph "Sync Engine"
        J[Listen for Connection]
        K[Process Queue]
        L[Resolve Conflicts]
    end

    D --> J
    J --> K
    K --> L

    L --> M[Firestore Cloud]

    style C fill:#4285f4,color:#fff
    style D fill:#f9ab00,color:#000
    style M fill:#34a853,color:#fff
```

## Write Queue Processing

```mermaid
graph TB
    Start([Write Operation]) --> Check{Network?}

    Check -->|Online| DirectWrite[Write to Firestore]
    Check -->|Offline| QueueWrite[Add to queue]

    QueueWrite --> QueueStore[(SQLite Queue)]
    DirectWrite --> FirestoreDB[(Firestore)]

    QueueStore --> Monitor[Network Monitor]
    Monitor --> Detect{Connection<br/>restored?}

    Detect -->|No| Monitor
    Detect -->|Yes| Process[Process Queue]

    Process --> Next{Next write<br/>in queue?}

    Next -->|Yes| Upload[Upload to Firestore]
    Next -->|No| Complete[Queue empty ✓]

    Upload --> Success{Success?}

    Success -->|Yes| Remove[Remove from queue]
    Success -->|No| Retry{Max retries?}

    Retry -->|No| Wait[Wait + Retry]
    Retry -->|Yes| MarkFailed[Mark as failed]

    Wait --> Upload
    Remove --> Next
    MarkFailed --> Alert[Alert user]

    FirestoreDB --> Confirm[Write confirmed]

    style QueueWrite fill:#f9ab00,color:#000
    style Process fill:#4285f4,color:#fff
    style Complete fill:#34a853,color:#fff
    style MarkFailed fill:#ea4335,color:#fff
```

## Optimistic UI with Rollback

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Cache
    participant Firestore

    User->>UI: Send message
    UI->>UI: Add to display immediately

    Note over UI: Optimistic: Assume success

    UI->>Cache: Queue write
    Cache->>Firestore: Attempt upload

    alt Success
        Firestore-->>Cache: 200 OK
        Cache-->>UI: Confirm
        UI->>UI: Update status: sent ✓
    else Permission Error
        Firestore-->>Cache: 403 Forbidden
        Cache-->>UI: Error
        UI->>UI: Remove message from display
        UI->>UI: Show error alert
    else Network Error
        Firestore-->>Cache: Timeout
        Cache-->>UI: Queued
        UI->>UI: Update status: queued
    else Offline
        Cache->>Cache: Store in queue
        Cache-->>UI: Queued
        UI->>UI: Update status: queued
    end
```

## Sync Performance Targets

```mermaid
graph LR
    subgraph "Offline Actions"
        A[Send 10 messages offline]
        B[Update profile offline]
        C[Mark 20 messages read]
    end

    subgraph "Connection Restored"
        D[Network detected]
        E[Start sync]
    end

    subgraph "Performance Target"
        F[Sync complete in <1 second]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    E --> F

    F --> G[All 10 messages sent ✓]
    F --> H[Profile updated ✓]
    F --> I[Read receipts synced ✓]

    style E fill:#4285f4,color:#fff
    style F fill:#34a853,color:#fff
```

## Poor Network Handling (3G)

```mermaid
sequenceDiagram
    participant User
    participant App
    participant NetworkMonitor
    participant Firestore

    NetworkMonitor->>NetworkMonitor: Detect 3G connection

    NetworkMonitor->>App: Connection type: cellular-3g

    App->>App: Enable "Poor Connection" mode

    User->>App: Send message

    App->>App: Show warning banner<br/>"Slow network - may take longer"

    App->>Firestore: Attempt upload<br/>timeout: 10s (extended)

    alt Upload succeeds within 10s
        Firestore-->>App: Success
        App->>App: Update status: sent
    else Upload times out
        Firestore-->>App: Timeout
        App->>App: Queue for retry
        App->>App: Show "Queued" status
    end

    Note over App: Auto-retry in background<br/>when connection improves
```

## Conflict Resolution: Last-Write-Wins

```mermaid
graph TB
    Start([Two devices edit same field]) --> DeviceA[Device A offline<br/>Sets name: Family<br/>Local time: 14:00]

    DeviceA --> DeviceB[Device B online<br/>Sets name: Parents<br/>Server time: 14:05]

    DeviceB --> Cloud[Firestore stores:<br/>name: Parents<br/>timestamp: 14:05]

    Cloud --> Reconnect[Device A reconnects<br/>Attempts to write: Family]

    Reconnect --> Server[Server compares timestamps]

    Server --> Compare{Device A local time<br/>vs<br/>Server timestamp}

    Compare --> ServerWins[Server timestamp 14:05<br/>is AFTER<br/>Device A queued at 14:00]

    ServerWins --> Result[Server REJECTS Device A write]

    Result --> Sync[Device A listener receives<br/>current value: Parents]

    Sync --> Overwrite[Device A local state<br/>updated to: Parents]

    style DeviceA fill:#f9ab00,color:#000
    style ServerWins fill:#ea4335,color:#fff
    style Overwrite fill:#4285f4,color:#fff

    Note1[Alternative: Use transactions<br/>for critical updates]
    style Note1 fill:#34a853,color:#fff
```

## onDisconnect Handlers (Presence)

```mermaid
sequenceDiagram
    participant App
    participant Firestore
    participant Users as Other Users

    App->>Firestore: Connect & authenticate
    App->>Firestore: Set presence:<br/>{online: true}

    App->>Firestore: Register onDisconnect handler<br/>Update: {online: false, lastSeen: serverTime}

    Firestore-->>App: Handler registered

    Note over Users: See user as "Online"

    alt Graceful disconnect
        App->>Firestore: Sign out
        Firestore->>Firestore: Execute onDisconnect
        Firestore->>Users: Update {online: false}
    else Network loss
        App->>App: Connection lost
        Note over Firestore: Server detects timeout
        Firestore->>Firestore: Auto-execute onDisconnect
        Firestore->>Users: Update {online: false}
    else Force quit
        App->>App: App terminated
        Note over Firestore: Server detects timeout
        Firestore->>Firestore: Auto-execute onDisconnect
        Firestore->>Users: Update {online: false}
    end
```

## Cache Size Management

```mermaid
graph TB
    subgraph "Cache Configuration"
        A[CACHE_SIZE_UNLIMITED]
        B[Persistence: Enabled]
    end

    subgraph "Automatic Management"
        C[Least Recently Used LRU]
        D[Automatic cleanup]
        E[Keep active queries]
    end

    A --> C
    B --> D
    C --> E

    subgraph "Storage Breakdown"
        F[Messages: ~70%]
        G[Users: ~10%]
        H[Chats: ~10%]
        I[Metadata: ~10%]
    end

    E --> F
    E --> G
    E --> H
    E --> I

    subgraph "Typical Sizes"
        J[1000 messages: ~500 KB]
        K[100 chats: ~50 KB]
        L[Total: ~1-5 MB]
    end

    F --> J
    H --> K
    I --> L

    style A fill:#4285f4,color:#fff
    style L fill:#34a853,color:#fff
```

## Offline Testing Scenarios

```mermaid
graph TB
    Start([Start Offline Tests]) --> T1[Test 1: Send while offline]
    T1 --> T2[Test 2: Receive while offline]
    T2 --> T3[Test 3: Force quit with queue]
    T3 --> T4[Test 4: Poor network 3G]
    T4 --> T5[Test 5: Rapid offline/online]
    T5 --> T6[Test 6: Background app]
    T6 --> T7[Test 7: 20+ messages offline]

    T7 --> Validate{All tests<br/>passing?}

    Validate -->|Yes| MVP[MVP Checkpoint ✓]
    Validate -->|No| Debug[Debug failures]

    Debug --> Fixes[Apply fixes]
    Fixes --> T1

    style T1 fill:#4285f4,color:#fff
    style T2 fill:#4285f4,color:#fff
    style T3 fill:#4285f4,color:#fff
    style T4 fill:#4285f4,color:#fff
    style T5 fill:#4285f4,color:#fff
    style T6 fill:#4285f4,color:#fff
    style T7 fill:#4285f4,color:#fff
    style MVP fill:#34a853,color:#fff
```

## Resilience Checklist

```mermaid
mindmap
  root((Offline-First<br/>Resilience))
    Message Delivery
      Optimistic UI
      Queue offline writes
      Auto-retry failed
      Show pending count
    Network Handling
      Monitor connection
      Detect poor network
      Extend timeouts
      Show status banner
    Data Persistence
      SQLite cache enabled
      Unlimited cache size
      Survives force quit
      Survives app restart
    Sync Performance
      Batch sync queued writes
      Sync in <1 second
      Preserve message order
      No duplicate messages
    Error Handling
      Graceful degradation
      Clear error messages
      Manual retry option
      Log for debugging
    User Experience
      Instant interactions
      Clear status indicators
      No blocking spinners
      Reliable behavior
```

## Sync Recovery Flow

```mermaid
graph TB
    Start([App opens after<br/>extended offline period]) --> Init[Initialize app]

    Init --> CheckQueue{Queued<br/>operations?}

    CheckQueue -->|No| Normal[Normal operation]
    CheckQueue -->|Yes| Count[Count: 47 operations]

    Count --> Network{Network<br/>available?}

    Network -->|No| ShowPending[Show banner:<br/>47 messages pending]
    Network -->|Yes| StartSync[Start background sync]

    ShowPending --> WaitNetwork[Wait for connection]
    WaitNetwork --> StartSync

    StartSync --> Batch[Batch process<br/>10 at a time]

    Batch --> Progress[Show progress:<br/>Syncing 10/47]

    Progress --> Complete{All synced?}

    Complete -->|No| Batch
    Complete -->|Yes| Success[All 47 synced ✓]

    Success --> Notify[Show success notification]
    Notify --> Normal

    style Count fill:#f9ab00,color:#000
    style StartSync fill:#4285f4,color:#fff
    style Success fill:#34a853,color:#fff
```

---

← [Back to Messaging Infrastructure](../MessagingInfrastructure.md)
