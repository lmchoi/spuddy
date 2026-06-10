# ADR 019 — Idempotent re-import: session deduplication and program timestamps

**Date:** 2026-06-09  
**Status:** Decided  
**Supersedes:** [ADR 008](008-third-party-import-data-model.md) (Duplicate handling section)

---

## Context

Spuddy bootstraps its data from external sources (primarily Liftosaur JSON exports). Users may re-import the same file multiple times as they update their program or history in the source app.

Previously (per ADR 008), we used content-based hashing to deduplicate sessions. This was fragile: if a user fixed a typo in a note or slightly adjusted a weight in the source app, the hash would change, and re-import would produce a duplicate session in Spuddy.

Furthermore, importing a program used to "nuke and pave" — deleting all existing programs and re-inserting from the file. This would destroy any in-app modifications or Spuddy-exclusive programs.

## Decision

### 1. Session Deduplication by Source ID

Instead of content hashing, we now use explicit source tracking:

- Add `source` (TEXT, default 'manual') and `source_id` (TEXT) columns to the `sessions` table.
- A unique constraint is placed on `(source, source_id)`.
- For imported sessions, `source` is set to the provider (e.g., 'liftosaur') and `source_id` is the provider's internal ID.
- Since a "Session" in Spuddy's UI corresponds to multiple rows in the `sessions` table (one per exercise), the `source_id` stored in the DB is suffixed with the exercise index (e.g., `originalId_0`, `originalId_1`).
- `onConflictDoNothing()` is used during insert. If the `source_id` already exists, the row is skipped.

SQLite treats `NULL` values as distinct in unique constraints. Manual sessions (where `source_id` is NULL) will never collide with each other or with imported sessions.

### 2. Program Timestamps

Instead of overwriting or renaming programs, we allow duplicates by name but distinguish them by creation time:

- Add a `created_at` column (TIMESTAMP, default current time) to the `programs` table.
- When importing, new programs are simply inserted. If a program with the same name already exists, it is NOT replaced or renamed.
- Both the old and new programs coexist. The UI can distinguish them by their `created_at` timestamp (e.g., showing the most recent one at the top).
- Programs created in Spuddy that are not present in the import are never touched.

## Consequences

- Re-importing the same file is now perfectly idempotent and safe.
- Fixing a typo in a source session and re-importing will _not_ update the session in Spuddy (it will be skipped as a duplicate). This is acceptable as Spuddy is intended to become the source of truth post-import.
- In-app program changes are never lost; they simply coexist with any newly imported versions.
- Schema migration 0003 and 0004 are required to add the necessary columns and unique index.
