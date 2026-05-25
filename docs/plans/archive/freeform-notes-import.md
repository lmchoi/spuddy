# Plan: Freeform notes import

**Status:** Complete

## Goal

A user can paste their personal workout notes (plain text, bullet list format) during onboarding and have the app create programs from them. Zero friction — paste, confirm unit, done.

See **ADR-009** for all design decisions.

## Scope

- Heuristic parser: three line patterns, section headers as program names
- Unit confirmation pill (kg / lbs) when unit is ambiguous
- Each exercise gets a stable UUID; raw name stored as display label
- No exercise library matching — raw strings only
- Accessible from Settings
- After import → programs view

## Out of scope

- Claude API parsing
- Exercise library matching / muscle group data
- Deduplication across multiple pastes
- Reps entry during import

## Data model notes

- `ExerciseEntry` already has `name: string` — used as display label
- `id?: string` added to `ExerciseEntry` as optional (not required by existing data)
- `WorkingSet.reps` widened to `number | null` throughout the UI
- All weights stored in kg

## Commits

### ✅ 0. Schema — widen `WorkingSet.reps` to `number | null`, add `ExerciseEntry.id?`

`40a54a3`

- Widened `WorkingSet.reps: number` → `number | null`
- Added `ExerciseEntry.id?: string` (optional to preserve existing data compatibility)
- Updated `status.ts`, `stats.ts`, `strongImport.ts`, `add.tsx`, `progress/[date].tsx` for null safety
- Storage round-trip tests added for both changes

### ✅ 1. Walking skeleton — paste → programs created (stubs throughout)

`948663c`

- Added "Paste workout notes" entry in Settings Data section
- New `app/notes-import.tsx` with paste area and Import CTA
- `parseWorkoutNotes` stub returning fixed `ParsedNotes`
- `importFromNotes` stub returning `{ success: true, programsCreated: 0 }`
- Flow navigable end-to-end before real logic

### ✅ 2. Parser — `parseWorkoutNotes` (TDD first)

`d87eb6b`

- 21 tests written before implementation
- Three patterns: `Nx weight[unit]`, `name - weight[unit]`, `name weight[unit]` (explicit unit required)
- Section headers trigger new `ParsedSection`; no header → `"My Workout"`
- `inferredUnit` set when all explicit annotations agree, null if mixed or absent
- `skippedLines` counts unrecognised lines
- Fixed `NX_WEIGHT_RE`: require `\s+` after `x` to avoid matching reps-only `3x12`

### ✅ 3. Import screen — real UI

`535a713`

- Live preview below paste area: section names + exercise count per section
- Skipped lines shown as muted note when > 0
- `kg | lbs` pill hidden when `inferredUnit` is not null
- "Import N programs" CTA (disabled until exercises parsed)
- 6 UI tests covering render, disabled state, live preview, unit picker, CTA label

### ✅ 4. Persistence — `importFromNotes`

`44c2043`

- Each `ParsedSection` → one `Program` with one `ProgramDay`
- `explicitUnit` on exercise overrides passed unit for lbs→kg conversion
- Reuses `savePrograms` from `programStorage.ts`
- 6 integration tests against real in-memory SQLite DB

### ✅ 5. Wire up + finalise entry points

`2a4f690`

- `NotesImportScreen` wired to real `importFromNotes`
- On success: Alert with program count → navigate to `/(tabs)/settings`
- Settings test suite extended: "Paste workout notes" row exists and navigates to `/notes-import`
