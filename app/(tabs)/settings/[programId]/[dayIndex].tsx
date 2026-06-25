import { useEffect, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, Text,
  TextInput, View,
} from 'react-native';
import { styles } from '@/styles/tabs/settings/programId/dayIndex.styles';
import { C } from '@/components/spuddy/palette';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProgramDay } from '@/src/hooks/useProgramDay';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProgramDay, ProgramExercise, Target } from '@/src/types';
import { summaryLine } from '@/src/domain/programDay';
import { getDB } from '@/src/db';
import { updateProgramDay } from '@/src/programStorage';
import { getAllExerciseNames, type ExerciseLibraryRow } from '@/src/exerciseStorage';
import { resolveOrCreateExercise } from '@/src/storage';
import { renameLibraryEntry, parseMuscleGroups, matchById } from '@/src/domain/exerciseLibrary';
import { searchExercisePicker } from '@/src/domain/searchExercisePicker';
import { searchLibrary } from '@/src/domain/searchLibrary';
import { setExerciseLibraryLink } from '@/src/exerciseStorage';
import * as Sentry from '@sentry/react-native';
import { posthog } from '@/src/config/posthog';

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
  onLink: (libraryId: string) => void;
  onClose: () => void;
};


function ExerciseEditSheet({ exIdx, exercises, libraryRow, onRename, onLink, onClose }: ExerciseEditSheetProps) {
  const exercise = exIdx !== null ? exercises[exIdx] : null;
  const [draft, setDraft] = useState(exercise?.name ?? '');
  const [mode, setMode] = useState<'edit' | 'search'>('edit');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingLinkId, setPendingLinkId] = useState<string | null>(null);

  if (exIdx === null || !exercise) return null;

  const effectiveLibraryId = pendingLinkId ?? libraryRow?.libraryId ?? null;
  const isMatched = effectiveLibraryId != null;
  const libraryEntry = isMatched ? matchById(effectiveLibraryId!) : null;
  const muscles = libraryEntry
    ? parseMuscleGroups(JSON.stringify(libraryEntry.primaryMuscles))
    : parseMuscleGroups(libraryRow?.muscleGroups ?? null);
  const confidence = pendingLinkId ? 100 : (libraryRow?.libraryConfidence ?? 100);

  function handleSave() {
    if (pendingLinkId) onLink(pendingLinkId);
    if (exIdx !== null) onRename(exIdx, draft);
    onClose();
  }

  function handlePickResult(libraryId: string) {
    setPendingLinkId(libraryId);
    setMode('edit');
    setSearchQuery('');
  }

  function handleDismissSearch() {
    setMode('edit');
    setSearchQuery('');
  }

  return (
    <KeyboardAvoidingView style={styles.sheetOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable style={styles.sheetBackdrop} onPress={mode === 'search' ? handleDismissSearch : onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        {mode === 'search' ? (
          <>
            <View style={styles.sheetSection}>
              <TextInput
                style={styles.sheetInput}
                placeholder="Search library"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
            </View>
            <FlatList
              data={searchLibrary(searchQuery)}
              keyExtractor={item => item.libraryId}
              style={styles.sheetSearchResults}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable style={styles.sheetSearchRow} onPress={() => handlePickResult(item.libraryId)}>
                  <Text style={styles.sheetSearchRowText}>{item.name}</Text>
                </Pressable>
              )}
            />
            <Pressable style={styles.btnDismiss} onPress={handleDismissSearch}>
              <Text style={styles.btnDismissText}>dismiss</Text>
            </Pressable>
          </>
        ) : (
          <>
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
                      <Text style={styles.matchCardName}>{libraryEntry?.name ?? exercise.name}</Text>
                    </View>
                    <View style={styles.matchConfBadge}>
                      <Text style={styles.matchConfText}>{confidence}%</Text>
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
              {isMatched ? (
                <Pressable style={styles.btnSecondary} onPress={() => setMode('search')}>
                  <Text style={styles.btnSecondaryText}>Change match</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.btnSecondary} onPress={() => setMode('search')}>
                  <Text style={styles.btnSecondaryText}>Search library</Text>
                </Pressable>
              )}
            </View>
            <Pressable style={styles.btnDismiss} onPress={onClose}>
              <Text style={styles.btnDismissText}>dismiss</Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Add exercise sheet ───────────────────────────────────────────────────────

export function AddExerciseSheet({
  onAdd,
  onCancel,
}: {
  onAdd: (name: string, libraryId?: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const trimmed = name.trim();

  useEffect(() => {
    getDB().then(db => {
      setHistory(getAllExerciseNames(db));
    }).catch(() => {});
  }, []);

  const { history: filteredHistory, library } = searchExercisePicker(history, trimmed);
  const hasExactMatch =
    filteredHistory.some(n => n.toLowerCase() === trimmed.toLowerCase()) ||
    library.some(n => n.name.toLowerCase() === trimmed.toLowerCase());
  const showCreate = trimmed.length > 0 && !hasExactMatch;

  type ListItem =
    | { kind: 'history'; name: string }
    | { kind: 'section-header'; label: string }
    | { kind: 'library'; name: string; libraryId?: string }
    | { kind: 'create'; name: string };

  const listData: ListItem[] = [
    ...filteredHistory.map(n => ({ kind: 'history' as const, name: n })),
    ...(library.length > 0 ? [{ kind: 'section-header' as const, label: 'From library' }] : []),
    ...library.map(n => ({ kind: 'library' as const, name: n.name, libraryId: n.libraryId })),
    ...(showCreate ? [{ kind: 'create' as const, name: trimmed }] : []),
  ];

  return (
    <KeyboardAvoidingView
      style={styles.addExerciseOverlay}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Pressable
        testID="add-exercise-sheet-backdrop"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        onPress={onCancel}
      />
      <Pressable style={styles.addExerciseSheetPanel} onPress={() => {}}>
        <View style={styles.addExerciseSheetHandle} />
        <View style={styles.addExerciseSheetHeader}>
          <Pressable onPress={onCancel}>
            <Text style={styles.addExerciseSheetCancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.addExerciseSheetTitle}>Add exercise</Text>
          <View style={styles.addExerciseSheetHeaderSpacer} />
        </View>
        <TextInput
          style={styles.addExerciseSheetNameInput}
          value={name}
          onChangeText={setName}
          placeholder="Exercise name"
          placeholderTextColor={C.muted}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => trimmed && onAdd(trimmed)}
        />
        {listData.length > 0 && (
          <FlatList
            data={listData}
            keyExtractor={item => {
              if (item.kind === 'section-header') return 'section-header:' + item.label;
              if (item.kind === 'library') return 'library:' + (item.libraryId ?? item.name);
              return item.kind + ':' + item.name;
            }}
            style={styles.addExerciseSheetHistoryList}
            initialNumToRender={30}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              if (item.kind === 'section-header') {
                return <Text style={styles.addExerciseSheetSectionHeader}>{item.label}</Text>;
              }
              return (
                <Pressable
                  style={styles.addExerciseSheetHistoryRow}
                  onPress={() => {
                    if (item.kind === 'library') {
                      onAdd(item.name, item.libraryId);
                    } else {
                      onAdd(item.name);
                    }
                  }}
                >
                  <Text style={[
                    styles.addExerciseSheetHistoryRowText,
                    item.kind === 'create' && styles.addExerciseSheetCreateRowText,
                  ]}>
                    {item.kind === 'create' ? `Create '${item.name}'` : item.name}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
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
  const { programId, dayIndex } = useLocalSearchParams<{ programId: string; dayIndex: string }>();

  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [editingDayName, setEditingDayName] = useState(false);
  const [draftDayName, setDraftDayName] = useState('');
  const [sheetExIdx, setSheetExIdx] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [addExerciseSheetOpen, setAddExerciseSheetOpen] = useState(false);

  const pId = parseInt(programId ?? '0', 10);
  const idx = parseInt(dayIndex ?? '0', 10);

  const { day, setDay, libraryData, setLibraryData } = useProgramDay(pId, idx);

  async function persistToDb(next: ProgramDay) {
    try {
      const db = await getDB();
      await updateProgramDay(db, pId, idx, next);
    } catch (e) {
      console.error(e);
    }
  }

  function commitDayName() {
    setEditingDayName(false);
    const next = { ...day, name: draftDayName };
    setDay(next);
    persistToDb(next);
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

  function handleLibraryLink(exerciseName: string, libraryId: string) {
    const entry = matchById(libraryId);
    if (!entry) return;
    const muscleGroups = JSON.stringify(entry.primaryMuscles);
    const equipment = entry.equipment ?? '';
    const isChange = libraryData.get(exerciseName)?.libraryId != null;
    posthog.capture('library_link_set', { exercise: exerciseName, library_id: libraryId, is_change: isChange });
    getDB().then(db => {
      setExerciseLibraryLink(db, exerciseName, libraryId, muscleGroups, equipment);
      setLibraryData(prev => {
        const next = new Map(prev);
        next.set(exerciseName, {
          name: exerciseName,
          libraryId,
          muscleGroups,
          equipment: entry.equipment ?? null,
          libraryConfidence: 100,
        });
        return next;
      });
    }).catch(console.error);
  }

  function handleAddExercise(name: string, libraryId?: string) {
    Sentry.addBreadcrumb({ category: 'exercise', message: 'Exercise added', level: 'info' });
    posthog.capture('exercise_added', { source: libraryId ? 'library' : 'custom', exercise: name, source_screen: 'program_editor' });
    setDay(prev => {
      const next: ProgramDay = {
        ...prev,
        exercises: [...prev.exercises, { name, targets: [{ reps: 8 }] }],
      };
      persistToDb(next);
      return next;
    });
    if (libraryId) {
      getDB().then(db => resolveOrCreateExercise(db, name, libraryId)).catch(() => {});
    }
    setAddExerciseSheetOpen(false);
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
            onBlur={commitDayName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={commitDayName}
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

        <Pressable style={styles.addExercise} onPress={() => setAddExerciseSheetOpen(true)}>
          <Text style={styles.addExerciseText}>+ Add exercise</Text>
        </Pressable>
      </ScrollView>
      <ExerciseEditSheet
        key={sheetExIdx ?? -1}
        exIdx={sheetExIdx}
        exercises={day.exercises}
        libraryRow={sheetExIdx !== null ? (libraryData.get(day.exercises[sheetExIdx]?.name ?? '') ?? null) : null}
        onRename={(i, exName) => updateExercise(i, { name: exName })}
        onLink={(libraryId) => {
          if (sheetExIdx === null) return;
          handleLibraryLink(day.exercises[sheetExIdx].name, libraryId);
        }}
        onClose={() => setSheetExIdx(null)}
      />
      {addExerciseSheetOpen && (
        <AddExerciseSheet
          onAdd={handleAddExercise}
          onCancel={() => setAddExerciseSheetOpen(false)}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
