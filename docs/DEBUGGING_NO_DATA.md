# Debugging: No Data Found

## 🔍 Issue: calendarCount = 0

The proactive assistant isn't finding any calendar events, deadlines, or decisions in Firestore.

---

## ✅ Step 1: Check if AI Extraction Ran

### Option A: Check App Logs
When you send a message like "Soccer practice tomorrow at 4pm", you should see logs like:
```
[AI] 🔍 extractCalendarEvents called with text: Soccer practice tomorrow at 4pm
[AI] 📡 Calling Cloud Function for: Soccer practice tomorrow at 4pm...
[AI] 🎯 Parsed 1 calendar event(s) from response
```

**Did you see these logs?**
- ✅ Yes → AI extraction worked, data should be in Firestore
- ❌ No → AI extraction didn't run or failed

### Option B: Check Calendar/Decisions Tabs
1. Go to **Calendar tab** in your app
2. Do you see the events you sent?
   - ✅ Yes → Data is there, query issue
   - ❌ No → AI extraction didn't work

---

## ✅ Step 2: Check Firestore Directly

### Go to Firebase Console:
https://console.firebase.google.com/project/messageai-fc793/firestore/data

### Look for this structure:
```
chats/
  └─ {chatId}/
      └─ messages/
          └─ {messageId}/
              └─ aiExtraction/  ← Should exist
                  └─ calendar/   ← Or deadline, decision, rsvp
                      └─ data: {...}
                        type: "calendar"
                        userId: "your-user-id"
                        timestamp: ...
```

### Questions to Check:
1. **Does `aiExtraction` subcollection exist?**
   - ❌ No → AI extraction functions aren't writing data
   - ✅ Yes → Good, data exists

2. **Is `userId` field populated?**
   - Check: Does the `aiExtraction` document have a `userId` field?
   - Is it YOUR user ID?

3. **Is `type` field correct?**
   - Should be: `"calendar"`, `"deadline"`, `"decision"`, or `"rsvp"`

4. **Is `timestamp` recent?**
   - Should match when you sent the message

---

## ✅ Step 3: Verify User ID Match

The proactive assistant queries for:
```typescript
.where("userId", "==", userId)
```

**Your userId is:** `i4600WwukWMqM3GWOu9IIDbzcJ82` (from logs)

### Check Firestore:
1. Open an `aiExtraction` document
2. Look at the `userId` field
3. **Does it match?** `i4600WwukWMqM3GWOu9IIDbzcJ82`

**Common issues:**
- userId is `null` or missing
- userId is a different user
- Field name is wrong (e.g., `user_id` instead of `userId`)

---

## ✅ Step 4: Check AI Extraction Functions

### Test Calendar Extraction Manually

Go to Firebase Console Functions:
https://console.cloud.google.com/functions/details/us-west1/calendarExtraction?env=gen1&project=messageai-fc793

**Testing Tab Input:**
```json
{
  "data": {
    "text": "Soccer practice tomorrow at 4pm"
  }
}
```

**Expected Response:**
```json
{
  "result": {
    "events": [
      {
        "event": "Soccer practice",
        "date": "2025-10-28",
        "time": "4:00 PM",
        "confidence": 0.95
      }
    ]
  }
}
```

**If this fails:**
- OpenAI API key issue
- Function not deployed
- Permissions issue

---

## ✅ Step 5: Check Message Flow

### How AI Extraction Should Work:

```
1. User sends message
   ↓
2. Message saved to Firestore (chats/{chatId}/messages/{messageId})
   ↓
3. AI extraction functions called (calendar, deadline, decision, rsvp)
   ↓
4. AI extracts data using OpenAI
   ↓
5. Data saved to aiExtraction subcollection
   ↓
6. Data appears in Calendar/Decisions tabs
   ↓
7. Proactive assistant can query this data
```

**Where is the flow breaking?**

---

## 🔧 Common Fixes

### Fix 1: AI Extraction Not Running
**Check:** Are the extraction functions being called when you send messages?

**Look for:**
- Firestore triggers
- onCreate handlers
- Message listeners

**File to check:** Look for code that calls `extractCalendarEvents()` after sending messages

### Fix 2: Data Not Being Saved
**Check:** Do the extraction functions save to Firestore?

**Look at:**
- Where `extractCalendarEvents()` result is used
- Is it saved to `aiExtraction` subcollection?
- Does it include `userId`, `type`, `timestamp`?

### Fix 3: Wrong Collection Structure
**Expected structure:**
```
chats/{chatId}/messages/{messageId}/aiExtraction/{type}
```

**Make sure:**
- Path is exactly this
- Not: `messages/{messageId}/ai_extraction`
- Not: `chats/{chatId}/aiExtraction/{messageId}`

### Fix 4: Missing Fields
**Each aiExtraction document needs:**
- `type`: "calendar" | "deadline" | "decision" | "rsvp"
- `userId`: The user who sent the message
- `timestamp`: Message timestamp (as number)
- `data`: The extracted data (event, deadline, etc.)
- `messageId`: Reference to original message
- `chatId`: Reference to chat

---

## 🎯 Quick Diagnostic Checklist

Run through this checklist:

- [ ] Send message: "Soccer practice tomorrow at 4pm"
- [ ] Wait 5 seconds
- [ ] Check app logs for "[AI]" messages
- [ ] Go to Calendar tab - do you see the event?
- [ ] Open Firestore Console
- [ ] Navigate to chats → messages → aiExtraction
- [ ] Check if documents exist
- [ ] Verify userId matches your user ID
- [ ] Verify type field exists
- [ ] Verify timestamp is recent
- [ ] Run proactive assistant again
- [ ] Check if calendarCount > 0 in logs

---

## 📊 What to Send Me

If still not working, send me:

1. **App logs** when you send a test message
2. **Screenshot** of Firestore structure (chats/messages/aiExtraction)
3. **Screenshot** of an aiExtraction document (to see fields)
4. **Your user ID** from Firebase Auth
5. **Calendar tab** - does it show events?

This will help me pinpoint exactly where the issue is!

---

## 💡 Most Likely Causes (in order)

1. **AI extraction isn't being called** when messages are sent
2. **Data is saved to wrong Firestore path**
3. **userId field is missing or wrong**
4. **type field is missing or wrong**
5. **Query is correct but no data exists**

Let's figure out which one it is! 🔍
