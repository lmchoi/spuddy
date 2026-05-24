---
model: sonnet
---

# /sp:review

Extended code review: base correctness review plus plan-adherence check and simplification pass.

## Usage

`/sp:review [<PR-number-or-URL>] [--comment]`

- No args: reviews the current branch diff
- `<PR-number-or-URL>`: fetches and reviews that PR's diff via `gh pr diff`
- `--comment`: after presenting findings, posts each finding as an inline PR comment via `gh pr review --comment`. Comments are prefixed with `🤖 [claude review]` so they're distinguishable from human comments.

## Steps

### Step 1: Base review

Run the built-in `/review` skill against the current branch diff. Surface all correctness findings.

### Step 2: Plan-adherence check

Read the plan file for this branch from `docs/plans/`. Compare what was built against what was planned:

- Did each commit match its description in the plan?
- Were any steps skipped or done in a different order?
- Was anything added that wasn't in the plan (scope creep)?
- Were deviations documented?

Flag any discrepancy as a finding.

### Step 3: Simplification pass

Review the diff for over-engineering:

- Abstractions introduced for a single use case
- Helper functions that wrap one line
- Defensive error handling for paths that can't occur
- Comments that restate what the code already says

Flag candidates for simplification. Propose the simpler version inline.

### Step 4: Ranked findings

Combine all findings into one list ranked by severity:

- **High** — correctness bugs, missing tests, plan violations
- **Medium** — unnecessary complexity, missing edge case handling
- **Low** — style, minor simplifications

For each high finding, propose the exact fix and file/line it belongs in.

### Step 5: Post comments (only if `--comment` was passed)

For each finding, post an inline PR comment using `gh pr review`. Prefix every comment body with `🤖 [claude review]` so it's distinguishable from human comments.

For findings tied to a specific file and line:
```bash
gh pr review <PR> --comment \
  --body "🤖 [claude review] <severity>: <finding>\n\n<proposed fix>"
```

For general findings not tied to a specific line, post as a top-level review comment:
```bash
gh pr review <PR> --comment \
  --body "🤖 [claude review] <severity>: <finding>"
```

Post comments only for High and Medium findings. Skip Low findings unless the user explicitly asks for all.
