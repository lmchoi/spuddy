import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '@/styles/notes-import-review.styles';
import { getDB } from '@/src/db';
import { importFromNotes } from '@/src/notesImport';
import type { ParsedNotes } from '@/src/notesParser';
import { formatExerciseMeta } from '@/src/domain/notesReview';

export default function NotesImportReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { parsedNotes: rawParam } = useLocalSearchParams<{ parsedNotes: string }>();
  const [importing, setImporting] = useState(false);

  const parsed: ParsedNotes = JSON.parse(rawParam);

  const importableSections = parsed.sections.filter(s => s.exercises.length > 0);
  const importableCount = importableSections.length;
  const totalExercises = parsed.sections.reduce((sum, s) => sum + s.exercises.length, 0);
  const canImport = importableCount > 0 && !importing;

  async function handleImport() {
    if (!canImport) return;
    setImporting(true);
    try {
      const db = await getDB();
      const result = await importFromNotes(db, parsed);
      if (result.success) {
        router.replace('/(tabs)/settings');
      } else {
        Alert.alert('Import failed', result.error);
      }
    } catch {
      Alert.alert('Import failed', 'Something went wrong.');
    } finally {
      setImporting(false);
    }
  }

  const programSuffix = importableCount !== 1 ? 's' : '';
  const importLabel = importing ? 'Importing…' : `Import ${importableCount} program${programSuffix}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Review import</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.summary}>
          {importableCount} program{importableCount !== 1 ? 's' : ''} · {totalExercises} exercise{totalExercises !== 1 ? 's' : ''}
        </Text>

        {importableSections.map((section, si) => (
          <View key={si} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionPill}>
                <Text style={styles.sectionPillText}>{section.name}</Text>
              </View>
            </View>
            {section.exercises.map((ex, ei) => (
              <View key={ei} style={[styles.exerciseRow, ei > 0 && styles.exerciseRowBorder]}>
                <Text style={styles.exerciseDot}>·</Text>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {formatExerciseMeta(ex, parsed.inferredUnit)}
                </Text>
              </View>
            ))}
          </View>
        ))}

      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + 18 }]}>
        <Pressable
          onPress={handleImport}
          disabled={!canImport}
          style={[styles.importBtn, !canImport && styles.importBtnDisabled]}
        >
          <Text style={[styles.importBtnText, !canImport && styles.importBtnTextDisabled]}>
            {importLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
