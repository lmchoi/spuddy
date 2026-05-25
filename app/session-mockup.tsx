/**
 * MOCKUP — session logging screen
 * Not wired to real data. Toggle states with the buttons at the bottom.
 */
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/components/spuddy/palette';

// ─── Fake program data ────────────────────────────────────────────────────────

const EXERCISES = [
  {
    name: 'Bench Press',
    lastSession: '3 × 8 @ 60 kg',
    sets: [
      { reps: 8, weight: 62.5, warmup: false },
      { reps: 8, weight: 62.5, warmup: false },
      { reps: 8, weight: 62.5, warmup: false },
    ],
  },
  {
    name: 'Overhead Press',
    lastSession: '3 × 8 @ 40 kg',
    sets: [
      { reps: 8, weight: 42.5, warmup: false },
      { reps: 8, weight: 42.5, warmup: false },
      { reps: 8, weight: 42.5, warmup: false },
    ],
  },
  {
    name: 'Incline Dumbbell',
    lastSession: '3 × 10 @ 20 kg',
    sets: [
      { reps: 10, weight: 20, warmup: false },
      { reps: 10, weight: 20, warmup: false },
      { reps: 10, weight: 20, warmup: false },
    ],
  },
  {
    name: 'Tricep Pushdown',
    lastSession: '3 × 12 @ 15 kg',
    sets: [
      { reps: 12, weight: 15, warmup: false },
      { reps: 12, weight: 15, warmup: false },
      { reps: 12, weight: 15, warmup: false },
    ],
  },
];

// Available weight steps (simulating equipment profile)
const WEIGHT_STEPS = [
  0, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30,
  32.5, 35, 37.5, 40, 42.5, 45, 47.5, 50, 52.5, 55, 57.5, 60,
  62.5, 65, 67.5, 70, 72.5, 75, 80, 82.5, 85, 87.5, 90, 95, 100,
];

function nextWeight(current: number, dir: 1 | -1): number {
  const idx = WEIGHT_STEPS.indexOf(current);
  if (idx === -1) {
    const nearest = WEIGHT_STEPS.reduce((a, b) =>
      Math.abs(b - current) < Math.abs(a - current) ? b : a
    );
    return nearest;
  }
  const next = idx + dir;
  if (next < 0) return WEIGHT_STEPS[0];
  if (next >= WEIGHT_STEPS.length) return WEIGHT_STEPS[WEIGHT_STEPS.length - 1];
  return WEIGHT_STEPS[next];
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({
  value,
  label,
  onInc,
  onDec,
  format,
}: {
  value: number;
  label: string;
  onInc: () => void;
  onDec: () => void;
  format: (v: number) => string;
}) {
  return (
    <View style={s.stepper}>
      <Pressable onPress={onDec} style={({ pressed }) => [s.stepBtn, pressed && s.stepBtnPressed]}>
        <Text style={s.stepBtnText}>−</Text>
      </Pressable>
      <View style={s.stepValue}>
        <Text style={s.stepNum}>{format(value)}</Text>
        <Text style={s.stepLabel}>{label}</Text>
      </View>
      <Pressable onPress={onInc} style={({ pressed }) => [s.stepBtn, pressed && s.stepBtnPressed]}>
        <Text style={s.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

// ─── Rest timer ───────────────────────────────────────────────────────────────

function RestTimer({ duration, onSkip }: { duration: number; onSkip: () => void }) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          onSkip();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onSkip]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = remaining / duration;

  return (
    <View style={s.restBlock}>
      <Text style={s.restLabel}>Rest</Text>
      <Text style={s.restTime}>
        {mins}:{String(secs).padStart(2, '0')}
      </Text>
      <View style={s.restBar}>
        <View style={[s.restBarFill, { width: `${pct * 100}%` }]} />
      </View>
      <Pressable onPress={onSkip} style={({ pressed }) => [s.skipBtn, pressed && s.skipBtnPressed]}>
        <Text style={s.skipBtnText}>Skip rest</Text>
      </Pressable>
    </View>
  );
}

// ─── Exercise selector strip ──────────────────────────────────────────────────

function ExerciseStrip({
  exercises,
  currentIdx,
  completedPerExercise,
  onSelect,
}: {
  exercises: typeof EXERCISES;
  currentIdx: number;
  completedPerExercise: number[];
  onSelect: (idx: number) => void;
}) {
  // Count how many times each name appears so duplicates get a number suffix
  const nameCounts: Record<string, number> = {};
  const nameIndex: Record<string, number> = {};
  for (const ex of exercises) {
    nameCounts[ex.name] = (nameCounts[ex.name] ?? 0) + 1;
  }

  return (
    <View style={s.strip}>
      {exercises.map((ex, i) => {
        const done = completedPerExercise[i] ?? 0;
        const total = ex.sets.length;
        const isActive = i === currentIdx;
        const isComplete = done >= total;

        // Label: add suffix only when name appears more than once
        let label = ex.name;
        if (nameCounts[ex.name] > 1) {
          nameIndex[ex.name] = (nameIndex[ex.name] ?? 0) + 1;
          label = `${ex.name} ${nameIndex[ex.name]}`;
        }

        return (
          <Pressable
            key={i}
            onPress={() => onSelect(i)}
            style={({ pressed }) => [
              s.stripChip,
              isActive && s.stripChipActive,
              isComplete && !isActive && s.stripChipDone,
              pressed && s.stripChipPressed,
            ]}
          >
            <Text
              style={[
                s.stripChipName,
                isActive && s.stripChipNameActive,
                isComplete && !isActive && s.stripChipNameDone,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            <View style={s.stripDots}>
              {ex.sets.map((_, si) => (
                <View
                  key={si}
                  style={[
                    s.stripDot,
                    si < done && (isActive ? s.stripDotActiveHit : s.stripDotHit),
                  ]}
                />
              ))}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type LoggedSet = { reps: number; weight: number };

export default function SessionMockup() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [exIdx, setExIdx] = useState(0);
  const [completedSets, setCompletedSets] = useState<LoggedSet[]>([]);
  const [completedPerExercise, setCompletedPerExercise] = useState<number[]>(
    EXERCISES.map(() => 0)
  );
  const [resting, setResting] = useState(false);

  const exercise = EXERCISES[exIdx];
  const target = exercise.sets[completedSets.length] ?? exercise.sets[exercise.sets.length - 1];
  const allDone = completedSets.length >= exercise.sets.length;

  const [activeReps, setActiveReps] = useState(target.reps);
  const [activeWeight, setActiveWeight] = useState(target.weight);

  const totalSets = EXERCISES.reduce((n, e) => n + e.sets.length, 0);
  const doneSets = completedPerExercise.reduce((a, b) => a + b, 0);

  function confirmSet() {
    const next = [...completedSets, { reps: activeReps, weight: activeWeight }];
    setCompletedSets(next);
    setCompletedPerExercise(prev => {
      const updated = [...prev];
      updated[exIdx] = next.length;
      return updated;
    });

    // Prep for next set
    const nextTarget = exercise.sets[next.length] ?? exercise.sets[exercise.sets.length - 1];
    setActiveReps(nextTarget.reps);
    setActiveWeight(nextTarget.weight);

    if (next.length < exercise.sets.length) setResting(true);
  }

  function jumpTo(idx: number) {
    setExIdx(idx);
    const setsDone = completedPerExercise[idx] ?? 0;
    const ex = EXERCISES[idx];

    setCompletedSets(Array.from({ length: setsDone }, (_, i) => ({
      reps: ex.sets[i]?.reps ?? 0,
      weight: ex.sets[i]?.weight ?? 0,
    })));

    const t = ex.sets[setsDone] ?? ex.sets[ex.sets.length - 1];
    setActiveReps(t.reps);
    setActiveWeight(t.weight);

    setResting(false);
  }

  function nextExercise() {
    const next = exIdx + 1;
    if (next < EXERCISES.length) {
      jumpTo(next);
    }
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Text style={s.backArrow}>←</Text>
        </Pressable>
        <View style={s.headerMid}>
          <Text style={s.headerDay}>Push A</Text>
          <Text style={s.headerProgress}>{doneSets} of {totalSets} sets</Text>
        </View>
      </View>

      {/* ── Exercise selector ── */}
      <ExerciseStrip
        exercises={EXERCISES}
        currentIdx={exIdx}
        completedPerExercise={completedPerExercise}
        onSelect={jumpTo}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 160 }]}
      >
        {/* ── Exercise title ── */}
        <View style={s.exBlock}>
          <Text style={s.exName}>{exercise.name}</Text>
          <Text style={s.exLast}>Last session · {exercise.lastSession}</Text>
        </View>

        {/* ── Set list ── */}
        <View style={s.setList}>
          {exercise.sets.map((set, i) => {
            const logged = completedSets[i];
            const isActive = i === completedSets.length && !allDone;
            const isPast = i < completedSets.length;

            if (isPast && logged) {
              const hitTarget = logged.reps >= set.reps;
              return (
                <View key={i} style={[s.setRow, s.setRowDone]}>
                  <View style={[s.setDot, s.setDotDone]} />
                  <Text style={s.setRowLabel}>Set {i + 1}</Text>
                  <Text style={[s.setRowResult, hitTarget ? s.setHit : s.setMiss]}>
                    {logged.reps} × {logged.weight} kg
                  </Text>
                </View>
              );
            }

            if (isActive) {
              return (
                <View key={i} style={[s.setRow, s.setRowActive]}>
                  <View style={[s.setDot, s.setDotActive]} />
                  <Text style={s.setRowLabelActive}>Set {i + 1}</Text>
                  <Text style={s.setRowTarget}>{set.reps} × {set.weight} kg</Text>
                </View>
              );
            }

            return (
              <View key={i} style={[s.setRow, s.setRowFuture]}>
                <View style={s.setDot} />
                <Text style={s.setRowLabelFuture}>Set {i + 1}</Text>
                <Text style={s.setRowFutureVal}>{set.reps} × {set.weight} kg</Text>
              </View>
            );
          })}
        </View>

        {/* ── All sets done ── */}
        {allDone && (
          <View style={s.allDoneBlock}>
            <Text style={s.allDoneText}>Exercise done</Text>
            {exIdx < EXERCISES.length - 1 && (
              <View style={s.nextExPreview}>
                <Text style={s.nextExLabel}>Next up</Text>
                <Text style={s.nextExName}>{EXERCISES[exIdx + 1].name}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Bottom action area ── */}
      <View style={[s.bottom, { paddingBottom: insets.bottom + 16 }]}>
        {resting ? (
          <RestTimer duration={90} onSkip={() => setResting(false)} />
        ) : allDone ? (
          exIdx < EXERCISES.length - 1 ? (
            <Pressable onPress={nextExercise} style={s.confirmBtn}>
              <Text style={s.confirmBtnText}>Next: {EXERCISES[exIdx + 1].name}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.back()} style={s.confirmBtn}>
              <Text style={s.confirmBtnText}>Finish session</Text>
            </Pressable>
          )
        ) : (
          <>
            <View style={s.stepperRow}>
              <Stepper
                value={activeReps}
                label="reps"
                onDec={() => setActiveReps(r => Math.max(1, r - 1))}
                onInc={() => setActiveReps(r => r + 1)}
                format={v => String(v)}
              />
              <View style={s.stepperDivider} />
              <Stepper
                value={activeWeight}
                label="kg"
                onDec={() => setActiveWeight(w => nextWeight(w, -1))}
                onInc={() => setActiveWeight(w => nextWeight(w, 1))}
                format={v => v === 0 ? 'BW' : String(v)}
              />
            </View>
            <Pressable
              onPress={confirmSet}
              style={({ pressed }) => [s.confirmBtn, pressed && s.confirmBtnPressed]}
            >
              <Text style={s.confirmBtnText}>
                {completedSets.length + 1 < exercise.sets.length
                  ? `Done · Set ${completedSets.length + 1} of ${exercise.sets.length}`
                  : 'Done · Last set'}
              </Text>
            </Pressable>
          </>
        )}
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: C.text2 },
  headerMid: { flex: 1 },
  headerDay: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  headerProgress: { fontSize: 12, color: C.sub, marginTop: 1 },
  // Exercise strip
  strip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 8,
  },
  stripContent: {},
  stripChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    gap: 6,
    minWidth: 90,
  },
  stripChipActive: {
    borderColor: C.hit,
    backgroundColor: C.hitBg,
  },
  stripChipDone: {
    borderColor: C.border,
    backgroundColor: 'transparent',
    opacity: 0.5,
  },
  stripChipPressed: { opacity: 0.7 },
  stripChipName: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text2,
  },
  stripChipNameActive: { color: C.hit },
  stripChipNameDone: { color: C.muted },
  stripDots: { flexDirection: 'row', gap: 4 },
  stripDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: C.border,
  },
  stripDotHit: { backgroundColor: C.muted },
  stripDotActiveHit: { backgroundColor: C.hit },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, gap: 20 },

  // Exercise block
  exBlock: { paddingTop: 8, gap: 4 },
  exName: { fontSize: 22, fontWeight: '700', color: C.text, letterSpacing: -0.4 },
  exLast: { fontSize: 12, color: C.muted },

  // Set list
  setList: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  setRowDone: { opacity: 0.7 },
  setRowActive: { backgroundColor: C.surface },
  setRowFuture: { opacity: 0.35 },

  setDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.border, flexShrink: 0,
  },
  setDotDone: { backgroundColor: C.hit },
  setDotActive: {
    backgroundColor: C.hit,
    shadowColor: C.hit,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },

  setRowLabel: { fontSize: 12, color: C.sub, width: 44 },
  setRowLabelActive: { fontSize: 12, fontWeight: '600', color: C.text2, width: 44 },
  setRowLabelFuture: { fontSize: 12, color: C.muted, width: 44 },
  setRowResult: { flex: 1, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  setHit: { color: C.hit },
  setMiss: { color: C.below },
  setRowTarget: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text, textAlign: 'right' },
  setRowFutureVal: { flex: 1, fontSize: 13, color: C.muted, textAlign: 'right' },

  // All done
  allDoneBlock: { gap: 12, paddingTop: 4 },
  allDoneText: { fontSize: 15, fontWeight: '600', color: C.hit },
  nextExPreview: {
    backgroundColor: C.card,
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
    padding: 14, gap: 2,
  },
  nextExLabel: { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  nextExName: { fontSize: 15, fontWeight: '600', color: C.text },

  // Bottom
  bottom: {
    paddingHorizontal: 18,
    paddingTop: 14,
    backgroundColor: C.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    gap: 12,
  },

  // Stepper
  stepperRow: { flexDirection: 'row', gap: 0 },
  stepperDivider: { width: 12 },
  stepper: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 48, height: 56,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card2,
  },
  stepBtnPressed: { backgroundColor: C.cardSoft },
  stepBtnText: { fontSize: 22, color: C.text, fontWeight: '300' },
  stepValue: { flex: 1, alignItems: 'center', gap: 2 },
  stepNum: {
    fontSize: 22, fontWeight: '700', color: C.text,
    letterSpacing: -0.5, fontVariant: ['tabular-nums'],
  },
  stepLabel: {
    fontSize: 9, color: C.muted,
    textTransform: 'uppercase', letterSpacing: 1,
  },

  // Rest timer
  restBlock: { alignItems: 'center', gap: 8, paddingVertical: 4 },
  restLabel: { fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  restTime: {
    fontSize: 48, fontWeight: '700', color: C.text,
    letterSpacing: -2, fontVariant: ['tabular-nums'],
  },
  restBar: {
    width: '100%', height: 3,
    backgroundColor: C.faint, borderRadius: 2, overflow: 'hidden',
  },
  restBarFill: { height: '100%', backgroundColor: C.hit, borderRadius: 2 },
  skipBtn: {
    marginTop: 4,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1, borderColor: C.border,
  },
  skipBtnPressed: { backgroundColor: C.card },
  skipBtnText: { fontSize: 13, fontWeight: '600', color: C.sub },

  // Confirm
  confirmBtn: {
    backgroundColor: C.hit,
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnPressed: { opacity: 0.85 },
  confirmBtnText: {
    fontSize: 16, fontWeight: '700', color: C.bg, letterSpacing: -0.2,
  },

});
