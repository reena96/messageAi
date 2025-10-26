import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WHATSAPP_PALETTE } from '@/styles/theme';

interface Participant {
  uid: string;
  displayName: string;
  photoURL?: string | null;
}

interface ChatSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  chatId: string;
  chatType: 'one-on-one' | 'group';
  participants: Participant[];
  currentUserId: string;
  createdBy: string;
  onAddParticipant: (email: string) => Promise<void>;
  onRemoveParticipant: (uid: string) => Promise<void>;
}

export function ChatSettingsModal({
  visible,
  onClose,
  chatId,
  chatType,
  participants,
  currentUserId,
  createdBy,
  onAddParticipant,
  onRemoveParticipant,
}: ChatSettingsModalProps) {
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddParticipant = async () => {
    if (!newParticipantEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setIsAdding(true);
    try {
      await onAddParticipant(newParticipantEmail.trim());
      setNewParticipantEmail('');
      Alert.alert('Success', 'Participant added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add participant');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveParticipant = (uid: string, displayName: string) => {
    if (uid === currentUserId) {
      Alert.alert(
        'Leave Chat',
        'Are you sure you want to leave this chat?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: async () => {
              try {
                await onRemoveParticipant(uid);
                onClose();
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to leave chat');
              }
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Remove Participant',
      `Remove ${displayName} from this chat?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await onRemoveParticipant(uid);
              Alert.alert('Success', `${displayName} removed from chat`);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove participant');
            }
          },
        },
      ]
    );
  };

  const canRemoveParticipant = (uid: string) => {
    // Can remove yourself (leave chat) or others if you're the creator
    return uid === currentUserId || currentUserId === createdBy;
  };

  const renderParticipant = ({ item }: { item: Participant }) => {
    const isCurrentUser = item.uid === currentUserId;
    const isCreator = item.uid === createdBy;

    return (
      <View style={styles.participantItem}>
        <View style={styles.participantInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={WHATSAPP_PALETTE.primary} />
          </View>
          <View style={styles.participantDetails}>
            <Text style={styles.participantName}>
              {item.displayName}
              {isCurrentUser && ' (You)'}
            </Text>
            {isCreator && <Text style={styles.creatorBadge}>Creator</Text>}
          </View>
        </View>
        {canRemoveParticipant(item.uid) && (
          <TouchableOpacity
            onPress={() => handleRemoveParticipant(item.uid, item.displayName)}
            style={styles.removeButton}
          >
            <Ionicons
              name={isCurrentUser ? 'exit-outline' : 'close-circle'}
              size={24}
              color="#FF3B30"
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={WHATSAPP_PALETTE.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat Settings</Text>
          <View style={styles.closeButton} />
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Participants ({participants.length})
            </Text>
            <FlatList
              data={participants}
              renderItem={renderParticipant}
              keyExtractor={(item) => item.uid}
              style={styles.participantsList}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {chatType === 'group' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Participant</Text>
              <View style={styles.addParticipantContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  value={newParticipantEmail}
                  onChangeText={setNewParticipantEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isAdding}
                />
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    (!newParticipantEmail.trim() || isAdding) && styles.addButtonDisabled,
                  ]}
                  onPress={handleAddParticipant}
                  disabled={!newParticipantEmail.trim() || isAdding}
                >
                  {isAdding ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                User must have an account with this email
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chat Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>
                {chatType === 'group' ? 'Group Chat' : 'One-on-One'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Chat ID:</Text>
              <Text style={styles.infoValue}>{chatId}</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  participantsList: {
    maxHeight: 300,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  creatorBadge: {
    fontSize: 12,
    color: WHATSAPP_PALETTE.primary,
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
  },
  addParticipantContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  addButton: {
    backgroundColor: WHATSAPP_PALETTE.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  helperText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
});
