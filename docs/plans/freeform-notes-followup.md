# Plan: Freeform notes import follow-up

**Status:** Proposed

## Goal

Refine the freeform notes import experience by addressing destructive behavior and parser ambiguities identified during the initial implementation.

## Scope

- **Non-destructive import:** Move away from "wipe everything" imports.
- **Reps-only heuristic:** Improve parser accuracy by skipping lines that look like reps-only entries (e.g., `3 x 12`).

## Proposed Tasks

### 1. Non-destructive import behavior
`savePrograms` currently deletes all existing programs before inserting. This affects Liftosaur, Strong, and Notes importers.

- [ ] Decision: Should import be additive (append) by default?
- [ ] If destructive, add a "You will lose X programs" warning.
- [ ] Implement the chosen behavior in `programStorage.ts`.

### 2. Parser heuristic for reps-only lines
Lines like `"Bench 2 x 12"` are currently parsed as 2 sets at 12 kg, which is often a false positive for "2 sets of 12 reps".

- [ ] Implement a heuristic (e.g., weight threshold or missing unit) to identify reps-only lines.
- [ ] Skip these lines and count them as `skippedLines` in `notesParser.ts`.
- [ ] Update tests to verify that `3 x 12` is skipped while `3 x 12kg` is captured.
