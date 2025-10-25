# Inverted FlatList Bugfix Log

## Context
- **UX Spec:** docs/ux/flatlist-inverted-normalized-data.md
- **Validation Checklist:** docs/validation/inverted_flatlist_validation.md
- **Core Files:** lib/store/messageStore.ts, lib/store/messageSelectors.ts, app/chat/[id].tsx

---

## Issue #1 — Scroll Jump on Incoming Messages
**Symptom:** While reading older history, the view jumped when new messages arrived.
**Root Cause:** Incoming ids were inserted ahead of optimistic ones, altering content height before maintainVisibleContentPosition could anchor the viewport.
**Fix:** Merge ids in deterministic order (optimistic → incoming → preserved) and reconcile before updating the list.
**Learning:** In inverted lists, mutation order directly impacts scroll anchoring—preserve optimistic rows ahead of confirmed data.

---

## Issue #2 — Duplicate Day Headers After Pagination
**Symptom:** Loading older messages produced duplicate date headers.
**Root Cause:** Selector recomputed entire row arrays on every merge because entity maps were replaced wholesale, invalidating memoization.
**Fix:** Mutate normalized entities in place, keep ids stable, and memoize MessageRow derivation.
**Learning:** Normalization plus memoization are essential for inverted lists; avoid array churn to keep grouping logic consistent.

---

## Issue #3 — Retry-Induced Key Mismatch
**Symptom:** Retrying failed messages near the top yielded blank rows or React key warnings.
**Root Cause:** FlatList keyed rows by message.id, which swapped from temp to server id mid-render.
**Fix:** Use clientGeneratedId as the stable key during optimistic states and swap only after reconciliation.
**Learning:** Key extractors must align with reconciliation strategy; keep keys stable until the server id is authoritative.

---

## Issue #4 — Duplicate Pagination Fetches
**Symptom:** Rapid upward scrolling made multiple network calls for the same history window.
**Root Cause:** loadOlderMessages guard set loadingOlder too late, so repeated onEndReached triggers overlapped.
**Fix:** Gate pagination with per-chat loading flags and early exits, ensuring only one fetch runs at a time.
**Learning:** In inverted lists, pagination triggers fire frequently—protect Firestore with explicit in-flight guards.

---

## Watchpoints
- Revalidate getItemLayout estimates when bubble height changes; inaccurate caches can reintroduce scroll jumps.
- Keep an eye on virtualization warnings during stress tests to ensure memoization remains effective.
