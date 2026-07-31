# Installing the gate

The skill alone still depends on remembering to run it. The **gate** removes that
dependency: a Stop hook that refuses to end the turn while an unstamped plan
exists. Human discipline is the part of the loop that fails, so the gate takes it
out of the loop.

Three parts, deliberately decoupled:

| part | job | fix it when |
|---|---|---|
| gate (Stop hook) | block a turn that has an unstamped plan | interception misfires |
| skill (`SKILL.md`) | how the review is conducted | review quality is poor |
| stamp (marker line) | the handshake between the two | — |

## Reviewer CLI

The skill shells out to a second model. Install whichever you use as reviewer
and confirm two things: it runs non-interactively, and it can resume a session —
the skill depends on holding one session across rounds.

With the Codex CLI, `codex exec` and `codex exec resume <thread_id>` cover both.
Verify the resume actually carries memory rather than assuming it:

```bash
codex exec --json --skip-git-repo-check "Remember: PANGOLIN-7. Reply: ok"
codex exec resume <thread_id> --skip-git-repo-check "What was the codeword?"
```

Codex installed as a plugin may not be on `PATH` — the binary lives under
`~/.codex/`, so symlink it where the skill can reach it.

## Hook

Make the script executable:

```bash
chmod +x ~/.claude/skills/cross-model-review/hooks/require-review-stamp.sh
```

### User scope — gate every project

Add to `~/.claude/settings.json`, keeping whatever keys are already there:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "H=\"$HOME/.claude/skills/cross-model-review/hooks/require-review-stamp.sh\"; [ -x \"$H\" ] || exit 0; CMR_PLAN_GLOB='docs/plans/*.md' \"$H\""
          }
        ]
      }
    ]
  }
}
```

The `[ -x "$H" ] || exit 0` guard matters at this scope. The path runs through
`~/.claude/skills/`, which disappears when the skill is disabled — without the
guard the hook would then error on every turn, in every project.

### Project scope — gate one repo

Same shape in that repo's `.claude/settings.json`, pointing at the skill
wherever it lives:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "CMR_PLAN_GLOB='docs/plans/*.md' $CLAUDE_PROJECT_DIR/path/to/cross-model-review/hooks/require-review-stamp.sh"
          }
        ]
      }
    ]
  }
}
```

Register it in one scope only — both together fire the gate twice in that repo.

### The glob

`CMR_PLAN_GLOB` decides what is guarded; it defaults to `docs/plans/*.md`. At
user scope this reaches into every project, so a repo with pre-existing plans
that predate this workflow will block on first use — they carry no stamp
because nothing ever reviewed them. Either stamp them by hand, or narrow the
glob so only new plans enter the gate.

Verify all four paths before trusting it:

```bash
H=~/.claude/skills/cross-model-review/hooks/require-review-stamp.sh
cd "$(mktemp -d)" && mkdir -p docs/plans

CMR_PLAN_GLOB='docs/plans/*.md' $H </dev/null           # no plans  -> silent
printf '# p\n' > docs/plans/x.md
CMR_PLAN_GLOB='docs/plans/*.md' $H </dev/null           # unstamped -> block JSON
printf '\n<!-- cross-model-review: approved by t -->\n' >> docs/plans/x.md
CMR_PLAN_GLOB='docs/plans/*.md' $H </dev/null           # stamped   -> silent
```

The hook exits 0 whether it blocks or passes — the JSON on stdout is what
decides. Test by looking at the output, not the exit code.

## Escape hatch

The gate blocks every turn while an unstamped plan sits in the working tree. To
get out without a review, delete the plan file or append the stamp line by hand.

## Generalising

The gate is worth more than this one review. Anything you already know you should
do and skip when you are in a hurry can be gated the same way: pick an artifact,
pick a mark that proves the work happened, and refuse to end the turn without it.
