# AI Summary UX

This document covers the in-chat “Context” experience. It depends on the unread state model described in `unread-messaging-ux.md`, so complete those changes first.

---

## Current State (March 2025)

- [x] Header button (“Context”) injects an `AISummaryCard` with loading/error states.
- [x] Summary card stays hidden until the Context button is tapped and remains available until explicitly dismissed.
- [x] Summaries are auto-fetched on chat open so the button reveal is instant.
- [ ] Background precomputation is missing—summaries generate on demand.
- [ ] Incremental (delta) summarization not yet implemented.
- [ ] Eco Mode (24-hour cadence) not exposed in Settings.
- [ ] Button/card animation minimises into the header action instead of simply disappearing.

---

## Goals

1. Auto-fetch summaries when the chat mounts, and keep the cached presets ready for instant display once the parent taps **Context**.
2. Keep the summary hidden by default; the Context button animates the cached card in/out without destroying its data, minimising it back into the header control while the card itself still collapses to a pill.
3. Pre-compute multiple summary presets (Last 25, Today, 7/14/30 days) asynchronously so the UI is instant when expanded.
4. Append incremental summary snippets for new messages and prune stale snippets based on the selected preset window.
5. Provide an **Eco Mode** setting (Settings → left nav) that lowers refresh cadence to once every 24 hours, with transparent messaging.

---

## Implementation Plan

1. **Interaction polish**
   - Keep the `AISummaryCard` implementation but ensure the Context button copy/analytics stay aligned.
   - Introduce `summaryInjected` / `summaryCollapsed` flags (decoupled from unread counts and viewability removals).
   - Auto-fetch summaries on chat mount so the cached data is ready before the parent taps Context—no extra fetch on toggle unless new messages arrive.
   - Keep the card hidden until Context is pressed; animate the card in on press and animate it back into the button when the parent taps again. Anchor the row at the end of the message list (just after the most recent message in the inverted view).

2. **Incremental Summaries**
   - Track per-preset metadata: last covered timestamp/message ID, total messages, and snippet list.
   - Summarize only new messages (`lastCovered → now`) and append the snippet; prune snippets once they fall outside the preset window.
   - Schedule occasional full rebaseline (e.g., nightly) to keep wording tight.

3. **Background Refresh & Idle Triggers**
   - Add staggered 30-minute timers with per-user/chat offsets so refreshes are distributed.
   - Fire refresh after idle periods (e.g., no typing/scroll for 5s) while the chat screen is mounted.
   - Pause refreshers when leaving the chat; resume on return.

4. **Eco Mode**
   - Add Settings entry with Eco Mode toggle + info tooltip explaining slower cadence.
   - When enabled, drop to a 24-hour refresh and disable idle/30-minute timers.
   - Surface eco messaging in the Summarize button/card so parents understand the trade-off.

5. **Lifecycle & State**
   - Clear (or trigger immediate delta refresh) when new message bursts land or the parent exits the chat.
   - Persist collapse state only for the current session; reset on exit.

6. **Testing / Analytics**
   - Unit tests for delta append/prune logic and timer scheduling.
   - Integration/E2E tests for the Context button (instant load), background refresh, eco-mode toggles, and the minimise animation.
  - Analytics: summary views, snippet append failures, refresh duration, Eco Mode adoption, minimise/expand events.

---

## Dependencies & Recommended Order

1. Complete unread state refactor (`unread-messaging-ux.md`) so the summary card can rely on persistent injected rows.
2. Rename UI + add new state flags.
3. Implement incremental summarization.
4. Add background scheduling (30-minute + idle).
5. Layer on Eco Mode + Settings UI.

---

## PR Checklist – AI Summary

- [ ] Keep Context button copy/analytics consistent across UI components.
- [ ] Add `summaryInjected` / `summaryCollapsed` flags, auto-fetch on mount, and persist the card row during the session.
- [ ] Animate the card gracefully appearing/disappearing from the Context button toggle, reusing cached presets for instant display unless new messages invalidate them.
- [ ] Implement incremental summary append/prune per preset with metadata tracking.
- [ ] Add staggered 30-minute background refresh plus idle detection; ensure the Summarize button uses cached results.
- [ ] Implement Eco Mode toggle (24-hour cadence) with user-facing messaging and analytics.
- [ ] Expand unit/integration tests and QA scenarios for collapsible summary, minimise animation, background refresh, and Eco Mode behavior.
