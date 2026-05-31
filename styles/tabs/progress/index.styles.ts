import { StyleSheet } from 'react-native';
import { C } from '@/components/spuddy/palette';
import { T } from '@/src/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  list: {
    paddingHorizontal: T.spacing.screenEdge,
    paddingBottom: 120,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    gap: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.5,
  },
  // Hero
  hero: {
    backgroundColor: C.card2,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 14,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroStreak: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  heroStreakNumber: {
    fontSize: 40,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -1,
    lineHeight: 44,
  },
  heroStreakUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text2,
    letterSpacing: -0.3,
  },
  heroStreakMeta: {
    gap: 2,
  },
  heroStreakLabel: {
    fontSize: 13,
    color: C.sub,
  },
  heroStreakSub: {
    fontSize: 12,
    color: C.muted,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 8,
  },
  // List
  gap: {
    height: 8,
  },
  empty: {
    paddingTop: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: C.sub,
  },
  emptyHint: {
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
  },
});
