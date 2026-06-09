# Backlog

Sections are ordered by priority. New items land in **Inbox** first; triage moves them up. **Blocked** items have a hard dependency noted inline.

---

## Up next (MVP)

Core loop for a new user setting up via notes import or a simple program.

- **Immediate exercise matching** — Trigger the library matching logic (`seedLibraryMatches`) immediately when an exercise is renamed or created, rather than waiting for an app restart. This ensures muscle group data and library metadata appear instantly in the UI.
- **Notification sound toggle** — let users enable/disable sound on rest-expiry notifications from Settings. Off by default (preserves current behaviour). Requires a new `preferences` SQLite table (groundwork for future settings) and a second Android notification channel. Full spec in `docs/plans/notification-sound-toggle.md`. Depends on rest-timer-notifications (done).
- **Back button: session exit UX** — the current back-press behaviour during a live session is undefined/jarring. Needs UX design before implementation: what should happen (warn, auto-save draft, silent discard)? Resume already exists (v0.0.2); this is about defining and wiring the exit path consistently. Start with a UX spec before touching code.

## Next milestone (Strong parity)

Features needed for a power user migrating from Strong with years of history.

- **App versioning** — align the GitHub release tag, `app.json` `version`, and `android.versionCode` / `ios.buildNumber` so they stay in sync. Decide on a versioning policy (e.g. semver tags drive `app.json`). Gets messier the more releases are cut without a policy.
- **Integrate canonical exercise library** — choose and bundle a canonical exercise library (e.g. free-exercise-db) with muscle group, equipment, and image data. Required before exercise DB matching, swap exercise, and any muscle-group-aware features can be built. See ADR-008 for context.
- **Show PRs during session** — surface the user's best performance per exercise while logging. Cross-reference with `docs/plans/personal-records.md`.
- **Strong import dedup** — re-importing the same file appends duplicate sessions. A content-hash or date-based dedup check can be added without any schema change.
- **Exercise DB matching** — match imported exercise names to canonical library entries on demand; unmatched names fall back to user-created records. Equipment hints from CSV import are stored and ready. Depends on canonical library above.

## Nice to have

- **Migrate exercise library from JSON to SQLite** — Move the static `exercises.json` (~1MB) into a dedicated read-only SQLite table. This follows mobile best practices by reducing memory usage at startup and preventing the event-loop from blocking during JSON parsing.
- **Sentry session replay + feedback widget** — replay integration and the feedback button were stripped from the initial Sentry setup to keep scope small. Revisit once crash reporting is stable; consider a settings-based feedback option rather than the floating widget. See `feat/sentry-setup` PR discussion for context.
- **E2E tests (Maestro)** — add Maestro flows for the most-repeated manual checks. No fully successful run yet; may need environment setup before writing flows. See `docs/decisions/006-e2e-testing-approach.md` and `docs/plans/maestro-ui-tests.md`.
- **New app icon and assets** — replace placeholder icons; convert large PNG assets to WebP to reduce bundle size.
- **Add new exercise** — add an ad-hoc exercise to a session.
- **Resume prompt + stale-draft expiry** — show "Resume or start fresh?" when a draft exists; auto-expire drafts older than a day or when the program day has changed. Also add a consistency check on load: if `draft.currentExerciseIdx >= day.exercises.length` or `draft.loggedSets.length !== day.exercises.length`, discard the draft silently rather than crashing into empty state. See `docs/plans/resume-session.md` (out of scope section).
- **Program editor: prevent empty day + warn on active draft** — the day editor should reject deleting the last exercise in a day (keeping empty days impossible), and show a warning when a session draft exists for that day. Short-term fix for program-session consistency; see `docs/ideas/program-versioning.md` for the preferred long-term approach.
- **Save session as new day or replace** — when finishing, allow saving to a different date or overwriting an existing session for that date.
- **Imported session target display preference** — currently we hide the "on target" card when a session has no targets (imported history). A future setting could let users choose: hide / assume met / show N/A. Defer until there's user demand. Designed to be cheap: one `AsyncStorage` key, three options, no data-model change.
- **Semantic palette roles** — add `C.outline` and other M3-style roles to `palette.ts` alongside existing names. No visual change; groundwork for dark mode when that becomes a priority.
- **potato.png → WebP** — convert the splash/empty-state potato image to WebP to cut bundle size. Not currently imported anywhere so no rush; revisit when the asset is wired up.

## Blocked

Items that can't be picked up until a dependency lands.

- **Swap exercise** — swap an exercise mid-session for an equivalent. Blocked on exercise DB integration (see Exercise DB matching above).
- **reconcileDraft: match exercises by identity not position** — `reconcileDraft` maps `loggedSets` and `extraSetCounts` by array index; deleting a mid-day exercise would silently shift logged data onto the wrong exercises. Blocked on delete exercise (not yet built — no delete path exists in the codebase). Superseded by program versioning if that lands first — see `docs/ideas/program-versioning.md`.

## Inbox

New items land here. Triage before picking up.
