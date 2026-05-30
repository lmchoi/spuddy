# Backlog

Items that are scoped and prioritised but not yet assigned to an active milestone plan.

---

## Session logging (v0.2)

- **Finish workout button always visible** — a "Finish" button in the top-right corner so users can end the session before completing the last set of the last exercise. Currently only appears after the final set.
- **Add another set** — allow adding an extra set beyond the program target during a session.
- **Show PRs during session** — surface the user's best performance per exercise while logging. Cross-reference with `docs/plans/personal-records.md`.

## Post-MVP (v0.3+)

- **Database Migrations** — transition away from raw `CREATE TABLE IF NOT EXISTS` as the app enters production. Consider migrating to **Drizzle ORM** (the Expo-recommended standard for local SQLite, offering full type-safety and automated migrations) or adopting a standard **`PRAGMA user_version`** raw SQL approach if keeping dependencies at zero.
- **Testing Maturity** — while the current `better-sqlite3` in-memory setup is excellent for fast unit/integration tests, consider:
  - Adding **E2E tests (e.g., Maestro)** to verify native device persistence (testing the actual Expo/SQLite native bridge across app restarts). See `docs/decisions/006-e2e-testing-approach.md`.
  - Adopting type-safe query testing via an ORM (like Drizzle's mocked driver) if transitioning away from raw SQL, reducing reliance on manual type casting.
- **Back button: warn + resume** — pressing back during a session should warn the user and offer to save progress for later resumption. On next session start, offer resume or start fresh. More complex state management.
- **Save session as new day or replace** — when finishing, allow saving to a different date or overwriting an existing session for that date.

## Deferred (pending exercise DB)

- **Swap exercise** — swap an exercise mid-session for an equivalent. Requires exercise DB integration.
- **Add new exercise** — add an ad-hoc exercise to a session. Same dependency.

## Database & Infrastructure

- **Migrate to Drizzle ORM** — Replace manual SQL migrations and raw queries with Drizzle ORM for better type safety, automatic migration generation, and robust schema evolution. This should be done before the public release to simplify future schema changes for users.

## Import / data

- **Imported session target display preference** — currently we hide the "on target" card when a session has no targets (imported history). A future setting could let users choose: hide / assume met / show N/A. Defer until there's user demand. Designed to be cheap: one `AsyncStorage` key, three options, no data-model change.
- **Strong import dedup** — re-importing the same file appends duplicate sessions. A content-hash or date-based dedup check can be added without any schema change.
- **Exercise DB matching** — `exerciseId` FK to canonical library is deferred. Equipment hints from the CSV import are stored and ready to use when on-demand matching is built.
