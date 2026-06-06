import { useState, useCallback, useEffect } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, Switch, Text, View } from 'react-native';
import { styles } from '@/styles/tabs/settings/index.styles';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDB } from '@/src/db';
import { importProgramFromJson } from '@/src/programImport';
import { getPrograms } from '@/src/programStorage';
import { getPreferences, setNotificationSound } from '@/src/preferences';
import { useExportDatabase } from '@/src/hooks/useExportDatabase';
import type { Program } from '@/src/types';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [importing, setImporting] = useState(false);
  const [notificationSound, setNotificationSoundState] = useState(false);
  const { exporting, error: exportError, exportData } = useExportDatabase();

  useEffect(() => {
    if (exportError) Alert.alert('Backup failed', exportError);
  }, [exportError]);

  useFocusEffect(
    useCallback(() => {
      getDB().then(async db => {
        const [progs, prefs] = await Promise.all([getPrograms(db), getPreferences(db)]);
        setPrograms(progs);
        setNotificationSoundState(prefs.notificationSound);
      }).catch(console.error);
    }, [])
  );

  async function handleNotificationSoundToggle(value: boolean) {
    setNotificationSoundState(value);
    const db = await getDB();
    await setNotificationSound(db, value);
  }

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Settings</Text>

        {programs.length === 0 ? (
          <Text style={styles.empty}>No programs loaded</Text>
        ) : (
          programs.map((program, programIndex) => (
            <View key={programIndex} style={styles.programSection}>
              <Text style={styles.programName}>{program.name}</Text>
              <View style={styles.dayList}>
                {program.days.map((day, index) => (
                  <View key={index}>
                    <Pressable
                      style={({ pressed }) => [styles.dayRow, pressed && styles.dayRowPressed]}
                      onPress={() => router.push(`/settings/${encodeURIComponent(program.name)}/${index}`)}
                    >
                      <View style={styles.dayRowContent}>
                        <Text style={styles.dayName}>{day.name}</Text>
                        <Text style={styles.exerciseList} numberOfLines={1}>
                          {day.exercises.map(e => e.name).join(' · ')}
                        </Text>
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </Pressable>
                    {index < program.days.length - 1 && <View style={styles.separator} />}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notifications</Text>
          <View style={styles.dataList}>
            <View style={styles.dataRow}>
              <Text style={styles.dataRowText}>Sound when rest is complete</Text>
              <Switch
                value={notificationSound}
                onValueChange={handleNotificationSoundToggle}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Data</Text>
          <View style={styles.dataList}>
            <Pressable
              style={({ pressed }) => [styles.dataRow, pressed && styles.dataRowPressed, exporting && styles.dataRowDisabled]}
              onPress={exportData}
              disabled={exporting}
            >
              <Text style={[styles.dataRowText, exporting && styles.dataRowTextDisabled]}>
                {exporting ? 'Backing up…' : 'Back up data'}
              </Text>
              <Text style={styles.dataRowChevron}>›</Text>
            </Pressable>
            <View style={styles.dataSeparator} />
            <Pressable
              style={({ pressed }) => [styles.dataRow, pressed && styles.dataRowPressed, importing && styles.dataRowDisabled]}
              onPress={handleImport}
              disabled={importing}
            >
              <Text style={[styles.dataRowText, importing && styles.dataRowTextDisabled]}>
                {importing ? 'Importing…' : 'Import Liftosaur JSON'}
              </Text>
              <Text style={styles.dataRowChevron}>›</Text>
            </Pressable>
            <View style={styles.dataSeparator} />
            <Pressable
              style={({ pressed }) => [styles.dataRow, pressed && styles.dataRowPressed]}
              onPress={() => router.push('/strong-import')}
            >
              <Text style={styles.dataRowText}>Import from Strong</Text>
              <Text style={styles.dataRowChevron}>›</Text>
            </Pressable>
            <View style={styles.dataSeparator} />
            <Pressable
              style={({ pressed }) => [styles.dataRow, pressed && styles.dataRowPressed]}
              onPress={() => router.push('/notes-import')}
            >
              <Text style={styles.dataRowText}>Paste workout notes</Text>
              <Text style={styles.dataRowChevron}>›</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
