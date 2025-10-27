# Calendar Extraction Testing Guide

## 🎯 Goal
Verify that calendar extraction is working end-to-end:
1. Cloud Function extracts events from text
2. Events are returned to the app
3. Events are saved to Firestore subcollection
4. Proactive assistant can query the events

---

## ✅ Step 1: Test Cloud Function Directly

This tests if the Cloud Function itself is working, independent of the app.

### Go to Firebase Console:
https://console.cloud.google.com/functions/details/us-west1/calendarExtraction?env=gen1&project=messageai-fc793

### Steps:
1. Click on **"TESTING"** tab
2. Enter this JSON in the input box:

```json
{
  "data": {
    "text": "Team meeting Monday at 3pm"
  }
}
```

3. Click **"Test the function"**

### Expected Result:
```json
{
  "result": {
    "events": [
      {
        "event": "Team meeting",
        "date": "2025-10-27",
        "time": "3:00 PM",
        "confidence": 0.9
      }
    ]
  }
}
```

### ✅ Success Criteria:
- Status code: 200
- `events` array has 1 item
- Event has `event`, `date`, `time`, `confidence` fields
- No errors

### ❌ If It Fails:
- Check OpenAI API key is set correctly
- Check function logs for errors
- Verify function is deployed

---

## ✅ Step 2: Test From React Native App

This tests the full flow from app → Cloud Function → app.

### Test Message:
Open your app and send this message:
```
Team meeting Monday at 3pm
```

### Expected Logs:
```
[AI] 🔍 extractCalendarEvents called with text: Team meeting Monday at 3pm
[AI] 📡 Calling Cloud Function for: Team meeting Monday at 3pm...
[AI] 🌐 Invoking calendarExtraction function...
[AI] 📦 Received response from Cloud Function: {...}
[AI] 📊 Response data: {"events": [...]}
[AI] 🎯 Parsed 1 calendar event(s) from response
[AI] ✅ Events extracted: [{"event": "Team meeting", ...}]
[AI] 📅 Calendar events: 1
[AI] 💾 Updating message XXX with AI extraction data
[AI] 💾 Saved AI extraction to subcollection for proactive assistant
[AI] ✅ Saved to aiExtraction subcollection
```

### ✅ Success Criteria:
- "Calendar events: 1" (not 0)
- "Saved to aiExtraction subcollection" appears
- No errors about permissions or parsing

### ❌ If "Calendar events: 0":
Look at these specific logs:
- `[AI] 📊 Response data:` - What does this show?
- `[AI] ⚠️ No calendar events found` - Did this warning appear?
- `[AI] 🔍 Full result.data:` - What's the raw data?

**Common Issues:**
1. **Response data is null/undefined** → Cloud Function not returning data
2. **events array is empty** → OpenAI didn't extract events
3. **Parsing error** → Response format doesn't match expected structure

---

## ✅ Step 3: Verify Firestore Data

This confirms data is actually saved to the database.

### Go to Firestore Console:
https://console.firebase.google.com/project/messageai-fc793/firestore/data

### Navigate to:
```
chats/
  └─ {your-chat-id}/
      └─ messages/
          └─ {message-id}/
              └─ aiExtraction/  ← Should exist
                  └─ calendar-0  ← Document for first event
```

### Click on `calendar-0` document

### Expected Fields:
```
type: "calendar"
userId: "i4600WwukWMqM3GWOu9IIDbzcJ82"  (your user ID)
timestamp: 1730009123456  (recent timestamp)
messageId: "ABC123..."
chatId: "XYZ789..."
data: {
  event: "Team meeting"
  date: "2025-10-27"
  time: "3:00 PM"
  confidence: 0.9
}
createdAt: October 27, 2025 at 12:00:00 AM UTC-7
```

### ✅ Success Criteria:
- `aiExtraction` subcollection exists
- `calendar-0` document exists
- All fields are populated
- `userId` matches your user ID
- `timestamp` is recent

### ❌ If Subcollection Doesn't Exist:
- Check app logs for "Saved to aiExtraction subcollection"
- Check for permission errors in logs
- Verify Firestore rules allow writing to subcollection

---

## ✅ Step 4: Test Proactive Assistant Query

This tests if the proactive assistant can find the saved calendar events.

### From Your App:
1. Go to **AI Assistant** tab (bulb icon)
2. Tap **"Analyze Schedule"**
3. Wait 10-15 seconds

### Expected Result:
The proactive assistant should:
- Find the calendar events
- Show insightCount > 0 (if there's a conflict)
- Show a summary mentioning your events

### Check Cloud Function Logs:
```bash
firebase functions:log --only proactiveAssistant
```

Look for:
```
calendarCount: 1
deadlineCount: 0
decisionCount: 0
```

### ✅ Success Criteria:
- `calendarCount > 0` (not 0)
- If you have 2+ events with overlapping times, insightCount > 0
- Summary mentions your events

### ❌ If calendarCount = 0:
**This means the query isn't finding the data:**
1. Check Firestore indexes are ENABLED (not building)
2. Verify `userId` in documents matches auth user ID
3. Check `type` field = "calendar" (exactly)
4. Verify `timestamp` field exists and is a number

---

## 🧪 Complete Test Scenario

Send these 3 messages to test the full flow:

### Message 1:
```
Team meeting Monday at 3pm
```
**Expected:** 1 calendar event extracted

### Message 2:
```
Doctor appointment Monday at 2:30pm
```
**Expected:** 1 calendar event extracted

### Message 3:
```
Soccer practice Monday at 4pm
```
**Expected:** 1 calendar event extracted

### Then Test Proactive Assistant:
1. Open AI Assistant tab
2. Tap "Analyze Schedule"
3. **Expected:** Should detect 2 conflicts:
   - Team meeting (3pm) overlaps with Doctor appointment (2:30pm)
   - Team meeting (3pm) overlaps with Soccer practice (4pm)

---

## 📊 Success Checklist

- [ ] Step 1: Cloud Function test in Firebase Console returns events
- [ ] Step 2: App logs show "Calendar events: 1"
- [ ] Step 2: App logs show "Saved to aiExtraction subcollection"
- [ ] Step 3: Firestore has `aiExtraction/calendar-0` document
- [ ] Step 3: Document has correct `userId`, `type`, `timestamp`
- [ ] Step 4: Proactive assistant shows `calendarCount > 0`
- [ ] Step 4: Proactive assistant detects conflicts

---

## 🔧 Debugging Commands

### View recent calendar extraction logs:
```bash
firebase functions:log --only calendarExtraction | grep -E "eventsFound|inputLength" | tail -10
```

### View proactive assistant logs:
```bash
firebase functions:log --only proactiveAssistant | tail -50
```

### Check Firestore indexes:
```bash
firebase firestore:indexes
```

### Redeploy if needed:
```bash
npm run deploy:functions
```

---

## 💡 Common Issues and Fixes

### Issue 1: "Calendar events: 0" in app logs
**Cause:** Cloud Function returning empty events array
**Fix:** Test Cloud Function directly (Step 1) to see if it's the function or the app

### Issue 2: "Permission denied" errors
**Cause:** Firestore rules don't allow subcollection writes
**Fix:** Already fixed - rules deployed

### Issue 3: aiExtraction subcollection doesn't exist
**Cause:** `saveAIExtractionToSubcollection` not being called
**Fix:** Already fixed - using helper function

### Issue 4: Proactive assistant finds 0 events
**Cause:** Query not matching documents (wrong userId, type, or missing index)
**Fix:** Verify Firestore document structure matches query expectations

---

## 🎯 Next Steps

Once calendar extraction is confirmed working:
1. Test with multiple events
2. Test conflict detection
3. Test deadline extraction
4. Test decision extraction
5. Test RSVP tracking
6. Full end-to-end proactive assistant test

---

**Current Status:** Ready to test with enhanced logging ✅
