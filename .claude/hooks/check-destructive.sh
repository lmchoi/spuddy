#!/bin/sh
# Block destructive shell commands that have caused data loss in prior sessions.
# Receives Bash tool input as JSON on stdin.

input=$(cat)
command=$(echo "$input" | python3 -c "
import json, sys
try:
    print(json.load(sys.stdin).get('command', ''))
except:
    print('')
" 2>/dev/null)

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
