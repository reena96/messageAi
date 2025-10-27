# Quick Calendar Extraction Test

## 🚀 Fast Test (2 Minutes)

### Option 1: Test Cloud Function Directly

**Fastest way to verify the Cloud Function works:**

1. Open: https://console.cloud.google.com/functions/details/us-west1/calendarExtraction?env=gen1&project=messageai-fc793
2. Click **"TESTING"** tab
3. Paste this JSON:
```json
{"data": {"text": "Team meeting Monday at 3pm"}}
```
4. Click **"Test the function"**

**✅ Working if you see:**
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

---

### Option 2: Test in App (With New Logging)

**Send this message in your app:**
```
Team meeting Monday at 3pm
```

**Check logs for:**
```
[AI] 📊 Response data: {"events": [...]}
[AI] 🎯 Parsed 1 calendar event(s)
[AI] 📅 Calendar events: 1
```

**If you see "Calendar events: 0", look for:**
```
[AI] ⚠️ No calendar events found in response
[AI] 🔍 Full result.data: {...}
```

**Send me the log output** and I'll tell you exactly what's wrong!

---

### Option 3: Check Firestore

**Quickest way to see if data is saved:**

1. Open: https://console.firebase.google.com/project/messageai-fc793/firestore/data
2. Navigate: `chats` → (your chat) → `messages` → (latest message)
3. Look for `aiExtraction` subcollection
4. Should have `calendar-0` document

**✅ Working if document exists with:**
- `type: "calendar"`
- `data: {event: "...", date: "...", time: "..."}`
- `userId: "i4600WwukWMqM3GWOu9IIDbzcJ82"`

---

## 🎯 What to Report Back

Just send me ONE of these:

### If Testing Cloud Function:
- Screenshot or copy of the response JSON

### If Testing in App:
- Copy these specific log lines:
  - `[AI] 📊 Response data:`
  - `[AI] 🎯 Parsed X calendar event(s)`
  - `[AI] 📅 Calendar events: X`

### If Checking Firestore:
- Screenshot of the `aiExtraction` subcollection
- Or tell me if it exists/doesn't exist

---

That's it! Pick whichever is easiest and let me know the result. 🚀
