# ADR 006 — E2E testing: defer, and prefer Maestro over Detox when the time comes

**Status:** Deferred  
**Date:** 2026-05-23

## Context

The current test suite uses Jest + React Native Testing Library. This covers
component logic, state transitions, and button interactions fast and without a
simulator. It does not catch issues that only appear in the real native
renderer: gestures, keyboard behaviour, scroll physics, safe-area insets,
native module integration.

Two realistic options for React Native E2E:

**Detox** — drives the iOS/Android simulator via a device-coupled test runner.
Tests are written in JavaScript (Jest-compatible). Mature, widely used, has
deep integration with Expo's managed workflow.

- Pro: full native fidelity, same language as the rest of the test suite
- Con: slow setup (requires a linked simulator build), flaky on CI without
  careful configuration, tight coupling to the build environment

**Maestro** — YAML-based flows that drive the device via accessibility IDs and
text matching. Separate from the JS test suite.

- Pro: very fast to write new flows, stable on CI (cloud-hosted runner
  available), no build coupling beyond a running app
- Con: YAML is less expressive for complex assertions, separate toolchain,
  less community precedent with Expo SDK 56+

## Decision

Do not introduce E2E testing yet. The app is pre-v1 and screens are still
changing shape frequently — E2E tests against a moving UI create maintenance
drag without proportionate safety.

When E2E coverage becomes worth the cost (likely around a stable v1 with real
users), prefer **Maestro** for the first pass:

- Lower barrier to entry: flows are short YAML files, easy to add alongside a
  feature without a separate test-writing session
- Cloud runner means no simulator dependency in CI
- Can be adopted incrementally — one golden-path flow per screen, not full
  coverage

Detox remains the stronger choice if the team later needs fine-grained gesture
testing or deep native module assertions that Maestro's text/ID matching can't
reach. Revisit if Maestro proves insufficient.

## Consequences

- No E2E tests until post-v1 stabilisation
- Unit + integration layer (Jest + RNTL) remains the primary safety net
- When adding Maestro: wire flows to run against a local Expo dev build, not
  production; keep flows in `e2e/` at the repo root
