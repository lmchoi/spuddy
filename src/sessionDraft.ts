import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionState } from './domain/sessionLogger';
import type { ProgramDay } from './types';

export type Draft = { state: SessionState; day: ProgramDay };

export function draftKey(programId: number, dayIndex: number): string {
  return `draft_session__${programId}__${dayIndex}`;
}

export async function saveDraft(key: string, state: SessionState, day: ProgramDay): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify({ state, day }));
}

export async function loadDraft(key: string): Promise<Draft | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!('state' in parsed) || !('day' in parsed)) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return { state: { ...(parsed.state as SessionState), isResting: false }, day: parsed.day as ProgramDay };
  } catch {
    await AsyncStorage.removeItem(key);
    return null;
  }
}

export async function clearDraft(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export function parseDraftKey(key: string): { programId: number; dayIndex: number } | null {
  const match = /^draft_session__(\d+)__(\d+)$/.exec(key);
  if (!match) return null;
  return { programId: Number(match[1]), dayIndex: Number(match[2]) };
}

export async function findActiveDraft(): Promise<{ programId: number; dayIndex: number } | null> {
  const allKeys = await AsyncStorage.getAllKeys();
  const draftKeys = allKeys.filter(k => parseDraftKey(k) !== null);
  if (draftKeys.length !== 1) return null;
  return parseDraftKey(draftKeys[0]);
}
