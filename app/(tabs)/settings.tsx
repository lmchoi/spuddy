import { useState, useCallback } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDB } from '@/src/db';
import { importProgramFromJson } from '@/src/programImport';
import { getPrograms } from '@/src/programStorage';
import type { Program } from '@/src/types';
import { C } from '@/components/spuddy/palette';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [importing, setImporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getDB().then(db => getPrograms(db)).then(setPrograms).catch(console.error);
    }, [])
  );

  async function handleImport() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    setImporting(true);
    try {
      const uri = result.assets[0].uri;
      const text = await fetch(uri).then(r => r.text());
      const json = JSON.parse(text);
      const db = await getDB();
      const importResult = await importProgramFromJson(db, json);

      if (importResult.success) {
        setPrograms(importResult.programs);
        const summary = importResult.programs
          .map(p => `${p.name} (${p.days.length} days)`)
          .join(', ');
        Alert.alert('Programs imported', summary);
      } else {
        Alert.alert('Import failed', importResult.error);
      }
    } catch {
      Alert.alert('Import failed', 'Could not read or parse the file.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Settings</Text>

        {/* DEV — remove before ship */}
        <Pressable
          style={styles.devBtn}
          onPress={() => router.push('/session-mockup')}
        >
          <Text style={styles.devBtnText}>🥔 Session logging mockup</Text>
        </Pressable>

        {programs.length === 0 ? (
          <Text style={styles.empty}>No programs loaded</Text>
        ) : (
          programs.map(program => (
            <View key={program.name} style={styles.programSection}>
              <Text style={styles.programName}>{program.name}</Text>
              <View style={styles.dayList}>
                {program.days.map((day, index) => (
                  <View key={index} style={styles.dayRow}>
                    <Text style={styles.dayName}>{day.name}</Text>
                    <Text style={styles.exerciseList} numberOfLines={1}>
                      {day.exercises.map(e => e.name).join(' · ')}
                    </Text>
                    {index < program.days.length - 1 && <View style={styles.separator} />}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        <Pressable
          style={({ pressed }) => [
            styles.importButton,
            pressed && styles.importButtonPressed,
            importing && styles.importButtonDisabled,
          ]}
          onPress={handleImport}
          disabled={importing}
        >
          <Text style={[styles.importButtonText, importing && styles.importButtonDisabledText]}>
            {importing ? 'Importing…' : programs.length > 0 ? 'Replace Programs' : 'Import Programs'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'transparent',
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
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginTop: 12,
  },
  devBtn: {
    backgroundColor: C.card2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.borderHi,
    padding: 12,
    alignItems: 'center',
  },
  devBtnText: {
    color: C.sub,
    fontWeight: '600',
    fontSize: 14,
  },
  importButton: {
    backgroundColor: C.hit,
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 14,
    alignItems: 'center',
  } as object,
  importButtonPressed: {
    opacity: 0.8,
  },
  importButtonDisabled: {
    backgroundColor: C.cardSoft,
  },
  importButtonText: {
    color: C.bg,
    fontWeight: '600',
    fontSize: 16,
  },
  importButtonDisabledText: {
    color: C.sub,
  },
});
