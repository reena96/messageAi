# PR #9: Proactive Assistant (LangChain + RAG) – Task Breakdown

**Estimated Time:** 7–9 hours  
**Dependencies:** PR #6 (Calendar AI), PR #7 (Decisions + Priority), PR #8 (RSVP + Deadlines)  
**Primary Goal:** Deliver the Proactive Assistant feature that analyzes family schedules, detects conflicts, recommends alternatives, and learns from parent feedback while satisfying rubric accuracy/performance targets.

---

## 📚 Pre-Implementation Reading (in order)

1. **`docs/plans/01-messageai-prd.md`** – Section 3.2 (AI requirements) & 4.2 (Proactive Assistant expectations, feedback loop).  
2. **`docs/plans/02-technical-architecture.md`** – LangChain layer, data models (`aiExtraction`, feedback storage).  
3. **`docs/plans/10-implementation-advanced.md`** – Detailed PR #9 blueprint, test plan, UI sketches.  
4. **`docs/plans/PROMPTS_FOR_EACH_PR.md` → PR #9 section** – Implementation prompt for LangChain & RAG.  
5. **`docs/prd/RubricAlignment.md`** – “Advanced AI Capability” checklist (feedback, streaming, integration).  
6. **`docs/tasks/pr6_tasks.md`, `pr7_tasks.md`, `pr8_tasks.md`** – Integration notes for calendar/decision/RSVP/deadline data feeding the assistant.  
7. **Reference PDFs** – `MessageAI.pdf`, `MessageAI Rubric.pdf` (metrics: >90 % accuracy, <15 s response, demo requirements).

---

## 🧠 Architecture Snapshot

- **LangChain callable:** `functions/src/ai/proactive.ts` (conflict detection + suggestion generation).  
- **Vector store:** Persist embeddings for recent chat history (`lib/ai/vectorStore.ts`, backing storage in Firestore).  
- **Client helpers:** `lib/ai/proactive.ts` for callable + feedback submission.  
- **UI surface:** `app/(tabs)/ai-assistant.tsx` (insight cards, thumbs up/down, deep links).  
- **Notifications:** Reuse push infra to alert parents on high-confidence conflicts.  
- **Firestore:** New collections (`proactiveInsights`, `proactiveFeedback`, `vectorStore`) plus updated rules.  
- **Performance targets:** Callable <15 s, streaming if >5 s, accuracy ≥90 %.  
- **Feedback loop:** Required for rubric – capture thumbs up/down, log analytics, persist in Firestore.

---

## ✅ Task Breakdown (testable chunks)

### 1. LangChain Cloud Function (3 h)
- [ ] **Chunk 1A – Setup & Permissions**
  - Add LangChain + embedding deps to `functions`.
  - Ensure service account has access to Firestore, Secrets, Scheduler.
  - **Tests:** `npm run lint && npm run build` (functions); deploy dry-run.
- [ ] **Chunk 1B – Conflict Detection Core**
  - Implement `detectScheduleConflicts` + available-slot generator in isolation.
  - Fetch calendar/decision/deadline/RSVP data pulled from existing collections.
  - **Tests:** Jest unit tests verifying conflict detection true/false positives.
- [ ] **Chunk 1C – LangChain Insight Generation**
  - Build callable `proactiveAssistant`: auth guard, retrieve messages (limit ~200), hydrate vector store, run LangChain chain, persist insights with TTL.
  - Measure latency; enable streaming logs when >5 s.
  - **Tests:** Firestore emulator test ensuring insights persisted correctly; mock LLM response to assert parsing.
- [ ] **Chunk 1D – Optional Background Trigger**
  - (Stretch) Add Scheduler/Firestore trigger to run automatically on new conflicting events.
  - **Tests:** Manual `firebase functions:shell proactiveAssistant` invocation.

### 2. Vector Store & Data Prep (1 h)
- [ ] **Chunk 2A – Helper Module**
  - Implement `lib/ai/vectorStore.ts` (upsert, fetch, purge, caching).
  - **Tests:** Jest verifying duplicate messages reuse cached embedding.
- [ ] **Chunk 2B – Message Pipeline Hook**
  - Integrate embedding updates post-aiExtraction; enforce max size / LRU eviction.
  - **Tests:** Integration test via emulator ensuring embeddings stored & pruned.

### 3. Client Callable Integration (45 m)
- [ ] Implement `analyzeSchedule(userId)` + `submitProactiveFeedback` in `lib/ai/proactive.ts`.
- [ ] Handle network/permission/429 errors with retries.
- **Manual validation:** Trigger helpers from RN Debugger, confirm insights returned, retry/backoff logs printed, and errors surface in UI.

### 4. AI Assistant UI (1.5 h)
- [ ] **Chunk 4A – Screen Scaffolding**
  - Implement loading/empty/error states, “Analyze Schedule” CTA, pull-to-refresh.
  - **Manual validation:** Toggle airplane mode + trigger analysis to verify state transitions manually.
- [ ] **Chunk 4B – Insight Cards**
  - Render icons, alternatives, reasoning, confidence badges, deep-link buttons.
  - **Manual validation:** Load sample insights (conflict/suggestion/reminder) and visually confirm differentiation on device.
- [ ] **Chunk 4C – Feedback Actions**
  - Wire thumbs up/down to feedback helper with optimistic update + toast.
  - **Manual validation:** Submit feedback, ensure toast shows, and Firestore `/proactiveFeedback` doc appears.

### 5. Proactive Notifications (45 m)
- [ ] When conflict insight ≥0.85 confidence is saved, enqueue FCM push with quick actions.
- [ ] Respect quiet hours (7 am–9 pm local) before sending.
- **Manual validation:** Trigger insight creation inside/outside quiet hours and verify notification behaviour on device.

### 6. Feedback & Analytics (30 m)
- [ ] Create `/proactiveFeedback/{userId}/{insightId}` schema (vote, timestamp, optional note).
- [ ] Show thank-you toast and aggregated counts when available.
- [ ] Emit analytics events (`proactive_insight_viewed`, `proactive_feedback_given`).
- **Manual validation:** Submit feedback, check Firestore doc values, confirm analytics event in Firebase DebugView.

### 7. Firestore Rules & Seed Data Fixes (30 m)
- [ ] Update `firestore.rules` for new collections (`proactiveInsights`, `proactiveFeedback`, `vectorStore`, `activeViewers`, `typing`).
- [ ] Extend debug seeding to create `/users/{uid}` docs for generated parents and populate new collections.
- [ ] Re-run seed + open chats to ensure no permission-denied logs.
- **Manual validation:** Inspect LogBox/dev console after seeding; confirm absence of permission errors.

### 8. Manual Testing, Accuracy & Performance (1.5 h)
- [ ] Build manual test plan with ≥20 conflict/non-conflict scenarios; record results.
- [ ] Run assistant against plan, ensure ≥90 % conflict detection; capture in spreadsheet and `TEST_RESULTS.md`.
- [ ] Measure Cloud Function latency via Firebase logs; document in `PERFORMANCE.md` (<15 s target, streaming if >5 s).
- [ ] Execute two-device QA: create conflicts, observe notifications, feedback persistence, offline behaviour.

### 9. Documentation & Demo Assets (30 m)
- [ ] Update README + AI docs with usage, limitations, feedback loop.
- [ ] Capture screenshots/GIF for demo (conflict insight + feedback action).
- [ ] Summarize accuracy/performance metrics for rubric submission.

---

## 🧪 Acceptance Criteria

- [ ] `proactiveAssistant` callable returns actionable `ProactiveInsight[]`.
- [ ] Conflict detection accuracy ≥90 % (documented test suite).
- [ ] LangChain response time <15 s; streaming used if >5 s.
- [ ] AI Assistant tab displays insights, alternatives, confidence badges.
- [ ] Feedback (thumbs) persists to Firestore + analytics.
- [ ] Notifications fire for high-confidence conflicts and respect quiet hours.
- [ ] Firestore rules updated; no permission-denied errors during seed/demo.
- [ ] Documentation/screenshots ready for review and demo.

---

## 🔍 Risks & Mitigations

- **Latency:** Cache embeddings, limit message context, stream when long-running.  
- **Cost:** Batch insights, avoid reprocessing unchanged history.  
- **Permissions:** Create companion `/users` docs for seeded parents; update rules before deploy.  
- **Accuracy Drift:** Maintain reusable test corpus; add fallback reassurance insight when uncertain.  
- **Fallback plan:** If LangChain workflow unstable, ship deterministic conflict detector + TODO notes, ensuring UI/feedback still functional.

---

Once these tasks pass acceptance, move to PR #10A (Performance Optimization) as outlined in the implementation guide.
