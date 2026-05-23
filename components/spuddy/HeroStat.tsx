import { View, Text, StyleSheet } from 'react-native';
import { C } from './palette';

interface Props {
  value: string | number;
  label: string;
}

export function HeroStat({ value, label }: Props) {
  return (
    <View style={styles.tile}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 9,
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
});
