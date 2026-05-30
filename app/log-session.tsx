import { useEffect, useReducer, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { styles } from '@/styles/log-session.styles';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/components/spuddy/palette';
import { getDB } from '@/src/db';
import { addProgramDay, getProgramDay, getPrograms } from '@/src/programStorage';
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
  addExtraSet,
  totalSetCount,
  sessionProgress,
  resolvePostSessionAction,
  buildNewDay,
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
    <View style={styles.stepper}>
      <Pressable onPress={onDec} style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}>
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>
      <View style={styles.stepValue}>
        <Text style={styles.stepNum}>{format(value)}</Text>
        <Text style={styles.stepLabel}>{label}</Text>
      </View>
      <Pressable onPress={onInc} style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}>
        <Text style={styles.stepBtnText}>+</Text>
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
    <View style={styles.restBlock}>
      <Text style={styles.restLabel}>Rest</Text>
      <Text style={styles.restTime}>{mins}:{String(secs).padStart(2, '0')}</Text>
      <View style={styles.restBar}>
        <View style={[styles.restBarFill, { width: `${pct * 100}%` }]} />
      </View>
      <Pressable onPress={onSkip} style={({ pressed }) => [styles.skipBtn, pressed && styles.skipBtnPressed]}>
        <Text style={styles.skipBtnText}>Skip rest</Text>
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
    <View style={styles.strip}>
      {day.exercises.map((ex, i) => {
        const isActive = i === sessionState.currentExerciseIdx;
        const done = isExerciseDone(sessionState, day, i);
        const loggedCount = sessionState.loggedSets[i].length;
        const dotCount = totalSetCount(sessionState, day, i);
        return (
          <Pressable
            key={i}
            testID={`strip-chip-${i}`}
            onPress={() => onSelect(i)}
            style={({ pressed }) => [
              styles.stripChip,
              isActive && styles.stripChipActive,
              done && !isActive && styles.stripChipDone,
              pressed && styles.stripChipPressed,
            ]}
          >
            <Text
              style={[
                styles.stripChipName,
                isActive && styles.stripChipNameActive,
                done && !isActive && styles.stripChipNameDone,
              ]}
              numberOfLines={1}
            >
              {ex.name}
            </Text>
            <View style={styles.stripDots}>
              {Array.from({ length: dotCount }).map((_, si) => {
                const loggedSet = sessionState.loggedSets[i][si];
                const target = ex.targets[si]; // undefined for extra sets
                const isLogged = si < loggedCount;
                const isActiveDot = si === loggedCount && isActive && !done;

                let dotStyle;
                if (isLogged && loggedSet) {
                  dotStyle =
                    !target || loggedSet.reps >= target.reps
                      ? styles.stripDotHit
                      : styles.stripDotMiss;
                } else if (isActiveDot) {
                  dotStyle = styles.stripDotActive;
                }

                return (
                  <View
                    key={si}
                    testID={`strip-dot-${i}-${si}`}
                    style={[styles.stripDot, dotStyle]}
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
  isCurrentExercise,
  onAddSet,
}: {
  day: ProgramDay;
  sessionState: SessionState;
  exIdx: number;
  isCurrentExercise: boolean;
  onAddSet: () => void;
}) {
  const ex = day.exercises[exIdx];
  const logged = sessionState.loggedSets[exIdx];
  const showAddSet = isCurrentExercise;

  // Build a combined list: planned targets + extra set slots + any already-logged extras
  const totalRows = Math.max(
    totalSetCount(sessionState, day, exIdx),
    logged.length,
  );

  return (
    // Option C layout: outer solid-border wrapper (setCard) contains the card
    // rows (setList, card bg, overflow:hidden) and the dashed add-set button.
    // overflow:hidden on setCard clips both to the 14px rounded corners.
    <View style={styles.setCard}>
      <View style={[styles.setList, showAddSet && styles.setListOpen]}>
        {Array.from({ length: totalRows }).map((_, i) => {
          // Extra-set target: always use the last planned target so the
          // hit/miss colour is stable regardless of how the previous set went.
          // (Using logged[i-1] would penalise an exceptional set and lower the
          // bar when the user is struggling.)
          const target = i < ex.targets.length
            ? ex.targets[i]
            : ex.targets[ex.targets.length - 1];
          const loggedSet = logged[i];
          const isPast = i < logged.length;
          const isActive = i === logged.length && !isExerciseDone(sessionState, day, exIdx);

          if (isPast && loggedSet) {
            const hitTarget = loggedSet.reps >= target.reps;
            return (
              <View key={i} style={[styles.setRow, styles.setRowDone]}>
                <View style={[styles.setDot, styles.setDotDone]} />
                <Text style={styles.setRowLabel}>Set {i + 1}</Text>
                <Text style={[styles.setRowResult, hitTarget ? styles.setHit : styles.setMiss]}>
                  {loggedSet.reps} × {loggedSet.weight} kg
                </Text>
              </View>
            );
          }

          if (isActive) {
            return (
              <View key={i} style={[styles.setRow, styles.setRowActive]}>
                <View style={[styles.setDot, styles.setDotActive]} />
                <Text style={styles.setRowLabelActive}>Set {i + 1}</Text>
                <Text style={styles.setRowTarget}>{target.reps} × {target.weight ?? 0} kg</Text>
              </View>
            );
          }

          return (
            <View key={i} style={[styles.setRow, styles.setRowFuture]}>
              <View style={styles.setDot} />
              <Text style={styles.setRowLabelFuture}>Set {i + 1}</Text>
              <Text style={styles.setRowFutureVal}>{target.reps} × {target.weight ?? 0} kg</Text>
            </View>
          );
        })}
      </View>
      {showAddSet && (
        <Pressable onPress={onAddSet} style={styles.addSetRow}>
          <Text style={styles.addSetText}>+ Add set</Text>
        </Pressable>
      )}
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
  const logged = sessionState.loggedSets[exIdx].length;
  const total = totalSetCount(sessionState, day, exIdx);

  if (sessionState.isResting) {
    return <RestTimer onSkip={onSkipRest} />;
  }

  if (isSessionDone(sessionState, day)) {
    return (
      <Pressable onPress={onFinish} style={({ pressed }) => [styles.confirmBtn, pressed && styles.confirmBtnPressed]}>
        <Text style={styles.confirmBtnText}>Finish session</Text>
      </Pressable>
    );
  }

  if (isExerciseDone(sessionState, day, exIdx)) {
    const next = day.exercises[exIdx + 1];
    return (
      <Pressable onPress={next ? onNextExercise : onFinish} style={({ pressed }) => [styles.confirmBtn, pressed && styles.confirmBtnPressed]}>
        <Text style={styles.confirmBtnText}>
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
      <View style={styles.stepperRow}>
        <Stepper
          value={input.reps}
          label="reps"
          onDec={onDecReps}
          onInc={onIncReps}
          format={v => String(v)}
        />
        <View style={styles.stepperDivider} />
        <Stepper
          value={input.weight}
          label="kg"
          onDec={onDecWeight}
          onInc={onIncWeight}
          format={v => v === 0 ? 'BW' : String(v)}
        />
      </View>
      <Pressable onPress={onLogSet} style={({ pressed }) => [styles.confirmBtn, pressed && styles.confirmBtnPressed]}>
        <Text style={styles.confirmBtnText}>{label}</Text>
      </Pressable>
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type ScreenState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'ready'; day: ProgramDay; session: SessionState; input: InputState; resolvedProgramName: string };

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
        setState({ status: 'ready', day, session, input, resolvedProgramName: resolvedName });
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
    setState({ ...state, session: next, input: nextInput });
  }, [state]);

  const handleSkipRest = useCallback(() => {
    if (state.status !== 'ready') return;
    const next = skipRest(state.session);
    const nextInput = inputFromTarget(state.day, next);
    setState({ ...state, session: next, input: nextInput });
  }, [state]);

  const handleJump = useCallback((idx: number) => {
    if (state.status !== 'ready') return;
    const next = jumpToExercise(state.session, idx);
    const nextInput = inputFromTarget(state.day, next);
    setState({ ...state, session: next, input: nextInput });
  }, [state]);

  const handleNextExercise = useCallback(() => {
    if (state.status !== 'ready') return;
    const next = jumpToExercise(state.session, state.session.currentExerciseIdx + 1);
    const nextInput = inputFromTarget(state.day, next);
    setState({ ...state, session: next, input: nextInput });
  }, [state]);

  const handleAddSet = useCallback((exIdx: number) => {
    if (state.status !== 'ready') return;
    const next = addExtraSet(state.session, exIdx);
    const nextInput = inputFromTarget(state.day, next);
    setState({ ...state, session: next, input: nextInput });
  }, [state]);

  const handleFinish = useCallback(async () => {
    if (state.status !== 'ready') return;
    const { day, session, resolvedProgramName } = state;
    const today = new Date().toISOString().slice(0, 10);
    const payload = buildSavePayload(session, day, today);
    let db;
    try {
      db = await getDB();
      await saveSession(db, payload);
    } catch {
      Alert.alert('Save failed', 'Could not save your session. Please try again.');
      return;
    }
    if (resolvePostSessionAction(session, day) === 'navigate') {
      router.replace(`/progress/${today}`);
      return;
    }
    const doSave = async (name: string | null) => {
      if (name) {
        try {
          await addProgramDay(db!, resolvedProgramName, buildNewDay(session, day, name));
        } catch {
          // navigate anyway — saving the new day is best-effort
        }
      }
      router.replace(`/progress/${today}`);
    };
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Save as new program day?',
        'Your session differed from the program. Enter a name to save it as a new day.',
        doSave,
        'plain-text',
        `${day.name} (modified)`,
      );
    } else {
      Alert.alert(
        'Save as new program day?',
        'Your session differed from the program. Save it as a new day?',
        [
          { text: 'Skip', style: 'cancel', onPress: () => doSave(null) },
          { text: 'Save', onPress: () => doSave(`${day.name} (modified)`) },
        ],
      );
    }
  }, [state, router]);

  if (state.status === 'loading') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={C.hit} />
      </View>
    );
  }

  if (state.status === 'empty') {
    return (
      <View style={[styles.container, styles.centered, { padding: 40 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.emptyTitle}>No program found</Text>
        <Text style={styles.emptyText}>Import a program from Settings first.</Text>
        <Pressable onPress={() => router.back()} style={[styles.confirmBtn, { width: '100%', marginTop: 20 }]}>
          <Text style={styles.confirmBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const { day, session, input } = state;
  const exIdx = session.currentExerciseIdx;
  const ex = day.exercises[exIdx];
  const { done: doneSets, total: totalSets } = sessionProgress(session, day);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <View style={styles.headerMid}>
          <Text style={styles.headerDay}>{day.name}</Text>
          <Text style={styles.headerProgress}>{doneSets} of {totalSets} sets</Text>
        </View>
        <Pressable onPress={handleFinish} hitSlop={12}>
          <Text style={styles.finishBtnText}>Finish</Text>
        </Pressable>
      </View>

      <ExerciseStrip day={day} sessionState={session} onSelect={handleJump} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 180 }]}
      >
        <View style={styles.exBlock}>
          <Text style={styles.exName}>{ex.name}</Text>
        </View>
        <SetList
          day={day}
          sessionState={session}
          exIdx={exIdx}
          isCurrentExercise={true}
          onAddSet={() => handleAddSet(exIdx)}
        />
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
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
