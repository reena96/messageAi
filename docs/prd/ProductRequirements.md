# MessageAI - Product Requirements Document

**Version:** 1.0
**Date:** January 20, 2025
**Project:** MessageAI - Cross-Platform Messaging App with AI Features
**Persona:** Busy Parent/Caregiver
**Timeline:** 4-Day Sprint (MVP: 24h, Final: 96h)
**Platform:** React Native + Expo Custom Dev Client

---

## Document Map

This PRD is sharded into multiple focused documents:

1. **01-messageai-prd.md** ← You are here (Main PRD)
2. [02-technical-architecture.md](./02-technical-architecture.md) - Tech stack, system design
3. [03-messaging-infrastructure.md](./03-messaging-infrastructure.md) - Real-time messaging deep dive
4. [04-implementation-guide.md](./04-implementation-guide.md) - Complete PR breakdown
5. [05-rubric-alignment.md](./05-rubric-alignment.md) - Rubric checklist & scoring

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User Persona](#2-user-persona)
3. [Requirements](#3-requirements)
4. [Success Criteria](#4-success-criteria)
5. [Timeline](#5-timeline)

---

## 1. Executive Summary

### 1.1 Project Overview

**MessageAI** is a production-quality messaging application built for **Busy Parents/Caregivers** who need to coordinate complex family schedules across multiple group chats while managing work, home, and family responsibilities.

**Core Value Proposition:**
> "MessageAI helps busy parents coordinate family schedules, track decisions, and never miss important information—even when juggling a thousand things at once. The app works reliably offline, syncs seamlessly when reconnected, and uses AI to extract calendar events, deadlines, and RSVPs from casual conversation."

**Key Differentiators:**
- ✅ **Rock-solid offline-first messaging** (survives poor connections, force-quits, airplane mode)
- ✅ **AI features purpose-built for parents** (not generic chatbot features)
- ✅ **Production-quality infrastructure** (passes rigorous stress tests)
- ✅ **Cross-platform** (iOS + Android from single codebase)

### 1.2 Why This Matters

Parents manage 3-5 group chats daily (school, sports, family, neighborhood). Important information gets buried in noise:
- Schedule changes lost in 50-message threads
- Deadlines forgotten among casual conversation
- Decision fatigue from re-reading threads to remember what was decided
- Missing urgent messages in notification overload

**MessageAI solves this with AI that understands family coordination.**

### 1.3 Target Outcome

**MVP (24 hours):**
- ✅ All 11 MVP requirements met
- ✅ Passes 7 stress tests (offline, poor network, 20 rapid messages, etc.)
- ✅ Performance benchmarks documented

**Final Submission (96 hours):**
- ✅ 5 required AI features + 1 advanced feature
- ✅ All features >90% accuracy
- ✅ Demo video, documentation, deployed app
- ✅ **Target: 100/100 points on rubric**

---

## 2. User Persona

### 2.1 Meet Sarah: Busy Parent/Caregiver

**Demographics:**
- Age: 35
- Occupation: Marketing Manager (full-time remote)
- Family: 2 kids (ages 7 and 10)
- Tech-savvy but time-constrained
- Active in 5 group chats: soccer team parents, school PTA, family, neighborhood, daughter's dance class

**Daily Context:**
- Checks phone 100+ times/day
- Receives 150+ messages across group chats
- Manages kids' schedules, work meetings, household tasks
- Often messaging on-the-go (school pickup, commute, grocery store)

### 2.2 Pain Points & Solutions

| Pain Point | Current Solution | MessageAI Solution | Impact |
|------------|------------------|-------------------|---------|
| **Schedule changes buried in group chat** | Manually scrolling, screenshots, often misses updates | AI extracts calendar events automatically → notification | Eliminates missed practices, appointments |
| **Deadlines forgotten** | Todo apps, sticky notes, often forgotten | AI extracts deadlines → reminders | Never miss permission slips, payments |
| **Decision fatigue** | Re-reading 30-message threads to remember decision | AI summarizes: "Decided: Park at 2pm Saturday" | Saves 15-20 min/day |
| **Information overload** | Fear of missing urgent messages in noise | AI highlights urgent (sick kid, schedule changes) | Reduces anxiety, faster response to urgent |
| **RSVP tracking** | Manual counting, re-asking people | AI tracks: "8 yes, 2 no, 3 maybe" with names | Instant headcount for parties, events |

### 2.3 User Stories

**Core Messaging:**
1. As a parent, I want messages to appear instantly so I can coordinate in real-time
2. As a parent, I want messages to work offline so I can message from anywhere (subway, basement)
3. As a parent, I want read receipts so I know if urgent messages were seen
4. As a parent, I want group chats so I can coordinate with multiple families
5. As a parent, I want messages to persist after force-quit so I never lose information

**AI Features:**
6. As a parent, I want calendar events auto-extracted so I never miss schedule changes
7. As a parent, I want decisions summarized so I know what was decided without re-reading
8. As a parent, I want priority messages highlighted so I focus on what's urgent
9. As a parent, I want RSVPs tracked automatically so I know who's coming to events
10. As a parent, I want deadlines extracted so I don't miss commitments
11. As a parent, I want proactive conflict detection so I don't double-book activities

### 2.4 Success Metrics (Post-Launch)

- **Time saved:** 15-20 minutes daily (no manual calendar entry, no re-reading threads)
- **Missed events:** Reduce from 2-3/month to near-zero
- **Stress reduction:** Reduced "fear of missing important info"
- **Adoption:** Primary messaging app for family coordination

---

## 3. Requirements

### 3.1 MVP Requirements (24 Hours - Hard Gate)

**Must have ALL 11 to pass MVP checkpoint:**

1. ✅ **One-on-one chat functionality**
2. ✅ **Real-time message delivery** between 2+ users
3. ✅ **Message persistence** (survives app restarts)
4. ✅ **Optimistic UI updates** (messages appear instantly before server confirmation)
5. ✅ **Online/offline status indicators**
6. ✅ **Message timestamps**
7. ✅ **User authentication** (users have accounts/profiles)
8. ✅ **Basic group chat** (3+ users in one conversation)
9. ✅ **Message read receipts**
10. ✅ **Push notifications** (at least in foreground)
11. ✅ **Deployment:** Running on local emulator with deployed backend

**Additional MVP Requirements (From Rubric):**
- ✅ Sub-200ms message delivery on good network
- ✅ Sub-1 second sync after reconnection
- ✅ Smooth 60 FPS scrolling through 1000+ messages
- ✅ App launch to chat screen <2 seconds
- ✅ Connection status UI visible
- ✅ Pending message count displayed

### 3.2 AI Feature Requirements (Days 2-4)

**All 5 Required Features (Busy Parent/Caregiver):**

1. ✅ **Smart calendar extraction**
   - Extracts dates, times, events from messages
   - "Soccer practice Tuesday 4pm" → calendar event
   - Accuracy: 90%+
   - Response time: <2s

2. ✅ **Decision summarization**
   - Summarizes long conversation threads
   - "After discussing options, decided: Park at 2pm Saturday"
   - Accuracy: 90%+
   - Response time: <3s for 50 messages

3. ✅ **Priority message highlighting**
   - Flags urgent messages (schedule changes, sick kids, deadlines)
   - Visual indicator (red badge)
   - Accuracy: 90%+
   - Response time: <2s

4. ✅ **RSVP tracking**
   - Tracks yes/no/maybe responses
   - Shows summary: "8 yes, 2 no, 3 maybe"
   - Lists names
   - Accuracy: 90%+

5. ✅ **Deadline/reminder extraction**
   - Extracts deadlines from messages
   - "Permission slip due Friday" → reminder
   - Notification before due date
   - Accuracy: 90%+

**1 Advanced Feature (Choose from 2 options):**

**Option A: Proactive Assistant** ← Our Choice
- Detects scheduling conflicts
- Suggests alternative times
- Uses LangChain for multi-step reasoning
- Response time: <15s
- User feedback mechanism (thumbs up/down)

**Option B: Multi-Step Agent**
- Plans weekend activities based on family preferences
- Autonomous multi-step workflow
- (Not chosen for this project)

### 3.3 Required Deliverables (Pass/Fail)

**1. Demo Video (5-7 minutes)**
- ✅ Real-time messaging between 2 physical devices (both visible on screen)
- ✅ Group chat with 3+ participants
- ✅ Offline scenario (go offline → receive messages → come online)
- ✅ App lifecycle (background, foreground, force quit)
- ✅ All 5 required AI features with examples
- ✅ Advanced AI capability (Proactive Assistant)
- ✅ Technical architecture explanation (30 seconds)
- ✅ Clear audio and video quality

**2. Persona Brainlift (1 page)**
- ✅ Chosen persona and justification
- ✅ Specific pain points addressed
- ✅ How each AI feature solves a real problem
- ✅ Key technical decisions made

**3. Social Post**
- ✅ Post on X (Twitter) or LinkedIn
- ✅ Brief description (2-3 sentences)
- ✅ Key features and persona
- ✅ Demo video or screenshots
- ✅ Tag @GauntletAI

**4. GitHub Repository**
- ✅ Clear, comprehensive README
- ✅ Architecture overview with diagrams
- ✅ Environment variables template
- ✅ Setup instructions
- ✅ Code well-commented

---

## 4. Success Criteria

### 4.1 MVP Checkpoint (24 Hours)

**Gate 1: All 11 MVP Requirements**
- [ ] One-on-one chat
- [ ] Real-time delivery
- [ ] Persistence
- [ ] Optimistic UI
- [ ] Online/offline status
- [ ] Timestamps
- [ ] Authentication
- [ ] Group chat
- [ ] Read receipts
- [ ] Push notifications
- [ ] Deployed locally

**Gate 2: Ash's 7 Test Scenarios**
- [ ] Two devices chatting in real-time
- [ ] Offline → receive messages → online
- [ ] Messages sent while app backgrounded
- [ ] Force-quit and reopen (persistence)
- [ ] Poor network conditions (3G)
- [ ] 20+ rapid messages (no lag)
- [ ] Group chat with 3+ participants

**Gate 3: Performance Benchmarks**
- [ ] Message delivery <200ms (measured)
- [ ] Offline sync <1s (measured)
- [ ] Scrolling 1000+ messages at 60 FPS
- [ ] Launch time <2s (measured)

**DO NOT PROCEED TO AI FEATURES UNTIL ALL GATES PASS**

### 4.2 Final Submission (96 Hours)

**Must Have:**
- [ ] All MVP requirements passing
- [ ] All 5 AI features implemented
- [ ] 1 advanced AI feature implemented
- [ ] All AI features >90% accuracy (documented)
- [ ] Demo video complete (5-7 min)
- [ ] Persona Brainlift written
- [ ] README with architecture diagrams
- [ ] Performance metrics documented
- [ ] Social post published

**Bonus Features (For 100+ points):**
- [ ] Dark mode support
- [ ] Smooth animations throughout
- [ ] Voice message transcription (Innovation +3)
- [ ] Message reactions (Advanced Features +2)
- [ ] Link previews (Advanced Features +2)
- [ ] Performance monitoring (Technical Excellence +2)

### 4.3 Rubric Score Projection

| Section | Max Points | Target | Key Requirements |
|---------|-----------|--------|------------------|
| Core Messaging Infrastructure | 35 | 35 | Sub-200ms delivery, sub-1s sync, group chat with member list |
| Mobile App Quality | 20 | 20 | <2s launch, 60 FPS scrolling, optimistic UI, animations |
| AI Features Implementation | 30 | 30 | All 5 features >90% accuracy, <2s response, Proactive Assistant <15s |
| Technical Implementation | 10 | 10 | API keys secured, RAG pipeline, rate limiting |
| Documentation & Deployment | 5 | 5 | README with diagrams, architecture explanation |
| **Base Score** | **100** | **100** | |
| **Bonus Points** | **+10** | **+5-10** | Innovation, Polish, Technical Excellence, Advanced Features |
| **TOTAL TARGET** | | **105-110** | |

---

## 5. Timeline

### 5.1 Day-by-Day Breakdown

| Day | Hours | Phase | PRs | Deliverable | Success Criteria |
|-----|-------|-------|-----|-------------|------------------|
| **Day 1** | 0-24h | MVP | #1-5 | ✅ MVP Checkpoint | All 11 requirements + 7 tests pass |
| **Day 2** | 24-48h | AI Features 1-3 | #6-8 | 3/6 AI features | Calendar, Decision, Priority, RSVP, Deadline working |
| **Day 3** | 48-72h | Advanced AI + Perf | #9-11A | All AI + Optimization | Proactive Assistant + Bonus features |
| **Day 4** | 72-96h | Testing + Docs | #10B-11B | 🚀 Final Submission | Demo video, README, all tests passing |

### 5.2 Critical Path

**Day 1 Critical Path:**
```
PR #1 (Setup + Auth) → PR #2 (UI + Perf) → PR #3 (Real-time)
                                              ↓
                               PR #4 (Offline) ⟷ PR #5 (Group + Push)
                                              ↓
                                        MVP CHECKPOINT
```

**Days 2-4 Critical Path:**
```
PR #6 (AI Infrastructure)
         ↓
PR #7 (Decision + Priority) ⟷ PR #8 (RSVP + Deadlines)
         ↓
PR #9 (Proactive Assistant)
         ↓
PR #10A (Performance) → PR #10B (Testing) → PR #11B (Demo + Docs)
```

**Parallel Work Opportunities:**
- Day 1: PR #4 and #5 can run in parallel (different features, minimal file overlap)
- Day 2: PR #7 and #8 can run in parallel (different Cloud Functions)
- Day 3: PR #11A (bonus) can overlap with PR #9 if ahead of schedule

### 5.3 Risk Mitigation

**If Behind Schedule:**

**End of Day 1:**
- If MVP not complete → Work overnight, skip sleep (MVP is hard gate)
- If specific feature failing → Simplify implementation (e.g., basic notifications instead of perfect)

**End of Day 2:**
- If <3 AI features done → Skip PR #11A (bonus features)
- Focus on 5 required features only

**End of Day 3:**
- If Proactive Assistant not working → Simplify (basic conflict detection without suggestions)
- If all AI features working → Proceed to testing

**End of Day 4:**
- If demo video not perfect → Ship what you have (video is pass/fail)
- Prioritize: Working features > Perfect documentation

---

## 6. Next Steps

**Start Here:**
1. Read [02-technical-architecture.md](./02-technical-architecture.md) for tech stack details
2. Read [03-messaging-infrastructure.md](./03-messaging-infrastructure.md) for offline-first patterns
3. Follow [04-implementation-guide.md](./04-implementation-guide.md) PR-by-PR
4. Track progress with [05-rubric-alignment.md](./05-rubric-alignment.md)

**Begin Implementation:**
```bash
cd /Users/reena/Desktop/Project\ 2
npx create-expo-app messageai --template blank-typescript
cd messageai
git init
git add .
git commit -m "Initial commit - MessageAI project"

# Start PR #1
git checkout -b feature/setup-and-auth
```

---

## 7. Key Principles

**Build Philosophy:**
1. **MVP first, polish later** - Don't add features until core messaging is solid
2. **Measure everything** - Document all performance benchmarks
3. **Test on real devices** - Simulators hide issues
4. **Commit frequently** - At least daily, ideally after each PR
5. **Offline-first always** - Every feature must work offline

**AI Philosophy:**
1. **Accuracy over features** - 3 features at 95% accuracy > 5 features at 70%
2. **Speed matters** - <2s response times or users won't use it
3. **Fail gracefully** - Show error messages, allow retry
4. **Learn from feedback** - Track thumbs up/down for future improvements

**Quality Standards:**
- Zero bugs that break core messaging
- All performance targets documented
- 90%+ AI accuracy on test cases
- Smooth 60 FPS animations
- Production-ready code quality

---

**Ready to build? Start with PR #1 in the [Implementation Guide](./04-implementation-guide.md).**
