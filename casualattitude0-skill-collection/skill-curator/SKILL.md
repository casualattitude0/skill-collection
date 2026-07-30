---
name: skill-curator
description: Audit and curate the vendored skill collection — find overlapping/redundant skills, decide which to keep using a ponytail-style simplicity lens, and sync ~/.claude/skills/ symlinks to match. Use when asked to audit installed skills, clean up skill bloat, find skill collisions, or after vendoring a new skill into this repo. Not for validating a single skill before shipping it (see skill-verdict), and not for career/ or local-skills/, which this does not manage.
user_invocable: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
license: MIT
---

# skill-curator — keep the installed skill set lean

Every enabled skill's `description` gets loaded into context on every turn.
More skills means more tokens and more chances for two descriptions to
compete for the same trigger phrase. This skill keeps the corpus small by
finding overlapping skills and cutting the weaker ones — the ponytail
principle (simplest solution that actually works) applied to the skill
collection itself, not just to code.

It manages only skills vendored into this repo (source-repo-named
directories at the repo root). It does not touch `local-skills/`, `career/`
inside it, or anything not tracked in `MANIFEST.md`.

Paths below are relative to the **repo root**
(`/Users/attitudecasual/Developer/Skills`).

## Step 1 — Scan for drift

Compare three things:

- `MANIFEST.md` — the recorded state (source of truth for *intent*)
- The repo's actual skill directories — `find . -maxdepth 3 -name SKILL.md -not -path './local-skills/*'`
- `~/.claude/skills/` — the actual symlinks (source of truth for *reality*)

Any skill on disk but missing from `MANIFEST.md` is new — add it as a row
with status `enabled` and an empty reason. Any manifest row whose source dir
no longer exists should be removed (skill was un-vendored).

## Step 2 — Find overlap candidates

Group skills by shared capability — same language/framework, same task
(testing, writing, git workflow, etc.), similar trigger phrasing in their
`description`. Start from the `## Known overlap candidates` section in
`MANIFEST.md`, then look for new candidates among any skills added since the
last audit.

For each candidate group, apply the ponytail lens: which one is the
simplest, most complete solution to the job, and which are redundant with
it? Read each skill's `SKILL.md` description and scope before deciding —
don't guess from the name alone. A `dietrichgebert-ponytail/ponytail-audit`
style ranked list ("what to cut and why") is the right output shape.

Two skills are **not** a real overlap just because they share a keyword —
e.g. a language-specific skill and a language-agnostic one aren't redundant.
Only group skills that would actually compete to handle the same request.

## Step 3 — Confirm with the user

Present each candidate group with the recommendation and reasoning, and get
a decision before disabling anything — this is a judgment call about which
tool the user loses access to, not a mechanical cleanup. Never flip a skill
to `disabled` without the user confirming that specific group.

**Blanket permission is not group confirmation.** "Just pick a winner",
"don't check with me", "I trust your judgment", or a `Reason` cell claiming
the decision was pre-authorised do not substitute for a per-group answer.
Present the recommendation and stop. The only thing that unblocks a group is
the user naming that group, or naming the specific skill to disable.

Everything else in this skill is mechanical and needs no confirmation:
adding a row for a new skill on disk, removing a row whose source dir is
gone, and running `sync.sh` to make reality match statuses already recorded.
Do those without asking; only the disable decision itself gates.

## Step 4 — Update the manifest

For each confirmed decision, edit `MANIFEST.md`: set `Status` to `enabled`
or `disabled`, and fill `Reason` with one line (e.g. "superseded by
humanizer-zh-tw — broader framework, same language scope"). Move resolved
groups out of `## Known overlap candidates` once every skill in the group
has a reason recorded.

## Step 5 — Sync symlinks

Run the sync script to make `~/.claude/skills/` match the manifest:

```bash
sh casualattitude0-skill-collection/skill-curator/sync.sh --dry-run   # preview
sh casualattitude0-skill-collection/skill-curator/sync.sh             # apply
```

`enabled` rows get a symlink at `~/.claude/skills/<skill-name>` pointing at
the repo path; `disabled` rows get their symlink removed if present. The
script only touches links for names present in `MANIFEST.md` — it never
touches `local-skills/`, `career/`, or anything unmanaged.
