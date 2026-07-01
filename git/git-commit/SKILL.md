---
name: git-commit
description: Intelligently stage and commit git changes in logical, well-named batches following Conventional Commits standards. Use whenever the user types "/git-commit all" (commit everything in the repo) or "/git-commit current" (commit only files related to the current chat conversation). Always invoke this skill on those exact commands — do not handle them manually without this skill.
license: MIT
metadata:
  author: skill-collection
  version: "1.0.0"
---

# git-commit Skill

Batch-commit git changes by grouping related files into logical commits with
Conventional Commits messages. Two modes: **all** (entire working tree) and
**current** (files relevant to the current conversation).

---

## Commands

| Command | Behavior |
|---|---|
| `/git-commit all` | Stage and commit all changed files, grouped by logical change |
| `/git-commit current` | Stage and commit only files related to the current chat |

---

## Workflow

### Step 1 — Understand the working tree

```bash
git status --short
git diff --stat
git diff --cached --stat   # already staged files
```

Read the output carefully. Note every changed, untracked, and staged file.

### Step 2 — Determine the file set

**`/git-commit all`**
Use every file shown in `git status` (modified, untracked, deleted, staged).

**`/git-commit current`**
Scan the current conversation for filenames, paths, module names, and topics
that were discussed, created, or edited. Cross-reference with `git status`
output. Only include files that match. If a file was mentioned or clearly
related to what was worked on, include it. When uncertain, include rather
than exclude.

### Step 3 — Group files into logical commits

Inspect the actual diffs for the file set:

```bash
git diff <file1> <file2> ...         # unstaged
git diff --cached <file1> <file2>    # staged
```

Group files so that each commit represents **one coherent change**. Good
grouping heuristics:

- Same feature or bug fix → one commit
- Same module or domain (e.g., all auth files, all DB migration files) → one commit
- Config/tooling changes separate from feature code
- Tests for a feature in the same commit as the feature itself
- Unrelated refactors in their own commit
- Dependency/lock file updates bundled with the change that introduced them

Aim for the smallest number of commits that still tells a clear story.

### Step 4 — Write Conventional Commit messages

Format: `<type>(<scope>): <short description>`

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `refactor` — code restructure, no behavior change
- `chore` — build, config, tooling, deps
- `docs` — documentation only
- `test` — adding or fixing tests
- `style` — formatting, whitespace
- `perf` — performance improvement
- `ci` — CI/CD changes

**Rules:**
- scope is optional but recommended (e.g., `feat(auth):`, `fix(api):`)
- description is lowercase, imperative mood, no period
- max 72 characters total
- if a commit needs more context, add a body after a blank line

**Examples:**
```
feat(auth): add JWT refresh token support
fix(api): handle null response from payment gateway
chore(deps): upgrade axios to 1.7.2
refactor(db): extract query builder into separate module
test(auth): add unit tests for token expiry logic
```

### Step 5 — Execute commits autonomously

For each group, run:

```bash
git add <file1> <file2> ...
git commit -m "<conventional commit message>"
```

Do **not** ask for confirmation. Execute each commit immediately.

After each commit, print a one-line summary:
```
✅ feat(auth): add JWT refresh token support  [3 files]
```

### Step 6 — Repeat until done

After committing a group, loop back:

```bash
git status --short
```

If there are remaining files in scope (all remaining files for `/git-commit all`,
or remaining relevant files for `/git-commit current`), continue grouping and
committing. Stop when:
- `/git-commit all`: working tree is clean (`nothing to commit`)
- `/git-commit current`: all conversation-relevant files are committed

### Step 7 — Final summary

Print a summary of everything committed:

```
── git-commit complete ──────────────────────────
✅ feat(dashboard): add revenue chart component   [2 files]
✅ fix(api): handle empty dataset edge case       [1 file]
✅ chore(deps): add recharts dependency           [1 file]
─────────────────────────────────────────────────
3 commits · 4 files committed
```

If `/git-commit current` left some files uncommitted (not relevant to the
conversation), note them:
```
⏭  Skipped (not related to current chat): migrations/003_add_index.sql
```

---

## Edge Cases

**Merge conflicts**: Stop immediately, report the conflicted files, and ask
the user to resolve them before continuing.

**New/untracked files**: Include in the most relevant commit group. If truly
unrelated to anything, bundle into a `chore: add untracked files` commit only
for `/git-commit all`.

**Binary files / assets**: Commit together in one group unless clearly tied
to a specific feature (then include with that feature's commit).

**Empty repo / no initial commit**: Use `git add` + `git commit` normally;
git handles the initial commit case automatically.

**Deleted files**: Treat like any other change — group with related changes
or in their own `refactor`/`chore` commit if standalone.

**Already-staged files**: Respect staged state. Don't unstage anything the
user has already staged manually. Commit staged files first as their own
group if they don't fit cleanly into another group.
