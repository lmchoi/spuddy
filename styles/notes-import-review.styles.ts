import { StyleSheet } from 'react-native';
import { C } from '@/components/spuddy/palette';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: C.text2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 14,
  },
  summary: {
    fontSize: 13,
    color: C.sub,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  sectionPill: {
    alignSelf: 'flex-start',
    backgroundColor: C.hitBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sectionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.hit,
    letterSpacing: 0.1,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
  },
  exerciseRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  exerciseDot: {
    fontSize: 12,
    color: C.muted,
  },
  exerciseName: {
    fontSize: 14,
    color: C.text,
    flex: 1,
  },
  exerciseMeta: {
    fontSize: 12,
    color: C.sub,
  },
  skippedNote: {
    fontSize: 12,
    color: C.muted,
  },
  stickyBar: {
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  importBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.hit,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importBtnDisabled: {
    backgroundColor: C.cardSoft,
  },
  importBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.bg,
    letterSpacing: -0.1,
  },
  importBtnTextDisabled: {
    color: C.muted,
  },
});
