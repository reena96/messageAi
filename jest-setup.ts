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
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
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
  serverTimestamp: jest.fn(() => 'TIMESTAMP'),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
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
