---
name: github-pr-workflow
description: Open a GitHub pull request from a source branch into a target branch, send it to a review sub-agent that returns Pass/Failed, then merge on Pass or comment-and-fix on Failed. Use when asked to open a PR, review a PR with an agent, auto-merge a PR, run a PR review loop, or "create and merge a PR from branch X into branch Y".
license: MIT
metadata:
  author: skill-collection
  version: "1.0.0"
---

# GitHub PR Workflow

Drives a full PR review loop with the `gh` CLI:

1. **Open** a PR: source branch → target branch.
2. **Review** the PR with a Claude sub-agent → `Pass` / `Failed`.
3. **Pass** → squash-merge and delete the branch (PR closes on merge).
4. **Failed** → post a comment with the failure reasons, fix them on the
   source branch, push, and re-review until it passes.

The deterministic GitHub plumbing lives in
[`driver.mjs`](driver.mjs); the Pass/Failed **decision** is made by a
sub-agent **you** (the orchestrator) spawn with the Agent tool. The driver
never calls a model — it only talks to `gh`.

> Paths below are relative to this skill directory. Run the driver as
> `node driver.mjs ...` from here, or with the full path
> `node git/github-pr-workflow/driver.mjs ...` from the repo root.

## Prerequisites

- `gh` authenticated: `gh auth status` must show a logged-in account with
  `repo` scope. (Verified with `gh version 2.89.0`.)
- Node 18+ (`driver.mjs` is plain ESM, no deps).
- A git remote named `origin` you can push to.

## Run (agent path)

The orchestration is a loop. Run these driver commands; make the verdict
call with a sub-agent in between.

### 1. Open the PR

```bash
node driver.mjs open --head <source-branch> --base <target-branch> \
  --title "feat: my change" --body "What this does."
```

Pushes `<source-branch>` to `origin` if needed, opens the PR, and prints
JSON — capture the number:

```json
{"number":1,"url":"https://github.com/owner/repo/pull/1","base":"target","head":"source"}
```

### 2. Fetch review context and get a verdict

```bash
node driver.mjs context <pr-number>
```

This prints the title, description, changed-file list, and full diff. Hand
that text to a **review sub-agent** (Agent tool, `subagent_type:
general-purpose`) with a prompt like:

> You are a strict PR reviewer. Review the diff for correctness bugs.
> Respond with EXACTLY one line `VERDICT: Pass` or `VERDICT: Failed`,
> then a blank line and a short explanation (file, line, problem, fix).

Parse the first line for `VERDICT: Pass` / `VERDICT: Failed`.

### 3a. Pass → merge

```bash
node driver.mjs pass <pr-number>
```

Squash-merges and deletes the source branch (override with
`--method merge|rebase` or `--no-delete-branch`). Confirm:

```bash
node driver.mjs status <pr-number>   # -> {"state":"MERGED","merged":true,...}
```

### 3b. Failed → comment, fix, re-review

Post the reasons (the sub-agent's explanation) as a PR comment:

```bash
node driver.mjs fail <pr-number> --reason "sandbox_add.js:2 — returns a - b, should be a + b."
```

Then apply the fix on the **source branch**, push, and loop back to step 2
(`context` → sub-agent → `pass`/`fail`). Pushed commits show up on the open
PR automatically — no need to reopen it:

```bash
git checkout <source-branch>
# ...edit files...
git commit -am "fix: address review"
git push origin <source-branch>
git checkout -   # back to where you were
```

## Driver command reference

| Command | What it does |
|---|---|
| `open --head <b> --base <b> [--title T] [--body B] [--draft]` | Push head, open PR, print `{number,url,...}` |
| `context <pr>` | Print title + body + files + diff for the reviewer |
| `pass <pr> [--method squash\|merge\|rebase] [--no-delete-branch]` | Merge + delete branch |
| `fail <pr> --reason <text>` | Post a "Failed" review comment |
| `status <pr>` | Print `{state,mergeable,merged,base,head}` |

## Gotchas

- **`gh pr view --json` has no `merged` field.** Use `mergedAt` (null ⇒ not
  merged) or `state == "MERGED"`. The driver derives `merged` from
  `mergedAt`; don't add `merged` to the field list or `gh` errors with
  "Unknown JSON field".
- **zsh `noclobber` blocks `>` redirects** ("file exists" even when
  overwriting). When scripting fixes in this shell, `unsetopt noclobber`
  first, or use `>!`, or write via the editor tool instead of `cat >`.
- **Push protocol is whatever `origin` uses.** This repo's `origin` is SSH
  (`git@github.com:...`); `open` runs `git push -u origin <head>` and relies
  on your existing SSH/HTTPS auth. If the branch already exists upstream the
  push is a no-op and the PR still opens.
- **Review the *latest* diff.** After pushing a fix, re-run `context` before
  re-reviewing — `gh pr diff` reflects the new commits immediately.
- **`pass` is irreversible.** A squash-merge can't be cleanly undone. Only
  call it after a `Pass` verdict. Test loops should target a throwaway base
  branch, never `main` directly.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `gh: To get started with GitHub CLI, please run: gh auth login` | Run `gh auth status`; re-auth if no `repo` scope. |
| `pull request create failed: ... No commits between base and head` | The source branch has no new commits vs. base — commit first. |
| `Unknown JSON field: "merged"` | You edited the field list; use `mergedAt` (see Gotchas). |
| `(eval): file exists: <f>` on a `>` redirect | zsh `noclobber`; see Gotchas. |
| Push prompts for credentials / fails | `origin` auth issue, unrelated to the driver — fix `git push` first. |

## Verified end-to-end

This skill was exercised against a sandbox base branch (not `main`):
`open` (PR #1, source→base) → `context` → sub-agent returned **Failed** on a
seeded `a - b` bug → `fail` posted the comment → fix pushed → `context`
re-fetched → sub-agent returned **Pass** → `pass` squash-merged and deleted
the branch → `status` reported `MERGED`. Sandbox branches were then deleted.
