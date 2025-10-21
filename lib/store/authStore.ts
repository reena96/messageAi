import { create } from 'zustand';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface AuthState {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  error: string | null;

  // Actions
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
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
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);

      // Update profile
      await userCredential.user.updateProfile({ displayName });

      // Create Firestore user document
      await firestore().collection('users').doc(userCredential.user.uid).set({
        id: userCredential.user.uid,
        email,
        displayName,
        online: true,
        lastSeen: firestore.FieldValue.serverTimestamp(),
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
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

      await auth().signInWithEmailAndPassword(email, password);

      // Update online status
      const currentUser = auth().currentUser;
      if (currentUser) {
        await firestore().collection('users').doc(currentUser.uid).update({
          online: true,
          lastSeen: firestore.FieldValue.serverTimestamp(),
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
      const currentUser = auth().currentUser;
      if (currentUser) {
        await firestore().collection('users').doc(currentUser.uid).update({
          online: false,
          lastSeen: firestore.FieldValue.serverTimestamp(),
        });
      }

      await auth().signOut();
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
