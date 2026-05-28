import { View, Text } from 'react-native';
import { styles } from './ActivityStrip.styles';

interface Props {
  sessions: { date: string }[];
}

export function ActivityStrip({ sessions }: Props) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getTime() - (6 - i) * 86_400_000);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      label: d.toLocaleDateString('en-GB', { weekday: 'narrow' }),
      active: sessions.some(s => s.date === dateStr),
      isToday: i === 6,
    };
  });

  return (
    <View style={styles.row}>
      {days.map((day, i) => (
        <View key={i} style={styles.col}>
          <View style={[styles.dot, day.active && styles.dotActive, day.isToday && day.active && styles.dotToday]} />
          <Text style={styles.label}>{day.label}</Text>
        </View>
      ))}
    </View>
  );
}
