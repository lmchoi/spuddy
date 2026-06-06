# ADR 014: Adoption of a Standardized Design Baseline

## Context
Spuddy currently uses an ad-hoc design system with inconsistent typography, spacing (18dp margins), and touch targets (36dp). These inconsistencies affect accessibility and scalability. While Material 3 (M3) offers a robust solution, strictly applying it may make the iOS experience feel non-native.

## Decision
We will adopt a **Material-inspired Shared Baseline** rather than a strict "Material You" implementation. This approach prioritizes:
1.  **Shared Standards:** 8dp grid, 16dp horizontal margins, and 48dp minimum touch targets (meeting both iOS and Android accessibility minimums).
2.  **Standardized Typography:** Adopting the M3 font size scale (12, 14, 16, 22) as it provides a better rhythmic hierarchy than the current ad-hoc sizes.
3.  **Semantic Color Roles:** Mapping the existing "Spuddy" palette to semantic roles (e.g., `surface`, `onSurface`, `outline`) to support easier maintenance and robust Dark Mode, without changing the "Spuddy" visual identity.

## Consequences
- **Platform Neutrality:** The app will feel high-quality on both platforms by following universal mobile standards.
- **Breaking Changes:** Refactoring `palette.ts` will require updates across all components.
- **Consistency:** New components will have clear tokens to follow for spacing and size.
- **Testability:** Standardized tokens allow for easier regression testing via snapshot tests.

## Migration Strategy
1.  **Incremental Rollout:** Introduce `src/theme.ts` and update `palette.ts` with additive semantic roles.
2.  **Component-by-Component:** Refactor existing styles to use tokens instead of hardcoded values.
3.  **Visual Validation:** Use snapshot tests for critical components (`TabBarPill`, `SessionRow`) and manual verification for screens.
