# Plan: Rename exercise

**Status:** draft — not yet refined or started

---

## Goal

Let users rename an exercise from the program editor (or history). The new name should immediately reflect in all places that show it, and library matching should re-run so muscle group data stays accurate.

## Scope (initial)

- Add `renameExercise(db, exerciseId, newName)` to `src/storage.ts`:
  - Updates `exercises.name` for the given row.
  - Re-runs library matching for that single row: exact-match the new name against the library; if found, write `libraryId`, `muscleGroups`, `equipment`, `libraryConfidence`; if not found, clear those fields so stale data doesn't linger.
- Expose a rename action in the program day editor (the existing exercise list row, long-press or edit icon).
- No session-history backfill in this pass — logged sets reference `exerciseId`, so history displays automatically pick up the new name.

## Out of scope for now

- Fuzzy / suggested matching (covered by the separate "Exercise DB matching" backlog item).
- Renaming from the history/progress screens.
- Propagating renames into existing session exports.

## Acceptance criteria

- Tapping an exercise name in the day editor opens an inline text input (or bottom-sheet prompt if no tap-to-edit pattern exists yet).
- Saving a new name updates the row immediately; muscle group data reflects the new library match (or clears if unmatched) without an app restart.
- If the new name matches an existing exercise, show an error — no silent merges.

## Commit breakdown (sketch)

1. `test + feat(storage): renameExercise updates name and re-runs library match`
2. `feat(ui): rename exercise from program day editor`

Refine before starting.
