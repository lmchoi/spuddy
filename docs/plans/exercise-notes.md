# Plan: Exercise Notes

## Goal

Allow users to attach a persistent cue or technique note to any exercise. The note shows below the exercise name during a session (read-only, muted) and is editable via a bottom sheet. Notes are global to the exercise, not per-program or per-session.

## Design

### UX (Option D — explicit button) ← updated from original Option A ghost row
- **Empty**: small bordered "Add note" button below the exercise name. Unambiguous CTA — preferred over the near-invisible ghost text given one-handed, mid-set usage.
- **Filled**: note text in `C.sub` with a separate "Edit" button aligned right. Tapping "Edit" (not the text) opens the sheet.
- **Edit**: opens a bottom sheet with a `TextInput`. `KeyboardAvoidingView` wraps the sheet so it rides above the keyboard rather than being obscured by it.
- **Saving**: on sheet dismiss ("Done"), write to DB immediately. No draft needed — notes are low-stakes and small.

See `docs/mockups/exercise-note-ux.html` for the interactive mockup.

### Schema
Add `notes TEXT` column (nullable) to the `exercises` table via a migration.

```sql
ALTER TABLE exercises ADD COLUMN notes TEXT;
```

`ALTER TABLE … ADD COLUMN` is safe in SQLite for nullable columns with no default — no table reconstruction needed.

### Storage
Two new functions in `src/exerciseStorage.ts` (new file, keeps note I/O separate from session/program storage):
- `getExerciseNote(db, exerciseId): string | null`
- `setExerciseNote(db, exerciseId, note: string | null): void`

Both are synchronous — Drizzle's `.get()` and `.run()` are sync calls; async wrappers were hiding write errors.

### Types
No change to `ExerciseEntry` or `ProgramDay` — notes are fetched separately when the session screen loads, keyed by `exerciseId`. This avoids threading note data through the session reducer.

### log-session.tsx
- On load, after resolving the day, fetch all notes for the day's exercises in one query (or per-exercise — N is small).
- Store notes in screen state as `Record<exerciseId, string>`.
- Render a `NoteRow` component below `ex.name` in the scroll content.
- `NoteRow` receives the note text (or null) and an `onEdit` callback.
- A `NoteSheet` component (bottom sheet overlay, same pattern as the editing overlay in the mockup) handles the `TextInput` + Done button. On Done, call `setExerciseNote` and update local state.

## Out of scope
- Notes on exercises that have no `exerciseId` (shouldn't happen post-exercise-centralization, but guard with a disabled edit affordance if `exerciseId` is undefined).
- Editing notes outside of the session screen (future exercise management screen).
- Markdown / rich text.

## Commits

1. [x] **migration**: Add `notes TEXT` column to `exercises` table. Add migration test. — test: `storage.test.ts`
2. [x] **storage**: Add `src/exerciseStorage.ts` with `getExerciseNote` and `setExerciseNote`. — test: new `exercise-storage.test.ts`
3. [x] **ui**: Add `NoteRow` and `NoteSheet` components + wire into `log-session.tsx`. — test: visual / manual
4. [x] **fix**: Make `getExerciseNote` and `setExerciseNote` synchronous — silenced write errors and inconsistent with storage layer.
5. [x] **fix**: Block exercise strip while sheet is open; add Cancel button + backdrop dismiss; move sheet-close to after save.
6. [x] **fix**: Wrap NoteSheet in `KeyboardAvoidingView` so the sheet is not obscured by the keyboard on device.
7. [x] **feat**: Replace ghost note row (Option A) with explicit "Add note" / "Edit" button (Option D) for clearer tap affordance.

## Implementation notes

- Migration 0001 `when` timestamp must be greater than 0000's `when` (1780135301055) so that `seedMigrationsIfNeeded` — which seeds 0000 as already-applied on pre-Drizzle DBs — does not cause Drizzle to skip 0001 as well. Used 1780221701055 (one day later).
- Notes are fetched per-exercise on session load via a sync for-loop (originally `Promise.all` + async map, simplified when storage became sync).
- `exerciseId` guard on `NoteRow` render: exercises without an id (shouldn't occur post-centralisation) simply show no note affordance rather than crashing.
