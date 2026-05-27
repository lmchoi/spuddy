# Plan: Automate Android APK Release via GitHub Actions

**Status: ready**

## Goal
Automate the generation of an optimized, deployable Android APK using GitHub Actions. This bypasses the need for EAS Build queues, keeps the build process entirely within GitHub, and provides easily downloadable artifacts for testing.

## Context
- The project is an Expo (React Native) app utilizing Continuous Native Generation (CNG).
- Native folders (`/android`, `/ios`) are git-ignored.
- GitHub Actions offers generous free minutes (unlimited for public repos, 2,000 for private).
- We want an optimized "Release" build, not a sluggish "Debug" build, but without the complexity of managing secure Keystores for Play Store distribution just yet.

## Implementation Steps

### 1. Create GitHub Action Workflow
**File:** `.github/workflows/build-apk.yml`

This workflow will handle the build process:
- **Triggers:**
  - `workflow_dispatch`: Allow manual triggering from the GitHub Actions UI.
  - `push` (tags): Trigger automatically when a version tag (e.g., `v1.0.0`) is pushed.
- **Environment:** Use `ubuntu-latest`, Setup Node.js (v20), Setup Java (JDK 17).
- **Steps:**
  1. Check out code.
  2. Install dependencies (`npm ci`).
  3. Generate Android project (`npx expo prebuild -p android`).
  4. Build the release APK (`cd android && ./gradlew assembleRelease`).
  5. Upload the resulting `.apk` as a workflow artifact.
  6. (Optional/If Tagged) Create a GitHub Release and attach the APK.

### 2. Update README.md
**File:** `README.md`

Add a new section: **Building the Android APK**
- Explain how to trigger the build manually via the GitHub Actions tab.
- Explain how to trigger the build by pushing a git tag.
- Detail where to find the downloaded APK artifact.

## Security & Limitations
- The resulting APK will be an unsigned (or default debug-signed) **Release** build. It will perform well but cannot be uploaded to the Google Play Store.
- If we later decide to publish to the Play Store, this workflow will need to be updated to accept a Base64-encoded Keystore and passwords via GitHub Secrets. No secrets are required for this initial implementation.

## Verification
- Trigger the workflow manually via `workflow_dispatch`.
- Verify the build completes successfully (usually 10-15 minutes).
- Download the APK artifact.
- Install the APK on a physical Android device or emulator to confirm it boots correctly and performs well (Release mode).
