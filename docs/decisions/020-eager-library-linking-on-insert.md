# ADR-020: Eager library linking on exercise insert

## Context

ADR-018 established that `libraryId` / `muscleGroups` / `equipment` are backfilled by `seedLibraryMatches`, which runs once per `initDB` call (app startup). This meant a newly added exercise — whether typed by the user or picked from the library picker — would have `library_id IS NULL` until the next restart, even if its name exactly matched a library entry.

Two specific problems:

1. **Typed names** — if the user types "Barbell Squat" and creates it mid-session, the exercise row is inserted without metadata. Balance and muscle group data won't appear until they reopen the app.

2. **Library picker** — the add-exercise sheet shows a "From library" section backed by `exercises.json`. When the user taps a library row the UI knows exactly which `library_id` to use, but the original `resolveOrCreateExercise` signature had no way to receive it.

## Decision

`resolveOrCreateExercise` now accepts an optional `libraryId` parameter and links eagerly at insert time:

- If `libraryId` is supplied (library picker tap), call `matchById(id)` and write `libraryId` / `muscleGroups` / `equipment` / `libraryConfidence = 100` on the new row.
- If `libraryId` is omitted, fall back to `exactMatch(name)` and do the same if a match is found.
- Existing rows (already in the table) are returned unchanged — no update path.

`handleAddExercise` in `log-session.tsx` calls `resolveOrCreateExercise` immediately after adding the exercise to the session state (fire-and-forget via `getDB().then(...)`). Library rows pass the `libraryId` from `searchExercisePicker`; history and Create rows pass nothing.

`seedLibraryMatches` on `initDB` is kept unchanged. It continues to backfill any rows that were inserted before this change, or that were inserted by paths that don't go through `handleAddExercise`.

## Consequences

- New exercises created through the add-exercise sheet are linked to the library immediately, with no restart required.
- The `libraryId` threading adds a second parameter to `searchExercisePicker`'s return type and to `AddExerciseSheet`'s `onAdd` callback, which are internal to the log-session screen.
- Capitalisation mismatches that would defeat `exactMatch` are covered by the picker passing `libraryId` directly, since the user explicitly selected a library row.
- The existing-row path is intentionally not updated — `resolveOrCreateExercise` is idempotent on the ID it returns, and backfilling existing rows remains the responsibility of `seedLibraryMatches`.
