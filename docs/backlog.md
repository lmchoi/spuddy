# Backlog

Sections are ordered by priority. New items land in **Inbox** first; triage moves them up. **Blocked** items have a hard dependency noted inline.

---

## Up next (MVP)

Core loop for a new user setting up via notes import or a simple program.

- **Select program day** — allow the user to choose which program day to run (e.g. Day A / Day B) before starting a session, rather than always defaulting to the next scheduled day.
- **Rest timer push notifications** — alert the user when rest expires even if they switch apps. Full spec in `docs/plans/rest-timer-notifications.md`. Depends on rest timer UI (done).
- **Data export (safety net)** — export all sessions as JSON via the system share sheet. Primary motivation is protecting user data during schema migrations. Already specified in PRD §7.9 as Must Have; implement before any migration that changes the sessions table.
- **Sentry error monitoring** — open PR exists; crash reporting configured, PII scrubbing resolved, session replay deferred. Remaining: decide on structured logging needs beyond crash reports.
- **Back button: warn + resume** — pressing back during a session should warn the user and offer to save progress for later resumption. On next session start, offer resume or start fresh. More complex state management.
- **Migrate to Drizzle ORM** — replace raw `CREATE TABLE IF NOT EXISTS` and manual queries with Drizzle ORM for type safety, automatic migration generation, and robust schema evolution. Do this before public release. Consider `PRAGMA user_version` raw SQL as a lighter alternative if keeping dependencies at zero.
- **reconcileDraft: match exercises by identity not position** — `reconcileDraft` currently maps `loggedSets` and `extraSetCounts` by array index. Deleting an exercise from the middle of a day silently shifts all subsequent exercises' logged data. Fix by matching on `exerciseId` (or `name` as fallback). Superseded by program versioning if that lands first — see `docs/ideas/program-versioning.md`.
- **Android UI alignment** — standardise spacing, typography, and touch targets per `docs/plans/android-ui-alignment.md`. Phase 1 (design tokens + ADR 014) is drafted; implementation not started. Every new screen without tokens is another one to retrofit.
- **App versioning** — align the GitHub release tag, `app.json` `version`, and `android.versionCode` / `ios.buildNumber` so they stay in sync. Decide on a versioning policy (e.g. semver tags drive `app.json`). Gets messier the more releases are cut without a policy.

## Next milestone (Strong parity)

Features needed for a power user migrating from Strong with years of history.

- **Integrate canonical exercise library** — choose and bundle a canonical exercise library (e.g. free-exercise-db) with muscle group, equipment, and image data. Required before exercise DB matching, swap exercise, and any muscle-group-aware features can be built. See ADR-008 for context.
- **Show PRs during session** — surface the user's best performance per exercise while logging. Cross-reference with `docs/plans/personal-records.md`.
- **Strong import dedup** — re-importing the same file appends duplicate sessions. A content-hash or date-based dedup check can be added without any schema change.
- **Exercise DB matching** — match imported exercise names to canonical library entries on demand; unmatched names fall back to user-created records. Equipment hints from CSV import are stored and ready. Depends on canonical library above.

## Nice to have

- **Sentry session replay + feedback widget** — replay integration and the feedback button were stripped from the initial Sentry setup to keep scope small. Revisit once crash reporting is stable; consider a settings-based feedback option rather than the floating widget. See `feat/sentry-setup` PR discussion for context.
- **E2E tests (Maestro)** — add Maestro flows for the most-repeated manual checks. No fully successful run yet; may need environment setup before writing flows. See `docs/decisions/006-e2e-testing-approach.md` and `docs/plans/maestro-ui-tests.md`.
- **New app icon and assets** — replace placeholder icons; convert large PNG assets to WebP to reduce bundle size.
- **Add new exercise** — add an ad-hoc exercise to a session.
- **Resume prompt + stale-draft expiry** — show "Resume or start fresh?" when a draft exists; auto-expire drafts older than a day or when the program day has changed. Also add a consistency check on load: if `draft.currentExerciseIdx >= day.exercises.length` or `draft.loggedSets.length !== day.exercises.length`, discard the draft silently rather than crashing into empty state. See `docs/plans/resume-session.md` (out of scope section).
- **Program editor: prevent empty day + warn on active draft** — the day editor should reject deleting the last exercise in a day (keeping empty days impossible), and show a warning when a session draft exists for that day. Short-term fix for program-session consistency; see `docs/ideas/program-versioning.md` for the preferred long-term approach.
- **Save session as new day or replace** — when finishing, allow saving to a different date or overwriting an existing session for that date.
- **Imported session target display preference** — currently we hide the "on target" card when a session has no targets (imported history). A future setting could let users choose: hide / assume met / show N/A. Defer until there's user demand. Designed to be cheap: one `AsyncStorage` key, three options, no data-model change.

## Blocked

Items that can't be picked up until a dependency lands.

- **Swap exercise** — swap an exercise mid-session for an equivalent. Blocked on exercise DB integration (see Exercise DB matching above).

## Inbox

New items land here. Triage before picking up.
