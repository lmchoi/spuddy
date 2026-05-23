# Plan: Tab bar — floating pill redesign

**Status: Slice 1 complete**

## Goal

Replace the stock Expo Tabs bar (opaque dark strip, flat icons) with a
floating pill that matches the warm-dark design language established in the
add screen and bento detail. Reference design: `docs/design_handoff_add_workout/tabbar.jsx` (T1 — Pill / Floating).

## Design intent

- Three tabs: Progress (left), Add (centre), Settings (right).
- Add tab is a FAB-style primary button — always circular, always `C.hit`
  green. It does not grow/label on focus like the flanking tabs.
- Progress and Settings expand to show an inline label when active.
- Pill floats above the content; `SafeAreaInsets` keeps it off the home
  indicator.

## Slices

### Slice 1 — Custom tab bar component ✓ DONE

- `components/spuddy/TabBarPill.tsx` — replaces the built-in tab bar via
  `<Tabs tabBar={...}>`.
- `app/(tabs)/_layout.tsx` — wired up; palette constants removed (now in
  `components/spuddy/palette.ts`).
- `app/_layout.tsx` — `useColorScheme` removed; app is dark-mode only;
  `WarmDarkTheme` applied unconditionally (hardcoded to `C.bg`).

### Slice 2 — Settings screen warm-dark redesign (pending)

Once the settings screen is visually aligned with the palette, the three
screens will share a consistent aesthetic. No tab bar changes expected.

## Decisions

- **App is dark-mode only.** `useColorScheme` was removed from `_layout.tsx`.
  System light keyboard/pickers may clash on Android; accepted until there
  is a real user request for light mode.
- **`WarmDarkTheme` at module level.** `C.bg` is a static `as const` hex
  string; module-level construction is safe.
- **Custom `TabBarProps` interface.** `expo-router` does not re-export
  `BottomTabBarProps`; a minimal local interface is used. `descriptors` is
  intentionally omitted — no badge or per-route accessibility overrides are
  used. Add it here if badges are ever needed.

## Out of scope

- Light-mode support.
- Tab bar badges / notification counts.
- Bottom sheet or modal triggered directly from the pill (future Sources Hub).
