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

Register it in `~/.claude/settings.json` (or a project `.claude/settings.json`
to gate one repo only):

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/skills/cross-model-review/hooks/require-review-stamp.sh"
          }
        ]
      }
    ]
  }
}
```

Point `CMR_PLAN_GLOB` at wherever your plans live if it is not `docs/plans/*.md`.

## Escape hatch

The gate blocks every turn while an unstamped plan sits in the working tree. To
get out without a review, delete the plan file or append the stamp line by hand.

## Generalising

The gate is worth more than this one review. Anything you already know you should
do and skip when you are in a hurry can be gated the same way: pick an artifact,
pick a mark that proves the work happened, and refuse to end the turn without it.
