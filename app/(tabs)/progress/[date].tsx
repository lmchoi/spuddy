import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDB } from '@/src/db';
import { getSessionByDate } from '@/src/storage';
import { getSetStatus, getEntryStatus } from '@/src/domain/status';
import type { Session, ExerciseEntry, WorkingSet, Target } from '@/src/types';

// ─── Palette ─────────────────────────────────────────────────────────────────

const C = {
  bg:       '#08080E',
  surface:  '#111118',
  card:     '#16161F',
  border:   '#1C1C2A',
  accent:   '#39FF82',
  below:    '#FF5C38',
  exceeded: '#38C8FF',
  text:     '#ECEEFF',
  sub:      '#5C5C88',
  muted:    '#2A2A3C',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatWeight(kg: number): string {
  return kg === 0 ? 'BW' : `${kg} kg`;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<string, { color: string; symbol: string }> = {
  hit:         { color: C.accent,   symbol: '●' },
  below:       { color: C.below,    symbol: '↓' },
  exceeded:    { color: C.exceeded, symbol: '↑' },
  'no-target': { color: C.muted,    symbol: '○' },
};

// ─── Set Row ──────────────────────────────────────────────────────────────────

function SetRow({
  set,
  target,
  index,
}: {
  set: WorkingSet;
  target: Target | undefined;
  index: number;
}) {
  const status = getSetStatus(set, target);
  const { color, symbol } = STATUS[status];

  return (
    <View style={styles.setRow}>
      <Text style={styles.setIndex}>{index + 1}</Text>
      <View style={styles.setMain}>
        <Text style={styles.setReps}>
          {set.repsLeft != null ? `${set.reps}|${set.repsLeft}` : String(set.reps)}
        </Text>
        <Text style={styles.setSep}>×</Text>
        <Text style={styles.setWeight}>{formatWeight(set.weight)}</Text>
      </View>
      {target != null && (
        <Text style={styles.setTarget}>
          {target.minReps != null ? `${target.minReps}–` : ''}{target.reps}
          {target.weight != null ? ` @ ${formatWeight(target.weight)}` : ''}
        </Text>
      )}
      <Text style={[styles.setSymbol, { color }]}>{symbol}</Text>
    </View>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

function ExerciseCard({ entry }: { entry: ExerciseEntry }) {
  const working = entry.sets.filter(s => !s.isWarmup);
  const warmups = entry.sets.filter(s => s.isWarmup);
  const overall = getEntryStatus(entry);
  const barColor = STATUS[overall].color;

  return (
    <View style={styles.card}>
      <View style={[styles.cardBar, { backgroundColor: barColor }]} />
      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{entry.name}</Text>
        {warmups.length > 0 && (
          <Text style={styles.cardWarmup}>
            {warmups.length} warmup set{warmups.length > 1 ? 's' : ''}
          </Text>
        )}
        <View style={styles.setsBlock}>
          {working.map((set, i) => (
            <SetRow key={i} set={set} target={entry.targets[i]} index={i} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SessionDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!date) return;
    getDB()
      .then(db => getSessionByDate(db, date))
      .then(setSession);
  }, [date]);

  const exercises = session?.exercises ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerDate}>{date ? formatDate(date) : ''}</Text>
          <Text style={styles.headerSub}>
            {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <FlatList
        style={styles.list}
        data={exercises}
        keyExtractor={(e, i) => `${e.name}-${i}`}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No data for this session</Text>
          </View>
        }
        renderItem={({ item }) => <ExerciseCard entry={item} />}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    paddingVertical: 2,
    marginRight: 14,
  },
  backArrow: {
    fontSize: 22,
    color: C.sub,
    lineHeight: 26,
  },
  headerText: {
    flex: 1,
  },
  headerDate: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
  },
  headerSub: {
    fontSize: 12,
    color: C.sub,
    marginTop: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 48,
  },
  separator: {
    height: 1,
    backgroundColor: C.border,
    marginLeft: 20,
  },
  card: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingLeft: 20,
    paddingRight: 20,
  },
  cardBar: {
    width: 2,
    borderRadius: 1,
    marginRight: 14,
    minHeight: 44,
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
    marginBottom: 4,
  },
  cardWarmup: {
    fontSize: 11,
    color: C.muted,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  setsBlock: {
    marginTop: 2,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  setIndex: {
    width: 14,
    fontSize: 11,
    color: C.muted,
    textAlign: 'right',
    marginRight: 8,
    fontVariant: ['tabular-nums'],
  },
  setMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 100,
    marginRight: 8,
  },
  setReps: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    fontVariant: ['tabular-nums'],
  },
  setSep: {
    fontSize: 12,
    color: C.muted,
    marginHorizontal: 2,
  },
  setWeight: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    fontVariant: ['tabular-nums'],
  },
  setTarget: {
    flex: 1,
    fontSize: 11,
    color: C.muted,
    fontVariant: ['tabular-nums'],
  },
  setSymbol: {
    width: 14,
    fontSize: 13,
    textAlign: 'center',
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: C.sub,
  },
});
