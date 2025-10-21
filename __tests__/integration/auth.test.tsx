import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '@/app/(auth)/login';
import SignupScreen from '@/app/(auth)/signup';
import { useAuthStore } from '@/lib/store/authStore';

jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase/config');
jest.mock('expo-router');

describe('Authentication Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: false, error: null });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('should successfully log in user with valid credentials', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      const { updateDoc } = require('firebase/firestore');
      const { auth } = require('@/lib/firebase/config');

      auth.currentUser = { uid: 'test-uid' };
      signInWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'test-uid' } as any,
      });
      updateDoc.mockResolvedValue(undefined);

      const { getByTestId, queryByText } = render(<LoginScreen />);

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
      });

      expect(queryByText(/error/i)).toBe(null);
    });

    it('should display error for invalid credentials', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');

      signInWithEmailAndPassword.mockRejectedValue(
        new Error('Invalid email or password')
      );

      const { getByTestId, findByText } = render(<LoginScreen />);

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'wrong@example.com');
      fireEvent.changeText(passwordInput, 'wrongpass');
      fireEvent.press(loginButton);

      const errorMessage = await findByText(/Invalid email or password/i);
      expect(errorMessage).toBeTruthy();
    });

    it('should show loading state during login', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');

      signInWithEmailAndPassword.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const { getByTestId } = render(<LoginScreen />);

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      // Button should be disabled during loading
      expect(loginButton.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Signup Flow', () => {
    it('should successfully create new user account', async () => {
      const { createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
      const { setDoc } = require('firebase/firestore');

      const mockUser = {
        uid: 'new-uid',
        email: 'newuser@example.com',
      };

      createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser as any,
      });
      updateProfile.mockResolvedValue(undefined);
      setDoc.mockResolvedValue(undefined);

      const { getByTestId } = render(<SignupScreen />);

      const displayNameInput = getByTestId('displayname-input');
      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const signupButton = getByTestId('signup-button');

      fireEvent.changeText(displayNameInput, 'New User');
      fireEvent.changeText(emailInput, 'newuser@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      });

      expect(updateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: 'New User',
      });
    });

    it('should handle email already in use error', async () => {
      const { createUserWithEmailAndPassword } = require('firebase/auth');

      createUserWithEmailAndPassword.mockRejectedValue(
        new Error('Email already in use')
      );

      const { getByTestId, findByText } = render(<SignupScreen />);

      const displayNameInput = getByTestId('displayname-input');
      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const signupButton = getByTestId('signup-button');

      fireEvent.changeText(displayNameInput, 'Test User');
      fireEvent.changeText(emailInput, 'existing@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signupButton);

      const errorMessage = await findByText(/Email already in use/i);
      expect(errorMessage).toBeTruthy();
    });
  });

  describe('Complete Auth Flow', () => {
    it('should complete signup -> login -> logout flow', async () => {
      const { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut: firebaseSignOut } = require('firebase/auth');
      const { setDoc, updateDoc, serverTimestamp } = require('firebase/firestore');
      const { auth } = require('@/lib/firebase/config');

      const { signUp, signIn, signOut } = useAuthStore.getState();

      // 1. Signup
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
      };

      createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser as any,
      });
      updateProfile.mockResolvedValue(undefined);
      setDoc.mockResolvedValue(undefined);
      serverTimestamp.mockReturnValue('TIMESTAMP');

      await signUp('test@example.com', 'password123', 'Test User');
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();

      // 2. Login
      auth.currentUser = { uid: 'test-uid' } as any;
      signInWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'test-uid' } as any,
      });
      updateDoc.mockResolvedValue(undefined);

      await signIn('test@example.com', 'password123');
      expect(signInWithEmailAndPassword).toHaveBeenCalled();

      // 3. Logout
      firebaseSignOut.mockResolvedValue(undefined);
      await signOut();

      expect(firebaseSignOut).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBe(null);
    });
  });
});
