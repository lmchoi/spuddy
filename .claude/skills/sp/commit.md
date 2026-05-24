---
model: sonnet
---

# /sp:commit

Creates a single atomic commit with verified checks. Use instead of running git commit directly.

## Usage

`/sp:commit`

## Steps

### Step 1: Show the staged diff

Run `git diff --cached --stat` and then `git diff --cached`. Review what is staged.

### Step 2: Check for unrelated changes

If the diff contains changes unrelated to the current task (e.g. palette tokens, unrelated refactors, formatting changes in untouched files), flag them:

> The following staged changes appear unrelated to this commit: [list]
> Unstage them or explain why they belong here before proceeding.

Do not proceed until resolved.

### Step 3: Verify checks pass

Run `npm run check`. If it fails, fix the failure before committing — do not commit on a red check.

### Step 4: Write the commit message

Use conventional commit format:
- `feat:` new feature
- `fix:` bug fix
- `test:` tests only
- `refactor:` behaviour-preserving restructure
- `chore:` tooling, config, deps
- `docs:` documentation only

Keep the subject line under 72 characters. Add a body only if the why is non-obvious.

### Step 5: Commit

```bash
git commit -m "$(cat <<'EOF'
<message>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Confirm the commit was created and show the hash.
