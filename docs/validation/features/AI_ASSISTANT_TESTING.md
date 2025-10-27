# AI Assistant Testing Guide

## ✅ What's Been Implemented

### Backend (Phase 1 - Complete)
- ✅ Cloud Functions deployed (`proactiveAssistant`, `submitProactiveFeedback`)
- ✅ Pinecone vector store configured (1536 dimensions, GCP us-central1)
- ✅ LangChain integration with OpenAI GPT-4 Turbo
- ✅ Conflict detection engine (calendar, deadlines, decisions, RSVPs)
- ✅ Feedback collection system

### Frontend (Phase 2 - Complete)
- ✅ AI Assistant tab added to app navigation
- ✅ Empty state with "Analyze Schedule" button
- ✅ Loading states during analysis
- ✅ Insight cards with icons, colors, and confidence badges
- ✅ Feedback system (thumbs up/down)
- ✅ Pull-to-refresh functionality
- ✅ Error handling and alerts

## 🧪 How to Test

### Prerequisites
1. **Have test data in your app:**
   - Some calendar events (from PR #6)
   - Some deadlines (from PR #8)
   - Some pending decisions (from PR #7)
   - Some RSVPs (from PR #8)

2. **Ensure you're logged in** to the app with a valid user account

### Test Steps

#### 1. Open AI Assistant Tab
1. Launch the app
2. Navigate to the "AI Assistant" tab (bulb icon)
3. You should see the empty state with:
   - Bulb icon
   - Title: "Proactive AI Assistant"
   - Description explaining the feature
   - "Analyze Schedule" button

#### 2. Test Schedule Analysis
1. Tap "Analyze Schedule" button
2. You should see:
   - Loading spinner
   - "Analyzing your schedule..." text
3. Wait 5-15 seconds (depending on data size)
4. Results should appear:
   - Summary card with AI-generated overview
   - List of insights (conflicts, reminders, suggestions)

#### 3. Test Insight Cards
Each insight card should display:
- **Icon** matching the insight type:
  - 🔴 Alert circle = Conflict
  - 💡 Bulb = Suggestion
  - 🟠 Bell = Reminder
- **Title** describing the insight
- **Confidence badge** (green/orange/gray)
- **Description** with details
- **Reasoning** explaining why
- **Alternatives** (if applicable)
- **Feedback buttons** (thumbs up/down)

#### 4. Test Feedback System
1. Tap thumbs up or thumbs down on any insight
2. You should see:
   - Loading spinner briefly
   - Alert confirming feedback submitted
   - "Thank You!" message

#### 5. Test Pull-to-Refresh
1. Pull down on the screen
2. Schedule should re-analyze
3. Results update with new insights

#### 6. Test No Insights Scenario
If you have no conflicts or urgent items:
- Should see checkmark icon
- Message: "All clear! No conflicts or urgent items detected."

## 🎯 What to Look For

### Expected Behaviors

**Conflicts Detected When:**
- Two calendar events at same time on same day
- Events within 1 hour of each other

**Reminders Shown For:**
- Deadlines due today (0 days)
- Deadlines due in 1-3 days
- Invitations needing RSVP response

**Suggestions Shown For:**
- Pending decisions (status = "pending")
- Unresolved group chat questions

**No Insights When:**
- No calendar events, deadlines, or decisions
- All deadlines completed
- All decisions resolved
- No scheduling conflicts

### Performance Metrics
- **Response time:** Should be < 15 seconds
- **Loading state:** Should show immediately
- **Error handling:** Should show user-friendly error messages

## 🐛 Common Issues & Solutions

### "Failed to analyze schedule"
**Causes:**
- Not logged in
- No network connection
- Cloud Functions not deployed
- Pinecone index not created

**Solutions:**
- Check auth state
- Verify internet connection
- Run `cd functions && npm run deploy`
- Verify Pinecone index exists in dashboard

### "No insights" when you expect some
**Causes:**
- No test data in Firestore
- Confidence thresholds too high
- Data doesn't match detection patterns

**Solutions:**
- Create test messages with calendar events, deadlines
- Check Firestore for `aiExtraction` collection
- Review conflict detection logic

### Long loading times (>30 seconds)
**Causes:**
- Cold start (first invocation)
- Large amount of data to process
- OpenAI API slow response

**Solutions:**
- Wait for warm start (subsequent calls faster)
- Reduce message context in code
- Check OpenAI API status

## 📊 Test Scenarios

### Scenario 1: Schedule Conflict
**Setup:**
1. Send message: "Soccer practice tomorrow at 4pm"
2. Send message: "Parent meeting tomorrow at 4:30pm"

**Expected:**
- Conflict insight detected
- Confidence: ~85%
- Alternatives suggested

### Scenario 2: Deadline Pressure
**Setup:**
1. Send message: "Permission slip due tomorrow by 5pm"

**Expected:**
- High-priority reminder
- Confidence: ~90%
- Urgency: "Tomorrow"

### Scenario 3: Pending Decision
**Setup:**
1. Send message: "Should we meet at the park or the school?"
2. Don't respond

**Expected:**
- Pending decision detected
- Suggestion to follow up
- Confidence: ~75%

### Scenario 4: RSVP Needed
**Setup:**
1. Send invitation: "Pizza party Friday! Who's coming?"
2. Don't RSVP

**Expected:**
- RSVP reminder
- Suggestion to respond
- Confidence: ~70%

## 🚀 Next Steps After Testing

Once testing is complete:
1. Note any bugs or issues
2. Test accuracy against rubric requirements (>90%)
3. Measure performance (<15s response time)
4. Collect feedback on insight quality
5. Move to Phase 3: Notifications (if time permits)

## 📝 Notes
- First analysis may be slow due to cold start
- Subsequent analyses should be faster (<10s)
- Feedback helps improve the AI over time
- Pull-to-refresh re-runs the full analysis
