---
name: add
description: Stage changes like git add. Default is everything; arguments narrow it to given paths or to a described subset.
disable-model-invocation: true
argument-hint: "[paths or instructions] [--dry-run]"
allowed-tools: Bash(git *)
---

# add

Stage changes. Arguments: `$ARGUMENTS`

## Flags
- `--dry-run`: show what would be staged (`git add -n`), change nothing.

## Procedure
1. `git status --short`. If nothing is changed, say so and stop.
2. Choose the scope:
   - No path arguments: all changes in the working tree (`git add -A`).
   - Paths or globs given: stage only those (`git add -A -- <paths>`). `-A` includes deletions inside those paths.
   - Instructions in words (e.g. "only src, not tests", "the README changes"): resolve them to concrete paths using `git status --short` and `git ls-files`. Show the resolved list before staging. If the instruction is ambiguous, ask.
3. Warn before staging, and exclude by default:
   - secrets: `.env*`, `*.pem`, keys, credentials, tokens;
   - large binaries, build artifacts, dependency folders (`node_modules/`, `dist/`, ...).
   Stage such a file only if the user names it explicitly, and only after confirming.
4. Stage. Git ignores files matched by `.gitignore`; do not force them with `-f`.
5. Show `git status --short` after staging. Mark what is now staged versus unstaged.

## Rules
- Staging does not unstage anything. Files already staged stay staged; mention them in the output.
- Never `git add .` without first showing the list.
- Staging is local and reversible (`git restore --staged`). It does not need the confirmation that commit or push need, unless step 3 applies.
- Never commit from this skill. For committing use `/_commit`.
