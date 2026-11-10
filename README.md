# git-skills

Global git skills for AI agents: **Claude Code**, **Cursor**, **Codex** and **OpenCode**. Skills that change repository state or send data out are run manually with `/_name` (the `_` is the default installer prefix, see [Skill names](#skill-names)).

| Skill      | What it does                                                                                              |
|------------|-----------------------------------------------------------------------------------------------------------|
| `/_add`     | Stage changes like `git add`: everything by default, or only the paths you give (or describe)               |
| `/_commit`  | `add` + `commit` current changes with a generated message (optionally push)                               |
| `/_push`    | Safe push of the current branch (fetches first, never force without confirmation)                         |
| `/_pull`    | Pull the current branch (rebase + autostash by default) and list new commits                              |
| `/_branch`      | Switch branch by name or fragment, create new branches from the default branch, handle uncommitted changes |
| `/_pr`      | Commit and push if needed, then open a PR (GitHub) or MR (GitLab) with a generated description           |

### Skill names

The package ships six skills, named `add`, `commit`, `push`, `pull`, `branch` and `pr`. The installer adds a prefix to each name when it installs it. The default prefix is `_`, so the slash commands are `/_add`, `/_commit`, `/_push`, `/_pull`, `/_branch` and `/_pr`. The `_` comes from `install --prefix`, whose default value is `_` (see [Installer commands and options](#installer-commands-and-options)). Install with another prefix to get other names, for example `--prefix my_` gives `/my_commit`, or `--prefix ""` gives `/commit`.

The tables in this README show the default names with the `_` prefix. The `--skills` option takes the names without a prefix (`--skills commit,pr`).

Supported hosts: **github.com** and **gitlab.com**. Self-hosted instances are not supported.

## Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Installer commands and options](#installer-commands-and-options)
- [Where skills are installed](#where-skills-are-installed)
- [Usage](#usage)
- [Skill flags](#skill-flags)
- [Skill: add](#skill-add)
- [Configuration](#configuration)
- [Pull requests and authentication (pr)](#pull-requests-and-authentication-pr)
- [Safety](#safety)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [License](#license)

## Requirements

- Node.js `>= 18` (installer only; the installer has no dependencies).
- git.
- For `pr` only, one of:
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

- Each installed skill directory contains a `.git-skills.json` marker (`package`, `version`, `installedAt`). The installer only overwrites or removes directories that carry this marker. Your own skills with the same name are left alone unless you pass `--force`.
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

In Claude Code, Cursor or OpenCode, type the skill name with a slash. With the default prefix `_` the names are `/_add`, `/_commit`, `/_push`, `/_pull`, `/_branch`, `/_pr`:

```
/_add
/_add src/ docs/
/_add --dry-run
/_commit
/_commit --push
/_push --commit
/_pull --ff-only
/_branch feature/login
/_branch -n new-branch-name
/_pr --base develop --draft
```

Every skill shows what it is about to do and waits for confirmation before anything visible to others happens (commit on `main`/`master`, push, creating a PR/MR).

### Renamed skills (0.2.0)

Skills were renamed. Old names are no longer installed:

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

Skills never run `--force` or `--no-verify`, never `--amend` unless asked, never resolve conflicts on their own, and never discard changes without explicit confirmation.

## Skill flags

| Skill      | Flags                                                                                        |
|------------|----------------------------------------------------------------------------------------------|
| `/_add`     | `[paths or instructions]`, `--dry-run`                                                       |
| `/_commit`  | `[message]`, `--lang en\|pl`, `--style conventional\|detected`, `--push`, `--redetect`, `--config` |
| `/_push`    | `--commit`, `--force-with-lease` (only after confirmation), `--config`                       |
| `/_pull`    | `--ff-only`, `--rebase`, `--config`                                                          |
| `/_branch`      | `<branch \| fragment \| ->`, `-n` / `--new`, `--config`                                      |
| `/_pr`      | `--base <branch>`, `--draft`, `--lang en\|pl`, `--redetect`, `--config`                      |

- `--lang` and `--style` apply to one invocation and are not saved.
- `--redetect` re-detects language and style from repository history and overwrites the local cache (see [Configuration](#configuration)).
- `--config` shows the current settings and lets you change them, then stops without doing the git operation.
- `pr --base` defaults to the remote's default branch (`refs/remotes/origin/HEAD`), not a hardcoded `main`.
- `branch -` switches to the previous branch (`git switch -`).

### Skill: add

Stages changes, like `git add`. It never commits.

**Arguments**

| Form | Staging |
|------|---------|
| none | everything in the working tree (`git add -A`) |
| paths or globs (`src/ docs/*.md`) | only those paths (`git add -A -- <paths>`); `-A` includes deletions inside them |
| words (`all except tests`, `only the README changes`) | the skill resolves the words to concrete paths from `git status` and `git ls-files`, shows the list, then stages it |
| `--dry-run` | prints what would be staged (`git add -n`); changes nothing |

Words are interpreted by the agent, so the resolved list is always shown first. If an instruction is ambiguous, the skill asks.

**Procedure**

1. `git status --short`. If nothing changed, it stops.
2. Resolve the scope (table above). Show the list when it is not "everything".
3. Warn and exclude by default: secrets (`.env*`, `*.pem`, keys, credentials, tokens), large binaries, build artifacts and dependency folders (`node_modules/`, `dist/`, ...). Such a file is staged only if you name it and confirm.
4. Stage. Git's `.gitignore` rules still apply; ignored files are not forced with `-f`.
5. Show `git status --short` again.

**Rules**

- Already staged files stay staged. `add` never unstages anything, and the output mentions them.
- It never runs `git add .` without first showing the list.
- It never commits. Use `/_commit` for that.
- Staging is local and reversible (`git restore --staged <path>`), so it needs no confirmation, except in step 3.

**Examples**

```
/_add                          # stage everything
/_add src/ docs/               # only these paths
/_add everything except tests  # agent builds the list, you see it, then staging
/_add --dry-run
```

## Configuration

### Settings reference

| Key                      | Values                   | Local (`git config --local`) | Global (`git config --global`) | Used by                           |
|--------------------------|--------------------------|------------------------------|--------------------------------|-----------------------------------|
| `skills.commit.language` | `en`, `pl`               | read; written by detection   | read as fallback               | `commit`, `pr`                  |
| `skills.commit.style`    | `conventional`, `detected` | read; written by detection | read as fallback               | `commit`, `pr`, `push` (commit) |
| `skills.commit.coauthor` | `true`, `false`          | read; written after your answer | read as default; written on first use if no global value exists | `commit`, `pr`, `push` (commit) |
| `pull.rebase`           | `true`, `false`          | read; changed only by you (`git config` or `--config`) | read as fallback | `pull` (native Git key)          |

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

## Pull requests and authentication (pr)

`pr` creates the PR/MR through a chain of fallbacks and tells you which one was used:

1. **CLI** (preferred): `gh` for GitHub, `glab` for GitLab. Used if installed and logged in (`gh auth status`, `glab auth status`).
2. **REST API** with a token from the environment: `GITHUB_TOKEN` or `GITLAB_TOKEN`. Used only if the variable is set.
3. **Prefilled link** to open in the browser. Needs nothing beyond access to the repository in the browser.

A missing `gh` or `glab` is not an error; the skill moves to the next step.

If a step fails, the skill goes to the next one and tells you why, for example:

```
gh not installed; trying REST API (GITHUB_TOKEN not set); using prefilled browser link
```

Before creating anything, `pr` checks whether a PR/MR for the branch already exists. If it does, the skill returns its link and stops; it does not create a second one.

Tokens are optional. The skills never set, store or print them; they are passed to `curl` through an environment header. Do not paste tokens into the repository, a `.env` file or shell history.

| Platform | Variable       | Minimum permission                            |
|----------|----------------|-----------------------------------------------|
| GitHub   | `GITHUB_TOKEN` | fine-grained token with `pull_requests: write` |
| GitLab   | `GITLAB_TOKEN` | `api` scope                                   |

## Safety

- All skills have `disable-model-invocation: true`: only you start them.
- `allowed-tools` is limited to `git`, `gh`, `glab` and `curl`.
- Files that look sensitive (`.env`, `*.pem`, keys, credentials) and large binaries or build artifacts trigger a warning before they are staged.
- `push` stops if the branch is behind its remote. It does not merge or rebase automatically; run `/_pull` first.
- Pushing to `main` or `master` requires confirmation.
- Conflicts are never resolved by the skills; `pull` stops and shows the state.

## Troubleshooting

| Symptom                                                          | Cause and fix                                                                                       |
|------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| `no harness detected`                                            | None of the harness config directories exists. Pass `--harness claude,cursor,codex,opencode`.       |
| `exists and is not managed by git-skills; skipped`               | A skill with that name already exists and was not installed by git-skills. Rename or remove it, or use `--force` (keeps a `*.bak` copy). |
| Skill missing after install                                      | Check `npx git-skills list`. If it is listed, restart the agent so it reloads skills (not verified for every harness). |
| Duplicate skills in Cursor                                       | Cursor also reads other harnesses' directories. Install to one harness only, or use `--harness cursor` deliberately. |
| `push` refuses: branch is behind                                | Run `/_pull`, then `/_push` again.                                                                  |
| `pull` stops with conflicts                                     | Resolve the conflicts yourself, then `git rebase --continue` / `git merge --continue`, or abort with `git rebase --abort` / `git merge --abort`. |
| `pr` says it used the browser link                              | `gh`/`glab` are missing or not logged in, and no token is set. Install and log in, or set a token.   |
| `pr` refuses an unsupported host                                | Only `github.com` and `gitlab.com` are supported.                                                   |

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
