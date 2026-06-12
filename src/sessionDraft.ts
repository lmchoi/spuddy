import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionState } from './domain/sessionLogger';

export function draftKey(programId: number, dayIndex: number): string {
  return `draft_session__${programId}__${dayIndex}`;
}

export async function saveDraft(key: string, state: SessionState): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(state));
}

export async function loadDraft(key: string): Promise<SessionState | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return null;
  try {
    const state = JSON.parse(raw) as SessionState;
    return { ...state, isResting: false };
  } catch {
    await AsyncStorage.removeItem(key);
    return null;
  }
}

export async function clearDraft(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function findActiveDraft(): Promise<{ programId: number; dayIndex: number } | null> {
  return null;
}
