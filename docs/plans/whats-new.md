# What's New

**Status:** Someday  
**Scope:** Settings screen — static changelog entry

---

## Goal

Surface a running list of notable changes so users know what's been added since "Louise's Special" (v1 launch baseline).

---

## Decision

**Static "What's New" in Settings/About.** Plain text list, one line per change, newest first. No version numbers. No modals. Append to the list on each release.

---

## Options considered

| Option | Tradeoff |
| :----- | :------- |
| Static page in Settings (chosen) | Always accessible, zero gating logic, easy to maintain |
| One-time modal on first launch after update | Good for discovery, but adds friction every release and requires storing seen-version state |
| Inline contextual banner near the changed feature | Non-intrusive and contextual, but harder to maintain as features multiply |

---

## Implementation

1. Add a "What's New" row to the Settings screen that opens a simple modal or new screen.
2. Content is a hardcoded list — no fetching, no versioning logic.
3. Seed it with the v1 feature set (Louise's Special baseline).
4. Append entries manually each release.

---

## Out of scope

- Version numbers or semver display
- Gating by stored app version
- Rich media (screenshots, illustrations)
