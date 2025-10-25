# Optimistic UI Validation Plan

Source: docs/ux/optimistic-ui-update-ux.md

---

## Acceptance Criteria
- [ ] Optimistic bubbles appear instantly and remain until Firestore confirmation (no removal/reinsert flicker).
- [ ] Reconciliation swaps `clientGeneratedId` to server id in place; no duplicate bubbles or key churn.
- [ ] Lifecycle metadata (`optimisticStatus`, `optimisticEnqueuedAt`, `optimisticSettledAt`, `retryCount`) is populated for every optimistic send.
- [ ] Failed sends stay visible with inline retry affordances, `optimisticStatus: failed`, and actionable error text.
- [ ] Screen readers announce pending/failed states and expose retry hints per UX guidance.
- [ ] Retry actions return message to pending, increment retry count, and settle cleanly with one bubble.

---

## Validation Steps
1. **Happy Path Send** – Send with good network; confirm immediate bubble, no flicker, metadata transitions pending → confirmed.
2. **Offline Failure** – Disable network, send message; bubble shows failure styling, retry CTA, joins retry queue.
3. **Manual Retry** – Restore network, tap retry; message returns to pending, retry count increments, resolves without duplication.
4. **Telemetry Check** – Inspect logs/devtools for lifecycle events (`enqueued`, `resolved`, `failed`, `retried`) carrying `clientGeneratedId` and timing info.
5. **Accessibility Pass** – With VoiceOver/TalkBack enabled, walk send → fail → retry; confirm spoken updates and retry hints.
6. **State Integrity** – Navigate away/back or reload data; ensure no orphaned optimistic entries remain and metadata persists.

---

## Instrumentation Checklist
- [ ] Console/analytics record optimistic lifecycle metrics.
- [ ] Reducer snapshots captured before/after reconciliation show in-place id swap.
- [ ] Retry success/failure rates monitored (dashboard or logs).
