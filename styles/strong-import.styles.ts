import { StyleSheet } from 'react-native';
import { C } from '../components/spuddy/palette';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 120,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.5,
  },
  unitPill: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 4,
  },
  unitOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unitOptionActive: {
    backgroundColor: C.hitBg,
  },
  unitOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.sub,
  },
  unitOptionTextActive: {
    color: C.hit,
  },
  list: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderCurve: 'continuous',
    overflow: 'hidden',
  } as object,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  workoutName: {
    fontSize: 15,
    fontWeight: '500',
    color: C.text,
  },
  workoutMeta: {
    fontSize: 12,
    color: C.muted,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: C.borderHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: C.hit,
    borderColor: C.hit,
  },
  checkmark: {
    fontSize: 12,
    fontWeight: '700',
    color: C.bg,
  },
  importButton: {
    backgroundColor: C.hit,
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 14,
    alignItems: 'center',
  } as object,
  importButtonDisabled: {
    backgroundColor: C.cardSoft,
  },
  importButtonText: {
    color: C.bg,
    fontWeight: '600',
    fontSize: 16,
  },
  importButtonDisabledText: {
    color: C.sub,
  },
  pressed: {
    opacity: 0.8,
  },
});
