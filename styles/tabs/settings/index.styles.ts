import { StyleSheet } from 'react-native';
import { C } from '../../../components/spuddy/palette';

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
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.5,
    paddingTop: 8,
  },
  empty: {
    fontSize: 14,
    color: C.sub,
  },
  programSection: {
    gap: 8,
  },
  programName: {
    fontSize: 13,
    fontWeight: '600',
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  dayList: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderCurve: 'continuous',
    overflow: 'hidden',
  } as object,
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dayRowPressed: {
    opacity: 0.7,
  },
  dayRowContent: {
    flex: 1,
  },
  dayName: {
    fontSize: 15,
    fontWeight: '500',
    color: C.text,
  },
  exerciseList: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 18,
    color: C.muted,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginHorizontal: 14,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  dataList: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderCurve: 'continuous',
    overflow: 'hidden',
  } as object,
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dataRowPressed: {
    opacity: 0.7,
  },
  dataRowDisabled: {
    opacity: 0.5,
  },
  dataRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: C.text,
  },
  dataRowTextDisabled: {
    color: C.sub,
  },
  dataRowChevron: {
    fontSize: 18,
    color: C.muted,
  },
  dataSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginLeft: 14,
  },
});
