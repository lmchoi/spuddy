import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
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
                ? `Import ${parsed!.sections.length} program${parsed!.sections.length !== 1 ? 's' : ''}`
                : 'Paste notes to import'}
          </Text>
        </Pressable>
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
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: C.text2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 14,
  },
  textarea: {
    minHeight: 200,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    fontSize: 13,
    color: C.text,
    lineHeight: 20,
  },
  previewCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  previewRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  previewSectionName: {
    fontSize: 14,
    fontWeight: '500',
    color: C.text,
    flex: 1,
  },
  previewCount: {
    fontSize: 12,
    color: C.sub,
  },
  skippedNote: {
    fontSize: 12,
    color: C.muted,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unitLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: C.sub,
  },
  unitPills: {
    flexDirection: 'row',
    gap: 6,
  },
  unitPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  unitPillActive: {
    backgroundColor: C.hit,
    borderColor: C.hit,
  },
  unitPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text2,
  },
  unitPillTextActive: {
    color: C.bg,
  },
  stickyBar: {
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  importBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.hit,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importBtnDisabled: {
    backgroundColor: C.cardSoft,
  },
  importBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.bg,
    letterSpacing: -0.1,
  },
  importBtnTextDisabled: {
    color: C.muted,
  },
});
