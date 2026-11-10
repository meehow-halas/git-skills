# Global git skills — design documentation

This document describes design decisions. It is not part of the skills and is not read by them at runtime. It exists to extend the set in future sessions. Every `SKILL.md` must work on its own.

## 1. Scope

Skills (global; target directories per harness in section 12; for Claude Code `~/.claude/skills/<name>/SKILL.md`):

| Skill    | Purpose                                                                                       |
|----------|-----------------------------------------------------------------------------------------------|
| gcommit  | add + commit current changes (optionally push, when asked)                                    |
| gpush    | push the current branch, optionally running gcommit first                                     |
| gpull    | pull the current branch                                                                       |
| gch      | switch branch, with suggestions when nothing matches and handling of uncommitted changes      |
| gpr      | gcommit (if needed), gpush (if needed), create a PR (GitHub) or MR (GitLab)                   |

Supported hosts: **github.com** and **gitlab.com**. Self-hosted is not supported.

### General rules for all skills

- `disable-model-invocation: true`. Skills that change repository state or send data outside are started only by the user (`/name`).
- `allowed-tools` limited to the commands needed (e.g. `Bash(git *)`, `Bash(gh *)`, `Bash(glab *)`).
- Separate skills with short, clear purposes. Shared logic is a reference to another skill (e.g. gpr invokes the gcommit and gpush procedures), not a copy.
- Any skill that sends something visible to others (a commit on a shared branch, a push, a PR/MR) shows the result and waits for confirmation.
- Called with `--config`, a skill shows the current settings and allows changing them.
- Called with `--redetect`, a skill detects repository data again (language, style) and overwrites the cache.

## 2. Configuration

### Repository settings (local, `.git/config`, `git config --local`)

| Key                        | Values                     | Meaning                                                        |
|----------------------------|----------------------------|----------------------------------------------------------------|
| `skills.commit.language`   | `en`, `pl`                 | language of commits and PR/MR descriptions                     |
| `skills.commit.style`      | `detected`, `conventional` | commit style                                                   |
| `skills.commit.coauthor`   | `true`, `false`            | add the Co-Authored-By footer (local override)                 |
| `pull.rebase`              | `true`, `false`            | pull behaviour; native Git key, see below                      |

Values are written to the cache only when the detection result is certain. With ambiguous history nothing is saved and defaults are used.

### Global settings (`git config --global`)

| Key                        | Meaning                                                        |
|----------------------------|----------------------------------------------------------------|
| `skills.commit.coauthor`   | default value for repositories without a local value           |
| `pull.rebase`              | default `git pull` behaviour in every repository               |

### Order of precedence

1. Content or an explicit parameter in the call (e.g. `--ff-only`, `--lang pl`).
2. Local setting (`git config --local`).
3. Global setting (`git config --global`).
4. Detection from the repository (commit history), for language and style only.
5. Default value: English, Conventional Commits, `pull --rebase`, no Co-Authored-By.

Example for `pull.rebase`: the flag in the call, then the local key, then the global one, and finally `--rebase`.

### Co-Authored-By question

On first use of any skill in a repository without a local value, the skill asks whether to add the footer. It suggests the global value if one exists. The answer is saved locally. If there is no global value, the first answer is also saved globally as the default.

The footer contains the model name and session link from the current context, not from a stored value.

### Shared flags

- `--redetect` — detect language and style again from repository history; overwrites the cache.
- `--config` — shows the settings (local and global) and allows changing them.

## 3. Commit language and style

### Language (order)

1. Text given explicitly in the message — used exactly as written, without translation.
2. Language given in the call (e.g. "in Polish").
3. Cache `skills.commit.language`.
4. Detection from the last ~20 commits (`git log -20 --format=%s`). If a clear majority is in Polish, the choice is `pl`; otherwise `en`.
5. Default `en`.

### Style (order)

1. Value given in the call.
2. Cache `skills.commit.style`.
3. Detection: if most recent commits have a `type:` or `type(scope):` prefix matching Conventional Commits, the style is `conventional`. If the repository has another clear convention, the skill imitates it. Otherwise `detected` means a short sentence in the imperative mood.
4. Default: Conventional Commits.

## 4. gcommit

- Instead of `git add .`, first `git status --short` and show the list of files.
- Adding: after confirmation, `git add -A` or selected files. Already staged changes are respected.
- Warning for sensitive files (`.env`, `*.pem`, keys, credentials) and for large binaries or build artifacts.
- Message following the order in section 3. Shown before committing.
- Co-Authored-By footer per section 2.

## 5. gpush

- First `git fetch`, then check whether the branch is behind its remote. If it is, stop and show the state. No automatic merge or rebase.
- No upstream: `git push -u origin <branch>`.
- Force never without an explicit request. If needed, `--force-with-lease` after confirmation.
- Optional block on direct pushes to `main` or `master`.
- On the user's request, run the gcommit procedure before pushing.

## 6. gpull

- Default `git pull --rebase --autostash` (or the behaviour from `pull.rebase`, if set locally or globally).
- Override in the call: `--ff-only` or `--rebase`.
- Conflict: stop and show the state. The skill does not resolve conflicts itself; it may suggest `git rebase --abort`.
- Detached HEAD: stop with a message.
- After pulling, show new commits: `git log --oneline ORIG_HEAD..HEAD`.

## 7. gch

- Switching with `git switch`, not `git checkout`. New branch: `git switch -c <name>`. Return: `git switch -`.
- Search: first an exact match, then `git branch -a --list "*fragment*"`, then a list of suggestions. A remote-only branch is switched to as a tracking branch.
- Uncommitted changes: first try `git switch`, since Git carries changes over when they do not conflict. On conflict, offer: stash (`git stash push -u -m "..."`), a WIP commit, or cancel. Discarding changes only after explicit confirmation.
- New branch: `git fetch`, then `git switch -c <name> origin/<default>`, not from an arbitrary HEAD.

## 8. gpr

### Host and tool detection

1. `git remote get-url origin` and determine the host.
2. `github.com` → GitHub (PR). `gitlab.com` → GitLab (MR). Other hosts are not supported; the skill reports this.
3. Target branch from `git symbolic-ref refs/remotes/origin/HEAD`, without assuming `main`.

### Fallback chain

1. **CLI.** `gh` for GitHub, `glab` for GitLab. Used when installed and logged in (`gh auth status`, `glab auth status`).
2. **REST API with a token** from an environment variable (`GITHUB_TOKEN`, `GITLAB_TOKEN`). The token never goes into the repository or into the skill. Endpoints: GitHub `POST /repos/{owner}/{repo}/pulls`, GitLab `POST /projects/:id/merge_requests`.
3. **Prefilled link** in the browser. GitHub: `https://github.com/{owner}/{repo}/compare/{base}...{branch}?expand=1&title=...&body=...`. GitLab: `https://gitlab.com/{path}/-/merge_requests/new?merge_request[source_branch]={branch}`.

Each step of the chain that fails passes control to the next and tells the user which path was chosen.

### Flow

1. Repository state. If there are uncommitted changes, run the gcommit procedure.
2. If the branch has no upstream or has unpushed commits, run the gpush procedure.
3. Check whether a PR/MR already exists. If so, return its link.
4. Generate title and description from commits and the diff, show them, and wait for confirmation.
5. Create the PR/MR with explicit parameters (no interactive prompts).
6. Return the link.

## 9. Decision log

- **2026-11-10** — Language: explicit text, then call argument, then repository detection, then English.
- **2026-11-10** — Style: repository detection, then Conventional Commits.
- **2026-11-10** — Cache in `.git/config` (`git config --local`). Saved only on a certain result. `--redetect` forces a refresh.
- **2026-11-10** — Co-Authored-By: asked on first use in a repository; the local value overrides the global one; `--config` changes both.
- **2026-11-10** — `--config` changes settings; `--redetect` refreshes only repository-derived data.
- **2026-11-10** — gpull: `pull --rebase --autostash` as default, overridable by a flag. Configured through the native `pull.rebase` key.
- **2026-11-10** — gpr: CLI chain, REST with token, prefilled link.
- **2026-11-10** — Supported hosts: github.com and gitlab.com. Self-hosted rejected.
- **2026-11-10** — Separate skills instead of one `/git` skill.
- **2026-11-10** — gch: no separate block on uncommitted changes. First `git switch`; on conflict, ask (stash, WIP commit, cancel).
- **2026-11-10** — Presence of `gh`/`glab` is the user's responsibility. The skill detects it and falls back (REST, then link); a missing CLI is not an error.
- **2026-11-10** — Tokens (`GITHUB_TOKEN`, `GITLAB_TOKEN`) are optional and used only when set. The skill does not set, store or display them. Minimum permissions: GitHub `pull_requests: write` (fine-grained), GitLab scope `api`.
- **2026-11-10** — Configuration requirements and the full description of capabilities go into the user-facing README.md, created once the skill set is considered ready. Until then this document is the source.
- **2026-11-10** — Distribution: npm or git, one installer (`bin/install.mjs`, zero dependencies). Target: global directories of Claude Code, Cursor, Codex, OpenCode (section 12). One source of skills in `skills/`.
- **2026-11-10** — Explicit installation (a command), with no writes outside the package during `postinstall` — skills change repository state and send data, so the user adds them deliberately. Directory ownership via `.git-skills.json`; foreign skills are not overwritten without `--force`.
- **2026-11-10** — Codex: `~/.agents/skills/` as the target directory (official documentation); `~/.codex/skills/` only for older versions. Cursor reads other harnesses' directories, so duplicates are avoided.
- **2026-11-10** — User-facing README.md created in English, covering installation, the installer commands, configuration precedence and local/global keys, troubleshooting. `package.json` metadata completed (description, keywords, repository, license). DESIGN.md translated to English; project language is English.

## 10. Open points

- Verify the global paths of each harness (section 12) against installed versions before the first release. Sources: official Cursor and Codex documentation; for OpenCode, third-party sources.
- Behaviour of Claude Code–specific frontmatter fields (`disable-model-invocation`, `allowed-tools`) in other harnesses. Assumed that unknown fields are ignored (unverified). If a harness rejects them, the installer generates simplified frontmatter.

## 11. Extending

- **New host:** add an entry in section 8 (detection) and in the fallback chain, and update the decision log.
- **New configuration key:** add it to section 2 with its precedence rule and default value, and log it.
- **New skill:** describe it in section 1, apply the general rules from section 1, and the configuration from section 2.
- **README.md:** keep the user-facing README in sync with skill behaviour, flags, configuration keys and installer options.
- **Changing a rule:** do not edit it silently. Add a new decision-log entry with the date and reason.

## 12. Distribution and installation

### Goal

Install skills on the user's machine into the global directories of supported harnesses: **Claude Code, Cursor Agent, Codex, OpenCode**. Sources: **npm** (package published to the registry) or **git** (a clone, or `npx github:<owner>/<repo>`). Both use the same installer.

### Target directories (skill = directory `<name>/SKILL.md`)

| Harness     | Global directory                                        | Environment override                          |
|-------------|---------------------------------------------------------|-----------------------------------------------|
| Claude Code | `~/.claude/skills/`                                     | `CLAUDE_CONFIG_DIR`                           |
| Cursor      | `~/.cursor/skills/`                                     | none                                          |
| Codex       | `~/.agents/skills/` (older versions: `~/.codex/skills/`) | `CODEX_HOME` for the older path               |
| OpenCode    | `~/.config/opencode/skills/`                            | `XDG_CONFIG_HOME`                             |

Note: Cursor also reads `~/.claude/skills/`, `~/.codex/skills/` and `~/.agents/skills/`. Installing to several directories can produce duplicate skills in Cursor. The installer warns about this and by default does not install to `~/.cursor/skills/` when the skill is already visible through another selected directory (see the log).

### Repository/package layout

```
package.json            # name, version, bin, files, engines (node >= 18)
bin/install.mjs         # installer (zero dependencies, only built-in Node modules)
skills/<name>/SKILL.md  # the only source of truth for skills
DESIGN.md, README.md
```

`package.json`: `"bin": {"git-skills": "bin/install.mjs"}`, `"files": ["bin", "skills", "README.md", "DESIGN.md", "LICENSE"]`, and **no** `postinstall` script that writes outside the package (see the log). Installation is explicit.

### Installer (`git-skills`)

Invocations:

- `npx git-skills install` (npm), `npx github:<owner>/<repo> install` (git, no publication), `node bin/install.mjs install` (local clone).
- Options: `--harness claude,cursor,codex,opencode` (default: detected), `--skills gcommit,gpr` (default: all), `--mode copy|symlink` (default `copy`; `symlink` for a git clone, updated with `git pull`), `--dry-run`, `--force`.
- Subcommands: `install`, `update`, `uninstall`, `list` (what is installed where, and the version).

Rules:

- Harness detection: a harness config directory exists (`~/.claude`, `~/.cursor`, `~/.codex` or `~/.agents`, `~/.config/opencode`). Not detecting a harness is not an error; the user passes `--harness`.
- Ownership marker: each installed directory contains `.git-skills.json` (`{package, version, installedAt}`). The installer overwrites and removes only directories with its own marker. A directory without a marker (a user skill with the same name) requires `--force`, and is first moved to a `*.bak` copy.
- Idempotence: reinstalling the same version changes nothing.
- `--dry-run` prints the plan (source → destination) and writes nothing.
- No network access and no dependencies at install time. The installer downloads nothing beyond the package or clone itself.
- Skills are not modified per harness, unless the open point about frontmatter requires it.

### Versioning and releases

- SemVer in `package.json`. Git tag `vX.Y.Z` = release. The version in `.git-skills.json` lets `update`/`list` detect a mismatch.
- Installing from git without a tag = HEAD of the default branch (the "edge" channel).
