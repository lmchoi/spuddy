import { StyleSheet } from 'react-native';
import { C } from '../../../components/spuddy/palette';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
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
  headerDate: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 12,
    color: C.sub,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },

  // ─── Bento
  bentoSection: {
    paddingHorizontal: 18,
    gap: 8,
    marginBottom: 14,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bento: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    position: 'relative',
  },
  bentoAccent: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bentoLabel: {
    fontSize: 10,
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  bentoSub: {
    fontSize: 11,
    color: C.sub,
    marginTop: 6,
  },
  bigNumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  bigNum: {
    fontSize: 28,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.5,
  },
  bigNumUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: C.sub,
    marginBottom: 3,
  },
  volumeNum: {
    fontSize: 22,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.4,
    marginTop: 2,
  },

  // ─── Distribution bar
  distBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: C.faint,
    marginTop: 8,
  },
  distLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  distLegendItem: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },

  // ─── Coach card
  coachCard: {
    marginHorizontal: 18,
    marginBottom: 16,
    padding: 14,
    backgroundColor: C.cardSoft,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  coachEmoji: {
    fontSize: 28,
  },
  coachText: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    lineHeight: 18,
  },

  // ─── Section heading
  sectionHeader: {
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },

  // ─── Exercise list
  exList: {
    paddingHorizontal: 18,
    gap: 8,
  },
  exRow: {
    backgroundColor: C.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  exStatusTile: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exStatusGlyph: {
    fontSize: 14,
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
  exChevron: {
    fontSize: 14,
    color: C.muted,
  },
  exChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  exBody: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },

  // ─── Set grid
  setGrid: {
    backgroundColor: C.bg2,
    borderRadius: 10,
    padding: 10,
  },
  setGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setGridHdr: {
    fontSize: 9,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingBottom: 4,
  },
  setNum: {
    width: 20,
    fontSize: 11,
    color: C.muted,
    fontVariant: ['tabular-nums'],
    paddingVertical: 3,
  },
  setActual: {
    flex: 2,
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
    fontVariant: ['tabular-nums'],
    paddingVertical: 3,
  },
  setTargetCell: {
    flex: 2,
    fontSize: 11,
    color: C.sub,
    fontVariant: ['tabular-nums'],
    paddingVertical: 3,
  },
  setStatus: {
    width: 20,
    fontSize: 12,
    textAlign: 'right',
    paddingVertical: 3,
  },

  // ─── Empty state
  empty: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: C.sub,
  },
});
