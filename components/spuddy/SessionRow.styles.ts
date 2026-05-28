import { StyleSheet } from 'react-native';
import { C } from './palette';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowPressed: {
    backgroundColor: C.card2,
  },
  strip: {
    width: 4,
    borderRadius: 2,
    flexShrink: 0,
  },
  body: {
    flex: 1,
  },
  date: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.2,
  },
  dateDense: {
    fontSize: 13,
  },
  meta: {
    fontSize: 11,
    color: C.sub,
    marginTop: 2,
  },
  chevron: {
    fontSize: 18,
    color: C.muted,
  },
});
