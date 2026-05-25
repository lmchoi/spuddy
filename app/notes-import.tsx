import { useState } from 'react';
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
  const [importing, setImporting] = useState(false);

  async function handleImport() {
    if (!text.trim() || importing) return;
    setImporting(true);
    try {
      const parsed = parseWorkoutNotes(text);
      const db = await getDB();
      const result = await importFromNotes(db, parsed, 'kg');
      if (result.success) {
        Alert.alert(
          'Import complete',
          `${result.programsCreated} program${result.programsCreated !== 1 ? 's' : ''} created.`,
          [{ text: 'OK', onPress: () => router.push('/(tabs)/settings') }]
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
        <Text style={styles.hint}>
          Paste your personal notes below — one exercise per line. Spuddy will create programs from them.
        </Text>
        <TextInput
          style={styles.textarea}
          multiline
          autoFocus
          placeholder={'Upper body\n- Bench press - 80kg\n- Overhead press - 50kg'}
          placeholderTextColor={C.muted}
          value={text}
          onChangeText={setText}
          editable={!importing}
          autoCorrect={false}
          autoCapitalize="none"
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + 18 }]}>
        <Pressable
          onPress={handleImport}
          disabled={!text.trim() || importing}
          style={[styles.importBtn, (!text.trim() || importing) && styles.importBtnDisabled]}
        >
          <Text style={[styles.importBtnText, (!text.trim() || importing) && styles.importBtnTextDisabled]}>
            {importing ? 'Importing…' : 'Import'}
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
    gap: 12,
  },
  hint: {
    fontSize: 13,
    color: C.sub,
    lineHeight: 19,
  },
  textarea: {
    minHeight: 260,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    fontSize: 13,
    color: C.text,
    lineHeight: 20,
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
