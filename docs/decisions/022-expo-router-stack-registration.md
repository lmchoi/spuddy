# ADR 022 — Expo Router root Stack registration pattern

## Context

Expo Router's file-based routing discovers screens automatically — no explicit `Stack.Screen` registration is needed for a screen to be routable. However, configuration (header visibility, title, presentation style) still needs to be declared somewhere.

During the back-button UX milestone we encountered a non-obvious Expo Router behaviour: **if a `<Stack>` has any named `<Stack.Screen>` children, Expo Router treats the first one as the initial route**, overriding `unstable_settings.initialRouteName`. This caused the app to open directly on the Strong import file picker when `strong-import` was the only named child.

We also considered setting per-screen config inline inside each component via `<Stack.Screen options={{…}} />`, but this scatters config across the codebase and requires every developer to remember the convention.

## Decision

All screens default to `headerShown: false` via `screenOptions` on the root Stack. The Stack has a single named child — `index` — whose sole purpose is to anchor the initial route.

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="index" />
</Stack>
```

- `screenOptions` sets the default for all screens (`headerShown: false`)
- `index` is always the first (and currently only) named child — this anchors the initial route regardless of what other screens exist
- Screens that need non-default config get a named entry in `_layout.tsx`; inline `<Stack.Screen>` inside components is discouraged
- All screens use a custom header row; none currently opt into the native header

## Consequences

- Single source of truth for screen config — no hunting across component files
- New screens get the correct default (`headerShown: false`) without any registration
- The `index` anchor must never be removed; it is structural, not config
- Inline `<Stack.Screen>` inside components is explicitly discouraged by this pattern
