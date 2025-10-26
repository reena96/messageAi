import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface BackButtonProps {
  label?: string; // Optional custom label (defaults to "Back")
  onPress?: () => void; // Optional custom handler (defaults to router.back())
}

/**
 * BackButton Component
 * Reusable back button for navigation headers
 * Ensures consistent styling across all screens
 */
export default function BackButton({ label = 'Back', onPress }: BackButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.6}>
      <View style={styles.container}>
        <View style={styles.buttonPill}>
          <Ionicons name="chevron-back" size={20} color="#0C8466" />
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#0000000D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  label: {
    fontSize: 16,
    color: '#0C8466',
    marginLeft: 6,
    fontWeight: '600',
  },
});
