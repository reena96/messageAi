/**
 * Script to create test chats in Firestore for PR #3 validation
 *
 * Run this from React Native Debugger console or add to a debug screen
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../lib/firebase/config';

/**
 * Creates test chats for validation
 *
 * IMPORTANT: You need 2 authenticated users first!
 * 1. Sign up testuser1@example.com
 * 2. Sign up testuser2@example.com
 * 3. Get their UIDs from Firebase Console → Authentication
 * 4. Replace the UIDs below
 * 5. Run this script
 */
export async function createTestChats() {
  console.log('🔧 Creating test chats for PR #3 validation...');

  // ⚠️ REPLACE THESE WITH ACTUAL USER IDs FROM FIREBASE AUTHENTICATION
  const user1Id = 'REPLACE_WITH_USER1_UID'; // testuser1@example.com
  const user2Id = 'REPLACE_WITH_USER2_UID'; // testuser2@example.com

  if (user1Id === 'REPLACE_WITH_USER1_UID' || user2Id === 'REPLACE_WITH_USER2_UID') {
    console.error('❌ ERROR: Please replace the user IDs with actual UIDs from Firebase Authentication!');
    console.log('');
    console.log('Steps to get UIDs:');
    console.log('1. Go to Firebase Console → Authentication');
    console.log('2. Find testuser1@example.com and copy the UID');
    console.log('3. Find testuser2@example.com and copy the UID');
    console.log('4. Replace the values in this script');
    console.log('5. Run this script again');
    return;
  }

  try {
    // Create test chat 1: One-on-one chat
    const chat1Data = {
      type: 'one-on-one',
      participants: [user1Id, user2Id],
      participantDetails: {
        [user1Id]: {
          displayName: 'Test User 1',
          photoURL: null,
        },
        [user2Id]: {
          displayName: 'Test User 2',
          photoURL: null,
        },
      },
      unreadCount: {
        [user1Id]: 0,
        [user2Id]: 0,
      },
      createdBy: user1Id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const chatsRef = collection(firestore, 'chats');
    const chat1Ref = await addDoc(chatsRef, chat1Data);

    console.log('✅ Created test chat 1 (one-on-one)');
    console.log('   Chat ID:', chat1Ref.id);
    console.log('   Participants:', user1Id, 'and', user2Id);

    // Create test chat 2: Another one-on-one for testing
    const chat2Data = {
      type: 'one-on-one',
      participants: [user1Id, user2Id],
      participantDetails: {
        [user1Id]: {
          displayName: 'Test User 1',
          photoURL: null,
        },
        [user2Id]: {
          displayName: 'Test User 2',
          photoURL: null,
        },
      },
      unreadCount: {
        [user1Id]: 0,
        [user2Id]: 0,
      },
      createdBy: user2Id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const chat2Ref = await addDoc(chatsRef, chat2Data);

    console.log('✅ Created test chat 2 (one-on-one)');
    console.log('   Chat ID:', chat2Ref.id);

    console.log('');
    console.log('🎉 Test chats created successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Open the app and log in as testuser1@example.com');
    console.log('2. Go to Chats tab - you should see "Test User 2"');
    console.log('3. Tap the chat to open the messaging screen');
    console.log('4. Follow the validation guide to test messaging');
    console.log('');
    console.log('💡 Save these Chat IDs for manual testing:');
    console.log('   Chat 1:', chat1Ref.id);
    console.log('   Chat 2:', chat2Ref.id);
    console.log('');

    return {
      chat1: chat1Ref.id,
      chat2: chat2Ref.id,
    };
  } catch (error) {
    console.error('❌ Error creating test chats:', error);
    throw error;
  }
}

/**
 * Delete test chats (cleanup after validation)
 */
export async function deleteTestChats(chatIds: string[]) {
  console.log('🗑️ Cleaning up test chats...');

  const { doc, deleteDoc, collection, getDocs } = await import('firebase/firestore');

  for (const chatId of chatIds) {
    try {
      // Delete all messages in the chat
      const messagesRef = collection(firestore, 'chats', chatId, 'messages');
      const messagesSnap = await getDocs(messagesRef);

      for (const messageDoc of messagesSnap.docs) {
        await deleteDoc(messageDoc.ref);
      }

      // Delete the chat document
      await deleteDoc(doc(firestore, 'chats', chatId));

      console.log('✅ Deleted chat:', chatId);
    } catch (error) {
      console.error('❌ Error deleting chat:', chatId, error);
    }
  }

  console.log('✅ Cleanup complete!');
}
