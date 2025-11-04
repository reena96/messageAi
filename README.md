# MessageAI

> **WhatsApp with superpowers** - A messaging app designed for parents to instantly extract actionable insights from cluttered group chats.

## What is MessageAI?

MessageAI is a messaging app designed for parents to help them instantly extract actionable insights from cluttered group chats or one-on-one chats, whether it's school updates, birthday RSVPs, or family plans. It has key AI insights about scheduling conflicts, decisions, deadlines, priority tracking and chat summaries and is intended to make their life a little easier. MessageAI is like WhatsApp with superpowers!

### Demo

Watch the full demo here: [MessageAI Demo Video](https://drive.google.com/file/d/1UWJo5FEgeY9mnxJfPYGSnKEPS-Okftst/view?usp=sharing)

## Key Features

### Core Messaging
- Real-time one-on-one and group chat
- Offline-first architecture (messages work anywhere, sync seamlessly)
- Online/offline status indicators
- Message read receipts
- Push notifications
- Optimistic UI updates (messages appear instantly)

### AI-Powered Intelligence

MessageAI includes powerful AI features built specifically for busy parents:

1. **Smart Calendar Extraction** - Automatically detects dates, times, and events from conversations
   - "Soccer practice Tuesday 4pm" → Creates calendar event

2. **Decision Summarization** - Summarizes long conversation threads
   - "After discussing options, decided: Park at 2pm Saturday"

3. **Priority Message Highlighting** - Flags urgent messages automatically
   - Schedule changes, sick kids, deadlines get visual indicators

4. **RSVP Tracking** - Tracks responses automatically
   - Shows summary: "8 yes, 2 no, 3 maybe" with names

5. **Deadline/Reminder Extraction** - Never miss important dates
   - "Permission slip due Friday" → Automatic reminder

6. **Proactive Assistant** - Detects scheduling conflicts and suggests solutions
   - Multi-step reasoning to help coordinate complex schedules

## Technology Stack

**Frontend:**
- React Native with Expo Custom Dev Client
- TypeScript
- Zustand (state management)
- @shopify/flash-list (high-performance lists)

**Backend:**
- Firebase Authentication (email/password)
- Firebase Firestore (real-time database)
- Firebase Cloud Functions (AI processing)
- Firebase Cloud Messaging (push notifications)
- Firebase Storage (media files)

**AI:**
- OpenAI GPT-4 Turbo
- Vercel AI SDK
- LangChain (for advanced reasoning)
- RAG (Retrieval-Augmented Generation) for conversation context

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- Xcode (for iOS development)
- Android Studio (for Android development)
- Firebase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd messageAi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**

   Follow the instructions in `FIREBASE_SETUP.md`:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Enable Cloud Functions
   - Enable Cloud Storage
   - Enable Cloud Messaging
   - Download config files:
     - iOS: `GoogleService-Info.plist` (place in project root)
     - Android: `google-services.json` (place in project root)

4. **Environment Variables**

   Set up Firebase Cloud Functions environment variables:
   ```bash
   cd functions
   firebase functions:config:set openai.key="your-openai-api-key"
   ```

5. **Generate Native Projects**
   ```bash
   npx expo prebuild
   ```

6. **Run the App**
   ```bash
   # iOS
   npm run ios

   # Android
   npm run android
   ```

## Project Structure

```
messageAi/
├── app/                    # React Native app screens
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/            # Main app screens
│   │   ├── chats.tsx
│   │   └── [chatId].tsx
│   └── _layout.tsx
├── lib/                   # Shared libraries
│   ├── firebase/          # Firebase configuration
│   └── store/             # Zustand state management
├── types/                 # TypeScript type definitions
├── functions/             # Firebase Cloud Functions
│   └── src/
│       ├── ai/            # AI feature implementations
│       └── index.ts
└── docs/                  # Comprehensive documentation
    ├── prd/               # Product requirements
    ├── architecture/      # Technical architecture
    ├── prPrompts/         # Implementation guides
    └── tasks/             # Detailed task breakdowns
```

## Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[Product Requirements](docs/prd/ProductRequirements.md)** - Full PRD with user persona and features
- **[Technical Architecture](docs/architecture/TechnicalArchitecture.md)** - System design and patterns
- **[Implementation Guides](docs/prPrompts/)** - Step-by-step PR guides
- **[Parent Persona & Features](docs/MessageAI_Parent_Persona_and_Features.md)** - Design philosophy and user insights

Start with [docs/README.md](docs/README.md) for a complete documentation overview.

## Testing

Run tests with:

```bash
npm test
```

The project includes:
- Unit tests for business logic
- Integration tests for authentication and state management
- Component tests for UI
- Manual E2E testing scenarios (see `TESTING_NOTES.md`)

## Performance Targets

MessageAI is built for production-quality performance:

- Message delivery: <200ms on good network
- Offline sync: <1 second after reconnection
- Scrolling: Smooth 60 FPS through 1000+ messages
- App launch: <2 seconds to chat screen
- AI features: <2s response time (calendar, priority, RSVP)
- AI summaries: <3s for 50 messages
- Proactive Assistant: <15s for conflict detection

## Target Persona

**Busy Parent/Caregiver** - Managing 3-5 group chats daily (school, sports, family, neighborhood), juggling work and family responsibilities, needs to coordinate complex schedules without missing important information.

### Pain Points Solved

- Schedule changes buried in 50-message threads
- Deadlines forgotten among casual conversation
- Decision fatigue from re-reading threads
- Missing urgent messages in notification overload
- RSVP tracking for parties and events
- Scheduling conflicts between multiple activities

## Contributing

This project follows a test-driven development (TDD) approach. Please ensure all tests pass before submitting pull requests.

See the [complete implementation guide](docs/tasks/CompleteImplementationGuide.md) for detailed development workflows.

## License

[Add your license here]

## Contact

[Add contact information here]

---

**Built with love for busy parents everywhere.**
