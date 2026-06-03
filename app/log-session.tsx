import { useEffect, useReducer, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { styles } from '@/styles/log-session.styles';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/components/spuddy/palette';
import { getDB } from '@/src/db';
import { addProgramDay, getProgramDay, getProgramTotalDays, getPrograms, updateActiveDayIndex } from '@/src/programStorage';
import { nextActiveDayIndex } from '@/src/domain/programDay';
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
  reconcileDraft,
  type SessionState,
} from '@/src/domain/sessionLogger';
import { DEFAULT_REST_SECONDS } from '@/src/types';
import { presentRestExpiredNotification, setupNotificationChannel } from '@/src/notifications';
import type { ProgramDay } from '@/src/types';
import { nextWeight } from '@/src/domain/nextWeight';
import { draftKey, loadDraft, saveDraft, clearDraft } from '@/src/sessionDraft';
import { getExerciseNote, setExerciseNote } from '@/src/exerciseStorage';

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

function RestTimer({ duration, onSkip }: { duration: number; onSkip: () => void }) {
  const effectiveDuration = __DEV__ ? Math.min(duration, 5) : duration;
  const [endsAt] = useState(() => Date.now() + effectiveDuration * 1000);
  const [remaining, setRemaining] = useState(effectiveDuration);

  const recalc = useCallback(() => {
    setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
  }, [endsAt]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') recalc();
    });
    return () => sub.remove();
  }, [recalc]);

  useEffect(() => {
    if (remaining === 0) {
      presentRestExpiredNotification();
      onSkip();
      return;
    }
    const t = setTimeout(recalc, 1000);
    return () => clearTimeout(t);
  }, [remaining, onSkip, recalc]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = effectiveDuration > 0 ? remaining / effectiveDuration : 0;

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

// ─── NoteRow ──────────────────────────────────────────────────────────────────

function NoteRow({ note, onPress }: { note: string | null; onPress: () => void }) {
  if (note) {
    return (
      <View style={styles.noteBtnFilled}>
        <Text style={styles.noteBtnText}>{note}</Text>
        <Pressable onPress={onPress} style={styles.noteBtnEdit}>
          <Text style={styles.noteBtnEditText}>Edit</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <Pressable onPress={onPress} style={styles.noteAddBtn}>
      <Text style={styles.noteAddBtnText}>Add note</Text>
    </Pressable>
  );
}

// ─── NoteSheet ────────────────────────────────────────────────────────────────

function NoteSheet({
  exerciseName,
  initialText,
  onDone,
  onCancel,
}: {
  exerciseName: string;
  initialText: string;
  onDone: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initialText);
  return (
    <KeyboardAvoidingView
      style={styles.noteOverlay}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Pressable
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        onPress={onCancel}
      />
      <Pressable style={styles.noteSheet} onPress={() => {}}>
        <View style={styles.noteSheetHandle} />
        <View style={styles.noteSheetHeader}>
          <Pressable onPress={onCancel}>
            <Text style={styles.noteSheetCancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.noteSheetTitle}>{exerciseName}</Text>
          <Pressable onPress={() => onDone(text)}>
            <Text style={styles.noteSheetDone}>Done</Text>
          </Pressable>
        </View>
        <TextInput
          style={styles.noteInput}
          value={text}
          onChangeText={setText}
          placeholder="Add a cue, reminder, or technique note…"
          placeholderTextColor={C.muted}
          multiline
          autoFocus
        />
        <Text style={styles.noteSheetHint}>Saved to this exercise — shows every session.</Text>
      </Pressable>
    </KeyboardAvoidingView>
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
    const targets = day.exercises[exIdx].targets;
    const lastTarget = targets[Math.min(logged - 1, targets.length - 1)];
    const restDuration = lastTarget?.restSeconds ?? DEFAULT_REST_SECONDS;
    return <RestTimer duration={restDuration} onSkip={onSkipRest} />;
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
  | { status: 'ready'; day: ProgramDay; session: SessionState; input: InputState; resolvedProgramName: string; resolvedDayIndex: number; totalDays: number; key: string; notes: Record<number, string> };

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
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  useEffect(() => {
    async function load() {
      try {
        const db = await getDB();
        let resolvedName = programName;
        let resolvedDayIndex = Number(dayIndex ?? 0);
        let totalDays = 0;
        if (!resolvedName) {
          const programs = await getPrograms(db);
          if (programs.length === 0) { setState({ status: 'empty' }); return; }
          resolvedName = programs[0].name;
          resolvedDayIndex = programs[0].activeDayIndex;
          totalDays = programs[0].days.length;
        } else {
          totalDays = await getProgramTotalDays(db, resolvedName);
        }
        const day = await getProgramDay(db, resolvedName, resolvedDayIndex);
        if (!day) { setState({ status: 'empty' }); return; }
        const key = draftKey(resolvedName, resolvedDayIndex);
        const draft = await loadDraft(key);
        const session = draft ? reconcileDraft(draft, day) : initSession(day);
        const input = inputFromTarget(day, session);
        const notes: Record<number, string> = {};
        for (const ex of day.exercises) {
          if (ex.exerciseId !== undefined) {
            const note = getExerciseNote(db, ex.exerciseId);
            if (note) notes[ex.exerciseId] = note;
          }
        }
        setState({ status: 'ready', day, session, input, resolvedProgramName: resolvedName, resolvedDayIndex, totalDays, key, notes });
        setupNotificationChannel();
      } catch {
        setState({ status: 'empty' });
      }
    }
    load();
  }, [programName, dayIndex]);

  const handleLogSet = useCallback(() => {
    if (state.status !== 'ready') return;
    const { day, session, input, key } = state;
    const exIdx = session.currentExerciseIdx;
    const next = logSet(session, exIdx, input.reps, input.weight);
    const nextInput = inputFromTarget(day, next);
    saveDraft(key, next);
    setState({ ...state, session: next, input: nextInput });
  }, [state]);

  const handleSkipRest = useCallback(() => {
    if (state.status !== 'ready') return;
    const next = skipRest(state.session);
    const nextInput = inputFromTarget(state.day, next);
    saveDraft(state.key, next);
    setState({ ...state, session: next, input: nextInput });
  }, [state]);

  const handleJump = useCallback((idx: number) => {
    if (state.status !== 'ready') return;
    const next = jumpToExercise(state.session, idx);
    const nextInput = inputFromTarget(state.day, next);
    saveDraft(state.key, next);
    setState({ ...state, session: next, input: nextInput });
  }, [state]);

  const handleNextExercise = useCallback(() => {
    if (state.status !== 'ready') return;
    const next = jumpToExercise(state.session, state.session.currentExerciseIdx + 1);
    const nextInput = inputFromTarget(state.day, next);
    saveDraft(state.key, next);
    setState({ ...state, session: next, input: nextInput });
  }, [state]);

  const handleAddSet = useCallback((exIdx: number) => {
    if (state.status !== 'ready') return;
    const next = addExtraSet(state.session, exIdx);
    const nextInput = inputFromTarget(state.day, next);
    saveDraft(state.key, next);
    setState({ ...state, session: next, input: nextInput });
  }, [state]);

  const handleSaveNote = useCallback(async (text: string) => {
    if (state.status !== 'ready') return;
    const ex = state.day.exercises[state.session.currentExerciseIdx];
    if (ex.exerciseId === undefined) return;
    const db = await getDB();
    const trimmed = text.trim() || null;
    setExerciseNote(db, ex.exerciseId, trimmed);
    const notes = { ...state.notes };
    if (trimmed) {
      notes[ex.exerciseId] = trimmed;
    } else {
      delete notes[ex.exerciseId];
    }
    setState({ ...state, notes });
    setNoteSheetOpen(false);
  }, [state]);

  const handleFinish = useCallback(async () => {
    if (state.status !== 'ready') return;
    const { day, session, resolvedProgramName, resolvedDayIndex, totalDays, key } = state;
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
    await clearDraft(key).catch(() => {});
    if (totalDays > 0) {
      const nextIdx = nextActiveDayIndex(resolvedDayIndex, totalDays);
      try { updateActiveDayIndex(db, resolvedProgramName, nextIdx); } catch {}
    }
    if (resolvePostSessionAction(session) === 'navigate') {
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

  const { day, session, input, notes } = state;
  const exIdx = session.currentExerciseIdx;
  const ex = day.exercises[exIdx];
  const { done: doneSets, total: totalSets } = sessionProgress(session, day);
  const currentNote = ex.exerciseId !== undefined ? (notes[ex.exerciseId] ?? null) : null;

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

      <View pointerEvents={noteSheetOpen ? 'none' : 'auto'}>
        <ExerciseStrip day={day} sessionState={session} onSelect={handleJump} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 180 }]}
      >
        <View style={styles.exBlock}>
          <Text style={styles.exName}>{ex.name}</Text>
          {ex.exerciseId !== undefined && (
            <NoteRow note={currentNote} onPress={() => setNoteSheetOpen(true)} />
          )}
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

      {noteSheetOpen && (
        <NoteSheet
          exerciseName={ex.name}
          initialText={currentNote ?? ''}
          onDone={handleSaveNote}
          onCancel={() => setNoteSheetOpen(false)}
        />
      )}
    </View>
  );
}
