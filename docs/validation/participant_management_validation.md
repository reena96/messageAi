# Participant Management Feature - Validation Guide

**Feature**: Add and remove users from chats
**Date**: 2025-10-26
**Files Modified**:
- `firestore.rules` - Added users collection permissions
- `lib/store/chatStore.ts` - Added addParticipant/removeParticipant functions
- `components/chat/ChatSettingsModal.tsx` - New settings modal component
- `app/chat/[id].tsx` - Integrated settings button and modal

---

## Prerequisites

Before starting validation:
- [ ] Have at least 2 user accounts created (e.g., user1@test.com, user2@test.com)
- [ ] App running on device/simulator
- [ ] Firestore rules deployed
- [ ] Both test users signed up and have accounts in Firestore

---

## Test Suite 1: Authentication & Firestore Rules

### Test 1.1: Sign In
**Steps:**
1. Open the app
2. Sign in with an existing account (e.g., user1@test.com)

**Expected Results:**
- ✅ Sign-in succeeds without "Missing or insufficient permissions" error
- ✅ User is redirected to Chats screen
- ✅ No console errors related to Firestore permissions

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 1.2: Sign Up
**Steps:**
1. Sign out from the app
2. Create a new account with email/password
3. Enter display name

**Expected Results:**
- ✅ Account creation succeeds
- ✅ User document is created in Firestore users collection
- ✅ User is redirected to Chats screen
- ✅ Display name is saved correctly

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

## Test Suite 2: Settings Button & Modal

### Test 2.1: Settings Button Visibility
**Steps:**
1. Navigate to any existing chat
2. Look at the header/navigation bar

**Expected Results:**
- ✅ See gear icon (⚙️) button next to "Context" button in header
- ✅ Both buttons are properly aligned and visible
- ✅ Settings icon is WhatsApp green (#0C8466)

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 2.2: Open Settings Modal
**Steps:**
1. Click the settings gear icon in the chat header

**Expected Results:**
- ✅ Modal slides up smoothly from bottom
- ✅ Modal shows "Chat Settings" title in header
- ✅ Close button (X) visible in top-left
- ✅ Modal has white background with proper styling
- ✅ Content is readable and properly formatted

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 2.3: Close Settings Modal
**Steps:**
1. With modal open, click the X button in top-left
2. Reopen modal
3. Tap outside the modal (on dimmed background)

**Expected Results:**
- ✅ Modal closes smoothly when X is clicked
- ✅ Modal closes when tapping outside (if supported)
- ✅ Chat screen is still visible and functional after closing

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

## Test Suite 3: Participant Display

### Test 3.1: One-on-One Chat Participants
**Steps:**
1. Open a one-on-one chat
2. Open settings modal
3. Observe the Participants section

**Expected Results:**
- ✅ See "Participants (2)" section header
- ✅ See both participants listed with names
- ✅ See "(You)" label next to your name
- ✅ See "Creator" badge on the chat creator
- ✅ Person icons displayed in avatar circles
- ✅ Avatar circles have light green background (#E8F5E9)

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 3.2: Group Chat Participants
**Steps:**
1. Create or open a group chat with 3+ participants
2. Open settings modal
3. Review participant list

**Expected Results:**
- ✅ See "Participants (N)" where N is the correct count
- ✅ All participants listed with display names
- ✅ Creator badge visible on original chat creator
- ✅ Your name shows "(You)" label
- ✅ List is scrollable if many participants

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 3.3: Chat Information Display
**Steps:**
1. Scroll down in settings modal to bottom
2. Review the Chat Information section

**Expected Results:**
- ✅ See "Chat Information" section
- ✅ Shows "Type: Group Chat" or "Type: One-on-One" correctly
- ✅ Shows the Chat ID (Firestore document ID)
- ✅ Information is readable and properly formatted

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

## Test Suite 4: Add Participant (Group Chats Only)

### Test 4.1: Add Participant Section Visibility
**Steps:**
1. Open a GROUP chat settings modal
2. Look for "Add Participant" section
3. Open a ONE-ON-ONE chat settings modal
4. Look for "Add Participant" section

**Expected Results:**
- ✅ GROUP chat: "Add Participant" section IS visible
- ✅ ONE-ON-ONE chat: "Add Participant" section is NOT visible
- ✅ Section shows email input field and + button
- ✅ Helper text: "User must have an account with this email"

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 4.2: Add Valid Participant
**Steps:**
1. Open a group chat you created
2. In "Add Participant" section, enter a valid user email (e.g., user2@test.com)
3. Click the green + button

**Expected Results:**
- ✅ Loading spinner shows briefly in the + button
- ✅ Success alert: "Participant added successfully"
- ✅ New participant appears in the participant list immediately
- ✅ Email input field is cleared after successful add
- ✅ Participant count increases by 1

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 4.3: Add Invalid Email
**Steps:**
1. Enter a non-existent email (e.g., notreal@test.com)
2. Click the + button

**Expected Results:**
- ✅ Error alert displayed: "No user found with this email address"
- ✅ Participant is NOT added to list
- ✅ Participant count remains unchanged
- ✅ Modal remains open and functional

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 4.4: Add Existing Participant
**Steps:**
1. Enter email of someone already in the chat
2. Click the + button

**Expected Results:**
- ✅ Error alert: "User is already a participant in this chat"
- ✅ No duplicate added to list
- ✅ Participant count unchanged

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 4.5: Add Participant - Empty Email
**Steps:**
1. Leave email field empty or clear it
2. Try to click the + button

**Expected Results:**
- ✅ Error alert: "Please enter an email address"
- ✅ No participant added

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 4.6: Add Participant - Disabled State
**Steps:**
1. Clear the email input field completely
2. Observe the + button state

**Expected Results:**
- ✅ + button appears grayed out (opacity 0.5)
- ✅ Button is disabled and not clickable when email is empty
- ✅ Button becomes enabled when typing starts

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

## Test Suite 5: Remove Participant

### Test 5.1: Remove Button Visibility - Creator
**Steps:**
1. Open a chat YOU created
2. Open settings modal
3. Observe remove/exit buttons next to each participant

**Expected Results:**
- ✅ See close/remove icon (🗙) next to all OTHER participants
- ✅ See exit icon (→) next to YOUR name
- ✅ Icons are red (#FF3B30)

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 5.2: Remove Button Visibility - Non-Creator
**Steps:**
1. Open a chat someone ELSE created
2. Open settings modal
3. Check which remove buttons are visible

**Expected Results:**
- ✅ See exit icon (→) ONLY next to YOUR name
- ✅ NO remove buttons visible next to other participants
- ✅ Cannot remove other users if you're not the creator

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 5.3: Remove Other User (as Creator)
**Steps:**
1. As chat creator, click remove (🗙) button next to another user
2. Observe confirmation dialog
3. Click "Cancel"
4. Click remove button again
5. Click "Remove" to confirm

**Expected Results:**
- ✅ Confirmation dialog appears: "Remove [Name] from this chat?"
- ✅ Dialog has "Cancel" and "Remove" buttons
- ✅ "Cancel" closes dialog without removing user
- ✅ "Remove" removes the user successfully
- ✅ Success alert: "[Name] removed from chat"
- ✅ User disappears from participant list immediately
- ✅ Participant count decreases by 1

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 5.4: Leave Chat (as Participant)
**Steps:**
1. Click the exit icon (→) next to your own name
2. Observe confirmation dialog
3. Click "Cancel"
4. Click exit icon again
5. Click "Leave" to confirm

**Expected Results:**
- ✅ Confirmation dialog: "Are you sure you want to leave this chat?"
- ✅ "Cancel" closes dialog without leaving
- ✅ "Leave" removes you from chat
- ✅ Modal closes automatically after leaving
- ✅ You're removed from the chat participants
- ✅ Chat may disappear from your chat list (or show as left)

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 5.5: Leave Chat (as Creator)
**Steps:**
1. As chat creator, click exit icon next to your name
2. Click "Leave" in confirmation dialog
3. Check if chat still exists for other participants

**Expected Results:**
- ✅ You can leave the chat even as creator
- ✅ Chat continues to exist for other participants
- ✅ Creator badge remains on your user (or transfers - verify behavior)
- ✅ You're removed from participants list

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

## Test Suite 6: Real-time Updates

### Test 6.1: Participant Added - Live Update
**Prerequisites:** 2 devices/simulators with different accounts in same group chat

**Steps:**
1. User A: Add a new participant via settings
2. User B: Check the chat settings (may need to close/reopen modal)

**Expected Results:**
- ✅ User B sees the new participant in their participant list
- ✅ Participant count updates for User B
- ✅ Update happens within a few seconds (Firestore real-time sync)

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 6.2: Participant Removed - Live Update
**Prerequisites:** 2 devices/simulators with different accounts

**Steps:**
1. User A: Remove a participant from the chat
2. User B: Check settings modal

**Expected Results:**
- ✅ Removed participant disappears from User B's view
- ✅ Participant count decreases for User B
- ✅ If removed user is User B, they see the chat disappear/change state

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

## Test Suite 7: Edge Cases & Error Handling

### Test 7.1: Network Error Handling
**Steps:**
1. Turn off internet/wifi on the device
2. Try to add a participant
3. Try to remove a participant
4. Turn internet back on

**Expected Results:**
- ✅ Error message displayed when offline
- ✅ UI remains functional (doesn't crash)
- ✅ Operations succeed when connection restored
- ✅ Appropriate error messages shown

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 7.2: Long Participant Names
**Steps:**
1. Add/view user with very long display name (20+ characters)
2. Check participant list display

**Expected Results:**
- ✅ Long names don't overflow the container
- ✅ Text truncates with ellipsis if needed
- ✅ Layout remains intact and aligned
- ✅ Badges and icons still visible

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 7.3: Many Participants
**Steps:**
1. Create/open a chat with 10+ participants
2. Open settings modal
3. Scroll through participant list

**Expected Results:**
- ✅ List scrolls smoothly
- ✅ All participants are visible with scrolling
- ✅ Performance remains smooth (no lag)
- ✅ List has max height and doesn't overflow screen

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 7.4: Special Characters in Email
**Steps:**
1. Try adding participant with special chars in email (test+123@test.com)
2. Try with dots (test.user@test.com)

**Expected Results:**
- ✅ Works correctly if user exists with that email
- ✅ Shows proper error if user doesn't exist
- ✅ Email validation allows valid special characters

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

## Test Suite 8: UI/UX Polish

### Test 8.1: Visual Design
**Steps:**
1. Review all elements in the settings modal
2. Compare with WhatsApp design language

**Expected Results:**
- ✅ WhatsApp green color scheme (#0C8466) used consistently
- ✅ Consistent spacing and padding throughout
- ✅ Icons properly sized and aligned
- ✅ Rounded corners on cards (12px) and buttons (24px)
- ✅ Proper shadows and elevation
- ✅ Clean, minimal design matching app theme

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 8.2: Animations
**Steps:**
1. Open settings modal
2. Close settings modal
3. Add/remove participants
4. Observe all state transitions

**Expected Results:**
- ✅ Smooth slide-up animation when opening (pageSheet style)
- ✅ Smooth slide-down animation when closing
- ✅ List updates smoothly when adding/removing participants
- ✅ Loading states show appropriate spinners
- ✅ No jarring visual jumps

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

### Test 8.3: Accessibility
**Steps:**
1. Review button tap targets
2. Check text contrast
3. Test with VoiceOver (iOS) or TalkBack (Android) if available

**Expected Results:**
- ✅ All buttons have minimum 44x44pt tap targets
- ✅ Text has good contrast and is readable
- ✅ Input fields are clearly labeled
- ✅ Interactive elements have proper accessibility labels
- ✅ Modal can be dismissed with standard gestures

**Status:** ☐ Pass ☐ Fail
**Notes:**

---

## Quick Smoke Test Checklist

Use this for rapid validation of core functionality:

- [ ] Sign in works without "Missing or insufficient permissions" error
- [ ] Settings icon (⚙️) visible in chat header
- [ ] Settings modal opens and closes smoothly
- [ ] Participant list displays all users correctly
- [ ] Creator badge shows on correct user
- [ ] (You) label shows next to current user
- [ ] (Group chat) Can add participant by valid email
- [ ] (Group chat) Can remove participant as creator
- [ ] Can leave chat from any role
- [ ] Error messages display properly for invalid operations
- [ ] UI looks polished and matches WhatsApp theme
- [ ] No console errors during normal operation

---

## Success Criteria

Feature is validated successfully if:

1. ✅ **Authentication**: No "Missing or insufficient permissions" errors on sign in/sign up
2. ✅ **Access**: Settings modal accessible from all chat types (one-on-one and group)
3. ✅ **Display**: Participants display correctly with proper badges and labels
4. ✅ **Add**: Add participant works for valid emails in group chats
5. ✅ **Remove**: Remove participant works with proper permission checks
6. ✅ **Leave**: Leave chat works for all users regardless of role
7. ✅ **Real-time**: Updates sync across devices in real-time
8. ✅ **Errors**: Error handling is graceful with clear user feedback
9. ✅ **Polish**: UI is polished, responsive, and matches app design system
10. ✅ **Performance**: No lag, crashes, or memory issues during normal use

---

## Test Results Summary

**Date Tested:** _______________
**Tester:** _______________
**Device/Simulator:** _______________
**OS Version:** _______________

**Total Tests:** 31
**Passed:** ___
**Failed:** ___
**Blocked:** ___

**Overall Status:** ☐ Pass ☐ Fail ☐ Needs Fixes

### Critical Issues Found:
1.
2.
3.

### Minor Issues Found:
1.
2.
3.

### Notes/Observations:


---

## Regression Testing

After any fixes, re-test:
- [ ] All failed tests
- [ ] Quick smoke test checklist
- [ ] Any related functionality that may be affected
