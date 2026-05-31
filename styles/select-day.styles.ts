import { StyleSheet } from 'react-native';
import { C } from '@/components/spuddy/palette';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered: { alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyText: { fontSize: 15, color: C.sub, textAlign: 'center', lineHeight: 22 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: C.text2 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: -0.3 },

  pillStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    gap: 6,
  },
  pillActive: { borderColor: C.hit, backgroundColor: C.hitBg },
  pillPressed: { opacity: 0.7 },
  pillText: { fontSize: 13, fontWeight: '600', color: C.text2 },
  pillTextActive: { color: C.hit },
  pillBadge: {
    backgroundColor: C.hit,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pillBadgeText: { fontSize: 10, fontWeight: '700', color: C.bg },

  preview: {
    flex: 1,
    marginHorizontal: 18,
    marginBottom: 16,
  },
  previewTitle: { fontSize: 13, fontWeight: '600', color: C.muted, marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  exName: { flex: 1, fontSize: 15, fontWeight: '600', color: C.text },
  exSummary: { fontSize: 13, color: C.sub },

  bottom: {
    paddingHorizontal: 18,
  },
  startBtn: {
    backgroundColor: C.hit,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  startBtnPressed: { opacity: 0.85 },
  startBtnText: { fontSize: 16, fontWeight: '700', color: C.bg },
});
