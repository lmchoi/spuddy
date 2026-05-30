# Plan: Database Migrations via Drizzle ORM

## Goal
Replace the ad-hoc raw SQL schema setup in `src/storage.ts` with Drizzle ORM, giving versioned `.sql` migration files and type-safe queries going forward.

## Out of scope
- Any new schema changes (new columns, new tables) — this plan only migrates the existing schema
- Drizzle Studio or any dev tooling beyond drizzle-kit
- Cloud backup or export/import (see backlog)

## Design

**Approach:** Drizzle ORM with drizzle-kit for migration generation. Chosen over raw `PRAGMA user_version` because it produces reviewable `.sql` files without writing migration SQL by hand, and the query surface in `src/storage.ts` is small enough to rewrite now before it grows.

**Existing migration:** The `migrate()` function in `src/storage.ts` (exercise_name → exercise_id) is deleted. Since this is pre-public-release, no real user has the old schema. The current schema becomes the Drizzle baseline (`0000_initial.sql`).

**Hard-to-reverse decisions:**
- The `DB` interface (`run`/`all`) is removed — TypeScript will surface every callsite at compile time
- Generated files in `drizzle/` are the schema history source of truth — never hand-edit after applying
- Drizzle expo-sqlite adapter uses `openDatabaseSync` — the `getDB()` async singleton in `src/db.ts` simplifies slightly

**Files affected:**
- `src/db/schema.ts` — new, Drizzle table definitions
- `drizzle/` — new, generated `.sql` migration files
- `drizzle.config.ts` — new, drizzle-kit config
- `src/storage.ts` — major rewrite, queries → Drizzle API, `DB` interface + `migrate()` + `initSchema()` removed
- `src/db.ts` — update singleton to expose Drizzle client
- `__tests__/storage.test.ts` — update test setup to use Drizzle's better-sqlite3 adapter
- `package.json` — add `drizzle-orm`, `drizzle-kit`
- `docs/decisions/013-drizzle-orm.md` — new ADR

## Commits

1. **Add drizzle-orm and drizzle-kit deps** — install packages, add `drizzle.config.ts` — test: `npm ci` passes, TypeScript compiles clean
2. **Define schema in `src/db/schema.ts`** — Drizzle table definitions matching current schema — test: TypeScript compiles, no runtime changes yet
3. **Generate initial migration** — run `drizzle-kit generate`, producing `drizzle/0000_initial.sql` — test: generated SQL matches current `SCHEMA_STATEMENTS` (manual review)
4. **Wire Drizzle migration runner** — update `initDB()` to run migrations via Drizzle's `migrate()`, update test setup to use Drizzle's `better-sqlite3` adapter, remove `makeTestDB` and `DB` interface — test: all existing storage tests pass
5. **Rewrite storage.ts queries using Drizzle API** — convert all `db.run(sql)` / `db.all(sql)` to typed Drizzle query builder calls, remove old `migrate()` and `initSchema()` — test: all existing storage tests pass
6. **Write ADR-013** — document the decision to adopt Drizzle ORM — test: n/a
