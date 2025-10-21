# PR Implementation Prompts

This folder contains step-by-step implementation guides for each Pull Request.

## 📋 How to Use These Prompts

Each PR prompt is a **complete, self-contained implementation guide** including:
- ✅ Context files to read
- ✅ What already exists (code reuse)
- ✅ Clear granular tasks
- ✅ Tests to write (TDD approach)
- ✅ Patterns to follow
- ✅ Integration points
- ✅ Success criteria

**Workflow:**
1. Read the PR prompt completely
2. Read all context files listed at top
3. Follow tasks sequentially
4. Write tests FIRST (TDD)
5. Implement code
6. Verify all tests pass
7. Complete success criteria checklist
8. Commit with provided template

## 📄 PR Prompts (Sequential Order)

### Foundation (Day 1 Morning)

**Pr01AuthSetup.md** ✅ Created
- Time: 2-3 hours
- What: Project setup + Authentication
- Tests: 16 tests (Firebase config + authStore + integration)
- Creates: Firebase config, authStore, login/signup screens
- Dependencies: None (foundation)

### Core Features (Day 1)

**Pr02CoreUI.md** (TODO)
- Time: 4-5 hours
- What: Tab navigation + Chat list + Performance monitoring
- Tests: 7 tests (chatStore)
- Creates: Tab layout, chat list, performance utils
- Dependencies: PR #1

**Pr03Messaging.md** (TODO)
- Time: 7-9 hours
- What: Real-time messaging with optimistic UI
- Tests: 15 tests (messageStore + integration + performance)
- Creates: messageStore, chat screen, message components
- Dependencies: PR #1, #2
- **CRITICAL:** <200ms delivery (rubric requirement)

### Resilience (Day 2 Morning)

**Pr04Offline.md** (TODO)
- Time: 5-7 hours
- What: Offline-first support
- Tests: 7 offline scenarios + performance
- Modifies: messageStore (offline error handling)
- Dependencies: PR #1-3
- **CRITICAL:** All 7 scenarios must pass (rubric)

**Pr05Groups.md** (TODO)
- Time: 5-6 hours
- What: Group chat + Push notifications + MVP checkpoint
- Tests: 5 integration tests + MVP validation
- Creates: Group creation, push notification setup
- Dependencies: PR #1-4
- **MILESTONE:** MVP complete (11/11 requirements)

### AI Features (Day 2-3)

**Pr06AiInfrastructure.md** (TODO)
- Time: 4-5 hours
- What: Cloud Functions + Calendar extraction
- Tests: Accuracy tests (>90% required)
- Creates: Firebase Functions, calendar AI
- Dependencies: PR #1-5 (MVP)

**Pr07AiDecisionPriority.md** (TODO)
- Time: 4-5 hours
- What: Decision summarization + Priority detection
- Tests: Accuracy tests (>90% each)
- Creates: 2 AI features
- Dependencies: PR #6

**Pr08AiRsvpDeadline.md** (TODO)
- Time: 4-5 hours
- What: RSVP tracking + Deadline extraction
- Tests: Accuracy tests (>90% each)
- Creates: 2 AI features
- Dependencies: PR #6

### Advanced (Day 3-4)

**Pr09ProactiveAi.md** (TODO)
- Time: 7-9 hours
- What: Proactive Assistant with LangChain + RAG
- Tests: Accuracy + LangChain execution
- Creates: Advanced AI feature
- Dependencies: PR #6-8

**Pr10Performance.md** (TODO)
- Time: 5-7 hours
- What: Performance optimization + Testing
- Tests: E2E tests + performance benchmarks
- Modifies: Multiple files for optimization
- Dependencies: PR #1-9

**Pr11Polish.md** (TODO)
- Time: 5-7 hours
- What: Bonus features + Documentation + Demo
- Tests: Bonus feature tests
- Creates: README, PERFORMANCE.md, demo video
- Dependencies: All previous PRs
- **FINAL:** 100/100 rubric validation

## 🎯 Quick Reference

| PR | Focus | Time | Tests | Rubric Critical |
|----|-------|------|-------|-----------------|
| #1 | Auth | 2-3h | 16 | Foundation |
| #2 | UI | 4-5h | 7 | Chat list |
| #3 | Messaging | 7-9h | 15 | **<200ms delivery** |
| #4 | Offline | 5-7h | 7 | **7 scenarios** |
| #5 | Groups | 5-6h | 5 | **MVP complete** |
| #6 | AI Setup | 4-5h | Accuracy | Calendar >90% |
| #7 | AI 2-3 | 4-5h | Accuracy | **>90% each** |
| #8 | AI 4-5 | 4-5h | Accuracy | **>90% each** |
| #9 | Advanced AI | 7-9h | Accuracy | >90% |
| #10 | Performance | 5-7h | E2E + Perf | All targets |
| #11 | Polish | 5-7h | Final | **100/100** |

**Total:** 52-68 hours over 4 days

## 🔗 Related Folders

**Before starting any PR:**
1. Read [../prd/ProductRequirements.md](../prd/ProductRequirements.md)
2. Read [../architecture/](../architecture/) docs
3. Read the specific PR prompt
4. Reference [../tasks/](../tasks/) for detailed code examples

**Each PR prompt links to:**
- PRD (requirements validation)
- Architecture (data models, patterns)
- Task docs (implementation details)
- Previous PR prompts (code reuse)
