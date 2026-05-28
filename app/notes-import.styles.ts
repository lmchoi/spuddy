import { StyleSheet } from 'react-native';
import { C } from '../components/spuddy/palette';

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
  textarea: {
    minHeight: 200,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    fontSize: 13,
    color: C.text,
    lineHeight: 20,
  },
  previewCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  previewRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  previewSectionName: {
    fontSize: 14,
    fontWeight: '500',
    color: C.text,
    flex: 1,
  },
  previewCount: {
    fontSize: 12,
    color: C.sub,
  },
  skippedNote: {
    fontSize: 12,
    color: C.muted,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unitLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: C.sub,
  },
  unitPills: {
    flexDirection: 'row',
    gap: 6,
  },
  unitPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  unitPillActive: {
    backgroundColor: C.hit,
    borderColor: C.hit,
  },
  unitPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text2,
  },
  unitPillTextActive: {
    color: C.bg,
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
