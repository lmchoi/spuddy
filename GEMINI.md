# Project Mandates

## Workflow & Safety
- **Follow CLAUDE.md:** Strictly adhere to all architectural, coding, and testing standards defined in `CLAUDE.md`.
- **No Bypasses:** Never use `--no-verify` or any flag that skips pre-commit/pre-push hooks. If a hook fails, it is a blocking error that must be resolved.
- **Mandatory Review:** Always run and review `git diff --staged` before every commit. Verify that the changes match the intent and follow project styles.
- **Strict TDD:** Every bug fix MUST begin with a reproduction test case that fails. Commit the fix only after the test passes and the full suite is verified.
- **Surgical Edits:** Prefer the `replace` tool over custom scripts for code modifications to ensure changes are applied as intended.
