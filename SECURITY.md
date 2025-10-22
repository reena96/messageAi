# Security Guide

## ⚠️ CRITICAL: API Keys Exposed in Git History

**Your Firebase API keys were committed to git history and are publicly visible on GitHub!**

### 🚨 Immediate Action Required: Rotate Firebase Keys

Follow these steps **right now** to secure your Firebase project:

#### Step 1: Open Firebase Console

1. Go to [Firebase Console - messageai-fc793](https://console.firebase.google.com/project/messageai-fc793/settings/general)
2. Sign in with your Google account
3. Click on the **Settings** (gear icon) → **Project settings**

#### Step 2: Delete the Exposed Web App

1. Scroll down to **"Your apps"** section
2. Find your Web App (should show the exposed App ID: `1:888955196853:web:b16a48a69c2a3edcc7f5fc`)
3. Click the **trash icon** next to the web app
4. Confirm deletion when prompted

#### Step 3: Create a New Web App

1. In the same **"Your apps"** section, click **"Add app"**
2. Select the **Web** platform (</> icon)
3. Enter app nickname: `MessageAI Web` (or any name you prefer)
4. **Check** "Also set up Firebase Hosting" (optional)
5. Click **"Register app"**

#### Step 4: Copy Your New Configuration

You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "NEW_API_KEY_HERE",
  authDomain: "messageai-fc793.firebaseapp.com",
  projectId: "messageai-fc793",
  storageBucket: "messageai-fc793.firebasestorage.app",
  messagingSenderId: "888955196853",
  appId: "NEW_APP_ID_HERE",
  measurementId: "NEW_MEASUREMENT_ID_HERE"
};
```

#### Step 5: Update Your .env File

1. Open your `.env` file in the project root
2. Replace the old values with the new ones:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=NEW_API_KEY_HERE
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=messageai-fc793.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=messageai-fc793
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=messageai-fc793.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=888955196853
EXPO_PUBLIC_FIREBASE_APP_ID=NEW_APP_ID_HERE
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=NEW_MEASUREMENT_ID_HERE
```

3. Save the file

#### Step 6: Restart Your Development Server

```bash
# Stop your current Expo server (Ctrl+C)
# Clear Metro bundler cache and restart
npx expo start --clear
```

#### Step 7: Verify It Works

1. Open Expo Go on your phone and reload the app
2. Try logging in or signing up
3. Verify authentication works with the new keys

#### Step 8: Update google-services.json (Android)

If you're building for Android:

1. In Firebase Console, scroll down to **"Your apps"**
2. Find your **Android app** (if exists)
3. Click the settings icon → **Download google-services.json**
4. Replace `android/app/google-services.json` with the new file

#### Step 9: Update GoogleService-Info.plist (iOS)

If you're building for iOS:

1. In Firebase Console, scroll down to **"Your apps"**
2. Find your **iOS app** (if exists)
3. Click the settings icon → **Download GoogleService-Info.plist**
4. Replace `ios/MessageAI/GoogleService-Info.plist` with the new file

### ✅ Verify Security Rules Are Enabled

**IMPORTANT:** Firebase security doesn't come from hiding API keys - it comes from proper security rules.

1. Go to [Firestore Rules](https://console.firebase.google.com/project/messageai-fc793/firestore/rules)
2. Ensure you have authentication-based rules, not this:
   ```javascript
   // ❌ BAD - Anyone can read/write
   allow read, write: if true;
   ```

3. Use authentication-based rules like this:
   ```javascript
   // ✅ GOOD - Only authenticated users
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /chats/{chatId} {
         allow read, write: if request.auth != null &&
           request.auth.uid in resource.data.participants;
       }
     }
   }
   ```

### How We Fixed It

✅ Moved Firebase config from hardcoded values to environment variables
✅ Added `.env` to `.gitignore`
✅ Created `.env.example` as a template
✅ Added validation to ensure env vars are present

### Environment Variables Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your Firebase credentials:**
   Edit `.env` and replace the placeholder values with your actual Firebase config.

3. **Never commit .env:**
   The `.env` file is now in `.gitignore` and should never be committed.

### For Team Members

If you're setting up this project:

1. Get the `.env` file from a secure source (1Password, LastPass, etc.)
2. Or create your own Firebase project and use those credentials
3. Copy `.env.example` to `.env` and fill in the values

### Security Best Practices

#### ✅ DO:
- Use environment variables for all secrets
- Keep `.env` in `.gitignore`
- Share secrets through secure channels (password managers)
- Enable Firebase Security Rules
- Use Firebase Authentication for user access control
- Regularly rotate API keys

#### ❌ DON'T:
- Commit `.env` files to git
- Hardcode API keys in source code
- Share API keys in Slack/email/Discord
- Rely on API key secrecy for security
- Use the same Firebase project for dev and production

### Firebase Web API Keys

**Note:** Firebase Web API keys are not meant to be secret. They identify your Firebase project to Google's servers. Security comes from:

1. **Firebase Authentication** - Controls who can access your app
2. **Security Rules** - Controls what authenticated users can read/write
3. **App Check** - Prevents abuse from unauthorized apps (optional)

However, exposing keys still allows attackers to:
- Enumerate your project
- Attempt brute force attacks
- Potentially exploit misconfigurations

**This is why you should still rotate exposed keys.**

### References

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [Environment Variables in Expo](https://docs.expo.dev/guides/environment-variables/)

---

**Last Updated:** October 21, 2025
**Action Required:** Rotate Firebase API keys immediately
