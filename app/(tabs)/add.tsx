import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StatusBar,
} from 'react-native';
import { styles } from './add.styles';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDB } from '@/src/db';
import { parseLiftohistoryTextDetailed } from '@/src/parser';
import type { ParseLine, ParseResult } from '@/src/parser';
import { saveSession, sessionExists } from '@/src/storage';
import type { ExerciseEntry } from '@/src/types';
import { workingSets, warmupSets } from '@/src/domain/exerciseEntry';
import { C } from '@/components/spuddy/palette';

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
  const working = workingSets(entry);
  if (working.length === 0) return '—';

  const weights = working.map(s => s.weight);
  const reps = working.map(s => s.reps);
  const sameWeight = weights.every(w => w === weights[0]);
  const sameReps = reps.every(r => r === reps[0]);
  const weightStr = sameWeight ? formatWeight(weights[0]) : '';

  if (sameReps && sameWeight) {
    return `${working.length} × ${reps[0] ?? '–'} @ ${weightStr}`;
  }
  const repsStr = reps.map(r => r ?? '–').join('·');
  return sameWeight ? `${repsStr} @ ${weightStr}` : repsStr;
}

// ─── Exercise preview row ────────────────────────────────────────────────────

function ExercisePreviewRow({ entry }: { entry: ExerciseEntry }) {
  const [open, setOpen] = useState(false);
  const working = workingSets(entry);
  const warmups = warmupSets(entry);
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
                <Text style={styles.chipText}>{s.reps ?? '–'} × {formatWeight(s.weight)}</Text>
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
          <Pressable onPress={onCancel} style={styles.pillBtn}>
            <Text style={styles.pillBtnText}>Dismiss</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Error banner ────────────────────────────────────────────────────────────

function ErrorBanner({ lines }: { lines: ParseLine[] }) {
  const [open, setOpen] = useState(false);
  const flagged = lines.filter(l => l.kind !== 'ok');
  if (flagged.length === 0) return null;

  return (
    <Pressable onPress={() => setOpen(o => !o)} style={styles.errBanner}>
      <View style={styles.errHeader}>
        <View style={styles.errIcon}>
          <Text style={styles.errIconText}>!</Text>
        </View>
        <Text style={styles.errTitle}>
          {flagged.length} line{flagged.length !== 1 ? 's' : ''} couldn&apos;t be parsed
        </Text>
        <Text style={[styles.exChevron, open && styles.exChevronOpen]}>⌄</Text>
      </View>
      {open && (
        <View style={styles.errLog}>
          {flagged.map((l) => (
            <View key={l.raw} style={styles.errLogRow}>
              <View style={[styles.errDot, l.kind === 'warn' && styles.errDotWarn]} />
              <View style={styles.errLogText}>
                <Text style={styles.errRaw}>{l.raw}</Text>
                {l.note && <Text style={styles.errNote}>{l.note}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AddScreen() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existing, setExisting] = useState(false);
  const autoNavTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parsed: ParseResult | null = useMemo(
    () => (text.trim() ? parseLiftohistoryTextDetailed(text) : null),
    [text],
  );

  // Detect partial: text has content but parser couldn't close the block yet
  const isPartial =
    !!text.trim() && !parsed?.ok && text.includes('exercises: {') && !text.includes('}');

  // Derive state
  const isEmpty = !text.trim();
  const parsedDate = parsed?.ok ? parsed.date : null;
  const isDuplicate = !isEmpty && !saved && !!parsed?.ok && existing;
  const isClean = !isEmpty && !saved && !!parsed?.ok && !existing;
  const errorLines = parsed?.lines.filter(l => l.kind !== 'ok') ?? [];

  // Save button label + enabled
  let saveLabel = 'Paste to begin';
  let saveEnabled = false;
  if (isPartial) { saveLabel = 'Still typing…'; }
  else if (isDuplicate) { saveLabel = 'Overwrite'; }  // enabled in slice 3 once replaceSession exists
  else if (isClean && parsed?.ok) {
    saveLabel = `Save ${parsed.exercises.length} exercise${parsed.exercises.length !== 1 ? 's' : ''}`;
    saveEnabled = !saving;
  }

  useEffect(() => {
    if (!parsedDate) return;
    let cancelled = false;
    getDB()
      .then(db => sessionExists(db, parsedDate))
      .then(exists => { if (!cancelled) setExisting(exists); });
    return () => {
      cancelled = true;
      setExisting(false);
    };
  }, [parsedDate]);

  async function handleSave() {
    if (!parsed?.ok || saving) return;
    setSaving(true);
    try {
      const db = await getDB();
      await saveSession(db, { date: parsed.date, exercises: parsed.exercises });
      setSaved(true);
      autoNavTimer.current = setTimeout(() => router.push(`/progress/${parsed.date}`), 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => () => { if (autoNavTimer.current) clearTimeout(autoNavTimer.current); }, []);

  function handleCancel() {
    if (autoNavTimer.current) clearTimeout(autoNavTimer.current);
    setText('');
    setExisting(false);
    setSaved(false);
  }

  function handleViewSession(date: string) {
    if (autoNavTimer.current) clearTimeout(autoNavTimer.current);
    router.push(`/progress/${date}`);
  }

  // ─── State chip
  let chip: { label: string; color: string; bg: string; border: string } | null = null;
  if (isPartial) {
    chip = { label: 'typing…', color: C.sub, bg: C.cardSoft, border: C.border };
  } else if (parsed?.ok) {
    chip = {
      label: `${parsed.exercises.length} ex`,
      color: C.hit,
      bg: C.hitBg,
      border: `${C.hit}66`,
    };
  } else if (errorLines.length > 0) {
    chip = {
      label: `${errorLines.length} err`,
      color: C.below,
      bg: C.belowBg,
      border: `${C.below}55`,
    };
  }

  // ─── Subtitle
  let subtitle = 'Paste below — Spuddy will preview before saving';
  if (saved && parsedDate) subtitle = `Saved · ${formatDateShort(parsedDate)}`;
  else if (isPartial) subtitle = 'Still typing… preview will update';
  else if (parsedDate) subtitle = formatDateShort(parsedDate);

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
      {saved && parsed?.ok ? (
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
              onPress={() => handleViewSession(parsed.date)}
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

            {/* Error banner */}
            {errorLines.length > 0 && parsed && <ErrorBanner lines={errorLines} />}

            {/* Duplicate banner */}
            {isDuplicate && parsed?.ok && (
              <View style={styles.bannerWrapper}>
                <DuplicateBanner
                  date={parsed.date}
                  onView={() => router.push(`/progress/${parsed.date}`)}
                  onCancel={handleCancel}
                />
              </View>
            )}

            {/* Exercise preview */}
            {parsed?.ok && parsed.exercises.length > 0 && (
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
            {!isEmpty && (
              <Pressable onPress={handleCancel} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleSave}
              disabled={!saveEnabled}
              style={[styles.primaryBtn, !saveEnabled && styles.primaryBtnDisabled]}
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
