import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '@/styles/notes-import.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDB } from '@/src/db';
import { parseWorkoutNotes } from '@/src/notesParser';
import { importFromNotes } from '@/src/notesImport';
import { C } from '@/components/spuddy/palette';

export default function NotesImportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [importing, setImporting] = useState(false);

  const parsed = useMemo(
    () => (text.trim() ? parseWorkoutNotes(text) : null),
    [text]
  );

  const totalExercises = parsed
    ? parsed.sections.reduce((sum, s) => sum + s.exercises.length, 0)
    : 0;
  const importableCount = parsed
    ? parsed.sections.filter(s => s.exercises.length > 0).length
    : 0;
  const showUnitPicker = parsed != null && parsed.inferredUnit === null;
  const canImport = totalExercises > 0 && !importing;

  async function handleImport() {
    if (!canImport || !parsed) return;
    setImporting(true);
    try {
      const db = await getDB();
      const result = await importFromNotes(db, parsed);
      if (result.success) {
        Alert.alert(
          'Import complete',
          `${result.programsCreated} program${result.programsCreated !== 1 ? 's' : ''} created.`,
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/settings') }]
        );
      } else {
        Alert.alert('Import failed', result.error);
      }
    } catch {
      Alert.alert('Import failed', 'Something went wrong.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Paste workout notes</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.textarea}
          multiline
          autoFocus
          placeholder={'Upper body\n- Bench press - 80kg\n- Overhead press - 50kg\n\nLower body\n- Squat - 100kg'}
          placeholderTextColor={C.muted}
          value={text}
          onChangeText={setText}
          editable={!importing}
          autoCorrect={false}
          autoCapitalize="none"
          textAlignVertical="top"
        />

        {/* Live preview */}
        {parsed && parsed.sections.length > 0 && (
          <View style={styles.previewCard}>
            {parsed.sections.map((section, i) => (
              <View key={i} style={[styles.previewRow, i > 0 && styles.previewRowBorder]}>
                <Text style={styles.previewSectionName}>{section.name}</Text>
                <Text style={styles.previewCount}>
                  {section.exercises.length} exercise{section.exercises.length !== 1 ? 's' : ''}
                </Text>
              </View>
            ))}
            {parsed.skippedLines > 0 && (
              <Text style={styles.skippedNote}>
                {parsed.skippedLines} line{parsed.skippedLines !== 1 ? 's' : ''} skipped — format not recognised
              </Text>
            )}
          </View>
        )}

        {/* Unit picker — shown only when unit is ambiguous */}
        {showUnitPicker && (
          <View style={styles.unitRow}>
            <Text style={styles.unitLabel}>Units</Text>
            <View style={styles.unitPills}>
              {(['kg', 'lbs'] as const).map(u => (
                <Pressable
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[styles.unitPill, unit === u && styles.unitPillActive]}
                >
                  <Text style={[styles.unitPillText, unit === u && styles.unitPillTextActive]}>
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + 18 }]}>
        <Pressable
          onPress={handleImport}
          disabled={!canImport}
          style={[styles.importBtn, !canImport && styles.importBtnDisabled]}
        >
          <Text style={[styles.importBtnText, !canImport && styles.importBtnTextDisabled]}>
            {importing
              ? 'Importing…'
              : totalExercises > 0
                ? `Import ${importableCount} program${importableCount !== 1 ? 's' : ''}`
                : 'Paste notes to import'}
          </Text>
        </Pressable>
      </View>
    </View>
    </KeyboardAvoidingView>
  );
}
