import { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { getDB } from '@/src/db';
import { getSessionsForExercise } from '@/src/storage';
import type { ExerciseEntry, Session, Target, WorkingSet } from '@/src/types';

type OnTargetStatus = 'hit' | 'below' | 'exceeded' | 'no-target';

function setStatus(set: WorkingSet, target: Target | undefined): OnTargetStatus {
  if (!target) return 'no-target';
  const minReps = target.minReps ?? target.reps;
  const repsOk = set.reps >= minReps;
  const weightOk = target.weight === undefined || set.weight >= target.weight;
  if (!repsOk || !weightOk) return 'below';
  if (set.reps > target.reps || (target.weight !== undefined && set.weight > target.weight))
    return 'exceeded';
  return 'hit';
}

function entryStatus(entry: ExerciseEntry): OnTargetStatus {
  const working = entry.sets.filter(s => !s.isWarmup);
  if (working.length === 0 || entry.targets.length === 0) return 'no-target';
  const statuses = working.map((s, i) => setStatus(s, entry.targets[i]));
  if (statuses.some(s => s === 'below')) return 'below';
  if (statuses.every(s => s === 'exceeded')) return 'exceeded';
  return 'hit';
}

const STATUS_LABEL: Record<OnTargetStatus, string> = {
  hit: '✓',
  below: '↓',
  exceeded: '↑',
  'no-target': '–',
};

const STATUS_COLOR: Record<OnTargetStatus, string> = {
  hit: '#34C759',
  below: '#FF3B30',
  exceeded: '#007AFF',
  'no-target': '#888',
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
            const status = entryStatus(entry);
            return (
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.date}>{session.date}</Text>
                  <Text style={styles.sets}>{formatSets(entry.sets)}</Text>
                </View>
                <Text style={[styles.indicator, { color: STATUS_COLOR[status] }]}>
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
