import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  StatusBar,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDB } from '@/src/db';
import { getAllSessions } from '@/src/storage';
import type { Session } from '@/src/types';

// ─── Palette ─────────────────────────────────────────────────────────────────

const C = {
  bg:      '#08080E',
  surface: '#111118',
  border:  '#1C1C2A',
  accent:  '#39FF82',
  text:    '#ECEEFF',
  sub:     '#5C5C88',
  muted:   '#2A2A3C',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function relativeDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  const diff = Math.floor(
    (Date.now() - new Date(y, m - 1, d).getTime()) / 86400000
  );
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff < 7) return `${diff} days ago`;
  return '';
}

// ─── Activity Strip ───────────────────────────────────────────────────────────

function ActivityStrip({ sessions }: { sessions: Session[] }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getTime() - (6 - i) * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    return {
      label: d.toLocaleDateString('en-GB', { weekday: 'narrow' }),
      active: sessions.some(s => s.date === dateStr),
      isToday: i === 6,
    };
  });

  return (
    <View style={styles.strip}>
      {days.map((day, i) => (
        <View key={i} style={styles.stripCol}>
          <View
            style={[
              styles.stripDot,
              day.active && styles.stripDotActive,
              day.isToday && day.active && styles.stripDotToday,
            ]}
          />
          <Text style={styles.stripLabel}>{day.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Session Row ──────────────────────────────────────────────────────────────

function SessionRow({ session }: { session: Session }) {
  const rel = relativeDate(session.date);
  const count = session.exercises.length;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => router.push(`/(tabs)/progress/${session.date}`)}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowDate}>{formatDate(session.date)}</Text>
        <Text style={styles.rowMeta}>
          {count} exercise{count !== 1 ? 's' : ''}
          {rel ? `  ·  ${rel}` : ''}
        </Text>
      </View>
      <Text style={styles.rowChevron}>›</Text>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<Session[]>([]);

  useFocusEffect(
    useCallback(() => {
      getDB()
        .then(db => getAllSessions(db))
        .then(setSessions);
    }, [])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={sessions}
        keyExtractor={s => s.date}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <ActivityStrip sessions={sessions} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No workouts logged yet</Text>
            <Text style={styles.emptyHint}>
              Paste a session from the + tab to get started
            </Text>
          </View>
        }
        renderItem={({ item }) => <SessionRow session={item} />}
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
  list: {
    paddingBottom: 40,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  strip: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stripCol: {
    flex: 1,
    alignItems: 'center',
  },
  stripDot: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: C.muted,
    marginBottom: 6,
  },
  stripDotActive: {
    backgroundColor: C.accent,
    opacity: 0.6,
  },
  stripDotToday: {
    opacity: 1,
  },
  stripLabel: {
    fontSize: 10,
    color: C.muted,
    letterSpacing: 0.3,
  },
  separator: {
    height: 1,
    backgroundColor: C.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  rowPressed: {
    backgroundColor: C.surface,
  },
  rowLeft: {
    flex: 1,
  },
  rowDate: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
  },
  rowMeta: {
    fontSize: 13,
    color: C.sub,
    marginTop: 3,
  },
  rowChevron: {
    fontSize: 20,
    color: C.muted,
    marginLeft: 8,
  },
  empty: {
    paddingTop: 80,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: C.sub,
    fontWeight: '500',
  },
  emptyHint: {
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
    marginTop: 8,
  },
});
