# git-skills

Global git skills for AI agents: **Claude Code**, **Cursor**, **Codex** and **OpenCode**. Skills that change repository state or send data out are run manually with `/_name` (the `_` is the default installer prefix, see [Skill names](#skill-names)).

| Skill       | What it does                                                                                                |
|-------------|-------------------------------------------------------------------------------------------------------------|
| `/_add`     | Stage changes like `git add`: everything by default, or only the paths you give (or describe)               |
| `/_commit`  | `add` + `commit` current changes with a generated message (optionally push)                                 |
| `/_push`    | Safe push of the current branch (fetches first, never force without confirmation)                           |
| `/_pull`    | Pull the current branch (rebase + autostash by default) and list new commits                                |
| `/_branch`  | Switch branch by name or fragment, create new branches from the default branch, handle uncommitted changes  |
| `/_pr`      | Commit and push if needed, then open a PR (GitHub) or MR (GitLab) with a generated description               |

### Skill names

The package ships six skills, named `add`, `commit`, `push`, `pull`, `branch` and `pr`. The installer adds a prefix to each name when it installs it. The default prefix is `_`, so the slash commands are `/_add`, `/_commit`, `/_push`, `/_pull`, `/_branch` and `/_pr`. The `_` comes from `install --prefix`, whose default value is `_` (see [Installer commands and options](#installer-commands-and-options)). Install with another prefix to get other names, for example `--prefix my_` gives `/my_commit`, or `--prefix ""` gives `/commit`.

The tables and headings in this README show the default names with the `_` prefix. The `--skills` option takes the names without a prefix (`--skills commit,pr`).

Supported hosts: **github.com** and **gitlab.com**. Self-hosted instances are not supported.

## Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Installer commands and options](#installer-commands-and-options)
- [Where skills are installed](#where-skills-are-installed)
- [Usage](#usage)
- [Skills](#skills)
  - [/_add](#_add)
  - [/_commit](#_commit)
  - [/_push](#_push)
  - [/_pull](#_pull)
  - [/_branch](#_branch)
  - [/_pr](#_pr)
- [Configuration](#configuration)
- [Pull requests and authentication (/_pr)](#pull-requests-and-authentication-_pr)
- [Safety](#safety)
- [Migration (renamed skills)](#migration-renamed-skills)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [License](#license)

## Requirements

- Node.js `>= 18` (installer only; the installer has no dependencies).
- git.
- For `/_pr` only, one of:
  - `gh` (GitHub) or `glab` (GitLab), installed and logged in;
  - or `GITHUB_TOKEN` / `GITLAB_TOKEN` in the environment;
  - or a browser (the skill falls back to a prefilled link).

## Installation

Install from npm:

```bash
npx git-skills install
```

Directly from GitHub, without npm:

```bash
npx github:nbmh/git-skills install
```

From a local clone (updates with `git pull`):

```bash
git clone https://github.com/nbmh/git-skills.git
cd git-skills
node bin/install.mjs install --mode symlink
```

Run `install` with `--dry-run` first to see the plan without writing anything.

## Installer commands and options

| Command     | Effect                                                                                  |
|-------------|-----------------------------------------------------------------------------------------|
| `install`   | Installs the selected skills into the selected harnesses                                 |
| `update`    | Same as `install`; re-copies skills whose version changed                                |
| `uninstall` | Removes the selected skills, only where they are managed by git-skills                   |
| `list`      | Shows, per harness, the installed skills, their version and directory                   |

| Option                 | Meaning                                                                                  |
|------------------------|------------------------------------------------------------------------------------------|
| `--harness a,b`        | `claude`, `cursor`, `codex`, `opencode`. Default: harnesses detected on this machine      |
| `--skills a,b`         | Skill names without prefix (`commit,pr`). Default: all                                    |
| `--prefix P`           | Prefix for installed skill names. Default `_` (`/_commit`). `--prefix my_` gives `/my_commit`. `--prefix ""` gives no prefix (`/commit`) |
| `--mode copy\|symlink` | `copy` (default) copies files; `symlink` writes the rendered `SKILL.md` and links other files to the package source (use with a clone) |
| `--dry-run`            | Prints `source -> destination` for each action; changes nothing                           |
| `--force`              | Overwrites skill directories not managed by git-skills; the old directory is moved to `*.bak` |
| `-h`, `--help`         | Prints help                                                                              |

Examples:

```bash
npx git-skills install --dry-run
npx git-skills install --harness claude,codex --skills commit,pr
npx git-skills install --prefix my_
npx git-skills update
npx git-skills list
npx git-skills uninstall --harness cursor
```

Notes:

- Each installed skill directory contains a `.git-skills.json` marker (`package`, `version`, `mode`, `installedAt`). The installer only overwrites or removes directories that carry this marker. Your own skills with the same name are left alone unless you pass `--force`.
- Re-installing the same version in `copy` mode does nothing (`= ... up to date`).
- `symlink` mode: `SKILL.md` is written as a rendered copy (its `name` must match the prefix), so edits to the source reach the installed skill only after re-running the installer. After `git pull` in the clone, run `node bin/install.mjs update --mode symlink --force`.
- `uninstall` and `update` use the same `--prefix` as the install. Installed names are `prefix + skill name`; uninstall with a different prefix does not find them.
- If no harness is detected, pass `--harness` explicitly.
- Cursor also reads the Claude Code, Codex and `~/.agents/skills/` directories. If one of those is selected together with Cursor, the installer skips `~/.cursor/skills/` to avoid duplicate skills. Forcing Cursor with `--harness cursor,...` prints a warning instead.

## Where skills are installed

| Harness     | Directory                                              | Environment override                                  |
|-------------|--------------------------------------------------------|-------------------------------------------------------|
| Claude Code | `~/.claude/skills/`                                    | `CLAUDE_CONFIG_DIR` (changes the directory)           |
| Cursor      | `~/.cursor/skills/`                                    | none                                                  |
| Codex       | `~/.agents/skills/`                                    | `CODEX_HOME` is only used for detection (older path `~/.codex/`) |
| OpenCode    | `~/.config/opencode/skills/`                           | `XDG_CONFIG_HOME` (changes the directory)             |

Harness detection: a harness counts as present when its config directory exists (`~/.claude`, `~/.cursor`, `~/.agents` or the older Codex path, `~/.config/opencode`).

## Usage

Skills work from plain language. Describe the task in your agent chat; the agent picks the matching skill, resolves the details and asks when something is unclear:

```
stage the src/ folder and the docs
commit my changes
commit in Polish and push
pull the latest changes, keep my history linear
switch to the login branch, or create one called feature/export from main
open a draft PR against develop
```

You do not need to remember names or flags. The slash form (`/_commit`, with the default `_` prefix) is a shortcut for the same skill, and the flags in [Skills](#skills) are optional refinements, not required syntax.

Every skill shows what it is about to do and waits for confirmation before anything visible to others happens (commit on `main`/`master`, push, creating a PR/MR). Exception: `/_pr` asks one yes/no question when there are uncommitted changes; after yes, it adds, commits, pushes and opens the PR without further questions.

## Skills

| Skill      | Flags                                                                                        | Details                       |
|------------|----------------------------------------------------------------------------------------------|-------------------------------|
| `/_add`     | `[paths or instructions]`, `--dry-run`, `--config`                                           | [/_add](#_add)                |
| `/_commit`  | `[message]`, `--lang en\|pl`, `--style conventional\|detected`, `--push`, `--redetect`, `--config` | [/_commit](#_commit)     |
| `/_push`    | `--commit`, `--force-with-lease` (only after confirmation), `--config`                       | [/_push](#_push)              |
| `/_pull`    | `--ff-only`, `--rebase`, `--config`                                                          | [/_pull](#_pull)              |
| `/_branch`  | `<branch \| fragment \| ->`, `-n` / `--new`, `--config`                                      | [/_branch](#_branch)          |
| `/_pr`      | `--base <branch>`, `--draft`, `--lang en\|pl`, `--redetect`, `--config`                      | [/_pr](#_pr)                  |

Each skill is described below by what you ask for. The flags are optional refinements; you do not need them for normal use.

Notes that apply to several skills:

- `--lang` and `--style` apply to one invocation and are not saved.
- `--redetect` re-detects language and style from repository history and overwrites the local cache (see [Configuration](#configuration)).
- `--config` shows the current settings and lets you change them, then stops without doing the git operation.

### /_add

Stages changes, like `git add`. It never commits.

**Usage**

```
stage everything
stage only src/ and docs/
stage everything except the tests (you see the list first)
show what would be staged, without staging it
```

Shortcuts: `/_add`, `/_add src/ docs/`, `/_add --dry-run`, `/_add --config`.

**Flags and arguments**

| Argument or flag | Staging |
|------------------|---------|
| none | everything in the working tree (`git add -A`) |
| paths or globs (`src/ docs/*.md`) | only those paths (`git add -A -- <paths>`); `-A` includes deletions inside them |
| words (`all except tests`, `only the README changes`) | the skill resolves the words to concrete paths from `git status` and `git ls-files`, shows the list, then stages it |
| `--dry-run` | prints what would be staged (`git add -n`); changes nothing |
| `--config` | Show and change `skills.commit.*`, then stop |

Words are interpreted by the agent, so the resolved list is always shown first. If an instruction is ambiguous, the skill asks.

**Procedure**

1. `git status --short`. If nothing changed, it stops.
2. Resolve the scope (table above). Show the list when it is not "everything".
3. Warn and exclude by default: secrets (`.env*`, `*.pem`, keys, credentials, tokens), large binaries, build artifacts and dependency folders (`node_modules/`, `dist/`, ...). Such a file is staged only if you name it and confirm.
4. Stage. Git's `.gitignore` rules still apply; ignored files are not forced with `-f`.
5. Show `git status --short` again.

**Rules**

- Already staged files stay staged. `/_add` never unstages anything, and the output mentions them.
- It never runs `git add .` without first showing the list.
- It never commits. Use `/_commit` for that.
- Staging is local and reversible (`git restore --staged <path>`), so it needs no confirmation, except in step 3.

### /_commit

Stages and commits current changes with a generated message. Pushes too with `--push`.

**Usage**

```
commit my changes
commit with the message "fix login redirect" (used as-is)
commit in Polish and push
commit with a Conventional Commits message this time
```

Shortcuts: `/_commit`, `/_commit "fix login redirect"`, `/_commit --push`, `/_commit --lang pl --style detected`, `/_commit --config`.

**Flags**

| Flag | Effect |
|------|--------|
| `[message]` | Use this text verbatim as the commit message (no translation) |
| `--lang en\|pl` | Message language for this call |
| `--style conventional\|detected` | Message style for this call |
| `--push` | After committing, run the `/_push` procedure |
| `--redetect` | Re-detect language and style and overwrite the local cache |
| `--config` | Show and change `skills.commit.*`, then stop |

**Procedure**

1. `git status --short`. Show the file list. If nothing to commit, stop.
2. Warn before adding: secrets (`.env`, `*.pem`, keys, credentials), large binaries, build artifacts. Propose excluding them.
3. Staging: already staged changes are respected. If some are staged, only those are committed unless you say otherwise. Otherwise, after confirmation, `git add -A` (or the chosen files). Never touches `.env` files.
4. Generate the message (language and style rules in [Configuration](#configuration)), show it, commit after confirmation.
5. On `main` or `master`, the confirmation says so.
6. Show `git log -1 --stat`.

**Rules**

- Never `--no-verify`. Never `--amend` unless you ask.
- The `Co-Authored-By` footer follows [Co-Authored-By](#co-authored-by).

**Config:** `--config`, `--redetect`; see [Configuration](#configuration).

### /_push

Pushes the current branch. Fetches first and stops if the branch is behind.

**Usage**

```
push this branch
commit what I have and push it
push, but only after you have checked the remote is up to date
```

Shortcuts: `/_push`, `/_push --commit`, `/_push --force-with-lease`, `/_push --config`.

**Flags**

| Flag | Effect |
|------|--------|
| `--commit` | Commit uncommitted changes first (commit procedure) |
| `--force-with-lease` | Force push with lease, only after explicit confirmation |
| `--config` | Show and change `skills.commit.*` and `pull.rebase`, then stop |

**Procedure**

1. `git branch --show-current`. Empty (detached HEAD) stops with a message.
2. With `--commit`, or if you ask, commit first (commit procedure).
3. `git fetch`, then check the branch against its upstream. If it is behind, the skill stops, shows `git status -sb` and the incoming commits, and does not merge or rebase. Run `/_pull` first.
4. No upstream: `git push -u origin <branch>`. Otherwise `git push`.
5. On `main` or `master`, confirmation is required before pushing.
6. Show what will be pushed and wait for confirmation.
7. Report the result, the remote URL and the branch.

**Rules**

- Never plain `--force`. `--force-with-lease` only after confirmation, never on `main`/`master`.

### /_pull

Pulls the current branch and lists new commits.

**Usage**

```
pull the latest changes
pull, but only if it is a fast-forward
pull and rebase my local commits on top
```

Shortcuts: `/_pull`, `/_pull --ff-only`, `/_pull --rebase`, `/_pull --config`.

**Flags**

| Flag | Effect |
|------|--------|
| `--ff-only` | Fast-forward only |
| `--rebase` | Rebase (with autostash) |
| `--config` | Show and change `pull.rebase` and `skills.commit.*`, then stop |

**Mode** (first match wins): flag; `git config --local pull.rebase`, then `--global` (`true` rebases, `false` merges); default `git pull --rebase --autostash`.

**Procedure**

1. `git branch --show-current`. Empty (detached HEAD) stops with a message.
2. No upstream configured: the skill says so, offers `git branch --set-upstream-to=origin/<branch>`, and stops.
3. Record `git rev-parse HEAD`, then pull in the chosen mode.
4. Conflict: the skill stops and shows `git status`. It does not resolve conflicts. It offers `git rebase --abort` (or `git merge --abort`).
5. `--ff-only` fails: the skill explains that the branches diverged and suggests a rebase. It does not retry automatically.
6. Success: show new commits (`git log --oneline ORIG_HEAD..HEAD`), or "already up to date".

**Config:** `--config`; see [Configuration](#configuration).

### /_branch

Switches branches by name or fragment, and creates new ones from the default branch.

**Usage**

```
switch to the login branch
switch to whatever branch has "login" in its name
go back to the previous branch
create a new branch called feature/export from main
```

Shortcuts: `/_branch feature/login`, `/_branch login`, `/_branch -`, `/_branch -n new-branch-name`, `/_branch --config`.

**Flags**

| Argument or flag | Effect |
|------------------|--------|
| `<branch \| fragment \| ->` | Target branch, part of its name, or `-` for the previous branch (`git switch -`) |
| `-n` / `--new` | Create a new branch from the default branch |
| `--config` | Show and change `skills.commit.*`, then stop |

**Procedure**

1. Resolve the target, in order: exact local branch; exact remote-only branch (`git branch -r`, creates a tracking branch); fragment (`git branch -a --list "*fragment*"`). One match is used. Several matches or none: the skill lists them or suggests recent branches, then asks. It runs `git fetch` first when remote branches are involved.
2. New branch: `git fetch`, read the default branch from `git symbolic-ref refs/remotes/origin/HEAD` (not assumed to be `main`), then `git switch -c <name> origin/<default>`. The skill asks first if you want to branch from the current HEAD.
3. Uncommitted changes: it tries `git switch` first, because git carries changes over when they do not conflict. If they conflict, it offers: stash (`git stash push -u -m "<message>"`, restore with `git stash pop`), a WIP commit (`wip: ...`), or cancel.
4. After switching, show `git status -sb`.

**Rules**

- Always `git switch`, never `git checkout`.
- Changes are discarded only after explicit confirmation that names what is lost.

**Config:** `--config`; see [Configuration](#configuration).

### /_pr

Commits and pushes if needed, then creates the PR (GitHub) or MR (GitLab).

**Usage**

```
open a PR for this branch
open a draft PR against develop
open the PR with the description in Polish
```

Shortcuts: `/_pr`, `/_pr --base develop --draft`, `/_pr --lang pl`, `/_pr --config`.

**Flags**

| Flag | Effect |
|------|--------|
| `--base <branch>` | Target branch. Default: the remote's default branch (`refs/remotes/origin/HEAD`), not a hardcoded `main` |
| `--draft` | Create as draft |
| `--lang en\|pl` | Language of the title and description for this call |
| `--redetect` | Re-detect language and style and overwrite the local cache |
| `--config` | Show and change `skills.commit.*` and `pull.rebase`, then stop |

**Procedure**

1. Host and base: `git remote get-url origin`. `github.com` means a PR, `gitlab.com` means an MR; any other host stops the skill. If the current branch is the base, it stops.
2. Prepare the branch. If there are uncommitted changes, the skill asks once, listing the files: "Add, commit, push and open the PR?". Yes: it stages all changes (excluding secrets and artifacts), commits, and pushes, with no further questions. No: it stops. Push also runs if there is no upstream or there are unpushed commits (no force). If a PR/MR for the branch already exists, the skill returns its link and stops.
3. Title and description are generated from `git log <base>..HEAD` and `git diff <base>...HEAD --stat`. The PR is created directly; the title and link are shown in the result.
4. Create through the fallback chain in [Pull requests and authentication](#pull-requests-and-authentication-_pr). The skill announces which path it uses.
5. Return the PR/MR link.

**Rules**

- Never creates a second PR/MR for a branch.
- Never prints or stores tokens.

**Config:** `--config`, `--redetect`; see [Configuration](#configuration).

## Configuration

### Settings reference

| Key                      | Values                   | Local (`git config --local`) | Global (`git config --global`) | Used by                           |
|--------------------------|--------------------------|------------------------------|--------------------------------|-----------------------------------|
| `skills.commit.language` | `en`, `pl`               | read; written by detection   | read as fallback               | `/_commit`, `/_pr`                |
| `skills.commit.style`    | `conventional`, `detected` | read; written by detection | read as fallback               | `/_commit`, `/_pr`, `/_push` (commit) |
| `skills.commit.coauthor` | `true`, `false`          | read; written after your answer | read as default; written on first use if no global value exists | `/_commit`, `/_pr`, `/_push` (commit) |
| `pull.rebase`           | `true`, `false`          | read; changed only by you (`git config` or `--config`) | read as fallback | `/_pull` (native Git key)          |

Settings are read in this order; the first one found wins:

1. Argument in the call (`--lang pl`, `--ff-only`, ...).
2. `git config --local`.
3. `git config --global`.
4. Detection from repository history (language and style only).
5. Defaults: English, Conventional Commits, `pull --rebase`, no `Co-Authored-By`.

For `pull.rebase` there is no detection step: argument, then local, then global, then the default (rebase with autostash).

### Language and style detection

- Language: the last 20 commit subjects are checked (`git log -20 --format=%s`). If a clear majority is Polish, the value is `pl`; otherwise `en`.
- Style: if most recent commits start with a Conventional Commits prefix (`type:` or `type(scope):`), the style is `conventional`. If the repository has another clear convention, the skill follows it. Otherwise `detected` means a short imperative sentence.
- A detection result is saved to `git config --local` **only if it is unambiguous**. Ambiguous history saves nothing and uses the defaults.
- `--redetect` ignores the cache, detects again and overwrites the local value.

### Co-Authored-By

On first use of a skill in a repository without a local `skills.commit.coauthor` value, the skill asks once whether to add the footer. It suggests the global value if one exists. Your answer is saved locally. If no global value exists yet, the same answer is also saved globally, so that other repositories use it by default.

The footer contains the model name and session link from the current session. It is never copied from stored text.

### Changing and resetting settings

Show current values (local and global) with `--config`, or directly:

```bash
git config --get skills.commit.language
git config --global --get skills.commit.language
```

Set values:

```bash
# this repository
git config --local skills.commit.language pl
git config --local skills.commit.style conventional
git config --local skills.commit.coauthor false

# all repositories (default for everything not set locally)
git config --global skills.commit.language en
git config --global pull.rebase true
```

Remove a value and fall back to the next level:

```bash
git config --local --unset skills.commit.language
git config --global --unset pull.rebase
```

Force re-detection for the current repository: `/_commit --redetect` (or `/_pr --redetect`).

## Pull requests and authentication (/_pr)

`/_pr` creates the PR/MR through a chain of fallbacks and tells you which one was used:

1. **CLI** (preferred): `gh` for GitHub, `glab` for GitLab. Used if installed and logged in (`gh auth status`, `glab auth status`).
2. **REST API** with a token from the environment: `GITHUB_TOKEN` or `GITLAB_TOKEN`. Used only if the variable is set.
3. **Prefilled link** to open in the browser. Needs nothing beyond access to the repository in the browser.

A missing `gh` or `glab` is not an error; the skill moves to the next step.

If a step fails, the skill goes to the next one and tells you why, for example:

```
gh not installed; trying REST API (GITHUB_TOKEN not set); using prefilled browser link
```

Before creating anything, `/_pr` checks whether a PR/MR for the branch already exists. If it does, the skill returns its link and stops; it does not create a second one.

Tokens are optional. The skills never set, store or print them; they are passed to `curl` through an environment header. Do not paste tokens into the repository, a `.env` file or shell history.

| Platform | Variable       | Minimum permission                            |
|----------|----------------|-----------------------------------------------|
| GitHub   | `GITHUB_TOKEN` | fine-grained token with `pull_requests: write` |
| GitLab   | `GITLAB_TOKEN` | `api` scope                                   |

## Safety

- All skills have `disable-model-invocation: true`: only you start them.
- `allowed-tools` is limited to `git`, `gh`, `glab` and `curl`.
- Skills never run `--force` or `--no-verify`, never `--amend` unless asked, never resolve conflicts on their own, and never discard changes without explicit confirmation.
- Files that look sensitive (`.env`, `*.pem`, keys, credentials) and large binaries or build artifacts trigger a warning before they are staged.
- `/_push` stops if the branch is behind its remote. It does not merge or rebase automatically; run `/_pull` first.
- Pushing to `main` or `master` requires confirmation.
- Conflicts are never resolved by the skills; `/_pull` stops and shows the state.

## Migration (renamed skills)

Skills were renamed in 0.2.0. Old names are no longer installed:

| Old (0.1.x)  | New (default prefix) |
|--------------|----------------------|
| `/gch`       | `/_branch`           |
| `/gcommit`   | `/_commit`           |
| `/gpr`       | `/_pr`               |
| `/gpull`     | `/_pull`             |
| `/gpush`     | `/_push`             |

The installer does not delete old skills. It prints a `!` warning for each old skill it finds. Remove them yourself:

```bash
rm -rf ~/.claude/skills/gch ~/.claude/skills/gcommit ~/.claude/skills/gpr ~/.claude/skills/gpull ~/.claude/skills/gpush
```

Adjust the path for other harnesses (`~/.cursor/skills/`, `~/.agents/skills/`, `~/.config/opencode/skills/`), or run `node bin/install.mjs list` to see where they are. Then run `install` to add the new names.

To choose another name prefix, install with `--prefix`, for example `install --prefix my_` (`/my_commit`) or `install --prefix ""` (`/commit`).

## Troubleshooting

| Symptom                                                          | Cause and fix                                                                                       |
|------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| `no harness detected`                                            | None of the harness config directories exists. Pass `--harness claude,cursor,codex,opencode`.       |
| `exists and is not managed by git-skills; skipped`               | A skill with that name already exists and was not installed by git-skills. Rename or remove it, or use `--force` (keeps a `*.bak` copy). |
| Skill missing after install                                      | Check `npx git-skills list`. If it is listed, restart the agent so it reloads skills (not verified for every harness). |
| Duplicate skills in Cursor                                       | Cursor also reads other harnesses' directories. Install to one harness only, or use `--harness cursor` deliberately. |
| `/_push` refuses: branch is behind                               | Run `/_pull`, then `/_push` again.                                                                  |
| `/_pull` stops with conflicts                                    | Resolve the conflicts yourself, then `git rebase --continue` / `git merge --continue`, or abort with `git rebase --abort` / `git merge --abort`. |
| `/_pr` says it used the browser link                             | `gh`/`glab` are missing or not logged in, and no token is set. Install and log in, or set a token.   |
| `/_pr` refuses an unsupported host                               | Only `github.com` and `gitlab.com` are supported.                                                   |

## Development

The source of truth for skills is `skills/<name>/SKILL.md`. Design decisions and the decision log are in [DESIGN.md](DESIGN.md).

```
package.json            # metadata, bin, files, engines
bin/install.mjs         # installer, no dependencies
skills/<name>/SKILL.md  # skills
DESIGN.md               # design notes and decision log
README.md               # this file
LICENSE                 # MIT
```

To test installer changes without touching your real config, use `--dry-run`, or point `CLAUDE_CONFIG_DIR` / `XDG_CONFIG_HOME` at a temporary directory and set `HOME` accordingly.

## License

[MIT](LICENSE)
