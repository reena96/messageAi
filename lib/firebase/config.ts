import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validate that all required environment variables are present
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    'Missing Firebase configuration. Please check your .env file and ensure all EXPO_PUBLIC_FIREBASE_* variables are set.'
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth (Firebase JS SDK handles persistence automatically)
const auth = getAuth(app);

// Initialize Firestore with offline persistence
const firestore = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Cloud Functions region
export const FUNCTIONS_REGION = 'us-west1';

export { auth, firestore, storage };
export default app;
