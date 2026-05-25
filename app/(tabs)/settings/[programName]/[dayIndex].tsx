import { useState } from 'react';
import {
  Pressable, ScrollView, StatusBar, StyleSheet, Text,
  TextInput, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProgramDay, ProgramExercise, Target } from '@/src/types';
import { C } from '@/components/spuddy/palette';

// ─── Sample data (swapped for real DB load in commit 4) ──────────────────────

const SAMPLE_DAY: ProgramDay = {
  name: 'Push Day',
  exercises: [
    {
      name: 'Bench Press',
      targets: [
        { reps: 5, weight: 80, restSeconds: 180 },
        { reps: 5, weight: 80, restSeconds: 180 },
        { reps: 5, weight: 80, restSeconds: 180 },
      ],
    },
    {
      name: 'Overhead Press',
      targets: [
        { reps: 12, minReps: 8, weight: 40, restSeconds: 90 },
        { reps: 12, minReps: 8, weight: 40, restSeconds: 90 },
        { reps: 12, minReps: 8, weight: 40, restSeconds: 90 },
        { reps: 12, minReps: 8, weight: 40, restSeconds: 90 },
      ],
    },
    {
      name: 'Pull-ups',
      targets: [
        { reps: 6, weight: 0 },
        { reps: 6, weight: 0 },
        { reps: 6, weight: 0 },
      ],
    },
    {
      name: 'Squat',
      targets: [],
    },
  ],
};

// ─── Inline helpers (extracted to src/domain/programDay.ts in commit 3) ───────

function fmtReps(t: Target): string {
  if (t.minReps != null) return `${t.minReps}–${t.reps}`;
  return String(t.reps);
}

export function fmtRest(s: number): string {
  if (s >= 60 && s % 60 === 0) return `${s / 60} min`;
  return `${s}s`;
}

export function summaryLine(targets: Target[]): string | null {
  if (targets.length === 0) return null;
  const sets = targets.length;
  const t0 = targets[0];

  const uniformReps = targets.every(t => t.reps === t0.reps && t.minReps === t0.minReps);
  const repsStr = uniformReps ? fmtReps(t0) : null;

  const hasWeight = targets.some(t => t.weight !== undefined);
  let weightStr = '';
  if (hasWeight) {
    const uniformWeight = targets.every(t => t.weight === t0.weight);
    if (uniformWeight && t0.weight !== undefined) {
      weightStr = t0.weight === 0 ? ' BW' : ` @ ${t0.weight} kg`;
    }
  }

  const hasRest = targets.some(t => t.restSeconds != null);
  let restStr = '';
  if (hasRest) {
    const uniformRest = targets.every(t => t.restSeconds === t0.restSeconds);
    if (uniformRest && t0.restSeconds != null) {
      restStr = ` · rest ${fmtRest(t0.restSeconds)}`;
    }
  }

  const repsDisplay = repsStr ?? '?';
  return `${sets} × ${repsDisplay}${weightStr}${restStr}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type EditingCell = {
  exIdx: number;
  setIdx: number;
  field: 'reps' | 'minReps' | 'weight' | 'rest';
};

export default function ProgramDayDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [day, setDay] = useState<ProgramDay>(SAMPLE_DAY);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [editingDayName, setEditingDayName] = useState(false);
  const [editingExName, setEditingExName] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  function updateExercise(exIdx: number, updates: Partial<ProgramExercise>) {
    setDay(d => ({
      ...d,
      exercises: d.exercises.map((ex, i) => i === exIdx ? { ...ex, ...updates } : ex),
    }));
  }

  function updateTarget(exIdx: number, setIdx: number, updates: Partial<Target>) {
    setDay(d => ({
      ...d,
      exercises: d.exercises.map((ex, i) => i !== exIdx ? ex : {
        ...ex,
        targets: ex.targets.map((t, j) => j !== setIdx ? t : { ...t, ...updates }),
      }),
    }));
  }

  function addSet(exIdx: number) {
    setDay(d => ({
      ...d,
      exercises: d.exercises.map((ex, i) => {
        if (i !== exIdx) return ex;
        const last = ex.targets[ex.targets.length - 1];
        return { ...ex, targets: [...ex.targets, last ? { ...last } : { reps: 8 }] };
      }),
    }));
  }

  function removeSet(exIdx: number, setIdx: number) {
    setDay(d => ({
      ...d,
      exercises: d.exercises.map((ex, i) => i !== exIdx ? ex : {
        ...ex,
        targets: ex.targets.filter((_, j) => j !== setIdx),
      }),
    }));
  }

  function deleteExercise(exIdx: number) {
    setDay(d => ({ ...d, exercises: d.exercises.filter((_, i) => i !== exIdx) }));
    setExpandedIdx(null);
  }

  function addExercise() {
    setDay(d => ({
      ...d,
      exercises: [...d.exercises, { name: 'New exercise', targets: [{ reps: 8 }] }],
    }));
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        {editingDayName ? (
          <TextInput
            style={styles.titleInput}
            value={day.name}
            onChangeText={name => setDay(d => ({ ...d, name }))}
            onBlur={() => setEditingDayName(false)}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => setEditingDayName(false)}
          />
        ) : (
          <Pressable onPress={() => setEditingDayName(true)} style={styles.titlePressable}>
            <Text style={styles.title}>{day.name}</Text>
          </Pressable>
        )}

        <Text style={styles.headerSub}>
          · {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {day.exercises.map((exercise, exIdx) => {
          const expanded = expandedIdx === exIdx;
          const summary = summaryLine(exercise.targets);
          const hasWeight = exercise.targets.some(t => t.weight !== undefined);
          const hasRest = exercise.targets.some(t => t.restSeconds != null);

          return (
            <View key={exIdx} style={styles.exerciseCard}>
              {/* Collapsed header row */}
              <Pressable
                style={({ pressed }) => [styles.exerciseHeader, pressed && styles.pressed]}
                onPress={() => setExpandedIdx(expanded ? null : exIdx)}
              >
                <Text style={styles.triangle}>{expanded ? '▾' : '▸'}</Text>

                <View style={styles.exerciseHeaderContent}>
                  {editingExName === exIdx ? (
                    <TextInput
                      style={styles.exerciseNameInput}
                      value={exercise.name}
                      onChangeText={name => updateExercise(exIdx, { name })}
                      onBlur={() => setEditingExName(null)}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={() => setEditingExName(null)}
                    />
                  ) : (
                    <Pressable onPress={() => { setEditingExName(exIdx); }}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                    </Pressable>
                  )}

                  {exercise.targets.length === 0 ? (
                    <Text style={styles.noTargets}>NO TARGETS · TAP + TO ADD</Text>
                  ) : summary ? (
                    <Text style={styles.exerciseSummary}>{summary}</Text>
                  ) : null}
                </View>

                <Text style={styles.chevron}>›</Text>
              </Pressable>

              {/* Expanded set grid */}
              {expanded && (
                <View style={styles.expandedSection}>
                  {/* Column headers */}
                  <View style={styles.gridRow}>
                    <Text style={[styles.gridLabel, styles.colSet]}>SET</Text>
                    <Text style={[styles.gridLabel, styles.colReps]}>REPS</Text>
                    {hasWeight && <Text style={[styles.gridLabel, styles.colWeight]}>WEIGHT</Text>}
                    {hasRest && <Text style={[styles.gridLabel, styles.colRest]}>REST</Text>}
                    <View style={styles.colX} />
                  </View>

                  {/* Set rows */}
                  {exercise.targets.map((target, setIdx) => {
                    const ec = editingCell;
                    const isReps = ec?.exIdx === exIdx && ec.setIdx === setIdx && ec.field === 'reps';
                    const isMinReps = ec?.exIdx === exIdx && ec.setIdx === setIdx && ec.field === 'minReps';
                    const isWeight = ec?.exIdx === exIdx && ec.setIdx === setIdx && ec.field === 'weight';
                    const isRest = ec?.exIdx === exIdx && ec.setIdx === setIdx && ec.field === 'rest';

                    return (
                      <View key={setIdx} style={styles.gridRow}>
                        {/* SET number */}
                        <Text style={[styles.gridCell, styles.colSet, styles.muted]}>
                          {setIdx + 1}
                        </Text>

                        {/* REPS */}
                        <View style={[styles.colReps, styles.repsRow]}>
                          {target.minReps != null ? (
                            <>
                              {isMinReps ? (
                                <TextInput
                                  style={styles.cellInput}
                                  value={String(target.minReps)}
                                  keyboardType="numeric"
                                  onChangeText={v => updateTarget(exIdx, setIdx, { minReps: Math.max(1, parseInt(v, 10) || 1) })}
                                  onBlur={() => setEditingCell(null)}
                                  autoFocus
                                  returnKeyType="done"
                                  onSubmitEditing={() => setEditingCell(null)}
                                />
                              ) : (
                                <Pressable onPress={() => setEditingCell({ exIdx, setIdx, field: 'minReps' })}>
                                  <Text style={styles.gridCell}>{target.minReps}</Text>
                                </Pressable>
                              )}
                              <Text style={styles.muted}>–</Text>
                              {isReps ? (
                                <TextInput
                                  style={styles.cellInput}
                                  value={String(target.reps)}
                                  keyboardType="numeric"
                                  onChangeText={v => updateTarget(exIdx, setIdx, { reps: Math.max(1, parseInt(v, 10) || 1) })}
                                  onBlur={() => setEditingCell(null)}
                                  autoFocus
                                  returnKeyType="done"
                                  onSubmitEditing={() => setEditingCell(null)}
                                />
                              ) : (
                                <Pressable onPress={() => setEditingCell({ exIdx, setIdx, field: 'reps' })}>
                                  <Text style={styles.gridCell}>{target.reps}</Text>
                                </Pressable>
                              )}
                            </>
                          ) : (
                            <>
                              {isReps ? (
                                <TextInput
                                  style={styles.cellInput}
                                  value={String(target.reps)}
                                  keyboardType="numeric"
                                  onChangeText={v => updateTarget(exIdx, setIdx, { reps: Math.max(1, parseInt(v, 10) || 1) })}
                                  onBlur={() => setEditingCell(null)}
                                  autoFocus
                                  returnKeyType="done"
                                  onSubmitEditing={() => setEditingCell(null)}
                                />
                              ) : (
                                <Pressable onPress={() => setEditingCell({ exIdx, setIdx, field: 'reps' })}>
                                  <Text style={styles.gridCell}>{target.reps}</Text>
                                </Pressable>
                              )}
                              <Pressable
                                style={styles.pmBtn}
                                onPress={() => updateTarget(exIdx, setIdx, { minReps: Math.max(1, target.reps - 2) })}
                              >
                                <Text style={styles.pmBtnText}>±</Text>
                              </Pressable>
                            </>
                          )}
                        </View>

                        {/* WEIGHT */}
                        {hasWeight && (
                          <View style={[styles.colWeight, styles.weightRow]}>
                            {target.weight === undefined ? (
                              <Text style={styles.muted}>—</Text>
                            ) : target.weight === 0 ? (
                              <Pressable
                                onPress={() => updateTarget(exIdx, setIdx, { weight: undefined })}
                                style={styles.bwPill}
                              >
                                <Text style={styles.bwPillText}>BW</Text>
                              </Pressable>
                            ) : isWeight ? (
                              <>
                                <TextInput
                                  style={styles.cellInput}
                                  value={String(target.weight)}
                                  keyboardType="decimal-pad"
                                  onChangeText={v => updateTarget(exIdx, setIdx, { weight: parseFloat(v) || target.weight })}
                                  onBlur={() => setEditingCell(null)}
                                  autoFocus
                                  returnKeyType="done"
                                  onSubmitEditing={() => setEditingCell(null)}
                                />
                                <Text style={styles.muted}> kg</Text>
                              </>
                            ) : (
                              <Pressable
                                style={styles.weightRow}
                                onPress={() => setEditingCell({ exIdx, setIdx, field: 'weight' })}
                              >
                                <Text style={styles.gridCell}>{target.weight}</Text>
                                <Text style={styles.muted}> kg</Text>
                              </Pressable>
                            )}
                          </View>
                        )}

                        {/* REST */}
                        {hasRest && (
                          <View style={[styles.colRest, styles.restRow]}>
                            {target.restSeconds == null ? (
                              <Text style={styles.muted}>—</Text>
                            ) : isRest ? (
                              <>
                                <TextInput
                                  style={styles.cellInput}
                                  value={String(target.restSeconds)}
                                  keyboardType="numeric"
                                  onChangeText={v => updateTarget(exIdx, setIdx, { restSeconds: parseInt(v, 10) || target.restSeconds })}
                                  onBlur={() => setEditingCell(null)}
                                  autoFocus
                                  returnKeyType="done"
                                  onSubmitEditing={() => setEditingCell(null)}
                                />
                                <Text style={styles.muted}>s</Text>
                              </>
                            ) : (
                              <Pressable
                                style={styles.restRow}
                                onPress={() => setEditingCell({ exIdx, setIdx, field: 'rest' })}
                              >
                                <Text style={styles.gridCell}>{target.restSeconds}</Text>
                                <Text style={styles.muted}>s</Text>
                              </Pressable>
                            )}
                          </View>
                        )}

                        {/* Delete set */}
                        <Pressable
                          style={[styles.colX, styles.deleteSetBtn]}
                          onPress={() => removeSet(exIdx, setIdx)}
                        >
                          <Text style={styles.deleteSetText}>×</Text>
                        </Pressable>
                      </View>
                    );
                  })}

                  {/* Action row: + Set | Delete exercise */}
                  <View style={styles.actionRow}>
                    <Pressable style={styles.addSetBtn} onPress={() => addSet(exIdx)}>
                      <Text style={styles.addSetText}>+ Set</Text>
                    </Pressable>
                    <Pressable style={styles.deleteExBtn} onPress={() => deleteExercise(exIdx)}>
                      <Text style={styles.deleteExText}>Delete exercise</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        <Pressable style={styles.addExercise} onPress={addExercise}>
          <Text style={styles.addExerciseText}>+ Add exercise</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const COL_SET = 32;
const COL_REPS = 80;
const COL_WEIGHT = 90;
const COL_REST = 72;
const COL_X = 36;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 4,
  },
  backButton: {
    padding: 8,
    minWidth: 36,
  },
  backText: {
    fontSize: 28,
    color: C.text,
    lineHeight: 32,
  },
  titlePressable: {
    flexShrink: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
    flexShrink: 1,
    borderBottomWidth: 1,
    borderBottomColor: C.borderHi,
    paddingVertical: 2,
  },
  headerSub: {
    fontSize: 13,
    color: C.sub,
  },
  // Exercise list
  list: {
    paddingHorizontal: 14,
    paddingBottom: 120,
    gap: 6,
  },
  exerciseCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderCurve: 'continuous',
    overflow: 'hidden',
  } as object,
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  triangle: {
    fontSize: 13,
    color: C.sub,
    width: 14,
  },
  exerciseHeaderContent: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '500',
    color: C.text,
  },
  exerciseNameInput: {
    fontSize: 15,
    fontWeight: '500',
    color: C.text,
    borderBottomWidth: 1,
    borderBottomColor: C.borderHi,
    paddingVertical: 1,
  },
  exerciseSummary: {
    fontSize: 12,
    color: C.sub,
  },
  noTargets: {
    fontSize: 11,
    color: C.muted,
    letterSpacing: 0.3,
  },
  chevron: {
    fontSize: 18,
    color: C.muted,
  },
  // Expanded grid
  expandedSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  gridCell: {
    fontSize: 14,
    color: C.text,
  },
  muted: {
    fontSize: 13,
    color: C.muted,
  },
  cellInput: {
    fontSize: 14,
    color: C.text,
    borderBottomWidth: 1,
    borderBottomColor: C.borderHi,
    minWidth: 28,
    paddingVertical: 1,
  },
  // Column widths
  colSet: {
    width: COL_SET,
  },
  colReps: {
    width: COL_REPS,
  },
  colWeight: {
    width: COL_WEIGHT,
  },
  colRest: {
    width: COL_REST,
  },
  colX: {
    width: COL_X,
  },
  // Compound cells
  repsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pmBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  pmBtnText: {
    fontSize: 14,
    color: C.sub,
  },
  bwPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderHi,
  },
  bwPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text2,
  },
  deleteSetBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteSetText: {
    fontSize: 16,
    color: C.muted,
  },
  // Action row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 8,
    paddingLeft: COL_SET,
  },
  addSetBtn: {
    paddingVertical: 4,
  },
  addSetText: {
    fontSize: 13,
    color: C.sub,
    fontWeight: '500',
  },
  deleteExBtn: {
    paddingVertical: 4,
  },
  deleteExText: {
    fontSize: 13,
    color: C.below,
  },
  // Add exercise footer
  addExercise: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  addExerciseText: {
    fontSize: 14,
    color: C.sub,
    fontWeight: '500',
  },
});
