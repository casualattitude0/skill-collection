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
3. **Pass** → merge into the target branch (a "Merge pull request #N from
   <head>" commit) and delete the branch (PR closes on merge).
4. **Failed** → post a comment with the failure reasons, fix them on the
   source branch, push, and re-review until it passes.

The default merge method is a real **merge commit** so the source branch
joins back into the target branch. Do **not** default to `squash`/`rebase` —
those replay the source commits onto the base and leave the graph looking
like divergent parallel branches instead of a merge back into the target.

The deterministic GitHub plumbing lives in
[`driver.mjs`](driver.mjs); the Pass/Failed **decision** is made by a
sub-agent **you** (the orchestrator) spawn with the Agent tool. The driver
never calls a model — it only talks to `gh`.

> Paths below are relative to this skill directory. Run the driver as
> `node driver.mjs ...` from here, or with the full path
> `node git/github-pr-workflow/driver.mjs ...` from the repo root.

## One account for the whole PR process

The entire flow — branch push, open, merge, comment — runs as a **single
GitHub identity**, so a machine with more than one `gh` account never opens
the PR as one account while the SSH branch push lands as another. The driver
pins the account named in `ACCOUNT` (default `casualattitude0`, account #1
from `gh auth status`): it runs `gh auth switch` before every command and
pushes the branch over HTTPS using that account's `gh` credential rather than
the SSH key `origin` resolves to. Override with `GH_PR_ACCOUNT=<user>`, e.g.
`GH_PR_ACCOUNT=other node driver.mjs open ...`. If `gh` is authenticated as a
different account and can't switch, the driver stops with a clear message
instead of silently using the wrong identity.

## Prerequisites

- `gh` authenticated: `gh auth status` must show the pinned account with
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

Creates a merge commit on the target branch ("Merge pull request #N from
`<head>`") and deletes the source branch — the source branch joins back into
the target instead of running parallel to it. Override with
`--method squash|rebase` or keep the branch with `--no-delete-branch`.
Confirm:

```bash
node driver.mjs status <pr-number>   # -> {"state":"MERGED","merged":true,...}
```

### 3b. Failed → comment, fix, re-review

Post the reasons (the sub-agent's explanation) as a PR comment:

```bash
node driver.mjs fail <pr-number> --reason "sandbox_add.js:2 — returns a - b, should be a + b."
```

Then apply the fix on the **source branch**, push, and loop back to step 2
(`context` → sub-agent → `pass`/`fail`). Push through the driver so the fix
commits land under the same pinned account as the rest of the PR — not via a
plain `git push origin`, which would use the SSH key's identity. Pushed
commits show up on the open PR automatically — no need to reopen it:

```bash
git checkout <source-branch>
# ...edit files...
git commit -am "fix: address review"
node driver.mjs push <source-branch>   # pushes as the pinned account
git checkout -   # back to where you were
```

## Driver command reference

| Command | What it does |
|---|---|
| `open --head <b> --base <b> [--title T] [--body B] [--draft]` | Push head, open PR, print `{number,url,...}` |
| `context <pr>` | Print title + body + files + diff for the reviewer |
| `pass <pr> [--method merge\|squash\|rebase] [--no-delete-branch]` | Merge into target (default: merge commit) + delete branch |
| `fail <pr> --reason <text>` | Post a "Failed" review comment |
| `push <branch>` | Push `<branch>` to origin as the pinned account (fix loop) |
| `status <pr>` | Print `{state,mergeable,merged,base,head}` |

## Gotchas

- **`gh pr view --json` has no `merged` field.** Use `mergedAt` (null ⇒ not
  merged) or `state == "MERGED"`. The driver derives `merged` from
  `mergedAt`; don't add `merged` to the field list or `gh` errors with
  "Unknown JSON field".
- **zsh `noclobber` blocks `>` redirects** ("file exists" even when
  overwriting). When scripting fixes in this shell, `unsetopt noclobber`
  first, or use `>!`, or write via the editor tool instead of `cat >`.
- **The branch push ignores `origin`'s protocol on purpose.** Even when
  `origin` is SSH (`git@github.com:...`), `open`/`push` push over HTTPS to the
  same repo using the pinned account's `gh` credential, so the branch is
  created by that one account — not by whatever the SSH key resolves to. This
  is what keeps the whole PR process on a single identity. If the branch
  already exists upstream the push is a no-op and the PR still opens.
- **Review the *latest* diff.** After pushing a fix, re-run `context` before
  re-reviewing — `gh pr diff` reflects the new commits immediately.
- **Default method is `merge` (a merge commit), not `squash`.** A merge
  commit shows the source branch joining back into the target ("Merge pull
  request #N from `<head>`"). `squash`/`rebase` replay the commits onto the
  base, which reads as a parallel/divergent branch rather than a merge —
  only pass `--method squash|rebase` when you explicitly want that.
- **`pass` is irreversible.** A merge can't be cleanly undone. Only call it
  after a `Pass` verdict. Test loops should target a throwaway base branch,
  never `main` directly.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `gh: To get started with GitHub CLI, please run: gh auth login` | Run `gh auth status`; re-auth if no `repo` scope. |
| `pull request create failed: ... No commits between base and head` | The source branch has no new commits vs. base — commit first. |
| `Unknown JSON field: "merged"` | You edited the field list; use `mergedAt` (see Gotchas). |
| `(eval): file exists: <f>` on a `>` redirect | zsh `noclobber`; see Gotchas. |
| `gh is authenticated as "X", but this skill is pinned to "Y"` | Run `gh auth switch --user Y`, or set `GH_PR_ACCOUNT=X` to use the current one. |
| Push prompts for credentials / fails | `gh` credential/token issue — run `gh auth status` and re-auth the pinned account. |

## Verified end-to-end

This skill was exercised against a sandbox base branch (not `main`):
`open` (PR #1, source→base) → `context` → sub-agent returned **Failed** on a
seeded `a - b` bug → `fail` posted the comment → fix pushed → `context`
re-fetched → sub-agent returned **Pass** → `pass` merged into the base and
deleted the branch → `status` reported `MERGED`. Sandbox branches were then
deleted.
