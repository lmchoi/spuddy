import { useCallback, useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDB } from '@/src/db';
import { getProgramDay } from '@/src/programStorage';
import type { ProgramDay } from '@/src/types';
import { C } from '@/components/spuddy/palette';

export default function ProgramDayDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { programName, dayIndex } = useLocalSearchParams<{ programName: string; dayIndex: string }>();
  const [day, setDay] = useState<ProgramDay | null>(null);

  useFocusEffect(
    useCallback(() => {
      const name = decodeURIComponent(programName ?? '');
      const idx = parseInt(dayIndex ?? '0', 10);
      getDB()
        .then(db => getProgramDay(db, name, idx))
        .then(setDay)
        .catch(console.error);
    }, [programName, dayIndex])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{day?.name ?? '…'}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.body}>
        <Text style={styles.placeholder}>
          {day
            ? `${day.exercises.length} exercise${day.exercises.length !== 1 ? 's' : ''}`
            : 'Loading…'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    minWidth: 44,
  },
  backText: {
    fontSize: 28,
    color: C.text,
    lineHeight: 32,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
    textAlign: 'center',
  },
  headerSpacer: {
    minWidth: 44,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 14,
    color: C.sub,
  },
});
