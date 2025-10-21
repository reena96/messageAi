import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '@/app/(auth)/login';
import SignupScreen from '@/app/(auth)/signup';
import { useAuthStore } from '@/lib/store/authStore';
import auth from '@react-native-firebase/auth';

jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');
jest.mock('expo-router');

describe('Authentication Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: false, error: null });
  });

  describe('Login Flow', () => {
    it('should successfully log in user with valid credentials', async () => {
      const mockAuth = auth as jest.Mocked<typeof auth>;
      mockAuth().signInWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'test-uid' } as any,
      } as any);

      const { getByTestId, queryByText } = render(<LoginScreen />);

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockAuth().signInWithEmailAndPassword).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });

      expect(queryByText(/error/i)).toBe(null);
    });

    it('should display error for invalid credentials', async () => {
      const mockAuth = auth as jest.Mocked<typeof auth>;
      mockAuth().signInWithEmailAndPassword.mockRejectedValue(
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
      const mockAuth = auth as jest.Mocked<typeof auth>;
      mockAuth().signInWithEmailAndPassword.mockImplementation(
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
      const mockAuth = auth as jest.Mocked<typeof auth>;
      const mockUpdateProfile = jest.fn();

      mockAuth().createUserWithEmailAndPassword.mockResolvedValue({
        user: {
          uid: 'new-uid',
          email: 'newuser@example.com',
          updateProfile: mockUpdateProfile,
        } as any,
      } as any);

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
        expect(mockAuth().createUserWithEmailAndPassword).toHaveBeenCalledWith(
          'newuser@example.com',
          'password123'
        );
      });

      expect(mockUpdateProfile).toHaveBeenCalledWith({
        displayName: 'New User',
      });
    });

    it('should handle email already in use error', async () => {
      const mockAuth = auth as jest.Mocked<typeof auth>;
      mockAuth().createUserWithEmailAndPassword.mockRejectedValue(
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
      const mockAuth = auth as jest.Mocked<typeof auth>;
      const { signUp, signIn, signOut } = useAuthStore.getState();

      // 1. Signup
      mockAuth().createUserWithEmailAndPassword.mockResolvedValue({
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          updateProfile: jest.fn(),
        } as any,
      } as any);

      await signUp('test@example.com', 'password123', 'Test User');
      expect(mockAuth().createUserWithEmailAndPassword).toHaveBeenCalled();

      // 2. Login
      mockAuth().currentUser = { uid: 'test-uid' } as any;
      mockAuth().signInWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'test-uid' } as any,
      } as any);

      await signIn('test@example.com', 'password123');
      expect(mockAuth().signInWithEmailAndPassword).toHaveBeenCalled();

      // 3. Logout
      mockAuth().signOut.mockResolvedValue(undefined);
      await signOut();

      expect(mockAuth().signOut).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBe(null);
    });
  });
});
