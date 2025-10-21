import firestore from '@react-native-firebase/firestore';

// Enable offline persistence with unlimited cache
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});

// Export Firebase services
export { firestore };
export { default as auth } from '@react-native-firebase/auth';
export { default as storage } from '@react-native-firebase/storage';
