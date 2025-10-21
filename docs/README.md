# MessageAI Documentation

Complete documentation for building MessageAI - a cross-platform messaging app with AI features for busy parents.

## 🎯 Project Goal

Build a **production-quality messaging app** in **4 days** that scores **100/100 points** on the Gauntlet AI rubric.

**Key Features:**
- Real-time messaging (iOS + Android)
- Offline-first architecture
- Group chats with push notifications
- 5 AI features (>90% accuracy each)
- 1 Advanced AI feature (Proactive Assistant)

---

## 📁 Documentation Structure

```
docs/
├── prd/              Product requirements & rubric
├── architecture/     Technical design & patterns
├── prPrompts/        Step-by-step PR implementation guides
└── tasks/            Detailed task breakdowns & code examples
```

---

## 🚀 Quick Start

### For First-Time Setup

1. **Read Product Requirements** (15 min)
   ```
   docs/prd/ProductRequirements.md
   ```
   Understand WHAT we're building and WHY.

2. **Review Technical Architecture** (20 min)
   ```
   docs/architecture/TechnicalArchitecture.md
   ```
   Understand HOW it's designed.

3. **Start Implementation** (Day 1)
   ```
   docs/prPrompts/Pr01AuthSetup.md
   ```
   Follow step-by-step to implement PR #1.

### For Ongoing Development

**Implementing a PR?**
→ Go to `docs/prPrompts/Pr0X[Feature].md`

**Need code examples?**
→ Go to `docs/tasks/[Feature]Tasks.md`

**Checking rubric compliance?**
→ Go to `docs/prd/RubricAlignment.md`

**Understanding patterns?**
→ Go to `docs/architecture/MessagingInfrastructure.md`

---

## 📚 Folder Details

### 1. prd/ (Product Requirements)

**What's inside:**
- `ProductRequirements.md` - Complete PRD with user persona, features, timeline
- `RubricAlignment.md` - Scoring checklist for 100/100 points

**When to read:**
- **Before starting:** Understand requirements
- **Throughout:** Validate against rubric
- **Before submission:** Final checklist

**Key info:**
- User persona: Busy Parent/Caregiver
- 11 MVP requirements (Day 1-2)
- 5 AI features + 1 advanced (Day 2-3)
- Performance targets (<200ms delivery, <1s offline sync)

[Read prd/README.md](./prd/README.md)

---

### 2. architecture/ (Technical Design)

**What's inside:**
- `TechnicalArchitecture.md` - Tech stack, data models, security, performance
- `MessagingInfrastructure.md` - Real-time patterns, offline-first, common pitfalls

**When to read:**
- **Before PR #1:** Firebase setup, data models
- **Before PR #3:** Real-time messaging patterns
- **Before PR #4:** Offline-first architecture
- **When stuck:** Common pitfalls & solutions

**Key info:**
- Tech stack: React Native + Expo + Firebase + OpenAI
- Data models: User, Chat, Message
- Real-time sync with Firestore listeners
- Optimistic UI pattern
- Offline persistence with react-native-firebase

[Read architecture/README.md](./architecture/README.md)

---

### 3. prPrompts/ (Implementation Guides)

**What's inside:**
- 11 PR prompts (`Pr01AuthSetup.md` through `Pr11Polish.md`)
- Each is a complete, self-contained implementation guide

**When to read:**
- **Sequentially:** PR #1 → #2 → #3 → ... → #11
- **One at a time:** Focus on current PR only
- **Before coding:** Read entire prompt first

**Each prompt includes:**
- ✅ Context files to read
- ✅ What already exists (code reuse)
- ✅ Clear granular tasks (CREATE vs MODIFY)
- ✅ Tests to write (TDD approach)
- ✅ Patterns to follow
- ✅ Integration points
- ✅ Success criteria (tests must pass)

**PR sequence:**
```
Day 1 Morning:  PR #1  Auth Setup           (2-3h)
Day 1:          PR #2  Core UI              (4-5h)
                PR #3  Messaging            (7-9h)
Day 2 Morning:  PR #4  Offline              (5-7h)
                PR #5  Groups + MVP         (5-6h)
Day 2-3:        PR #6  AI Infrastructure    (4-5h)
                PR #7  AI Decision/Priority (4-5h)
                PR #8  AI RSVP/Deadline     (4-5h)
Day 3-4:        PR #9  Proactive AI         (7-9h)
                PR #10 Performance          (5-7h)
                PR #11 Polish + Docs         (5-7h)
```

[Read prPrompts/README.md](./prPrompts/README.md)

---

### 4. tasks/ (Detailed Reference)

**What's inside:**
- `CompleteImplementationGuide.md` - All 13 PRs in one document (85KB)
- `FoundationTasks.md` - PR #1 detailed tasks with full test code
- `CoreMessagingTasks.md` - PR #2-3 detailed tasks
- `ShardingStrategy.md` - How documentation is organized

**When to read:**
- **Need complete code example:** Check specific task file
- **Want full picture:** Read CompleteImplementationGuide.md
- **Understanding structure:** Read ShardingStrategy.md

**Use as:**
- Code example library
- Test pattern reference
- Deep dive documentation
- Supplement to PR prompts

[Read tasks/README.md](./tasks/README.md)

---

## 🎓 Recommended Learning Path

### Path 1: For Implementers (Coding Agents)

```
1. Read ProductRequirements.md (WHAT we're building)
   ↓
2. Read TechnicalArchitecture.md (HOW it's designed)
   ↓
3. Start with Pr01AuthSetup.md
   ↓
4. Follow PR prompts sequentially (#1 → #11)
   ↓
5. Reference task docs for detailed code examples
   ↓
6. Validate against RubricAlignment.md throughout
```

### Path 2: For Project Managers

```
1. Read ProductRequirements.md
   ↓
2. Review prPrompts/README.md (understand PR structure)
   ↓
3. Track progress with RubricAlignment.md
```

### Path 3: For Architects/Reviewers

```
1. Read TechnicalArchitecture.md
   ↓
2. Read MessagingInfrastructure.md (deep dive)
   ↓
3. Review specific PR prompts for technical decisions
```

---

## 🧪 Test-Driven Development

All PR prompts follow **TDD (Test-Driven Development)**:

1. **RED:** Write tests first (they fail)
2. **GREEN:** Implement code to pass tests
3. **REFACTOR:** Improve code quality

**Test counts by PR:**
- PR #1: 16 tests (auth)
- PR #2: 7 tests (UI)
- PR #3: 15 tests (messaging) + performance <200ms ⚠️
- PR #4: 7 tests (offline scenarios) ⚠️
- PR #5: 5 tests (groups) + MVP validation
- PR #6-8: 25+ tests (AI accuracy >90%) ⚠️
- PR #9: Advanced AI tests
- PR #10: E2E + performance benchmarks
- PR #11: Final validation

**Total: ~85 tests**

⚠️ = Rubric requirement (must pass)

---

## 📊 Success Metrics

### Day 1 Checkpoint (24h)
- ✅ PR #1-3 complete
- ✅ Real-time messaging working
- ✅ <200ms message delivery

### Day 2 Checkpoint (48h - MVP)
- ✅ PR #4-5 complete
- ✅ Offline support (7 scenarios pass)
- ✅ Group chat working
- ✅ Push notifications
- ✅ **All 11 MVP requirements met**

### Day 3 Checkpoint (72h)
- ✅ PR #6-9 complete
- ✅ All 5 AI features >90% accuracy
- ✅ Proactive Assistant working

### Day 4 Final (96h)
- ✅ PR #10-11 complete
- ✅ Performance optimized
- ✅ Documentation complete
- ✅ Demo video recorded
- ✅ **100/100 points on rubric**

---

## 🛠️ Technology Stack

**Frontend:**
- React Native + Expo Custom Dev Client
- TypeScript (type safety)
- Zustand (state management)
- FlashList (60 FPS performance)

**Backend:**
- Firebase Firestore (real-time database)
- Firebase Auth (email/password)
- Firebase Cloud Functions (AI processing)
- Firebase Cloud Messaging (push notifications)

**AI:**
- OpenAI GPT-4 Turbo
- AI SDK by Vercel (simple features)
- LangChain (advanced features)
- RAG (conversation history)

**Testing:**
- Jest (unit tests)
- React Native Testing Library (integration)
- Manual testing (E2E scenarios)

---

## 📖 Additional Resources

**Firebase Setup:**
- Create project at https://console.firebase.google.com
- Enable Authentication, Firestore, Functions, Storage, Messaging
- Download config files (referenced in PR #1)

**OpenAI Setup:**
- Get API key at https://platform.openai.com
- Set as Firebase secret (referenced in PR #6)

**Development Tools:**
- Node.js 18+
- Expo CLI
- Xcode (iOS)
- Android Studio (Android)
- Firebase CLI

---

## 🤝 Contributing

This documentation follows these principles:

**1. Context-Aware**
- Each PR knows what came before
- Explicit MODIFY vs CREATE
- Shows code reuse opportunities

**2. Test-Driven**
- Tests integrated into tasks
- TDD workflow enforced
- Success = tests pass

**3. Software Engineering Principles**
- Patterns documented and reused
- Separation of concerns
- DRY (Don't Repeat Yourself)

**4. Practical**
- Real code examples
- Verification checklists
- Performance benchmarks

---

## 📞 Getting Help

**If stuck on:**
- **Requirements:** Check `prd/ProductRequirements.md`
- **Technical design:** Check `architecture/TechnicalArchitecture.md`
- **Implementation:** Check current PR prompt in `prPrompts/`
- **Code examples:** Check `tasks/[Feature]Tasks.md`
- **Patterns:** Check `architecture/MessagingInfrastructure.md`
- **Testing:** Check specific PR prompt's test section

**Common issues:** See `architecture/MessagingInfrastructure.md` Section 7

---

## 🎯 Next Steps

**Ready to start?**

1. ✅ Read `prd/ProductRequirements.md`
2. ✅ Read `architecture/TechnicalArchitecture.md`
3. ✅ Open `prPrompts/Pr01AuthSetup.md`
4. ✅ Follow the guide step-by-step
5. ✅ Write tests first (TDD)
6. ✅ Implement code
7. ✅ Verify all tests pass
8. ✅ Move to PR #2

**Let's build MessageAI! 🚀**

---

*Last updated: 2025-01-20*
*Total documentation: ~200KB across 20+ files*
*Estimated reading time: 2-3 hours for complete understanding*
