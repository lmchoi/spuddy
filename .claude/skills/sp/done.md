---
model: haiku
---

# /sp:done

Post-merge cleanup. Verifies the PR is merged before doing anything destructive.

## Usage

`/sp:done`

Run this after the PR for the current branch has been merged.

## Steps

### Step 1: Detect the branch and worktree

```bash
BRANCH=$(git branch --show-current)
SLUG=$(echo "$BRANCH" | sed 's|feat/||;s|fix/||')
```

### Step 2: Verify the PR is merged

```bash
gh pr view "$BRANCH" --json state,number
```

If `state` is not `MERGED`, stop:

> PR is not merged yet (state: <state>). Merge it first, then re-run /sp:done.

Do not proceed until confirmed merged.

### Step 3: Remove the worktree

```bash
git worktree remove .claude/worktrees/"$SLUG" --force
```

### Step 4: Delete the local branch

```bash
git checkout main
git pull
git branch -d "$BRANCH"
```

### Step 5: Confirm

Tell the user the branch and worktree have been cleaned up and they are back on main.
