---
name: push
description: Push the current branch safely (fetch first, never force without being told). Optionally commit first.
disable-model-invocation: true
argument-hint: "[--commit] [--force-with-lease] [--config]"
allowed-tools: Bash(git *)
---

# push

Push the current branch. Arguments: `$ARGUMENTS`

## Procedure
1. `git branch --show-current`. Empty (detached HEAD) -> stop with a message.
2. If `--commit` given or the user asked: commit uncommitted changes first with the commit procedure (list files, warn on secrets, show message, confirm; language/style/footer per `skills.commit.*` in git config, defaults: English, Conventional Commits, no footer).
3. `git fetch`. Check `git rev-list --left-right --count @{u}...HEAD` (if upstream exists).
   - Behind > 0: STOP. Show `git status -sb` and the incoming commits. Do NOT merge or rebase automatically; suggest running the pull skill.
4. Show what will be pushed (`git log --oneline @{u}..HEAD`, or against `origin/HEAD` if no upstream). Nothing to push -> say so and stop. If current branch is `main` or `master`, say so in the confirmation. Wait for confirmation before pushing.
5. No upstream: `git push -u origin <branch>`. Otherwise `git push`.
6. Force: never unless explicitly requested. If a push is rejected and force seems needed, explain and offer `git push --force-with-lease` only after explicit confirmation. Never plain `--force`. Never force on main/master.
7. Report result and remote URL/branch.
8. `git status --short`: if uncommitted or unstaged changes remain (no `--commit`, or only staged files were committed), say they were NOT pushed and mention `--commit`.

Without `--commit` (or an explicit ask) this skill never commits: it pushes only existing commits.

## Config
`--config`: show `skills.commit.*` and `pull.rebase` (local and global), let the user change them, stop. Never print tokens.
