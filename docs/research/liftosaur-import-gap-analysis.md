# Liftosaur import gap analysis

Comparison between Liftosaur's backup JSON schema and Spuddy's current `sessions` table, produced 2026-05-23 from `__tests__/fixtures/liftosaur-backup.json` and `src/types.ts` / `src/storage.ts`.

## Key finding

Fields previously labelled "lost" are **present in the backup JSON** — they are only absent from Spuddy's current schema. A re-import from the same backup file would recover them if the schema is extended later.

## Session-level

| Liftosaur field | Spuddy field | Status | Notes |
|---|---|---|---|
| `date` (ISO8601) | `date` (YYYY-MM-DD) | Mappable | Strip time component |
| `startTime` + `intervals` | — | In backup, not in schema | Actual workout duration; `intervals` is array of `[startMs, endMs]` pairs |
| `programId` + `programName` | — | In backup, not in schema | Which program/day this session belonged to |
| `day`, `week`, `dayName` | — | In backup, not in schema | Program-day context |

## Exercise-level (HistoryEntry → ExerciseEntry)

| Liftosaur field | Spuddy field | Status | Notes |
|---|---|---|---|
| `exercise.name` | `name` | Direct match | |
| `exercise.equipment` | — | In backup, not in schema | e.g. `"dumbbell"`, `"band"` — on every `HistoryEntry.exercise` |
| `exercise.types[]` | — | In backup, not in schema | e.g. `["upper", "pull"]` — muscle group category |
| `entry.state` | — | In backup, not in schema | Progression config: `{ increment, minReps, maxReps }` |
| `entry.notes` | — | In backup, not in schema | Optional free-text notes per exercise |

## Set-level (Set → WorkingSet / Target)

| Liftosaur field | Spuddy field | Status | Notes |
|---|---|---|---|
| `completedReps` | `WorkingSet.reps` | Direct match | Only import sets where `isCompleted: true` |
| `completedRepsLeft` | `WorkingSet.repsLeft` | Direct match | Unilateral exercises |
| `completedWeight.value` (kg) | `WorkingSet.weight` | Direct match | `settings.units = "kg"` in this backup |
| `weight.value === 0` | `WorkingSet.isBodyweight` | Mappable | Derive bodyweight flag from zero weight |
| `warmupSets[]` entries | `WorkingSet.isWarmup: true` | Mappable | Liftosaur separates warmup sets into own array; flatten + tag on import |
| `reps` (planned) | `Target.reps` | Direct match | |
| `minReps` | `Target.minReps` | Direct match | Rep range lower bound |
| `weight` (planned) | `Target.weight` | Direct match | |
| `timer` (seconds) | `Target.restSeconds` | Direct match | Same unit |
| `isUnilateral` | — | In backup, not in schema | On every `Set`; derivable from `completedRepsLeft` presence but not explicit in Spuddy |
| `isAmrap` | — | In backup, not in schema | On every `Set` |
| `timestamp` (per-set ms) | — | In backup, not in schema | When each individual set was completed |

## What is genuinely not in the backup

Nothing significant. Liftosaur records everything it tracks.

## Schema extension candidates (when needed)

If any of these features are built in Spuddy, these are the fields to add:

| Feature | Fields to add |
|---|---|
| Equipment filtering / display | `equipment TEXT` on sessions row, or separate `exercise_metadata` table |
| Muscle group analysis | `types TEXT` (JSON array) on sessions row |
| Workout duration / timing | `start_time INTEGER`, `end_time INTEGER` on sessions |
| Program linkage | `program_id TEXT`, `program_name TEXT`, `day_name TEXT` on sessions |
| Automated progression | `progression_state TEXT` (JSON) on sessions |

See ADR-003 for the decision to defer all of these to v0.2+.
