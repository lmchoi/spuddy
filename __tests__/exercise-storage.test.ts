import { resolveOrCreateExercise, type DrizzleDB } from '../src/storage';
import { getExerciseNote, setExerciseNote } from '../src/exerciseStorage';
import { makeInMemoryDB } from './helpers/makeInMemoryDB';

describe('exerciseStorage', () => {
  let db: DrizzleDB;

  beforeEach(() => {
    db = makeInMemoryDB();
  });

  describe('getExerciseNote', () => {
    it('returns null when no note has been set', async () => {
      const id = resolveOrCreateExercise(db, 'Squat');
      const note = await getExerciseNote(db, id);
      expect(note).toBeNull();
    });
  });

  describe('setExerciseNote', () => {
    it('saves a note and retrieves it', async () => {
      const id = resolveOrCreateExercise(db, 'Bench Press');
      await setExerciseNote(db, id, 'Keep elbows tucked.');
      const note = await getExerciseNote(db, id);
      expect(note).toBe('Keep elbows tucked.');
    });

    it('updates an existing note', async () => {
      const id = resolveOrCreateExercise(db, 'OHP');
      await setExerciseNote(db, id, 'First cue.');
      await setExerciseNote(db, id, 'Updated cue.');
      const note = await getExerciseNote(db, id);
      expect(note).toBe('Updated cue.');
    });

    it('clears a note when passed null', async () => {
      const id = resolveOrCreateExercise(db, 'Deadlift');
      await setExerciseNote(db, id, 'Drive hips forward.');
      await setExerciseNote(db, id, null);
      const note = await getExerciseNote(db, id);
      expect(note).toBeNull();
    });

    it('notes are scoped per exercise', async () => {
      const idA = resolveOrCreateExercise(db, 'Row');
      const idB = resolveOrCreateExercise(db, 'Pull-up');
      await setExerciseNote(db, idA, 'Note A');
      const noteB = await getExerciseNote(db, idB);
      expect(noteB).toBeNull();
    });
  });
});
