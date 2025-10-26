# AI Summary UX

This document covers the in-chat “Summarize” experience. It depends on the unread state model described in `unread-messaging-ux.md`, so complete those changes first.

---

## Current State (March 2025)

- [x] Header button (“Context”) injects a `ContextSummaryCard` with loading/error states.
- [x] Summary card can be manually collapsed.
- [ ] Summary visibility is tied to unread counts/viewability; it disappears when scrolled off-screen.
- [ ] Background precomputation is missing—summaries generate on demand.
- [ ] Incremental (delta) summarization not yet implemented.
- [ ] Eco Mode (24-hour cadence) not exposed in Settings.
- [ ] Terminology still says “Context” in the UI/analytics.

---

## Goals

1. Rename “Context” to **“Summarize”** and keep the summary card injected until the parent leaves the chat or new messages invalidate it.
2. Pre-compute multiple summary presets (Last 25, Today, 7/14/30 days) asynchronously so the UI is instant.
3. Append incremental summary snippets for new messages and prune stale snippets based on the selected preset window.
4. Auto-collapse the summary card when it scrolls out of view without removing it from the list.
5. Provide an **Eco Mode** setting (Settings → left nav) that lowers refresh cadence to once every 24 hours, with transparent messaging.

---

## Implementation Plan

1. **Rename & UI polish**
   - Rename the component/button (`ContextSummaryCard` → `AISummaryCard`, “Context” → “Summarize”) and update analytics.
   - Introduce `summaryInjected` / `summaryCollapsed` flags (decoupled from unread counts and viewability removals).
   - Ensure tapping Summarize toggles the existing card without scroll jumps.

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
   - Integration/E2E tests for Summarize button (instant load), background refresh, eco-mode toggles.
  - Analytics: summary views, snippet append failures, refresh duration, Eco Mode adoption.

---

## Dependencies & Recommended Order

1. Complete unread state refactor (`unread-messaging-ux.md`) so the summary card can rely on persistent injected rows.
2. Rename UI + add new state flags.
3. Implement incremental summarization.
4. Add background scheduling (30-minute + idle).
5. Layer on Eco Mode + Settings UI.

---

## PR Checklist – AI Summary

- [ ] Rename Context → Summarize (UI, component names, analytics events).
- [ ] Add `summaryInjected` / `summaryCollapsed` flags and keep the card injected during the session.
- [ ] Implement incremental summary append/prune per preset with metadata tracking.
- [ ] Add staggered 30-minute background refresh plus idle detection; ensure the Summarize button uses cached results.
- [ ] Implement Eco Mode toggle (24-hour cadence) with user-facing messaging and analytics.
- [ ] Expand unit/integration tests and QA scenarios for collapsible summary, background refresh, and Eco Mode behavior.
