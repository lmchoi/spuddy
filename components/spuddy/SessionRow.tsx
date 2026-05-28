import { View, Text, Pressable } from 'react-native';
import { styles } from './SessionRow.styles';
import { router } from 'expo-router';
import { C } from './palette';
import { computeStats } from '@/src/domain/stats';
import type { Session } from '@/src/types';

const STATUS_COLOR = {
  exceeded: C.exceeded,
  hit:      C.hit,
  below:    C.below,
  none:     C.noTarget,
} as const;

export function sessionColor(session: Session): string {
  const { working, below, exceeded, hits } = computeStats(session);
  if (working === 0) return STATUS_COLOR.none;
  if (below > 0) return STATUS_COLOR.below;
  if (exceeded === working) return STATUS_COLOR.exceeded;
  if (hits + exceeded === working) return STATUS_COLOR.hit;
  return STATUS_COLOR.none;
}

function formatDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function relativeDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  const diff = Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / 86_400_000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff < 7) return `${diff} days ago`;
  return '';
}

interface Props {
  session: Session;
  dense?: boolean;
}

export function SessionRow({ session, dense = false }: Props) {
  const color = sessionColor(session);
  const rel = relativeDate(session.date);
  const count = session.exercises.length;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => router.push(`/(tabs)/progress/${session.date}`)}
    >
      <View style={[styles.strip, { backgroundColor: color, height: dense ? 30 : 36 }]} />
      <View style={styles.body}>
        <Text style={[styles.date, dense && styles.dateDense]}>{formatDate(session.date)}</Text>
        <Text style={styles.meta}>
          {count} exercise{count !== 1 ? 's' : ''}
          {rel ? `  ·  ${rel}` : ''}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}
