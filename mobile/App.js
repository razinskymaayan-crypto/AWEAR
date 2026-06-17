import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Skeleton-only screen. Its only job is to confirm the Expo / React Native
// toolchain boots end to end inside the AWEAR repo. No real feature work
// belongs here yet — see mobile/README.md for the next real task.
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AWEAR</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});
