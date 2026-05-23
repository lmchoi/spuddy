# ADR-002: Liftosaur import mode — migrate, not read-only view

## Context

When importing Liftosaur data into Spuddy, two approaches were considered:

1. **Migrate**: copy Liftosaur data into Spuddy's own SQLite schema and discard the original JSON.
2. **Read-only view**: keep the Liftosaur JSON as a sidecar, query it directly, and never write it into Spuddy's tables.

## Decision

**Migrate** — copy data into Spuddy's schema on import.

## Consequences

- Liftosaur-specific fields that don't map to Spuddy's schema are dropped at import time (see ADR-003 for which fields).
- Spuddy becomes the single source of truth; no need to carry or version the original JSON after import.
- If the user continues to use Liftosaur in parallel, re-importing would require deduplication logic. This is not a concern for v0.1 (one-time migration assumed).
- A read-only view approach would have preserved fidelity but added ongoing complexity (two schemas to query, two data sources to reconcile). Not worth it at this scale.
