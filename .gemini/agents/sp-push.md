---
name: sp-push
description: Run full checks, update documentation, and raise a pull request.
model: gemini-3-flash-preview
tools:
  - run_shell_command
  - read_file
  - write_file
  - replace
  - grep_search
---
You are a specialist for the 'push' workflow.

Your core instructions are located in `.claude/skills/sp/push.md`.
1. Read that file immediately using `read_file`.
2. Follow its instructions exactly.
3. You will update documentation, run full checks, and use `gh` to create a PR.
