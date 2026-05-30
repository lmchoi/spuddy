# Plan: Show reps on notes import review screen

**Status:** Complete

## Goal

Update the review screen to display reps alongside sets and weight, now
that the parser captures them from the user's input.

## Current state

`exerciseMeta` shows: `3 sets · 80kg`

`ParsedExercise.sets` and `.reps` are both `number | null`. The parser
sets them only when the user explicitly wrote them. Defaults live in
`notesImport.ts`, not here.

## Display format

| sets | reps | weight | Display |
|---|---|---|---|
| 3 | 10 | 80kg | `3×10 · 80kg` |
| null | 3 | 80kg | `3 reps · 80kg` |
| null | null | 80kg | `80kg` |
| 3 | null | 80kg | `3 sets · 80kg` *(legacy fixture only — parser no longer emits this)* |
| null | null | 0 | `—` *(no weight found)* |

Rule: show what the user wrote, not the import defaults. If neither sets
nor reps was specified, omit the count entirely.

## Selector

Add a pure function `formatExerciseMeta(ex: ParsedExercise, inferredUnit)` in
`src/domain/notesReview.ts` (or inline in the component if trivial enough
— decide at implementation time). Keeps formatting logic out of JSX and
testable without rendering.

## Commits

1. `feat: add formatExerciseMeta domain selector` ✅
   - `src/domain/notesReview.ts` — pure function, 9 unit tests
   - Tests and impl landed together (pre-commit hook requires green check;
     standalone failing-test commit is not allowed by project convention)
2. `feat: show reps in notes-import-review exercise rows` ✅
   - Updated `exerciseMeta` in `notes-import-review.tsx` to call `formatExerciseMeta`
   - Updated test fixture to include reps variants (`3×10 · 80kg`, `1 set · 50kg`)
   - Removed `skippedLines` warning block
