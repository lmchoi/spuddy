import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function ProgressScreen() {
  const exercises: string[] = [];

  return (
    <View style={styles.container}>
      {exercises.length === 0 ? (
        <Text style={styles.empty}>No workouts logged yet</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
  },
});
