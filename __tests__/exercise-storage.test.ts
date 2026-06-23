import { resolveOrCreateExercise, type DrizzleDB } from '../src/storage';
import { getAllExerciseNames, getExerciseNote, setExerciseNote, setExerciseLibraryLink, getExercisesLibraryData } from '../src/exerciseStorage';
import { makeInMemoryDB } from './helpers/makeInMemoryDB';

describe('exerciseStorage', () => {
  let db: DrizzleDB;

  beforeEach(() => {
    db = makeInMemoryDB();
  });

  describe('getAllExerciseNames', () => {
    it('returns empty array when no exercises exist', () => {
      expect(getAllExerciseNames(db)).toEqual([]);
    });

    it('returns exercise names in alphabetical order', () => {
      resolveOrCreateExercise(db, 'Squat');
      resolveOrCreateExercise(db, 'Bench Press');
      resolveOrCreateExercise(db, 'Deadlift');
      expect(getAllExerciseNames(db)).toEqual(['Bench Press', 'Deadlift', 'Squat']);
    });
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

  describe('setExerciseLibraryLink', () => {
    it('writes libraryId, muscleGroups, equipment, and libraryConfidence 100', () => {
      resolveOrCreateExercise(db, 'Squat');
      setExerciseLibraryLink(db, 'Squat', 'Barbell_Squat', '["quadriceps","glutes"]', 'barbell');
      const [row] = getExercisesLibraryData(db, ['Squat']);
      expect(row.libraryId).toBe('Barbell_Squat');
      expect(row.muscleGroups).toBe('["quadriceps","glutes"]');
      expect(row.equipment).toBe('barbell');
      expect(row.libraryConfidence).toBe(100);
    });

    it('no-ops when exercise name does not exist', () => {
      expect(() =>
        setExerciseLibraryLink(db, 'NonExistent', 'some_id', 'chest', 'barbell')
      ).not.toThrow();
    });
  });
});
