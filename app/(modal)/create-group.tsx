import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';
import { useChatStore } from '@/lib/store/chatStore';
import { useAuthStore } from '@/lib/store/authStore';
import { User } from '@/types/user';
import { debugLog, errorLog } from '@/lib/utils/debug';

export default function CreateGroupScreen() {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const currentUser = useAuthStore((state) => state.user);
  const createGroupChat = useChatStore((state) => state.createGroupChat);

  // Fetch all users except current user
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) {
        debugLog('❌ [CreateGroup] No current user');
        return;
      }

      try {
        debugLog('👥 [CreateGroup] Fetching users...');
        setLoading(true);

        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('id', '!=', currentUser.uid));
        const snapshot = await getDocs(q);

        const usersList: User[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email,
            displayName: data.displayName,
            photoURL: data.photoURL,
            online: data.online || false,
            lastSeen: data.lastSeen?.toDate() || new Date(),
            fcmToken: data.fcmToken,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };
        });

        debugLog('👥 [CreateGroup] Fetched users:', usersList.length);
        setUsers(usersList);
      } catch (error: any) {
        errorLog('❌ [CreateGroup] Error fetching users:', error.message);
        Alert.alert('Error', 'Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleCreateGroup = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to create a group');
      return;
    }

    // Validation
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedUsers.size === 0) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }

    try {
      setCreating(true);
      debugLog('📝 [CreateGroup] Creating group:', {
        name: groupName,
        memberCount: selectedUsers.size,
      });

      // Build participant details (exclude undefined photoURL for Firestore)
      const participantDetails: {
        [userId: string]: { displayName: string; photoURL?: string };
      } = {};

      users.forEach((user) => {
        if (selectedUsers.has(user.id)) {
          const details: { displayName: string; photoURL?: string } = {
            displayName: user.displayName,
          };
          // Only include photoURL if it exists (Firestore doesn't allow undefined)
          if (user.photoURL) {
            details.photoURL = user.photoURL;
          }
          participantDetails[user.id] = details;
        }
      });

      // Build current user details (exclude undefined photoURL)
      const currentUserDetails: { displayName: string; photoURL?: string } = {
        displayName: currentUser.displayName || currentUser.email || 'Unknown',
      };
      if (currentUser.photoURL) {
        currentUserDetails.photoURL = currentUser.photoURL;
      }

      // Create group chat
      const chatId = await createGroupChat(
        currentUser.uid,
        Array.from(selectedUsers),
        groupName.trim(),
        currentUserDetails,
        participantDetails
      );

      debugLog('✅ [CreateGroup] Group created:', chatId);

      // Navigate to the new chat
      router.replace(`/chat/${chatId}`);
    } catch (error: any) {
      errorLog('❌ [CreateGroup] Error creating group:', error.message);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const isValid = groupName.trim().length > 0 && selectedUsers.size > 0;

  const renderUserItem = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.has(item.id);
    const avatarLetter = item.displayName.charAt(0).toUpperCase();

    // Generate consistent avatar color
    const getAvatarColor = (name: string) => {
      const colors = [
        '#00BFA5', '#1DE9B6', '#00BCD4', '#00ACC1',
        '#26C6DA', '#4DD0E1', '#80DEEA', '#B2EBF2',
      ];
      const index =
        name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
        colors.length;
      return colors[index];
    };

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => toggleUserSelection(item.id)}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: getAvatarColor(item.displayName) },
          ]}
        >
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>

        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
          ]}
        >
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={creating}
          >
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>New Group</Text>

          <TouchableOpacity
            onPress={handleCreateGroup}
            disabled={!isValid || creating}
          >
            <Text
              style={[
                styles.createButton,
                (!isValid || creating) && styles.createButtonDisabled,
              ]}
            >
              {creating ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Group Name Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.input}
            placeholder="Group name"
            value={groupName}
            onChangeText={setGroupName}
            maxLength={50}
            editable={!creating}
          />
        </View>

        {/* Member Count */}
        <View style={styles.memberCount}>
          <Text style={styles.memberCountText}>
            {selectedUsers.size} {selectedUsers.size === 1 ? 'member' : 'members'} selected
          </Text>
        </View>

        {/* User List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0C8466" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users available</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  createButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C8466',
  },
  createButtonDisabled: {
    color: '#CCC',
  },
  inputSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  input: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  memberCount: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
  },
  memberCountText: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#0C8466',
    borderColor: '#0C8466',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
