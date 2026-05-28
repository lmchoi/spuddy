import { StyleSheet } from 'react-native';
import { C } from './palette';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.faint,
  },
  dotActive: {
    backgroundColor: C.hit,
    opacity: 0.55,
  },
  dotToday: {
    opacity: 1,
  },
  label: {
    fontSize: 10,
    color: C.muted,
    letterSpacing: 0.3,
  },
});
