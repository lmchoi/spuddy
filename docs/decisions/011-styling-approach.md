# ADR 011: Styling approach — plain StyleSheet with sibling style files

## Context

All screens and components use React Native's `StyleSheet.create()`. A `src/tw/` wrapper was scaffolded (using `react-native-css` to enable Tailwind-style `className` props on RN primitives) but was never adopted — no screen or component in the app imports from it.

StyleSheet blocks account for 40–50% of most screen files, making them hard to navigate. The question was whether to:
1. Extract StyleSheet blocks into sibling `*.styles.ts` files (stay with StyleSheet)
2. Migrate to the existing `src/tw/` wrapper (adopt NativeWind-style Tailwind)
3. Some mix

The team is new to mobile/UI and wants minimal new patterns to learn. Migration from StyleSheet → Tailwind is easier than the reverse.

## Decision

Use plain RN `StyleSheet` as the styling primitive. Move `StyleSheet.create()` blocks into sibling `*.styles.ts` files co-located with their screen or component. Extract shared numeric tokens (spacing, border radius, typography scale) into `src/theme.ts`. Colors remain in `components/spuddy/palette.ts`.

`src/tw/` is left in place but is intentionally unused and deferred indefinitely.

## Consequences

- Screen files are halved in size; styles are still easy to find (same directory, `*.styles.ts`)
- No new library or class-string vocabulary to learn
- Shared token extraction (`src/theme.ts`) happens incrementally as a second pass
- Migration to Tailwind/NativeWind remains possible later — StyleSheet → Tailwind is the straightforward direction
- `src/tw/` should not be adopted without an explicit decision and a superseding ADR
