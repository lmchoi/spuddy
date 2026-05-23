# ADR-004: Program schema — day-centric, no week hierarchy

## Context

To support session logging (v0.2), the app needs to know what exercises to log against on a given day. This requires importing program structure from a Liftosaur backup JSON, which has a full hierarchy: `program → week → day → exercise → sets with targets`.

Three options were considered:

| Option | What is stored |
|---|---|
| Flat | Just a list of exercises + targets per day, no program/day identity |
| Day-centric | Program name + named days, each with an ordered exercise + target list |
| Full fidelity | Mirror Liftosaur's full hierarchy including weeks |

**Flat** was rejected because exercise name is the join key between programs and session history. Without a day identity, there is no way to later ask "which day am I on in my rotation?" — retrofitting that would require a migration once real data exists.

**Full fidelity** was rejected as over-engineering. Week and block structure is not needed until scheduling or periodisation features are built (v0.3+).

## Decision

Use a day-centric schema: `programs` (name) → `program_days` (name, sort_order) → `program_exercises` (exercise_name, sort_order, targets_json).

No week or block level. This is the minimal structure that:
- Supports selecting a day and logging against it (v0.2)
- Preserves program and day identity for rotation/scheduling (v0.3+)
- Is flexible enough to accommodate programs from other sources that may not have week structure

## Consequences

- Liftosaur's week grouping is discarded on import. Days are imported flat, preserving their name and order within the program. This is recoverable — if week structure is needed later, it can be added as an optional `week_number` column on `program_days` without touching existing rows.
- Programs from other apps (Strong, Hevy, custom CSV) only need to produce named days — no week structure required.
- `program_exercises.exercise_name` joins to `sessions.exercise_name` by string. Name consistency on import is load-bearing; see `docs/data-model.md`.
