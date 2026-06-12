import AsyncStorage from '@react-native-async-storage/async-storage';
import { draftKey, saveDraft, loadDraft, clearDraft, parseDraftKey, findActiveDraft } from '../src/sessionDraft';
import type { SessionState } from '../src/domain/sessionLogger';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const baseState: SessionState = {
  loggedSets: [[{ reps: 5, weight: 100 }], []],
  targetCounts: [3, 2],
  extraSetCounts: [0, 0],
  currentExerciseIdx: 0,
  isResting: true,
  startedAt: 1000000,
};

beforeEach(() => {
  AsyncStorage.clear();
});

describe('draftKey', () => {
  it('produces a stable key from id and index', () => {
    expect(draftKey(1, 0)).toBe('draft_session__1__0');
    expect(draftKey(1, 0)).toBe(draftKey(1, 0));
  });

  it('distinguishes different ids or indices', () => {
    expect(draftKey(1, 0)).not.toBe(draftKey(2, 0));
    expect(draftKey(1, 0)).not.toBe(draftKey(1, 1));
  });
});

describe('saveDraft / loadDraft round-trip', () => {
  it('restores the saved state', async () => {
    const key = draftKey(42, 2);
    await saveDraft(key, baseState);
    const restored = await loadDraft(key);
    expect(restored).not.toBeNull();
    expect(restored!.loggedSets).toEqual(baseState.loggedSets);
    expect(restored!.targetCounts).toEqual(baseState.targetCounts);
    expect(restored!.currentExerciseIdx).toBe(baseState.currentExerciseIdx);
    expect(restored!.startedAt).toBe(baseState.startedAt);
  });

  it('forces isResting to false regardless of saved value', async () => {
    const key = draftKey(42, 0);
    await saveDraft(key, { ...baseState, isResting: true });
    const restored = await loadDraft(key);
    expect(restored!.isResting).toBe(false);
  });
});

describe('loadDraft', () => {
  it('returns null when no draft exists for the key', async () => {
    const result = await loadDraft(draftKey(999, 99));
    expect(result).toBeNull();
  });

  it('returns null and clears the key when stored value is invalid JSON', async () => {
    const key = draftKey(0, 0);
    await AsyncStorage.setItem(key, 'not-valid-json{{{');
    const result = await loadDraft(key);
    expect(result).toBeNull();
    expect(await AsyncStorage.getItem(key)).toBeNull();
  });
});

describe('clearDraft', () => {
  it('removes the draft so loadDraft returns null afterwards', async () => {
    const key = draftKey(42, 1);
    await saveDraft(key, baseState);
    await clearDraft(key);
    expect(await loadDraft(key)).toBeNull();
  });
});

describe('parseDraftKey', () => {
  it('parses a valid draft key into programId and dayIndex', () => {
    expect(parseDraftKey('draft_session__3__1')).toEqual({ programId: 3, dayIndex: 1 });
  });

  it('parses zero values correctly', () => {
    expect(parseDraftKey('draft_session__0__0')).toEqual({ programId: 0, dayIndex: 0 });
  });

  it('returns null for an unrelated key', () => {
    expect(parseDraftKey('some_other_key')).toBeNull();
  });

  it('returns null for a malformed draft key (missing segment)', () => {
    expect(parseDraftKey('draft_session__5')).toBeNull();
  });

  it('returns null for a malformed draft key (non-numeric segment)', () => {
    expect(parseDraftKey('draft_session__abc__def')).toBeNull();
  });
});

describe('findActiveDraft', () => {
  it('returns null when no draft keys exist', async () => {
    expect(await findActiveDraft()).toBeNull();
  });

  it('returns the programId and dayIndex when exactly one draft key exists', async () => {
    await AsyncStorage.setItem(draftKey(7, 2), '{}');
    expect(await findActiveDraft()).toEqual({ programId: 7, dayIndex: 2 });
  });

  it('returns null when multiple draft keys exist', async () => {
    await AsyncStorage.setItem(draftKey(1, 0), '{}');
    await AsyncStorage.setItem(draftKey(2, 0), '{}');
    expect(await findActiveDraft()).toBeNull();
  });

  it('ignores unrelated keys', async () => {
    await AsyncStorage.setItem('some_other_key', 'value');
    await AsyncStorage.setItem(draftKey(5, 1), '{}');
    expect(await findActiveDraft()).toEqual({ programId: 5, dayIndex: 1 });
  });
});
