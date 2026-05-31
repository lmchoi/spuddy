# Idea: Program versioning — snapshot at session start

## Problem

When a user starts a session and then edits the program before finishing, the
session's draft is out of sync with the live program. Currently `reconcileDraft`
tries to patch the draft back into shape (padding arrays, clamping index), but
this is inherently fragile:

- Positional array mapping silently corrupts logged data if exercises are
  reordered or deleted from the middle of the list.
- `isResting` and other derived state can become inconsistent with the patched
  exercise list.
- Every future schema change to `SessionState` or `ProgramDay` requires
  `reconcileDraft` to be updated too.

## Idea

When a session starts, snapshot the program day and store it with the session.
The session always runs against its own copy of the day — live program edits
don't affect it at all.

Program edits produce a new version. The program table gains a `version`
field (or a separate `program_versions` table). Sessions reference a
`programVersionId` rather than a live program name + day index.

```
programs            program_versions         sessions
─────────           ────────────────         ────────
id                  id                       id
name                programId (FK)           programVersionId (FK)
                    version                  date
                    snapshot (JSON)          loggedSets (JSON)
                    createdAt                ...
```

## Benefits

- `reconcileDraft` can be deleted entirely — the session already has its day.
- Historical sessions accurately reflect the program that was actually used
  (e.g. "I was running a 3×5 programme in January, now I'm on 5×3").
- Editing a program is non-destructive and doesn't require warning the user
  about in-flight sessions.
- The positional-mapping problem disappears — there is no live program to
  reconcile against.

## Tradeoffs

- Schema migration required: `sessions` table gains `programVersionId`,
  `program_versions` table is new. Existing sessions would need a
  backfill (copy the current program snapshot as version 1).
- Program list UI needs to distinguish "current version" from history, or
  just hide old versions from the editor.
- Slightly more storage (program JSON stored per version, not per session).

## Open questions

- Should the snapshot be the full `ProgramDay` JSON, or just a reference to a
  versioned row?
- How does the user see/edit past versions? Probably they don't — just the
  current one is editable, old versions are read-only for display.
- What triggers a new version — any edit, or only saves from a confirmation
  dialog?

## Status

Unreviewed idea — not scheduled. Supersedes the editor confirmation/validation
approach as the preferred long-term fix for program-session consistency.
