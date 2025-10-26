import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WHATSAPP_PALETTE } from '@/styles/theme';

interface EditMessageModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (newText: string) => void;
  initialText: string;
}

export function EditMessageModal({
  visible,
  onClose,
  onSave,
  initialText,
}: EditMessageModalProps) {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (visible) {
      setText(initialText);
    }
  }, [visible, initialText]);

  const handleSave = () => {
    const trimmedText = text.trim();
    if (trimmedText && trimmedText !== initialText) {
      onSave(trimmedText);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Message</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerButton}
            disabled={!text.trim() || text.trim() === initialText}
          >
            <Text
              style={[
                styles.saveText,
                (!text.trim() || text.trim() === initialText) && styles.saveTextDisabled,
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type your message..."
            multiline
            autoFocus
            maxLength={1000}
          />
          <Text style={styles.helperText}>
            {text.length}/1000 characters
          </Text>
        </View>
      </KeyboardAvoidingView>
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
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  cancelText: {
    fontSize: 16,
    color: WHATSAPP_PALETTE.primary,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: WHATSAPP_PALETTE.primary,
    textAlign: 'right',
  },
  saveTextDisabled: {
    opacity: 0.4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 120,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'right',
  },
});
