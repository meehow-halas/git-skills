---
name: pull
description: Pull the current branch (rebase + autostash by default) and show new commits.
disable-model-invocation: true
argument-hint: "[--ff-only | --rebase] [--config]"
allowed-tools: Bash(git *)
---

# pull

Pull the current branch. Arguments: `$ARGUMENTS`

## Mode (first match wins)
1. Flag: `--ff-only` or `--rebase`.
2. `git config --local pull.rebase`, then `--global`: `true` -> rebase, `false` -> merge.
3. Default: `git pull --rebase --autostash`.

## Procedure
1. `git branch --show-current`. Empty (detached HEAD) -> stop with a message.
2. No upstream configured -> say so, offer `git branch --set-upstream-to=origin/<branch>`, stop.
3. Record `git rev-parse HEAD`, then run the pull in the chosen mode (with `--autostash` for rebase).
4. Conflict: STOP. Show `git status`. Do not resolve conflicts yourself. Offer `git rebase --abort` (or `git merge --abort`) and let the user decide.
5. `--ff-only` fails: explain branches diverged; suggest rebase, do not retry automatically.
6. Success: show new commits `git log --oneline ORIG_HEAD..HEAD` (say "already up to date" if none).

## Config
`--config`: show `pull.rebase` and `skills.commit.*` (local and global), let the user change them, stop.
