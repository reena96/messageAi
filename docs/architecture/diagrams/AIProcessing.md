# MessageAI - AI Processing Pipeline Diagrams

## AI Feature Overview

```mermaid
mindmap
  root((AI Features))
    Required 5 Features
      Calendar Extraction
        Date/time parsing
        Event detection
        Location extraction
      Decision Summary
        Thread analysis
        Key point extraction
        Consensus detection
      Priority Detection
        Urgency classification
        Context analysis
        Keyword matching
      RSVP Tracking
        Response detection
        Participant tracking
        Headcount summary
      Deadline Extraction
        Due date parsing
        Task identification
        Reminder creation
    Advanced Feature
      Proactive Assistant
        Conflict detection
        Alternative suggestions
        Multi-step reasoning
        LangChain integration
```

## AI Processing Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[User sends message]
        B[Message stored in Firestore]
    end

    subgraph "Cloud Functions Trigger"
        C[onCreate Trigger]
        D[Analyze message content]
    end

    subgraph "AI Processing Layer"
        E[Route to appropriate AI function]
        F1[Calendar Extraction]
        F2[Decision Summary]
        F3[Priority Detection]
        F4[RSVP Tracking]
        F5[Deadline Extraction]
        F6[Proactive Assistant]
    end

    subgraph "OpenAI API"
        G[GPT-4 Turbo]
        H[Function Calling]
        I[JSON Mode]
    end

    subgraph "Result Storage"
        J[Update message document]
        K[Add aiExtraction field]
    end

    subgraph "Client Update"
        L[Firestore listener]
        M[Display AI insights]
    end

    A --> B
    B --> C
    C --> D
    D --> E

    E --> F1
    E --> F2
    E --> F3
    E --> F4
    E --> F5
    E --> F6

    F1 --> H
    F2 --> I
    F3 --> G
    F4 --> H
    F5 --> H
    F6 --> LangChain[LangChain + RAG]

    H --> G
    I --> G
    LangChain --> G

    G --> J
    J --> K
    K --> L
    L --> M

    style E fill:#4285f4,color:#fff
    style G fill:#10a37f,color:#fff
    style M fill:#34a853,color:#fff
```

## AI Feature: Calendar Extraction

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Firestore
    participant CloudFunction
    participant OpenAI
    participant Client

    User->>Firestore: Send message:<br/>"Soccer practice Tuesday 4pm at Park"

    Firestore->>CloudFunction: onCreate trigger

    CloudFunction->>CloudFunction: Extract message text

    CloudFunction->>OpenAI: POST /chat/completions<br/>Function calling mode

    Note over OpenAI: GPT-4 analyzes text<br/>Identifies calendar event

    OpenAI-->>CloudFunction: Function call response:<br/>{<br/>  event: "Soccer practice",<br/>  date: "2025-01-23",<br/>  time: "16:00",<br/>  location: "Park"<br/>}

    CloudFunction->>CloudFunction: Validate extraction

    CloudFunction->>Firestore: Update message:<br/>aiExtraction.calendarEvents[]

    Firestore->>Client: Real-time update

    Client->>Client: Display calendar icon<br/>Show extracted event
```

## Calendar Extraction Function Call Schema

```mermaid
graph TB
    subgraph "OpenAI Function Definition"
        A["Function: extract_calendar_event"]
        B["Description: Extract calendar events<br/>from casual conversation"]
    end

    subgraph "Parameters"
        C["event: string required<br/>What is happening"]
        D["date: string required<br/>ISO format YYYY-MM-DD"]
        E["time: string optional<br/>24-hour format HH:MM"]
        F["location: string optional<br/>Where it's happening"]
        G["confidence: number<br/>0.0 to 1.0"]
    end

    subgraph "Example Input"
        H["Soccer practice Tuesday 4pm"]
    end

    subgraph "Example Output"
        I["{<br/>  event: 'Soccer practice',<br/>  date: '2025-01-23',<br/>  time: '16:00',<br/>  location: null,<br/>  confidence: 0.95<br/>}"]
    end

    A --> B
    B --> C
    B --> D
    B --> E
    B --> F
    B --> G

    H --> A
    A --> I

    style A fill:#10a37f,color:#fff
    style I fill:#34a853,color:#fff
```

## AI Feature: Decision Summarization

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant CloudFunction
    participant OpenAI
    participant Firestore

    User->>Client: Long tap on message<br/>Select "Summarize thread"

    Client->>CloudFunction: Call summarizeThread(chatId, messageId)

    CloudFunction->>Firestore: Fetch last 50 messages

    Firestore-->>CloudFunction: Return messages[]

    CloudFunction->>CloudFunction: Build conversation context

    CloudFunction->>OpenAI: POST with JSON mode<br/>Prompt: "Summarize decisions"

    Note over OpenAI: Analyzes 50 messages<br/>Identifies key decisions

    OpenAI-->>CloudFunction: {<br/>  decision: "Park at 2pm Saturday",<br/>  confidence: 0.92,<br/>  participants: [...],<br/>  dissenting: []<br/>}

    CloudFunction->>Firestore: Store summary<br/>aiExtraction.decision

    Firestore->>Client: Update via listener

    Client->>Client: Show summary card
```

## Decision Summary JSON Schema

```mermaid
classDiagram
    class DecisionSummary {
        +string decision
        +number confidence
        +string[] participants
        +string[] dissenting
        +string context
        +string timestamp
    }

    class Example {
        decision: "Agreed to meet at Central Park at 2pm"
        confidence: 0.92
        participants: ["Sarah", "John", "Emma"]
        dissenting: []
        context: "Discussed 3 options, voted, majority chose park"
        timestamp: "2025-01-20T14:30:00Z"
    }

    DecisionSummary --> Example : instance
```

## AI Feature: Priority Detection

```mermaid
graph TB
    Start([New message received]) --> Extract[Extract message text]

    Extract --> Analyze[Send to OpenAI<br/>Classification prompt]

    Analyze --> GPT[GPT-4 analyzes:<br/>- Keywords<br/>- Context<br/>- Urgency signals]

    GPT --> Classify{Classification}

    Classify -->|High| H[Priority: HIGH<br/>Keywords: urgent, ASAP,<br/>emergency, sick, canceled]
    Classify -->|Medium| M[Priority: MEDIUM<br/>Keywords: important,<br/>FYI, reminder, update]
    Classify -->|Low| L[Priority: LOW<br/>General conversation]

    H --> Store1[aiExtraction.priority = 'high']
    M --> Store2[aiExtraction.priority = 'medium']
    L --> Store3[aiExtraction.priority = 'low']

    Store1 --> UI1[Show red badge 🔴]
    Store2 --> UI2[Show yellow badge 🟡]
    Store3 --> UI3[No special indicator]

    style H fill:#ea4335,color:#fff
    style M fill:#f9ab00,color:#000
    style L fill:#34a853,color:#fff
```

## Priority Detection Prompt

```mermaid
graph TB
    subgraph "System Prompt"
        A["You are a priority classifier for<br/>family coordination messages."]
    end

    subgraph "Classification Criteria"
        B["HIGH: Emergencies, sick children,<br/>schedule cancellations, urgent requests"]
        C["MEDIUM: Important updates, reminders,<br/>schedule changes, decisions needed"]
        D["LOW: General chat, acknowledgments,<br/>casual conversation"]
    end

    subgraph "Examples"
        E["HIGH: 'URGENT: Practice canceled'<br/>MEDIUM: 'FYI - game time changed to 3pm'<br/>LOW: 'Thanks for organizing!'"]
    end

    subgraph "Output Format"
        F["{<br/>  priority: 'high' | 'medium' | 'low',<br/>  reason: string,<br/>  confidence: number<br/>}"]
    end

    A --> B
    A --> C
    A --> D
    B --> E
    C --> E
    D --> E
    E --> F

    style A fill:#10a37f,color:#fff
    style F fill:#34a853,color:#fff
```

## AI Feature: RSVP Tracking

```mermaid
sequenceDiagram
    participant Sarah
    participant CloudFunction
    participant OpenAI
    participant Firestore
    participant GroupMembers

    Sarah->>Firestore: "Who's coming to the party Saturday?"

    Firestore->>CloudFunction: onCreate trigger

    CloudFunction->>Firestore: Fetch recent messages

    Firestore-->>CloudFunction: Last 20 messages

    CloudFunction->>OpenAI: Extract RSVP responses<br/>Function calling

    Note over OpenAI: Analyzes messages:<br/>"I'm in!" - John<br/>"Can't make it" - Emma<br/>"Maybe, depends on work" - Mike

    OpenAI-->>CloudFunction: {<br/>  responses: {<br/>    john_id: 'yes',<br/>    emma_id: 'no',<br/>    mike_id: 'maybe'<br/>  }<br/>}

    CloudFunction->>CloudFunction: Calculate summary

    CloudFunction->>Firestore: Update aiExtraction.rsvp

    Firestore->>GroupMembers: Real-time update

    GroupMembers->>GroupMembers: Display RSVP card:<br/>✓ 1 Yes | ✗ 1 No | ? 1 Maybe
```

## RSVP Tracking Data Flow

```mermaid
graph TB
    subgraph "Input Messages"
        A["I'm in!" - John]
        B["Count me out" - Emma]
        C["Maybe" - Mike]
        D["Yes!" - Sarah]
    end

    subgraph "AI Processing"
        E[OpenAI extracts responses]
        F[Map to user IDs]
        G[Categorize: yes/no/maybe]
    end

    subgraph "RSVP Object"
        H["{<br/>  event: 'Birthday party',<br/>  responses: {<br/>    john_id: 'yes',<br/>    emma_id: 'no',<br/>    mike_id: 'maybe',<br/>    sarah_id: 'yes'<br/>  },<br/>  summary: {<br/>    yes: 2, no: 1,<br/>    maybe: 1, noResponse: 0<br/>  }<br/>}"]
    end

    subgraph "UI Display"
        I[RSVP Card Component]
        J["✓ Going: 2<br/>✗ Not going: 1<br/>? Maybe: 1<br/>― No response: 0"]
    end

    A --> E
    B --> E
    C --> E
    D --> E

    E --> F
    F --> G
    G --> H

    H --> I
    I --> J

    style H fill:#4285f4,color:#fff
    style J fill:#34a853,color:#fff
```

## AI Feature: Deadline Extraction

```mermaid
graph TB
    Start([Message: Permission slip<br/>due Friday]) --> Trigger[Cloud Function triggered]

    Trigger --> Extract[Extract text]
    Extract --> Send[Send to OpenAI<br/>Function calling]

    Send --> Analyze[GPT-4 identifies:<br/>- Task: Permission slip<br/>- Due: Friday<br/>- Priority: medium]

    Analyze --> Convert[Convert relative date<br/>Friday → 2025-01-24]

    Convert --> Calculate[Calculate reminder time<br/>Due date - 24 hours]

    Calculate --> Store[Store in Firestore:<br/>aiExtraction.deadlines[]]

    Store --> Schedule[Schedule reminder notification]

    Schedule --> Listen[Client listener updates]

    Listen --> Display[Show in Deadlines tab]

    Display --> Notify{Due date<br/>approaching?}

    Notify -->|Yes| Push[Send push notification:<br/>"Reminder: Permission slip due tomorrow"]
    Notify -->|No| Display

    style Analyze fill:#10a37f,color:#fff
    style Push fill:#f9ab00,color:#000
```

## Deadline Extraction Function

```mermaid
classDiagram
    class DeadlineExtraction {
        +string task
        +string dueDate
        +string priority
        +string extractedFrom
        +Timestamp reminder
        +boolean completed
    }

    class ExampleInput {
        message: "Don't forget permission slip due Friday"
    }

    class ExampleOutput {
        task: "Submit permission slip"
        dueDate: "2025-01-24"
        priority: "medium"
        extractedFrom: "Don't forget permission slip due Friday"
        reminder: Timestamp(2025-01-23 09:00)
        completed: false
    }

    ExampleInput --> DeadlineExtraction : OpenAI processes
    DeadlineExtraction --> ExampleOutput : result
```

## AI Feature: Proactive Assistant (Advanced)

```mermaid
sequenceDiagram
    participant User
    participant CloudFunction
    participant LangChain
    participant RAG as RAG Pipeline
    participant OpenAI
    participant Firestore

    User->>Firestore: "Soccer at 3pm Saturday"

    Firestore->>CloudFunction: onCreate trigger

    CloudFunction->>RAG: Retrieve user's calendar events

    RAG-->>CloudFunction: Existing events:<br/>["Birthday party 2pm Saturday"]

    CloudFunction->>LangChain: Initialize agent<br/>Context: New event + Existing events

    LangChain->>LangChain: Step 1: Detect conflict<br/>Soccer 3pm overlaps party 2pm

    LangChain->>OpenAI: Generate alternatives<br/>Prompt: "Suggest alternative times"

    OpenAI-->>LangChain: Suggestions:<br/>- Sunday 3pm<br/>- Saturday 5pm (after party)

    LangChain->>CloudFunction: Agent result:<br/>{<br/>  conflict: true,<br/>  conflictsWith: "Birthday party",<br/>  suggestions: [...]<br/>}

    CloudFunction->>Firestore: Store proactive insight

    Firestore->>User: Push notification:<br/>"⚠️ Conflict detected"<br/>+ Show alternatives
```

## LangChain Agent Architecture

```mermaid
graph TB
    subgraph "LangChain Components"
        A[Agent Executor]
        B[Memory: Conversation]
        C[Tools: Calendar, RSVP, etc]
    end

    subgraph "RAG Pipeline"
        D[Vector Store: Pinecone]
        E[Embeddings: OpenAI]
        F[Retriever: Past events]
    end

    subgraph "Agent Workflow"
        G[1. Analyze new message]
        H[2. Retrieve relevant context]
        I[3. Detect conflicts]
        J[4. Generate suggestions]
        K[5. Return insights]
    end

    A --> B
    A --> C
    B --> D
    D --> E
    E --> F

    G --> H
    H --> I
    I --> J
    J --> K

    F --> H

    style A fill:#4285f4,color:#fff
    style D fill:#10a37f,color:#fff
    style K fill:#34a853,color:#fff
```

## AI Performance Targets

```mermaid
graph LR
    subgraph "Simple AI Features"
        A[Calendar Extraction]
        B[Priority Detection]
        C[RSVP Tracking]
        D[Deadline Extraction]
    end

    subgraph "Target: <2 seconds"
        E[Response time measured]
    end

    A --> E
    B --> E
    C --> E
    D --> E

    subgraph "Complex AI Feature"
        F[Decision Summary]
    end

    subgraph "Target: <3 seconds"
        G[50 messages analyzed]
    end

    F --> G

    subgraph "Advanced AI Feature"
        H[Proactive Assistant]
    end

    subgraph "Target: <15 seconds"
        I[Multi-step reasoning<br/>RAG retrieval<br/>LangChain execution]
    end

    H --> I

    style E fill:#34a853,color:#fff
    style G fill:#34a853,color:#fff
    style I fill:#34a853,color:#fff
```

## AI Accuracy Requirements

```mermaid
graph TB
    subgraph "All AI Features"
        A[Calendar Extraction]
        B[Decision Summary]
        C[Priority Detection]
        D[RSVP Tracking]
        E[Deadline Extraction]
        F[Proactive Assistant]
    end

    subgraph "Accuracy Target"
        G[>90% accuracy]
        H[Measured on test set]
        I[Documented in README]
    end

    A --> G
    B --> G
    C --> G
    D --> G
    E --> G
    F --> G

    G --> H
    H --> I

    subgraph "Test Cases"
        J[50+ examples per feature]
        K[Edge cases included]
        L[Real-world scenarios]
    end

    I --> J
    J --> K
    K --> L

    style G fill:#34a853,color:#fff
    style J fill:#4285f4,color:#fff
```

## Cloud Function Deployment

```mermaid
graph TB
    subgraph "Development"
        A[Write TypeScript function]
        B[Test locally with emulator]
        C[Configure secrets]
    end

    subgraph "Deployment"
        D[firebase deploy --only functions]
        E[Functions deployed to Cloud]
    end

    subgraph "Triggers"
        F[onCreate: messages/{messageId}]
        G[onCall: HTTP callable]
    end

    subgraph "Execution"
        H[Function triggered]
        I[Call OpenAI API]
        J[Process result]
        K[Update Firestore]
    end

    A --> B
    B --> C
    C --> D
    D --> E

    E --> F
    E --> G

    F --> H
    G --> H

    H --> I
    I --> J
    J --> K

    style D fill:#f9ab00,color:#000
    style K fill:#34a853,color:#fff
```

## API Key Security

```mermaid
graph TB
    subgraph "❌ NEVER DO THIS"
        A[Hardcode API key in code]
        B[Store in .env committed to git]
        C[Expose in client bundle]
    end

    subgraph "✅ CORRECT APPROACH"
        D[Use Firebase Secret Manager]
        E[Set via CLI:<br/>firebase functions:secrets:set]
        F[Access in function:<br/>defineSecret]
    end

    subgraph "Runtime"
        G[Cloud Function starts]
        H[Load secret from environment]
        I[Use for OpenAI calls]
        J[Never expose to client]
    end

    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J

    style A fill:#ea4335,color:#fff
    style B fill:#ea4335,color:#fff
    style C fill:#ea4335,color:#fff
    style D fill:#34a853,color:#fff
    style E fill:#34a853,color:#fff
    style F fill:#34a853,color:#fff
```

## AI Error Handling

```mermaid
graph TB
    Start([AI Feature Called]) --> Try{Try OpenAI Call}

    Try -->|Success| Process[Process response]
    Try -->|Rate Limit| RateLimit[429 Error]
    Try -->|Invalid API Key| AuthError[401 Error]
    Try -->|Timeout| TimeoutError[Timeout]
    Try -->|Network Error| NetError[Network Error]

    RateLimit --> Retry1[Wait + Retry<br/>Exponential backoff]
    AuthError --> Alert1[Log error + Alert admin]
    TimeoutError --> Retry2[Retry once]
    NetError --> Retry3[Retry with backoff]

    Retry1 --> Try
    Retry2 --> Try
    Retry3 --> Try

    Retry1 --> MaxRetries{Max retries?}
    Retry2 --> MaxRetries
    Retry3 --> MaxRetries

    MaxRetries -->|Yes| Fallback[Return graceful fallback]
    MaxRetries -->|No| Try

    Process --> Validate{Valid response?}
    Validate -->|Yes| Store[Store in Firestore]
    Validate -->|No| Fallback

    Store --> Success[Success ✓]
    Fallback --> Partial[Partial success<br/>Show error to user]

    style Try fill:#4285f4,color:#fff
    style Success fill:#34a853,color:#fff
    style Alert1 fill:#ea4335,color:#fff
```

## AI Testing Strategy

```mermaid
graph TB
    subgraph "Unit Tests"
        A[Test prompt engineering]
        B[Test function call schemas]
        C[Test result parsing]
    end

    subgraph "Integration Tests"
        D[Test Cloud Function trigger]
        E[Test OpenAI API call]
        F[Test Firestore update]
    end

    subgraph "Accuracy Tests"
        G[50+ test cases per feature]
        H[Measure accuracy %]
        I[Document results]
    end

    subgraph "Performance Tests"
        J[Measure response time]
        K[Verify <2s target]
        L[Test with realistic data]
    end

    A --> D
    B --> E
    C --> F

    D --> G
    E --> H
    F --> I

    G --> J
    H --> K
    I --> L

    style H fill:#34a853,color:#fff
    style K fill:#34a853,color:#fff
```

---

← [Back to Technical Architecture](../TechnicalArchitecture.md)
