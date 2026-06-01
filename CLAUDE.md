# Spuddy — Claude guidance

## Coding preferences

- **Test first** — write tests before implementation. If TDD isn't feasible for a given area (e.g. React Native UI), flag it and discuss before proceeding.
- **Atomic commits** — every commit is a single, meaningful change. Break work down further than feels necessary.
- **Pre-commit test hook** — wire up a git pre-commit hook (`npm test`) when the Expo app is first scaffolded. Until then, run tests manually before committing.
- **Outside-in / walking skeleton** — build the full vertical slice first with stubs, so the app runs end-to-end early. UI → logic → data. Fill in real implementations one layer at a time, never building a layer in isolation before the layer above it exists.

## Architecture

- **Domain layer lives in `src/domain/`** — all logic that reasons about app state (set counts, completion, targets, splits) belongs there as pure functions, not in views or components.
- **Views are dumb** — components and screens may call domain functions but must not re-implement domain logic inline (e.g. no `sets.filter(s => !s.isWarmup)`, no `targets.length + extraSetCounts[i]` in JSX). If you find yourself doing arithmetic or filtering over domain types in a view, extract a selector first.
- **Selectors are testable** — every domain selector must have unit tests. This is the main mechanism for catching regressions without a running device.
- **Custom hooks are wiring, not logic** — hooks are acceptable for connecting domain functions to React state (e.g. calling `useReducer` with a domain reducer, or bridging to a context), but must not contain domain logic themselves. Logic in a hook can only be tested via `renderHook`; logic in a pure function can be tested with a plain `jest` call.

- **Custom-header screens need `headerShown: false` in root layout** — any screen that renders its own back button and title row (custom `<View style={styles.header}>`) must have a `<Stack.Screen name="…" options={{ headerShown: false }} />` entry in `app/_layout.tsx`. Without it Expo Router renders both a native header and the custom one.

## Styling

- **Plain `StyleSheet` only** — all styles use `React Native StyleSheet.create()`. See ADR 011.
- **Sibling style files** — `StyleSheet.create()` blocks live in `*.styles.ts` files co-located with their screen or component (e.g. `add.tsx` → `add.styles.ts`). Never inline a large style block in a screen file.
- **Colors** — import `C` from `components/spuddy/palette.ts`. Do not hardcode hex values.
- **Shared tokens** — spacing, border radius, and typography scale live in `src/theme.ts`.
- **`src/tw/` is intentionally unused** — do not add `className` props, import from `src/tw`, or migrate to NativeWind/Tailwind without an explicit instruction from the user and a new ADR.

## Docs structure

```
docs/
  prd.md              # stable product requirements — what and why
  plans/              # one file per milestone, written before work starts
  decisions/          # ADRs — immutable records of significant technical decisions
  ideas/              # unreviewed drafts, may contain hallucinations (see ideas/CLAUDE.md)
```

## Maestro (E2E testing)

Cheat sheet: `.claude/maestro.md`. Use it when writing or reviewing Maestro flows.

If something doesn't work — selector fails, command behaves unexpectedly, flow crashes — or if a flow under review looks wrong, fetch the live docs at https://docs.maestro.dev/llms.txt before assuming the cheat sheet is complete.

## Workflow

- **Before starting a milestone:** a plan must exist in `docs/plans/`. Write it (or ask the user to confirm it) before writing any code.
- **During a conversation:** if a decision or scope changes, update the relevant plan file before continuing. Don't let the plan drift from what's actually being built.
- **Significant technical decisions** (choice of library, architectural approach, anything that was a real tradeoff) get recorded as an ADR in `docs/decisions/`. Format: context → decision → consequences. ADRs are never edited — supersede with a new one if the decision changes.
- **PRD changes:** if a conversation reveals that requirements have changed, update `docs/prd.md` before the session ends.
