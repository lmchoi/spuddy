# ADR-015: App variants for side-by-side installs and CI builds

## Context

As the project gained a CI pipeline and multiple EAS build profiles, two problems emerged:

- Debug and release builds shared the same `android.package`, so installing one overwrote the other and wiped SQLite data.
- The CI workflow built a Gradle `debug` APK, which requires Metro to serve the JS bundle at runtime. To make it self-contained, the workflow patched `build.gradle` with `sed` after prebuild — a fragile hack that would silently break if Expo changed the generated file format.

Two approaches were considered for the signing/install-conflict problem:

- **Share the EAS keystore with CI** — export the EAS-managed keystore, store it as a GitHub Secret, configure Gradle to use it. Solves the overwrite problem but requires coordinating `versionCode` between EAS (remote-managed) and CI (hardcoded), and adds keystore management complexity.
- **Separate package names per variant** — each build profile gets a distinct `applicationId`. Installs coexist as independent apps. No keystore coordination needed.

## Decision

Use `app.config.js` (dynamic Expo config) with an `APP_VARIANT` environment variable to assign distinct package names and app display names per build tier:

| Variant | Package | Display name | When used |
|---|---|---|---|
| `development` | `com.mchoi.spuddy.dev` | Spuddy (Dev) | EAS dev client (Metro shell) |
| `preview` | `com.mchoi.spuddy.preview` | Spuddy (Preview) | EAS APK for sharing |
| `prerelease` | `com.mchoi.spuddy.prerelease` | Spuddy (Pre-release) | CI APK for personal testing |
| `production` | `com.mchoi.spuddy` | Spuddy | EAS production / Play Store |

EAS profiles inject `APP_VARIANT` via `eas.json` `env` blocks. The CI workflow sets it before running `expo prebuild`.

The CI workflow also switches from `assembleDebug` to `assembleRelease`. Release builds bundle JS natively — no Metro dependency, no `sed` patching.

## Consequences

- Pre-release and production builds coexist on a device as separate apps with separate data. This is intentional: CI builds are for branch verification, not production data testing.
- Data does not persist across tiers — a pre-release build cannot be upgraded to a production build. Acceptable given the use case.
- `app.json` remains the static fallback; `app.config.js` spreads it and overrides only `name`, `android.package`, and `ios.bundleIdentifier` per variant.
- Any unknown `APP_VARIANT` value falls back to `production` config.
