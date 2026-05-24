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

### Slice 3 — Content-hash duplicate detection

Replace the date-only duplicate check with a content hash. Same date but
different content (e.g. a second session that day) is not a duplicate — just
save it. Only suppress the save if the content is truly identical.

**Data:** add a `hashSession(session)` pure function (e.g. stable JSON
stringify → SHA-1 or similar) and store the hash alongside each session.
On save, query `SELECT hash FROM sessions WHERE hash = ?` — if it matches,
the session is already saved.

**UI:** replace the current duplicate banner with a simple inline message:
"Already saved. [View →]" linking to the existing session detail. No
Overwrite button, no decision required.

**Back navigation:** tapping the link pushes to the session detail. A back
button would be a nice UX touch but is not required — defer unless cheap.

### Slice 4 — Back navigation from "View" link (deferred)

If the user taps "Already saved. View →", they land on the session detail
with no back route (tab navigation, no stack entry). Fix by wrapping the
Add screen in its own stack navigator or using `router.push` from a modal
context. Defer until a user actually hits this wall — it's not blocking.

### Slice 5 — Edit on the parse-error rows (deferred)

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

- **Back navigation from "View" link** — tracked as Slice 4. Not blocking;
  defer until a user hits this wall in practice.

- ~~**"View existing" leaves no back route.**~~ — superseded by Slice 3 design:
  the duplicate check is now hash-based and the link is a secondary action,
  not a primary navigation.

- ~~**Duplicate banner is date-only, no content diff.**~~ — resolved by Slice 3:
  date-only check replaced with content hash; different content on same date
  saves without friction.

- **Clear button on the textarea.** A small × in the corner of the input to
  wipe the text in one tap, rather than select-all-delete.

- **Cancel vs back — revisit together.** The back button in the header is
  likely a no-op from the tab root (no stack entry to go back to). Cancel
  currently fills that gap by resetting state. Once back navigation is fixed
  (see "View existing" item above), Cancel may become redundant — back handles
  "leave the screen", a clear button handles "wipe the input". Decide then
  whether to remove Cancel or keep it as an explicit escape hatch.
