# Plan: Import warnings pattern

## Goal

Replace silent failures across all importers with a consistent `warnings` field on the success result, and surface partial data loss to the user in the import alert.

## Context

Identified during PR 102 (Liftosaur history import) review. Several places silently drop data with no log or user feedback:

- `parseHistoryFromBackup` error swallowed — user sees "0 sessions imported" with no explanation
- Records skipped due to missing `id`, `date`, or `entries` — silently `continue`d
- Entries dropped due to missing exercise name — silently filtered out
- Sessions with zero exercises stored as phantom rows
- `completedWeight: null` stored as `weight: 0` — silent data corruption

PR 102 fixes the immediate issues with `console.warn` and surfaces the history-parse-error in the alert. This plan does the proper follow-up.

## Design

Add `warnings: string[]` to the success branch of every import result type:

```ts
| { success: true; ...; warnings: string[] }
| { success: false; error: string }
```

Warnings accumulate during parsing (skipped sessions, dropped entries, etc.) and are shown in the import alert if non-empty. The happy path is unaffected (empty array).

Apply to: `importProgramFromJson`, `importFromStrong`, `importFromNotes`.

Also extract `LBS_TO_KG` to a shared `src/units.ts` (currently 3 copies across files with two different precisions).

## Out of scope

- Sentry breadcrumbs / structured error reporting (separate plan: `sentry-instrumentation.md`)
- Surfacing per-entry skip reasons in the UI (too granular; logs are sufficient)

## Commits

1. **`src/units.ts`: shared `LBS_TO_KG` constant** — extract and update all three import files to use it.
2. **Add `warnings` to import result types** — extend all three result types and update callers (Settings screen alert).
3. **Liftosaur parser: accumulate warnings** — return skipped session/entry counts in warnings instead of silent drops.
4. **Strong parser: accumulate warnings** — same treatment for `importFromStrong`.
