# Plans

Index of implementation plan files. For priority and roadmap, see `docs/backlog.md`.

## Active

| Plan | Summary |
| :--- | :--- |
| [Abandon Session Prompt](./abandon-session-prompt.md) | Prompt to discard or keep draft when backing out of a session |
| [Add Exercise Picker](./add-exercise-picker.md) | Pick from previously-used exercises instead of typing from scratch |
| [Add Workout Live Preview](./add-workout-live-preview.md) | Add Workout screen — live preview of the day before starting |
| [Import Warnings Pattern](./import-warnings-pattern.md) | Surface partial data loss via consistent `warnings` on import results |
| [Improve Test Coverage](./improve-test-coverage.md) | Improve test coverage across domain and UI layers |
| [Notification Sound Toggle](./notification-sound-toggle.md) | Toggle rest-timer notification sound on/off |
| [Personal Records](./personal-records.md) | Personal Records — storage and display |
| [Program Import UX](./program-import-ux.md) | Program import UX improvements |
| [Rename Exercise](./rename-exercise.md) | Rename an exercise with library re-matching |
| [Session Exit UX](./session-exit-ux.md) | Keep / Discard prompt when navigating away from an active session |
| [Settings Page Redesign](./settings-page-redesign.md) | Settings page redesign |
| [Tab Bar Pill](./tab-bar-pill.md) | Tab bar — floating pill redesign (Slice 2: Settings warm-dark) |
| [What's New](./whats-new.md) | Static changelog in Settings |

## Archived

| Plan | Summary |
| :--- | :--- |
| [Add Exercise Mid-session](./archive/add-exercise-mid-session.md) | Add a new exercise during a live session via pill + name sheet |
| [Add Exercise Settings](./archive/add-exercise-settings.md) | Bottom sheet for adding exercises in the program day editor |
| [Library Link Override](./archive/library-link-override.md) | Manual library link override + Change match in ExerciseEditSheet |
| [PostHog Analytics](./archive/posthog-analytics.md) | Usage analytics via PostHog |
| [Add Extra Set](./archive/add-extra-set.md) | Add an extra set to an exercise mid-session |
| [Android UI Alignment](./archive/android-ui-alignment.md) | Bring all screens onto the M3/ADR-014 design baseline |
| [Data Export (SQLite)](./archive/data-export-sqlite.md) | VACUUM INTO backup + share sheet in Settings |
| [Dev Tooling Hooks & Skills](./archive/dev-tooling-hooks-skills.md) | Claude Code hooks and custom skills setup |
| [Drizzle ORM Backlog](./archive/drizzle-orm-backlog.md) | Follow-up items after Drizzle migration |
| [Drizzle ORM Migration](./archive/drizzle-orm-migration.md) | Migrate database layer to Drizzle ORM |
| [Exercise Centralization](./archive/exercise-centralization.md) | Centralize exercise identity via `exerciseId` |
| [Exercise Library](./archive/exercise-library.md) | Seed muscle-group library + exact-match enrichment on import |
| [Exercise Notes](./archive/exercise-notes.md) | Persistent per-exercise cue/technique notes |
| [Extract useProgramDay Hook](./archive/extract-use-program-day-hook.md) | Extract `useProgramDay` hook from `[dayIndex].tsx` |
| [Finish Button Always Visible](./archive/finish-button-always-visible.md) | Keep the Finish Session button visible at all times |
| [First-run Redirect](./archive/first-run-redirect.md) | Redirect new users to the Add screen on first launch |
| [Fix Notes Import Header](./archive/fix-notes-import-header.md) | Fix duplicate header on notes-import screen |
| [Fix Notes Import Keyboard](./archive/fix-notes-import-keyboard.md) | Fix keyboard hiding the Import button on notes-import screen |
| [Fix Parser Trailing x](./archive/fix-parser-trailing-x-in-name.md) | Fix orphaned `x` in exercise name from trailing set markers |
| [Freeform Notes Import](./archive/freeform-notes-import.md) | Freeform notes import (original) |
| [ID-Based Program Routing](./archive/id-based-program-routing.md) | Identify programs by ID throughout instead of name |
| [Idempotent Re-import](./archive/idempotent-reimport.md) | Session deduplication so re-importing produces no duplicates |
| [Liftosaur History Import](./archive/liftosaur-history-import.md) | Parse and import session history from Liftosaur backup |
| [Maestro E2E CI](./archive/maestro-e2e-ci.md) | Golden-path Maestro flows wired into the EAS release workflow |
| [Notes Import Review](./archive/notes-import-review.md) | Review screen before confirming a notes import |
| [Notes Import Review — Reps](./archive/notes-import-review-reps.md) | Show reps on the notes import review screen |
| [Program Day Detail](./archive/program-day-detail.md) | Program day detail view |
| [Rest Timer Notifications](./archive/rest-timer-notifications.md) | Schedule/cancel Android notification when rest timer expires |
| [Resume Session](./archive/resume-session.md) | Resume in-progress session (early draft) |
| [Resume Session Prompt](./archive/resume-session-prompt.md) | Auto-resume in-progress draft session on app launch |
| [Select Program Day](./archive/select-program-day.md) | Day-selection screen before starting a session |
| [Sentry Instrumentation](./archive/sentry-instrumentation.md) | Navigation tracking, breadcrumbs, and notification event capture |
| [Set Entry Grouping](./archive/set-entry-grouping.md) | `SetEntry` component with local state, replacing 7-callback pattern |
| [Stepper Direct Input](./archive/stepper-direct-input.md) | Tap reps/weight to type directly in the stepper |
| [Strip Pill Redesign](./archive/strip-pill-redesign.md) | Exercise strip pill visual redesign |
| [Strong Import](./archive/strong-import.md) | Import data from Strong app |
| [v0.0 Walking Skeleton](./archive/v0.0-walking-skeleton.md) | Initial walking skeleton |
| [v0.1 Import and History](./archive/v0.1-import-and-history.md) | Import and history milestone |
| [v0.2 Program Import](./archive/v0.2-program-import.md) | Program import milestone |
| [v0.3 Session Logging](./archive/v0.3-session-logging.md) | Session logging milestone |
