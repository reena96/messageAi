import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
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
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      activeOpacity={0.6}
    >
      <Ionicons name="chevron-back" size={28} color="#007AFF" />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 17,
    color: '#007AFF',
  },
});
