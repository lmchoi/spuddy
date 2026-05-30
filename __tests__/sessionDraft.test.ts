import AsyncStorage from '@react-native-async-storage/async-storage';
import { draftKey, saveDraft, loadDraft, clearDraft } from '../src/sessionDraft';
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
  it('produces a stable key from name and index', () => {
    expect(draftKey('PPL Push', 0)).toBe('draft_session__PPL Push__0');
    expect(draftKey('PPL Push', 0)).toBe(draftKey('PPL Push', 0));
  });

  it('distinguishes different names or indices', () => {
    expect(draftKey('PPL Push', 0)).not.toBe(draftKey('PPL Pull', 0));
    expect(draftKey('PPL Push', 0)).not.toBe(draftKey('PPL Push', 1));
  });
});

describe('saveDraft / loadDraft round-trip', () => {
  it('restores the saved state', async () => {
    const key = draftKey('Prog', 2);
    await saveDraft(key, baseState);
    const restored = await loadDraft(key);
    expect(restored).not.toBeNull();
    expect(restored!.loggedSets).toEqual(baseState.loggedSets);
    expect(restored!.targetCounts).toEqual(baseState.targetCounts);
    expect(restored!.currentExerciseIdx).toBe(baseState.currentExerciseIdx);
    expect(restored!.startedAt).toBe(baseState.startedAt);
  });

  it('forces isResting to false regardless of saved value', async () => {
    const key = draftKey('Prog', 0);
    await saveDraft(key, { ...baseState, isResting: true });
    const restored = await loadDraft(key);
    expect(restored!.isResting).toBe(false);
  });
});

describe('loadDraft', () => {
  it('returns null when no draft exists for the key', async () => {
    const result = await loadDraft(draftKey('NoSuch', 99));
    expect(result).toBeNull();
  });

  it('returns null and clears the key when stored value is invalid JSON', async () => {
    const key = draftKey('Corrupt', 0);
    await AsyncStorage.setItem(key, 'not-valid-json{{{');
    const result = await loadDraft(key);
    expect(result).toBeNull();
    expect(await AsyncStorage.getItem(key)).toBeNull();
  });
});

describe('clearDraft', () => {
  it('removes the draft so loadDraft returns null afterwards', async () => {
    const key = draftKey('Prog', 1);
    await saveDraft(key, baseState);
    await clearDraft(key);
    expect(await loadDraft(key)).toBeNull();
  });
});
