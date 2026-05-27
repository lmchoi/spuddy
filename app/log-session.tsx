import { useEffect, useReducer, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/components/spuddy/palette';
import { getDB } from '@/src/db';
import { getProgramDay, getPrograms } from '@/src/programStorage';
import { saveSession } from '@/src/storage';
import {
  initSession,
  logSet,
  skipRest,
  jumpToExercise,
  isExerciseDone,
  isSessionDone,
  getActiveTarget,
  buildSavePayload,
  type SessionState,
} from '@/src/domain/sessionLogger';
import type { ProgramDay } from '@/src/types';
import { nextWeight } from '@/src/domain/nextWeight';

// ─── Local action state for reps/weight steppers ──────────────────────────────

type InputState = { reps: number; weight: number };

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

// ─── RestTimer ────────────────────────────────────────────────────────────────

function RestTimer({ onSkip }: { onSkip: () => void }) {
  const [remaining, setRemaining] = useState(90);

  useEffect(() => {
    if (remaining === 0) { onSkip(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onSkip]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = remaining / 90;

  return (
    <View style={s.restBlock}>
      <Text style={s.restLabel}>Rest</Text>
      <Text style={s.restTime}>{mins}:{String(secs).padStart(2, '0')}</Text>
      <View style={s.restBar}>
        <View style={[s.restBarFill, { width: `${pct * 100}%` }]} />
      </View>
      <Pressable onPress={onSkip} style={({ pressed }) => [s.skipBtn, pressed && s.skipBtnPressed]}>
        <Text style={s.skipBtnText}>Skip rest</Text>
      </Pressable>
    </View>
  );
}

// ─── ExerciseStrip ────────────────────────────────────────────────────────────

function ExerciseStrip({
  day,
  sessionState,
  onSelect,
}: {
  day: ProgramDay;
  sessionState: SessionState;
  onSelect: (idx: number) => void;
}) {
  return (
    <View style={s.strip}>
      {day.exercises.map((ex, i) => {
        const isActive = i === sessionState.currentExerciseIdx;
        const done = isExerciseDone(sessionState, day, i);
        const loggedCount = sessionState.loggedSets[i].length;
        return (
          <Pressable
            key={i}
            testID={`strip-chip-${i}`}
            onPress={() => onSelect(i)}
            style={({ pressed }) => [
              s.stripChip,
              isActive && s.stripChipActive,
              done && !isActive && s.stripChipDone,
              pressed && s.stripChipPressed,
            ]}
          >
            <Text
              style={[
                s.stripChipName,
                isActive && s.stripChipNameActive,
                done && !isActive && s.stripChipNameDone,
              ]}
              numberOfLines={1}
            >
              {ex.name}
            </Text>
            <View style={s.stripDots}>
              {ex.targets.map((target, si) => {
                const loggedSet = sessionState.loggedSets[i][si];
                const isLogged = si < loggedCount;
                const isActiveDot = si === loggedCount && isActive && !done;

                let dotStyle;
                if (isLogged && loggedSet) {
                  dotStyle =
                    loggedSet.reps >= target.reps
                      ? s.stripDotHit
                      : s.stripDotMiss;
                } else if (isActiveDot) {
                  dotStyle = s.stripDotActive;
                }

                return (
                  <View
                    key={si}
                    testID={`strip-dot-${i}-${si}`}
                    style={[s.stripDot, dotStyle]}
                  />
                );
              })}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── SetList ──────────────────────────────────────────────────────────────────

function SetList({
  day,
  sessionState,
  exIdx,
}: {
  day: ProgramDay;
  sessionState: SessionState;
  exIdx: number;
}) {
  const ex = day.exercises[exIdx];
  const logged = sessionState.loggedSets[exIdx];

  return (
    <View style={s.setList}>
      {ex.targets.map((target, i) => {
        const loggedSet = logged[i];
        const isPast = i < logged.length;
        const isActive = i === logged.length && !isExerciseDone(sessionState, day, exIdx);

        if (isPast && loggedSet) {
          const hitTarget = loggedSet.reps >= target.reps;
          return (
            <View key={i} style={[s.setRow, s.setRowDone]}>
              <View style={[s.setDot, s.setDotDone]} />
              <Text style={s.setRowLabel}>Set {i + 1}</Text>
              <Text style={[s.setRowResult, hitTarget ? s.setHit : s.setMiss]}>
                {loggedSet.reps} × {loggedSet.weight} kg
              </Text>
            </View>
          );
        }

        if (isActive) {
          return (
            <View key={i} style={[s.setRow, s.setRowActive]}>
              <View style={[s.setDot, s.setDotActive]} />
              <Text style={s.setRowLabelActive}>Set {i + 1}</Text>
              <Text style={s.setRowTarget}>{target.reps} × {target.weight ?? 0} kg</Text>
            </View>
          );
        }

        return (
          <View key={i} style={[s.setRow, s.setRowFuture]}>
            <View style={s.setDot} />
            <Text style={s.setRowLabelFuture}>Set {i + 1}</Text>
            <Text style={s.setRowFutureVal}>{target.reps} × {target.weight ?? 0} kg</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── BottomAction ─────────────────────────────────────────────────────────────

function BottomAction({
  day,
  sessionState,
  input,
  onIncReps,
  onDecReps,
  onIncWeight,
  onDecWeight,
  onLogSet,
  onSkipRest,
  onNextExercise,
  onFinish,
}: {
  day: ProgramDay;
  sessionState: SessionState;
  input: InputState;
  onIncReps: () => void;
  onDecReps: () => void;
  onIncWeight: () => void;
  onDecWeight: () => void;
  onLogSet: () => void;
  onSkipRest: () => void;
  onNextExercise: () => void;
  onFinish: () => void;
}) {
  const exIdx = sessionState.currentExerciseIdx;
  const ex = day.exercises[exIdx];
  const logged = sessionState.loggedSets[exIdx].length;
  const total = ex.targets.length;

  if (sessionState.isResting) {
    return <RestTimer onSkip={onSkipRest} />;
  }

  if (isSessionDone(sessionState, day)) {
    return (
      <Pressable onPress={onFinish} style={({ pressed }) => [s.confirmBtn, pressed && s.confirmBtnPressed]}>
        <Text style={s.confirmBtnText}>Finish session</Text>
      </Pressable>
    );
  }

  if (isExerciseDone(sessionState, day, exIdx)) {
    const next = day.exercises[exIdx + 1];
    return (
      <Pressable onPress={next ? onNextExercise : onFinish} style={({ pressed }) => [s.confirmBtn, pressed && s.confirmBtnPressed]}>
        <Text style={s.confirmBtnText}>
          {next ? `Next: ${next.name}` : 'Finish session'}
        </Text>
      </Pressable>
    );
  }

  const label = logged + 1 < total
    ? `Done · Set ${logged + 1} of ${total}`
    : 'Done · Last set';

  return (
    <>
      <View style={s.stepperRow}>
        <Stepper
          value={input.reps}
          label="reps"
          onDec={onDecReps}
          onInc={onIncReps}
          format={v => String(v)}
        />
        <View style={s.stepperDivider} />
        <Stepper
          value={input.weight}
          label="kg"
          onDec={onDecWeight}
          onInc={onIncWeight}
          format={v => v === 0 ? 'BW' : String(v)}
        />
      </View>
      <Pressable onPress={onLogSet} style={({ pressed }) => [s.confirmBtn, pressed && s.confirmBtnPressed]}>
        <Text style={s.confirmBtnText}>{label}</Text>
      </Pressable>
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type ScreenState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'ready'; day: ProgramDay; session: SessionState; input: InputState };

function inputFromTarget(day: ProgramDay, session: SessionState): InputState {
  const exIdx = session.currentExerciseIdx;
  const t = getActiveTarget(session, day, exIdx);
  return { reps: t.reps, weight: t.weight ?? 0 };
}

export default function LogSession() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { programName, dayIndex } = useLocalSearchParams<{ programName: string; dayIndex: string }>();

  const [state, setState] = useReducer(
    (_: ScreenState, next: ScreenState) => next,
    { status: 'loading' }
  );

  useEffect(() => {
    async function load() {
      try {
        const db = await getDB();
        let resolvedName = programName;
        let resolvedDayIndex = Number(dayIndex ?? 0);
        if (!resolvedName) {
          const programs = await getPrograms(db);
          if (programs.length === 0) { setState({ status: 'empty' }); return; }
          resolvedName = programs[0].name;
          resolvedDayIndex = programs[0].activeDayIndex;
        }
        const day = await getProgramDay(db, resolvedName, resolvedDayIndex);
        if (!day) { setState({ status: 'empty' }); return; }
        const session = initSession(day);
        const input = inputFromTarget(day, session);
        setState({ status: 'ready', day, session, input });
      } catch {
        setState({ status: 'empty' });
      }
    }
    load();
  }, [programName, dayIndex]);

  const handleLogSet = useCallback(() => {
    if (state.status !== 'ready') return;
    const { day, session, input } = state;
    const exIdx = session.currentExerciseIdx;
    const next = logSet(session, exIdx, input.reps, input.weight);
    const nextInput = inputFromTarget(day, next);
    setState({ status: 'ready', day, session: next, input: nextInput });
  }, [state]);

  const handleSkipRest = useCallback(() => {
    if (state.status !== 'ready') return;
    const next = skipRest(state.session);
    const nextInput = inputFromTarget(state.day, next);
    setState({ status: 'ready', day: state.day, session: next, input: nextInput });
  }, [state]);

  const handleJump = useCallback((idx: number) => {
    if (state.status !== 'ready') return;
    const next = jumpToExercise(state.session, idx);
    const nextInput = inputFromTarget(state.day, next);
    setState({ status: 'ready', day: state.day, session: next, input: nextInput });
  }, [state]);

  const handleNextExercise = useCallback(() => {
    if (state.status !== 'ready') return;
    const next = jumpToExercise(state.session, state.session.currentExerciseIdx + 1);
    const nextInput = inputFromTarget(state.day, next);
    setState({ status: 'ready', day: state.day, session: next, input: nextInput });
  }, [state]);

  const handleFinish = useCallback(async () => {
    if (state.status !== 'ready') return;
    const { day, session } = state;
    const today = new Date().toISOString().slice(0, 10);
    const payload = buildSavePayload(session, day, today);
    const db = await getDB();
    await saveSession(db, payload);
    router.replace(`/progress/${today}`);
  }, [state, router]);

  if (state.status === 'loading') {
    return (
      <View style={[s.container, s.centered]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={C.hit} />
      </View>
    );
  }

  if (state.status === 'empty') {
    return (
      <View style={[s.container, s.centered, { padding: 40 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={s.emptyTitle}>No program found</Text>
        <Text style={s.emptyText}>Import a program from Settings first.</Text>
        <Pressable onPress={() => router.back()} style={[s.confirmBtn, { width: '100%', marginTop: 20 }]}>
          <Text style={s.confirmBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const { day, session, input } = state;
  const exIdx = session.currentExerciseIdx;
  const ex = day.exercises[exIdx];
  const doneSets = session.loggedSets.reduce((n, sets) => n + sets.length, 0);
  const totalSets = day.exercises.reduce((n, e) => n + e.targets.length, 0);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Text style={s.backArrow}>←</Text>
        </Pressable>
        <View style={s.headerMid}>
          <Text style={s.headerDay}>{day.name}</Text>
          <Text style={s.headerProgress}>{doneSets} of {totalSets} sets</Text>
        </View>
        <Pressable onPress={handleFinish} hitSlop={12}>
          <Text style={s.finishBtnText}>Finish</Text>
        </Pressable>
      </View>

      <ExerciseStrip day={day} sessionState={session} onSelect={handleJump} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 180 }]}
      >
        <View style={s.exBlock}>
          <Text style={s.exName}>{ex.name}</Text>
        </View>
        <SetList day={day} sessionState={session} exIdx={exIdx} />
      </ScrollView>

      <View style={[s.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <BottomAction
          day={day}
          sessionState={session}
          input={input}
          onIncReps={() => setState({ ...state, input: { ...input, reps: input.reps + 1 } })}
          onDecReps={() => setState({ ...state, input: { ...input, reps: Math.max(1, input.reps - 1) } })}
          onIncWeight={() => setState({ ...state, input: { ...input, weight: nextWeight(input.weight, 1) } })}
          onDecWeight={() => setState({ ...state, input: { ...input, weight: nextWeight(input.weight, -1) } })}
          onLogSet={handleLogSet}
          onSkipRest={handleSkipRest}
          onNextExercise={handleNextExercise}
          onFinish={handleFinish}
        />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered: { alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyText: { fontSize: 15, color: C.sub, textAlign: 'center', lineHeight: 22 },

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
  finishBtnText: { fontSize: 14, fontWeight: '600', color: C.sub },

  strip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 8,
  },
  stripChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    gap: 7,
  },
  stripChipActive: { borderColor: C.hit, backgroundColor: C.hitBg },
  stripChipDone: { borderColor: C.border, backgroundColor: 'transparent', opacity: 0.6 },
  stripChipPressed: { opacity: 0.7 },
  stripChipName: { fontSize: 12, fontWeight: '600', color: C.text2 },
  stripChipNameActive: { color: C.hit },
  stripChipNameDone: { color: C.muted },
  stripDots: { flexDirection: 'row', gap: 4 },
  stripDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.border },
  stripDotHit: { backgroundColor: C.hit },
  stripDotMiss: { backgroundColor: C.below },
  stripDotActive: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.hit },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, gap: 20 },

  exBlock: { paddingTop: 8, gap: 4 },
  exName: { fontSize: 22, fontWeight: '700', color: C.text, letterSpacing: -0.4 },

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
  setDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border, flexShrink: 0 },
  setDotDone: { backgroundColor: C.hit },
  setDotActive: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.hit },
  setRowLabel: { fontSize: 12, color: C.sub, width: 44 },
  setRowLabelActive: { fontSize: 12, fontWeight: '600', color: C.text2, width: 44 },
  setRowLabelFuture: { fontSize: 12, color: C.muted, width: 44 },
  setRowResult: { flex: 1, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  setHit: { color: C.hit },
  setMiss: { color: C.below },
  setRowTarget: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text, textAlign: 'right' },
  setRowFutureVal: { flex: 1, fontSize: 13, color: C.muted, textAlign: 'right' },

  bottom: {
    paddingHorizontal: 18,
    paddingTop: 14,
    backgroundColor: C.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    gap: 12,
  },

  stepperRow: { flexDirection: 'row', gap: 0 },
  stepperDivider: { width: 12 },
  stepper: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  stepBtn: { width: 48, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card2 },
  stepBtnPressed: { backgroundColor: C.cardSoft },
  stepBtnText: { fontSize: 22, color: C.text, fontWeight: '300' },
  stepValue: { flex: 1, alignItems: 'center', gap: 2 },
  stepNum: { fontSize: 22, fontWeight: '700', color: C.text, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  stepLabel: { fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },

  restBlock: { alignItems: 'center', gap: 8, paddingVertical: 4 },
  restLabel: { fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  restTime: { fontSize: 48, fontWeight: '700', color: C.text, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  restBar: { width: '100%', height: 3, backgroundColor: C.faint, borderRadius: 2, overflow: 'hidden' },
  restBarFill: { height: '100%', backgroundColor: C.hit, borderRadius: 2 },
  skipBtn: { marginTop: 4, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: C.border },
  skipBtnPressed: { backgroundColor: C.card },
  skipBtnText: { fontSize: 13, fontWeight: '600', color: C.sub },

  confirmBtn: { backgroundColor: C.hit, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  confirmBtnPressed: { opacity: 0.85 },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: C.bg, letterSpacing: -0.2 },
});
