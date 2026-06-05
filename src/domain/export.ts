import * as FileSystem from 'expo-file-system/legacy';
import type { DrizzleDB } from '../storage';

export async function exportDatabase(db: DrizzleDB): Promise<string> {
  const date = new Date().toISOString().slice(0, 10);
  const toUri = `${FileSystem.cacheDirectory}spuddy-backup-${date}.db`;
  // Decode URI to get the raw filesystem path that SQLite can write to
  const toPath = decodeURIComponent(toUri.replace(/^file:\/\//, ''));
  await FileSystem.deleteAsync(toUri, { idempotent: true });
  db.run(`VACUUM INTO '${toPath}'`);
  return toUri;
}
