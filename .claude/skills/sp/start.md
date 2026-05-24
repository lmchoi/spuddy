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

### Step 4: Confirm

Tell the user:
- Worktree path: `.claude/worktrees/<slug>`
- Branch: `feat/<slug>`
- Run `/sp:implement` to begin the TDD loop
