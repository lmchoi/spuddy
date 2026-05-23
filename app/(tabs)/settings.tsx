import { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import * as DocumentPicker from 'expo-document-picker';
import { getDB } from '@/src/db';
import { importProgramFromJson } from '@/src/programImport';
import { getPrograms } from '@/src/programStorage';
import type { Program } from '@/src/types';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

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
    <View style={styles.container}>
      {programs.length > 0 ? (
        programs.map((program, i) => (
          <View key={i} style={styles.programCard}>
            <Text style={styles.programName}>{program.name}</Text>
            <Text style={styles.programMeta}>{program.days.length} days</Text>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>No programs loaded</Text>
      )}

      <TouchableOpacity
        style={[styles.button, importing && styles.buttonDisabled]}
        onPress={handleImport}
        disabled={importing}
      >
        <Text style={styles.buttonText}>
          {importing ? 'Importing…' : programs.length > 0 ? 'Replace Programs' : 'Import Programs'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  empty: {
    fontSize: 14,
    color: '#888',
  },
  programCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  programName: {
    fontSize: 16,
    fontWeight: '600',
  },
  programMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
