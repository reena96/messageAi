# Optimistic UI Bugfix Log

## Context
- **UX Spec:** docs/ux/optimistic-ui-update-ux.md
- **Validation Checklist:** docs/validation/optimistic_ui_validation.md
- **Core Files:** lib/store/messageStore.ts, lib/store/messageSelectors.ts, components/messages/MessageBubble.tsx

---

## Issue #1 — Flicker When Messages Confirmed
**Symptom:** Optimistic bubble disappeared briefly before the confirmed message appeared, creating a visible gap.
**Root Cause:** sendMessage removed the optimistic entry (removeMessagesById) and relied on Firestore snapshots to add the confirmed record; the id swap changed the list key.
**Fix:** Reconcile in place—swap the optimistic entity’s clientGeneratedId to the server id, update status metadata, and avoid removing the row.
**Learning:** Avoid remove/reinsert patterns for optimistic data; in-place reconciliation keeps UI stable and reduces render churn.

---

## Issue #2 — Duplicate Bubbles During Slow Network
**Symptom:** Both optimistic and confirmed messages showed simultaneously after latency spikes.
**Root Cause:** Snapshot merge logic only compared id, so server payloads with new ids bypassed the dedupe.
**Fix:** Persist a clientGeneratedId through the network call and map the snapshot entry back to the optimistic entity via optimisticIdMap.
**Learning:** Idempotent optimistic flows need a stable client key that survives retries and reconciliations.

---

## Issue #3 — Retry Queue Referencing Stale IDs
**Symptom:** Retried messages occasionally vanished; retry queue still held the old temp id.
**Root Cause:** Queue tracked tempId, but reconciliation swapped ids, so subsequent retries targeted missing records.
**Fix:** Normalize all optimistic bookkeeping (retryQueue, sendingMessages, metadata) around clientGeneratedId.
**Learning:** Pick one canonical identifier for optimistic lifecycle and use it everywhere (queueing, telemetry, reconciliation).

---

## Issue #4 — Missing Accessibility Feedback
**Symptom:** VoiceOver/TalkBack users received no status updates for pending or failed sends.
**Root Cause:** Message bubble component lacked accessibility role/announcements tailored to optimistic states.
**Fix:** Added live-region announcements, status labels, and retry hints reflecting optimisticStatus.
**Learning:** Visual affordances (opacity, icons) must be mirrored with accessible cues during optimistic flows.

---

## Watchpoints
- Monitor optimisticMetadata growth; implement GC if retries linger.
- Ensure server-side schema (Firestore rules, Cloud Functions) allow the clientGeneratedId field to prevent write rejections.
