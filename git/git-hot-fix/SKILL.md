---
name: git-hot-fix
description: Ship an urgent bug fix straight to production off-cycle, then make sure it lands on every long-lived branch so it can't reappear in the next release. Use when the user needs a hotfix — "there's a critical bug in production", "hotfix the release", "patch prod now", "the live site is broken, fix it", "backport this fix to the release branches", or asks to branch off main/a release tag, fix, and merge back everywhere. Auto-detects Git Flow (main + develop) vs GitHub Flow (main only), delivers via gh PRs, and optionally bumps the version and tags. For a non-urgent bug that can wait for the next release, this is an ordinary branch + PR — use github-pr-workflow instead.
license: MIT
metadata:
  author: skill-collection
  version: "1.0.0"
---

# Git Hot-Fix

A **hotfix** is an urgent bug fix that ships to production *off-cycle* — you
can't wait for the next planned release. The fix itself is usually small. The
part that bites people is **fan-out**: the fix has to land on *every*
long-lived branch that feeds a production line, or it silently disappears the
next time a release branch merges forward. "We fixed that last month — why is
it back in prod?" is a hotfix that only went to one branch.

This skill handles that fan-out deterministically. The `git`/`gh` plumbing
lives in [`driver.mjs`](driver.mjs); **you** (the orchestrating agent) make the
judgment calls — what the fix is, how to resolve conflicts, whether to tag.

## Is this actually a hotfix?

Run this skill only when the fix is **urgent and production-bound**. If the bug
can wait for the next release, it's an ordinary bugfix — one branch, one PR
into its base. Don't dress it up as a hotfix; hand it to `github-pr-workflow`
(or just commit + open a PR) and stop here. Tell the user plainly:

> This looks like it can ship with the next release rather than off-cycle, so
> it's a normal branch + PR, not a hotfix. Want me to do that instead?

When in doubt, ask the user whether it needs to go to production *now*.

## The flow

### 1. Detect the terrain

```bash
node driver.mjs detect
```

This fetches, then prints JSON describing the repo:

- `flow` — `git-flow` (a `develop` branch exists) or `github-flow` (no develop).
- `base` — the production branch to fork the hotfix from (`main`/`master`/default).
- `targets` — the branches the fix **must** merge back into. Git Flow →
  `[main, develop]`; GitHub Flow → `[main]`.
- `releaseBranches` — live `release/*` and `support/*` lines that *may* also
  need the fix (older versions still in production).
- `version` — `{file, version}` if a manifest version was found, else `null`.
- `semverTags` — how many `vX.Y.Z`-style tags exist (does this repo tag releases?).

Read this before planning. Do not assume the branch model — detect it.

### 2. Confirm scope with the user

Show the user the plan **before** touching anything:

- The base you'll branch from.
- The full list of targets you'll merge back into (this is the part they
  forget — make it explicit).
- For any `releaseBranches`, **ask** whether each still-supported version needs
  the fix too. Don't fan out to every release branch by default — some are dead.
- Whether you'll bump the version and tag (see step 6).

### 3. Start the hotfix branch

```bash
node driver.mjs start --base <base> --name <short-slug>
```

Creates `hotfix/<slug>` fresh off `origin/<base>` — so the fix starts from
*real production*, not from whatever was checked out locally.

### 4. Apply the fix

Make the smallest change that fixes the bug. A hotfix is not the place for
refactors or unrelated cleanup — every extra line is extra risk on a branch
going straight to prod, and extra conflict surface on every backport. Commit
with a clear message (e.g. `fix: prevent null deref in checkout total`).

### 5. Fan out via PRs — one target at a time

For **each** target from step 1, open a PR from the hotfix branch and merge it:

```bash
node driver.mjs open  --head hotfix/<slug> --base <target> --title "..." --body "..."
node driver.mjs merge <pr-number>            # real merge commit; hotfix branch preserved
```

Merge into the **production base first** (that's the urgent one), then the
others. The driver defaults to a real merge commit and never auto-deletes the
`hotfix/*` source branch, so it stays available for the remaining targets.

Only delete the hotfix branch after the **last** target has merged:
`node driver.mjs merge <pr> ` on the final target, then
`git push origin --delete hotfix/<slug>` once you've confirmed all merged.

### 6. Version bump + tag (if the repo does this)

Versioning and tagging are **two separate decisions** — don't gate one on the
other. Look at `detect`'s output:

- **`version` is set** (a manifest carries a version) → **bump the patch**
  number (the last digit: `1.4.2 → 1.4.3`) in that file on the production base
  after the hotfix merges, and commit it. A version file means the repo tracks
  versions, so a shipped bug fix should move the patch — even if the repo
  hasn't cut its first tag yet. The patch bump signals "same features, one bug
  fixed," which is exactly what a hotfix is; never bump minor/major for one.
- **`semverTags` > 0** (the repo already tags releases) → also create the tag:
  ```bash
  node driver.mjs tag v1.4.3 --ref <base> --message "Hotfix: <what it fixed>"
  ```
  If `version` is set but `semverTags` is 0, the repo versions but doesn't tag —
  bump the version and skip the tag.
- **No version and no tags** → skip both; this repo doesn't track versions.
  Mention that you skipped, and why.
- **Unsure** (e.g. an unusual manifest, or tags that aren't semver) → ask the
  user rather than guessing.

## Handling merge conflicts

Backporting a hotfix to `develop` or an older `release/*` line often conflicts —
those branches have diverged from production. **Do not auto-resolve.** A wrong
resolution on a production fix is worse than a slow one. Instead:

1. Stop at the conflicting target and **close** its PR (don't leave a broken PR
   open): `gh pr close <pr>`.
2. Show the user the conflicting hunks and **ask** how to resolve — which side
   wins, or how the two changes should combine. The person who wrote the fix
   knows what the code *should* do; you don't get to guess on prod.
3. Apply their decision, re-open the PR (`node driver.mjs open ...` again), and
   merge.

Never mark a conflict resolved on the user's behalf without their answer.

## What "done" looks like

Report back concretely: the fix, every branch it merged into (with PR numbers),
the tag if you made one, and the hotfix branch cleaned up. If you skipped a
release branch or the version bump, say so and why — silent omissions on a
production fix are how bugs come back.

## One-account guarantee

Like the other git skills here, every GitHub call runs as a single pinned
identity (`gh auth switch`) and pushes go over HTTPS with that account's
credential. Override with `GH_PR_ACCOUNT=<user>` if needed.
