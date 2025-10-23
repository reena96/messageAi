import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '../firebase/config';
import { debugLog, errorLog } from '@/lib/utils/debug';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;

  // Actions
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
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
