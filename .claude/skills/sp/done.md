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

### Step 5: Archive the plan

Check whether a plan file exists for this milestone:

```bash
ls docs/plans/"$SLUG".md 2>/dev/null
```

If the file exists, move it to the archive and update the README:

```bash
mv docs/plans/"$SLUG".md docs/plans/archive/"$SLUG".md
```

Then remove the corresponding row from the `## Active` table in `docs/plans/README.md` and add a row to the `## Archived` table. Insert it in alphabetical order by plan title.

If no matching plan file is found, list the files in `docs/plans/` and ask the user which one (if any) corresponds to this milestone.

### Step 6: Confirm

Tell the user the branch and worktree have been cleaned up, they are back on main, and which plan file (if any) was archived.
