# Custom Skills (sp: namespace)

Project-level skills for the Spuddy development workflow. All prefixed `sp:` to distinguish from system skills.

## Workflow order

```
/sp:refine → /sp:start → /sp:implement → /sp:push → /sp:done
                                ↑
                           /sp:commit (called inside implement)
                           /sp:fix    (alternative entry for bugs)
                           /sp:review (call before or after push)
```

## Skills

| Skill | Model | When to use |
|---|---|---|
| `/sp:refine` | sonnet | Starting point for any new feature — structured conversation that ends with a plan file |
| `/sp:start` | haiku | After refine — creates worktree and branch, symlinks node_modules |
| `/sp:implement` | sonnet | Inside the worktree — TDD loop, one plan commit at a time |
| `/sp:fix` | sonnet | Bug fixes — forces root cause diagnosis, regression test first |
| `/sp:commit` | sonnet | Instead of `git commit` — verifies checks, enforces atomic commits |
| `/sp:push` | sonnet | When implementation is done — updates docs, runs check:full, opens PR |
| `/sp:done` | haiku | After PR is merged — verifies merge, removes worktree, deletes branch |
| `/sp:review` | sonnet | Code review with plan-adherence and simplification passes |

## Guards between skills

- `/sp:start` refuses to run if no plan file exists → run `/sp:refine` first
- `/sp:implement` refuses to run if no worktree exists → run `/sp:start` first
- `/sp:done` refuses to clean up if PR is not merged → merge first

## Escape hatches

- `git commit --no-verify` bypasses the pre-commit hook for genuine exceptions (types-only files, docs). Use sparingly.
- `/sp:fix` does not require a pre-existing plan — it creates a minimal worktree inline.
