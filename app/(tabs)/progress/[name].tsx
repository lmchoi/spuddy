import { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { getDB } from '@/src/db';
import { getSessionsForExercise } from '@/src/storage';
import { getEntryStatus, STATUS_LABEL, type OnTargetStatus } from '@/src/domain/status';
import type { Session, WorkingSet } from '@/src/types';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const STATUS_COLOR_KEY: Record<OnTargetStatus, keyof typeof Colors.light> = {
  hit: 'statusHit',
  below: 'statusBelow',
  exceeded: 'statusExceeded',
  'no-target': 'statusNone',
};

function formatSets(sets: WorkingSet[]): string {
  const working = sets.filter(s => !s.isWarmup);
  if (working.length === 0) return '—';
  const weight = working[0].weight;
  const weightStr = weight === 0 ? 'bodyweight' : `${weight}kg`;
  return `${working.length} × ${working[0].reps} @ ${weightStr}`;
}

export default function ExerciseDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const colorScheme = useColorScheme() ?? 'light';

  useEffect(() => {
    if (!name) return;
    getDB()
      .then(db => getSessionsForExercise(db, decodeURIComponent(name)))
      .then(setSessions);
  }, [name]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{decodeURIComponent(name ?? '')}</Text>
      {sessions.length === 0 ? (
        <Text style={styles.empty}>No sessions yet</Text>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={s => s.date}
          renderItem={({ item: session }) => {
            const entry = session.exercises[0];
            const status = getEntryStatus(entry);
            const color = Colors[colorScheme][STATUS_COLOR_KEY[status]];
            return (
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.date}>{session.date}</Text>
                  <Text style={styles.sets}>{formatSets(entry.sets)}</Text>
                </View>
                <Text style={[styles.indicator, { color }]}>
                  {STATUS_LABEL[status]}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  rowLeft: { gap: 2 },
  date: { fontSize: 14, color: '#888' },
  sets: { fontSize: 16 },
  indicator: { fontSize: 20, fontWeight: '600' },
});
