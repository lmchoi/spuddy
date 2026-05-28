import { StyleSheet } from 'react-native';
import { C } from '@/components/spuddy/palette';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ─── Header
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
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 12,
    color: C.sub,
    marginTop: 1,
  },
  stateChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  stateChipText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ─── Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 14,
  },

  // ─── Empty hero
  hero: {
    alignItems: 'center',
    paddingTop: 24,
    gap: 8,
  },
  heroHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.2,
    marginTop: 6,
  },
  heroBody: {
    fontSize: 13,
    color: C.sub,
    textAlign: 'center',
  },

  // ─── Textarea
  textarea: {
    minHeight: 140,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    fontSize: 13,
    color: C.text,
    lineHeight: 20,
  },
  textareaEmpty: {
    minHeight: 220,
  },

  // ─── Duplicate banner
  bannerWrapper: {},
  dupBanner: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: C.exceededBg,
    borderWidth: 1,
    borderColor: `${C.exceeded}55`,
    alignItems: 'flex-start',
  },
  dupIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${C.exceeded}33`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dupIconText: {
    color: C.exceeded,
    fontSize: 14,
    fontWeight: '700',
  },
  dupBody: {
    flex: 1,
    minWidth: 0,
  },
  dupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
  },
  dupSub: {
    fontSize: 12,
    color: C.sub,
    marginTop: 2,
  },
  dupActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  pillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${C.text2}55`,
  },
  pillBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text2,
  },
  pillBtnMuted: {
    borderColor: `${C.sub}55`,
  },
  pillBtnMutedText: {
    color: C.sub,
  },

  // ─── Error banner
  errBanner: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: C.belowBg,
    borderWidth: 1,
    borderColor: `${C.below}55`,
  },
  errHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: `${C.below}33`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  errIconText: {
    color: C.below,
    fontSize: 12,
    fontWeight: '700',
  },
  errTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: C.below,
  },
  errLog: {
    marginTop: 10,
    gap: 6,
  },
  errLogRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  errDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.below,
    marginTop: 5,
    flexShrink: 0,
  },
  errDotWarn: {
    backgroundColor: C.exceeded,
  },
  errLogText: {
    flex: 1,
  },
  errRaw: {
    fontSize: 12,
    color: C.text2,
    fontFamily: 'monospace',
  },
  errNote: {
    fontSize: 11,
    color: C.sub,
    marginTop: 1,
  },

  // ─── Preview card
  previewCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 12,
  },

  // ─── Exercise row
  exRow: {},
  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  exHeaderText: {
    flex: 1,
  },
  exName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  exMeta: {
    fontSize: 11,
    color: C.sub,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  exWarmup: {
    color: C.muted,
  },
  exChevron: {
    fontSize: 14,
    color: C.muted,
  },
  exChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  exBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: C.card2,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.text2,
    fontVariant: ['tabular-nums'],
  },
  chipTarget: {
    backgroundColor: 'transparent',
    borderColor: `${C.muted}80`,
  },
  chipTargetText: {
    color: C.sub,
  },
  exWarmupLine: {
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },

  // ─── Sticky bar
  stickyBar: {
    flexDirection: 'column',
    gap: 8,
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  cancelBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text2,
  },
  ghostBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text2,
  },
  primaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.hit,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    backgroundColor: C.cardSoft,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.bg,
    letterSpacing: -0.1,
  },
  primaryBtnDisabledText: {
    color: C.muted,
  },

  // ─── Saved state
  savedBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 36,
  },
  savedSpuddy: {
    position: 'relative',
    marginBottom: 8,
  },
  savedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.hit,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.bg,
  },
  savedBadgeText: {
    fontSize: 14,
    color: C.bg,
    fontWeight: '700',
  },
  savedHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
  },
  savedSub: {
    fontSize: 14,
    color: C.sub,
    textAlign: 'center',
  },
  savedActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
});
