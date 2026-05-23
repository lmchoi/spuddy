import { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { parseLiftohistoryText } from '@/src/parser';
import { saveSession, sessionExists } from '@/src/storage';
import { getDB } from '@/src/db';

export default function AddScreen() {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const parsed = text.length > 0 ? parseLiftohistoryText(text) : null;
  const canSave = parsed !== null && !saving;

  async function handleSave() {
    if (!parsed) return;
    setSaving(true);
    try {
      const db = await getDB();
      if (await sessionExists(db, parsed.date)) {
        Alert.alert('Already saved', `A workout for ${parsed.date} is already recorded.`);
        return;
      }
      await saveSession(db, parsed);
      setText('');
      Alert.alert('Saved', 'Workout saved successfully!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save workout. Please check your format.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        multiline
        placeholder="Paste your Liftosaur workout here"
        value={text}
        onChangeText={setText}
      />
      <TouchableOpacity
        style={[styles.button, !canSave && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={!canSave}
      >
        <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 16,
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
