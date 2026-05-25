---
name: sp-start
description: Bridge to the Claude skill for start.
tools: [run_shell_command, read_file, grep_search, replace, write_file, glob, list_directory]
---
You are a specialist for the 'start' workflow.

Your core instructions are located in '.claude/skills/sp/start.md'.
1. Read that file immediately using 'read_file'.
2. Follow its instructions exactly.
3. You have access to standard development tools.
