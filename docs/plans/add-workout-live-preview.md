# Plan: Add Workout screen — Live Preview (single page)

**Milestone:** v0.1 (replaces the current minimal `app/(tabs)/add.tsx`)
**Status:** Slice 1 complete — Slice 2 next

## What we're building

Replace the current white-screen / blue-button paste form with a warm-dark
single-page "live preview" screen:

- Header (back, "Add workout", current parsed date)
- Empty-state hero (Spuddy intro + format example) when nothing is pasted
- A `<textarea>` for the Liftohistory text
- Inline alerts:
  - Duplicate banner when a session for that date already exists
  - Errors banner (collapsible) when some lines fail to parse
- A preview list — one row per exercise, collapsed by default
  (`Bench Press · 3 × 8 @ 60kg`), expanding to show per-set chips + target
- Sticky bottom save bar

See [`docs/decisions/0002-add-workout-live-preview.md`](../decisions/0002-add-workout-live-preview.md)
for why this layout over the alternatives (Two-step Wizard, Sources Hub,
Chat, Voice).

## Vertical-slice approach

Per the walking-skeleton principle in `CLAUDE.md`: ship the full screen with
just the data the parser already returns. No new types, no storage changes.

### Slice 1 — Visual rebuild (no logic changes) ✓ DONE

`app/(tabs)/add.tsx` rebuilt. Palette extracted to
`components/spuddy/palette.ts` (imported by both `add.tsx` and
`progress/[date].tsx`). Full button coverage in
`__tests__/add-screen.test.tsx`. Key decisions made during implementation:

- Components kept inline in `add.tsx` for now (not extracted to
  `components/spuddy/`) — will extract when settings screen is redesigned
  and there are two real consumers
- Overwrite button is intentionally disabled — requires `replaceSession`
  from Slice 3 before it can be safely enabled
- `saveSession` now wraps inserts in a transaction
- See `docs/plans/add-workout-live-preview.md` follow-up backlog for known
  UX issues (back navigation, clear button, cancel redundancy)

### Slice 2 — Parse error surfacing

The current parser returns `Session | null`. To highlight problematic lines,
we want line-level diagnostics.

**Data:** add a parallel `parseLiftohistoryTextDetailed(text)` that returns:

```ts
type ParseLine = { raw: string; kind: 'ok' | 'warn' | 'error'; note?: string };
type ParseResult = {
  ok: boolean;
  date: string | null;
  exercises: ExerciseEntry[];
  lines: ParseLine[];
};
```

Keep the existing `parseLiftohistoryText` as a thin wrapper over the new
function (return `null` if `!ok`). No breakage to existing callers.

**`ok` semantics:** `ok: true` requires both a valid date AND at least one
`ok` line. Three cases map to `ok: false` → `null` in the wrapper: no
`exercises: {` marker, no date, or every exercise line errored. Structure
valid but content all-bad is `ok: false` — nothing usable to save.

**UI:** `ErrorBanner` shows the count and expands to a `ParseLog` of
flagged lines using monospace + color cues.

**Tests:**
- Each line in `parser.test.ts` gets an `ok | warn | error` assertion in
  addition to the existing structural ones
- Bad-segment text → error count matches what the UI shows

### Slice 3 — Overwrite path

Currently the save handler hard-fails on duplicate dates with an alert.
We need a real overwrite path.

**Data:** add `replaceSession(db, session)` to `src/storage.ts` —
transactional `DELETE WHERE date = ?` then insert. No migration needed:
`sessions` is a flat table with no child tables referencing it.
Also enable `saveEnabled` in the `isDuplicate` branch of `add.tsx` (currently
stubbed with a comment) and route through `replaceSession` instead of
`saveSession`.

**UI:** the Overwrite button on the banner runs the new code path; success
toast distinguishes "overwritten" from "saved".

### Slice 4 — Edit on the parse-error rows (deferred)

Tapping a flagged line in the parse log focuses the textarea and selects
that line. Nice-to-have; out of scope for v0.1 unless cheap.

## Out of scope here

- Any non-paste source (file pick, voice, share-sheet, watch). Reserved for
  the future Sources Hub design — see ADR.
- Editing parsed exercises inline (rep counts, weights). The user fixes the
  source text. If editing in the UI becomes a real need we add it; not yet.
- Per-exercise "skip" — for now you save the parsed set or you fix the
  text. Avoids partial-save ambiguity in v0.1.

## Migration of existing code

Existing `add.tsx` is 73 lines, mostly styles. Replacement is bigger but
shares chrome with `progress/[date].tsx`. Suggested file shape:

```
app/(tabs)/add.tsx                       — screen container
components/spuddy/
  palette.ts                              — colour tokens (SP)
  Spuddy.tsx                              — mascot
  Chip.tsx, DuplicateBanner.tsx, etc.    — UI atoms reused across screens
src/parser.ts                              — gains parseLiftohistoryTextDetailed
src/storage.ts                            — gains replaceSession
```

Splitting the UI atoms into their own files is what makes the next
redesign (settings, bento detail) cheap.

## Open questions

- Does overwrite need user confirmation in a second step, or is the
  Overwrite button on the banner enough? (lean: enough — the banner already
  shows context)
- Should the save success state route back to the progress list or stay on
  the Add screen with a fresh empty state? (lean: route to the just-saved
  session's detail page)

## Follow-up backlog (post slice 1)

- **"View existing" leaves no back route.** `router.push('/progress/[date]')`
  from a tab navigates within the tab group — no stack entry is created, so
  the back gesture doesn't return to add. Needs investigation: either wrap
  the add screen in its own stack navigator, or use a different routing
  strategy when pushing from add. Track before the Sources Hub lands, since
  the hub will push add as a child and the same issue will recur.

- **Duplicate banner is date-only, no content diff.** The banner fires whether
  the pasted content is identical to the stored session or genuinely different.
  Consider suppressing or softening the message when the incoming data matches
  what's already stored. Not urgent for v0.1.

- **Clear button on the textarea.** A small × in the corner of the input to
  wipe the text in one tap, rather than select-all-delete.

- **Cancel vs back — revisit together.** The back button in the header is
  likely a no-op from the tab root (no stack entry to go back to). Cancel
  currently fills that gap by resetting state. Once back navigation is fixed
  (see "View existing" item above), Cancel may become redundant — back handles
  "leave the screen", a clear button handles "wipe the input". Decide then
  whether to remove Cancel or keep it as an explicit escape hatch.
