# Plan: Manual library link override

## Goal

Enable the "Search library" button in `ExerciseEditSheet` so users can manually link an unmatched exercise to a library entry, making muscle group data appear immediately without waiting for auto-matching to fix itself.

## Out of scope

- "Change match" — swapping an existing library link (separate follow-up feature; button stays disabled when already matched)
- "Remove match" / unlink
- Sorting or filtering results by category/muscle group
- Propagating the new link to already-logged sessions (the muscle group data is on the exercise row, so history screens pick it up automatically)

## Design

**UI — content swap inside `ExerciseEditSheet`**

A `mode: 'edit' | 'search'` state flag inside `ExerciseEditSheet`. In search mode the name input and library match sections are replaced by a search `TextInput` (auto-focus) + `FlatList` of `searchLibrary` results. The single `KeyboardAvoidingView` stays in place — no nesting issues.

"Search library" button enabled only when `!isMatched`. "Change match" button left untouched (still disabled).

**How the match card updates after picking**

`ExerciseEditSheet` gets a new `onLink: (libraryId: string) => void` prop. The parent handler:
1. Calls `setExerciseLibraryLink(db, exerciseName, libraryId)` — awaited inside `getDB().then()` before updating state, to prevent a `useFocusEffect` re-fetch from overwriting the optimistic update before the DB write lands
2. Calls `matchById(libraryId)` synchronously (from `exercises.json`) to construct an updated `ExerciseLibraryRow` and update `libraryData` state — no DB round-trip needed for the UI update

**`setExerciseLibraryLink(db, exerciseName, libraryId)`**
Writes `libraryId`, `muscleGroups`, `equipment`, `libraryConfidence: 100` where `name = exerciseName`. Write-only for now (no clear path — deferred with "Change match"). Lives in `src/exerciseStorage.ts`.

**`searchLibrary(query)`**
New file `src/domain/searchLibrary.ts`. Empty query returns `[]`. Up to 20 results, alphabetical, case-insensitive substring match. Distinct from `searchExercisePicker` — no history bias, every library entry is a candidate.

**Commit ordering:** inside-out (storage → domain → UI). Storage and domain are trivial single functions with obvious interfaces — no design uncertainty that outside-in would help surface.

**Files affected:**
- `src/exerciseStorage.ts` + `__tests__/exercise-storage.test.ts`
- `src/domain/searchLibrary.ts` + `__tests__/searchLibrary.test.ts`
- `app/(tabs)/settings/[programId]/[dayIndex].tsx`
- `styles/tabs/settings/programId/dayIndex.styles.ts`
- `__tests__/program-day-detail.test.tsx`
- `e2e/library-link-search.yaml`

**No hard-to-reverse decisions** — follows patterns from ADR-020. No ADR needed.

## Commits

1. **`test + feat(storage): setExerciseLibraryLink — write manual library match to exercises table`** ✓
   - Writes `libraryId`, `muscleGroups`, `equipment`, `libraryConfidence: 100` where `name = exerciseName`
   - Tests: correctly writes all four fields; no-ops when exercise name doesn't exist in table

2. **`test + feat(domain): searchLibrary — substring search over bundled exercise library`** ✓
   - `src/domain/searchLibrary.ts` — up to 20 results, alphabetical, case-insensitive, empty query returns `[]`
   - Tests: mid-word match; empty query returns `[]`; capped at 20; alphabetical order

3. **`test + feat(ui): content-swap search mode in ExerciseEditSheet`** ✓
   - `mode: 'edit' | 'search'` state in `ExerciseEditSheet`; `onLink` prop added to screen
   - "Search library" button enabled when `!isMatched`; pressing enters search mode
   - Search mode: auto-focus TextInput + FlatList of `searchLibrary` results
   - Tapping a result: calls `onLink(libraryId)` → parent fires `setExerciseLibraryLink` + updates `libraryData` optimistically via `matchById`; mode returns to `'edit'`
   - Back/dismiss from search mode returns to `'edit'` with no change
   - Tests: button enabled for unmatched; disabled for matched; search mode opens on press; results render; tapping result updates match card; dismiss leaves match unchanged

4. **`feat(analytics): track library_link_set`** ✓
   - `posthog.capture('library_link_set', { exercise: name, library_id: libraryId })` in parent handler

5. **`fix(ui): await db write before updating libraryData to prevent focus-revert`** ✓
   - `setLibraryData` moved inside `getDB().then()` so state only updates after DB write lands
   - Prevents `useFocusEffect` re-fetch from reading stale data and overwriting the match card
   - Test: deferred `getDB` promise proves state does not update until write completes

6. **`test(e2e): library link search — select and persist`** ✓
   - Maestro flow: navigate to Push day, open Bench Press sheet, search library, pick result, assert 100% match card, dismiss and reopen

## Deferred / backlog

- **Pre-populate search with exercise name** — initialise the search input with the existing exercise name so results appear immediately on open. Small UX improvement, zero risk.
- **Auto-rename after linking** — after picking a library entry, rename the program exercise to the canonical library name. Safe for the common case: rename the exercises table row `name` column (sessions use `exerciseId` FK so history stays intact). Blocked on the collision case: if the library name already exists as a separate exercises row, the UNIQUE constraint on `exercises.name` prevents the rename. Removing the constraint was considered but rejected (silent duplicates). Correct solution is merge (see below).
- **Merge exercises** — consolidate two exercises rows (and their sessions) into one. Needed when rename collides with an existing row. Prerequisite for fully correct auto-rename in the collision case.
- **"Change match"** — ✓ shipped. Unlink / "Remove match" remains deferred.
