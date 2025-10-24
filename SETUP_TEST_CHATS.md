# Quick Setup: Test Chats for PR #3 Validation

## Option 1: Using the Debug Tab (Easiest)

I've added a **Debug tab** to your app with helper tools!

### Steps:
1. **Start the app:**
   ```bash
   npx expo start --clear
   ```

2. **Create 2 user accounts:**
   - Open app on Device 1 → Sign up as `testuser1@example.com`
   - Open app on Device 2 → Sign up as `testuser2@example.com`

3. **Go to Debug tab:**
   - Navigate to the **Debug** tab (bug icon)
   - You'll see your current user info

4. **Get both user UIDs:**
   - Open Firebase Console: https://console.firebase.google.com/project/messageai-fc793/firestore/data
   - Go to **Authentication** tab
   - Copy the UID for testuser1@example.com
   - Copy the UID for testuser2@example.com

5. **Create test chat manually in Firebase Console:**
   - Go to **Firestore Database**
   - Click **"Start collection"** or add to existing `chats` collection
   - Collection ID: `chats`
   - Click **Next**
   - Document ID: Auto-generate or use `test-chat-1`
   - Add fields (see below)

### Chat Document Structure:

```javascript
{
  type: "one-on-one",
  participants: ["USER1_UID_HERE", "USER2_UID_HERE"],  // ⚠️ Replace with actual UIDs
  participantDetails: {
    "USER1_UID_HERE": {
      displayName: "Test User 1",
      photoURL: null
    },
    "USER2_UID_HERE": {
      displayName: "Test User 2",
      photoURL: null
    }
  },
  unreadCount: {
    "USER1_UID_HERE": 0,
    "USER2_UID_HERE": 0
  },
  createdBy: "USER1_UID_HERE",
  createdAt: [Timestamp: Click "Insert timestamp"],
  updatedAt: [Timestamp: Click "Insert timestamp"]
}
```

**Field Types in Firebase Console:**
- `type`: string
- `participants`: array (click + to add each UID)
- `participantDetails`: map
  - Click + to add nested field: `USER1_UID_HERE`
    - `displayName`: string
    - `photoURL`: null
  - Click + to add nested field: `USER2_UID_HERE`
    - `displayName`: string
    - `photoURL`: null
- `unreadCount`: map
  - `USER1_UID_HERE`: number (0)
  - `USER2_UID_HERE`: number (0)
- `createdBy`: string
- `createdAt`: timestamp (click calendar icon → select "Insert timestamp")
- `updatedAt`: timestamp (click calendar icon → select "Insert timestamp")

---

## Option 2: Using Firebase Console Directly (Recommended)

This is the most reliable method and what the validation guide recommends.

### Steps:

1. **Create 2 test users** via app signup:
   ```
   testuser1@example.com / password123
   testuser2@example.com / password123
   ```

2. **Get their UIDs:**
   - Firebase Console → Authentication
   - Copy both UIDs

3. **Create chat document:**
   - Firebase Console → Firestore → Start collection
   - Follow the structure above

4. **Start testing:**
   - Open app on Device 1 (logged in as User 1)
   - Go to Chats tab → You should see "Test User 2"
   - Tap to open chat
   - Follow validation guide: `docs/validation/pr3_messaging_validation.md`

---

## Option 3: Using React Native Debugger (Advanced)

If you're comfortable with the debugger:

1. **Open React Native Debugger**

2. **Sign in as User 1** in the app

3. **Run this in the console:**
   ```javascript
   // Get Firebase functions
   const { collection, addDoc, serverTimestamp } = require('firebase/firestore');
   const { firestore } = require('./lib/firebase/config');
   const { useAuthStore } = require('./lib/store/authStore');

   // Get current user
   const currentUser = useAuthStore.getState().user;

   // Create test chat
   const createChat = async () => {
     const chat = await addDoc(collection(firestore, 'chats'), {
       type: 'one-on-one',
       participants: [currentUser.uid, 'OTHER_USER_UID_HERE'], // ⚠️ Replace
       participantDetails: {
         [currentUser.uid]: {
           displayName: currentUser.displayName || 'User 1',
           photoURL: currentUser.photoURL || null,
         },
         'OTHER_USER_UID_HERE': {
           displayName: 'Test User 2',
           photoURL: null,
         },
       },
       unreadCount: {
         [currentUser.uid]: 0,
         'OTHER_USER_UID_HERE': 0,
       },
       createdBy: currentUser.uid,
       createdAt: serverTimestamp(),
       updatedAt: serverTimestamp(),
     });
     console.log('✅ Chat created:', chat.id);
     return chat.id;
   };

   // Run it
   createChat();
   ```

---

## Verification

After creating the chat, verify it worked:

### In the App:
- [ ] Go to Chats tab
- [ ] See "Test User 2" (or whatever name you used)
- [ ] Tap the chat
- [ ] Chat screen opens
- [ ] Shows "No messages yet"

### In Firebase Console:
- [ ] Firestore → `chats` collection exists
- [ ] Has 1 document
- [ ] Document has correct participants array
- [ ] Both user UIDs are in participants

---

## Troubleshooting

### "Chat doesn't appear in chat list"
- Check user is logged in
- Verify participants array includes current user's UID
- Check Firestore rules allow reads
- Try restarting the app

### "Cannot create collection"
- This is normal - Firestore creates collections automatically
- Just click "Start collection" and add your first document

### "Permission denied"
- Check user is authenticated
- Check Firestore rules in Firebase Console
- Should allow authenticated users to read/write chats

---

## What's Next?

Once you have a test chat created:

1. **Follow the validation guide:**
   ```
   docs/validation/pr3_messaging_validation.md
   ```

2. **Start from Phase 3:** Core Messaging Tests

3. **Test real-time messaging** between 2 devices!

---

## Quick Reference: Firebase Console URLs

- **Firestore Database:** https://console.firebase.google.com/project/messageai-fc793/firestore
- **Authentication:** https://console.firebase.google.com/project/messageai-fc793/authentication/users
- **Project Settings:** https://console.firebase.google.com/project/messageai-fc793/settings/general

---

Need help? The Debug tab in the app has step-by-step instructions!
