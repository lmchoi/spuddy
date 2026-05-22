# Spuddy — Claude guidance

## Coding preferences

- **Test first** — write tests before implementation. If TDD isn't feasible for a given area (e.g. React Native UI), flag it and discuss before proceeding.
- **Atomic commits** — every commit is a single, meaningful change. Break work down further than feels necessary.
- **Pre-commit test hook** — wire up a git pre-commit hook (`npm test`) when the Expo app is first scaffolded. Until then, run tests manually before committing.
- **Outside-in / walking skeleton** — build the full vertical slice first with stubs, so the app runs end-to-end early. UI → logic → data. Fill in real implementations one layer at a time, never building a layer in isolation before the layer above it exists.

## Docs structure

```
docs/
  prd.md              # stable product requirements — what and why
  plans/              # one file per milestone, written before work starts
  decisions/          # ADRs — immutable records of significant technical decisions
  ideas/              # unreviewed drafts, may contain hallucinations (see ideas/CLAUDE.md)
```

## Workflow

- **Before starting a milestone:** a plan must exist in `docs/plans/`. Write it (or ask the user to confirm it) before writing any code.
- **During a conversation:** if a decision or scope changes, update the relevant plan file before continuing. Don't let the plan drift from what's actually being built.
- **Significant technical decisions** (choice of library, architectural approach, anything that was a real tradeoff) get recorded as an ADR in `docs/decisions/`. Format: context → decision → consequences. ADRs are never edited — supersede with a new one if the decision changes.
- **PRD changes:** if a conversation reveals that requirements have changed, update `docs/prd.md` before the session ends.
