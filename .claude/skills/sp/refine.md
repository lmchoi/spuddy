---
model: sonnet
---

# /sp:refine

Structured refinement conversation before any implementation begins. Ends by writing a plan file — no code written.

## Usage

`/sp:refine <feature description>`

## Steps

Work through each phase in order. Pause and wait for user input before moving to the next.

### Phase 0: Context check

Read `docs/plans/` and `docs/decisions/` to surface any prior decisions or existing plans that constrain or inform this feature. Flag conflicts before proceeding.

### Phase 1: Restate and confirm

Restate what you understand the feature to be in one or two sentences. Ask the user to confirm or correct before continuing.

### Phase 2: Split check

Ask: can this be broken into two or more independent pieces that could ship separately?

Signals it should be split:
- Contains "and" connecting two distinct behaviours
- Part A must exist before Part B can be built
- Part A and Part B could be tested independently

If yes: propose the split, ask the user to confirm, then refine each part separately.

### Phase 3: Testability check

Ask: how would you test this? Can you write a test that fails before the work and passes after?

If unclear, flag it — untestable scope usually signals a fuzzy design decision. Don't block, but surface it.

### Phase 4: Value and alignment check

Ask:
- What does the user actually gain from this?
- Is there a simpler version that delivers most of the value?
- Does this align with `docs/prd.md` goals?

Surface concerns, defer to user judgement.

### Phase 5: Design discussion

Cover:
- What files change and where new code lives
- Any hard-to-reverse decisions (data formats, schema changes, module boundaries)
- Follow existing patterns — read the relevant code before proposing anything

If any hard-to-reverse decisions are made, propose an ADR in `docs/decisions/`. Check existing ADRs for the next number.

Do not edit any files during this phase.

### Phase 6: Commit breakdown

Propose a sequence of atomic, independently-testable commits. Each commit should:
- Do one logical thing
- Leave the app in a runnable state
- Have a clear test that validates it

Present as a numbered list. Ask the user to confirm or adjust.

### Phase 7: Write the plan file

After the user confirms, write `docs/plans/<slug>.md`:

```markdown
# Plan: <feature name>

## Goal
One sentence — what does done look like?

## Out of scope
Explicit deferrals.

## Design
Key decisions and tradeoffs. Files affected.

## Commits
1. <commit description> — test: <what test validates this>
2. ...
```

Confirm to the user once written. Tell them to run `/sp:start <slug>` when ready to begin.
