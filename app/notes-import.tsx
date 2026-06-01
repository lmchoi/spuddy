import { useMemo, useState } from 'react';
import {
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
import { parseWorkoutNotes } from '@/src/notesParser';
import { SAMPLE_WORKOUT_NOTES } from '@/src/debug/sampleNotes';
import { C } from '@/components/spuddy/palette';

export default function NotesImportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');

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
  const canReview = totalExercises > 0;

  function handleReview() {
    if (!canReview || !parsed) return;
    router.push({
      pathname: '/notes-import-review' as any,
      params: { parsedNotes: JSON.stringify(parsed) },
    });
  }

  const daySuffix = importableCount !== 1 ? 's' : '';
  const reviewLabel = totalExercises > 0
    ? `Review ${importableCount} day${daySuffix}`
    : 'Paste notes to import';

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
          accessibilityLabel="Workout notes input"
          placeholder={'Upper body\n- Bench press - 80kg\n- Overhead press - 50kg\n\nLower body\n- Squat - 100kg'}
          placeholderTextColor={C.muted}
          value={text}
          onChangeText={setText}
          editable
          autoCorrect={false}
          autoCapitalize="none"
          textAlignVertical="top"
        />

        {__DEV__ && (
          <Pressable onPress={() => setText(SAMPLE_WORKOUT_NOTES)} style={styles.debugFillBtn}>
            <Text style={styles.debugFillBtnText}>⚙ Fill sample</Text>
          </Pressable>
        )}

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
          onPress={handleReview}
          disabled={!canReview}
          style={[styles.importBtn, !canReview && styles.importBtnDisabled]}
        >
          <Text style={[styles.importBtnText, !canReview && styles.importBtnTextDisabled]}>
            {reviewLabel}
          </Text>
        </Pressable>
      </View>
    </View>
    </KeyboardAvoidingView>
  );
}
