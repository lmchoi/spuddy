# ADR-001: Liftosaur import scope

## Context

The user has a Liftosaur backup JSON (`__tests__/fixtures/liftosaur-backup.json`) and wants to migrate data into Spuddy. The backup contains:

- 4 completed workout sessions (`history[]`)
- 1 in-progress session (`progress[]`)
- 2 programs (`programs[]`)
- Gym/equipment configuration (`settings.gyms[]`)
- 2 body weight entries (`stats.weight.weight[]`)
- App-level settings, starred exercises, affiliates, etc.

## Decision

Import **programs** and **gym/equipment configuration** only. Do not build a history import pipeline.

The 4 completed sessions will be entered manually using Spuddy's existing session entry flow.

## Consequences

- No history import code to write or test for v0.1.
- Manual entry of 4 sessions is a one-time cost acceptable at this scale.
- If the user accumulates more history in Liftosaur before migration is complete, the threshold for "worth automating" may be revisited — that would become a new ADR.
- Body weight entries and starred exercises are **not** imported; they can be re-entered if needed.
- The liftoscript program text format (used in `planner.weeks[].days[].exerciseText`) will need parsing to become actionable inside Spuddy. This is a separate problem scoped to the program import feature.
