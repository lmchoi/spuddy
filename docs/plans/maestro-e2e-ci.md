# Plan: Maestro E2E in release CI

## Goal
The `eas-build.yml` release workflow automatically runs the three golden-path Maestro flows against the EAS-built APK before the release is considered done.

## Out of scope
- Running E2E on every PR
- `visual-baseline.yaml` (capture-only, no assertions — excluded from CI run)
- iOS flows
- Maestro Cloud (no free tier)

## Design
A second job (`e2e`) is added to `.github/workflows/eas-build.yml`, dependent on the existing `build` job. The `build` job is modified to capture the EAS artifact URL (via `--json`) and export it as a job output. The `e2e` job runs on `ubuntu-latest` with KVM enabled (cheaper than macOS runners and equally reliable for x86_64 Android emulators), downloads the APK, installs Maestro CLI, starts an Android emulator via `reactivecircus/android-emulator-runner`, and runs the three flows.

Flows run: `e2e/smoke.yaml`, `e2e/notes-paste.yaml`, `e2e/select-day.yaml`.

**Files affected:**
- `.github/workflows/eas-build.yml` — only file that changes

No ADR needed — all changes are reversible workflow YAML.

## Commits
1. `ci(e2e): capture EAS artifact URL as job output` — add `--json` to `eas build` step, parse artifact URL with `jq`, export via `$GITHUB_OUTPUT`; test: workflow run shows artifact URL in build job summary
2. `ci(e2e): add Maestro E2E job to release workflow` — add `e2e` job on `ubuntu-latest` (KVM) with `needs: build`, downloads APK, installs Maestro, runs emulator via `reactivecircus/android-emulator-runner`, executes the three flows; test: manual workflow dispatch completes with all flows green
