# Repository Maintenance & Cleanup Ideas

This document tracks strategies and commands to keep the `spuddy` repository and local workspace clean, especially when dealing with frequent squash-merges and git worktrees.

## 1. Git Configuration
To automatically remove stale remote-tracking branches (those that have been deleted on GitHub) during every `git fetch` or `git pull`:

```bash
git config --global fetch.prune true
```

## 2. Recommended Cleanup Alias
Since squash-merges change commit hashes, standard `git branch --merged` often fails. This alias identifies local branches whose remote counterparts have been deleted.

Add this to your `~/.gitconfig` or `.git/config`:

```ini
[alias]
    # List local branches that are 'gone' on the remote
    gone = !git branch -vv | grep ': gone]' | awk '{print $1}'
    # Delete all 'gone' branches
    cleanup = !git branch -vv | grep ': gone]' | awk '{print $1}' | xargs git branch -D
```

Usage:
- `git gone`: See what's safe to delete.
- `git cleanup`: Purge them all.

## 3. Worktree Maintenance
When using `.claude/worktrees/`, metadata can sometimes fall out of sync.

- `git worktree prune`: Cleans up stale worktree metadata.
- `sp-done`: Utilize the project-specific subagent to handle branch and worktree cleanup in one go.

## 4. GitHub Automation
- Enable **"Automatically delete head branches"** in Repository Settings -> General. This ensures the remote stays clean without manual intervention after a PR is merged.
