# Spuddy

A mobile workout tracker for people following structured strength programs. Logs sessions, surfaces progression trends, and makes it easy to feed workout data to an AI coach.

Built with Expo (React Native).

## Running the app

**On a physical device (easiest):**
1. Install [Expo Go](https://expo.dev/go) on your phone
2. `npm start`
3. Scan the QR code

**On Android emulator** (requires Android Studio + AVD):
```
npm run android
```

**On iOS simulator** (requires Xcode):
```
npm run ios
```

## Development

```
npm test        # run tests
npm start       # start Expo dev server
```

Tests run automatically on every commit via a pre-commit hook.

## Building for Android

### 1. Automated via GitHub Actions (Best for Testing)
This project is configured to automatically build a Release APK on GitHub.

- **Manual Trigger:** Go to the **Actions** tab in GitHub, select "Build Android APK", and click "Run workflow".
- **Automatic:** Push a git tag starting with `v` (e.g., `v1.0.0`). This will create a GitHub Release with the APK attached.
- **Artifacts:** Once finished, the APK can be found under the "Artifacts" section of the workflow run or on the "Releases" page.

### 2. Via EAS Build (Recommended for Store)
Uses Expo's cloud service. Best for production releases as it manages signing keys.

1. `npm install -g eas-cli`
2. `eas login`
3. `eas build -p android --profile preview`

### 3. Local Build
Requires Android Studio, SDK, and Java (JDK 17+) installed.

1. Generate the native `android` folder:
   ```bash
   npx expo prebuild
   ```
2. Build the APK:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   *The resulting APK will be in `android/app/build/outputs/apk/release/`.*

**When to run `prebuild`?**
Only needed for local builds or if you've changed native config (`app.json`, plugins). EAS and GitHub Actions run this automatically in the cloud.

## Docs

- [`docs/prd.md`](docs/prd.md) — product requirements
- [`docs/plans/`](docs/plans/) — per-milestone implementation plans
- [`docs/decisions/`](docs/decisions/) — architecture decision records
