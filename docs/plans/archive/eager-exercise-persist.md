# Plan: Eager exercise persist on add

## Goal

When a user taps "Create 'Cable Fly'" or selects a library exercise in the
add-exercise sheet, two things should happen immediately:

1. The exercise name is written to the `exercises` table so it appears in
   future history lists even if the user never logs a set.
2. The `libraryId` is set on the row at creation time — either from the
   picker (if the user tapped a library row) or via an `exactMatch` lookup
   (if the name happens to match the library). This means the link is
   established without waiting for the next `seedLibraryMatches` run on app
   restart.

Currently `resolveOrCreateExercise` is only called inside `saveSession`, and
it inserts the row with no library metadata. The seed that backfills
`libraryId` only runs on `initDB` (app startup), so a newly added exercise
won't show its library match until the next restart.

## Approach

### 1 — `resolveOrCreateExercise` does its own library lookup

When creating a new exercise row, call `exactMatch(name)` inline and write
`libraryId` / `muscleGroups` / `equipment` immediately. No change to the
existing-row path (already has a `libraryId` or is a custom exercise).

This fixes the seed-timing problem for any exercise created after this
change, regardless of how it was added.

### 2 — Library picker passes `libraryId` through `onAdd`

Widen `onAdd` in `AddExerciseSheet` from `(name: string) => void` to
`(name: string, libraryId?: string) => void`. Library rows pass the
`LibraryExercise.id`; history and Create rows pass nothing.

`handleAddExercise` in `log-session.tsx` calls `resolveOrCreateExercise`
eagerly (this is the fire-and-forget from the original plan scope). For
library rows, it passes the `libraryId` so the row is enriched even if the
name doesn't exactly match the normalised `exactMatch` key (edge case:
capitalisation variants, locale differences).

### Why both?

- Fix 1 alone covers typed custom names and history taps where the name
  matches the library. It does not cover capitalisation mismatches on library
  taps.
- Fix 2 alone covers library taps but not typed names. It also requires the
  picker to thread the ID all the way through.
- Together they are robust: library tap → ID passed directly; typed name →
  `exactMatch` fallback at creation time.

## Files affected

- `src/storage.ts` — `resolveOrCreateExercise` accepts optional `libraryId`;
  on insert, uses provided ID or falls back to `exactMatch(name)`; sets
  `muscleGroups` / `equipment` from the match
- `app/log-session.tsx` — `onAdd` widened to carry optional `libraryId`;
  library rows pass `LibraryExercise.id`; `handleAddExercise` calls
  `resolveOrCreateExercise(db, name, libraryId)` eagerly
- `src/domain/searchExercisePicker.ts` — return type widens to include
  `libraryId: string` on library results so the UI can pass it through
- `__tests__/storage.test.ts` — new tests for `resolveOrCreateExercise`
- `__tests__/log-session.test.tsx` — new tests for eager persist + library ID

## Commits

1. `feat(storage): resolveOrCreateExercise sets libraryId on insert`
   - Accept optional `libraryId` param; on new-row path, use it or fall back
     to `exactMatch(name)`; write `muscleGroups` / `equipment` from match
   - Test: new exercise with exact library name → `libraryId` populated
   - Test: new exercise with provided `libraryId` → stored directly
   - Test: custom name with no library match → `libraryId` null
   - Test: existing exercise → id returned unchanged (no update)

2. `feat(domain): searchExercisePicker returns libraryId on library results`
   - Library entries in the result carry `libraryId: string`
   - History entries remain `{ name: string }` (no ID needed)
   - Test: library result includes correct `id` from exercises.json

3. `feat(ui): eagerly persist exercise on add, passing libraryId for library picks`
   - `onAdd` widened to `(name: string, libraryId?: string) => void`
   - Library rows in `AddExerciseSheet` pass `entry.libraryId`
   - `handleAddExercise` calls `resolveOrCreateExercise(db, name, libraryId)`
     immediately (fire-and-forget)
   - Test: tapping a library row calls `resolveOrCreateExercise` with the
     correct `libraryId`
   - Test: tapping a history row calls `resolveOrCreateExercise` without a
     `libraryId`
   - Test: tapping Create row calls `resolveOrCreateExercise` without a
     `libraryId`
