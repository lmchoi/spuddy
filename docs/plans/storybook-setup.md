# Plan: Integrate Storybook with Environment Variable Toggle

**Status: completed**

## Goal
Enable component-driven development by integrating Storybook into the Expo app, toggleable via an environment variable.

## Decisions made
- Use `EXPO_PUBLIC_STORYBOOK` as the toggle.
- When `EXPO_PUBLIC_STORYBOOK` is set to `1`, the app should render Storybook's UI instead of the main app.
- Storybook configuration resides in `.storybook/`.

## What to build

### 1. Dependencies
- Install `@storybook/react-native` and related addons.

### 2. Storybook Configuration
- Create `.storybook/index.tsx` as the entry point.
- Configure `main.ts` and `preview.tsx`.

### 3. Conditional Toggle
- Modify `app/_layout.tsx` to conditionally export Storybook UI based on `process.env.EXPO_PUBLIC_STORYBOOK`.

### 4. Sample Stories
- Add a sample story for `TabBarPill`.

### 5. Scripts
- Add `storybook`, `storybook:ios`, `storybook:android`, `storybook:web` scripts to `package.json`.

### 6. Verification
- Add unit tests for the toggle in `app/_layout.tsx`.
