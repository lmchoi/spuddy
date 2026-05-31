# Plan: Design Alignment & Standardization

## Goal

Bring all screens into alignment with the Material-inspired Shared Baseline (ADR 014): 8dp grid, 16dp margins, 48dp touch targets, M3 typography scale, semantic palette roles, and optimized assets — delivered one component at a time so each commit is independently shippable.

## Out of scope

- Maestro Cloud / CI integration for screenshot storage (deferred)
- NativeWind / Tailwind migration (explicitly deferred, ADR 011)
- Dark mode using semantic roles (semantic roles added here; dark mode wiring is a follow-up)

## Design

**Approach:** token + consumer land in the same commit. `src/theme.ts` grows incrementally — no dead "create tokens" commit that ships nothing visible.

**Token naming convention (hard to reverse — settle this before Commit 2):**
```ts
T.spacing.screenEdge  // horizontal screen margin (16)
T.spacing.cardH       // card horizontal padding (14)
T.spacing.cardV       // card vertical padding (12)
T.gap.sm              // 8
T.gap.md              // 12
T.radius.card         // 14
T.radius.pill         // 999
T.touch.min           // 48
T.type.title          // 22
T.type.body           // 16
T.type.bodyMd         // 14
T.type.label          // 12
```

**Touch target approach:** use `minWidth`/`minHeight` rather than changing visual `width`/`height` — keeps visual size the same, expands tap area.

**Palette:** semantic roles added alongside existing names in `palette.ts` — additive only, no renames.

**Files affected:** `src/theme.ts` (new), `components/spuddy/palette.ts`, and one `*.styles.ts` per commit.

**ADR:** ADR 014 already covers this decision. No new ADR needed.

## Blast radius note

Commits 2–4 (log-session, add screen) are safe to start immediately — they don't overlap with any in-flight plan. Commits 5–7 (progress, settings screens) should wait for `progress-streak-hero` (PR #4) and `tab-bar-pill` Slice 2 to land first.

## Commits

1. ✅ **test(e2e): visual baseline screenshots** (`cf1dca6`) — `e2e/visual-baseline.yaml` with `clearState: true`; PNGs in `e2e/screenshots/`. Run: `maestro test --device emulator-5554 --test-output-dir <out> e2e/visual-baseline.yaml`. Progress baseline shows Settings redirect (expected — no sessions in clearState).

2. ✅ **fix(a11y): backBtn touch target 36→48 in log-session** (`84338a9`) — `T.touch.min = 48` in `src/theme.ts`; `minWidth`/`minHeight` on `backBtn` in `log-session.styles.ts`.

3. ✅ **refactor: T.spacing.screenEdge in log-session** (`763a296`) — `T.spacing.screenEdge = 16` in `src/theme.ts`; all four `paddingHorizontal: 18` replaced in `log-session.styles.ts`.

4. ✅ **refactor: T.spacing.screenEdge in add screen** (`3166a0d`) — token already existed; all three `paddingHorizontal: 18` replaced in `add.styles.ts`.

5. **refactor: T.spacing.screenEdge in progress screen** *(hold until progress-streak-hero lands)* — apply to `progress/index.styles.ts`. Test: Jest snapshot update.

6. **refactor: T.spacing.screenEdge in settings screen** *(hold until tab-bar-pill Slice 2 lands)* — apply to `settings/index.styles.ts` and `programName/dayIndex.styles.ts`. Test: Jest snapshot update.

7. **refactor: T.spacing.screenEdge in import screens** — apply to `notes-import.styles.ts`, `notes-import-review.styles.ts`, `strong-import.styles.ts`. Test: Jest snapshot updates.

8. **refactor: card spacing tokens in SessionRow** — add `T.spacing.cardH`/`cardV` to `src/theme.ts`; apply to `SessionRow.styles.ts`. Test: Jest render snapshot on SessionRow.

9. **refactor: T.type scale in SessionRow** — add `T.type` scale (12/14/16/22) to `src/theme.ts`; replace non-standard `fontSize` values in `SessionRow.styles.ts`. Test: Jest render snapshot.

10. **refactor: T.type.label in TabBarPill** — token already exists; replace `fontSize: 13` in `TabBarPill.styles.ts`. Test: Jest render snapshot.

11. **refactor: semantic palette roles** — add `C.surface`, `C.outline`, etc. alongside existing names in `palette.ts`. No visual change. Test: TypeScript compilation.

12. **chore: potato.png → WebP** — convert asset, update import references. Test: run `maestro test e2e/visual-baseline.yaml`, compare screenshots to Commit 1 baseline.
