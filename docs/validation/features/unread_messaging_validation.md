# Feature Validation – Unread Messaging UX

These steps cover the persistent unread separator and floating badge behavior introduced in the unread messaging refactor. Run them on both iOS and Android simulators (or physical devices) when possible.

---

## Pre-requisites
- Seed a chat with at least 30 historical messages split across multiple days.
- Have two test accounts (Parent A = you, Parent B = simulator/bot) so you can send unread messages to yourself.
- Recommended sample conversation to preload (chronological order):
  1. Parent B — “Morning everyone! Field trip is confirmed for Friday.”
  2. Parent A — “Do the kids need packed lunches?”
  3. Parent B — “Yes please — sandwiches or anything easy to eat.”
  4. Parent C — “I can chaperone if needed.”
  5. Parent B — “Thanks! We still need one more volunteer.”
  6. Parent A — “I’ll join too!”
  7. Parent B — “Bus departs at 9:30 AM from the school parking lot.”
  8. Parent B — “Reminder: permission slips due Wednesday.”
  9. Parent A — “Liam is vegetarian; I’ll pack hummus wraps.”
  10. Parent B — “Great! See you all Friday.”
- During validation, use fresh bursts such as “Running 10 minutes late!” or “Lunches are in the cooler by the door” to generate unread traffic.
- Start the Expo dev client and sign in as Parent A.

---

## Validation Steps

1. **Initial Entry with Unread Backlog**
   - Ensure Parent B sends 5 new messages while Parent A is out of the thread.
   - Open the chat as Parent A.
   - ✅ Confirm the “New Messages” separator appears above the unread bundle and the AI summary (if enabled) sits directly above it.
   - ✅ Scroll upward slightly; confirm the separator remains injected (it should not disappear).

2. **Scroll Away & Return**
   - Scroll far above the separator (older history).
   - ✅ Confirm the floating “new messages” badge appears even if you’ve read the messages visually.
   - Tap the badge.
   - ✅ Verify the chat scrolls back to the newest messages and the badge clears.

3. **Live Message Arrival While Viewing Older History**
   - Scroll halfway up the conversation (separator out of viewport).
   - Have Parent B send 3 messages.
   - ✅ Confirm the floating badge increments (total reflects new arrivals).
   - Scroll down toward the bottom.
   - ✅ Ensure the badge clears once you reach the latest messages; the inline separator should remain intact.

4. **Send Message Yourself**
   - From near the bottom, send a message as Parent A.
   - ✅ Verify the list autoscrolls to bottom and no floating badge remains.
   - ✅ If the separator was still visible but already acknowledged (you scrolled through the unread batch), confirm it animates away gracefully after your message sends.

5. **Leave & Re-enter**
   - Navigate away from the chat (e.g., back to the list), then return immediately.
   - ✅ Confirm both the separator and badge reset—no lingering badge unless new messages arrive after re-entry.

6. **Zero Unread Edge Case**
   - Mark all messages as read (scroll to bottom, ensure no unread remain).
   - ✅ Confirm the separator disappears only after leaving the chat (not purely from read receipts).
   - Re-open the chat; there should be no separator/badge unless new messages arrive.

---

## Manual Regression Checks
- Test dynamic type and dark mode to ensure the separator text and badge remain legible.
- Rotate the device (if supported) and confirm the separator/badge do not duplicate or disappear.
- Toggle network offline/online while viewing the chat; confirm unread UI state does not glitch or reset.
- After acknowleding the unread batch, have Parent B send another message while you remain at the bottom; confirm the separator fades out smoothly once the new bubble appears.

---

## Logging & Analytics (optional but recommended)
- Verify console logs (if enabled) show `setUnreadUIState` updates when unread batches arrive/clear.
- Confirm analytics events (if hooked up) record badge exposures and Summarize taps without duplication.
