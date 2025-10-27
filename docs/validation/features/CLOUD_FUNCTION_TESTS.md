# Cloud Function Testing Guide

## Test 1: Calendar Extraction

### Go to Firebase Console:
https://console.cloud.google.com/functions/details/us-west1/calendarExtraction?env=gen1&project=messageai-fc793

### Steps:
1. Click on **"TESTING"** tab
2. Enter this JSON in the input box:

```json
{
  "data": {
    "text": "Soccer practice tomorrow at 4pm and dentist appointment tomorrow at 4:30pm"
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
        "event": "Soccer practice",
        "date": "2025-10-28",
        "time": "4:00 PM",
        "confidence": 0.9
      },
      {
        "event": "Dentist appointment",
        "date": "2025-10-28",
        "time": "4:30 PM",
        "confidence": 0.9
      }
    ]
  }
}
```

### What This Tests:
- ✅ Function is deployed
- ✅ OpenAI API key works
- ✅ AI extraction logic works
- ✅ Returns proper JSON format

---

## Test 2: Deadline Extraction

### Go to:
https://console.cloud.google.com/functions/details/us-west1/extractDeadlines?env=gen1&project=messageai-fc793

### Input:
```json
{
  "data": {
    "text": "Permission slip due tomorrow by 5pm"
  }
}
```

### Expected Result:
```json
{
  "result": {
    "deadlines": [
      {
        "task": "Permission slip",
        "dueDate": "2025-10-28",
        "dueTime": "5:00 PM",
        "priority": "high",
        "completed": false,
        "confidence": 0.9
      }
    ]
  }
}
```

---

## Test 3: Decision Extraction

### Go to:
https://console.cloud.google.com/functions/details/us-west1/decisionExtraction?env=gen1&project=messageai-fc793

### Input:
```json
{
  "data": {
    "text": "Should we meet at the park or at home?"
  }
}
```

### Expected Result:
```json
{
  "result": {
    "decisions": [
      {
        "decision": "Meet at the park or at home",
        "status": "pending",
        "confidence": 0.8
      }
    ]
  }
}
```

---

## Test 4: RSVP Tracking

### Go to:
https://console.cloud.google.com/functions/details/us-west1/trackRSVP?env=gen1&project=messageai-fc793

### Input:
```json
{
  "data": {
    "text": "Pizza party Friday! Who's coming?"
  }
}
```

### Expected Result:
```json
{
  "result": {
    "isInvitation": true,
    "isResponse": false,
    "event": "Pizza party Friday",
    "confidence": 0.9
  }
}
```

---

## Test 5: Check Firestore Data

After running the above tests, **NONE of them save to Firestore** because they're just extraction functions.

**The question is:** When you send messages in your app, what happens?

### Let's check your message sending flow:

1. Where in your code do you call these extraction functions?
2. After extraction, where is the data saved?

---

## 🔍 Finding the Integration Point

Let's search for where extraction functions are called in your app:

```bash
# Search for calendar extraction usage
grep -r "extractCalendarEvents" --include="*.ts" --include="*.tsx"

# Search for where messages are sent
grep -r "addDoc.*messages" --include="*.ts" --include="*.tsx"
```

We need to find:
1. **Where messages are sent to Firestore**
2. **Where AI extraction is triggered**
3. **Where extraction results are saved to aiExtraction subcollection**

---

## 🎯 What We're Looking For

The flow should be:
```typescript
// 1. Send message
await addDoc(messagesRef, {
  text: "Soccer practice tomorrow at 4pm",
  userId: currentUser.uid,
  timestamp: serverTimestamp()
});

// 2. Extract AI data
const { events } = await extractCalendarEvents(text);

// 3. Save to aiExtraction subcollection
if (events.length > 0) {
  await addDoc(aiExtractionRef, {
    type: 'calendar',
    userId: currentUser.uid,
    data: events[0],
    timestamp: Date.now(),
    messageId: messageDoc.id,
    chatId: chatId
  });
}
```

**Does this flow exist in your codebase?**

---

## ✅ Next Steps

Please run **Test 1** (Calendar Extraction) in the Firebase Console and tell me:

1. **Did it work?** (Did you get calendar events back?)
2. **What was the exact response?**
3. **Any errors?**

Then let's find where messages are sent in your app and check if AI extraction is being called!
