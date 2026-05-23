import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { getDB } from '@/src/db';
import { getUniqueExerciseNames } from '@/src/storage';

export default function ProgressScreen() {
  const [exercises, setExercises] = useState<string[]>([]);

  useEffect(() => {
    getDB()
      .then(db => getUniqueExerciseNames(db))
      .then(setExercises);
  }, []);

  return (
    <View style={styles.container}>
      {exercises.length === 0 ? (
        <Text style={styles.empty}>No workouts logged yet</Text>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/(tabs)/progress/${encodeURIComponent(item)}`)}
            >
              <Text style={styles.exerciseName}>{item}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  exerciseName: { fontSize: 16 },
  chevron: { color: '#ccc', fontSize: 20 },
});
