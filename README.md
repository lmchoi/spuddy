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

## E2E tests (Maestro)

Flows live in `e2e/`. Maestro is a CLI tool — not an npm dependency.

**Setup:**
```
brew install maestro
```

**Run the smoke flow** (requires a running dev build on a connected device or emulator):
```
npm start          # terminal 1 — start Expo dev server
maestro test e2e/smoke.yaml   # terminal 2
```

## Docs

- [`docs/prd.md`](docs/prd.md) — product requirements
- [`docs/plans/`](docs/plans/) — per-milestone implementation plans
- [`docs/decisions/`](docs/decisions/) — architecture decision records
