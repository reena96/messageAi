# Inverted FlatList Validation Plan

Source: docs/ux/flatlist-inverted-normalized-data.md

---

## Acceptance Criteria
- [ ] Message state stays normalized (ids + entities) with memoized selectors producing stable `MessageRow` arrays.
- [ ] `FlatList` runs inverted with stable keys and retains scroll position during new message inserts or optimistic reconciliation.
- [ ] `maintainVisibleContentPosition` (or fallback offset logic) keeps the viewport anchored while paginating.
- [ ] Day headers, unread separators, and group boundaries remain correct after appends/prepends (no duplicates).
- [ ] `getItemLayout`/cached heights prevent jumpiness when rendering large batches.
- [ ] Pagination triggers fire once per threshold with appropriate loading guards.

---

## Validation Steps
1. **Initial Load** – Open a busy chat; ensure newest messages at bottom, grouping correct, scroll smooth.
2. **Realtime Append** – Receive message while at bottom; verify auto-scroll behaviour and no jump.
3. **Optimistic Insert** – Send message mid-history; confirm list offset unchanged and reconciliation does not duplicate rows.
4. **Pagination** – Scroll upward to trigger load older; loader appears, history prepends without moving viewport, headers remain ordered.
5. **Rapid Scroll Stress** – Flick quickly through long thread; observe for blank frames or virtualization warnings.
6. **Accessibility** – With screen reader, verify correct announcement order for day headers and new messages.

---

## Instrumentation Checklist
- [ ] Performance monitor shows frame time <16 ms during pagination/optimistic reconcile.
- [ ] Logs confirm pagination throttling/debouncing (no duplicate fetches).
- [ ] Selector memoization verified via tooling (no recomputation when unrelated entities update).
