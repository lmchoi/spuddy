# Plan: Stylesheet extraction refactor

**ADR:** [011-styling-approach.md](../decisions/011-styling-approach.md)

## Goal

Screen files are 40–50% `StyleSheet` boilerplate. Move style blocks into sibling files, then extract shared tokens. No logic or layout changes — pure reorganisation.

## Phase 1: ADR + CLAUDE.md ✅ done

- `docs/decisions/011-styling-approach.md` written
- `CLAUDE.md` updated with Styling section (documents that `src/tw/` is intentionally unused)

## Phase 2: Extract StyleSheet blocks → sibling `*.styles.ts` files

For each file: move the `StyleSheet.create({...})` block (and the `StyleSheet` import) into a new sibling file. Add one import line to the original: `import { styles } from './foo.styles'`. One atomic commit per file.

| File | Approx style lines | Status |
|------|--------------------|--------|
| `app/(tabs)/add.tsx` → `add.styles.ts` | 418 | todo |
| `app/(tabs)/progress/[date].tsx` → `[date].styles.ts` | 273 | todo |
| `app/(tabs)/settings/[programName]/[dayIndex].tsx` → `[dayIndex].styles.ts` | 233 | todo |
| `app/log-session.tsx` → `log-session.styles.ts` | 154 | todo |
| `app/notes-import.tsx` → `notes-import.styles.ts` | 145 | todo |
| `app/(tabs)/settings/index.tsx` → `index.styles.ts` | 121 | todo |
| `app/strong-import.tsx` → `strong-import.styles.ts` | 112 | todo |
| `app/(tabs)/progress/index.tsx` → `index.styles.ts` | 87 | todo |
| `components/spuddy/TabBarPill.tsx` → `TabBarPill.styles.ts` | 53 | todo |
| `components/spuddy/SessionRow.tsx` → `SessionRow.styles.ts` | 42 | todo |
| `components/spuddy/ActivityStrip.tsx` → `ActivityStrip.styles.ts` | 28 | todo |
| `components/spuddy/HeroStat.tsx` → `HeroStat.styles.ts` | 24 | todo |
| `app/modal.tsx` → `modal.styles.ts` | 16 | todo |
| `app/+not-found.tsx` → `+not-found.styles.ts` | 20 | todo |
| `components/EditScreenInfo.tsx` → `EditScreenInfo.styles.ts` | 29 | todo |

## Phase 3: Extract shared design tokens → `src/theme.ts`

Create `src/theme.ts`:

```ts
export const radius = { sm: 8, md: 12, lg: 14, pill: 999 }
export const font = {
  sm: 13, md: 14, body: 15, base: 16, lg: 18,
  weight: { normal: '500', semibold: '600', bold: '700' },
}
export const spacing = { xs: 4, sm: 8, md: 12, base: 14, lg: 16, xl: 18, xxl: 20, xxxl: 24 }
```

Then update each `*.styles.ts` to import tokens instead of hardcoding values. One commit per file.

Also: delete `constants/Colors.ts` (unused legacy) and remove its import from `components/EditScreenInfo.tsx`.

## Verification

- `npm test` passes after every commit
- App boots and screens render via `expo start` (spot-check after Phase 2)
- After Phase 2: no `StyleSheet` imports remain in any `*.tsx` screen or component file

## Out of scope

- NativeWind / `src/tw/` migration — deferred indefinitely (see ADR 011)
- Any logic, layout, or visual changes
