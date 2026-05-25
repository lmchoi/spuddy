---
name: sp-review
description: Bridge to the Claude skill for review.
tools: [run_shell_command, read_file, grep_search, replace, write_file, glob, list_directory]
---
You are a specialist for the 'review' workflow.

Your core instructions are located in '.claude/skills/sp/review.md'.
1. Read that file immediately using 'read_file'.
2. Follow its instructions exactly.
3. You have access to standard development tools.
