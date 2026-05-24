# Settings page redesign

**Goal:** Bring `app/(tabs)/settings.tsx` in line with the visual design of `add.tsx` and `progress/index.tsx`.

## Context

The add and progress screens share a consistent dark-themed design:
- `C` palette from `components/spuddy/palette.ts` for all colours
- RN primitives (`View`, `Text`) rather than `Themed` wrappers
- `useSafeAreaInsets` so the dark `C.bg` background extends behind the status bar
- `StatusBar barStyle="light-content"`
- An explicit in-content screen title (28px bold, `C.text`, `letterSpacing: -0.5`)
- Cards use `C.card` / `C.card2` fill + `C.border` stroke
- Action buttons use `C.hit` (lime) not `#007AFF`

Settings currently has none of this: it uses `Themed` wrappers, hardcoded light colours, no safe-area handling, no StatusBar, and no in-content header.

## Scope

One slice, one commit.

### Slice 1 — Settings visual alignment

**File changed:** `app/(tabs)/settings.tsx`

#### Structural changes

| Before | After |
|---|---|
| `import { Text, View } from '@/components/Themed'` | `import { View, Text, ScrollView, ... } from 'react-native'` |
| `ScrollView contentInsetAdjustmentBehavior="automatic"` | Container `View` with `paddingTop: insets.top`, `StatusBar`, then `ScrollView` |
| No screen title | `<Text style={styles.screenTitle}>Settings</Text>` in scroll header |

#### Colour substitutions

| Hardcoded | Token |
|---|---|
| `'#f5f5f5'` (dayList bg) | `C.card` |
| `'#1a1a1a'` (dayName) | `C.text` |
| `'#888'` (programName, empty) | `C.sub` |
| `'#999'` (exerciseList) | `C.muted` |
| `'#ddd'` (separator) | `C.border` |
| `'#007AFF'` (import button) | `C.hit` |
| `'#0062CC'` (button pressed) | `C.hit` + opacity (or `C.hitBg` tinted) |
| `'#ccc'` (button disabled) | `C.cardSoft` |
| `'#fff'` (button text) | `C.bg` |

#### Layout pattern (matching progress screen)

```tsx
<View style={[styles.container, { paddingTop: insets.top }]}>
  <StatusBar barStyle="light-content" />
  <ScrollView contentContainerStyle={styles.scrollContent}>
    <Text style={styles.screenTitle}>Settings</Text>
    {/* existing program list + import button */}
  </ScrollView>
</View>
```

`styles.container` → `flex: 1, backgroundColor: C.bg`

## Out of scope

- No new features or settings rows
- No changes to logic / data layer
- No changes to other screens
