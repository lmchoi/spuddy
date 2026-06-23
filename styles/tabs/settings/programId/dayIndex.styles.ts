import { StyleSheet } from 'react-native';
import { C } from '@/components/spuddy/palette';
import { T } from '@/src/theme';

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
  // Exercise name — tappable to open edit sheet
  exerciseNameTappable: {
    fontSize: 15,
    fontWeight: '500',
    color: C.text,
    textDecorationLine: 'underline',
    textDecorationColor: C.borderHi,
  } as object,
  // Exercise edit sheet
  sheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  } as object,
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  } as object,
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderTopColor: C.borderHi,
  } as object,
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: C.borderHi,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  } as object,
  sheetSection: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  sheetSectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
  },
  sheetSectionLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: C.muted,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  } as object,
  sheetInput: {
    fontSize: 16,
    fontWeight: '500',
    color: C.text,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.borderHi,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  } as object,
  matchCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
  },
  matchCardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  } as object,
  matchCardName: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
  } as object,
  matchCardSrc: {
    fontSize: 9,
    color: C.muted,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  matchConfBadge: {
    backgroundColor: C.hitBg,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  matchConfText: {
    fontSize: 9,
    fontWeight: '600',
    color: C.hit,
    letterSpacing: 1,
  } as object,
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  } as object,
  pillCore: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: C.exceededBg,
    borderWidth: 1,
    borderColor: C.border,
  },
  pillCoreText: {
    fontSize: 8,
    fontWeight: '500',
    color: C.exceeded,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as object,
  noMatchCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.border,
    borderRadius: 10,
    padding: 16,
  } as object,
  noMatchText: {
    fontSize: 11,
    color: C.muted,
    letterSpacing: 0.4,
    lineHeight: 18,
    textAlign: 'center',
  } as object,
  sheetBtns: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  } as object,
  btnPrimary: {
    flex: 1,
    backgroundColor: C.hit,
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: 'center',
  } as object,
  btnPrimaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#162006',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  } as object,
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 9,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  } as object,
  btnSecondaryText: {
    fontSize: 11,
    color: C.sub,
    letterSpacing: 1,
  },
  btnSecondaryDisabled: {
    opacity: 0.35,
  },
  btnDismiss: {
    width: '100%',
    paddingBottom: 20,
    alignItems: 'center',
  } as object,
  btnDismissText: {
    fontSize: 10,
    color: C.muted,
    letterSpacing: 1,
  },
  sheetSearchResults: {
    maxHeight: 280,
  },
  sheetSearchRow: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  sheetSearchRowText: {
    fontSize: 15,
    color: C.text,
  },
  // Add exercise sheet
  addExerciseOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  } as object,
  addExerciseSheetPanel: {
    backgroundColor: C.bg2,
    borderTopWidth: 1, borderTopColor: C.border,
    borderRadius: 24, borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    padding: 20, paddingBottom: 40,
    gap: 12,
    maxHeight: '70%',
  } as object,
  addExerciseSheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: 'center', marginBottom: 4,
  } as object,
  addExerciseSheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  } as object,
  addExerciseSheetTitle: { fontSize: 15, fontWeight: '700', color: C.text } as object,
  addExerciseSheetCancel: { fontSize: 14, fontWeight: '400', color: C.muted } as object,
  addExerciseSheetHeaderSpacer: { width: 40 },
  addExerciseSheetNameInput: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, padding: 12,
    fontSize: 15, color: C.text,
  } as object,
  addExerciseSheetHistoryList: { marginTop: 4 },
  addExerciseSheetHistoryRow: {
    paddingVertical: 13,
    paddingHorizontal: T.spacing.screenEdge,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  addExerciseSheetHistoryRowText: { fontSize: 15, color: C.text },
  addExerciseSheetCreateRowText: { color: C.hit, fontWeight: '600' as const },
  addExerciseSheetSectionHeader: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: C.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    paddingTop: 14,
    paddingBottom: 4,
    paddingHorizontal: T.spacing.screenEdge,
  },
});
