import { User as FirebaseUser } from 'firebase/auth';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  online: boolean;
  lastSeen: Date;
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Re-export Firebase auth user type
export type AuthUser = FirebaseUser;
