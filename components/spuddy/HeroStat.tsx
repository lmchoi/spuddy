import { View, Text } from 'react-native';
import { C } from './palette';
import { styles } from './HeroStat.styles';

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
