# EAS Build in CI

When we're ready to distribute (TestFlight / Play Store internal track), add EAS Build to the CI pipeline.

## What it would look like

- `eas build --platform android --profile preview` on push to main → produces an APK
- `eas build --platform ios --profile preview` → produces an IPA for TestFlight
- `eas submit` to push to stores

## Prerequisites

- EAS account set up (`npx eas-cli login`)
- `eas.json` with build profiles configured
- Apple Developer account (iOS) / Google Play account (Android)
- `EXPO_TOKEN` secret in GitHub repo settings

## References

- Expo docs: https://docs.expo.dev/build/introduction/
- EAS CI integration: https://docs.expo.dev/build/building-on-ci/
