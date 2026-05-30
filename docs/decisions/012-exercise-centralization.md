# ADR-012: Exercise Centralization — migrate names to IDs

## Context

Currently, exercise names are stored as raw text in both the `sessions` and `program_exercises` tables. This lead to several issues:
1.  **Renaming**: Renaming an exercise requires updating many rows across multiple tables.
2.  **Redundancy**: The same string is repeated many times, increasing storage slightly but more importantly making it hard to maintain global exercise metadata (e.g., muscle groups, notes).
3.  **Data Integrity**: Minor typos in names can lead to fragmented history.

To support future features like exercise-specific notes and robust renaming, we need a centralized `exercises` table.

## Decision

We will:
1.  Introduce a new `exercises` table: `id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL`.
2.  Migrate `sessions` to use `exercise_id` (INTEGER) instead of `exercise_name` (TEXT).
3.  Migrate `program_exercises` to use `exercise_id` (INTEGER) instead of `name` (TEXT).
4.  Implement a one-time migration during database initialization:
    -   Collect all unique exercise names from existing `sessions` and `program_exercises`.
    -   Populate the `exercises` table with these names.
    -   Reconstruct the dependent tables (`sessions`, `program_exercises`) to use foreign keys.
5.  Maintain backward compatibility in the `storage` and `programStorage` layers by joining with the `exercises` table to return the exercise name.

## Consequences

-   **Schema Complexity**: The database schema becomes more normalized, requiring JOINs for simple queries.
-   **Performance**: Slight overhead for JOINs, but indexed IDs should perform well.
-   **Migration Risk**: Table reconstruction is a destructive process if interrupted, but SQLite's transactions (BEGIN/COMMIT) should mitigate this.
-   **API Stability**: The domain types (`ExerciseEntry`, `ProgramExercise`) will remain largely the same, but with an optional `exerciseId` to facilitate the transition.
