# Plan: Notes-import review screen

## Goal
Replace the inline "Import" button on the paste screen with a "Review" button that pushes to a new read-only review screen. The review screen shows what the parser understood and what defaults will be applied, then has the Import button.

## Out of scope
- Editing individual exercises or set counts
- Per-exercise reps targets
- Parser changes
- New types or domain changes

## Design

### Flow
Paste screen → tap "Review" → review screen → tap "Import"

### Paste screen change (`app/notes-import.tsx`)
- Rename the CTA from "Import N programs" → "Review N programs"
- On press: push to `/notes-import-review` with `ParsedNotes` serialised as a route param (JSON string)
- Remove `handleImport` and the `importing` state — import logic moves to the review screen

### Review screen (new `app/notes-import-review.tsx`)
- Receives `ParsedNotes` via `useLocalSearchParams` (deserialise from JSON)
- Header: back arrow + "Review import"
- Summary line: "N programs · M exercises"
- One card per section: section name pill + exercise rows (dot · name · sets · weight)
  - Set count shown as-is from parser; where `sets === 1` and the parser defaulted (i.e. no explicit `Nx` prefix), show a subtle "default" label so user knows it was assumed
- Defaults callout: a small inline note explaining "Exercises without a set count will use 1 set"
- Skipped lines warning if `skippedLines > 0`
- Sticky bottom bar: "Import N programs" button → calls `importFromNotes`, then navigates

### Passing data between screens
`ParsedNotes` is a plain JSON-serialisable object (no dates, no functions). Encode as `JSON.stringify` in the param, `JSON.parse` in the review screen. Keep it simple — no context, no global state.

**Hard-to-reverse?** Route param approach is easy to change later. The new screen is additive — no existing behaviour removed.

### Detecting defaulted sets
The parser sets `sets: 1` both when the user writes `1x` explicitly and when no set count is given. To distinguish them, add an `inferredSets: boolean` field to `ParsedExercise` in the parser — `true` when sets was defaulted, `false` when explicitly parsed. This is a small parser change but required to show the "assumed" label accurately.

## Commits
1. ✅ `feat(parser): add inferredSets flag to ParsedExercise` — marks exercises where set count was defaulted rather than explicit; update notesParser tests
2. ✅ `feat: add notes-import-review screen` — read-only review of parsed data; shows section cards, exercise rows, defaults callout, skipped warning, Import button
3. ✅ `feat: wire Review button on paste screen to review screen` — replaces inline Import CTA; passes ParsedNotes as JSON route param

## Deviations
- On successful import, the review screen navigates directly via `router.replace` instead of showing an `Alert` with an OK button. The Alert added no value since the review screen already gave the user a chance to review before committing.
