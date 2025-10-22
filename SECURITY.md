# Security Guide

## ⚠️ IMPORTANT: API Keys Exposed in Git History

**Your Firebase API keys were committed to git history and are publicly visible!**

### Immediate Action Required

1. **Rotate Your Firebase Keys** (Recommended)
   - Go to [Firebase Console](https://console.firebase.google.com/project/messageai-fc793/settings/general)
   - Navigate to Project Settings > General
   - Delete the current Web App and create a new one
   - Update your `.env` file with the new credentials

2. **Enable Firebase Security Rules**
   - Ensure your Firestore security rules are properly configured
   - Never rely on API key secrecy for security
   - Use Firebase Authentication + Security Rules for access control

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
