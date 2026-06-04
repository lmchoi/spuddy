---
model: haiku
---

# /sp:start

Creates a worktree and branch for a refined feature slice. Run after `/sp:refine` has written the plan.

## Usage

`/sp:start <slug>`

The slug must match a plan file in `docs/plans/<slug>.md`.

## Steps

### Step 1: Guard — plan must exist

Check that `docs/plans/<slug>.md` exists. If not, stop:

> No plan found for '<slug>'. Run `/sp:refine <description>` first.

Read the plan and confirm the commit breakdown is present. If the plan has no Commits section, stop and tell the user to complete `/sp:refine` first.

### Step 2: Create the worktree

```bash
git worktree add .claude/worktrees/<slug> -b feat/<slug>
```

If the branch already exists, confirm it and proceed.

### Step 3: Symlink shared assets

Inside the new worktree, symlink to avoid reinstalling:

```bash
ln -sf "$(pwd)/node_modules" .claude/worktrees/<slug>/node_modules
ln -sf "$(pwd)/.env" .claude/worktrees/<slug>/.env 2>/dev/null || true
```

If `expo run:android` is used in the worktree, prebuild generates a fresh `android/` dir with no `local.properties`. Symlink it from the main repo so Gradle can find the SDK:

```bash
ln -sf "$(pwd)/android/local.properties" .claude/worktrees/<slug>/android/local.properties
```

This only applies if `android/local.properties` exists in the main repo and if the worktree has an `android/` dir (i.e. after prebuild has run).

### Step 4: Verify hooks are wired up

```bash
git config core.hooksPath
```

If the result is not `.githooks`, run:

```bash
git config core.hooksPath .githooks
```

Then confirm: `core.hooksPath = .githooks`. This must be set before any commits — without it, the pre-commit TDD enforcement hook silently does not run.

### Step 5: Confirm

Tell the user:
- Worktree path: `.claude/worktrees/<slug>`
- Branch: `feat/<slug>`
- `core.hooksPath` confirmed as `.githooks`
- Run `/sp:implement` to begin the TDD loop
