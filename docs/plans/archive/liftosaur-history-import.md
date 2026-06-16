# Plan: Liftosaur history import

## Goal

Import workout history (`history[]`) from a Liftosaur backup JSON into Spuddy sessions, with re-import being a safe no-op.

## Dependencies

**Depends on `idempotent-reimport` landing first** — the `source` / `source_id` columns on `sessions` and the `(source, source_id)` unique constraint must exist before this plan can be built.

## Out of scope

- `start_time` / `end_time` on sessions — deferred until something displays session duration
- Equipment / muscle group data — deferred to exercise library
- `stats.weight` (bodyweight) and other non-history fields from the backup
- Strong import dedup (separate backlog item)

## Design

### Parser

New file: `src/liftosaurParser.ts` — pure function, no DB imports.

```
parseHistoryFromBackup(json: unknown): Session[] | ParseError
```

**Field mapping:**

| Liftosaur | Spuddy |
|---|---|
| `history[n].id` (as string) | `source_id` |
| `history[n].date` (ISO → YYYY-MM-DD) | `Session.date` |
| `entry.exercise.name` | `ExerciseEntry.name` |
| `set.completedReps` | `WorkingSet.reps` |
| `set.completedWeight` (normalised to kg) | `WorkingSet.weight` |
| `set.reps` + `set.minReps` + `set.weight` | targets |
| `warmupSets` entries | `isWarmup: true` sets |

- Skip sets where `isCompleted: false`
- `set.reps` / `set.weight` are the programmed targets; `set.completedReps` / `set.completedWeight` are actuals — both imported
- lb weights normalised to kg at parse time

### Wiring

`importProgramFromJson` (or renamed `importFromLiftosaurJson`) is extended to also call `parseHistoryFromBackup` and save each session with `source: 'liftosaur'` and `source_id: String(history[n].id)`. The `(source, source_id)` unique constraint handles dedup — re-importing is a no-op.

The Settings screen alert is updated to surface session count alongside program count.

### Hard-to-reverse decisions

- `'liftosaur'` as the source string identifier — baked into every imported session row. Changing it later requires a data migration.

## Commits

1. **`src/liftosaurParser.ts`: pure history parser + unit tests** — `parseHistoryFromBackup` maps `history[]` to `Session[]`. Tests: correct session count, exercise names, completed reps/weights, target mapping, `isCompleted: false` sets skipped, lb→kg conversion, ISO date normalisation, warmup sets flagged correctly.

2. **Wire parser into import flow + integration tests** — extend `importProgramFromJson` to call the history parser and save sessions with `source: 'liftosaur'` + `source_id`. Tests: sessions land in DB after import; re-import produces no duplicate rows.

3. **Update Settings alert to show session count** — surface `sessionsImported` in the success message alongside program names.
