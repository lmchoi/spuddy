# Plan: Idempotent re-import

## Goal

Make re-importing a Liftosaur JSON safe: sessions deduplicate by source ID, programs rename on clash rather than wiping. Spuddy-created data is never touched.

## Out of scope

- Liftosaur history import (separate plan, depends on this one)
- Strong import dedup (same root cause, separate backlog item)
- `start_time` / `end_time` on sessions (deferred to history import plan)
- Equipment / muscle group data (deferred to exercise library)

## Design

### Programs

`savePrograms` currently nukes all program rows then re-inserts. It is used in two ways:
1. **Internal operations** (`updateProgramDay`, `addProgramDay`) — pass the full program list, expect full replacement
2. **Import** — should merge incoming programs with existing ones, not wipe

These need to be separated. A new `importPrograms` function lives in the import layer and handles merge logic. `savePrograms` stays as the internal dumb writer and is not changed.

**Rename-on-clash:** when an imported program name matches an existing one, rename the existing to `"name (YYYY-MM-DD)"` before inserting the fresh version. If that name is also taken, append a counter: `"name (YYYY-MM-DD 2)"`, etc. Spuddy-created programs not present in the import are never touched.

### Sessions

`saveSession` does a plain insert with no conflict handling. Duplicate rows accumulate silently and are only masked at read time in `rowsToSessions`.

Add `source` and `source_id` columns to `sessions`. A unique constraint on `(source, source_id)` makes re-import a true no-op. SQLite treats NULLs as distinct in unique constraints, so manual sessions (`source_id = NULL`) correctly coexist without colliding.

## PRs

### PR 1 — Refactor: split save vs import (DONE)
Extract `importPrograms` in the import layer; `savePrograms` stays as the internal persistence primitive. No behaviour change. All existing tests pass unchanged.

### PR 2 — Session dedup
- Schema migration: add `source TEXT NOT NULL DEFAULT 'manual'` and `source_id TEXT` to `sessions`; unique constraint on `(source, source_id)`; backfill existing rows with `source = 'manual'`
- Update `saveSession` to accept optional `source`/`source_id`, use `onConflictDoNothing`
- Tests: saving same session twice with same `source_id` produces one row; two manual sessions both persist

### PR 3 — Program import: rename-on-clash
- Implement rename-on-clash logic in `importPrograms`
- Tests: import twice → no duplicates; Spuddy-only program survives re-import; name clash produces renamed copy with correct suffix; same-day clash appends counter

### PR 4 — Docs
- Update PRD section 5: replace "re-import replaces, not merges" with the new policy
- New ADR (018): supersedes ADR-008 dedup approach; records rename-on-clash for programs and `(source, source_id)` for sessions
