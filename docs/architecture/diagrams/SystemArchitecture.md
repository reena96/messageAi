# MessageAI - System Architecture Diagrams

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Mobile App Layer"
        A[React Native + Expo]
        B[Expo Router Navigation]
        C[Zustand State Management]
        D[UI Components]

        A --> B
        A --> C
        A --> D
    end

    subgraph "Local Storage Layer"
        E[SQLite Cache<br/>react-native-firebase]
        F[Message Queue<br/>Offline Support]
        G[Local Persistence]

        E --> F
        E --> G
    end

    subgraph "Firebase Backend"
        H[Firestore<br/>Real-time Database]
        I[Firebase Auth]
        J[Cloud Functions<br/>AI Processing]
        K[Cloud Storage<br/>Media Files]
        L[Cloud Messaging<br/>Push Notifications]
    end

    subgraph "AI Processing Layer"
        M[OpenAI GPT-4 Turbo]
        N[AI SDK by Vercel<br/>Simple Features]
        O[LangChain<br/>Advanced Features]
        P[RAG Pipeline]

        M --> N
        M --> O
        O --> P
    end

    A -->|Read/Write| E
    E -->|Sync| H
    A -->|Auth| I
    A -->|Call| J
    J -->|Query| M
    H -->|Trigger| J
    J -->|Store| K
    L -->|Notify| A

    style A fill:#4285f4,color:#fff
    style H fill:#f4b400,color:#000
    style M fill:#10a37f,color:#fff
```

## Layer Breakdown

### 1. Mobile App Layer (React Native + Expo)

```mermaid
graph LR
    subgraph "Screens"
        A1[Login/Signup]
        A2[Chat List]
        A3[Chat Detail]
        A4[Profile]
        A5[AI Assistant]
    end

    subgraph "Components"
        B1[Message Bubble]
        B2[Chat Item]
        B3[AI Insights]
        B4[Group Members]
    end

    subgraph "State Management"
        C1[authStore]
        C2[messageStore]
        C3[chatStore]
        C4[aiStore]
    end

    A1 --> C1
    A2 --> C3
    A3 --> C2
    A5 --> C4

    C1 -.uses.-> B2
    C2 -.uses.-> B1
    C4 -.uses.-> B3
```

### 2. Real-Time Sync Architecture

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant LocalCache
    participant Firestore
    participant OtherDevices

    User->>UI: Send Message
    UI->>UI: Show Optimistic UI<br/>(status: sending)
    UI->>LocalCache: Write to Cache
    LocalCache->>Firestore: Sync Write

    alt Online
        Firestore-->>LocalCache: Confirm Write
        LocalCache-->>UI: Update Status<br/>(status: sent)
        Firestore->>OtherDevices: Real-time Update
    else Offline
        LocalCache->>LocalCache: Queue Write
        UI->>UI: Show "Queued"
        Note over LocalCache: Wait for Connection
        LocalCache->>Firestore: Sync on Reconnect
        Firestore-->>LocalCache: Confirm
        LocalCache-->>UI: Update Status
    end
```

### 3. Firebase Services Integration

```mermaid
graph TB
    subgraph "Firebase Services"
        A[Firestore]
        B[Authentication]
        C[Cloud Functions]
        D[Cloud Storage]
        E[Cloud Messaging]
    end

    subgraph "Collections"
        A1[/users]
        A2[/chats]
        A3[/chats/messages]
    end

    subgraph "Functions"
        C1[calendarExtraction]
        C2[decisionSummary]
        C3[priorityDetection]
        C4[rsvpTracking]
        C5[deadlineExtraction]
        C6[proactiveAssistant]
    end

    A --> A1
    A --> A2
    A --> A3

    C --> C1
    C --> C2
    C --> C3
    C --> C4
    C --> C5
    C --> C6

    C1 -.calls.-> OpenAI[OpenAI API]
    C2 -.calls.-> OpenAI
    C3 -.calls.-> OpenAI
    C4 -.calls.-> OpenAI
    C5 -.calls.-> OpenAI
    C6 -.calls.-> OpenAI

    style A fill:#f4b400,color:#000
    style C fill:#4285f4,color:#fff
    style OpenAI fill:#10a37f,color:#fff
```

### 4. Offline-First Architecture

```mermaid
graph TB
    Start([User Action]) --> Check{Network<br/>Available?}

    Check -->|Yes| Online[Write to Firestore]
    Check -->|No| Offline[Queue in Local Storage]

    Online --> Listener[Firestore Listener]
    Offline --> LocalUI[Update Local UI<br/>status: sending]

    Listener --> UpdateUI[Update UI<br/>status: sent]

    LocalUI --> WaitNetwork{Wait for<br/>Connection}
    WaitNetwork -->|Connected| Sync[Sync Queued Writes]
    Sync --> Listener

    WaitNetwork -->|Still Offline| LocalUI

    style Check fill:#f9ab00,color:#000
    style Offline fill:#ea4335,color:#fff
    style Online fill:#34a853,color:#fff
```

### 5. Security & Data Flow

```mermaid
graph LR
    subgraph "Client"
        A[Mobile App]
        B[Local Cache]
    end

    subgraph "Firebase Rules"
        C{Auth Check}
        D{Participant Check}
        E{Owner Check}
    end

    subgraph "Firestore"
        F[(Users)]
        G[(Chats)]
        H[(Messages)]
    end

    A -->|Request| C
    C -->|Authenticated| D
    D -->|Is Participant| E
    E -->|Authorized| F
    E -->|Authorized| G
    E -->|Authorized| H

    C -.Reject.-> X[403 Forbidden]
    D -.Reject.-> X
    E -.Reject.-> X

    style C fill:#ea4335,color:#fff
    style D fill:#f9ab00,color:#000
    style E fill:#34a853,color:#fff
```

## Performance Architecture

```mermaid
graph TB
    subgraph "Performance Optimizations"
        A[FlashList<br/>Virtual Scrolling]
        B[Image Caching<br/>expo-image]
        C[Pagination<br/>50 messages/page]
        D[Denormalized Data<br/>Participant Info]
        E[Composite Indexes<br/>Query Optimization]
        F[Batch Writes<br/>Read Receipts]
    end

    subgraph "Targets"
        T1[App Launch: <2s]
        T2[Message Delivery: <200ms]
        T3[Offline Sync: <1s]
        T4[Scrolling: 60 FPS]
        T5[AI Simple: <2s]
        T6[AI Advanced: <15s]
    end

    A --> T4
    B --> T1
    C --> T4
    D --> T2
    E --> T2
    F --> T3

    style T1 fill:#34a853,color:#fff
    style T2 fill:#34a853,color:#fff
    style T3 fill:#34a853,color:#fff
    style T4 fill:#34a853,color:#fff
    style T5 fill:#34a853,color:#fff
    style T6 fill:#34a853,color:#fff
```

## Technology Stack Overview

```mermaid
mindmap
  root((MessageAI<br/>Tech Stack))
    Frontend
      React Native
        Expo Custom Dev Client
        TypeScript
      Navigation
        Expo Router
      State
        Zustand
      UI
        react-native-reanimated
        @shopify/flash-list
        expo-image
    Backend
      Firebase
        Firestore
        Authentication
        Cloud Functions
        Cloud Messaging
        Cloud Storage
      Database
        SQLite Local Cache
        Native Persistence
    AI Stack
      OpenAI
        GPT-4 Turbo
        Function Calling
        JSON Mode
      Frameworks
        AI SDK by Vercel
        LangChain
        RAG Pipeline
    DevOps
      Testing
        Jest
        React Native Testing Library
        Detox
      Tools
        TypeScript
        ESLint
        Prettier
```

## Component Dependency Graph

```mermaid
graph TD
    A[App Entry Point] --> B[Auth Context]
    A --> C[Navigation Root]

    B --> D{Authenticated?}
    D -->|No| E[Login Screen]
    D -->|Yes| F[Main App]

    F --> G[Chat List Screen]
    F --> H[Profile Screen]
    F --> I[AI Assistant Screen]

    G --> J[Chat Detail Screen]
    J --> K[Message List]
    J --> L[Message Input]
    J --> M[AI Insights Panel]

    K --> N[Message Bubble Component]
    M --> O[Calendar Events]
    M --> P[Decisions Summary]
    M --> Q[Priority Indicators]
    M --> R[RSVP Tracker]
    M --> S[Deadlines List]

    style D fill:#f9ab00,color:#000
    style E fill:#ea4335,color:#fff
    style F fill:#34a853,color:#fff
```

---

← [Back to Technical Architecture](../TechnicalArchitecture.md)
