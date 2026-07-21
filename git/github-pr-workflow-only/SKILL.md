---
name: github-pr-workflow-only
description: Single-pass GitHub PR workflow — open a pull request from a source branch into a target branch, send it to a review sub-agent that returns Pass/Failed, then either merge (on Pass) or leave a rejection review comment (on Failed), and STOP. Unlike github-pr-workflow, it never fixes the code or re-reviews. Use when asked to open a PR and review-then-merge once, run a one-shot / no-fix PR review, "review and merge if it passes, otherwise just comment and stop", gate a merge on a single agent review, or "open a PR from branch X into branch Y and merge it only if the review passes".
license: MIT
metadata:
  author: skill-collection
  version: "1.0.0"
---

# GitHub PR Workflow (single-pass, no fix loop)

Drives a **one-shot** PR review with the `gh` CLI. Same open-and-review as
[`github-pr-workflow`](../github-pr-workflow/SKILL.md), but it acts once on the
verdict and **stops** — it never edits the source branch or re-reviews:

1. **Open** a PR: source branch → target branch.
2. **Review** the PR with a Claude sub-agent → `Pass` / `Failed`.
3. **Pass** → merge into the target branch (a "Merge pull request #N from
   `<head>`" commit), delete the branch, **done**.
4. **Failed** → post a rejection review with the reasons (a formal PR review
   shown under the "Reviews" section), **done**. No fix is applied.

Reach for this variant when you want a human — not the agent — to own the fix.
The full [`github-pr-workflow`](../github-pr-workflow/SKILL.md) loops on a
Failed verdict (comment → fix on the source branch → push → re-review until it
passes); this one deliberately hands control back after a single verdict.

The default merge method is a real **merge commit** so the source branch joins
back into the target branch. Do **not** default to `squash`/`rebase` — those
replay the source commits onto the base and leave the graph looking like
divergent parallel branches instead of a merge back into the target.

The deterministic GitHub plumbing lives in [`driver.mjs`](driver.mjs); the
Pass/Failed **decision** is made by a sub-agent **you** (the orchestrator)
spawn with the Agent tool. The driver never calls a model — it only talks to
`gh`. Because there is no fix loop, the driver has no `push` command.

> Paths below are relative to this skill directory. Run the driver as
> `node driver.mjs ...` from here, or with the full path
> `node git/github-pr-workflow-only/driver.mjs ...` from the repo root.

## One account for the whole PR process

The entire flow — branch push, open, merge, comment — runs as a **single
GitHub identity**, so a machine with more than one `gh` account never opens the
PR as one account while the SSH branch push lands as another. The driver pins
the account named in `ACCOUNT` (default `casualattitude0`, account #1 from
`gh auth status`): it runs `gh auth switch` before every command and pushes the
branch over HTTPS using that account's `gh` credential rather than the SSH key
`origin` resolves to. Override with `GH_PR_ACCOUNT=<user>`, e.g.
`GH_PR_ACCOUNT=other node driver.mjs open ...`. If `gh` is authenticated as a
different account and can't switch, the driver stops with a clear message
instead of silently using the wrong identity.

## Prerequisites

- `gh` authenticated: `gh auth status` must show the pinned account with
  `repo` scope. (Verified with `gh version 2.89.0`.)
- Node 18+ (`driver.mjs` is plain ESM, no deps).
- A git remote named `origin` you can push to.

## Run (agent path)

A short, linear sequence — no loop. Run these driver commands; make the single
verdict call with a sub-agent in between.

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

Parse the first line for `VERDICT: Pass` / `VERDICT: Failed`. This review
happens **once** — whatever it returns is final for this run.

### 3a. Pass → merge, then stop

```bash
node driver.mjs pass <pr-number>
```

Creates a merge commit on the target branch ("Merge pull request #N from
`<head>`") and deletes the source branch — the source branch joins back into
the target instead of running parallel to it. Override with
`--method squash|rebase` or keep the branch with `--no-delete-branch`.

**Protected source branches are never deleted.** If the source (`<head>`) is a
long-lived branch — `main`, `master`, `develop`/`dev`, `release`/`release/*`,
`staging`, `production`, `hotfix/*`, etc. — `pass` merges but skips
`--delete-branch` and prints a `note:` to stderr, so merging `develop → main`
leaves `develop` intact. Extend the list with `GH_PR_PROTECTED="qa,sandbox"`
(names or path prefixes). The output reports it:
`{"branchDeleted":false,"head":"develop",...}`.

Confirm and finish:

```bash
node driver.mjs status <pr-number>   # -> {"state":"MERGED","merged":true,...}
```

That's the end of the run.

### 3b. Failed → leave a rejection review, then stop

Post the reasons (the sub-agent's explanation) as a **formal PR review** — it
lands under the "Reviews" section on GitHub, not as a loose conversation
comment — and then **stop**. Do **not** edit files, push, or re-review; that is
the whole point of this variant. The fix is the human's to make.

```bash
node driver.mjs fail <pr-number> --reason "sandbox_add.js:2 — returns a - b, should be a + b."
```

The review is submitted with `event=COMMENT` (via `gh pr review --comment`).
That is deliberate: this workflow runs the whole PR — open, review, merge — as
**one GitHub account**, and GitHub returns a 422 error if you try to *Approve*
or *Request changes* on **your own** PR. `COMMENT` is the only review event
allowed on a self-authored PR, so it is what "rejecting" looks like here. To
get a true **"Changes requested"** status (the red rejection that can block
merge), the review has to come from a *different* account — run the `fail` step
with `GH_PR_ACCOUNT=<reviewer>` set to a second authenticated `gh` account, and
swap `--comment` for `--request-changes` in `driver.mjs`.

The PR is left **open** so the human can pick it up. Report the PR URL and the
rejection reasons back to the user, then end the run.

## Driver command reference

| Command | What it does |
|---|---|
| `open --head <b> --base <b> [--title T] [--body B] [--draft]` | Push head, open PR, print `{number,url,...}` |
| `context <pr>` | Print title + body + files + diff for the reviewer |
| `pass <pr> [--method merge\|squash\|rebase] [--no-delete-branch]` | Merge into target (default: merge commit) + delete branch (protected source branches are kept), then stop |
| `fail <pr> --reason <text>` | Submit a rejection review (event=COMMENT) with the reasons — appears under "Reviews" — then stop |
| `status <pr>` | Print `{state,mergeable,merged,base,head}` |

There is no `push` command — this variant never applies a fix.

## Gotchas

- **This skill stops after one verdict.** On `Failed` it comments and returns;
  it does not touch the source branch. If you want the agent to fix and
  re-review in a loop, use [`github-pr-workflow`](../github-pr-workflow/SKILL.md)
  instead — that is its whole job.
- **A rejection is a review, not a `--request-changes`.** `fail` submits a
  formal PR review with `event=COMMENT`. Because open/review/merge all run as
  one account, `gh pr review --request-changes` (and `--approve`) would 422
  with "Can not request changes on your own pull request." COMMENT is the only
  review event GitHub permits on a self-authored PR. A second reviewer account
  is required for a true "Changes requested" state — see step 3b.
- **`gh pr view --json` has no `merged` field.** Use `mergedAt` (null ⇒ not
  merged) or `state == "MERGED"`. The driver derives `merged` from `mergedAt`;
  don't add `merged` to the field list or `gh` errors with "Unknown JSON
  field".
- **The branch push ignores `origin`'s protocol on purpose.** Even when
  `origin` is SSH (`git@github.com:...`), `open` pushes over HTTPS to the same
  repo using the pinned account's `gh` credential, so the branch is created by
  that one account — not by whatever the SSH key resolves to. If the branch
  already exists upstream the push is a no-op and the PR still opens.
- **Default method is `merge` (a merge commit), not `squash`.** A merge commit
  shows the source branch joining back into the target ("Merge pull request #N
  from `<head>`"). `squash`/`rebase` replay the commits onto the base, which
  reads as a parallel/divergent branch rather than a merge — only pass
  `--method squash|rebase` when you explicitly want that.
- **Protected source branches survive the merge.** `--delete-branch` is on by
  default, but `pass` first reads the PR's `headRefName` and skips the delete
  when it matches a long-lived branch (`main`, `master`, `dev`, `develop`,
  `release`/`release/*`, `staging`, `production`, `hotfix/*`, …). Matching is
  case-insensitive on the first path segment. Add your own with
  `GH_PR_PROTECTED="qa,sandbox"`.
- **`pass` is irreversible.** A merge can't be cleanly undone. Only call it
  after a `Pass` verdict. Test loops should target a throwaway base branch,
  never `main` directly.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `gh: To get started with GitHub CLI, please run: gh auth login` | Run `gh auth status`; re-auth if no `repo` scope. |
| `pull request create failed: ... No commits between base and head` | The source branch has no new commits vs. base — commit first. |
| `Unknown JSON field: "merged"` | You edited the field list; use `mergedAt` (see Gotchas). |
| `gh is authenticated as "X", but this skill is pinned to "Y"` | Run `gh auth switch --user Y`, or set `GH_PR_ACCOUNT=X` to use the current one. |
| Push prompts for credentials / fails | `gh` credential/token issue — run `gh auth status` and re-auth the pinned account. |
