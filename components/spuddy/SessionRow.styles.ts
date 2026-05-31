import { StyleSheet } from 'react-native';
import { C } from './palette';
import { T } from '@/src/theme';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: T.spacing.cardH,
    paddingVertical: T.spacing.cardV,
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
    fontSize: T.type.body,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.2,
  },
  dateDense: {
    fontSize: T.type.bodyMd,
  },
  meta: {
    fontSize: T.type.label,
    color: C.sub,
    marginTop: 2,
  },
  chevron: {
    fontSize: 18,
    color: C.muted,
  },
});
