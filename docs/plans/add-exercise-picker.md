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

### Stage 2 — Type-to-filter ✓ shipped

**What:** As the user types, the history list narrows to substring matches. When the typed name has no exact match in the filtered list, a "Create '[name]'" row appears at the bottom so the user never needs the header button.

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

### Stage 3 — Full library search ✓ shipped

**What:** Extend the search to also match against the bundled `exercises.json` (873 exercises). User's history results surface first; library-only results appear below under a "From library" section header. Lets users add an exercise they've never done before without knowing the exact name.

**Out of scope:** filtering by category/muscle group, exercise metadata on rows.

**Deviations from plan:**
- Library results capped at 20 per query (UX: avoids overwhelming the user; also necessary for FlatList test rendering which only renders `initialNumToRender` items by default).
- `FlatList` uses `initialNumToRender={30}` to ensure Create row renders in tests when library results are present.
- `libraryId` is not passed through `onAdd` in this stage — deferred to `eager-exercise-persist` plan which widens the interface properly.

**Commits:**

1. `feat(domain): searchExercisePicker — merge history + library results` ✓
   - Pure function `searchExercisePicker(historyNames: string[], query: string): { history: string[]; library: string[] }`
   - Deduplicates: library entries already in history are excluded from the library section
   - Library results capped at 20, sorted alphabetically
   - Test: history-only match; library-only match; deduplication when name appears in both; empty query returns full history + empty library

2. `feat(ui): add-exercise sheet searches full library` ✓
   - Two sections in the list: history results (no header when query is empty), "From library" section header + library results (only visible when query is non-empty)
   - "Create '[name]'" row still appears at bottom when query is non-empty

---

### Stage 3b — Program day editor ✓ shipped

**What:** Bring the same `AddExerciseSheet` UX (history list, library search, create row) to the program day editor (`[dayIndex].tsx`), replacing the old one-tap "New exercise" stub.

**Deviations from plan:** Not originally planned here — work was done on branch `feat/add-exercise-settings`. The component was re-implemented locally in `[dayIndex].tsx` rather than extracted to a shared location; extraction is tracked in the backlog below.

**Commits:**

1. `test + feat(ui): AddExerciseSheet component in program day editor` ✓
2. `test + feat(ui): wire add-exercise sheet into program day editor` ✓
3. `feat(analytics): track source_screen on exercise_added` ✓ — adds `source_screen: 'log_session' | 'program_editor'` to the `exercise_added` PostHog event

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

## Backlog

- **Extract `AddExerciseSheet` to a shared component** — the component is currently duplicated in `app/log-session.tsx` and `app/(tabs)/settings/[programId]/[dayIndex].tsx`. Extract to `components/spuddy/AddExerciseSheet.tsx` so Stage 4 changes only need to land in one place. Styling differences can be passed via a `sheetStyle` prop or aligned to use the same tokens.
