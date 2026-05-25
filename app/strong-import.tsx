import { useState, useCallback, useRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter, useFocusEffect } from 'expo-router';
import { getDB } from '@/src/db';
import { parseStrongCsv } from '@/src/strongParser';
import { importFromStrong } from '@/src/strongImport';
import type { ImportedWorkoutGroup } from '@/src/types';
import { C } from '@/components/spuddy/palette';

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

function isRecentWorkout(lastUsed: string): boolean {
  const diff = Date.now() - new Date(lastUsed).getTime();
  return diff <= SIXTY_DAYS_MS;
}

export default function StrongImportScreen() {
  const router = useRouter();
  const [workoutGroups, setWorkoutGroups] = useState<ImportedWorkoutGroup[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [csvText, setCsvText] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', '*/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) {
      router.back();
      return;
    }

    try {
      const text = await fetch(result.assets[0].uri).then(r => r.text());
      const history = parseStrongCsv(text);
      setCsvText(text);
      setWorkoutGroups(history.workoutGroups);
      const preselected = new Set(
        history.workoutGroups
          .filter(g => isRecentWorkout(g.lastUsed))
          .map(g => g.name)
      );
      setSelected(preselected);
    } catch {
      Alert.alert('Could not read file', 'Please select a valid Strong CSV export.');
      router.back();
    }
  }

  const hasFiredRef = useRef(false);
  useFocusEffect(useCallback(() => {
    if (!hasFiredRef.current) {
      hasFiredRef.current = true;
      pickFile();
    }
  }, []));

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
      const result = await importFromStrong(db, csvText, Array.from(selected), unit);
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Import from Strong</Text>
          {workoutGroups.length > 0 && (
            <View style={styles.unitPill}>
              <Pressable
                style={[styles.unitOption, unit === 'kg' && styles.unitOptionActive]}
                onPress={() => setUnit('kg')}
              >
                <Text style={[styles.unitOptionText, unit === 'kg' && styles.unitOptionTextActive]}>kg</Text>
              </Pressable>
              <Pressable
                style={[styles.unitOption, unit === 'lbs' && styles.unitOptionActive]}
                onPress={() => setUnit('lbs')}
              >
                <Text style={[styles.unitOptionText, unit === 'lbs' && styles.unitOptionTextActive]}>lbs</Text>
              </Pressable>
            </View>
          )}
        </View>

        {workoutGroups.length > 0 && (
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.5,
  },
  unitPill: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 4,
  },
  unitOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unitOptionActive: {
    backgroundColor: C.hitBg,
  },
  unitOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.sub,
  },
  unitOptionTextActive: {
    color: C.hit,
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
