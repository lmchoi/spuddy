import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDB } from '@/src/db';
import { parseLiftohistoryText } from '@/src/parser';
import { saveSession, sessionExists } from '@/src/storage';
import type { ExerciseEntry, Session } from '@/src/types';

// ─── Palette ─────────────────────────────────────────────────────────────────

const C = {
  bg:          '#181109',
  bg2:         '#1F1610',
  surface:     '#251A12',
  card:        '#2E2218',
  card2:       '#382A1B',
  cardSoft:    '#3F3122',
  border:      '#3A2C1F',
  borderHi:    '#52402C',
  faint:       '#3F3122',
  text:        '#F5EDDD',
  text2:       '#D6C2A2',
  sub:         '#A89175',
  muted:       '#6B5639',
  hit:         '#B7D26A',
  hitBg:       '#2F3D1B',
  below:       '#E8884A',
  belowBg:     '#3D2517',
  exceeded:    '#F4C44F',
  exceededBg:  '#3D2F13',
  spudFlesh:   '#F2DEB4',
  spudSkin:    '#C77F39',
} as const;

// ─── Spuddy mascot ───────────────────────────────────────────────────────────

function Spuddy({ size = 40 }: { size?: number; mood?: 'coach' | 'happy' }) {
  return (
    <Text style={{ fontSize: size * 0.9, lineHeight: size }}> 🥔</Text>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateShort(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function formatWeight(kg: number): string {
  return kg === 0 ? 'BW' : `${kg}kg`;
}

function exerciseSummary(entry: ExerciseEntry): string {
  const working = entry.sets.filter(s => !s.isWarmup);
  if (working.length === 0) return '—';

  const weights = working.map(s => s.weight);
  const reps = working.map(s => s.reps);
  const sameWeight = weights.every(w => w === weights[0]);
  const sameReps = reps.every(r => r === reps[0]);
  const weightStr = sameWeight ? formatWeight(weights[0]) : '';

  if (sameReps && sameWeight) {
    return `${working.length} × ${reps[0]} @ ${weightStr}`;
  }
  const repsStr = reps.join('·');
  return sameWeight ? `${repsStr} @ ${weightStr}` : repsStr;
}

// ─── Exercise preview row ────────────────────────────────────────────────────

function ExercisePreviewRow({ entry }: { entry: ExerciseEntry }) {
  const [open, setOpen] = useState(false);
  const working = entry.sets.filter(s => !s.isWarmup);
  const warmups = entry.sets.filter(s => s.isWarmup);
  const summary = exerciseSummary(entry);

  return (
    <View style={styles.exRow}>
      <Pressable onPress={() => setOpen(o => !o)} style={styles.exHeader} hitSlop={4}>
        <View style={styles.exHeaderText}>
          <Text style={styles.exName}>{entry.name}</Text>
          <Text style={styles.exMeta}>
            {summary}
            {warmups.length > 0 && (
              <Text style={styles.exWarmup}>{`  · ${warmups.length}w`}</Text>
            )}
          </Text>
        </View>
        <Text style={[styles.exChevron, open && styles.exChevronOpen]}>⌄</Text>
      </Pressable>

      {open && (
        <View style={styles.exBody}>
          <View style={styles.chipRow}>
            {working.map((s, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>{s.reps} × {formatWeight(s.weight)}</Text>
              </View>
            ))}
            {entry.targets[0] && (
              <View style={[styles.chip, styles.chipTarget]}>
                <Text style={[styles.chipText, styles.chipTargetText]}>
                  → {entry.targets[0].reps}
                  {entry.targets[0].weight != null ? ` @ ${formatWeight(entry.targets[0].weight)}` : ''}
                </Text>
              </View>
            )}
          </View>
          {warmups.length > 0 && (
            <Text style={styles.exWarmupLine}>
              {warmups.length} warmup set{warmups.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Duplicate banner ────────────────────────────────────────────────────────

function DuplicateBanner({
  date,
  onView,
  onCancel,
}: {
  date: string;
  onView: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.dupBanner}>
      <View style={styles.dupIcon}>
        <Text style={styles.dupIconText}>!</Text>
      </View>
      <View style={styles.dupBody}>
        <Text style={styles.dupTitle}>A session for {formatDateShort(date)} already exists</Text>
        <Text style={styles.dupSub}>Choose what to do with the incoming data.</Text>
        <View style={styles.dupActions}>
          <Pressable onPress={onView} style={styles.pillBtn}>
            <Text style={styles.pillBtnText}>View existing</Text>
          </Pressable>
          <Pressable onPress={onCancel} style={[styles.pillBtn, styles.pillBtnMuted]}>
            <Text style={[styles.pillBtnText, styles.pillBtnMutedText]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AddScreen() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existing, setExisting] = useState(false);

  const parsed: Session | null = useMemo(
    () => (text.trim() ? parseLiftohistoryText(text) : null),
    [text],
  );

  // Detect partial: text has content but parser couldn't close the block yet
  const isPartial =
    !!text.trim() && !parsed && text.includes('exercises: {') && !text.includes('}');

  // Derive state
  const isEmpty = !text.trim();
  const isDuplicate = !isEmpty && !saved && !!parsed && existing;
  const isClean = !isEmpty && !saved && !!parsed && !existing;

  // Save button label + enabled
  let saveLabel = 'Paste to begin';
  let saveEnabled = false;
  if (isPartial) { saveLabel = 'Still typing…'; }
  else if (isDuplicate) { saveLabel = 'Overwrite'; }
  else if (isClean && parsed) {
    saveLabel = `Save ${parsed.exercises.length} exercise${parsed.exercises.length !== 1 ? 's' : ''}`;
    saveEnabled = !saving;
  }

  useEffect(() => {
    if (!parsed?.date) { setExisting(false); return; }
    let cancelled = false;
    getDB()
      .then(db => sessionExists(db, parsed.date))
      .then(exists => { if (!cancelled) setExisting(exists); });
    return () => { cancelled = true; };
  }, [parsed?.date]);

  async function handleSave() {
    if (!parsed || saving) return;
    setSaving(true);
    try {
      const db = await getDB();
      await saveSession(db, parsed);
      setSaved(true);
      // Route to session detail after brief pause
      setTimeout(() => router.push(`/progress/${parsed.date}`), 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setText('');
    setExisting(false);
    setSaved(false);
  }

  // ─── State chip
  let chip: { label: string; color: string; bg: string; border: string } | null = null;
  if (isPartial) {
    chip = { label: 'typing…', color: C.sub, bg: C.cardSoft, border: C.border };
  } else if (parsed) {
    chip = {
      label: `${parsed.exercises.length} ex`,
      color: C.hit,
      bg: C.hitBg,
      border: `${C.hit}66`,
    };
  }

  // ─── Subtitle
  let subtitle = 'Paste below — Spuddy will preview before saving';
  if (isPartial) subtitle = 'Still typing… preview will update';
  else if (parsed?.date) subtitle = formatDateShort(parsed.date);
  else if (saved) subtitle = `Saved · ${parsed?.date ?? ''}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Add workout</Text>
          <Text style={styles.headerSub}>{subtitle}</Text>
        </View>
        {chip && (
          <View style={[styles.stateChip, { backgroundColor: chip.bg, borderColor: chip.border }]}>
            <Text style={[styles.stateChipText, { color: chip.color }]}>{chip.label}</Text>
          </View>
        )}
      </View>

      {/* ─── Saved state */}
      {saved && parsed ? (
        <View style={styles.savedBlock}>
          <View style={styles.savedSpuddy}>
            <Spuddy size={72} mood="happy" />
            <View style={styles.savedBadge}>
              <Text style={styles.savedBadgeText}>✓</Text>
            </View>
          </View>
          <Text style={styles.savedHeading}>Saved!</Text>
          <Text style={styles.savedSub}>
            {parsed.exercises.length} exercise{parsed.exercises.length !== 1 ? 's' : ''} on {formatDateShort(parsed.date)}
          </Text>
          <View style={styles.savedActions}>
            <Pressable
              onPress={() => router.push(`/progress/${parsed.date}`)}
              style={styles.ghostBtn}
            >
              <Text style={styles.ghostBtnText}>View session</Text>
            </Pressable>
            <Pressable onPress={handleCancel} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Add another</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Empty hero */}
            {isEmpty && (
              <View style={styles.hero}>
                <Spuddy size={40} mood="coach" />
                <Text style={styles.heroHeading}>What did you do today?</Text>
                <Text style={styles.heroBody}>
                  Paste a session from Liftosaur → History → Share.
                </Text>
              </View>
            )}

            {/* Textarea */}
            <TextInput
              style={[styles.textarea, isEmpty && styles.textareaEmpty]}
              multiline
              placeholder={`2025-06-01\nexercises: {\n  Bench Press / 3x8 60kg / target: 3x8 60kg\n}`}
              placeholderTextColor={C.muted}
              value={text}
              onChangeText={setText}
              editable={!saving}
              autoCorrect={false}
              autoCapitalize="none"
              textAlignVertical="top"
            />

            {/* Duplicate banner */}
            {isDuplicate && parsed && (
              <View style={styles.bannerWrapper}>
                <DuplicateBanner
                  date={parsed.date}
                  onView={() => router.push(`/progress/${parsed.date}`)}
                  onCancel={handleCancel}
                />
              </View>
            )}

            {/* Exercise preview */}
            {parsed && parsed.exercises.length > 0 && (
              <View style={styles.previewCard}>
                {parsed.exercises.map((ex, i) => (
                  <View key={`${ex.name}-${i}`}>
                    {i > 0 && <View style={styles.divider} />}
                    <ExercisePreviewRow entry={ex} />
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Sticky bottom bar */}
          <View style={[styles.stickyBar, { paddingBottom: insets.bottom + 18 }]}>
            <Pressable onPress={handleCancel} style={styles.ghostBtn}>
              <Text style={styles.ghostBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!saveEnabled}
              style={[styles.primaryBtn, !saveEnabled && styles.primaryBtnDisabled, { flex: 1 }]}
            >
              <Text style={[styles.primaryBtnText, !saveEnabled && styles.primaryBtnDisabledText]}>
                {saving ? 'Saving…' : saveLabel}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ─── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 12,
    color: C.sub,
    marginTop: 1,
  },
  stateChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  stateChipText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ─── Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 14,
  },

  // ─── Empty hero
  hero: {
    alignItems: 'center',
    paddingTop: 24,
    gap: 8,
  },
  heroHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.2,
    marginTop: 6,
  },
  heroBody: {
    fontSize: 13,
    color: C.sub,
    textAlign: 'center',
  },
  // ─── Textarea
  textarea: {
    minHeight: 140,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    fontSize: 13,
    color: C.text,
    lineHeight: 20,
  },
  textareaEmpty: {
    minHeight: 220,
  },

  // ─── Duplicate banner
  bannerWrapper: {
    // gap handled by scrollContent
  },
  dupBanner: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: C.exceededBg,
    borderWidth: 1,
    borderColor: `${C.exceeded}55`,
    alignItems: 'flex-start',
  },
  dupIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${C.exceeded}33`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dupIconText: {
    color: C.exceeded,
    fontSize: 14,
    fontWeight: '700',
  },
  dupBody: {
    flex: 1,
    minWidth: 0,
  },
  dupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
  },
  dupSub: {
    fontSize: 12,
    color: C.sub,
    marginTop: 2,
  },
  dupActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  pillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${C.text2}55`,
  },
  pillBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text2,
  },
  pillBtnMuted: {
    borderColor: `${C.sub}55`,
  },
  pillBtnMutedText: {
    color: C.sub,
  },

  // ─── Preview card
  previewCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 12,
  },

  // ─── Exercise row
  exRow: {},
  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
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
  exWarmup: {
    color: C.muted,
  },
  exChevron: {
    fontSize: 14,
    color: C.muted,
  },
  exChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  exBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: C.card2,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.text2,
    fontVariant: ['tabular-nums'],
  },
  chipTarget: {
    backgroundColor: 'transparent',
    borderColor: `${C.muted}80`,
  },
  chipTargetText: {
    color: C.sub,
  },
  exWarmupLine: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },

  // ─── Sticky bar
  stickyBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  ghostBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text2,
  },
  primaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.hit,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    backgroundColor: C.cardSoft,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.bg,
    letterSpacing: -0.1,
  },
  primaryBtnDisabledText: {
    color: C.muted,
  },

  // ─── Saved state
  savedBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 36,
  },
  savedSpuddy: {
    position: 'relative',
    marginBottom: 8,
  },
  savedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.hit,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.bg,
  },
  savedBadgeText: {
    fontSize: 14,
    color: C.bg,
    fontWeight: '700',
  },
  savedHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
  },
  savedSub: {
    fontSize: 14,
    color: C.sub,
    textAlign: 'center',
  },
  savedActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
});
