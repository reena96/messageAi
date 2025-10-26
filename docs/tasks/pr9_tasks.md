# PR #9: Proactive Assistant (LangChain + RAG) – Task Breakdown

**Estimated Time:** 7-9 hours  
**Dependencies:** PR #6 (Calendar AI), PR #7 (Decisions + Priority), PR #8 (RSVP + Deadlines)  
**Primary Goal:** Ship the advanced “Proactive Assistant” experience that detects scheduling conflicts, recommends alternatives, and learns from parent feedback while meeting rubric accuracy and performance targets.

---

## 📚 Pre-Implementation: Required Context Review

Review these sources (in order) before writing code:

1. **`docs/plans/01-messageai-prd.md`**
   - Section 3.2 → AI feature requirements (Proactive Assistant accuracy <15 s, feedback loop).
   - Section 4.2 → Advanced feature expectations (conflict detection, suggestions, UX).
2. **`docs/plans/02-technical-architecture.md`**
   - System architecture overview (LangChain layer, Cloud Functions).
   - Data model extensions (`aiExtraction`, calendar events, feedback storage).
3. **`docs/plans/10-implementation-advanced.md`**
   - Full PR #9 blueprint (function skeletons, UI wireframe, accuracy tests).
4. **`docs/plans/PROMPTS_FOR_EACH_PR.md` → PR #9 section**
   - Implementation prompt for LangChain & RAG setup.
5. **`docs/prd/RubricAlignment.md` → “Advanced AI Capability”**
   - Checklist for rubric compliance (feedback capture, stream if >5 s, integration with other AI features).
6. **`docs/tasks/pr6_tasks.md`, `pr7_tasks.md`, `pr8_tasks.md` (Integration notes at end)**
   - Understand which data the assistant must reuse (calendar events, decisions, RSVP/deadlines).
7. **External (PDF) reference:** `MessageAI.pdf` & `MessageAI Rubric.pdf`
   - Highlight performance (<15 s), accuracy (>90%), and demo expectations (Proactive Assistant double-booking scenario).

---

## 🧠 Key Architecture References

- **Data Sources:** Calendar events, decisions, RSVP/deadline insights stored in `aiExtraction`.
- **RAG Storage:** Vector store / embeddings for recent conversations (LangChain retriever).
- **Cloud Functions:** Callable `proactiveAssistant` (LangChain pipeline), background triggers for proactive notifications.
- **Client Modules:** `lib/ai/proactive.ts`, `lib/ai/vectorStore.ts`, `app/(tabs)/ai-assistant.tsx`.
- **Feedback:** Firestore collection (e.g., `/proactiveFeedback`) to log thumbs up/down per insight + reasoning.
- **Permissions:** Update Firestore security rules to allow participants to read/write new collections/fields (`activeViewers`, `proactiveInsights`, `proactiveFeedback`).

---

## ✅ Task Breakdown

### 1. Backend: LangChain + RAG Cloud Function (3h)
- [ ] Add LangChain deps in `functions` (`langchain`, `@langchain/openai`, `@langchain/community`, embeddings provider).
- [ ] Implement `functions/src/ai/proactive.ts`:
  - [ ] Authenticate caller; reject unauthenticated.
  - [ ] Fetch user calendar/decision/deadline/RSVP data (use existing collections).
  - [ ] Retrieve recent message snippets (limit ~200, exclude noise).
  - [ ] Build/refresh vector store (e.g., Firestore collection `ai_vector_store/{chatId}` with embeddings).
  - [ ] Detect conflicts locally (time overlap) before invoking LLM.
  - [ ] If conflicts → call LangChain chain:
    - Prompt with conflicts + available slots.
    - Generate `ProactiveInsight[]` with alternatives, reasoning, confidence.
  - [ ] If no conflicts → return reassurance insight.
  - [ ] Persist returned insights (for notification + audit) in `/proactiveInsights/{userId}/{insightId}` with TTL.
  - [ ] Log execution time; if >5 s, enable response streaming per rubric.
- [ ] Add callable function export in `functions/src/index.ts`.
- [ ] Create optional background trigger (Cloud Scheduler / Firestore trigger) to auto-run when new conflicting event arrives (deferred if time).

### 2. Vector Store & Data Prep (1h)
- [ ] `lib/ai/vectorStore.ts`: helper to upsert message embeddings locally before sending to Cloud Function.
- [ ] Decide embedding provider (OpenAI vs. local). Cache embeddings per message to avoid recompute.
- [ ] Hook vector store updates into message pipeline (after AI extraction success).
- [ ] Ensure storage cleanup (limit oldest entries, remove when chat deleted).

### 3. Client Integration (`lib/ai/proactive.ts`) (45 m)
- [ ] Implement callable wrapper `analyzeSchedule(userId)` with proper types.
- [ ] Handle loading/error states and surface logging.
- [ ] Add helper to submit feedback (`submitProactiveFeedback(insightId, vote)`).

### 4. AI Assistant UI (1.5h)
- [ ] Build `app/(tabs)/ai-assistant.tsx` per design:
  - [ ] Analyze button (disabled while loading), show spinner.
  - [ ] Insight cards: icon by type (conflict/suggestion/reminder), title, description, reasoning, alternatives list.
  - [ ] Thumbs-up / thumbs-down buttons; send feedback, optimistic UI.
  - [ ] Confidence badges for low-confidence results.
  - [ ] Link to open relevant chat or calendar event when user taps insight.
- [ ] Add empty/loading/error states; allow pull-to-refresh.

### 5. Proactive Notifications & Triggers (45 m)
- [ ] When new high-confidence conflict insight generated, enqueue FCM push (reuse notification CF from PR5).
- [ ] Include quick actions (e.g., “Notify other parent”, “View calendar”).
- [ ] Respect quiet hours—schedule notifications during 7 am–9 pm local.

### 6. Feedback & Analytics (30 m)
- [ ] Create Firestore collection `/proactiveFeedback/{userId}/{insightId}` with vote + timestamp.
- [ ] Update rubric checklist: store aggregated counts, surface positive reinforcement in UI (“Thanks!”).
- [ ] Log analytics events (`proactive_insight_viewed`, `proactive_feedback_given`) for later analysis.

### 7. Firestore Rules & Seed Data Updates (30 m)
- [ ] Update `firestore.rules`:
  - [ ] Allow participants to read/write `activeViewers`, `typing`, `proactiveInsights`, `proactiveFeedback`, vector store docs.
  - [ ] Restrict feedback write to owning user.
- [ ] Update debug seeding (`app/(tabs)/debug.tsx`) to ensure generated partner UIDs also create lightweight `/users` docs, preventing permission-denied logs.
- [ ] Re-run seed and verify no “Missing or insufficient permissions” errors.

### 8. Testing & Quality (1.5h)
- [ ] **Unit tests:** conflict detector (true/false positives), vector store retrieval, LangChain prompt formatting.
- [ ] **Accuracy suite:** replicate >90 % detection accuracy (minimum 20 conflict scenarios as described in plan).
- [ ] **Integration tests:** mock callable to ensure UI renders insights + handles feedback.
- [ ] **Performance:** log Cloud Function execution; capture metrics in `PERFORMANCE.md` (<15 s target).
- [ ] **Manual QA scripts:** two-device scenario verifying push notifications, offline resilience, feedback persistence.

### 9. Documentation & Demo Prep (30 m)
- [ ] Update README + AI feature docs with Proactive Assistant usage, limitations, and feedback loop.
- [ ] Capture screenshots/GIF for demo (conflict detected, alternative suggestion, feedback action).
- [ ] Note accuracy/performance results for rubric submission.

---

## 🧪 Acceptance Criteria Checklist

- [ ] LangChain callable returns `ProactiveInsight[]` with alternatives + reasoning.
- [ ] Conflict detection accuracy ≥90 % (documented tests).
- [ ] Response time <15 s (logged + documented); streaming if >5 s.
- [ ] Insights surface in AI Assistant tab with actionable UI.
- [ ] Thumbs up/down feedback persists to Firestore and updates analytics.
- [ ] Push notification fires when new conflict insight generated.
- [ ] Firestore security rules updated; no permission-denied errors.
- [ ] Documentation + screenshots ready for demo/rubric.

---

## 📎 Notes & Risks

- **LangChain latency:** Cache embeddings and limit context to avoid timeouts.
- **OpenAI cost:** Batch conflict summaries; avoid re-processing unchanged history.
- **Permissions:** Ensure seeded chats include real `/users` entries to avoid errors seen in current logs.
- **Feedback UX:** Keep it optional but visible, as rubric explicitly checks for learning loop.
- **Fallback plan:** If LangChain workflow unstable, provide basic conflict detector with clear TODO for advanced flow (still document).

---

Once tasks are complete, proceed to PR #10A (Performance Optimization) per implementation guide.

