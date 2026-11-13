---
name: commit
description: Stage and commit current changes with a generated message. Optionally push when asked.
disable-model-invocation: true
argument-hint: "[message] [--lang en|pl] [--style conventional|detected] [--push] [--redetect] [--config]"
allowed-tools: Bash(git *)
---

# commit

Stage and commit current changes. Arguments: `$ARGUMENTS`

## Flags
Flags and phrases below are examples, not a closed list: interpret the arguments by intent, in any language. Words like "and push" / "i wypchnij" mean `--push`.
- `--config`: show `skills.commit.*` (local and global via `git config --local/--global --get`), let the user change them, stop.
- `--redetect`: re-run language/style detection (below) and overwrite the local cache.
- `--push` (or push requested in words): after committing, follow the push procedure (fetch, check behind, push).

## Procedure
No questions by default: the skill adds and commits on its own. Only the exceptions below stop it.

1. `git status --short`. Show the file list. If nothing to commit, say so; with `--push` and unpushed commits (`git rev-list @{u}..HEAD`), continue to the push procedure, otherwise stop.
2. Exclude without asking: secrets (`.env`, `*.pem`, keys, credentials), large binaries, build artifacts. Say in the result that they were left out. Never touch `.env` files.
3. Scope (what goes into the commit):
   - Default (no instructions): everything. Already-staged changes are included; stage the rest with `git add -A`. No question.
   - Instructions in the arguments narrow it, resolved as in `add` (paths, directories, words):
     - only staged changes wanted (e.g. "only staged", "tylko staged"): add nothing, commit what is staged.
     - paths, directories or a description (e.g. "changes from modules/"): stage only those, on top of what is already staged. Other changes stay untouched.
   - If an instruction is ambiguous, ask.
4. Message (see rules). Commit right away, then show the message. Never `--no-verify`, never `--amend` unless asked.
5. On `main` or `master` (shared/protected) show the file list and message first and wait for confirmation.
6. Show `git log -1 --stat`. If changes remain uncommitted (scope was narrowed), list them and say they were left out.

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
