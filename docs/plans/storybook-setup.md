# Storybook Setup & Integration

## Objective
Integrate Storybook for React Native into the Expo application to enable isolated UI component development and visual testing, ensuring full compatibility with NativeWind v5 (Tailwind CSS).

## Background & Motivation
As the application grows and begins incorporating AI for UI generation, having a centralized, isolated environment for components is crucial. Storybook acts as a visual catalog, forcing clean, props-driven component design and providing immediate feedback on UI states without requiring full application navigation.

## Proposed Solution
We will implement Storybook using the **Environment Variable Toggle** architecture. 
- Storybook will run natively on-device (or in the simulator).
- We will use an environment variable (EXPO_PUBLIC_STORYBOOK=1) to intercept the app's entry point (app/_layout.tsx).
- When the variable is active, the app will render the Storybook UI instead of the main application. This ensures zero Storybook overhead in production builds and avoids routing conflicts with Expo Router.

## Workflow & Coding Preferences
- **Execution Strategy:** This implementation MUST be driven using the project's specialized sp-* subagents. We will use sp-start to create an isolated worktree branch, sp-implement to execute the code changes, sp-commit for atomic commits, and sp-push/sp-done to finalize the PR.
- **Test First (UI Edition):** While traditional TDD is complex for React Native UI, Storybook acts as our visual "test first" environment. We will build components in isolation (Storybook) before integrating them into the broader application logic.
- **Atomic Commits:** The implementation will be broken down into small, atomic commits using the sp-commit agent (e.g., "chore: install storybook dependencies", "feat: configure storybook entry and layout toggle", "docs: add TabBarPill sample story").
- **Outside-in:** This setup enables the UI layer to be rapidly prototyped and visually validated before wiring up deeper domain logic.

## Implementation Steps

### 0. Prep Environment
- Invoke sp-start subagent to create a new branch and worktree for feature/storybook-setup.
- Copy this plan into docs/plans/storybook-setup.md in the new worktree.

### 1. Install Dependencies
Install the necessary Storybook packages for React Native.
- @storybook/react-native
- @storybook/addon-ondevice-controls
- @storybook/addon-ondevice-actions
- @react-native-async-storage/async-storage (often required by Storybook for saving UI state)
- react-native-safe-area-context (already installed, needed for Storybook UI)

### 2. Configure Storybook
Create the .storybook directory at the project root with the following files:
- **main.ts**: Configure story glob patterns (e.g., ../components/**/*.stories.?(ts|tsx|js|jsx)).
- **preview.tsx**: Setup global decorators to ensure NativeWind styles are applied correctly within stories (e.g., wrapping stories in a View with Tailwind classes if necessary, or just ensuring global CSS is loaded).
- **index.tsx**: The main entry point that initializes the Storybook UI.

### 3. Integrate with Expo Router Entry
Modify app/_layout.tsx to conditionally render Storybook.
- Import the Storybook root component from .storybook/index.tsx.
- Check if process.env.EXPO_PUBLIC_STORYBOOK === '1'.
- If true, return the Storybook UI. Otherwise, return the standard Expo Router Stack.

### 4. Create a Sample Story
Create a story file for an existing component to verify the setup and NativeWind integration.
- E.g., components/spuddy/TabBarPill.stories.tsx
- Define variations (e.g., active, inactive).

### 5. Update Scripts
Add convenience scripts to package.json:
- "storybook": "EXPO_PUBLIC_STORYBOOK=1 expo start"
- "storybook:ios": "EXPO_PUBLIC_STORYBOOK=1 expo run:ios"
- "storybook:android": "EXPO_PUBLIC_STORYBOOK=1 expo run:android"

## Verification & Testing
1. Run npm run storybook.
2. Open the app in the iOS/Android simulator or via web.
3. Verify that the Storybook UI loads instead of the main app.
4. Verify that the sample story (TabBarPill) renders correctly and that its NativeWind styles are applied.
5. Stop the bundler, run npm start (without the env var), and verify the main app functions normally.

### Finalization
- Invoke sp-push to push the changes and open a PR.
- Invoke sp-done to clean up the local worktree.
