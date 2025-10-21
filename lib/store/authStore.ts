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
      set({ loading: true, error: null });

      await signInWithEmailAndPassword(auth, email, password);

      // Update online status
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateDoc(doc(firestore, 'users', currentUser.uid), {
          online: true,
          lastSeen: serverTimestamp(),
        });
      }

      set({ loading: false });
    } catch (error: any) {
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
  setUser: (user) => set({ user }),
  clearError: () => set({ error: null }),
}));
