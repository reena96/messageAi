import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../authStore';

// Mock Firebase modules
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase/config');

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({ user: null, loading: false, error: null });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should successfully create a new user', async () => {
      const { createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
      const { setDoc, doc, serverTimestamp } = require('firebase/firestore');

      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
      };

      const mockDocRef = { id: 'test-uid' };

      createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });
      updateProfile.mockResolvedValue(undefined);
      setDoc.mockResolvedValue(undefined);
      doc.mockReturnValue(mockDocRef);
      serverTimestamp.mockReturnValue('TIMESTAMP');

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123', 'Test User');
      });

      // Verify Firebase auth called
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();

      // Verify profile updated
      expect(updateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: 'Test User',
      });

      // Verify final state
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle signup errors', async () => {
      const { createUserWithEmailAndPassword } = require('firebase/auth');

      const error = new Error('Email already in use');
      createUserWithEmailAndPassword.mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signUp('test@example.com', 'password123', 'Test User');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Email already in use');
    });

    it('should set loading state during signup', async () => {
      const { createUserWithEmailAndPassword } = require('firebase/auth');
      const { doc, setDoc, serverTimestamp } = require('firebase/firestore');

      const mockDocRef = { id: 'test-uid' };
      doc.mockReturnValue(mockDocRef);
      setDoc.mockResolvedValue(undefined);
      serverTimestamp.mockReturnValue('TIMESTAMP');

      createUserWithEmailAndPassword.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.signUp('test@example.com', 'password123', 'Test User');
      });

      // Should be loading immediately
      expect(result.current.loading).toBe(true);
    });
  });

  describe('signIn', () => {
    it('should successfully sign in existing user', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      const { updateDoc, doc, serverTimestamp } = require('firebase/firestore');
      const { auth } = require('@/lib/firebase/config');

      const mockDocRef = { id: 'test-uid' };
      auth.currentUser = { uid: 'test-uid' };
      signInWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'test-uid' },
      });
      updateDoc.mockResolvedValue(undefined);
      doc.mockReturnValue(mockDocRef);
      serverTimestamp.mockReturnValue('TIMESTAMP');

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(signInWithEmailAndPassword).toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle invalid credentials', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');

      const error = new Error('Invalid email or password');
      signInWithEmailAndPassword.mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signIn('wrong@example.com', 'wrongpass');
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBe('Invalid email or password');
    });
  });

  describe('signOut', () => {
    it('should successfully sign out user', async () => {
      const { signOut } = require('firebase/auth');
      const { updateDoc, doc, serverTimestamp } = require('firebase/firestore');
      const { auth } = require('@/lib/firebase/config');

      const mockDocRef = { id: 'test-uid' };
      auth.currentUser = { uid: 'test-uid' };
      signOut.mockResolvedValue(undefined);
      updateDoc.mockResolvedValue(undefined);
      doc.mockReturnValue(mockDocRef);
      serverTimestamp.mockReturnValue('TIMESTAMP');

      const { result } = renderHook(() => useAuthStore());

      // Set initial user
      act(() => {
        result.current.setUser({ uid: 'test-uid' } as any);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(signOut).toHaveBeenCalled();
      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
    });

    it('should update user status to offline before signing out', async () => {
      const { signOut } = require('firebase/auth');
      const { updateDoc, serverTimestamp, doc } = require('firebase/firestore');
      const { auth } = require('@/lib/firebase/config');

      const mockDocRef = { id: 'test-uid' };
      auth.currentUser = { uid: 'test-uid' };
      signOut.mockResolvedValue(undefined);
      updateDoc.mockResolvedValue(undefined);
      serverTimestamp.mockReturnValue('TIMESTAMP');
      doc.mockReturnValue(mockDocRef);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signOut();
      });

      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        {
          online: false,
          lastSeen: 'TIMESTAMP',
        }
      );
    });
  });
});
