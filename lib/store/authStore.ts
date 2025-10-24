import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebase/config';
import { debugLog, errorLog } from '@/lib/utils/debug';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;

  // Actions
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  loading: false,
  error: null,

  // Sign up action
  signUp: async (email, password, displayName) => {
    try {
      set({ loading: true, error: null });

      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile
      await updateProfile(userCredential.user, { displayName });

      // Create Firestore user document
      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        id: userCredential.user.uid,
        email,
        displayName,
        online: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Sign in action
  signIn: async (email, password) => {
    try {
      debugLog('🟢 [AuthStore] Starting sign in for:', email);
      set({ loading: true, error: null });

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      debugLog('🟢 [AuthStore] Sign in successful:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
      });

      // Update online status
      const currentUser = auth.currentUser;
      if (currentUser) {
        debugLog('🟢 [AuthStore] Updating user online status in Firestore');
        await updateDoc(doc(firestore, 'users', currentUser.uid), {
          online: true,
          lastSeen: serverTimestamp(),
        });
      }

      set({ loading: false });
      debugLog('🟢 [AuthStore] Sign in complete');
    } catch (error: any) {
      errorLog('🔴 [AuthStore] Sign in error:', error.message);
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Google Sign-In action
  signInWithGoogle: async () => {
    try {
      debugLog('🟢 [AuthStore] Starting Google sign in');
      set({ loading: true, error: null });

      // Check if Google Play services are available
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      debugLog('🟢 [AuthStore] Google sign in successful:', {
        email: userInfo.data?.user?.email,
      });

      // Get Google credential
      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Create Firebase credential
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign in to Firebase with Google credential
      const userCredential = await signInWithCredential(auth, googleCredential);
      debugLog('🟢 [AuthStore] Firebase sign in with Google successful:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
      });

      // Check if user document exists in Firestore
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create Firestore user document for new Google users
        await setDoc(userDocRef, {
          id: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || 'User',
          photoURL: userCredential.user.photoURL,
          online: true,
          lastSeen: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Update online status for existing users
        await updateDoc(userDocRef, {
          online: true,
          lastSeen: serverTimestamp(),
        });
      }

      set({ loading: false });
      debugLog('🟢 [AuthStore] Google sign in complete');
    } catch (error: any) {
      errorLog('🔴 [AuthStore] Google sign in error:', error);
      set({ loading: false, error: error.message || 'Google sign in failed' });
      throw error;
    }
  },

  // Sign out action
  signOut: async () => {
    try {
      set({ loading: true, error: null });

      // Update user status before signing out
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateDoc(doc(firestore, 'users', currentUser.uid), {
          online: false,
          lastSeen: serverTimestamp(),
        });
      }

      await firebaseSignOut(auth);
      set({ user: null, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Setters
  setUser: (user) => {
    debugLog('🟢 [AuthStore] setUser called:', {
      isAuthenticated: !!user,
      uid: user?.uid,
      email: user?.email,
      displayName: user?.displayName,
    });
    set({ user });
  },
  clearError: () => set({ error: null }),
}));
