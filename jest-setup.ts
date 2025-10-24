// Mock Firebase JS SDK
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
    name: '[DEFAULT]',
  })),
}));

jest.mock('firebase/auth', () => ({
  initializeAuth: jest.fn(() => ({
    app: { name: '[DEFAULT]' },
    currentUser: null,
  })),
  getAuth: jest.fn(() => ({
    app: { name: '[DEFAULT]' },
    currentUser: null,
  })),
  getReactNativePersistence: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({
    user: {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
    },
  })),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({
    user: {
      uid: 'test-uid',
      email: 'test@example.com',
    },
  })),
  signOut: jest.fn(() => Promise.resolve()),
  updateProfile: jest.fn(() => Promise.resolve()),
  GoogleAuthProvider: jest.fn(() => ({})),
  signInWithCredential: jest.fn(() => Promise.resolve({
    user: {
      uid: 'test-uid',
      email: 'test@example.com',
    },
  })),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return jest.fn(); // unsubscribe
  }),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({
    app: { name: '[DEFAULT]' },
  })),
  doc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({
    data: () => ({
      participants: [],
      activeViewers: {},
    }),
    exists: () => true,
    id: 'mock-doc-id',
  })),
  serverTimestamp: jest.fn(() => 'TIMESTAMP'),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn((ref, callback) => {
    // Call callback with mock document snapshot
    const mockSnapshot = {
      data: jest.fn(() => ({})),
      exists: () => true,
      id: 'mock-id',
      metadata: {},
    };
    callback(mockSnapshot);
    return jest.fn(); // unsubscribe function
  }),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  arrayUnion: jest.fn(),
  increment: jest.fn((val) => val),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({
    app: { name: '[DEFAULT]' },
  })),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

// Mock Firebase config
jest.mock('./lib/firebase/config', () => ({
  auth: {
    app: { name: '[DEFAULT]' },
    currentUser: null,
  },
  firestore: {
    app: { name: '[DEFAULT]' },
  },
  storage: {
    app: { name: '[DEFAULT]' },
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  Redirect: ({ href }: { href: string }) => null,
  Stack: {
    Screen: () => null,
  },
  Tabs: {
    Screen: () => null,
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock @react-native-google-signin/google-signin
// This native module was added in PR3 and needs to be mocked for tests
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({
      idToken: 'mock-id-token',
      user: {
        id: 'mock-google-user-id',
        email: 'test@example.com',
        name: 'Test User',
        photo: 'https://example.com/photo.jpg',
      },
    })),
    signOut: jest.fn(() => Promise.resolve()),
    isSignedIn: jest.fn(() => Promise.resolve(false)),
    getCurrentUser: jest.fn(() => Promise.resolve(null)),
    revokeAccess: jest.fn(() => Promise.resolve()),
    getTokens: jest.fn(() => Promise.resolve({
      idToken: 'mock-id-token',
      accessToken: 'mock-access-token',
    })),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: '0',
    IN_PROGRESS: '1',
    PLAY_SERVICES_NOT_AVAILABLE: '2',
  },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ name, size, color, ...props }: any) =>
      React.createElement('Text', { ...props, testID: `icon-${name}` }, name),
    MaterialIcons: ({ name, size, color, ...props }: any) =>
      React.createElement('Text', { ...props, testID: `icon-${name}` }, name),
    FontAwesome: ({ name, size, color, ...props }: any) =>
      React.createElement('Text', { ...props, testID: `icon-${name}` }, name),
  };
});
