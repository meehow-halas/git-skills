---
name: branch
description: Switch git branch by name or fragment; create new branches from the current branch (or a base the user names); handle uncommitted changes.
disable-model-invocation: true
argument-hint: "<branch | fragment | -> [-n|--new] [--config]"
allowed-tools: Bash(git *)
---

# branch

Switch branches. Arguments: `$ARGUMENTS`

Always use `git switch`, not `git checkout`.

## Resolving the target
- `-` -> `git switch -` (previous branch).
- Create a new branch (see below) when `-n` / `--new` is given, or when the intent is clear from the wording in any language (e.g. "new branch", "nowy branch", "odbij", "branch off", "create"). Judge by intent, not a keyword list. If unsure whether the user means switching or creating, ask.
- Otherwise search, in order:
  1. exact local branch -> `git switch <name>`
  2. exact remote-only branch (`git branch -r`) -> `git switch <name>` (creates tracking branch)
  3. fragment: `git branch -a --list "*fragment*"` -> if one match, use it; if several, list them and ask; if none, show a short list of recent/all branches as suggestions and ask.
- Run `git fetch` first when remote branches are involved.

## New branch
Base = current branch (HEAD), unless the user named another base by any wording (e.g. "from main", "od develop", "odbij od X").
New branch name missing -> ask for it.
1. User named a base -> `git fetch`, `git switch -c <name> <base>` (prefer `origin/<base>` when the remote exists).
2. Otherwise -> `git switch -c <name>` (from current HEAD).
3. Say which base was used.

## Uncommitted changes
1. Just try `git switch`. Git carries changes over when they don't conflict.
2. If it fails due to conflicting changes, offer:
   - stash: `git stash push -u -m "<message>"` (tell the user about `git stash pop`)
   - WIP commit (follow the commit procedure; message e.g. `wip: ...`)
   - cancel
3. Discarding changes only on explicit confirmation, naming what is lost.

## Config
`--config`: show `skills.commit.*` (local and global), let the user change them, stop.

After switching, show `git status -sb`.
