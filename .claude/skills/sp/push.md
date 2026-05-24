---
model: sonnet
---

# /sp:push

Prepares docs, runs full checks, then pushes and opens a PR. Claude owns the fix loop.

## Usage

`/sp:push`

## Steps

### Step 1: Update docs

Read `docs/plans/<slug>.md` for the current branch.

Check:
- Are completed commits marked or noted in the plan?
- Were there any deviations from the plan that should be documented?
- Were any significant technical decisions made that need an ADR?

If anything needs updating: write the changes, then run `/sp:commit` with a `docs:` prefix before continuing. Do not skip this step.

### Step 2: Run full checks

```bash
npm run check:full
```

### Step 3: Fix failures autonomously

If checks fail:
1. Diagnose the root cause (not just the symptom)
2. Fix it
3. Re-run `npm run check:full`
4. Repeat up to 3 times

After 3 failed attempts, stop and report what was tried and what is still failing. Do not push broken code.

### Step 4: Push and open PR

```bash
git push -u origin <branch>
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
- <bullet points from plan>

## Test plan
- [ ] npm run check:full passes
- [ ] <any manual verification steps>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Report the PR URL. Tell the user to run `/sp:done` after the PR is merged.
