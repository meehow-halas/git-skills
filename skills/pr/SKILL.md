---
name: pr
description: Commit and push if needed, then create a GitHub PR or GitLab MR with generated title and description.
disable-model-invocation: true
argument-hint: "[instructions] [--base <branch>] [--draft] [--lang en|pl] [--redetect] [--config]"
allowed-tools: Bash(git *), Bash(gh *), Bash(glab *), Bash(curl *)
---

# pr

Create a pull request (GitHub) or merge request (GitLab). Arguments: `$ARGUMENTS`

## 1. Host and base
1. `git remote get-url origin`; host: `github.com` -> GitHub (PR), `gitlab.com` -> GitLab (MR). Any other host: say it is unsupported and stop.
2. Base branch, first match wins: (1) branch given by the user (`--base` or named in the instructions); (2) project uses se-harness: `harness.config.json` (repo root, else `se-harness/`) with field `agents.baseBranch` set and non-empty; (3) `git symbolic-ref refs/remotes/origin/HEAD`; (4) none of these -> ask the user for the branch name (never assume `main`). If current branch == base, stop.

Invoking `/_pr` starts the whole flow below with no questions. Stages (add, commit, push) behave exactly as in the commit and push skills, including their scope rules: by default everything is added; if the user's instructions narrow the scope (files, directories, "only staged"), follow them. Other user instructions (base, draft, message, language) are applied as well. Still stop on the safety rules: secrets and build artifacts are excluded and reported, never force-push, never print tokens.

## 2. Prepare branch
1. `git status --short`. Uncommitted changes -> commit procedure from the commit skill, automatically (default scope = everything, narrowed by user instructions; message per language/style rules below). No question.
2. No upstream, or unpushed commits -> `git fetch`, stop if behind (show the incoming commits and suggest the pull skill), `git push -u origin <branch>`, no force. No confirmation, and no remark about the missing upstream.
3. Check whether a PR/MR for this branch already exists (`gh pr view` / `glab mr view`, or the REST API). If yes, return its link and stop.

## 3. Title and description
Generate from `git log <base>..HEAD` and `git diff <base>...HEAD --stat` (read the diff where needed). Language and style: same rules as commit (verbatim text > argument > `skills.commit.language` > detect from last 20 commits > English). Description: short summary, key changes, notes. Create the PR directly with it, then show the title and link in the result.

## 4. Create (fallback chain; announce which path is used)
Pass all parameters explicitly, no interactive prompts.
1. CLI, if installed and authenticated (`gh auth status` / `glab auth status`):
   - `gh pr create --base <base> --head <branch> --title "..." --body "..."`
   - `glab mr create --target-branch <base> --source-branch <branch> --title "..." --description "..." --yes`
   Add `--draft` when requested.
2. REST API with token from env var `GITHUB_TOKEN` / `GITLAB_TOKEN`, only if set:
   - GitHub: `POST https://api.github.com/repos/{owner}/{repo}/pulls` (needs `pull_requests: write`)
   - GitLab: `POST https://gitlab.com/api/v4/projects/{url-encoded path}/merge_requests` (scope `api`)
   Never print, store or write the token anywhere; pass it to curl via a header from the environment.
3. Prefilled browser link, URL-encoding title/body:
   - GitHub: `https://github.com/{owner}/{repo}/compare/{base}...{branch}?expand=1&title=...&body=...`
   - GitLab: `https://gitlab.com/{path}/-/merge_requests/new?merge_request[source_branch]={branch}&merge_request[target_branch]={base}&merge_request[title]=...`
A failing step falls through to the next one; tell the user why. Missing CLI is not an error.

## 5. Result
Return the PR/MR link.

## Commit settings (shared with commit)
- `--config`: show `skills.commit.*` and `pull.rebase` (local/global), allow changes, stop. `--redetect`: re-detect language/style and overwrite local cache.
- Cache detected language/style in `git config --local` only if detection was clear.
- Co-Authored-By: `skills.commit.coauthor` local, else global. If no local value, ask once (suggest global; save locally, and globally if none exists). When `true`, add the footer in the format from your current context (model name + session link), never stored text.
