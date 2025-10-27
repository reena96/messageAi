# End-to-End Testing Guide for Proactive Assistant

## 🎯 What We Just Fixed

The proactive assistant was returning zero results because AI extraction data was only saved to the message document field, not as a subcollection.

**Fix Applied:** Modified `lib/store/messageStore.ts` to save AI extraction results to BOTH:
1. Message document field (for Calendar/Decisions tabs)
2. `aiExtraction` subcollection (for proactive assistant queries)

---

## 📋 Testing Checklist

### Step 1: Send Test Messages

Open your app and send these messages in a chat:

```
Message 1: "Soccer practice tomorrow at 4pm"
Message 2: "Dentist appointment tomorrow at 4:30pm"
```

**Expected Behavior:**
- Messages appear in chat immediately
- Wait 5-10 seconds for AI extraction to complete

### Step 2: Check App Logs

Look for these log messages:

```
[AI] 🔍 extractCalendarEvents called with text: Soccer practice tomorrow at 4pm
[AI] 📡 Calling Cloud Function for calendar extraction...
[AI] 🎯 Parsed 1 calendar event(s) from response
[AI] 💾 Saved AI extraction to subcollection for proactive assistant
```

**If you see these logs:** ✅ AI extraction is working and saving to subcollection

**If you don't see the last log:** ❌ Subcollection save failed - check for errors

### Step 3: Verify Firestore Data

Open Firebase Console:
https://console.firebase.google.com/project/messageai-fc793/firestore/data

Navigate to:
```
chats/
  └─ {your-chat-id}/
      └─ messages/
          └─ {message-id}/
              └─ aiExtraction/  ← This subcollection should exist
                  ├─ calendar-0
                  │   ├─ type: "calendar"
                  │   ├─ userId: "i4600WwukWMqM3GWOu9IIDbzcJ82"
                  │   ├─ data: {...}
                  │   ├─ timestamp: ...
                  │   ├─ messageId: ...
                  │   └─ chatId: ...
                  └─ calendar-1
                      └─ (same structure)
```

**Check:**
- [ ] `aiExtraction` subcollection exists
- [ ] Documents have `type` field ("calendar", "deadline", "decision", "rsvp")
- [ ] Documents have `userId` field matching your user ID
- [ ] Documents have `timestamp`, `messageId`, `chatId` fields
- [ ] `data` field contains the extracted event/deadline/decision

### Step 4: Test Proactive Assistant

1. **Open AI Assistant Tab**
   - Tap the bulb icon in bottom navigation

2. **Tap "Analyze Schedule" Button**
   - Should show loading spinner
   - Cloud Function executes
   - Wait up to 15 seconds (target: <15s response time)

3. **Expected Result: Conflict Detected!**

You should see an insight card like:

```
🚨 Schedule Conflict Detected

Soccer practice and Dentist appointment overlap on 2025-10-28

Confidence: 85%

Why: Both events scheduled within 30 minutes of each other
- Soccer practice: 4:00 PM
- Dentist appointment: 4:30 PM

Alternatives:
• Reschedule dentist to tomorrow morning at 9:00 AM
• Move soccer practice to 2:00 PM same day
• Consider if dentist can be rescheduled to next week

[👍] [👎]
```

### Step 5: Test Feedback System

1. **Tap Thumbs Up (👍)**
   - Should show confirmation
   - Feedback saved to Firestore

2. **Check Firestore for Feedback**
   ```
   proactiveFeedback/
     └─ {feedback-id}
         ├─ insightId: "..."
         ├─ vote: "up"
         ├─ userId: "..."
         ├─ timestamp: ...
         └─ note: (optional)
   ```

---

## 🐛 Troubleshooting

### Issue 1: No Logs Appear
**Cause:** AI extraction might not be enabled for the chat
**Fix:** Check `lib/store/messageStore.ts` - ensure extraction functions are called

### Issue 2: Subcollection Not Created
**Symptoms:** App logs show extraction succeeded but no subcollection in Firestore
**Check:**
- Are there any errors in the logs after "[AI] 💾 Saved AI extraction..."?
- Does the user have write permissions to Firestore?
- Are Firestore rules allowing subcollection writes?

### Issue 3: Zero Results from Proactive Assistant
**Symptoms:** calendarCount: 0, no insights shown
**Possible Causes:**
1. **Index still building** - Wait 10 minutes, check https://console.firebase.google.com/project/messageai-fc793/firestore/indexes
2. **Wrong userId** - Check Firestore documents have correct userId field
3. **Data structure wrong** - Verify documents have `type`, `userId`, `timestamp` fields

### Issue 4: Authentication Error
**Symptoms:** "User must be authenticated" error
**Cause:** Not logged in or auth token expired
**Fix:** Log out and log back in

### Issue 5: Function Timeout
**Symptoms:** Request takes >15s or times out
**Possible Causes:**
- Too many messages to analyze
- OpenAI API slow response
- Pinecone query slow

**Check Cloud Function logs:**
```bash
firebase functions:log --only proactiveAssistant
```

---

## 📊 Success Criteria

Your implementation is working if:

- [x] Test messages sent successfully
- [x] AI extraction logs appear in console
- [x] `aiExtraction` subcollection created in Firestore
- [x] Documents have correct structure and fields
- [x] Proactive assistant returns insights (calendarCount > 0)
- [x] Conflict insight displayed in UI
- [x] Feedback buttons work
- [x] Feedback saved to Firestore
- [x] Response time <15 seconds
- [x] Confidence score ≥85% for clear conflicts

---

## 🎯 Next Steps After Testing

If all tests pass:

1. **Test More Scenarios:**
   - Deadline pressure: "Report due tomorrow by noon"
   - Pending decision: "Should we go to the park or beach?"
   - RSVP opportunity: "Birthday party Friday! Who's coming?"

2. **Test Edge Cases:**
   - No conflicts (events far apart)
   - Multiple conflicts (3+ overlapping events)
   - Deadline without specific time
   - Decision already resolved

3. **Test Performance:**
   - Measure response time for different data sizes
   - Test with 10+ calendar events
   - Test with 5+ pending decisions

4. **Phase 3 (Optional):**
   - Implement proactive notifications
   - Add quiet hours (7am-9pm)
   - Analytics events
   - Firestore security rules

5. **Create Pull Request:**
   - Document test results
   - Create PR from `feature/proactive-assistant` to `main`
   - Add screenshots of working feature

---

## 🔍 Debug Commands

```bash
# Check Firebase Functions logs
firebase functions:log --only proactiveAssistant

# Check Firestore indexes status
firebase firestore:indexes

# Redeploy functions if needed
npm run deploy:functions

# Clear app cache and restart
# (Expo) - Press 'r' in terminal to reload
```

---

## 📝 What to Report Back

After testing, please share:

1. **App logs** - Copy the "[AI]" log messages
2. **Screenshot** - AI Assistant tab showing insights
3. **Firestore screenshot** - aiExtraction subcollection structure
4. **Response time** - How long did "Analyze Schedule" take?
5. **Conflicts detected** - Did it find the overlap?
6. **Any errors** - Console errors or Firebase errors

This will help verify everything is working correctly! 🚀
