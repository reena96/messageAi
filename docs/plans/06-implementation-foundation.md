# MessageAI - Implementation: Foundation

**Phase:** Setup & Authentication
**PRs:** #1
**Timeline:** 2-3 hours
**Dependencies:** None

← [Back to README](./README.md) | [Technical Architecture](./02-technical-architecture.md) | [Next: Core Messaging](./07-implementation-core-messaging.md)

---

## Overview

This phase establishes the project foundation with Expo Custom Dev Client, Firebase configuration, and authentication system. **Tests are critical here** - authentication is the gateway to the entire app.

### Success Criteria
- ✅ Expo Custom Dev Client builds successfully on iOS/Android
- ✅ Firebase connection works
- ✅ Unit tests pass for authStore (signUp, signIn, signOut)
- ✅ Integration tests pass for complete auth flow
- ✅ User document created in Firestore on signup

---

## PR #1: Project Setup + Authentication

**Branch:** `feature/auth-setup`
**Estimated Time:** 2-3 hours
**Test Coverage:** Unit + Integration

### Tasks

#### 1. Project Initialization (30 min)

```bash
# Create project
npx create-expo-app@latest messageai --template blank-typescript

cd messageai

# Install core dependencies
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

# Install Firebase
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage @react-native-firebase/messaging

# Install UI libraries
npm install zustand react-native-reanimated @shopify/flash-list expo-image

# Install utilities
npm install @react-native-community/netinfo

# Install testing dependencies
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native @types/jest
```

#### 2. Configure Expo Custom Dev Client (30 min)

**Create `app.json`:**
```json
{
  "expo": {
    "name": "MessageAI",
    "slug": "messageai",
    "version": "1.0.0",
    "scheme": "messageai",
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "expo-router"
    ],
    "ios": {
      "bundleIdentifier": "com.yourname.messageai",
      "googleServicesFile": "./GoogleService-Info.plist",
      "supportsTablet": true
    },
    "android": {
      "package": "com.yourname.messageai",
      "googleServicesFile": "./google-services.json",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "extra": {
      "router": {
        "origin": false
      }
    }
  }
}
```

**Firebase setup checklist:**
- [ ] Create Firebase project at console.firebase.google.com
- [ ] Enable Authentication with Email/Password
- [ ] Enable Firestore Database
- [ ] Download `GoogleService-Info.plist` (iOS) to project root
- [ ] Download `google-services.json` (Android) to project root

#### 3. Firebase Configuration (30 min)

```typescript
// lib/firebase/config.ts
import firestore from '@react-native-firebase/firestore';

// Enable offline persistence with unlimited cache
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});

export { firestore };
export { default as auth } from '@react-native-firebase/auth';
export { default as storage } from '@react-native-firebase/storage';
```

**Test Firebase connection:**
```typescript
// lib/firebase/__tests__/config.test.ts
import { firestore, auth } from '../config';

describe('Firebase Configuration', () => {
  it('should initialize Firestore', () => {
    expect(firestore).toBeDefined();
    expect(firestore().app.name).toBe('[DEFAULT]');
  });

  it('should initialize Auth', () => {
    expect(auth).toBeDefined();
    expect(auth().app.name).toBe('[DEFAULT]');
  });

  it('should have offline persistence enabled', () => {
    const settings = firestore()._settings;
    expect(settings.persistence).toBe(true);
  });
});
```

#### 4. Authentication Store with Tests (1 hour)

```typescript
// lib/store/authStore.ts
import { create } from 'zustand';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface AuthState {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  error: string | null;

  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,

  signUp: async (email, password, displayName) => {
    try {
      set({ loading: true, error: null });

      const userCredential = await auth().createUserWithEmailAndPassword(email, password);

      // Update profile
      await userCredential.user.updateProfile({ displayName });

      // Create user document in Firestore
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

  setUser: (user) => set({ user }),
  clearError: () => set({ error: null }),
}));
```

**Unit tests for authStore:**
```typescript
// lib/store/__tests__/authStore.test.ts
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
    // Reset store state
    useAuthStore.setState({ user: null, loading: false, error: null });

    // Setup mocks
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

      expect(mockAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(mockUser.updateProfile).toHaveBeenCalledWith({
        displayName: 'Test User',
      });
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
          // Expected to throw
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
```

#### 5. Auth Screens (45 min)

```typescript
// app/(auth)/login.tsx
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    clearError();

    if (!email.trim() || !password) {
      return;
    }

    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)/chats');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MessageAI</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        testID="email-input"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        testID="password-input"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
        testID="login-button"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/(auth)/signup')}
        testID="signup-link"
      >
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 20,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});
```

```typescript
// app/(auth)/signup.tsx
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/store/authStore';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const { signUp, loading, error, clearError } = useAuthStore();

  const handleSignup = async () => {
    clearError();

    if (!email.trim() || !password || !displayName.trim()) {
      return;
    }

    try {
      await signUp(email.trim(), password, displayName.trim());
      router.replace('/(tabs)/chats');
    } catch (err) {
      console.error('Signup error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
        testID="displayname-input"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        testID="email-input"
      />

      <TextInput
        style={styles.input}
        placeholder="Password (min 6 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        testID="password-input"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={loading}
        testID="signup-button"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
        testID="login-link"
      >
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 20,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});
```

#### 6. Navigation Setup (30 min)

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import auth from '@react-native-firebase/auth';

export default function RootLayout() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
```

```typescript
// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/lib/store/authStore';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const user = useAuthStore((state) => state.user);

  // Show loading while auth state initializes
  if (user === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/chats" />;
  }

  return <Redirect href="/(auth)/login" />;
}
```

#### 7. Integration Tests (30 min)

```typescript
// __tests__/integration/auth.test.tsx
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
```

---

## Verification Checklist

### Unit Tests
```bash
npm test -- lib/store/__tests__/authStore.test.ts
```

**Expected results:**
- ✅ All signUp tests pass (3 tests)
- ✅ All signIn tests pass (2 tests)
- ✅ All signOut tests pass (2 tests)
- ✅ Firebase configuration test passes

### Integration Tests
```bash
npm test -- __tests__/integration/auth.test.tsx
```

**Expected results:**
- ✅ Login flow tests pass (3 tests)
- ✅ Signup flow tests pass (2 tests)
- ✅ Complete auth flow test passes

### Manual Testing

1. **Build and run:**
   ```bash
   npx expo prebuild
   npx expo run:ios
   # or
   npx expo run:android
   ```

2. **Test signup:**
   - [ ] Navigate to signup screen
   - [ ] Enter: name="Test User", email="test@example.com", password="test123"
   - [ ] Tap "Sign Up"
   - [ ] Verify: User created in Firebase Console
   - [ ] Verify: Redirected to chats screen
   - [ ] Verify: User document exists in Firestore `/users/{uid}`

3. **Test signin:**
   - [ ] Sign out
   - [ ] Navigate to login screen
   - [ ] Enter same credentials
   - [ ] Tap "Sign In"
   - [ ] Verify: Logged in successfully
   - [ ] Verify: `online: true` in Firestore

4. **Test signout:**
   - [ ] Tap sign out in profile
   - [ ] Verify: Redirected to login
   - [ ] Verify: `online: false` in Firestore

5. **Test persistence:**
   - [ ] Sign in
   - [ ] Close app completely
   - [ ] Reopen app
   - [ ] Verify: Still logged in

6. **Test error handling:**
   - [ ] Try invalid email format
   - [ ] Try weak password (<6 chars)
   - [ ] Try existing email for signup
   - [ ] Try wrong password for login
   - [ ] Verify: Appropriate error messages shown

---

## Files Created

```
messageai/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       └── chats.tsx (placeholder)
├── lib/
│   ├── firebase/
│   │   ├── config.ts
│   │   └── __tests__/
│   │       └── config.test.ts
│   └── store/
│       ├── authStore.ts
│       └── __tests__/
│           └── authStore.test.ts
├── __tests__/
│   └── integration/
│       └── auth.test.tsx
├── types/
│   └── user.ts
├── GoogleService-Info.plist (iOS)
├── google-services.json (Android)
├── app.json
├── package.json
└── jest.config.js
```

---

## Success Metrics

**Code Quality:**
- ✅ 100% test coverage for authStore
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ TypeScript types defined
- ✅ No TypeScript errors

**Functionality:**
- ✅ User can sign up
- ✅ User can sign in
- ✅ User can sign out
- ✅ Auth state persists across app restarts
- ✅ User document created in Firestore
- ✅ Online/offline status updates
- ✅ Error handling works correctly

**Performance:**
- ✅ Auth operations complete in <2 seconds
- ✅ App launches to correct screen in <2 seconds

---

## Next Steps

Once all tests pass and verification is complete:

1. **Commit your work:**
   ```bash
   git add .
   git commit -m "feat(auth): implement authentication with tests

   - Setup Expo Custom Dev Client
   - Configure Firebase Auth and Firestore
   - Implement authStore with Zustand
   - Add login/signup screens
   - Add unit tests (100% coverage)
   - Add integration tests for auth flow

   Tests: 10/10 passing"

   git push origin feature/auth-setup
   ```

2. **Create PR and merge**

3. **Move to next phase:** [Core Messaging →](./07-implementation-core-messaging.md)

---

← [Back to README](./README.md) | [Next: Core Messaging](./07-implementation-core-messaging.md)
