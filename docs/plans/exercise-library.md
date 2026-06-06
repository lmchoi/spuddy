# Plan: Exercise library — program day UX

## Goal

Show muscle group balance on the program day screen and let users link exercises to a canonical library, with the app remaining fully usable if they never do.

## Out of scope

- Fuzzy name matching (exact match only)
- Search library implementation (button present, not wired)
- Muscle group volume analytics screen (separate backlog item)
- Exercise images
- Full free-exercise-db bundle

## Design

### UI layer (commits 1–2)

The program day screen gains two additions:

**Balance bar** — sits below the day title row. Shows a segmented bar of push / pull / legs / core proportions. Unmatched exercises render as a greyed segment. "N unmatched" label appears when any exercises lack a library link. Read from the `exercises` table; stubs to hardcoded data first.

**Exercise edit sheet** — replaces the existing inline name edit (`Pressable → setEditingExName`). Tapping the exercise name (underlined, separate tap target from the expand/collapse row) opens a bottom sheet with:
- Editable name field at top
- Library match section below (matched: shows library name + confidence + muscle group pills; unmatched: "no match found" + disabled Search button)

The rest of the card row (triangle, chevron, everywhere except the name) continues to expand/collapse the set grid as today.

### Data layer (commits 3–4)

Schema extension on `exercises`:
- `muscle_groups TEXT` — JSON array e.g. `["chest","triceps","shoulders"]`
- `equipment TEXT` — e.g. `"barbell"`, `"bodyweight"`
- `library_id TEXT` — foreign key into the seeded library (nullable; null = unmatched)
- `library_confidence INTEGER` — match confidence 0–100 (nullable)

New migration adds these columns (all nullable, no existing rows affected — aligns with ADR-016 no-hard-delete).

Seed table: a static JSON file of ~40 common exercises (the set that covers most Strong/Hevy imports) with muscle group and equipment data, checked in at `src/data/exerciseLibrary.ts`. On DB init, exact-name match runs over existing `exercises` rows and populates `library_id`, `muscle_groups`, `equipment`, and `library_confidence` where a match is found.

### Wiring (commit 5)

Balance bar and edit sheet read from the real `exercises` table. No new domain selectors needed beyond `muscleGroupBalance(exercises)` → `{push,pull,legs,core,unmatched}` counts.

### ADR

This plan introduces the library schema — record as ADR-018.

## Files affected

- `src/db/schema.ts` — add columns to `exercises`
- `src/db/migrations.ts` — new migration
- `src/data/exerciseLibrary.ts` — new seed file
- `src/domain/exerciseLibrary.ts` — exact-match + balance selector
- `app/(tabs)/settings/[programName]/[dayIndex].tsx` — balance bar + sheet
- `styles/tabs/settings/programName/dayIndex.styles.ts` — new styles
- `docs/decisions/018-exercise-library.md` — new ADR

## Commits

1. **UI: exercise edit sheet (stub data)** — replace inline rename with a bottom sheet; name input + hardcoded matched/unmatched states. Test: renders sheet on name tap; closing sheet does not toggle expand state.

2. **UI: muscle balance bar (stub data)** — add balance bar below day title with hardcoded push/pull/legs/core counts. Test: balance bar renders; greyed segment present when `unmatched > 0`.

3. **Schema: add muscle group + library columns to exercises** — migration adds `muscle_groups`, `equipment`, `library_id`, `library_confidence` (all nullable). Test: migration runs without error; existing exercise rows are unchanged.

4. **Data: seed library + exact-match on init** — add `src/data/exerciseLibrary.ts` (~40 exercises); run exact-match on DB init to populate columns. Test: `exactMatch('Bench Press')` returns correct library entry; `exactMatch('unknown exercise')` returns null.

5. **Wire: balance bar + edit sheet read from exercises table** — replace stub data with real queries. Test: balance bar reflects actual matched/unmatched counts; sheet shows real muscle group pills for a matched exercise.
