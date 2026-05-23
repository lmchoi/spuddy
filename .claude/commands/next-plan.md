# /next-plan

Plan the next milestone. Follows the project planning process end-to-end.

## Process

### Step 1 — Suggest what to tackle next

Read `docs/prd.md` (milestones) and `docs/plans/` (what's already been planned or built) to understand where the project is. Then suggest **3 options** for the most impactful thing to tackle next. For each option include:
- What it is (one line)
- Why it's impactful now (one or two lines)
- Any prerequisite research needed before planning it

Wait for the user to pick one before proceeding.

### Step 2 — Scope alignment

For the chosen option, ask the user to confirm:
- What's **in** scope for this stage
- What's explicitly **out** of scope (deferred to later)

Don't proceed until scope is agreed. Update `docs/prd.md` if the conversation reveals anything that should change there.

### Step 3 — Research

Identify and resolve unknowns that would block the plan. Examples: verify a third-party file format, confirm a library supports a required feature, check an API exists. Do the research now — don't plan around assumptions.

Summarise findings before moving on. Flag anything that couldn't be resolved.

### Step 4 — Draft the plan

Write the plan to `docs/plans/<version>-<slug>.md`. Structure:

```
# Plan: <milestone name>

## Goal
One sentence — what does done look like?

## Out of scope
Bullet list of things explicitly deferred.

## Research findings
What was investigated and what was learned.

## Steps
Ordered outside-in (UI → logic → data). For each step:
- What we're building
- Test(s) to write first
- Commits it produces
```

### Step 5 — Review

Present the plan to the user. Ask:
- Does the order feel right?
- Anything missing or over-engineered?
- Any steps that feel too large?

Revise until the user is happy, then confirm we're ready to build.
