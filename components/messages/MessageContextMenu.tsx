import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WHATSAPP_PALETTE } from '@/styles/theme';

interface MessageContextMenuProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  canEdit: boolean;
  canDelete: boolean;
  isOwnMessage: boolean;
}

export function MessageContextMenu({
  visible,
  onClose,
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone,
  canEdit,
  canDelete,
  isOwnMessage,
}: MessageContextMenuProps) {
  if (!isOwnMessage) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.menu}>
              {canEdit && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onClose();
                    onEdit();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={20} color={WHATSAPP_PALETTE.primary} />
                  <Text style={styles.menuText}>Edit</Text>
                </TouchableOpacity>
              )}
              {canDelete && (
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      onClose();
                      onDeleteForMe();
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={20} color="#666" />
                    <Text style={styles.menuText}>Delete for Me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.menuItem, styles.lastMenuItem]}
                    onPress={() => {
                      onClose();
                      onDeleteForEveryone();
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                    <Text style={[styles.menuText, styles.deleteText]}>Delete for Everyone</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  deleteText: {
    color: '#FF3B30',
  },
});
