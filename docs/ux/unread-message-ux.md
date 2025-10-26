# Unread Message UX

## Intended User Experience
- Clearly communicate how many messages a user has not seen, without overwhelming the conversation view.
- Auto-scroll to the most relevant point: show either the first unread message (anchored near the composer) or maintain current context when user is mid-thread.
- Provide unobtrusive, dismissible indicators (e.g., badges, banners) that guide the user to unread content.
- Acknowledge when all messages are read by animating away indicators smoothly.
- Ensure consistent behavior across devices and entry points (push deep links, thread list taps).
- Surface a collapsible AI summary card directly above the unread separator so parents can catch up without scrolling back through older context, and keep both elements present until the user leaves the thread.
- Keep the floating “Jump to newest” badge unchanged; it must continue to bring users to the latest unread bubble when they are mid-thread.
- Offer an explicit header-level “Context” action to re-request a summary for earlier history without disturbing scroll position.
- Collapse (but do not remove) the AI summary when it scrolls out of view, and only clear the summary/separator when the user leaves the thread or a new message invalidates the current recap.
- Preserve the All Chats unread badge behavior; nothing in this flow may regress aggregate counts or list ordering.

## Algorithm To Implement It
1. Track per-thread read offsets (`lastReadMessageId` or timestamp) synchronized with the backend.
2. Derive unread counts by comparing message timestamps/ids with the normalized entity list.
3. When opening a thread, compute initial scroll index: first unread message if unread exists, otherwise most recent message.
4. Render an inline "New Messages" separator component at the boundary between read and unread messages.
5. Display a floating unread badge when new messages arrive off-screen; hide once the boundary is scrolled into view.
6. Update read offsets based on visibility detection (`onViewableItemsChanged` or intersection observer) with debounce to avoid flicker.
7. Persist read state optimistically while reconciling with server acknowledgements to prevent regression after refresh.
8. Pre-compute multiple summary presets in the background (idle moments and staggered 30-minute intervals with per-user offsets) so the Context action can surface cached recaps instantly.

## Potential Tool Use And Approaches
- State sync via RTK Query, Apollo cache, or REST hooks for reliable last-read persistence.
- Analytics hooks (Segment, Amplitude) to measure engagement with unread indicators and tune thresholds.
- Detox or Maestro scripts that validate badge visibility, separator placement, and read acknowledgements.
- React Native `ViewabilityHelper` or custom intersection observers for precise read tracking.
- Server support checks (websocket receipts, delta queries) to ensure read receipts are robust.

## Best Recommended Approach
Drive unread state from a single source of truth (backend last-read pointer) while applying optimistic local updates. Use an inline separator plus a floating badge for context-aware guidance. Integrate viewability callbacks with debounced updates to keep offsets accurate without performance hits. Instrument analytics to fine-tune indicator thresholds and ensure parity across platforms.

## Interaction Scenarios To Support
- **Entering with unread backlog:** Land the user on the first unread bubble near the composer. Show the AI summary card above the separator (expanded by default) and keep the separator pinned to that boundary even while read receipts stream in.
- **Mid-thread new arrivals:** When parents scroll upward for older context, the separator stays locked. The existing floating “Jump to newest” chip tracks fresh messages; tapping it scrolls to the bottom without reopening the summary automatically.
- **Approaching from above:** While reviewing older (already read) history, the summary card and separator remain in place at the boundary; they come into view only when the user scrolls down to the unread edge.
- **Manual context request:** Tapping the header “Context” button injects (or updates) the summary card just above the unread separator using the 10–20 messages preceding the current viewport. Collapse state is remembered during the session so the card can stay slim while the user keeps scrolling.
- **Manual on fully-read threads:** Even when the thread has zero unread messages, the header action can surface a summary for the most recent history without changing unread counters or auto-scrolling, giving late arrivals a recap on demand.
- **Leaving and returning:** Dismiss the AI summary card and unread separator only when exiting the thread. On the next entry, regenerate or reveal the summary if unread messages are present or the user explicitly taps the header button.
- **Zero unread threads:** Do not auto-render the separator or summary solely based on unread counts. The header button still works to generate a recap without altering counters, and once surfaced they persist until the user leaves or explicitly resets the thread.
- **All Chats alignment:** Clearing unread state inside the chat must continue to zero the per-user counter so list badges stay accurate and sort order by `updatedAt` is preserved.
- **Guardrail against premature disappearance:** Entering a chat never clears all unread items at once. Messages only flip to “read” when they meet the viewability threshold, so the separator and summary remain visible until the user intentionally scrolls past them or leaves the chat—even after every unread bubble has been acknowledged.

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
   - Design a collapsible `AIContextSummary` card that sits directly above the separator, showing a 2–3 sentence recap sourced from the last 10–20 qualifying messages.
   - Add a header-level “Context” button/icon that triggers the same summary logic without auto-scrolling and respects the current collapse state.
4. **Scroll orchestration**
   - When entering a thread, compute initial scroll index: if a first unread id exists, scroll to it and offset by header height.
   - Maintain current viewport when new messages arrive while user scrolls upward; only auto-scroll when user is near bottom threshold.
   - Integrate `maintainVisibleContentPosition` with the unread separator logic to prevent jumpiness during pagination.
   - Anchor the summary card and separator to the backend pointer so they do not drift during read receipt reconciliation or while new messages append.
   - Reset the auto-generated summary (and collapse state) whenever the user exits the thread; only regenerate automatically when unread messages exist.
   - Once every unread message crosses the visibility/read threshold, keep both the separator and the summary card rendered until the user scrolls them completely out of view or exits the thread; never auto-remove them based solely on read status or elapsed time.
5. **Read tracking pipeline**
   - Use `onViewableItemsChanged` (RN) or intersection observers (web) to detect when unread items become visible; debounce to avoid rapid toggles.
   - Immediately fire optimistic read updates and schedule server sync; reconcile receipt errors by reverting local pointer.
   - Handle reconnect scenarios by revalidating read offsets after socket reconnect or app resume.
   - Throttle summary regeneration so repeated manual requests or rapid scroll position changes do not spam the AI endpoint.
   - Set a strict viewability threshold (e.g., 70% of the bubble visible for ≥300 ms) before marking an item read; batch updates only for bubbles that satisfy this condition.
   - On initial load, mark at most the single bubble anchored near the “first unread” position as read; everything below remains unread until viewability confirms the user saw it.
6. **Edge case handling**
   - Define policy for messages deleted or redacted after being marked unread.
   - Ensure mention or reply badges override generic unread badge when relevant.
   - Provide fallback copy when server returns inconsistent pointers (e.g., pointer past most recent message).
   - Fall back gracefully when the summary service errors or returns low-signal content (show null state, keep separator visible, retain manual retry affordance).
   - Do not auto-generate a summary when fewer than three unread messages exist unless manually requested.
   - Guarantee the All Chats list unread badge continues to reflect Firestore counts even if summary generation fails or is skipped.
   - Ensure summary/separator removal logic waits for read acknowledgements and a minimum dwell timer so they do not vanish prematurely while the user is still on the last unread bubble.
7. **Testing and analytics**
   - Unit tests for selectors plus view-model logic covering zero, small, and large unread counts.
   - Visual regression tests confirming separator rendering across themes.
   - End-to-end scripts to simulate deep link into unread thread, mid-scroll arrival of new messages, and badge dismissal.
   - Instrument analytics events for badge exposure, CTA taps, auto-scroll usage, and read receipt latency.
   - Add coverage for auto vs manual summary generation, collapse/expand toggling, header button usage, and summary removal on exit.
8. **QA checklist**
   - Verify screen reader focus when jumping to unread boundary.
   - Test on devices with varying safe-area insets to ensure badge placement stays visible.
   - Confirm consistent behavior when switching between offline/online states and after manual refresh.
   - Validate summary card layout for dynamic type, RTL, dark mode, and very long paragraphs.
   - Confirm summary disappears after leaving the chat and does not regenerate automatically when re-entering a read thread, while also validating that the separator/summary remain until scrolled away or the chat is exited.

## PR Task Checklist (pre-implementation)
- [ ] Extend selectors/store to expose a stable `firstUnreadMessageId`/pointer without regressing existing unread badge behavior.
- [ ] Decouple summary and unread separator visibility from live unread counts; keep both injected until the user leaves the chat while allowing the summary to auto-collapse when scrolled out of view.
- [ ] Introduce the collapsible AI summary card component with loading, empty, and error states; ensure it inserts directly above the separator.
- [ ] Wire automatic summary generation only on initial unread entry (with throttling), manual regeneration from the header button, and background refreshes (idle + staggered 30 minute cadence with per-user offsets) so the Context button is instant.
- [ ] Ensure the header “Context” control renders summaries for fully-read threads without mutating unread counters or scroll position.
- [ ] Clear summary state when the user leaves the thread or when new message activity invalidates the current recap, and persist collapse state only within the active session.
- [ ] Protect the floating “Jump to newest” chip and All Chats unread counts with regression tests or targeted QA scenarios.
- [ ] Cover accessibility (VoiceOver/TalkBack, dynamic type) and localization (long names, RTL) for separator + summary surfaces.
- [ ] Add instrumentation or logging needed to observe summary usage, error rates, and manual context requests before shipping.
