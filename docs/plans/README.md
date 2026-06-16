# Plans

Index of implementation plans for Spuddy.

## Now

| Plan | Summary | Status |
| :--- | :--- | :--- |
| [Add Workout Live Preview](./add-workout-live-preview.md) | Add Workout screen — Live Preview (single page) | Slice 1 done, Slice 2 next |

## Next

| Plan | Summary | Notes |
| :--- | :--- | :--- |
| [Freeform Notes Follow-up](./freeform-notes-followup.md) | Refine freeform import — destructive behaviour + parser ambiguities | Proposed |
| [Progress Streak Hero](./progress-streak-hero.md) | Progress tab — Streak Hero + Pill tab bar | In progress |
| [Abandon Session Prompt](./abandon-session-prompt.md) | Prompt to discard or keep draft when backing out of a session | Proposed |
| [Await Draft Saves](./await-draft-saves.md) | Add `await` to `saveDraft()` calls so no set is lost on OS kill | Proposed |
| [Add Exercise Picker](./add-exercise-picker.md) | Pick from previously-used exercises instead of typing from scratch | Proposed |

## Someday

| Plan | Summary | Notes |
| :--- | :--- | :--- |
| [Personal Records](./personal-records.md) | Personal Records — storage and display | Blocked: needs session logger |
| [Post-session Program Update](./post-session-program-update.md) | Prompt to save a new program day when logged sets diverge | Feature |
| [Import Warnings Pattern](./import-warnings-pattern.md) | Surface partial data loss via consistent `warnings` on import results | Internal |
| [Maestro Notes Paste Flow](./maestro-notes-paste-flow.md) | E2E flow for the notes-paste happy path | Testing |
| [PostHog Analytics](./posthog-analytics.md) | Usage analytics via PostHog | Deferred |
| [Stylesheet Extraction](./stylesheet-extraction.md) | Move inline `StyleSheet` blocks into sibling `*.styles.ts` files | Refactor |
| [Android UI Alignment](./android-ui-alignment.md) | Bring all screens onto the M3/ADR-014 design baseline | Polish |
| [Settings Page Redesign](./settings-page-redesign.md) | Settings page redesign | Polish |
| [Tab Bar Pill](./tab-bar-pill.md) | Tab bar — floating pill redesign | Slice 1 done |
| [Improve Test Coverage](./improve-test-coverage.md) | Improve test coverage | Internal |
| [Notification Sound Toggle](./notification-sound-toggle.md) | Toggle rest-timer notification sound on/off | Polish |
| [Program Import UX](./program-import-ux.md) | Program import UX improvements | Deferred |
| [What's New](./whats-new.md) | Static changelog in Settings | Polish |

## Archived

| Plan | Summary | Completed |
| :--- | :--- | :--- |
| [Add Exercise Mid-session](./archive/add-exercise-mid-session.md) | Add a new exercise during a live session via pill + name sheet | 2026-06-16 |
| [Maestro E2E CI](./archive/maestro-e2e-ci.md) | Golden-path Maestro flows wired into the EAS release workflow | 2026-06-16 |
| [Sentry Instrumentation](./archive/sentry-instrumentation.md) | Navigation tracking, breadcrumbs, and notification event capture | 2026-06-15 |
| [Set Entry Grouping](./archive/set-entry-grouping.md) | `SetEntry` component with local state, replacing 7-callback pattern | 2026-06-14 |
| [Stepper Direct Input](./archive/stepper-direct-input.md) | Tap reps/weight to type directly in the stepper | 2026-06-12 |
| [ID-Based Program Routing](./archive/id-based-program-routing.md) | Identify programs by ID throughout instead of name | 2026-06-12 |
| [Liftosaur History Import](./archive/liftosaur-history-import.md) | Parse and import session history from Liftosaur backup | 2026-06-11 |
| [Extract useProgramDay Hook](./archive/extract-use-program-day-hook.md) | Extract `useProgramDay` hook from `[dayIndex].tsx` | 2026-06-10 |
| [Idempotent Re-import](./archive/idempotent-reimport.md) | Session deduplication so re-importing produces no duplicates | 2026-06-09 |
| [Exercise Library](./archive/exercise-library.md) | Seed muscle-group library + exact-match enrichment on import | 2026-06-09 |
| [Data Export (SQLite)](./archive/data-export-sqlite.md) | VACUUM INTO backup + share sheet in Settings | 2026-06-05 |
| [Rest Timer Notifications](./archive/rest-timer-notifications.md) | Schedule/cancel Android notification when rest timer expires | 2026-06-05 |
| [Resume Session Prompt](./archive/resume-session-prompt.md) | Auto-resume in-progress draft session on app launch | 2026-05-30 |
| [Exercise Notes](./archive/exercise-notes.md) | Persistent per-exercise cue/technique notes | 2026-05-30 |
| [Select Program Day](./archive/select-program-day.md) | Day-selection screen before starting a session | 2026-05-31 |
| [v0.3 Session Logging](./archive/v0.3-session-logging.md) | v0.3 — Session Logging | 2026-05-26 |
| [Freeform Notes Import](./archive/freeform-notes-import.md) | Freeform notes import | 2026-05-25 |
| [Program Day Detail](./archive/program-day-detail.md) | Program day detail view | 2026-05-24 |
| [Strong Import](./archive/strong-import.md) | Import data from Strong app | 2026-05-24 |
| [v0.0 Walking Skeleton](./archive/v0.0-walking-skeleton.md) | Initial skeleton | 2026-05-23 |
| [v0.1 Import and History](./archive/v0.1-import-and-history.md) | Import and History | 2026-05-23 |
| [v0.2 Program Import](./archive/v0.2-program-import.md) | Program Import | 2026-05-24 |
