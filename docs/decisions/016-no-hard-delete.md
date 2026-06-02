# ADR 016: Prefer archive/disable over hard-delete for structured data

## Context

Program structure (days, exercises) is indexed by integer position. `activeDayIndex`, `dayIndex`, and `exerciseIndex` are stored as offsets in both the programs table and referenced from session history. Deleting a day shifts the indices of all subsequent entries, silently corrupting every history record that used the old position.

Code review repeatedly surfaced "what if a day is deleted?" as a correctness concern on the select-day and log-session screens. Handling this per-call site produces complex, hard-to-test defensive code throughout the domain layer.

## Decision

Structured data (program days, exercises) is never hard-deleted. Instead:

- **Program days:** marked `disabled`. The day remains at its original `dayIndex`. Hidden from the active UI but its index is stable forever.
- **Exercises:** same — archived, not deleted.
- **Session history:** immutable. Past sessions are never edited or removed.

The only path to structural replacement is a full re-import from an external source, which replaces the entire program record as a unit.

## Consequences

- Index-based references in history remain valid indefinitely — no migration or back-fill needed when the program evolves.
- "What if `total=0`?" and "what if `dayIndex` is out of bounds?" become invariant violations at the DB boundary rather than runtime edge cases scattered across the domain.
- `nextActiveDayIndex` should skip disabled days (future: requires a `disabled` flag on `program_days`).
- Schema change needed: add `disabled` boolean column to `program_days` and `exercises` tables (tracked separately, out of scope here).
- UI must handle the `disabled` state: skip disabled days when cycling `activeDayIndex`, show them greyed out in settings.
