import { useState, useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from 'expo-router';
import { getDB } from '@/src/db';
import { importProgramFromJson } from '@/src/programImport';
import { getPrograms, updateActiveDayIndex } from '@/src/programStorage';
import type { Program } from '@/src/types';

export default function SettingsScreen() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [importing, setImporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getDB().then(db => getPrograms(db)).then(setPrograms).catch(console.error);
    }, [])
  );

  async function handleSelectDay(programName: string, dayIndex: number) {
    const db = await getDB();
    await updateActiveDayIndex(db, programName, dayIndex);
    setPrograms(prev =>
      prev.map(p => p.name === programName ? { ...p, activeDayIndex: dayIndex } : p)
    );
  }

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
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
      {programs.length === 0 ? (
        <Text style={styles.empty}>No programs loaded</Text>
      ) : (
        programs.map(program => (
          <View key={program.name} style={styles.programSection}>
            <Text style={styles.programName}>{program.name}</Text>
            <View style={styles.dayList}>
              {program.days.map((day, index) => {
                const isActive = index === program.activeDayIndex;
                return (
                  <Pressable
                    key={index}
                    onPress={() => handleSelectDay(program.name, index)}
                    style={({ pressed }) => [
                      styles.dayRow,
                      isActive && styles.dayRowActive,
                      pressed && styles.dayRowPressed,
                      index === 0 && styles.dayRowFirst,
                      index === program.days.length - 1 && styles.dayRowLast,
                    ]}
                  >
                    <View style={styles.dayRowInner}>
                      <View style={styles.dayInfo}>
                        <Text style={[styles.dayName, isActive && styles.dayNameActive]}>
                          {day.name}
                        </Text>
                        <Text style={styles.exerciseList} numberOfLines={1}>
                          {day.exercises.map(e => e.name).join(' · ')}
                        </Text>
                      </View>
                      {isActive && <View style={styles.activeDot} />}
                    </View>
                    {index < program.days.length - 1 && <View style={styles.separator} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))
      )}

      <Pressable
        style={({ pressed }) => [styles.importButton, pressed && styles.importButtonPressed, importing && styles.importButtonDisabled]}
        onPress={handleImport}
        disabled={importing}
      >
        <Text style={styles.importButtonText}>
          {importing ? 'Importing…' : programs.length > 0 ? 'Replace Programs' : 'Import Programs'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
  },
  empty: {
    fontSize: 14,
    color: '#888',
  },
  programSection: {
    gap: 8,
  },
  programName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  dayList: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
  } as object,
  dayRow: {
    backgroundColor: 'transparent',
  },
  dayRowActive: {
    backgroundColor: '#EBF3FF',
  },
  dayRowPressed: {
    backgroundColor: '#e0e0e0',
  },
  dayRowFirst: {},
  dayRowLast: {},
  dayRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  dayInfo: {
    flex: 1,
    gap: 2,
    backgroundColor: 'transparent',
  },
  dayName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  dayNameActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  exerciseList: {
    fontSize: 12,
    color: '#999',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ddd',
    marginLeft: 14,
  },
  importButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 14,
    alignItems: 'center',
  } as object,
  importButtonPressed: {
    backgroundColor: '#0062CC',
  },
  importButtonDisabled: {
    backgroundColor: '#ccc',
  },
  importButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
