import { StyleSheet } from 'react-native';
import { C } from '@/components/spuddy/palette';

export const COL_SET = 32;
export const COL_REPS = 80;
export const COL_WEIGHT = 90;
export const COL_REST = 72;
export const COL_X = 36;

export const styles = StyleSheet.create({
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
