# Backlog

Sections are ordered by priority. New items land in **Inbox** first; triage moves them up. **Blocked** items have a hard dependency noted inline.

---

## Up next (MVP)

Core loop for a new user setting up via notes import or a simple program.

- **Session exit UX** — when the user backs out of a live session, prompt to keep or discard the draft. Resume already lands them back in automatically; this is the deliberate-discard path. Plan: `docs/plans/session-exit-ux.md`.
- **Progress detail back button after finish** — after finishing a session, `router.replace` to `progress/[date]` leaves no back history, so `router.back()` surfaces `select-day` instead of the progress list. Fix: pass `from=finish` param from `log-session.tsx` (lines 802/813) and guard the back button in `progress/[date].tsx` to `router.replace('/(tabs)/progress')` when `from === 'finish'`. PR 94 can be closed; this is a clean two-file change on a fresh branch.

## Next milestone (Strong parity)

Features needed for a power user migrating from Strong with years of history.

- **Show PRs during session** — surface the user's best performance per exercise while logging. Cross-reference with `docs/plans/personal-records.md`.
- **Exercise DB matching** — match imported exercise names to canonical library entries on demand; unmatched names fall back to user-created records. Library is seeded and exact-match runs on import; this extends it to on-demand lookup and fuzzy matching.

## Nice to have

- **Session exit: skip prompt when no sets logged** — `shouldPromptOnExit` currently always returns `true`; enhance it to return `false` when zero sets have been logged across all exercises. One extra argument to the function, one extra test case. Deferred from `session-exit-ux`.
- **Day detail stale after mid-session add-exercise + Resume later** — when a user adds an exercise mid-session then taps "Resume later", the draft's modified day (stored in `saveDraft`) is not reflected in the program day detail screen, which reads from the DB. The session resumes correctly but the day preview is stale. Fix: either re-read the draft's day snapshot in the day detail view, or reconcile on resume. Observed in `session-exit-ux`.
- **Session exit: PostHog event properties** — add `sets_logged`, `exercises_started`, and `total_exercises` as properties on `session_exit_keep` / `session_exit_discard` events, and `exercises_started` to `session_completed` for parity. Extract a `buildSessionEventProperties(state)` selector in `src/domain/sessionLogger.ts` so all three call sites share the same code path. Deferred from `session-exit-ux`.
- **Pre-populate library search with exercise name** — initialise the search input in `ExerciseEditSheet` search mode with the current exercise name so results appear immediately on open. Small UX improvement, zero risk. Deferred from `library-link-override`.
- **Auto-rename after linking** — after picking a library entry via "Search library" or "Change match", rename the program exercise to the canonical library name. Safe unless the library name already exists as a separate `exercises` row (UNIQUE constraint prevents rename in that case — blocked on Merge exercises below). Deferred from `library-link-override`.
- **Remove match / unlink** — allow users to clear a manual or auto-matched library link from `ExerciseEditSheet`. Only "Change match" was shipped; unlinking was deferred from `library-link-override`.
- **App versioning** — align the GitHub release tag, `app.json` `version`, and `android.versionCode` / `ios.buildNumber` so they stay in sync. Decide on a versioning policy (e.g. semver tags drive `app.json`). Gets messier the more releases are cut without a policy.
- **Notification sound toggle** — let users enable/disable sound on rest-expiry notifications from Settings. Off by default (preserves current behaviour). Requires a new `preferences` SQLite table (groundwork for future settings) and a second Android notification channel. Full spec in `docs/plans/notification-sound-toggle.md`. Depends on rest-timer-notifications (done).
- **Sentry session replay + feedback widget** — replay integration and the feedback button were stripped from the initial Sentry setup to keep scope small. Revisit once crash reporting is stable; consider a settings-based feedback option rather than the floating widget. See `feat/sentry-setup` PR discussion for context.
- **New app icon and assets** — replace placeholder icons; convert large PNG assets to WebP to reduce bundle size.
- **Stale-draft expiry** — auto-expire drafts older than a day or when the program day has changed. Also add a consistency check on load: if `draft.currentExerciseIdx >= day.exercises.length` or `draft.loggedSets.length !== day.exercises.length`, discard the draft silently rather than crashing into empty state. See `docs/plans/resume-session-prompt.md` (out of scope section).
- **Program editor: prevent empty day + warn on active draft** — the day editor should reject deleting the last exercise in a day (keeping empty days impossible), and show a warning when a session draft exists for that day. Short-term fix for program-session consistency; see `docs/ideas/program-versioning.md` for the preferred long-term approach.
- **Save session as new day or replace** — when finishing, allow saving to a different date or overwriting an existing session for that date.
- **Imported session target display preference** — currently we hide the "on target" card when a session has no targets (imported history). A future setting could let users choose: hide / assume met / show N/A. Defer until there's user demand. Designed to be cheap: one `AsyncStorage` key, three options, no data-model change.
- **Semantic palette roles** — add `C.outline` and other M3-style roles to `palette.ts` alongside existing names. No visual change; groundwork for dark mode when that becomes a priority.
- **potato.png → WebP** — convert the splash/empty-state potato image to WebP to cut bundle size. Not currently imported anywhere so no rush; revisit when the asset is wired up.
- **Rename exercise** — let users rename an exercise from the program editor or history. Needs a `renameExercise` storage function that updates the `exercises` row and re-runs library matching for the new name. Plan: `docs/plans/rename-exercise.md`.
- **Extract stepper clamp logic to domain** — `SetEntry` contains inline arithmetic for stepper floors (`Math.max(1, r - 1)` for reps, `Math.max(0, v)` for weight typed input). Per the "views are dumb" rule these should be pure domain functions (`clampReps`, `clampWeight`) in `src/domain/`. Pre-existing violation surfaced during the `set-entry-grouping` refactor; tests already cover the floor behaviour so extraction would be safe.
- **Import warnings pattern** — replace silent data loss across all importers (`importProgramFromJson`, `importFromStrong`, `importFromNotes`) with a `warnings: string[]` field on the success result, surfaced in the import alert. Also extracts the duplicated `LBS_TO_KG` constant to `src/units.ts`. Follow-up to PR 102. Plan: `docs/plans/import-warnings-pattern.md`.
- **Remove NativeWind scaffold** — `metro.config.js` (`withNativewind`), `postcss.config.mjs`, `src/global.css`, `nativewind-env.d.ts`, and the `nativewind`, `react-native-css`, `tailwindcss`, `@tailwindcss/postcss` packages are all unused. Needs its own ADR before removal. Deferred from the dead-code cleanup PR.
- **Unused exports cleanup** — knip flags 10 exported symbols and 3 exported types with no consumers: `WEIGHT_STEPS`, `STATUS_LABEL`, `importPrograms`, `insertPrograms`, `sessionExists`, 5 `COL_*` style constants in `dayIndex.styles.ts`, and types `LoggedSet`, `ParsedSection`, `ParseLine`. Low-risk; all internal. Deferred from the dead-code cleanup PR.
- **Sentry: custom performance spans** — add `Sentry.startSpan` around slow DB queries (progress history load, Strong import parse). No plan yet; pick up only if a perf problem surfaces.

## Blocked

Items that can't be picked up until a dependency lands.

- **Merge exercises** — consolidate two `exercises` rows (and their logged sessions) into one. Needed when auto-rename after linking collides with an existing row (UNIQUE constraint on `exercises.name`). Prerequisite for fully correct auto-rename. Deferred from `library-link-override`.
- **Swap exercise** — swap an exercise mid-session for an equivalent. Blocked on exercise DB integration (see Exercise DB matching above).
- **reconcileDraft: match exercises by identity not position** — `reconcileDraft` maps `loggedSets` and `extraSetCounts` by array index; deleting a mid-day exercise would silently shift logged data onto the wrong exercises. Blocked on delete exercise (not yet built — no delete path exists in the codebase). Superseded by program versioning if that lands first — see `docs/ideas/program-versioning.md`.
