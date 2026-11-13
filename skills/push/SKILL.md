---
name: push
description: Commit uncommitted changes if any, then push the current branch safely (fetch first, never force without being told).
disable-model-invocation: true
argument-hint: "[instructions] [--force-with-lease] [--config]"
allowed-tools: Bash(git *)
---

# push

Push the current branch. Arguments: `$ARGUMENTS`

Flags and phrases below are examples, not a closed list: interpret the arguments by intent, in any language. "Force" requests still need the confirmation described below.

## Procedure
1. `git branch --show-current`. Empty (detached HEAD) -> stop with a message.
2. Uncommitted or unstaged changes: commit them first, automatically and without asking, with the commit procedure (default scope = everything, secrets/artifacts excluded; language/style/footer per `skills.commit.*` in git config, defaults: English, Conventional Commits, no footer). If the user's instructions narrow the scope (files, directories, "only staged", "don't commit"), follow them instead.
3. `git fetch`. Check `git rev-list --left-right --count @{u}...HEAD` (if upstream exists).
   - Behind > 0: STOP. Show `git status -sb` and the incoming commits. Do NOT merge or rebase automatically; suggest running the pull skill.
4. Show what will be pushed (`git log --oneline @{u}..HEAD`, or against `origin/HEAD` if no upstream). Nothing to push -> say so and stop. No confirmation, except on `main` or `master`: say so and wait for confirmation before pushing.
5. No upstream (new branch not on origin yet): `git push -u origin <branch>` directly. Do not mention the missing upstream, do not ask. Otherwise `git push`.
6. Force: never unless explicitly requested. If a push is rejected and force seems needed, explain and offer `git push --force-with-lease` only after explicit confirmation. Never plain `--force`. Never force on main/master.
7. Report result and remote URL/branch.
8. `git status --short`: if changes remain uncommitted (only because the user narrowed the scope or they were excluded as secrets/artifacts), list them and say they were NOT pushed.

## Config
`--config`: show `skills.commit.*` and `pull.rebase` (local and global), let the user change them, stop. Never print tokens.
