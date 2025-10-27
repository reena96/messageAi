import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';
import { Chat } from '@/types/chat';
import { debugLog } from '@/lib/utils/debug';
import { WHATSAPP_PALETTE, createThemedToggleStyles } from '@/styles/theme';

interface GroupChatHeaderProps {
  chat: Chat;
  onToggleSummary: () => void;
  summaryInjected: boolean;
  membersModalVisible: boolean;
  setMembersModalVisible: (visible: boolean) => void;
}

interface UserStatus {
  userId: string;
  displayName: string;
  photoURL?: string;
  online: boolean;
  lastSeen: Date;
}

export default function GroupChatHeader({
  chat,
  onToggleSummary,
  summaryInjected,
  membersModalVisible,
  setMembersModalVisible
}: GroupChatHeaderProps) {
  const [memberStatuses, setMemberStatuses] = useState<UserStatus[]>([]);

  // Subscribe to member online/offline status
  useEffect(() => {
    if (!membersModalVisible) return;

    debugLog('👥 [GroupHeader] Subscribing to member statuses');

    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('id', 'in', chat.participants));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const statuses: UserStatus[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          userId: doc.id,
          displayName: data.displayName || data.email || 'Unknown',
          photoURL: data.photoURL,
          online: data.online || false,
          lastSeen: data.lastSeen?.toDate() || new Date(),
        };
      });

      debugLog('👥 [GroupHeader] Member statuses updated:', {
        total: statuses.length,
        online: statuses.filter((s) => s.online).length,
      });

      setMemberStatuses(statuses);
    });

    return unsubscribe;
  }, [membersModalVisible, chat.participants]);

  const memberCount = chat.participants.length;

  const renderMemberItem = ({ item }: { item: UserStatus }) => {
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

    const formatLastSeen = (date: Date) => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (minutes < 1) return 'just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days === 1) return 'yesterday';
      return `${days}d ago`;
    };

    return (
      <View style={styles.memberItem}>
        <View
          style={[
            styles.memberAvatar,
            { backgroundColor: getAvatarColor(item.displayName) },
          ]}
        >
          <Text style={styles.memberAvatarText}>{avatarLetter}</Text>
        </View>

        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.displayName}</Text>
          <View style={styles.memberStatusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.online ? '#25D366' : '#999' },
              ]}
            />
            <Text style={styles.memberStatus}>
              {item.online ? 'Online' : `Offline • ${formatLastSeen(item.lastSeen)}`}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>

      {/* Members Modal */}
      <Modal
        visible={membersModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMembersModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Group Members</Text>
            <TouchableOpacity
              onPress={() => setMembersModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Group Info */}
          <View style={styles.groupInfo}>
            <View style={styles.groupAvatarLarge}>
              <Ionicons name="people" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.groupNameLarge}>
              {chat.groupName || 'Group Chat'}
            </Text>
            <Text style={styles.groupMemberCount}>
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>

          {/* Members List */}
          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>MEMBERS</Text>
            <FlatList
              data={memberStatuses}
              renderItem={renderMemberItem}
              keyExtractor={(item) => item.userId}
              contentContainerStyle={styles.membersList}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C8466',
  },

  // Group Info Section
  groupInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  groupAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0C8466',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupNameLarge: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  groupMemberCount: {
    fontSize: 14,
    color: '#666',
  },

  // Members Section
  membersSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
  },
  membersList: {
    paddingBottom: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  memberStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  memberStatus: {
    fontSize: 14,
    color: '#666',
  },
});
