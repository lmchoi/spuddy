import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDB } from '@/src/db';
import { parseStrongCsv } from '@/src/strongParser';
import { importFromStrong } from '@/src/strongImport';
import type { ImportedWorkoutGroup } from '@/src/types';
import { C } from '@/components/spuddy/palette';

export default function StrongImportScreen() {
  const insets = useSafeAreaInsets();
  const [workoutGroups, setWorkoutGroups] = useState<ImportedWorkoutGroup[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [csvText, setCsvText] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function handlePickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', '*/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    try {
      const text = await fetch(result.assets[0].uri).then(r => r.text());
      const history = parseStrongCsv(text);
      setCsvText(text);
      setWorkoutGroups(history.workoutGroups);
      const preselected = new Set(history.workoutGroups.map(g => g.name));
      setSelected(preselected);
    } catch {
      Alert.alert('Could not read file', 'Please select a valid Strong CSV export.');
    }
  }

  function toggleWorkout(name: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleImport() {
    if (!csvText) return;
    setImporting(true);
    try {
      const db = await getDB();
      const result = await importFromStrong(db, csvText, Array.from(selected), 'kg');
      if (result.success) {
        Alert.alert('Imported!', `${result.sessionsImported} sessions saved.`);
      } else {
        Alert.alert('Import failed', result.error);
      }
    } catch {
      Alert.alert('Import failed', 'An unexpected error occurred.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Import from Strong</Text>

        {workoutGroups.length === 0 ? (
          <Pressable
            style={({ pressed }) => [styles.pickButton, pressed && styles.pressed]}
            onPress={handlePickFile}
          >
            <Text style={styles.pickButtonText}>Select Strong CSV</Text>
          </Pressable>
        ) : (
          <>
            <View style={styles.list}>
              {workoutGroups.map(group => (
                <Pressable
                  key={group.name}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  onPress={() => toggleWorkout(group.name)}
                >
                  <View style={styles.rowInfo}>
                    <Text style={styles.workoutName}>{group.name}</Text>
                    <Text style={styles.workoutMeta}>
                      {group.sessionCount} sessions · last {group.lastUsed}
                    </Text>
                  </View>
                  <View style={[styles.checkbox, selected.has(group.name) && styles.checkboxSelected]}>
                    {selected.has(group.name) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.importButton,
                pressed && styles.pressed,
                (importing || selected.size === 0) && styles.importButtonDisabled,
              ]}
              onPress={handleImport}
              disabled={importing || selected.size === 0}
            >
              <Text style={[styles.importButtonText, (importing || selected.size === 0) && styles.importButtonDisabledText]}>
                {importing ? 'Importing…' : `Import ${selected.size} workout${selected.size === 1 ? '' : 's'}`}
              </Text>
            </Pressable>
          </>
        )}
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
  pickButton: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    alignItems: 'center',
  } as object,
  pickButtonText: {
    color: C.hit,
    fontWeight: '600',
    fontSize: 16,
  },
  list: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderCurve: 'continuous',
    overflow: 'hidden',
  } as object,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  workoutName: {
    fontSize: 15,
    fontWeight: '500',
    color: C.text,
  },
  workoutMeta: {
    fontSize: 12,
    color: C.muted,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: C.borderHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: C.hit,
    borderColor: C.hit,
  },
  checkmark: {
    fontSize: 12,
    fontWeight: '700',
    color: C.bg,
  },
  importButton: {
    backgroundColor: C.hit,
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 14,
    alignItems: 'center',
  } as object,
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
  pressed: {
    opacity: 0.8,
  },
});
