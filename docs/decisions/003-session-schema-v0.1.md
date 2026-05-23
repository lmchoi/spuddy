# ADR-003: Session history schema — defer equipment and muscle groups to v0.2

## Context

A gap analysis between Liftosaur's `HistoryRecord` and Spuddy's current `sessions` table revealed 11 fields present in Liftosaur that Spuddy does not store:

**Session-level gaps**: start time, duration/intervals, program reference (id + name), day/week context.  
**Exercise-level gaps**: equipment (e.g. "dumbbell", "band"), muscle group types (e.g. `["upper", "push"]`), program exercise linkage, notes.  
**Set-level gaps**: per-set completion timestamp, AMRAP flag, unilateral flag, progression state (increment, minReps, maxReps).

Fields that **do** map cleanly: exercise name, completed reps, completed weight, rep targets, rest timer, warmup flag, unilateral reps (repsLeft).

## Decision

Keep the current `sessions` table schema unchanged for v0.1. Accept the lossy mapping for the 4 manually-entered sessions.

The two fields most worth adding in a future version are:

- `equipment TEXT` — on the `sessions` row or a separate `exercise_metadata` table
- `muscle_groups TEXT` (JSON array) — e.g. `["upper", "push"]`

These are not added now because:
- The 4 sessions are being entered manually, not imported
- No feature in v0.1 requires equipment or muscle group filtering
- Adding columns now without a consuming feature is speculative schema

## Consequences

- Equipment and muscle group data from Liftosaur is not preserved. If a history import is built later (see ADR-001), this information would need to be re-derived (e.g. from an exercise library lookup) rather than read from the backup.
- Per-set timestamps and session duration are lost. If workout duration analytics are added in future, the schema will need a `start_time` and `end_time` column on `sessions`.
- Progression state (auto-increment config) is out of scope until Spuddy has automated progression logic.
- The decision to add `equipment` as a column vs a separate table should be made when the consuming feature is scoped — do not add it speculatively.
