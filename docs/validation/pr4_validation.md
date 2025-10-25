# PR04 Offline Support - Live Validation Plan

**Branch:** `pr04-offline-support`
**Date:** October 24, 2025
**Tester:** _____________
**Device:** _____________
**OS Version:** _____________

---

## Pre-Testing Setup

### Environment Preparation
- [ ] Checkout branch: `git checkout pr04-offline-support`
- [ ] Install dependencies: `npm install`
- [ ] Start Expo: `npx expo start`
- [ ] Open on physical device (recommended) or simulator
- [ ] Log in with test account
- [ ] Ensure you have at least one active chat with another test user

### Test Data Requirements
- [ ] Two test user accounts (User A and User B)
- [ ] At least one existing chat between users
- [ ] Ability to toggle network on/off (Airplane mode or Settings > Wi-Fi)

---

## CRITICAL: Network Control Instructions

### iOS Physical Device
1. **Airplane Mode:** Settings > Airplane Mode (toggle on/off)
2. **Wi-Fi Only:** Settings > Wi-Fi > Toggle off
3. **Verify:** Look for airplane icon or no Wi-Fi bars in status bar

### Android Physical Device
1. **Airplane Mode:** Swipe down > Tap airplane icon
2. **Wi-Fi Only:** Settings > Network & Internet > Wi-Fi > Toggle off
3. **Verify:** Check status bar for airplane or disconnected icon

### iOS Simulator
1. **Network Link Conditioner:** (requires Xcode)
   - Settings > Developer > Network Link Conditioner
   - Enable "100% Loss" profile
2. **Alternative:** Mac Settings > Network Link Conditioner

### Android Emulator
1. Extended Controls (•••) > Settings > Cellular
2. Set "Network status" to "Denied"
3. Or use: `adb shell svc wifi disable`

---

## Test Suite 1: Offline Message Send (RUBRIC REQUIREMENT)

### Scenario 1.1: Send Message While Offline
**Objective:** Verify messages fail gracefully when offline

**Steps:**
1. Open existing chat
2. **Turn airplane mode ON** (or disable Wi-Fi)
3. Wait 2-3 seconds for network detection
4. Type message: "Test offline message 1"
5. Press send

**Expected Results:**
- [ ] Message appears immediately in chat (optimistic UI)
- [ ] Message initially shows clock icon (⏰ sending status)
- [ ] After ~1-2 seconds, message changes to:
  - [ ] Red alert icon (⚠️) appears
  - [ ] Red border around message bubble
  - [ ] Light red background (#FFE5E5)
  - [ ] "Tap to retry" button appears below message
  - [ ] Error text appears: "No internet connection"
  - [ ] Timestamp shows current time

**If Failed:** Document what happened instead ___________________

---

### Scenario 1.2: Multiple Offline Messages
**Objective:** Verify multiple messages can be queued

**Steps:**
1. **Ensure airplane mode is still ON**
2. Send 3 messages rapidly:
   - "Message 1 offline"
   - "Message 2 offline"
   - "Message 3 offline"

**Expected Results:**
- [ ] All 3 messages appear in chat immediately
- [ ] All 3 show sending status initially
- [ ] All 3 transition to failed status with:
  - [ ] Red alert icons
  - [ ] Red borders
  - [ ] "Tap to retry" buttons
  - [ ] "No internet connection" error text
- [ ] Messages stay in chronological order

**If Failed:** Document what happened instead ___________________

---

## Test Suite 2: Manual Retry (RUBRIC REQUIREMENT)

### Scenario 2.1: Single Message Retry
**Objective:** Verify manual retry functionality

**Prerequisite:** Complete Scenario 1.1 (have 1 failed message)

**Steps:**
1. **Turn airplane mode OFF** (or enable Wi-Fi)
2. Wait 3-5 seconds for network to stabilize
3. Scroll to failed message: "Test offline message 1"
4. Tap the **"Tap to retry"** button

**Expected Results:**
- [ ] Button tap is responsive
- [ ] Message status changes to sending (⏰ clock icon)
- [ ] Red border disappears
- [ ] "Tap to retry" button disappears
- [ ] Error text disappears
- [ ] Background returns to normal (green for own message)
- [ ] Within 1-2 seconds:
  - [ ] Message shows checkmark (✓ sent status)
  - [ ] Then double checkmark (✓✓ delivered status)
- [ ] Message appears on other user's device
- [ ] If other user views chat, checkmarks turn blue (✓✓ read status)

**If Failed:** Document what happened instead ___________________

---

### Scenario 2.2: Multiple Message Retry
**Objective:** Verify batch retry works correctly

**Prerequisite:** Complete Scenario 1.2 (have 3 failed messages)

**Steps:**
1. **Ensure network is ON**
2. Tap "Tap to retry" on first failed message
3. Immediately tap "Tap to retry" on second failed message
4. Immediately tap "Tap to retry" on third failed message

**Expected Results:**
- [ ] All 3 messages transition to sending status
- [ ] All 3 clear error states (red borders, retry buttons)
- [ ] All 3 successfully send to Firestore
- [ ] All 3 show delivered status
- [ ] Messages maintain chronological order
- [ ] No duplicate messages appear
- [ ] Other user receives all 3 messages in order

**If Failed:** Document what happened instead ___________________

---

## Test Suite 3: Auto-Retry on Reconnect (RUBRIC REQUIREMENT)

### Scenario 3.1: Single Message Auto-Retry
**Objective:** Verify automatic retry when network reconnects

**Steps:**
1. **Turn airplane mode ON**
2. Send message: "Auto-retry test 1"
3. Verify message shows failed status with retry button
4. **DO NOT tap retry button**
5. **Turn airplane mode OFF**
6. Watch message status (do not interact)

**Expected Results:**
- [ ] Within 5 seconds of network reconnection:
  - [ ] Failed message automatically transitions to sending
  - [ ] Retry button disappears automatically
  - [ ] Error text clears automatically
  - [ ] Red border disappears automatically
- [ ] Message successfully sends without manual intervention
- [ ] Message shows delivered status (✓✓)
- [ ] Message appears on other user's device

**Console Log (Optional):**
Check Expo console for: `📶 Back online. Retrying X messages...`

**If Failed:** Document what happened instead ___________________

---

### Scenario 3.2: Multiple Messages Auto-Retry
**Objective:** Verify batch auto-retry on reconnect

**Steps:**
1. **Turn airplane mode ON**
2. Send 5 messages rapidly:
   - "Auto message 1"
   - "Auto message 2"
   - "Auto message 3"
   - "Auto message 4"
   - "Auto message 5"
3. Verify all 5 show failed status
4. **DO NOT tap any retry buttons**
5. **Turn airplane mode OFF**
6. Watch all messages (do not interact)

**Expected Results:**
- [ ] Within 5 seconds of reconnection:
  - [ ] All 5 messages automatically retry
  - [ ] All 5 clear error states simultaneously
  - [ ] All 5 transition through: sending → sent → delivered
- [ ] All 5 successfully send to Firestore
- [ ] Messages maintain original order
- [ ] No messages duplicated
- [ ] Other user receives all 5 messages in order

**If Failed:** Document what happened instead ___________________

---

## Test Suite 4: Error Categorization (RUBRIC REQUIREMENT)

### Scenario 4.1: Network Error Detection
**Objective:** Verify network errors are categorized correctly

**Steps:**
1. **Turn airplane mode ON**
2. Send message: "Network error test"
3. Observe error message text

**Expected Results:**
- [ ] Error text displays: **"No internet connection"**
- [ ] NOT "Failed to send message" (generic error)
- [ ] Message is added to retry queue
- [ ] When reconnected, message auto-retries

**If Failed:** Document error text shown ___________________

---

### Scenario 4.2: Offline → Online → Offline Sequence
**Objective:** Test rapid network state changes

**Steps:**
1. **Turn airplane mode ON**
2. Send message: "Rapid state test 1"
3. Verify message fails
4. **Turn airplane mode OFF**
5. Wait 2 seconds
6. **Turn airplane mode ON immediately**
7. Send message: "Rapid state test 2"
8. Verify message fails
9. **Turn airplane mode OFF**
10. Wait for auto-retry

**Expected Results:**
- [ ] First message auto-retries when first online
- [ ] Second message fails while offline
- [ ] Second message auto-retries when back online
- [ ] Both messages eventually delivered
- [ ] No crashes or state corruption

**If Failed:** Document what happened instead ___________________

---

## Test Suite 5: UI/UX Validation

### Scenario 5.1: Failed Message Styling
**Objective:** Verify visual indicators are clear and consistent

**Prerequisites:** Have at least 1 failed message

**Visual Inspection Checklist:**
- [ ] Failed message has **red border** (1px, color #FF3B30)
- [ ] Background is **light red** (#FFE5E5), not normal green
- [ ] Alert icon (⚠️) is **red** (#FF3B30), size 14px
- [ ] "Tap to retry" button is:
  - [ ] Clearly visible
  - [ ] Red background (#FF3B30)
  - [ ] White text
  - [ ] Rounded corners (4px)
- [ ] Error text is:
  - [ ] Below message content
  - [ ] Red color (#FF3B30)
  - [ ] Italic font
  - [ ] Font size 11px
- [ ] Failed message is distinguishable from successful messages
- [ ] Layout doesn't break or overlap

**Screenshots Required:**
Take screenshot and save as: `pr04_failed_message_ui.png`

**If Failed:** Document visual issues ___________________

---

### Scenario 5.2: Message Status Icons
**Objective:** Verify all status icons display correctly

**Steps:**
1. Send message while **online**: "Status icon test"
2. Observe icon changes over time

**Expected Status Progression:**
- [ ] **Sending:** Clock icon (⏰) - gray color
- [ ] **Sent:** Single checkmark (✓) - gray color
- [ ] **Delivered:** Double checkmark (✓✓) - gray color
- [ ] **Read:** Double checkmark (✓✓) - **blue color** (#4FC3F7)
- [ ] **Failed:** Alert icon (⚠️) - red color (#FF3B30)

**Icon Details:**
- [ ] All icons are 14px size
- [ ] Icons aligned with timestamp
- [ ] Icons don't overlap text
- [ ] Smooth transition between statuses

**If Failed:** Document which icons are incorrect ___________________

---

## Test Suite 6: Edge Cases & Stress Tests

### Scenario 6.1: Rapid Send While Offline
**Objective:** Stress test offline message queuing

**Steps:**
1. **Turn airplane mode ON**
2. Send 20 messages as fast as possible (spam send button)
3. Verify all messages show failed status
4. **Turn airplane mode OFF**
5. Watch auto-retry behavior

**Expected Results:**
- [ ] All 20 messages appear in chat
- [ ] All 20 show failed status
- [ ] No UI lag or freezing
- [ ] When online, all 20 automatically retry
- [ ] All 20 successfully send (may take 10-20 seconds)
- [ ] No messages lost
- [ ] No duplicate messages
- [ ] Messages in correct order

**Performance Notes:**
- Observe for any lag or delays: ___________________
- Check console for errors: ___________________

**If Failed:** Document how many messages failed ___________________

---

### Scenario 6.2: Long Message Text
**Objective:** Verify retry works with various message lengths

**Steps:**
1. **Turn airplane mode ON**
2. Send short message (5 chars): "Short"
3. Send medium message (50 chars): "This is a medium length message for testing purposes ok"
4. Send long message (200+ chars): "This is a very long message designed to test the retry functionality with significantly more text content. We want to ensure that the retry mechanism handles messages of all sizes correctly, including those with multiple sentences and longer paragraphs. This helps validate the robustness of our offline support implementation."
5. Verify all show failed status
6. **Turn airplane mode OFF**
7. Wait for auto-retry

**Expected Results:**
- [ ] All 3 messages fail gracefully
- [ ] Retry button appears on all 3
- [ ] Long message wraps correctly in bubble
- [ ] All 3 auto-retry successfully
- [ ] Long message preserves full content
- [ ] No text truncation
- [ ] Other user receives full long message

**If Failed:** Document which message length failed ___________________

---

### Scenario 6.3: App Backgrounding During Retry
**Objective:** Test retry persistence across app states

**Steps:**
1. **Turn airplane mode ON**
2. Send message: "Background test"
3. Verify message fails
4. **Home button** (background the app)
5. **Turn airplane mode OFF**
6. Wait 10 seconds
7. **Reopen app**

**Expected Results:**
- [ ] Failed message still visible
- [ ] Message shows failed status (not lost)
- [ ] Retry button still present
- [ ] When backgrounded, auto-retry may happen
- [ ] OR after reopening, auto-retry triggers
- [ ] Message eventually delivers

**Note:** Auto-retry behavior while backgrounded depends on OS policies

**If Failed:** Document what happened ___________________

---

### Scenario 6.4: Empty/Whitespace Messages
**Objective:** Verify validation prevents invalid retries

**Steps:**
1. **Turn airplane mode ON**
2. Try to send message with only spaces: "     "
3. Try to send empty message (if allowed)

**Expected Results:**
- [ ] App prevents sending empty/whitespace messages
- [ ] OR if sent, handles gracefully without retry queue
- [ ] No crashes

**If Failed:** Document behavior ___________________

---

## Test Suite 7: Integration with Existing Features

### Scenario 7.1: Read Receipts Work After Retry
**Objective:** Verify read receipts function post-retry

**Steps:**
1. **Turn airplane mode ON**
2. Send message: "Read receipt test"
3. Verify message fails
4. **Turn airplane mode OFF**
5. Wait for auto-retry (message delivers)
6. Have **User B** (other device) open chat and view message
7. Return to **User A** device and observe

**Expected Results:**
- [ ] Message successfully retries and delivers
- [ ] User B sees message immediately
- [ ] When User B views chat:
  - [ ] User A's message checkmarks turn **blue** (✓✓)
  - [ ] Status updates in real-time
- [ ] Read receipt timing works correctly

**If Failed:** Document what happened ___________________

---

### Scenario 7.2: Typing Indicators During Retry
**Objective:** Verify typing indicators aren't affected

**Steps:**
1. Send normal message (online)
2. Have User B start typing
3. User A should see "User B is typing..."
4. User B sends message
5. **Turn airplane mode ON** (User A device)
6. User A sends message (fails)
7. Have User B start typing again
8. **Turn airplane mode OFF** (User A device)

**Expected Results:**
- [ ] Typing indicators work before offline
- [ ] Typing indicators work after reconnect
- [ ] Failed message doesn't block typing indicator display
- [ ] Auto-retry doesn't interfere with typing indicators

**If Failed:** Document what happened ___________________

---

### Scenario 7.3: Chat List Updates After Retry
**Objective:** Verify chat list reflects retried messages

**Steps:**
1. From chat list, enter Chat 1
2. **Turn airplane mode ON**
3. Send message: "Chat list test"
4. Verify message fails
5. **Navigate back to chat list**
6. Observe Chat 1 preview
7. **Turn airplane mode OFF**
8. Wait 5 seconds
9. Observe chat list updates

**Expected Results:**
- [ ] While offline, chat preview may show failed message
- [ ] After auto-retry, chat list updates with successful message
- [ ] Last message text is correct
- [ ] Timestamp updates correctly
- [ ] Chat doesn't show as "failed" state in list

**If Failed:** Document what happened ___________________

---

## Test Suite 8: Cross-Device Synchronization

### Scenario 8.1: Retry Visibility on Multiple Devices
**Objective:** Verify offline messages don't sync until sent

**Prerequisites:** User A logged in on 2 devices (Device 1 and Device 2)

**Steps:**
1. **Device 1:** Turn airplane mode ON
2. **Device 1:** Send message: "Multi-device test"
3. **Device 1:** Verify message fails
4. **Device 2:** Check if message appears (should NOT appear)
5. **Device 1:** Turn airplane mode OFF
6. **Device 1:** Wait for auto-retry
7. **Device 2:** Observe message arrival

**Expected Results:**
- [ ] Failed message does NOT appear on Device 2
- [ ] After retry success, message appears on Device 2
- [ ] Both devices show same final state
- [ ] No duplicate messages on either device

**If Failed:** Document synchronization issues ___________________

---

## Test Suite 9: Performance & Stability

### Scenario 9.1: Memory Leak Test (30 minute test)
**Objective:** Verify no memory leaks from retry queue

**Steps:**
1. **Turn airplane mode ON**
2. Every minute for 30 minutes:
   - Send 1 message
   - Verify it fails
3. After 30 minutes, check:
   - 30 failed messages in retry queue
4. **Turn airplane mode OFF**
5. Wait for all auto-retries
6. Observe app performance

**Expected Results:**
- [ ] App remains responsive throughout
- [ ] No crashes
- [ ] All 30 messages eventually send
- [ ] Memory usage reasonable (check in Xcode/Android Studio)
- [ ] No noticeable slowdown

**Performance Metrics:**
- Start memory: _____ MB
- End memory: _____ MB
- Increase acceptable if < 50MB

**If Failed:** Document performance issues ___________________

---

### Scenario 9.2: Battery Impact (Optional)
**Objective:** Assess battery usage from network monitoring

**Steps:**
1. Note starting battery %: ____%
2. Use app normally for 30 minutes with network changes
3. Note ending battery %: ____%
4. Battery drop: ____% over 30 min

**Expected Results:**
- [ ] Battery drain is reasonable (< 10% over 30 min)
- [ ] No unusual battery warning

**If Failed:** Document excessive drain ___________________

---

## Test Suite 10: Regression Testing

### Scenario 10.1: Normal Online Messaging Still Works
**Objective:** Verify offline support didn't break online messaging

**Steps:**
1. **Ensure airplane mode is OFF**
2. Send 10 messages rapidly while online
3. Observe message delivery

**Expected Results:**
- [ ] All messages send successfully
- [ ] No failed status appears
- [ ] Messages deliver in < 200ms (performance requirement)
- [ ] No retry buttons appear
- [ ] Optimistic UI still works (instant appearance)
- [ ] All existing features work:
  - [ ] Read receipts
  - [ ] Typing indicators
  - [ ] Timestamps
  - [ ] Message ordering

**If Failed:** Document what broke ___________________

---

### Scenario 10.2: Existing Tests Still Pass
**Objective:** Verify no test regressions

**Steps:**
1. Run full test suite: `npm test`

**Expected Results:**
```
Test Suites: 8 passed, 8 total
Tests:       44 passed, 44 total
```

- [ ] All 44 tests pass
- [ ] No new test failures
- [ ] Performance tests still meet <200ms requirement

**If Failed:** Document test failures ___________________

---

## Critical Issues Checklist

If ANY of these occur, stop testing and report immediately:

- [ ] App crashes
- [ ] Data loss (messages disappear)
- [ ] Infinite retry loops
- [ ] Messages sent multiple times (duplicates on other device)
- [ ] Cannot send messages after reconnecting
- [ ] App freezes or becomes unresponsive
- [ ] Firebase errors in console
- [ ] Messages arrive out of order

**Critical Issue Details:** ___________________

---

## Devices Tested

### Device 1
- [ ] Model: ___________________
- [ ] OS: ___________________
- [ ] Test Result: PASS / FAIL
- [ ] Issues Found: ___________________

### Device 2 (if available)
- [ ] Model: ___________________
- [ ] OS: ___________________
- [ ] Test Result: PASS / FAIL
- [ ] Issues Found: ___________________

---

## Overall Validation Results

### Test Suite Summary
- [ ] Test Suite 1: Offline Message Send - **PASS / FAIL**
- [ ] Test Suite 2: Manual Retry - **PASS / FAIL**
- [ ] Test Suite 3: Auto-Retry on Reconnect - **PASS / FAIL**
- [ ] Test Suite 4: Error Categorization - **PASS / FAIL**
- [ ] Test Suite 5: UI/UX Validation - **PASS / FAIL**
- [ ] Test Suite 6: Edge Cases - **PASS / FAIL**
- [ ] Test Suite 7: Integration - **PASS / FAIL**
- [ ] Test Suite 8: Cross-Device - **PASS / FAIL**
- [ ] Test Suite 9: Performance - **PASS / FAIL**
- [ ] Test Suite 10: Regression - **PASS / FAIL**

### Rubric Requirements Met
- [ ] ✅ Messages fail gracefully when offline
- [ ] ✅ Manual retry button works
- [ ] ✅ Auto-retry on reconnect works
- [ ] ✅ Error messages are clear and helpful
- [ ] ✅ 7 offline scenarios tested programmatically
- [ ] ✅ No regressions in existing functionality
- [ ] ✅ Performance still meets <200ms requirement

### Final Recommendation
- [ ] **APPROVED** - Ready to merge to main
- [ ] **CONDITIONAL** - Minor issues, can merge with documentation
- [ ] **REJECTED** - Critical issues found, needs fixes

**Tester Signature:** ___________________
**Date Completed:** ___________________

---

## Appendix A: Troubleshooting

### Issue: Auto-retry not working
**Possible Causes:**
1. Network change not detected (restart app)
2. useNetworkStatus hook not initialized (check app/_layout.tsx)
3. NetInfo permissions issue (check app permissions)

### Issue: Retry button not appearing
**Possible Causes:**
1. Message status not 'failed' (check console logs)
2. Only shows for own messages, not received messages
3. UI rendering issue (scroll message out and back in)

### Issue: Messages duplicate after retry
**Possible Causes:**
1. Critical bug - report immediately
2. Check Firestore console for duplicate documents
3. Check both devices for duplicates

### Issue: Tests failing
**Possible Causes:**
1. Clean install: `rm -rf node_modules && npm install`
2. Clear jest cache: `npm test -- --clearCache`
3. Check mock setup in jest-setup.ts

---

## Appendix B: Expected Console Logs

### Successful Offline/Online Cycle
```
Error sending message: Error: No internet connection. Message will be sent when online.
📶 Back online. Retrying 1 messages...
✅ Performance: Message Send Time took 145ms
```

### Failed Then Manually Retried
```
Error sending message: Error: No internet connection...
[User taps retry button]
✅ Performance: Message Send Time took 152ms
```

### Multiple Messages Auto-Retry
```
📶 Back online. Retrying 5 messages...
✅ Performance: Message Send Time took 148ms
✅ Performance: Message Send Time took 153ms
✅ Performance: Message Send Time took 147ms
✅ Performance: Message Send Time took 151ms
✅ Performance: Message Send Time took 149ms
```

---

**End of Validation Plan**
