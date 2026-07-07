---
name: github-pr-merge
description: Open a GitHub pull request from a source branch into a target branch and merge it — no review step. Use when asked to open and merge a PR, merge branch X into branch Y, ship a branch, or "create a PR from A to B and merge it" without a review loop.
license: MIT
metadata:
  author: skill-collection
  version: "1.0.0"
---

# GitHub PR Merge

A stripped-down, no-review flow with the `gh` CLI:

1. **Open** a PR: source branch (A) → target branch (B).
2. **Merge** it back into the target branch (a "Merge pull request #N from
   <head>" commit) and delete the source branch (PR closes on merge).

There is **no review sub-agent** here — if you want a Pass/Failed review loop
before merging, use the [`github-pr-workflow`](../github-pr-workflow/SKILL.md)
skill instead. This skill assumes the change is already good to go.

The default merge method is a real **merge commit** so the source branch
joins back into the target branch. Do **not** default to `squash`/`rebase` —
those replay the source commits onto the base and leave the graph looking
like divergent parallel branches instead of a merge back into the target.

The deterministic GitHub plumbing lives in [`driver.mjs`](driver.mjs); it
never calls a model — it only talks to `gh`.

> Paths below are relative to this skill directory. Run the driver as
> `node driver.mjs ...` from here, or with the full path
> `node git/github-pr-merge/driver.mjs ...` from the repo root.

## Prerequisites

- `gh` authenticated: `gh auth status` must show a logged-in account with
  `repo` scope.
- Node 18+ (`driver.mjs` is plain ESM, no deps).
- A git remote named `origin` you can push to.

## Run

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

### 2. Merge

```bash
node driver.mjs merge <pr-number>
```

Creates a merge commit on the target branch ("Merge pull request #N from
`<head>`") and deletes the source branch — the source branch joins back into
the target instead of running parallel to it. Override with
`--method squash|rebase` or keep the branch with `--no-delete-branch`.
Confirm:

```bash
node driver.mjs status <pr-number>   # -> {"state":"MERGED","merged":true,...}
```

## Driver command reference

| Command | What it does |
|---|---|
| `open --head <b> --base <b> [--title T] [--body B] [--draft]` | Push head, open PR, print `{number,url,...}` |
| `merge <pr> [--method merge\|squash\|rebase] [--no-delete-branch]` | Merge into target (default: merge commit) + delete branch |
| `status <pr>` | Print `{state,mergeable,merged,base,head}` |

## Gotchas

- **`gh pr view --json` has no `merged` field.** Use `mergedAt` (null ⇒ not
  merged) or `state == "MERGED"`. The driver derives `merged` from
  `mergedAt`; don't add `merged` to the field list or `gh` errors with
  "Unknown JSON field".
- **Push protocol is whatever `origin` uses.** `open` runs
  `git push -u origin <head>` and relies on your existing SSH/HTTPS auth. If
  the branch already exists upstream the push is a no-op and the PR still
  opens.
- **Default method is `merge` (a merge commit), not `squash`.** A merge
  commit shows the source branch joining back into the target ("Merge pull
  request #N from `<head>`"). `squash`/`rebase` replay the commits onto the
  base, which reads as a parallel/divergent branch rather than a merge —
  only pass `--method squash|rebase` when you explicitly want that.
- **`merge` is irreversible.** A merge can't be cleanly undone, and there is
  no review gate in this skill — only run it when you already know the change
  is good. Test loops should target a throwaway base branch, never `main`
  directly.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `gh: To get started with GitHub CLI, please run: gh auth login` | Run `gh auth status`; re-auth if no `repo` scope. |
| `pull request create failed: ... No commits between base and head` | The source branch has no new commits vs. base — commit first. |
| `Unknown JSON field: "merged"` | You edited the field list; use `mergedAt` (see Gotchas). |
| `Pull request is not mergeable` | Resolve conflicts / branch protection on the base, then re-run `merge`. |
| Push prompts for credentials / fails | `origin` auth issue, unrelated to the driver — fix `git push` first. |
