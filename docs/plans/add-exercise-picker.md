# Plan: Add exercise picker

## Goal

Improve the "Add exercise" sheet in log-session so the user can pick from exercises they've done before (and eventually browse the full library), rather than always typing a name from scratch.

## Stages

---

### Stage 1 — History list ✓ shipped

**What:** Open the sheet → scrollable list of all exercises from the user's history → tap to add. Text input remains at the top for adding a custom name.

**Out of scope:** filtering, sorting by recency, library exercises.

**Design:**
- `getAllExerciseNames(db): string[]` added to `src/exerciseStorage.ts` — Drizzle select on `exercises.name`, `orderBy asc`. No domain logic.
- `AddExerciseSheet` calls `getDB()` in a `useEffect` on mount (consistent with the rest of `log-session.tsx` — db is never passed as a prop). Result stored in local state.
- `FlatList` rendered below the text input. Each row is a `Pressable` calling `onAdd(name)`.
- Sheet gets a `maxHeight` to cap growth on large histories.
- Styles in `log-session.styles.ts` using existing palette/theme tokens.

**Files affected:**
- `src/exerciseStorage.ts` — new `getAllExerciseNames`
- `__tests__/exercise-storage.test.ts` — unit tests
- `app/log-session.tsx` — `AddExerciseSheet` augmented
- `styles/log-session.styles.ts` — list row + sheet height styles

**Commits:**

1. `feat(storage): getAllExerciseNames — fetch all exercise names alphabetically`
   - Test: returns names alphabetically; returns `[]` when table is empty

2. `feat(ui): add-exercise sheet shows history list`
   - `AddExerciseSheet` loads history on mount via `getDB()`, renders `FlatList` below text input
   - Tapping a row calls `onAdd(name)` and closes the sheet
   - Text input + header "Add" button remain for custom names
   - Test in `__tests__/log-session.test.tsx`: mocked history renders as rows; tapping a row fires `onAdd`

---

### Stage 2 — Type-to-filter

**What:** As the user types, the history list narrows to substring matches. When nothing matches, a "Create '[name]'" row appears at the bottom of the list so the user never needs the header button.

**Out of scope:** fuzzy matching, library exercises.

**Commits:**

1. `feat(domain): filterExerciseNames — substring match for exercise picker`
   - Pure function `filterExerciseNames(names: string[], query: string): string[]`
   - Case-insensitive substring match, preserves alphabetical order
   - Test: matches mid-word; empty query returns full list; no match returns `[]`

2. `feat(ui): add-exercise sheet filters list as user types`
   - Sheet passes query to `filterExerciseNames` on each keystroke
   - "Create '[name]'" row appended when filtered list is empty or no exact match
   - Header "Add" button removed (replaced by "Create" row)

---

### Stage 3 — Full library search

**What:** Extend the search to also match against the bundled `exercises.json` (873 exercises). User's history results surface first; library-only results appear below under a "From library" section header. Lets users add an exercise they've never done before without knowing the exact name.

**Out of scope:** filtering by category/muscle group, exercise metadata on rows.

**Commits:**

1. `feat(domain): searchExercisePicker — merge history + library results`
   - Pure function `searchExercisePicker(historyNames: string[], query: string): { history: string[]; library: string[] }`
   - Deduplicates: library entries already in history are excluded from the library section
   - Test: history-only match; library-only match; deduplication when name appears in both; empty query returns full history + empty library

2. `feat(ui): add-exercise sheet searches full library`
   - Two sections in the list: history results (no header when query is empty), "From library" section header + library results (only visible when query is non-empty)
   - "Create '[name]'" row still appears at bottom when query is non-empty

---

### Stage 4 — Richer browsing

**What:** When no query is typed, add filter chips above the list (by category or muscle group). Each row shows a metadata hint (e.g. "Barbell · Chest"). Useful for browsing when the user doesn't know the exact name.

**Out of scope:** exercise images, full detail sheet.

**Commits:** TBD — design this stage when Stage 3 is shipped.

---

## Not in any stage

- Fuzzy/typo-tolerant matching
- Exercise images
- Manual library link overrides (that belongs to the exercise edit sheet in the program settings screen)
