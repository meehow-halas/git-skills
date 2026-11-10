---
name: gcommit
description: Stage and commit current changes with a generated message. Optionally push when asked.
disable-model-invocation: true
argument-hint: "[message] [--lang en|pl] [--style conventional|detected] [--push] [--redetect] [--config]"
allowed-tools: Bash(git *)
---

# gcommit

Stage and commit current changes. Arguments: `$ARGUMENTS`

## Flags
- `--config`: show `skills.commit.*` (local and global via `git config --local/--global --get`), let the user change them, stop.
- `--redetect`: re-run language/style detection (below) and overwrite the local cache.
- `--push`: after committing, follow the gpush procedure (fetch, check behind, push).

## Procedure
1. `git status --short`. Show the file list. If nothing to commit, say so and stop.
2. Warn before adding: secrets (`.env`, `*.pem`, keys, credentials), large binaries, build artifacts. Propose excluding them.
3. Staging: respect already-staged changes. If some are staged, commit only those unless the user says otherwise. Otherwise, after the user confirms, `git add -A` (or the chosen files). Never touch `.env` files.
4. Message (see rules). Show it. Commit after confirmation. Never `--no-verify`, never `--amend` unless asked.
5. On a shared/protected branch (`main`, `master`) mention it in the confirmation.
6. Show `git log -1 --stat`.

## Message language (first match wins)
1. Text given verbatim in arguments: use exactly, no translation.
2. Language in arguments (`--lang pl`, "po polsku").
3. `git config --local skills.commit.language`, then `--global`.
4. Detect from `git log -20 --format=%s`: clear majority Polish -> `pl`, else `en`.
5. `en`.

## Message style (first match wins)
1. Style in arguments.
2. `git config skills.commit.style` (`conventional` | `detected`).
3. Detect from the last ~20 commits: majority use `type:` / `type(scope):` -> `conventional`. Another clear convention -> imitate it. Otherwise short imperative sentence.
4. Conventional Commits.

Cache detected language/style with `git config --local` ONLY if detection was clear. If ambiguous, save nothing, use defaults.

## Co-Authored-By footer
- Value: `git config --local skills.commit.coauthor`, else `--global`.
- If no local value: ask once whether to append the footer. Suggest the global value if it exists. Save the answer locally; if no global value exists, also save it globally.
- When `true`: append the footer in the format given in your current context (model name and session link). Do not use stored text, never invent one. If no such footer is available in context, skip it and say so.
