import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/store/authStore';

// Test user credentials (pre-configured in Firebase)
const TEST_USERS = [
  { name: 'Alice', email: 'alice@test.com', password: 'test123', color: '#007AFF' },
  { name: 'Bob', email: 'bob@test.com', password: 'test123', color: '#34C759' },
  { name: 'Charlie', email: 'charlie@test.com', password: 'test123', color: '#FF9500' },
  { name: 'Daniel', email: 'daniel@test.com', password: 'test123', color: '#FF3B30' },
];

export default function DevTestLogin() {
  const { signIn } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState<string | null>(null);

  // Only show in development
  if (!__DEV__) {
    return null;
  }

  const handleQuickLogin = async (testUser: typeof TEST_USERS[0]) => {
    setLoading(true);
    setLoadingUser(testUser.email);

    try {
      await signIn(testUser.email, testUser.password);
      // Navigate to chats after successful login
      router.replace('/(tabs)/chats');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Unable to log in with test account');
    } finally {
      setLoading(false);
      setLoadingUser(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Dev Test Login</Text>
      <Text style={styles.subtitle}>Quick login with pre-configured accounts:</Text>

      <View style={styles.buttonGrid}>
        {TEST_USERS.map((testUser) => (
          <TouchableOpacity
            key={testUser.email}
            style={[
              styles.userButton,
              { backgroundColor: testUser.color },
              loading && styles.userButtonDisabled,
            ]}
            onPress={() => handleQuickLogin(testUser)}
            disabled={loading}
          >
            {loading && loadingUser === testUser.email ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.userName}>{testUser.name}</Text>
                <Text style={styles.userEmail}>{testUser.email}</Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffc107',
    borderStyle: 'dashed',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#856404',
    marginBottom: 12,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  userButton: {
    flex: 1,
    minWidth: '47%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  userButtonDisabled: {
    opacity: 0.6,
  },
  userName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.9,
  },
});
