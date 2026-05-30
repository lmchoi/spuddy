# Plan: Exercise Centralization (Schema Migration)

## Goal
Centralize exercise management into an `exercises` table to support robust renaming and future features (like global notes), migrating all existing name-based session and program data to ID-based links.

## Out of scope
- Adding any new UI features (e.g., exercise notes). This is a purely structural data refactor.
- Merging duplicate exercises with slightly different names (e.g. "Bench Press" vs "Benchpress").

## Design
- **Schema**:
    - Add table: `exercises (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL)`
    - Reconstruct `sessions`: migrate `exercise_name` (text) to `exercise_id` (integer, FK).
    - Reconstruct `program_exercises`: migrate `name` (text) to `exercise_id` (integer, FK).
- **Domain**:
    - Update `ExerciseEntry` and `ProgramExercise` types to include `exerciseId?: number`.
- **Migration**:
    - Add a migration step during DB initialization that populates the `exercises` table from existing unique names in `sessions` and `program_exercises`.
    - Use table reconstruction (create new, copy over joined data, drop old, rename) to safely update `sessions` and `program_exercises`.
- **Documentation**: 
    - Document the schema changes as a hard-to-reverse decision in ADR 012.

## Commits
1. [x] **docs**: Add ADR 012 for Exercise Centralization. — test: N/A
2. [x] **types**: Update `ExerciseEntry` and `ProgramExercise` to include optional `exerciseId`. — test: `tsc`
3. [x] **storage**: Update `SCHEMA_STATEMENTS` to include the `exercises` table. Implement migration logic (table reconstruction) and wire it into initialization. — test: New migration test in `__tests__/storage.test.ts`
4. [x] **storage**: Refactor `saveSession`, `getAllSessions`, etc., to use `exercise_id` and join with `exercises` table. — test: Existing tests in `__tests__/storage.test.ts` pass
5. [x] **storage**: Refactor `src/programStorage.ts` functions to use `exercise_id`. — test: Existing tests in `__tests__/program-storage.test.ts` pass
