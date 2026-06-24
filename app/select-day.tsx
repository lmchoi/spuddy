import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { styles } from '@/styles/select-day.styles';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@/components/spuddy/palette';
import { getDB } from '@/src/db';
import { getPrograms } from '@/src/programStorage';
import { summaryLine } from '@/src/domain/programDay';
import type { Program } from '@/src/types';

type ScreenState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'ready'; program: Program; selectedIndex: number };

export default function SelectDay() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [state, setState] = useState<ScreenState>({ status: 'loading' });

  useFocusEffect(
    useCallback(() => {
      async function load() {
        try {
          const db = await getDB();
          const programs = await getPrograms(db);
          if (programs.length === 0) { setState({ status: 'empty' }); return; }
          // single-program invariant: multi-program support is post-MVP
          const program = programs[0];
          setState({ status: 'ready', program, selectedIndex: Math.min(program.activeDayIndex, program.days.length - 1) });
        } catch {
          setState({ status: 'empty' });
        }
      }
      load();
    }, [])
  );

  if (state.status === 'loading') {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={C.hit} />
      </View>
    );
  }

  if (state.status === 'empty') {
    return (
      <View style={[styles.container, styles.centered, { padding: 40 }]}>
        <Text style={styles.emptyTitle}>No program found</Text>
        <Text style={styles.emptyText}>Import a program from Settings first.</Text>
        <Pressable onPress={() => router.back()} style={[styles.startBtn, { width: '100%', marginTop: 20 }]}>
          <Text style={styles.startBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const { program, selectedIndex } = state;
  const selectedDay = program.days[selectedIndex];

  function handleStart() {
    router.push(`/log-session?programId=${program.id}&dayIndex=${selectedIndex}`);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Choose day</Text>
      </View>

      <View style={styles.pillStrip}>
        {program.days.map((day, i) => {
          const isActive = i === selectedIndex;
          const isNext = i === program.activeDayIndex;
          return (
            <Pressable
              key={i}
              onPress={() => setState({ ...state, selectedIndex: i })}
              style={({ pressed }) => [
                styles.pill,
                isActive && styles.pillActive,
                pressed && styles.pillPressed,
              ]}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {day.name}
              </Text>
              {isNext && (
                <View style={styles.pillBadge}>
                  <Text style={styles.pillBadgeText}>Next up</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={styles.preview} contentContainerStyle={{ paddingBottom: 16 }}>
        <Text style={styles.previewTitle}>Exercises</Text>
        {selectedDay.exercises.map((ex, i) => (
          <View key={i} style={styles.exRow}>
            <Text style={styles.exName}>{ex.name}</Text>
            <Text style={styles.exSummary}>
              {summaryLine(ex.targets, 'kg') ?? ''}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={handleStart}
          style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
        >
          <Text style={styles.startBtnText}>Start {selectedDay.name}</Text>
        </Pressable>
      </View>
    </View>
  );
}
