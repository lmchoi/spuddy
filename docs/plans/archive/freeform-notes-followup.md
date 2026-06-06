# Plan: Freeform notes import follow-up

**Status:** Done

## Goal

Refine the freeform notes import experience by addressing destructive behavior and parser ambiguities identified during the initial implementation.

## Scope

- **Non-destructive import:** Move away from "wipe everything" imports.
- **Parse reps from notes input:** Extend the parser to understand reps and sets from a wider range of natural note formats, and thread them through to program targets.

## Parsing heuristic (implemented)

`x` at end of a number = reps marker (`3x 80kg` → 1 set × 3 reps × 80kg).
`NxM` (compact, no spaces) = sets × reps (`3x10 80kg` → 3 sets × 10 reps × 80kg).
Two bare numbers: smaller = reps, larger = weight.
No lines are ever skipped — every bullet produces a `ParsedExercise` (weight=0 if no number found).

`ParsedExercise.sets` and `.reps` are `number | null` — null means the user didn't write that value.
Defaults (`DEFAULT_SETS = 1`, `DEFAULT_REPS = 10`) are applied only in `notesImport.ts`.
User-configurable defaults can be added later by adding an optional param to `importFromNotes`.

## Proposed Tasks

### 1. Non-destructive import behavior ✅

Decision: import is additive — notes import appends a new program, never replaces existing ones.
Program name includes the import date: `"My Program – 2 Jun 2026"`.

- [x] `importFromNotes` loads existing programs via `getPrograms`, appends the new program (date-stamped name), then calls `savePrograms` with the full list.
- [x] Test: importing twice leaves both programs; first is untouched.

### 2. Parse reps from notes input ✅

- [x] Add `reps: number | null` and `sets: number | null` to `ParsedExercise` (null = not specified by user).
- [x] Rewrite `parseBulletLine` using token extraction + size-based heuristic.
- [x] Thread `reps` through `notesImport.ts` — defaults applied via `?? DEFAULT_REPS`.
- [ ] Update review screen to show `{sets}×{reps} · {weight}…`. (backlog — not in milestone scope)

### 3. Parser heuristic for reps-only lines — superseded by task 2

Skipping lines caused silent data loss. The new parser never skips — ambiguous lines
produce an exercise with `weight=0` which is visible on the review screen.

## Commits

1. ✅ **fix: notes import appends new program with date-stamped name** (`8c87f17`) — test (import twice leaves both programs, first untouched) + implementation (`importFromNotes` loads existing programs, names new one `"My Program – D Mon YYYY"`, appends, saves)
