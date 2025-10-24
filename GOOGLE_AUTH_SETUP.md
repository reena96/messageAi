# Google Authentication Setup Guide

This guide will help you set up Google Sign-In for your MessageAI app.

## Prerequisites

- Firebase project already set up
- Google Cloud Console access

## Step 1: Enable Google Sign-In in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** in the providers list
5. Toggle **Enable**
6. Click **Save**

## Step 2: Get Google Web Client ID

### For Android & iOS:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** → **Credentials**
4. Find the **Web client (auto created by Google Service)** credential
   - This is automatically created when you enable Google Sign-In in Firebase
5. Copy the **Client ID** (it looks like: `xxxxx.apps.googleusercontent.com`)

## Step 3: Add Environment Variable

1. Create a `.env` file in the root of your project (if it doesn't exist)
2. Add the following line:

```bash
# Google Sign-In Web Client ID (from Google Cloud Console)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com
```

Replace `YOUR_WEB_CLIENT_ID_HERE` with the actual Web Client ID from Step 2.

**Example:**
```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

## Step 4: Configure Android (if targeting Android)

1. Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Create an **OAuth 2.0 Client ID** for Android:
   - Click **Create Credentials** → **OAuth Client ID**
   - Application type: **Android**
   - Package name: `com.mary.messageai` (from app.json)
   - SHA-1 certificate fingerprint:
     - For debug: Get it by running:
       ```bash
       cd android && ./gradlew signingReport
       ```
     - Copy the SHA-1 from the debug variant
3. Download the `google-services.json` and place it in `android/app/`

## Step 5: Configure iOS (if targeting iOS)

1. Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Create an **OAuth 2.0 Client ID** for iOS:
   - Click **Create Credentials** → **OAuth Client ID**
   - Application type: **iOS**
   - Bundle ID: `com.mary.messageai` (from app.json)
3. Download the `GoogleService-Info.plist` and place it in `ios/messageai/`
4. Add URL scheme to `app.json`:
   ```json
   "ios": {
     "bundleIdentifier": "com.mary.messageai",
     "supportsTablet": true,
     "googleServicesFile": "./GoogleService-Info.plist"
   }
   ```

## Step 6: Rebuild the App

Since we added a native module, you need to rebuild:

```bash
# For development build
npx expo prebuild --clean

# Then run
npx expo run:android
# or
npx expo run:ios
```

## Step 7: Test

1. Launch the app
2. Navigate to the login screen
3. Tap "Sign in with Google"
4. Select a Google account
5. Grant permissions
6. You should be signed in!

## Troubleshooting

### "Sign in with Google" button doesn't work
- Make sure you've added the `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to your `.env` file
- Restart the development server after adding environment variables
- Check that Google Sign-In is enabled in Firebase Console

### "hasPlayServices error" on Android
- Make sure Google Play Services is installed on your device/emulator
- Update Google Play Services if outdated

### "No Web Client ID found"
- Double-check the Web Client ID in Google Cloud Console
- Make sure you're using the **Web client (auto created by Google Service)** ID, not the Android or iOS ID

### iOS specific: "Sign in failed"
- Ensure you've added the correct URL scheme
- Make sure `GoogleService-Info.plist` is in the correct location
- Rebuild the iOS app after configuration changes

## Security Notes

- Never commit your `.env` file to version control
- Add `.env` to your `.gitignore` file
- Each environment (dev, staging, production) should have its own credentials
- Regularly rotate your API keys and credentials

## Additional Resources

- [Firebase Google Sign-In Docs](https://firebase.google.com/docs/auth/web/google-signin)
- [@react-native-google-signin/google-signin Docs](https://github.com/react-native-google-signin/google-signin)
- [Expo Configuration Guide](https://docs.expo.dev/guides/authentication/)
