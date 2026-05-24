# Plan: Dev Tooling — Hooks & Skills

**Status: ready**

## Goal

Mechanically enforce the TDD discipline and commit hygiene that currently relies on CLAUDE.md prose (which Claude ignores ~50% of the time). Prefer hooks (hard blocks) and skills (guided workflows) over instructions.

## Decisions made

**Hooks over prose** — automated enforcement at git lifecycle events is more reliable than instructions in CLAUDE.md. Skills encode workflow sequences that Claude must follow rather than hope to remember.

**Gate structure:**
- `pre-commit` → fast correctness gate (typecheck + tests, ~15–20s)
- `pre-push` → full quality gate (typecheck + lint + tests)
- CI → same as pre-push + bundle verification

**Lint excluded from pre-commit** — stylistic, not a correctness signal, slows the commit loop.

**Same-commit TDD rule** — if source `.ts`/`.tsx` files are staged, test files must also be staged. Temporal order (test-first) cannot be enforced by git; enforced by workflow via `/tdd` skill instead.

## What to build

### 1. `package.json` scripts (single source of truth)

```json
"check": "npm run typecheck && npm test -- --watchAll=false",
"check:full": "npm run typecheck && npm run lint && npm test -- --watchAll=false"
```

Both hooks and CI reference these. Adding a check = change one place.

### 2. `.githooks/pre-commit` (tracked)

Replaces the untracked `.git/hooks/pre-commit`. Does two things:
1. Runs `npm run check`
2. Validates that source changes are accompanied by test changes

Whitelist paths that legitimately have no tests: `types/`, `constants/`, `*.config.*`, `jest.setup.*`.

### 3. `.githooks/pre-push` (update existing)

Update to call `npm run check:full` instead of inline commands — keeps it aligned with the script definition.

### 4. Permission allowlist

Run `/fewer-permission-prompts` against session transcripts, add generated allowlist to `.claude/settings.json`. Prerequisite for autonomous skill execution.

### 5. `PreToolUse` Bash hook — destructive command guard

Blocks: `cp -r` into existing repos, `git reset --hard`, `git checkout --`, `git clean -f`, `rm -rf` on non-temp paths.

### 6. Skills (in dependency order)

| Skill | File | Model |
|---|---|---|
| `/sp:refine` | `.claude/skills/sp/refine.md` | sonnet |
| `/sp:start` | `.claude/skills/sp/start.md` | haiku |
| `/sp:implement` | `.claude/skills/sp/implement.md` | sonnet |
| `/sp:fix` | `.claude/skills/sp/fix.md` | sonnet |
| `/sp:commit` | `.claude/skills/sp/commit.md` | sonnet |
| `/sp:push` | `.claude/skills/sp/push.md` | sonnet |
| `/sp:done` | `.claude/skills/sp/done.md` | haiku |
| `/sp:review` | `.claude/skills/sp/review.md` | sonnet |

### 7. `SKILLS.md` index

Single file in `.claude/skills/` — one line per skill, what it does, when to use it vs the others.

## Out of scope

- Expo bundle verification in pre-commit (too slow; CI is the right gate)
- `npm ci` in any local hook (reinstalls deps, ~30s+)
- Parallel review agents (separate initiative, higher complexity)

## Implementation order

1. Permission allowlist (`/fewer-permission-prompts` → `.claude/settings.json`)
2. `package.json` scripts (`check`, `check:full`)
3. `.githooks/pre-commit` (move from `.git/hooks/`, add test-presence check)
4. `.githooks/pre-push` (update to call `npm run check:full`)
5. `PreToolUse` Bash hook — destructive command guard
6. Skills in order: `refine` → `start` → `implement` → `fix` → `commit` → `push` → `done` → `review`
7. `SKILLS.md` index

See `docs/decisions/007-dev-tooling-hooks-skills.md` for rationale and open questions.
