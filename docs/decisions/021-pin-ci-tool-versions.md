# ADR 021 — Pin external tool versions in CI workflows

**Status:** Accepted  
**Date:** 2026-06-20

## Context

CI workflows pull external tools at build time. When a version is unpinned
(`latest`, a bare major tag, or a version-less install script), a tool
publisher's new release can silently break the build between two otherwise
identical commits.

Two concrete examples hit this project:

- `expo/expo-github-action` was configured with `eas-version: latest`. EAS CLI
  v20.x introduced a stricter requirement for `eas init` to have been run
  before `eas build --non-interactive`. The first tag push after that CLI
  release failed with "EAS project not configured", even though `app.json`
  already contained the `projectId`.
- Both E2E workflows installed Maestro via `curl -Ls "https://get.maestro.mobile.dev" | bash`
  with no version argument — always pulling whatever is latest on their CDN.

## Decision

Pin every external tool in CI to a specific version:

- **GitHub Actions** — pin to a full tag (`@v4.x.y`) for actions that have a
  history of breaking changes; major-version tags (`@v4`) are acceptable for
  well-maintained official actions (`actions/*`, `expo/*`) where patch releases
  are reliably non-breaking.
- **CLI tools installed at runtime** — always pass an explicit version (e.g.
  `MAESTRO_VERSION=2.6.1`, `eas-version: 20.3.0`). Never use `latest` or omit
  the version.
- **Node.js** — major version pin (`node-version: 20`) is sufficient; patch
  updates within a major are backward-compatible by Node.js policy.

When upgrading a pinned tool, do it as an intentional, reviewed commit so the
change is visible in history and any breakage is immediately attributable.

## Consequences

- CI is stable across identical commits — no surprise failures from upstream
  releases.
- Upgrades require a deliberate PR rather than happening automatically. This is
  acceptable given the team size and release cadence.
- The pinned versions will drift from latest over time; treat version-bump PRs
  as routine maintenance, not emergencies.
