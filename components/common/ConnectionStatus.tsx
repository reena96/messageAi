import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { debugLog, debugWarn } from '@/lib/utils/debug';

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    debugLog('🌐 [ConnectionStatus] Setting up listener');

    // Listen to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      debugLog('🌐 [ConnectionStatus] Network changed:', connected, '- Time:', new Date().toLocaleTimeString());
      debugWarn(connected ? '✅ ONLINE' : '❌ OFFLINE');
      setIsConnected(connected);
    });

    // Get initial state
    NetInfo.fetch().then((state) => {
      const connected = state.isConnected ?? true;
      debugLog('🌐 [ConnectionStatus] Initial state:', connected);
      setIsConnected(connected);
    });

    return () => unsubscribe();
  }, []);

  if (isConnected) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
