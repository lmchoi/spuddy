---
model: sonnet
---

# /sp:fix

Fixes a bug TDD-style: regression test first, then fix. Creates its own worktree.

## Usage

`/sp:fix <description>`

## Steps

### Step 1: State the root cause hypothesis

Before touching any file, state:
- What is the observable symptom?
- What is the hypothesised root cause, with evidence from the code?
- What test would fail before the fix and pass after?

Do not proceed until the root cause is confirmed, not just the symptom.

### Step 2: Create a worktree

```bash
git worktree add .claude/worktrees/fix-<slug> -b fix/<slug>
ln -sf "$(pwd)/node_modules" .claude/worktrees/fix-<slug>/node_modules
ln -sf "$(pwd)/.env" .claude/worktrees/fix-<slug>/.env 2>/dev/null || true
```

### Step 3: Write the regression test

Write a test that fails because of the bug. Run it and confirm it is red. If the test passes before the fix, the hypothesis is wrong — re-diagnose.

### Step 4: Fix

Implement the minimal fix that makes the test pass without breaking existing tests.

Run `npm run check` — must be fully green before committing.

### Step 5: Commit and push

Run `/sp:commit`, then `/sp:push`.
