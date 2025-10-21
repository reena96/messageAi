# MessageAI - Data Model Diagrams

## Firestore Collections Overview

```mermaid
erDiagram
    USERS ||--o{ CHATS : participates
    CHATS ||--|{ MESSAGES : contains
    USERS ||--o{ MESSAGES : sends
    MESSAGES ||--o{ AI_EXTRACTIONS : has

    USERS {
        string id PK
        string email
        string displayName
        string photoURL
        boolean online
        timestamp lastSeen
        string fcmToken
        timestamp createdAt
        timestamp updatedAt
    }

    CHATS {
        string id PK
        string type
        array participants FK
        object participantData
        object lastMessage
        object unreadCount
        timestamp createdAt
        timestamp updatedAt
        string groupName
        string groupPhoto
        string createdBy FK
    }

    MESSAGES {
        string id PK
        string chatId FK
        string senderId FK
        string text
        timestamp timestamp
        string status
        array readBy
        string tempId
        date clientTimestamp
        string imageUrl
        string voiceUrl
        number voiceDuration
        object aiExtraction
    }

    AI_EXTRACTIONS {
        array calendarEvents
        array deadlines
        object rsvp
        string priority
        string decision
    }
```

## Users Collection Structure

```mermaid
graph TB
    subgraph "Collection: /users"
        A[Document: userId]
    end

    subgraph "User Document Fields"
        B[id: string]
        C[email: string]
        D[displayName: string]
        E[photoURL: string]
        F[online: boolean]
        G[lastSeen: Timestamp]
        H[fcmToken: string]
        I[createdAt: Timestamp]
        J[updatedAt: Timestamp]
    end

    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    A --> I
    A --> J

    subgraph "Indexes"
        K[online]
        L[lastSeen]
    end

    style A fill:#4285f4,color:#fff
    style K fill:#34a853,color:#fff
    style L fill:#34a853,color:#fff
```

## Chats Collection Structure

```mermaid
graph TB
    subgraph "Collection: /chats"
        A[Document: chatId]
    end

    subgraph "Chat Document Fields"
        B[id: string]
        C[type: one-on-one | group]
        D[participants: string array]
        E[participantData: object]
        F[lastMessage: object]
        G[unreadCount: object]
        H[createdAt: Timestamp]
        I[updatedAt: Timestamp]
        J[groupName?: string]
        K[groupPhoto?: string]
        L[createdBy?: string]
    end

    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    A --> I
    A --> J
    A --> K
    A --> L

    E --> E1["{userId: {name, photoURL}}"]
    F --> F1["{text, senderId, timestamp}"]
    G --> G1["{userId: count}"]

    subgraph "Indexes"
        M[participants array-contains]
        N[updatedAt DESC]
    end

    style A fill:#4285f4,color:#fff
    style M fill:#34a853,color:#fff
    style N fill:#34a853,color:#fff
```

## Messages Subcollection Structure

```mermaid
graph TB
    subgraph "Subcollection: /chats/{chatId}/messages"
        A[Document: messageId]
    end

    subgraph "Message Document Fields"
        B[id: string]
        C[chatId: string]
        D[senderId: string]
        E[text: string]
        F[timestamp: Timestamp]
        G[status: enum]
        H[readBy: string array]
        I[tempId?: string]
        J[clientTimestamp?: Date]
        K[imageUrl?: string]
        L[voiceUrl?: string]
        M[voiceDuration?: number]
        N[aiExtraction?: object]
    end

    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    A --> I
    A --> J
    A --> K
    A --> L
    A --> M
    A --> N

    G --> G1["sending | sent |<br/>delivered | read"]

    N --> N1[calendarEvents]
    N --> N2[deadlines]
    N --> N3[rsvp]
    N --> N4[priority]
    N --> N5[decision]

    subgraph "Indexes"
        O[timestamp ASC]
        P[senderId]
        Q[Composite: chatId + timestamp]
    end

    style A fill:#4285f4,color:#fff
    style O fill:#34a853,color:#fff
    style P fill:#34a853,color:#fff
    style Q fill:#34a853,color:#fff
```

## AI Extraction Data Models

```mermaid
classDiagram
    class CalendarEvent {
        +string event
        +string date
        +string time
        +string location
        +string extractedFrom
        +number confidence
    }

    class Deadline {
        +string task
        +string dueDate
        +string priority
        +string extractedFrom
        +Timestamp reminder
        +boolean completed
    }

    class RSVP {
        +string event
        +object responses
        +object summary
    }

    class RSVPSummary {
        +number yes
        +number no
        +number maybe
        +number noResponse
    }

    class Message {
        +string id
        +string text
        +AIExtraction aiExtraction
    }

    class AIExtraction {
        +CalendarEvent[] calendarEvents
        +Deadline[] deadlines
        +RSVP rsvp
        +string priority
        +string decision
    }

    Message "1" --> "0..1" AIExtraction
    AIExtraction "1" --> "*" CalendarEvent
    AIExtraction "1" --> "*" Deadline
    AIExtraction "1" --> "0..1" RSVP
    RSVP "1" --> "1" RSVPSummary
```

## Data Relationships

```mermaid
graph LR
    subgraph "User Sarah"
        U1[User: sarah123]
    end

    subgraph "User John"
        U2[User: john456]
    end

    subgraph "User Emma"
        U3[User: emma789]
    end

    subgraph "One-on-One Chat"
        C1[Chat: chat_001]
        M1[Message: msg_001]
        M2[Message: msg_002]
    end

    subgraph "Group Chat"
        C2[Chat: chat_002]
        M3[Message: msg_003]
        M4[Message: msg_004]
        M5[Message: msg_005]
    end

    U1 -.participant.-> C1
    U2 -.participant.-> C1

    U1 -.participant.-> C2
    U2 -.participant.-> C2
    U3 -.participant.-> C2

    C1 --> M1
    C1 --> M2

    C2 --> M3
    C2 --> M4
    C2 --> M5

    U1 -.sent.-> M1
    U2 -.sent.-> M2
    U1 -.sent.-> M3
    U3 -.sent.-> M4
    U2 -.sent.-> M5

    style C1 fill:#4285f4,color:#fff
    style C2 fill:#4285f4,color:#fff
```

## Chat Participant Data Denormalization

```mermaid
graph TB
    subgraph "Chat Document"
        A[Chat ID: family_chat]
    end

    subgraph "Participants Array"
        B[user_1]
        C[user_2]
        D[user_3]
    end

    subgraph "Denormalized participantData"
        E["user_1: {<br/>name: 'Sarah',<br/>photoURL: 'url1'<br/>}"]
        F["user_2: {<br/>name: 'John',<br/>photoURL: 'url2'<br/>}"]
        G["user_3: {<br/>name: 'Emma',<br/>photoURL: 'url3'<br/>}"]
    end

    A --> B
    A --> C
    A --> D

    A --> E
    A --> F
    A --> G

    style E fill:#34a853,color:#fff
    style F fill:#34a853,color:#fff
    style G fill:#34a853,color:#fff

    Note1[Benefit: No need to query<br/>users collection for<br/>chat list display]

    style Note1 fill:#f9ab00,color:#000
```

## Read Receipt Tracking

```mermaid
graph TB
    subgraph "Group Chat: 3 Participants"
        P1[Sarah user_1]
        P2[John user_2]
        P3[Emma user_3]
    end

    subgraph "Message from Sarah"
        M[Message: msg_001<br/>senderId: user_1]
    end

    M --> R[readBy: array]

    R --> R1["Step 1: ['user_1']<br/>(sender auto-added)"]
    R1 --> R2["Step 2: ['user_1', 'user_2']<br/>(John read it)"]
    R2 --> R3["Step 3: ['user_1', 'user_2', 'user_3']<br/>(Emma read it)"]

    subgraph "Status Display"
        S1[Read by 0/2] --> R1
        S2[Read by 1/2] --> R2
        S3[Read by all] --> R3
    end

    style R1 fill:#ea4335,color:#fff
    style R2 fill:#f9ab00,color:#000
    style R3 fill:#34a853,color:#fff
```

## Unread Count Management

```mermaid
sequenceDiagram
    participant Sarah
    participant Chat Doc
    participant John
    participant Emma

    Note over Chat Doc: unreadCount: {<br/>user_1: 0,<br/>user_2: 0,<br/>user_3: 0<br/>}

    Sarah->>Chat Doc: Send Message
    Chat Doc->>Chat Doc: Increment for others

    Note over Chat Doc: unreadCount: {<br/>user_1: 0,<br/>user_2: 1,<br/>user_3: 1<br/>}

    John->>Chat Doc: Open Chat
    Chat Doc->>Chat Doc: Reset user_2 to 0

    Note over Chat Doc: unreadCount: {<br/>user_1: 0,<br/>user_2: 0,<br/>user_3: 1<br/>}

    Emma->>Chat Doc: Open Chat
    Chat Doc->>Chat Doc: Reset user_3 to 0

    Note over Chat Doc: unreadCount: {<br/>user_1: 0,<br/>user_2: 0,<br/>user_3: 0<br/>}
```

## Composite Indexes Required

```mermaid
graph TB
    subgraph "Index 1: Messages Query"
        A[Collection: messages]
        B[Field: chatId ASC]
        C[Field: timestamp ASC]
    end

    A --> B
    B --> C

    subgraph "Index 2: User Chats Query"
        D[Collection: chats]
        E[Field: participants CONTAINS]
        F[Field: updatedAt DESC]
    end

    D --> E
    E --> F

    subgraph "Index 3: Priority Messages"
        G[Collection: messages]
        H[Field: chatId ASC]
        I[Field: priority ASC]
        J[Field: timestamp DESC]
    end

    G --> H
    H --> I
    I --> J

    style A fill:#4285f4,color:#fff
    style D fill:#4285f4,color:#fff
    style G fill:#4285f4,color:#fff
```

## Data Size Considerations

```mermaid
graph TB
    subgraph "Message Document Size"
        A[Base Message: ~200 bytes]
        B[With Image URL: ~300 bytes]
        C[With AI Extraction: ~500-1000 bytes]
    end

    subgraph "Firestore Limits"
        D[Max Document Size: 1 MB]
        E[Max Array Elements: 20,000]
        F[Max Depth: 20 levels]
    end

    subgraph "Our Constraints"
        G[Max readBy Array: ~100 users]
        H[Max AI Extraction: ~1 KB]
        I[Max Message Text: 10,000 chars]
    end

    A --> C
    B --> C

    style D fill:#ea4335,color:#fff
    style E fill:#ea4335,color:#fff
    style F fill:#ea4335,color:#fff
    style G fill:#34a853,color:#fff
    style H fill:#34a853,color:#fff
    style I fill:#34a853,color:#fff
```

## Query Optimization Strategy

```mermaid
graph LR
    subgraph "Query Pattern"
        A[Chat List Screen]
        B[Chat Detail Screen]
        C[Message Search]
    end

    subgraph "Optimization"
        D[Limit: 100 chats]
        E[Pagination: 50 msgs]
        F[Full-text: Algolia]
    end

    A --> D
    B --> E
    C --> F

    subgraph "Caching Strategy"
        G[Local SQLite Cache]
        H[Denormalized Data]
        I[Real-time Listeners]
    end

    D --> G
    E --> H
    F --> I

    style D fill:#34a853,color:#fff
    style E fill:#34a853,color:#fff
    style F fill:#34a853,color:#fff
```

## Security Rules Data Access

```mermaid
graph TB
    subgraph "Request Context"
        A[request.auth.uid]
        B[request.resource.data]
        C[resource.data]
    end

    subgraph "User Rules"
        D{isSignedIn?}
        E{isOwner?}
    end

    subgraph "Chat Rules"
        F{isParticipant?}
        G{isCreator?}
    end

    subgraph "Message Rules"
        H{isSender?}
        I{canRead?}
    end

    A --> D
    D -->|Yes| E
    D -->|Yes| F
    D -->|Yes| H

    E -->|Yes| Allow1[Allow Write User]
    F -->|Yes| Allow2[Allow Read/Write Chat]
    G -->|Yes| Allow3[Allow Delete Chat]
    H -->|Yes| Allow4[Allow Write Message]
    I -->|Yes| Allow5[Allow Read Message]

    style D fill:#f9ab00,color:#000
    style Allow1 fill:#34a853,color:#fff
    style Allow2 fill:#34a853,color:#fff
    style Allow3 fill:#34a853,color:#fff
    style Allow4 fill:#34a853,color:#fff
    style Allow5 fill:#34a853,color:#fff
```

---

← [Back to Technical Architecture](../TechnicalArchitecture.md)
