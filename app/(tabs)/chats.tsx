import { View, Text, StyleSheet } from 'react-native';

export default function ChatsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Chats Screen - Coming in PR #2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});
