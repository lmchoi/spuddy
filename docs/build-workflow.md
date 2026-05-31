# Build workflow

## Three tiers

| Tier | How to trigger | Who installs it | Signed with |
|---|---|---|---|
| Pre-release | CI `workflow_dispatch` | You, for branch testing | Debug keystore |
| Preview | `eas build --profile preview` | You + others (sideload) | EAS keystore |
| Production | `eas build --profile production` (on tag) | Play Store users | EAS keystore |

These are **separate apps** on-device — different package names, different data stores. Installing one never affects another.

## When to use each

**Pre-release** — verifying a feature branch on a real device without burning an EAS build. Trigger from GitHub Actions → Actions tab → "Android Pre-release APK" → Run workflow → enter branch name. Download the APK artifact, install via ADB or send to device.

**Preview** — sharing a build with someone else, or doing a final confidence check before tagging a release. Behaves identically to production (same binary format, same keystore lineage).

**Production** — tagging a release for the Play Store. Triggered automatically on `v*` tags, or manually via `workflow_dispatch` with a version number.

## Local dev (no APK needed)

For day-to-day development, you don't need to build an APK:

1. Install the EAS `development` build on your device once — this is the expo-dev-client native shell (`eas build --profile development`)
2. Run `npx expo start` on your machine
3. The app on your device connects to Metro over wifi and loads your JS live

Use this for all iterative work. Only reach for a pre-release APK when you need to test something without a laptop (e.g. on the go, or testing background behaviour).

## Version numbers

`eas.json` uses `appVersionSource: "remote"` — EAS Cloud owns the auto-incrementing `versionCode` for EAS builds. Pre-release APKs use whatever `versionCode` Gradle generates (currently `1`). This is intentional: pre-release is a separate app, so Android's downgrade check never applies.
