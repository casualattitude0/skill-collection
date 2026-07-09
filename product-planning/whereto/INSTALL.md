# Installing whereto — All AI Agent IDEs

Whereto uses the standard [Agent Skills](https://agentskills.io) `SKILL.md` format. One skill folder works across Claude Code, Cursor, Codex, Gemini, OpenClaw, Hermes, and other harnesses — no per-IDE code forks.

## Quick install (recommended)

From this Skills repo:

```bash
# User scope — available in every project you open
./product-planning/bin/install.sh --user

# Project scope — committed with a specific repo
./product-planning/bin/install.sh --project

# Pick harnesses only
./product-planning/bin/install.sh --user --harness claude,cursor,agents whereto
```

Default is **symlink** (stays in sync when you pull this repo). Use `--copy` if your environment blocks symlinks.

List options:

```bash
./product-planning/bin/install.sh --list
```

## Manual install by environment

Replace `SKILLS_REPO` with the path to this repository (e.g. `~/Developer/Skills`).

| Environment | User-global path | Project path | Invoke |
|-------------|------------------|--------------|--------|
| **Claude Code** | `~/.claude/skills/whereto` | `.claude/skills/whereto` | Mention "whereto" or ask about project phase |
| **Cursor** | `~/.cursor/skills/whereto` | `.cursor/skills/whereto` | `@whereto` or describe the task |
| **OpenAI Codex** | `~/.agents/skills/whereto` | `.agents/skills/whereto` | `/whereto` or natural language |
| **Codex (alt)** | `~/.codex/skills/whereto` | `.codex/skills/whereto` | Same as Codex |
| **Gemini CLI** | `~/.gemini/skills/whereto` | `.gemini/skills/whereto` | Per Gemini skill discovery |
| **OpenCode** | `~/.opencode/skills/whereto` | `.opencode/skills/whereto` | Per OpenCode docs |
| **OpenClaw** | `~/.openclaw/skills/whereto` | — | `clawhub` or clone into skills dir |
| **Hermes** | `~/.hermes/skills/writing/whereto` | — | `/whereto` |
| **Pi** | `~/.pi/skills/whereto` | `.pi/skills/whereto` | Per Pi harness |
| **Kiro** | `~/.kiro/skills/whereto` | `.kiro/skills/whereto` | Per Kiro harness |
| **Trae** | `~/.trae/skills/whereto` | `.trae/skills/whereto` | Per Trae harness |
| **Rovodev** | `~/.rovodev/skills/whereto` | `.rovodev/skills/whereto` | Per Rovodev harness |

### Symlink one-liner (Claude Code example)

```bash
ln -sfn "$SKILLS_REPO/product-planning/whereto" ~/.claude/skills/whereto
```

### Rules-based agents (no skills folder)

For tools that use rules files instead of skill directories, point the agent at the skill file:

| Tool | Location |
|------|----------|
| **Windsurf** | `.windsurf/rules/whereto.md` — paste or symlink `SKILL.md` |
| **Cline** | `.clinerules/whereto.md` |
| **GitHub Copilot** | Add a section to `.github/copilot-instructions.md` linking `SKILL.md` |
| **Claude.ai Projects** | Paste `SKILL.md` into project custom instructions |
| **AGENTS.md / CLAUDE.md** | Add: `Project phase planning → read product-planning/whereto/SKILL.md` |

## What whereto writes (IDE-agnostic)

Artifacts land in the **target project** being analyzed, not in the skills repo:

| File | Purpose |
|------|---------|
| `PROJECT_PHASE.md` | Roadmap + evidence scorecard + scored next slice |
| `IMPLEMENTATION_HANDOFF.md` | MUST/SHOULD build package for a coding agent |

Paths: project root, or `docs/` if that folder exists.

## Portability notes

- **Self-contained** — no `~/.gstack`, no outer gstack-game install, no preamble bins. Bundled tools live under `skills/`.
- **Subagents optional** — if your IDE lacks parallel Task/explore agents, research sequentially with grep/read; same output quality, slower.
- **Git optional** — stage 2 skips gracefully when `.git` is missing.
- **Sibling skill** — `prd` installs the same way for single-feature requirements docs (optional; not required for whereto).

## Bundled tools

Installing whereto also installs the full `skills/` tree:

- **Game** — asset-review, game-review, feel-pass, prototype-slice-plan, implementation-handoff, triage, …
- **Engineering / APP·WEB** — prd, prototype, tdd, domain-modeling, codebase-design, diagnosing-bugs, typeui-fundamentals
- **Planning aid** — [references/grilling.md](references/grilling.md)

See [skills/README.md](skills/README.md). Agents should load `skills/<name>/SKILL.md` when routed there — never look outside this pack.

## Uninstall

```bash
rm ~/.claude/skills/whereto    # or whichever harness you used
rm ~/.cursor/skills/whereto
# etc.
```

Symlinks remove cleanly; copied folders use `rm -rf`.

## Verify installation

After install, ask your agent:

> "What phase is this project in and what should I do next?"

The agent should load references, research the project, confirm with you, and write `PROJECT_PHASE.md` + `IMPLEMENTATION_HANDOFF.md`.
