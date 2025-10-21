import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../authStore';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Mock Firebase modules
jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');

describe('authStore', () => {
  let mockAuth: any;
  let mockFirestore: any;

  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({ user: null, loading: false, error: null });

    // Setup Firebase mocks
    mockAuth = {
      createUserWithEmailAndPassword: jest.fn(),
      signInWithEmailAndPassword: jest.fn(),
      signOut: jest.fn(),
      currentUser: null,
    };

    mockFirestore = {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          set: jest.fn(),
          update: jest.fn(),
        })),
      })),
      FieldValue: {
        serverTimestamp: jest.fn(() => 'TIMESTAMP'),
      },
    };

    (auth as jest.Mock).mockReturnValue(mockAuth);
    (firestore as jest.Mock).mockReturnValue(mockFirestore);
  });

  describe('signUp', () => {
    it('should successfully create a new user', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        updateProfile: jest.fn(),
      };

      mockAuth.createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123', 'Test User');
      });

      // Verify Firebase auth called
      expect(mockAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );

      // Verify profile updated
      expect(mockUser.updateProfile).toHaveBeenCalledWith({
        displayName: 'Test User',
      });

      // Verify final state
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle signup errors', async () => {
      const error = new Error('Email already in use');
      mockAuth.createUserWithEmailAndPassword.mockRejectedValue(error);

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
      mockAuth.createUserWithEmailAndPassword.mockImplementation(
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
      mockAuth.currentUser = { uid: 'test-uid' };
      mockAuth.signInWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'test-uid' },
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle invalid credentials', async () => {
      const error = new Error('Invalid email or password');
      mockAuth.signInWithEmailAndPassword.mockRejectedValue(error);

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
      mockAuth.currentUser = { uid: 'test-uid' };
      mockAuth.signOut.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      // Set initial user
      act(() => {
        result.current.setUser({ uid: 'test-uid' } as any);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockAuth.signOut).toHaveBeenCalled();
      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
    });

    it('should update user status to offline before signing out', async () => {
      mockAuth.currentUser = { uid: 'test-uid' };
      mockAuth.signOut.mockResolvedValue(undefined);

      const mockUpdate = jest.fn();
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn(() => ({
          update: mockUpdate,
        })),
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        online: false,
        lastSeen: 'TIMESTAMP',
      });
    });
  });
});
