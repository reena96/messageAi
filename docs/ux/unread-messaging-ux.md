# Unread Messaging UX

This document covers everything tied to unread indicators (separator, badge, read-state plumbing). See `ai-summary-ux.md` for the companion AI summary experience; the two tracks are coordinated but can progress independently.

---

## Current State (March 2025)

- [x] Inline unread separator renders at the read/unread boundary (driven by Firestore read data).
- [x] Floating “Jump to newest” chip appears when new messages arrive below the viewport.
- [x] Initial scroll-on-entry lands near the unread boundary (existing `useChatMessageView` logic).
- [x] Separator visibility is still coupled to the live unread count (needs a persistent UI flag).
- [x] Viewability callback collapses/removes the summary/separator when scrolled away (needs adjustment).
- [x] No dedicated idle/sticky handling for the unread separator once all messages are read.

---

## Goals

1. Keep the unread separator and supporting badge injected for the entire session, clearing only when the parent exits the chat or explicitly resets.
2. Decouple UI visibility from live unread counters so backend updates don’t instantly hide the separator.
3. Anchor the unread separator to the actual first unread **message id** so the indicator stays ahead of the correct bubble (even in the inverted list).
4. Preserve smooth scroll behavior (`maintainVisibleContentPosition`) while paging older history.
5. Maintain accessibility: screen-reader focus on jump actions and clear labeling for the unread boundary.

---

## Implementation Plan

1. **State Refactor**
   - Persist per-chat UI state (`separatorVisible`, `floatingBadgeVisible`, `anchorMessageId`, `lastUnreadCount`).
   - Update the store whenever unread messages arrive or are fully read (clear state when `unreadCount` → 0).
   - Maintain compatibility with All Chats unread counters (still sourced from Firestore).

2. **Row Construction (Anchor ID logic)**
   - Modify `useChatMessageView` to insert the separator *right before* the message whose id matches `anchorMessageId`.
   - When the stored anchor id is missing or stale, fall back to the freshly computed first-unread id, update the store, and keep the separator consistent.

3. **Scroll & Badge Behavior**
   - Preserve current `maintainVisibleContentPosition` logic so pagination stays smooth.
   - Use `floatingBadgeVisible` to show/hide the “Jump to newest” CTA; clear it when the user reaches the bottom.
   - Fade the anchored separator only after the parent has acknowledged the unread bundle *and* a new message (sent or received) occurs while they remain in the chat—never purely because the backend marks messages read.

4. **UX Polish**
   - Validate styling across themes, dynamic type, RTL, and high message volume.
   - Ensure badge text (counts, plurals) and separator copy remain accessible and localized.

5. **Testing / Analytics**
   - Unit tests for anchor-id logic, store state transitions, and badge visibility.
   - Update Detox/Maestro flows (scroll away, receive new messages, leave/re-enter).
   - Log analytics for badge exposures and “Jump to newest” taps (optional).

---

## Dependencies & Order

1. **State Refactor (this doc)** should land first: AI summary enhancements rely on the separator staying injected.
2. AI summary work can then consume the new flags (see `ai-summary-ux.md`).
3. Eco Mode / Settings updates are independent once both unread and summary logic have stable state hooks.

---

## PR Checklist – Unread Experience

- [ ] Add unread UI state to the store (`separatorVisible`, `floatingBadgeVisible`, `anchorMessageId`, `lastUnreadCount`) and update it when unread messages arrive or clear.
- [ ] Update `useChatMessageView` to anchor the separator by message id, with fallback when the stored anchor is missing/stale.
- [ ] Keep the separator injected for the session; clear UI state on chat exit or when `unreadCount` reaches zero.
- [ ] Validate floating badge & “Jump to newest” behavior (counts, dismissal when user reaches bottom).
- [ ] Add accessibility labels, screen-reader tests, and dynamic-type checks.
- [ ] Extend integration tests/QA scenarios for scroll, pagination, leave/re-enter, and badge persistence.
- [ ] Verify separator fade-out only triggers after the anchored unread has been acknowledged and the parent sends/receives a new message while still in the chat.
