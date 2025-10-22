import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACDLyeqGuTT61TxjBQBQn2N_fvpjF63OI",
  authDomain: "messageai-fc793.firebaseapp.com",
  projectId: "messageai-fc793",
  storageBucket: "messageai-fc793.firebasestorage.app",
  messagingSenderId: "888955196853",
  appId: "1:888955196853:web:b16a48a69c2a3edcc7f5fc",
  measurementId: "G-X3ZYYT3PSX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth (Firebase JS SDK handles persistence automatically)
const auth = getAuth(app);

// Initialize Firestore with offline persistence
const firestore = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { auth, firestore, storage };
export default app;
