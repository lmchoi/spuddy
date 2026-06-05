import { useState } from 'react';
import * as Sharing from 'expo-sharing';
import { getDB } from '../db';
import { exportDatabase } from '../domain/export';

export function useExportDatabase() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportData() {
    setExporting(true);
    setError(null);
    try {
      const db = await getDB();
      const path = await exportDatabase(db);
      await Sharing.shareAsync(path, {
        mimeType: 'application/x-sqlite3',
        dialogTitle: 'Back up Spuddy data',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  return { exporting, error, exportData };
}
