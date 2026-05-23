import { useState, useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from 'expo-router';
import { getDB } from '@/src/db';
import { importProgramFromJson } from '@/src/programImport';
import { getPrograms } from '@/src/programStorage';
import type { Program } from '@/src/types';

export default function SettingsScreen() {
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
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  dayName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  exerciseList: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ddd',
    marginTop: 12,
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
