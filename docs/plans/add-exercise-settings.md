# Plan: Add exercise sheet in program day editor

## Goal

Replace the immediate "New exercise" placeholder in the program day editor with a bottom sheet — matching the pattern in log-session — so the user picks or types a name before the exercise is created.

## Out of scope

- Styling consistency between log-session and settings sheets (separate task)
- Muscle group / equipment metadata on rows (Stage 4 of `add-exercise-picker.md`)
- Library-link override for existing exercises (`library-link-override.md`)

## Design

**What changes:** Tapping `+ Add exercise` currently calls `addExercise()` which immediately appends `{ name: 'New exercise', targets: [{ reps: 8 }] }`. This is replaced with a bottom sheet where the user picks or types a name first.

**Reused unchanged:** `getAllExerciseNames`, `searchExercisePicker`, `resolveOrCreateExercise`.

**`libraryId` wiring:** When the user picks from the library section, `resolveOrCreateExercise(db, name, libraryId)` is called fire-and-forget — same pattern as log-session and consistent with ADR-020. This ensures the library match card in `ExerciseEditSheet` is populated immediately after adding.

**Styling:** Sheet styles copied from `log-session.styles.ts` for now. Alignment to the settings design language (`C.surface`, `C.borderHi`, backdrop overlay) is deferred.

**Files affected:**
- `app/(tabs)/settings/[programId]/[dayIndex].tsx`
- `styles/tabs/settings/programId/dayIndex.styles.ts`
- `app/log-session.tsx` (commit 3 only — `source_screen` addition)
- `__tests__/program-day-detail.test.tsx`

**Mock additions needed in tests:**
- `getAllExerciseNames: jest.fn().mockReturnValue(['Bench Press', 'Squat'])` added to existing `exerciseStorage` mock
- `jest.mock('@/src/storage', () => ({ resolveOrCreateExercise: jest.fn() }))` — not currently mocked in this file

## Commits

1. **`test + feat(ui): AddExerciseSheet component in program day editor`**
   - `AddExerciseSheet` component added to `[dayIndex].tsx`, receiving `onAdd` and `onCancel` as props — no screen state wired yet
   - Sheet styles added to `dayIndex.styles.ts` (copied from log-session)
   - Tests: input renders; history rows render; typing filters list; library section appears with a query; "Create 'x'" row appears when no exact match; tapping a row calls `onAdd` with correct args; tapping backdrop calls `onCancel`

2. **`test + feat(ui): wire add-exercise sheet into program day editor`**
   - `addExerciseSheetOpen` state added to screen
   - `+ Add exercise` button opens the sheet instead of creating a placeholder
   - `handleAddExercise(name: string, libraryId?: string)` replaces `addExercise()`: appends exercise to day via `setDay` + `persistToDb`, calls `resolveOrCreateExercise` fire-and-forget when `libraryId` present, closes sheet
   - Existing test `'adds a new exercise when + Add exercise is pressed'` replaced
   - Tests: button press opens sheet; submitting a name adds exercise to list; library row tap calls `resolveOrCreateExercise` with correct `libraryId`; dismiss leaves list unchanged

3. **`feat(analytics): track source_screen on exercise_added`**
   - Settings `handleAddExercise` fires `posthog.capture('exercise_added', { source, exercise, source_screen: 'program_editor' })`
   - Log-session `handleAddExercise` updated to add `source_screen: 'log_session'` to existing event
   - No unit test needed
