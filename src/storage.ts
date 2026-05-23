import type { Session } from './types';

export async function saveSession(_session: Session): Promise<void> {}

export async function getAllSessions(): Promise<Session[]> {
  return [];
}

export async function getSessionsForExercise(_name: string): Promise<Session[]> {
  return [];
}
