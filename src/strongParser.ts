import type { ImportedHistory } from './types';

// Stub — replaced in step 2 with real CSV parsing logic
export function parseStrongCsv(_text: string): ImportedHistory {
  return {
    workoutGroups: [
      {
        name: 'Push',
        sessionCount: 12,
        lastUsed: '2026-05-20',
        sessions: [],
        equipmentHints: {},
      },
      {
        name: 'Pull',
        sessionCount: 9,
        lastUsed: '2026-05-18',
        sessions: [],
        equipmentHints: {},
      },
    ],
  };
}
