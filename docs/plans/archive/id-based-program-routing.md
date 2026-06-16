# Plan: ID-based program routing

## Goal

Replace name-based program references throughout the app with integer IDs. After PR A
(idempotent re-import), programs with duplicate names can coexist — URL params like
`/settings/Push%20Pull%20Legs/0` no longer uniquely identify a program. Switching to
`programId` in all routes and storage functions fixes this.

## Out of scope

- `created_at` timestamp on programs (explored in old branch; no current consumer; deferred)
- Deduplicate-on-import / rename-on-clash (abandoned; idempotent append is sufficient)

## Changes

### Storage (`src/programStorage.ts`)
- `getPrograms` returns `id` on each `Program`
- `getProgramDay`, `updateProgramDay`, `updateActiveDayIndex`, `getProgramTotalDays`,
  `addProgramDay` all take `programId: number` instead of locating programs by name
- `updateProgramDay` and `addProgramDay` are granular — only the affected
  `program_days` / `program_exercises` rows are touched

### Types (`src/types.ts`)
- `Program.id?: number` added

### Draft keys (`src/sessionDraft.ts`)
- `draftKey(programId: number, dayIndex: number)` — ID replaces name in the key

### Hook (`src/hooks/useProgramDay.ts`)
- `useProgramDay(programId: number, idx: number)` — ID replaces name param

### Routing
- `app/select-day.tsx` → pushes `/log-session?programId=…`
- `app/log-session.tsx` → reads `programId` from params; resolves to `programs[0].id` when absent
- `app/(tabs)/settings/index.tsx` → pushes `/settings/${program.id}/${index}`
- Route renamed: `[programName]/[dayIndex]` → `[programId]/[dayIndex]`

### `src/programImport.ts`
- Wrapper function removed; `importPrograms` is now a direct re-export from `programStorage`

## Status: COMPLETE ✓

All 561 tests pass, TypeScript clean.
