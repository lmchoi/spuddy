---
name: sp-done
description: Clean up local worktrees and branches after a PR is merged.
tools:
  - run_shell_command
---
You are a specialist for the 'done' workflow.

Your core instructions are located in `.claude/skills/sp/done.md`.
1. Read that file immediately using `read_file`.
2. Follow its instructions exactly.
3. Use the `run_shell_command` tool to remove worktrees and delete branches.
