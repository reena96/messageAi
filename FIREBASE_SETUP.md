# Firebase Setup Instructions

Before running the app, you need to set up Firebase:

## Steps:

1. Go to https://console.firebase.google.com
2. Create new project: "MessageAI"
3. Enable Authentication → Email/Password provider
4. Enable Firestore Database
5. Add iOS app → Download `GoogleService-Info.plist` → Place in project root
6. Add Android app → Download `google-services.json` → Place in project root

## Verify:

- [ ] `GoogleService-Info.plist` exists in project root
- [ ] `google-services.json` exists in project root

**Note:** The app will not build until these files are added!
