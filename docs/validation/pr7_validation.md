# PR #7: Decision Summarization + Priority Detection + In-Chat Insights - Validation Plan

**PR:** Decision Summarization + Priority Detection + In-Chat AI Insights
**Date:** October 24, 2025
**Status:** ✅ Ready for Testing
**Branch:** `pr07-decision-priority`

---

## Overview

This PR implements AI-powered decision detection, priority classification, and in-chat AI insight cards. Parents can now see decisions across all chats, filter by pending/resolved, and get priority alerts for urgent messages.

**Key Rubric Requirements:**
- ⚠️ **CRITICAL:** Decision accuracy: **>90%** (rubric requirement)
- ⚠️ **CRITICAL:** Priority accuracy: **>90%** (rubric requirement)
- ✅ Response time: **<3 seconds** (parallel extraction)
- ✅ Non-blocking message send
- ✅ Parent-friendly UX with inline AI insights

---

## Files Created (7 new files)

**Cloud Functions (2 files):**
1. `functions/src/ai/decisionExtraction.ts` (156 lines) - Detects pending/resolved decisions
2. `functions/src/ai/priorityDetection.ts` (185 lines) - Classifies message priority

**Client-side AI Modules (2 files):**
3. `lib/ai/decisions.ts` (157 lines) - Client wrapper + 20 test cases
4. `lib/ai/priority.ts` (156 lines) - Client wrapper + 20 test cases

**UI Components (3 files):**
5. `components/messages/AIInsightCard.tsx` (280 lines) - In-chat AI insight cards
6. `components/navigation/BackButton.tsx` (48 lines) - Reusable back button
7. `app/(tabs)/decisions.tsx` (460 lines) - Decisions tab screen

---

## Files Modified (6 files)

1. `functions/src/index.ts` - Exported 2 new Cloud Functions
2. `types/message.ts` - Extended aiExtraction with decisions + priority
3. `lib/store/messageStore.ts` - Parallel multi-feature extraction
4. `app/(tabs)/_layout.tsx` - Added Decisions tab to navigation
5. `app/(tabs)/calendar.tsx` - Added conditional back button + source chat tracking
6. `app/chat/[id].tsx` - Integrated AIInsightCard + navigation handlers

---

## Manual Validation Steps

### 1. Cloud Function Deployment

**✅ Verify Cloud Functions are Deployed:**
```bash
firebase functions:list
```
Expected: Shows `decisionExtraction` and `priorityDetection` in us-central1

**✅ Test Decision Extraction in Console:**
1. Go to https://console.cloud.google.com/functions
2. Select `decisionExtraction`
3. Go to "Testing" tab
4. Test with:
```json
{"data": {"text": "Should we meet Tuesday or Wednesday?"}}
```
5. Expected output:
```json
{
  "result": {
    "decisions": [
      {
        "decision": "Meeting day selection",
        "status": "pending",
        "confidence": 0.9
      }
    ]
  }
}
```

**✅ Test Priority Detection in Console:**
1. Select `priorityDetection`
2. Test with:
```json
{"data": {"text": "Emma has fever, picking her up from school now"}}
```
3. Expected output:
```json
{
  "result": {
    "priority": {
      "level": "critical",
      "reason": "Sick child requiring immediate parent action",
      "urgency": true,
      "confidence": 1.0
    }
  }
}
```

---

### 2. Decision Extraction - End-to-End

**✅ Test: Pending Decision Detection**
1. Open any chat
2. Send: `"Should we meet Tuesday or Wednesday?"`
3. Wait 2-3 seconds
4. **Expected:** Orange "Discussion" card appears below message
5. **Expected:** Card shows:
   - ❓ Icon (orange)
   - "Discussion" title
   - Status badge: "PENDING"
   - Decision text
6. Check console: `[AI] ✅ Extracted 1 decision(s)`

**✅ Test: Resolved Decision Detection**
1. Send: `"Let's go with Tuesday. Everyone agreed."`
2. Wait 2-3 seconds
3. **Expected:** Green "Decision" card appears below message
4. **Expected:** Card shows:
   - ✅ Icon (green)
   - "Decision" title
   - Status badge: "RESOLVED"

**✅ Test: Non-Decisions (No False Positives)**
1. Send: `"What time should we meet?"` (simple question, not a decision)
2. Wait 3 seconds
3. **Expected:** No decision card appears
4. Check console: `[AI] ✅ Decisions: 0`

**✅ Test: Multiple Decisions**
1. Send: `"We decided to postpone. But we need to decide on a new date."`
2. **Expected:** Decision card appears (at least 1 decision detected)

---

### 3. Priority Detection - End-to-End

**✅ Test: Critical Priority (Sick Child)**
1. Send: `"Emma has fever, picking her up from school now"`
2. Wait 2-3 seconds
3. **Expected:** Red "Critical Priority" card appears
4. **Expected:** Card shows:
   - 🔴 Icon (red/critical)
   - "Critical Priority" title
   - Reason explaining why
   - "⚡ Urgent" badge

**✅ Test: High Priority (Deadline)**
1. Send: `"Permission slip due tomorrow morning"`
2. Wait 2-3 seconds
3. **Expected:** Orange "High Priority" card appears
4. **Expected:** Card shows urgency badge

**✅ Test: Low Priority (No Card)**
1. Send: `"Have a great weekend!"`
2. Wait 3 seconds
3. **Expected:** No priority card appears (low priority not shown inline)
4. **Expected:** Priority still extracted (check Firestore: level="low")

**✅ Test: Parent-Specific Critical**
1. Send: `"School nurse called - Jake hurt on playground"`
2. **Expected:** Critical priority card (parent-specific emergency)

---

### 4. In-Chat AI Insight Cards

**✅ Test: Card Display Priority**
When a message has multiple AI extractions, cards show in this order:
1. Calendar events (highest priority)
2. Decisions (second)
3. Priority (only if high/critical)

**Test:**
1. Send: `"Team meeting tomorrow at 3pm. Should we meet at office or zoom?"`
2. Wait 3 seconds
3. **Expected:** Shows **calendar card** (blue) below message
4. **Expected:** Decision also extracted but card not shown (calendar takes priority)
5. Verify in Firestore: Message has both `calendarEvents` AND `decisions`

**✅ Test: Card Styling**
- Calendar cards: Blue left border, 📅 icon
- Resolved decisions: Green left border, ✅ icon
- Pending decisions: Orange left border, ❓ icon
- Critical priority: Red background, 🔴 icon
- High priority: Orange background, 🟠 icon

**✅ Test: Dynamic Card Rendering**
1. Send: `"Permission slip due tomorrow"`
2. **Expected:** Card appears dynamically 2-3 seconds after message sends
3. **Expected:** No need to exit/re-enter chat to see card
4. **Verification:** This was a bug we fixed - cards should appear without refresh

---

### 5. Decisions Tab

**✅ Test: Navigate to Decisions Tab**
1. Tap **Decisions** tab icon (✓✓ double checkmark) at bottom
2. **Expected:** Shows "Decisions" screen
3. **Expected:** Header shows total count: "X decisions"
4. **Expected:** Filter buttons: All | Pending | Resolved
5. **Expected:** No back button (navigated via tab bar)

**✅ Test: Decision List Display**
1. **Expected:** All decisions from all chats displayed
2. **Expected:** Sorting: Pending decisions first, then resolved
3. **Expected:** Within same status: Newest first
4. Each decision card shows:
   - Status badge (PENDING/RESOLVED)
   - Decision text
   - Context (if present)
   - Participants (if present)
   - Message preview
   - Confidence badge if <80%

**✅ Test: Filter by Status**
1. Tap **"Pending"** button
2. **Expected:** Shows only pending decisions
3. **Expected:** Button highlighted (blue background)
4. **Expected:** Count shows: "Pending (X)"
5. Tap **"Resolved"** button
6. **Expected:** Shows only resolved decisions
7. Tap **"All"** button
8. **Expected:** Shows all decisions again

**✅ Test: Empty State**
1. Filter by "Resolved" when no resolved decisions exist
2. **Expected:** Shows empty state icon (✓✓)
3. **Expected:** Message: "No resolved decisions yet."

---

### 6. Navigation from AI Insight Cards

**✅ Test: Calendar Card Navigation**
1. Send: `"Dentist tomorrow at 2pm"`
2. Tap the blue calendar card
3. **Expected:** Navigates to Calendar tab
4. **Expected:** Shows back button
5. Tap back button
6. **Expected:** Returns to the **same chat** (not Chats list)

**✅ Test: Pending Decision Card Navigation**
1. Send: `"Should we order pizza or bring snacks?"`
2. Tap the orange "Discussion" card
3. **Expected:** Navigates to Decisions tab
4. **Expected:** Pending filter is **automatically selected** ✅
5. **Expected:** Shows only pending decisions
6. **Expected:** Shows back button
7. Tap back button
8. **Expected:** Returns to the **same chat**

**✅ Test: Resolved Decision Card Navigation**
1. Send: `"Everyone agreed on pizza. Let's order!"`
2. Tap the green "Decision" card
3. **Expected:** Navigates to Decisions tab
4. **Expected:** Resolved filter is **automatically selected** ✅
5. **Expected:** Shows only resolved decisions
6. Tap back button
7. **Expected:** Returns to the **same chat**

---

### 7. Navigation from Decisions Tab

**✅ Test: Navigate to Source Chat**
1. Open Decisions tab
2. Tap any decision card
3. **Expected:** Opens the chat where that decision was made
4. **Expected:** Chat screen shows the message
5. **Expected:** Decision card visible below the message

**✅ Test: Back Button Source Tracking**
1. Open chat (e.g., "Team Planning" chat)
2. Tap a decision card → Decisions tab opens
3. Tap back button
4. **Expected:** Returns to "Team Planning" chat (not Chats list) ✅
5. **Verification:** This was a bug we fixed - should return to source chat

---

### 8. Multi-Feature Parallel Extraction

**✅ Test: All Features Extract Simultaneously**
1. Send: `"Team meeting tomorrow at 3pm. Should we meet at office or zoom?"`
2. Watch console logs:
   - `[AI] 🚀 Starting multi-feature extraction`
   - `[AI] ✅ Multi-feature extraction completed`
   - `[AI] 📅 Calendar events: 1`
   - `[AI] ✅ Decisions: 1`
   - `[AI] 🎯 Priority: high`
3. **Expected:** All 3 features extracted in parallel
4. **Expected:** Total time <3 seconds

**✅ Test: Verify in Firestore**
1. Go to Firestore Console
2. Navigate to the message document
3. **Expected:** `aiExtraction` field contains:
```javascript
aiExtraction: {
  calendarEvents: [{...}],
  decisions: [{...}],
  priority: {...},
  extractedAt: [Timestamp]
}
```

---

### 9. Performance & Non-Blocking

**✅ Test: Message Send Performance**
1. Send: `"Quick update"`
2. Measure time until message appears
3. **Expected:** Message appears **<200ms** (non-blocking)
4. **Expected:** AI extraction happens in background

**✅ Test: Parallel Extraction Performance**
1. Send: `"Meeting tomorrow. Should we invite Sarah?"`
2. Start timer when message sends
3. Watch for AI insight card to appear
4. **Expected:** Card appears within **<3 seconds**
5. **Verification:** Parallel execution faster than sequential

---

### 10. Accuracy Validation (Rubric Critical)

**✅ Decision Extraction Accuracy**

Test with these inputs from `DECISION_TEST_CASES`:

**Resolved Decisions (should detect):**
1. ✅ `"Let's go with option B. Everyone agreed."` → status="resolved"
2. ✅ `"We decided to postpone the launch until next month."` → status="resolved"
3. ✅ `"Perfect! Let's meet at the park on Saturday then."` → status="resolved"
4. ✅ `"Sounds good, we'll order pizza for the party."` → status="resolved"
5. ✅ `"All agreed - practice moved to Thursday at 4pm."` → status="resolved"

**Pending Decisions (should detect):**
6. ✅ `"Should we launch next week or wait until February?"` → status="pending"
7. ✅ `"What should we bring to the potluck - snacks or dessert?"` → status="pending"
8. ✅ `"Need to decide on the meeting location - office or zoom?"` → status="pending"
9. ✅ `"Should we reschedule the party or keep it as planned?"` → status="pending"
10. ✅ `"Still deciding between Tuesday 3pm or Wednesday 2pm."` → status="pending"

**Non-Decisions (should NOT detect):**
11. ❌ `"What time should we meet?"` → No decision (simple question)
12. ❌ `"Thanks for the update!"` → No decision
13. ❌ `"How are you doing today?"` → No decision
14. ❌ `"Can you send me the file?"` → No decision (request)
15. ❌ `"I will be there at 3pm."` → No decision (statement)
16. ❌ `"Running 10 minutes late."` → No decision (status)

**Edge Cases:**
17. ❌ `"We need to decide on this soon."` → Too vague
18. ❌ `"Let me think about it and get back to you."` → Deferring
19. ✅ `"Maybe we should meet Tuesday? Not sure yet."` → Pending (tentative)
20. ✅ `"Final decision: We are going with vendor A."` → Resolved

**Decision Accuracy Calculation:**
- Should detect: 15 cases
- Should NOT detect: 5 cases
- **Target: >90% (18/20)**
- Test all 20 cases and calculate accuracy

---

**✅ Priority Detection Accuracy**

Test with these inputs from `PRIORITY_TEST_CASES`:

**Critical Priority:**
1. ✅ `"URGENT: Server is down!"` → level="critical", urgency=true
2. ✅ `"Emma has fever, picking her up from school now"` → critical
3. ✅ `"School nurse called - Jake hurt on playground"` → critical
4. ✅ `"EMERGENCY: Practice cancelled due to severe weather"` → critical
5. ✅ `"Water pipe burst in the classroom"` → critical

**High Priority:**
6. ✅ `"Report due tomorrow at 9am"` → level="high", urgency=true
7. ✅ `"Permission slip needs to be signed by tomorrow morning"` → high
8. ✅ `"Need headcount for party by end of day"` → high
9. ✅ `"Can you pick up Sarah? I'm stuck in traffic"` → high
10. ✅ `"Meeting starts in 30 minutes - are you coming?"` → high

**Medium Priority:**
11. ✅ `"Can you review when you get a chance?"` → level="medium", urgency=false
12. ✅ `"Parent-teacher conference scheduled for next week"` → medium
13. ✅ `"What should we bring to the picnic next Saturday?"` → medium
14. ✅ `"Field trip schedule attached for next month"` → medium
15. ✅ `"Weekly newsletter from teacher"` → medium

**Low Priority:**
16. ✅ `"Just wanted to share this funny video"` → level="low", urgency=false
17. ✅ `"Thanks for the update!"` → low
18. ✅ `"Have a great weekend!"` → low
19. ✅ `"LOL that's hilarious"` → low
20. ✅ `"How are you doing?"` → low

**Priority Accuracy Calculation:**
- All 20 cases should be classified correctly
- **Target: >90% (18/20)**
- Test all 20 cases and calculate accuracy

---

### 11. Offline & Error Handling

**✅ Test: Offline Message with AI Extraction**
1. Turn off WiFi
2. Send: `"Meeting Friday. Should we reschedule?"`
3. Message shows "failed" status with retry button
4. Turn on WiFi
5. Tap retry
6. **Expected:** Message sends AND all AI features extract
7. **Expected:** Decision card + priority + calendar all appear

**✅ Test: AI Extraction Failure (Graceful Degradation)**
1. (Simulated) OpenAI API returns error
2. **Expected:** Message still sends successfully
3. **Expected:** No AI cards appear
4. **Expected:** Console shows error but doesn't crash
5. **Expected:** Priority defaults to "medium" (safe default)

---

### 12. Real-Time Updates

**✅ Test: Decisions Tab Live Updates**
1. Open Decisions tab (leave it open)
2. From another device or window, send message with decision
3. **Expected:** Decisions tab updates in real-time
4. **Expected:** New decision appears without refresh

**✅ Test: Filter Persistence**
1. Navigate to Decisions tab from chat (Pending filter active)
2. Manually switch to "Resolved" filter
3. Go back to chat
4. Navigate to Decisions tab again
5. **Expected:** Returns to "Pending" filter (from navigation parameter)

---

## Success Criteria Checklist

**Functionality:**
- [ ] 2 new Cloud Functions deployed
- [ ] Decision extraction works end-to-end
- [ ] Priority detection works end-to-end
- [ ] In-chat AI insight cards display inline
- [ ] Decisions tab shows all decisions
- [ ] Filter by status (pending/resolved) works
- [ ] Navigation from insights to source works
- [ ] Back button returns to source chat (not Chats list)

**Accuracy (Rubric Critical):**
- [ ] Decision accuracy **>90%** ✅
- [ ] Priority accuracy **>90%** ✅
- [ ] Test cases cover 20+ scenarios each
- [ ] Confidence scoring works
- [ ] Parent-specific priorities detected (sick child = critical)

**Performance:**
- [ ] Multi-feature extraction **<3s total**
- [ ] Message send not blocked
- [ ] Parallel extraction faster than sequential

**UX (Parent-Friendly):**
- [ ] AI insights visible in context (inline in chat)
- [ ] Decisions tab accessible
- [ ] Priority messages highlighted
- [ ] Filter controls work
- [ ] Empty states display
- [ ] Navigation intuitive
- [ ] Smart filter navigation (pending card → pending filter)

**Testing:**
- [ ] TypeScript: 0 errors
- [ ] All new features manually tested
- [ ] Edge cases covered
- [ ] Error handling verified

---

## Known Issues / Future Enhancements

**Fixed During Development:**
1. ✅ Dynamic card rendering bug → Fixed aiExtraction mapping in messageStore
2. ✅ Back button navigation bug → Added source chat tracking
3. ✅ Calendar debug logs → Added CALENDAR_DEBUG flag

**Future Enhancements:**
1. Scroll to source message when tapping decision/event
2. "Add to Calendar" button for calendar events
3. Mark decisions as "resolved" manually
4. Decision reminders for pending items
5. Priority notification badges on Chats tab

---

## Performance Metrics

**Target vs Actual:**
- Decision accuracy: **Target >90%**, Test all 20 cases to measure
- Priority accuracy: **Target >90%**, Test all 20 cases to measure
- Multi-feature extraction: **Target <3s**, Measure in testing
- Message send: **Target <200ms**, Already validated (PR#4)

---

## Sign-off

Pre-commit checklist:
- [ ] All manual tests passed
- [ ] TypeScript: 0 errors ✅
- [ ] Decision accuracy: >90% verified
- [ ] Priority accuracy: >90% verified
- [ ] Performance: <3s multi-extraction
- [ ] UX: Smart navigation works
- [ ] Ready for production

**Validated By:** [Your Name]
**Date:** October 24, 2025
**Status:** ⚠️ Ready for Testing
