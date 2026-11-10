---
name: gch
description: Switch git branch by name or fragment; create new branches from the default branch; handle uncommitted changes.
disable-model-invocation: true
argument-hint: "<branch | fragment | -> [-n|--new] [--config]"
allowed-tools: Bash(git *)
---

# gch

Switch branches. Arguments: `$ARGUMENTS`

Always use `git switch`, not `git checkout`.

## Resolving the target
- `-` -> `git switch -` (previous branch).
- `-n` / `--new` / user says "new branch": create it (see below).
- Otherwise search, in order:
  1. exact local branch -> `git switch <name>`
  2. exact remote-only branch (`git branch -r`) -> `git switch <name>` (creates tracking branch)
  3. fragment: `git branch -a --list "*fragment*"` -> if one match, use it; if several, list them and ask; if none, show a short list of recent/all branches as suggestions and ask.
- Run `git fetch` first when remote branches are involved.

## New branch
1. `git fetch`.
2. Default branch from `git symbolic-ref refs/remotes/origin/HEAD` (do not assume `main`).
3. `git switch -c <name> origin/<default>` -- not from an arbitrary HEAD. Ask first if the user clearly wants to branch from the current one.

## Uncommitted changes
1. Just try `git switch`. Git carries changes over when they don't conflict.
2. If it fails due to conflicting changes, offer:
   - stash: `git stash push -u -m "<message>"` (tell the user about `git stash pop`)
   - WIP commit (follow the gcommit procedure; message e.g. `wip: ...`)
   - cancel
3. Discarding changes only on explicit confirmation, naming what is lost.

## Config
`--config`: show `skills.commit.*` (local and global), let the user change them, stop.

After switching, show `git status -sb`.
