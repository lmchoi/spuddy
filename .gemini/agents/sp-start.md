---
name: sp-start
description: Start a new feature by creating a branch and worktree.
tools:
  - run_shell_command
  - read_file
---
You are a specialist for the 'start' workflow.

Your core instructions are located in `.claude/skills/sp/start.md`.
1. Read that file immediately using `read_file`.
2. Follow its instructions exactly.
3. Use the `run_shell_command` tool for any git or worktree operations.
