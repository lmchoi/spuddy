import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
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
import { computeStats, coachLine } from '@/src/domain/stats';
import type { SessionStats } from '@/src/domain/stats';
import type { Session, ExerciseEntry, Target } from '@/src/types';
import { C } from '@/components/spuddy/palette';

const STATUS_COLOR: Record<string, string> = {
  hit:         C.hit,
  below:       C.below,
  exceeded:    C.exceeded,
  'no-target': C.noTarget,
};
const STATUS_BG: Record<string, string> = {
  hit:         C.hitBg,
  below:       C.belowBg,
  exceeded:    C.exceededBg,
  'no-target': C.faint,
};
const STATUS_GLYPH: Record<string, string> = {
  hit: '●', below: '↓', exceeded: '↑', 'no-target': '○',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function formatWeight(kg: number): string {
  return kg === 0 ? 'BW' : `${kg} kg`;
}

function formatTarget(t: Target): string {
  const reps = t.minReps != null ? `${t.minReps}–${t.reps}` : `${t.reps}`;
  return t.weight != null ? `${reps} @ ${formatWeight(t.weight)}` : reps;
}

// ─── Bento tile ───────────────────────────────────────────────────────────────

function BentoTile({
  children,
  flex,
  accentColor,
  style,
}: {
  children: React.ReactNode;
  flex: number;
  accentColor?: string;
  style?: object;
}) {
  return (
    <View style={[styles.bento, { flex }, style]}>
      {accentColor && <View style={[styles.bentoAccent, { backgroundColor: accentColor }]} />}
      {children}
    </View>
  );
}

// ─── Distribution bar ─────────────────────────────────────────────────────────

function DistBar({ stats }: { stats: SessionStats }) {
  const total = stats.working;
  if (total === 0) return null;
  return (
    <BentoTile flex={1}>
      <Text style={styles.bentoLabel}>Set distribution</Text>
      <View style={styles.distBar}>
        {stats.below > 0 && (
          <View style={{ flex: stats.below, backgroundColor: C.below }} />
        )}
        {stats.hits > 0 && (
          <View style={{ flex: stats.hits, backgroundColor: C.hit }} />
        )}
        {stats.exceeded > 0 && (
          <View style={{ flex: stats.exceeded, backgroundColor: C.exceeded }} />
        )}
      </View>
      <View style={styles.distLegend}>
        <Text style={[styles.distLegendItem, { color: C.below }]}>↓ {stats.below} short</Text>
        <Text style={[styles.distLegendItem, { color: C.hit }]}>● {stats.hits} hit</Text>
        <Text style={[styles.distLegendItem, { color: C.exceeded }]}>↑ {stats.exceeded} over</Text>
      </View>
    </BentoTile>
  );
}

// ─── Exercise row ─────────────────────────────────────────────────────────────

function ExerciseRow({ entry }: { entry: ExerciseEntry }) {
  const [open, setOpen] = useState(false);
  const working = entry.sets.filter(s => !s.isWarmup);
  const status = getEntryStatus(entry);
  const statusColor = STATUS_COLOR[status];
  const statusBg = STATUS_BG[status];
  const glyph = STATUS_GLYPH[status];

  const topReps = working.length ? Math.max(...working.map(s => s.reps ?? 0)) : 0;
  const topWeight = working.length ? Math.max(...working.map(s => s.weight)) : 0;

  return (
    <View style={styles.exRow}>
      <Pressable
        onPress={() => setOpen(o => !o)}
        style={styles.exHeader}
        hitSlop={4}
      >
        <View style={[styles.exStatusTile, { backgroundColor: statusBg }]}>
          <Text style={[styles.exStatusGlyph, { color: statusColor }]}>{glyph}</Text>
        </View>
        <View style={styles.exHeaderText}>
          <Text style={styles.exName}>{entry.name}</Text>
          <Text style={styles.exMeta}>
            {working.length} set{working.length !== 1 ? 's' : ''} · top {topReps}×{formatWeight(topWeight)}
          </Text>
        </View>
        <Text style={[styles.exChevron, open && styles.exChevronOpen]}>⌄</Text>
      </Pressable>

      {open && (
        <View style={styles.exBody}>
          <View style={styles.setGrid}>
            <View style={styles.setGridRow}>
              <Text style={[styles.setGridHdr, { width: 20 }]}>#</Text>
              <Text style={[styles.setGridHdr, { flex: 2 }]}>actual</Text>
              <Text style={[styles.setGridHdr, { flex: 2 }]}>target</Text>
              <Text style={[styles.setGridHdr, { width: 20 }]}> </Text>
            </View>
            {working.map((s, i) => {
              const st = getSetStatus(s, entry.targets[i]);
              return (
                <View key={i} style={styles.setGridRow}>
                  <Text style={styles.setNum}>{i + 1}</Text>
                  <Text style={styles.setActual}>
                    {s.reps ?? '–'} × {formatWeight(s.weight)}
                  </Text>
                  <Text style={styles.setTargetCell}>
                    {entry.targets[i] ? formatTarget(entry.targets[i]) : '—'}
                  </Text>
                  <Text style={[styles.setStatus, { color: STATUS_COLOR[st] }]}>
                    {STATUS_GLYPH[st]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
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
  const stats = session ? computeStats(session) : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerDate}>{date ? formatDate(date) : ''}</Text>
          <Text style={styles.headerSub}>
            {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
            {stats && stats.working > 0 ? ` · ${stats.working} working sets` : ''}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {exercises.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No data for this session</Text>
          </View>
        ) : (
          <>
            {/* Bento stat grid */}
            {stats && (
              <View style={styles.bentoSection}>
                {/* Row 1: On target + Volume */}
                <View style={styles.bentoRow}>
                  <BentoTile flex={1} accentColor={C.hit}>
                    <Text style={styles.bentoLabel}>On target</Text>
                    <View style={styles.bigNumRow}>
                      <Text style={styles.bigNum}>{stats.onTarget}</Text>
                      <Text style={styles.bigNumUnit}>%</Text>
                    </View>
                    <Text style={styles.bentoSub}>
                      {stats.hits + stats.exceeded}/{stats.working} sets
                    </Text>
                  </BentoTile>
                  <BentoTile flex={1} accentColor={C.text2}>
                    <Text style={styles.bentoLabel}>Volume</Text>
                    <Text style={styles.volumeNum}>{stats.volumeKg.toLocaleString()} kg</Text>
                    <Text style={styles.bentoSub}>excl. bodyweight</Text>
                  </BentoTile>
                </View>

                {/* Row 2: Distribution bar */}
                <View style={styles.bentoRow}>
                  <DistBar stats={stats} />
                </View>
              </View>
            )}

            {/* Coach line */}
            {stats && (
              <View style={styles.coachCard}>
                <Text style={styles.coachEmoji}>🥔</Text>
                <Text style={styles.coachText}>{coachLine(stats)}</Text>
              </View>
            )}

            {/* Exercises section heading */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Exercises</Text>
            </View>

            {/* Collapsible exercise rows */}
            <View style={styles.exList}>
              {exercises.map((ex, i) => (
                <ExerciseRow key={`${ex.name}-${i}`} entry={ex} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
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
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: C.text2,
  },
  headerText: {
    flex: 1,
  },
  headerDate: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 12,
    color: C.sub,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },

  // ─── Bento
  bentoSection: {
    paddingHorizontal: 18,
    gap: 8,
    marginBottom: 14,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bento: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    position: 'relative',
  },
  bentoAccent: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bentoLabel: {
    fontSize: 10,
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  bentoSub: {
    fontSize: 11,
    color: C.sub,
    marginTop: 6,
  },
  bigNumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  bigNum: {
    fontSize: 28,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.5,
  },
  bigNumUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: C.sub,
    marginBottom: 3,
  },
  volumeNum: {
    fontSize: 22,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.4,
    marginTop: 2,
  },

  // ─── Distribution bar
  distBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: C.faint,
    marginTop: 8,
  },
  distLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  distLegendItem: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },

  // ─── Coach card
  coachCard: {
    marginHorizontal: 18,
    marginBottom: 16,
    padding: 14,
    backgroundColor: C.cardSoft,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  coachEmoji: {
    fontSize: 28,
  },
  coachText: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    lineHeight: 18,
  },

  // ─── Section heading
  sectionHeader: {
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },

  // ─── Exercise list
  exList: {
    paddingHorizontal: 18,
    gap: 8,
  },
  exRow: {
    backgroundColor: C.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  exStatusTile: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exStatusGlyph: {
    fontSize: 14,
  },
  exHeaderText: {
    flex: 1,
  },
  exName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  exMeta: {
    fontSize: 11,
    color: C.sub,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  exChevron: {
    fontSize: 14,
    color: C.muted,
  },
  exChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  exBody: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },

  // ─── Set grid (4 columns: #, actual, target, status)
  setGrid: {
    backgroundColor: C.bg2,
    borderRadius: 10,
    padding: 10,
  },
  setGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setGridHdr: {
    fontSize: 9,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingBottom: 4,
  },
  setNum: {
    width: 20,
    fontSize: 11,
    color: C.muted,
    fontVariant: ['tabular-nums'],
    paddingVertical: 3,
  },
  setActual: {
    flex: 2,
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
    fontVariant: ['tabular-nums'],
    paddingVertical: 3,
  },
  setTargetCell: {
    flex: 2,
    fontSize: 11,
    color: C.sub,
    fontVariant: ['tabular-nums'],
    paddingVertical: 3,
  },
  setStatus: {
    width: 20,
    fontSize: 12,
    textAlign: 'right',
    paddingVertical: 3,
  },

  // ─── Empty state
  empty: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: C.sub,
  },
});
