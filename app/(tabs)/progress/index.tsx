import { useCallback, useState } from 'react';
import { FlatList, View, Text, StyleSheet, StatusBar } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDB } from '@/src/db';
import { getAllSessions } from '@/src/storage';
import type { Session } from '@/src/types';
import { C } from '@/components/spuddy/palette';
import { ActivityStrip } from '@/components/spuddy/ActivityStrip';
import { HeroStat } from '@/components/spuddy/HeroStat';
import { SessionRow } from '@/components/spuddy/SessionRow';
import { getCurrentStreak, getLongestStreak } from '@/src/domain/streak';
import { computeStats } from '@/src/domain/stats';

const WINDOW_DAYS = 30;

function localDateStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function today(): string {
  return localDateStr();
}

function withinWindow(sessions: Session[]): Session[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - WINDOW_DAYS);
  const cutoffStr = localDateStr(cutoff);
  return sessions.filter(s => s.date >= cutoffStr);
}

function heroStats(sessions: Session[]) {
  const recent = withinWindow(sessions);
  const dates = sessions.map(s => s.date);
  const streak = getCurrentStreak(dates, today());
  const longest = getLongestStreak(dates);
  const sessionCount = recent.length;

  const totalSets = recent.reduce((sum, s) => sum + computeStats(s).working, 0);
  const onTargetSets = recent.reduce((sum, s) => {
    const { hits, exceeded } = computeStats(s);
    return sum + hits + exceeded;
  }, 0);
  const onTargetPct = totalSets > 0 ? Math.round((onTargetSets / totalSets) * 100) : 0;

  return { streak, longest, sessionCount, onTargetPct };
}

// ─── Hero card ────────────────────────────────────────────────────────────────

function HeroCard({ sessions }: { sessions: Session[] }) {
  const { streak, longest, sessionCount, onTargetPct } = heroStats(sessions);
  const hasData = sessions.length > 0;

  return (
    <View style={styles.hero}>
      <View style={styles.heroTop}>
        <View style={styles.heroStreak}>
          <Text style={styles.heroStreakNumber}>{streak}</Text>
          <Text style={styles.heroStreakUnit}>day{streak !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.heroStreakMeta}>
          <Text style={styles.heroStreakLabel}>current streak</Text>
          {longest > 0 && (
            <Text style={styles.heroStreakSub}>longest {longest}</Text>
          )}
        </View>
      </View>
      <View style={styles.heroStats}>
        <HeroStat value={hasData ? sessionCount : '—'} label="sessions" />
        <HeroStat value={hasData ? `${onTargetPct}%` : '—'} label="on target" />
        <HeroStat value="—" label="last PR" />
      </View>
    </View>
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
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.screenTitle}>Progress</Text>
            <HeroCard sessions={sessions} />
            <ActivityStrip sessions={sessions} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No workouts logged yet</Text>
            <Text style={styles.emptyHint}>Add a session from the + tab to get started</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        renderItem={({ item }) => <SessionRow session={item} dense />}
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
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    gap: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.5,
  },
  // Hero
  hero: {
    backgroundColor: C.card2,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 14,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroStreak: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  heroStreakNumber: {
    fontSize: 40,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -1,
    lineHeight: 44,
  },
  heroStreakUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text2,
    letterSpacing: -0.3,
  },
  heroStreakMeta: {
    gap: 2,
  },
  heroStreakLabel: {
    fontSize: 13,
    color: C.sub,
  },
  heroStreakSub: {
    fontSize: 12,
    color: C.muted,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 8,
  },
  // List
  gap: {
    height: 8,
  },
  empty: {
    paddingTop: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: C.sub,
  },
  emptyHint: {
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
  },
});
