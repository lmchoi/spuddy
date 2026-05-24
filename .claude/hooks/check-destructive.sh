#!/bin/sh
# Block destructive shell commands that have caused data loss in prior sessions.
# Receives Bash tool input as JSON on stdin.

input=$(cat)

# Extract the command value from JSON using sed — no python3 needed
command=$(printf '%s' "$input" | sed 's/.*"command"[[:space:]]*:[[:space:]]*"\(.*\)".*/\1/' | head -1)

if printf '%s' "$command" | grep -qE '(^|&&|\|)\s*cp -r'; then
  printf '{"systemMessage": "Blocked: cp -r can clobber tracked files and git history. Use git-aware operations, or ask the user to confirm before proceeding."}\n'
  exit 1
fi

if printf '%s' "$command" | grep -qE '(^|&&|\|)\s*rm -rf'; then
  printf '{"systemMessage": "Blocked: rm -rf is irreversible. Confirm the exact path with the user before running."}\n'
  exit 1
fi

if printf '%s' "$command" | grep -qE 'git (reset --hard|checkout --|clean -f)'; then
  printf '{"systemMessage": "Blocked: destructive git operation detected. Confirm with the user before running git reset --hard, checkout --, or clean -f."}\n'
  exit 1
fi
