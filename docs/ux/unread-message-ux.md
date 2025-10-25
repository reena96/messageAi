# Unread Message UX

## Intended User Experience
- Clearly communicate how many messages a user has not seen, without overwhelming the conversation view.
- Auto-scroll to the most relevant point: show either the first unread message or maintain current context when user is mid-thread.
- Provide unobtrusive, dismissible indicators (e.g., badges, banners) that guide the user to unread content.
- Acknowledge when all messages are read by animating away indicators smoothly.
- Ensure consistent behavior across devices and entry points (push deep links, thread list taps).

## Algorithm To Implement It
1. Track per-thread read offsets (`lastReadMessageId` or timestamp) synchronized with the backend.
2. Derive unread counts by comparing message timestamps/ids with the normalized entity list.
3. When opening a thread, compute initial scroll index: first unread message if unread exists, otherwise most recent message.
4. Render an inline "New Messages" separator component at the boundary between read and unread messages.
5. Display a floating unread badge when new messages arrive off-screen; hide once the boundary is scrolled into view.
6. Update read offsets based on visibility detection (`onViewableItemsChanged` or intersection observer) with debounce to avoid flicker.
7. Persist read state optimistically while reconciling with server acknowledgements to prevent regression after refresh.

## Potential Tool Use And Approaches
- State sync via RTK Query, Apollo cache, or REST hooks for reliable last-read persistence.
- Analytics hooks (Segment, Amplitude) to measure engagement with unread indicators and tune thresholds.
- Detox or Maestro scripts that validate badge visibility, separator placement, and read acknowledgements.
- React Native `ViewabilityHelper` or custom intersection observers for precise read tracking.
- Server support checks (websocket receipts, delta queries) to ensure read receipts are robust.

## Best Recommended Approach
Drive unread state from a single source of truth (backend last-read pointer) while applying optimistic local updates. Use an inline separator plus a floating badge for context-aware guidance. Integrate viewability callbacks with debounced updates to keep offsets accurate without performance hits. Instrument analytics to fine-tune indicator thresholds and ensure parity across platforms.

## Task List To Implement
1. **Data synchronization**
   - Extend the conversation entity with `lastReadMessageId`, `lastReadTimestamp`, and server sync metadata (etag or version).
   - Define mutation endpoints for read receipts; ensure they support batch updates for catch-up scenarios.
   - Implement hydration logic that merges server-acknowledged offsets with local optimistic pointers.
2. **Selectors and derived state**
   - Add memoized selectors that return unread counts, first unread id, and boolean flags for "has unseen new arrivals".
   - Expose helper selectors to determine whether inline separators or floating badges should render.
3. **UX components**
   - Build a `UnreadSeparator` row rendered exactly once at the read/unread boundary with accessible copy (`aria-label`/`accessibilityLabel`).
   - Create a floating badge anchored to the bottom (or top when inverted) showing count and a "Jump to newest" CTA.
   - Ensure components support theming, dark mode, and text scaling without truncation.
4. **Scroll orchestration**
   - When entering a thread, compute initial scroll index: if a first unread id exists, scroll to it and offset by header height.
   - Maintain current viewport when new messages arrive while user scrolls upward; only auto-scroll when user is near bottom threshold.
   - Integrate `maintainVisibleContentPosition` with the unread separator logic to prevent jumpiness during pagination.
5. **Read tracking pipeline**
   - Use `onViewableItemsChanged` (RN) or intersection observers (web) to detect when unread items become visible; debounce to avoid rapid toggles.
   - Immediately fire optimistic read updates and schedule server sync; reconcile receipt errors by reverting local pointer.
   - Handle reconnect scenarios by revalidating read offsets after socket reconnect or app resume.
6. **Edge case handling**
   - Define policy for messages deleted or redacted after being marked unread.
   - Ensure mention or reply badges override generic unread badge when relevant.
   - Provide fallback copy when server returns inconsistent pointers (e.g., pointer past most recent message).
7. **Testing and analytics**
   - Unit tests for selectors plus view-model logic covering zero, small, and large unread counts.
   - Visual regression tests confirming separator rendering across themes.
   - End-to-end scripts to simulate deep link into unread thread, mid-scroll arrival of new messages, and badge dismissal.
   - Instrument analytics events for badge exposure, CTA taps, auto-scroll usage, and read receipt latency.
8. **QA checklist**
   - Verify screen reader focus when jumping to unread boundary.
   - Test on devices with varying safe-area insets to ensure badge placement stays visible.
   - Confirm consistent behavior when switching between offline/online states and after manual refresh.
