import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, Text,
  TextInput, View,
} from 'react-native';
import { styles } from '@/styles/tabs/settings/programName/dayIndex.styles';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProgramDay, ProgramExercise, Target } from '@/src/types';
import { summaryLine } from '@/src/domain/programDay';
import { getDB } from '@/src/db';
import { getProgramDay, updateProgramDay } from '@/src/programStorage';
import { getExercisesLibraryData, type ExerciseLibraryRow } from '@/src/exerciseStorage';
import { renameLibraryEntry, parseMuscleGroups } from '@/src/domain/exerciseLibrary';

// ─── Cell sub-components ─────────────────────────────────────────────────────

type WeightCellProps = {
  weight: number | undefined;
  isEditing: boolean;
  onEdit: () => void;
  onClear: () => void;
  onUpdate: (val: number) => void;
  onDone: () => void;
};

function WeightCell({ weight, isEditing, onEdit, onClear, onUpdate, onDone }: WeightCellProps) {
  if (weight === undefined) return <Text style={styles.muted}>—</Text>;
  if (isEditing) return (
    <>
      <TextInput
        style={styles.cellInput}
        value={String(weight)}
        keyboardType="decimal-pad"
        onChangeText={v => { const val = parseFloat(v); if (!isNaN(val)) onUpdate(val); }}
        onBlur={onDone}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={onDone}
      />
      <Text style={styles.muted}> kg</Text>
    </>
  );
  if (weight === 0) return (
    <Pressable onPress={onClear} style={styles.bwPill}>
      <Text style={styles.bwPillText}>BW</Text>
    </Pressable>
  );
  return (
    <Pressable style={styles.weightRow} onPress={onEdit}>
      <Text style={styles.gridCell}>{weight}</Text>
      <Text style={styles.muted}> kg</Text>
    </Pressable>
  );
}

type RestCellProps = {
  restSeconds: number | null | undefined;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (val: number) => void;
  onDone: () => void;
};

function RestCell({ restSeconds, isEditing, onEdit, onUpdate, onDone }: RestCellProps) {
  if (restSeconds == null) return <Text style={styles.muted}>—</Text>;
  if (isEditing) return (
    <>
      <TextInput
        style={styles.cellInput}
        value={String(restSeconds)}
        keyboardType="numeric"
        onChangeText={v => { const val = parseInt(v, 10); if (!isNaN(val)) onUpdate(val); }}
        onBlur={onDone}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={onDone}
      />
      <Text style={styles.muted}>s</Text>
    </>
  );
  return (
    <Pressable style={styles.restRow} onPress={onEdit}>
      <Text style={styles.gridCell}>{restSeconds}</Text>
      <Text style={styles.muted}>s</Text>
    </Pressable>
  );
}

// ─── Exercise edit sheet ──────────────────────────────────────────────────────

type ExerciseEditSheetProps = {
  exIdx: number | null;
  exercises: ProgramExercise[];
  libraryRow: ExerciseLibraryRow | null;
  onRename: (exIdx: number, name: string) => void;
  onClose: () => void;
};


function ExerciseEditSheet({ exIdx, exercises, libraryRow, onRename, onClose }: ExerciseEditSheetProps) {
  const exercise = exIdx !== null ? exercises[exIdx] : null;
  const [draft, setDraft] = useState(exercise?.name ?? '');

  if (exIdx === null || !exercise) return null;

  const isMatched = libraryRow?.libraryId != null;
  const muscles = parseMuscleGroups(libraryRow?.muscleGroups ?? null);

  function handleSave() {
    if (exIdx !== null) onRename(exIdx, draft);
    onClose();
  }

  return (
    <KeyboardAvoidingView style={styles.sheetOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetSection}>
            <Text style={styles.sheetSectionLabel}>Exercise name</Text>
            <TextInput
              style={styles.sheetInput}
              value={draft}
              onChangeText={setDraft}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>
          <View style={styles.sheetSectionDivider} />
          <View style={styles.sheetSection}>
            <Text style={styles.sheetSectionLabel}>Library match</Text>
            {isMatched ? (
              <View style={styles.matchCard}>
                <View style={styles.matchCardHead}>
                  <View>
                    <Text style={styles.matchCardName}>{exercise.name}</Text>
                  </View>
                  <View style={styles.matchConfBadge}>
                    <Text style={styles.matchConfText}>{libraryRow!.libraryConfidence}%</Text>
                  </View>
                </View>
                <View style={styles.pillsRow}>
                  {muscles.map(m => (
                    <View key={m} style={styles.pillCore}>
                      <Text style={styles.pillCoreText}>{m}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.noMatchCard}>
                <Text style={styles.noMatchText}>
                  {'No library match found.\nMuscle group data won\'t appear until\nthis exercise is linked.'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.sheetBtns}>
            <Pressable style={styles.btnPrimary} onPress={handleSave}>
              <Text style={styles.btnPrimaryText}>{isMatched ? 'Save' : 'Save name'}</Text>
            </Pressable>
            <Pressable style={[styles.btnSecondary, styles.btnSecondaryDisabled]} disabled>
              <Text style={styles.btnSecondaryText}>{isMatched ? 'Change match' : 'Search library'}</Text>
            </Pressable>
          </View>
          <Pressable style={styles.btnDismiss} onPress={onClose}>
            <Text style={styles.btnDismissText}>dismiss</Text>
          </Pressable>
        </View>
    </KeyboardAvoidingView>
  );
}

// ─── Sample shown until real DB data arrives ─────────────────────────────────

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

// ─── Screen ───────────────────────────────────────────────────────────────────

type EditingCell = {
  exIdx: number;
  setIdx: number;
  field: 'reps' | 'minReps' | 'weight' | 'rest';
};

export default function ProgramDayDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { programName, dayIndex } = useLocalSearchParams<{ programName: string; dayIndex: string }>();

  const [day, setDay] = useState<ProgramDay>(SAMPLE_DAY);
  const [libraryData, setLibraryData] = useState<Map<string, ExerciseLibraryRow>>(new Map());
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [editingDayName, setEditingDayName] = useState(false);
  const [draftDayName, setDraftDayName] = useState('');
  const [sheetExIdx, setSheetExIdx] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  const name = decodeURIComponent(programName ?? '');
  const idx = parseInt(dayIndex ?? '0', 10);

  useFocusEffect(
    useCallback(() => {
      getDB()
        .then(async db => {
          const d = await getProgramDay(db, name, idx);
          if (d) {
            setDay(d);
            const rows = getExercisesLibraryData(db, d.exercises.map(e => e.name));
            setLibraryData(new Map(rows.map(r => [r.name, r])));
          }
        })
        .catch(console.error);
    }, [name, idx])
  );

  async function persistToDb(next: ProgramDay) {
    try {
      const db = await getDB();
      await updateProgramDay(db, name, idx, next);
    } catch (e) {
      console.error(e);
    }
  }

  function updateExercise(exIdx: number, updates: Partial<ProgramExercise>) {
    setDay(prev => {
      const next: ProgramDay = {
        ...prev,
        exercises: prev.exercises.map((ex, i) => i === exIdx ? { ...ex, ...updates } : ex),
      };
      persistToDb(next);
      return next;
    });
    if (updates.name) {
      const oldName = day.exercises[exIdx]?.name;
      if (oldName) setLibraryData(prev => renameLibraryEntry(prev, oldName, updates.name!));
    }
  }

  function updateTarget(exIdx: number, setIdx: number, updates: Partial<Target>) {
    setDay(prev => {
      const next: ProgramDay = {
        ...prev,
        exercises: prev.exercises.map((ex, i) => i !== exIdx ? ex : {
          ...ex,
          targets: ex.targets.map((t, j) => j !== setIdx ? t : { ...t, ...updates }),
        }),
      };
      persistToDb(next);
      return next;
    });
  }

  function addSet(exIdx: number) {
    setDay(prev => {
      const next: ProgramDay = {
        ...prev,
        exercises: prev.exercises.map((ex, i) => {
          if (i !== exIdx) return ex;
          const last = ex.targets[ex.targets.length - 1];
          return { ...ex, targets: [...ex.targets, last ? { ...last } : { reps: 8 }] };
        }),
      };
      persistToDb(next);
      return next;
    });
  }

  function removeSet(exIdx: number, setIdx: number) {
    setDay(prev => {
      const next: ProgramDay = {
        ...prev,
        exercises: prev.exercises.map((ex, i) => i !== exIdx ? ex : {
          ...ex,
          targets: ex.targets.filter((_, j) => j !== setIdx),
        }),
      };
      persistToDb(next);
      return next;
    });
    setEditingCell(null);
  }

  function deleteExercise(exIdx: number) {
    setDay(prev => {
      const next: ProgramDay = { ...prev, exercises: prev.exercises.filter((_, i) => i !== exIdx) };
      persistToDb(next);
      return next;
    });
    setExpandedIdx(null);
    setSheetExIdx(null);
    setEditingCell(null);
  }

  function addExercise() {
    setDay(prev => {
      const next: ProgramDay = {
        ...prev,
        exercises: [...prev.exercises, { name: 'New exercise', targets: [{ reps: 8 }] }],
      };
      persistToDb(next);
      return next;
    });
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
            value={draftDayName}
            onChangeText={setDraftDayName}
            onBlur={() => {
              setEditingDayName(false);
              const next = { ...day, name: draftDayName };
              setDay(next);
              persistToDb(next);
            }}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => {
              setEditingDayName(false);
              const next = { ...day, name: draftDayName };
              setDay(next);
              persistToDb(next);
            }}
          />
        ) : (
          <Pressable onPress={() => { setDraftDayName(day.name); setEditingDayName(true); }} style={styles.titlePressable}>
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
          const summary = summaryLine(exercise.targets, 'kg');
          const hasWeight = exercise.targets.some(t => t.weight !== undefined);
          const hasRest = exercise.targets.some(t => t.restSeconds != null);
          /* eslint-disable sonarjs/no-nested-conditional */
          const summaryEl = exercise.targets.length === 0
            ? <Text style={styles.noTargets}>NO TARGETS · TAP + TO ADD</Text>
            : summary
              ? <Text style={styles.exerciseSummary}>{summary}</Text>
              : null;
          /* eslint-enable sonarjs/no-nested-conditional */

          return (
            <View key={exIdx} style={styles.exerciseCard}>
              {/* Collapsed header row */}
              <Pressable
                style={({ pressed }) => [styles.exerciseHeader, pressed && styles.pressed]}
                onPress={() => setExpandedIdx(expanded ? null : exIdx)}
              >
                <Text style={styles.triangle}>{expanded ? '▾' : '▸'}</Text>

                <View style={styles.exerciseHeaderContent}>
                  <Pressable onPress={() => setSheetExIdx(exIdx)}>
                    <Text style={styles.exerciseNameTappable}>{exercise.name}</Text>
                  </Pressable>

                  {summaryEl}
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
                                  onChangeText={v => {
                                    const val = parseInt(v, 10);
                                    if (!isNaN(val)) updateTarget(exIdx, setIdx, { minReps: Math.max(1, val) });
                                  }}
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
                                  onChangeText={v => {
                                    const val = parseInt(v, 10);
                                    if (!isNaN(val)) updateTarget(exIdx, setIdx, { reps: Math.max(1, val) });
                                  }}
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
                                  onChangeText={v => {
                                    const val = parseInt(v, 10);
                                    if (!isNaN(val)) updateTarget(exIdx, setIdx, { reps: Math.max(1, val) });
                                  }}
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
                            <WeightCell
                              weight={target.weight}
                              isEditing={isWeight}
                              onEdit={() => setEditingCell({ exIdx, setIdx, field: 'weight' })}
                              onClear={() => updateTarget(exIdx, setIdx, { weight: undefined })}
                              onUpdate={val => updateTarget(exIdx, setIdx, { weight: val })}
                              onDone={() => setEditingCell(null)}
                            />
                          </View>
                        )}

                        {/* REST */}
                        {hasRest && (
                          <View style={[styles.colRest, styles.restRow]}>
                            <RestCell
                              restSeconds={target.restSeconds}
                              isEditing={isRest}
                              onEdit={() => setEditingCell({ exIdx, setIdx, field: 'rest' })}
                              onUpdate={val => updateTarget(exIdx, setIdx, { restSeconds: val })}
                              onDone={() => setEditingCell(null)}
                            />
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
      <ExerciseEditSheet
        key={sheetExIdx ?? -1}
        exIdx={sheetExIdx}
        exercises={day.exercises}
        libraryRow={sheetExIdx !== null ? (libraryData.get(day.exercises[sheetExIdx]?.name ?? '') ?? null) : null}
        onRename={(i, exName) => updateExercise(i, { name: exName })}
        onClose={() => setSheetExIdx(null)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
