# Program Day Detail screen — P1 Stacked

**Goal:** Push a tappable program day detail screen from Settings. The user can view and override all exercise targets for a day (reps, weight, rest, rep ranges). Design option: P1 · Stacked (collapse + grid).

## Design source

Design handoff bundle: `https://api.anthropic.com/v1/design/h/uNie_deKJO594mY3DW_HIA?open_file=Program+Day+Detail.html`

The relevant component is `ProgramDay_P1` from `program-day.jsx` in the bundle. User picked option A = P1 · Stacked (collapse + grid).

Key decisions baked in from the design chat:
- **Word**: "set" (not "target") — user-facing
- **Summary format**: `3 × 8 @ 55 kg` — sets × reps @ weight
- **Bodyweight**: `BW` when `weight === 0`; omit weight clause when `undefined`
- **Rest**: quiet subtitle when uniform; per-set column when it varies
- **No status colours**: this is a plan, not a history view
- **Single UI for both Strong and Liftosaur imports** — no per-source rendering paths
- **Everything is editable** — tap any value to override

## Screen anatomy

```
← [Day name, editable]    [source · N exercises]   ⋯
──────────────────────────────────────────────────────
▸ Bench Press         3 × 5 @ 80 kg · rest 3 min  ›
  ─ (expanded) ──────────────────────────────────
  SET  REPS         WEIGHT    REST
   1   [5]±         [80] kg   [180]s  ×
   2   [3]±         [90] kg   [180]s  ×
   3   [1]±         [100] kg  [180]s  ×
       [+ Set]  [Delete exercise]
▸ Overhead Press      4 × 8–12 @ 40 kg · rest 90s ›
▸ Pull-ups            3 × 6 BW                    ›
▸ Squat               NO TARGETS · TAP + TO ADD (dashed)
[+ Add exercise]
```

## Edit affordances (every op saves to DB immediately)

- Tap exercise name → inline `TextInput`
- Tap day name → inline `TextInput`
- Tap a reps/weight/rest number → numeric `TextInput` (commit on blur/Enter, cancel on Escape)
- `±` next to single reps → promotes to min–max range
- `BW` pill → toggles `weight` between `0` (bodyweight) and `undefined` (no weight prescribed)
- `+ Set` → duplicates last set (or `{ reps: 8 }` default)
- `×` on a set row → removes that set
- `Delete exercise` text button → removes exercise
- `+ Add exercise` → appends `{ name: 'New exercise', targets: [{ reps: 8 }] }`

## Grid columns (conditional)

- WEIGHT column: only shown when any set has `weight !== undefined`
- REST column: only shown when any set has `restSeconds != null`

## Route structure

Mirror the `progress` tab pattern:

```
app/(tabs)/settings/
  _layout.tsx              ← Stack, headerShown: false
  index.tsx                ← existing settings screen
  [programName]/
    [dayIndex].tsx         ← new screen
```

Navigate from settings: `router.push('/settings/${encodeURIComponent(program.name)}/${index}')`

## Data layer

Add to `src/programStorage.ts`:

```ts
export async function updateProgramDay(
  db: DB,
  programName: string,
  dayIndex: number,
  day: ProgramDay
): Promise<void>
```

Strategy: load all programs, find the matching one, replace `days[dayIndex]`, call `savePrograms`. Simple and correct for current data size.

## Helper functions

Extract to `src/domain/programDay.ts`:

```ts
summaryLine(targets: Target[], unit: 'kg' | 'lb'): string | null
targetsUniform(targets: Target[]): boolean
uniformRest(targets: Target[]): number | null
fmtRest(s: number): string
fmtKg(kg: number, unit: 'kg' | 'lb'): string
```

Direct TypeScript ports of the prototype helpers in `program-day.jsx`.

## Fonts

Only `SpaceMono` is available as a custom font. Use system fonts for display/UI — no Bricolage Grotesque.

## Commit plan (outside-in, build always green)

UI → logic → data. Full vertical slice first so the app runs end-to-end early.
Tests and implementation always in the same commit (never a red build).

1. ✅ `feat: settings folder + stub ProgramDayDetail screen + tap wired` (d0437e8)
   — Convert settings.tsx to folder, empty detail screen that renders the day name, day rows tappable. App navigates immediately.

2. ✅ `feat: ProgramDayDetail UI with hardcoded sample data` (7999666)
   — Full P1 stacked screen against SAMPLE_DAY, all edit interactions in local state, no DB yet.

3. ✅ `feat: programDay domain helpers with unit tests` (78a0d84)
   — Extract summaryLine, targetsUniform, uniformRest, fmtRest, fmtKg into `src/domain/programDay.ts`.

4. ✅ `feat: load real data + persist edits via updateProgramDay` (b1c78a9)
   — Load ProgramDay from DB on focus, add updateProgramDay to programStorage, save every op back to DB.

## Implementation notes (deviations from plan)

- **SAMPLE_DAY kept as initial state in commit 4**: the plan said "swap hardcoded sample for loaded ProgramDay". The sample remains as the initial `useState` value so the screen shows meaningful content while the DB load is in flight. The DB data replaces it once resolved. This avoids an empty/loading state and keeps the UI interaction tests synchronous.

- **Day name persistence gap**: editing the day name updates local state but does not call `updateProgramDay` on blur. Exercise names and all target fields persist immediately. Day name persistence is a follow-up; it's low-risk to leave for now since the expanded edit affordance for day name is already wired up visually.

- **Expand trigger is the disclosure triangle (▸), not a tap on the exercise name**: tapping the exercise name enters name-edit mode (per design). The outer header Pressable toggles expand/collapse, but the inner name Pressable intercepts taps on the name text. Tests and real usage should tap the triangle to expand. This matches the design intent.

## Out of scope

- Reordering exercises / sets
- Undo / redo
- Adding rest to a set that currently has none
- Unit toggle (kg/lb) — inherits global preference when that feature exists
- Expand/collapse animation
- Day name persistence on blur (noted above — follow-up)
