---
name: skill-curator
description: Audit and curate the installed skill collection — find overlapping/redundant skills, decide which to keep using a ponytail-style simplicity lens, and sync ~/.claude/skills/ symlinks to match. Use when asked to audit installed skills, clean up skill bloat, cut context/token cost from skills, find skill collisions, or after vendoring a new skill into this repo. Not for validating a single skill before shipping it (see skill-verdict), and not for anything absent from MANIFEST.md.
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

It manages exactly the rows in `MANIFEST.md`: the vendored skills in
source-repo-named directories at the repo root, plus `local-skills/career/`.
It touches nothing absent from that table — the rest of `local-skills/`, and
`find-skills`, which points outside this repo.

**Overlap is not the only reason to disable.** A skill can be unique and still
not worth its keep: a whole language or framework stack you are not currently
working in costs tokens on every turn for nothing. Those groups are the
largest available cut, so measure before recommending — sort skills by
frontmatter size and by source directory rather than assuming the directory
with the most skills is the most expensive. Disabling on these grounds needs
the same per-group confirmation as an overlap cut, since only the user knows
what they are about to work on.

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

**The `Skills` context block is wider than this manifest.** Plugin and
CLI-bundled skills load too and are invisible to `~/.claude/skills/`, so a
report based only on the three sources above will understate the real cost —
on 2026-07-30 they were a third of the block. Measure them as well:

```bash
# installed plugins (path is keyed by account UUID, not session — it is stable)
find "$HOME/Library/Application Support/Claude/local-agent-mode-sessions" \
  -path '*/rpm/plugin_*/skills/*/SKILL.md' 2>/dev/null
# skills bundled with the CLI itself
find "$(dirname "$(readlink -f "$(which claude)")")/../.." -name SKILL.md 2>/dev/null
```

Report these separately rather than folding them into the manifest total, and
never disable a plugin skill by editing files in that tree — the app verifies
and re-syncs it, so the change can be silently reverted. Plugins are switched
off via `enabledPlugins` in `~/.claude/settings.json`, or uninstalled through
the app's plugin UI.

**Before recommending a plugin be disabled, read its `.mcp.json`.** A plugin
can bundle an MCP server, in which case disabling it removes that server's
tools as well as its skills — the user loses the whole integration, not the
per-turn cost of its guidance. Figma and Miro are both like this. Since MCP
tools are deferred and cost nothing until called, the real trade is "skills
tokens now" against "the integration at all", which is a very different
question from cutting a redundant skill. Say so explicitly when presenting it,
and check whether the server offers on-demand skill delivery (Figma's
`get_figma_skill` / `read_skill_uri`) that would let the tools stay while the
always-on skills go.

Note the panel counts name plus description, not the whole frontmatter, so
measure `description:` alone when reconciling against what the UI reports —
counting full frontmatter overstates it by roughly a quarter.

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
