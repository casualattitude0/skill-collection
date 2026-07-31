---
name: cross-model-review
description: Have a second model adversarially review an implementation plan until both models reach consensus, then stamp the plan as approved. Use when a plan or design doc needs review before implementation, when a stop hook blocks a turn asking for cross-model review, when asked to get Codex (or another model) to check Claude's work, or when the user wants a second opinion on a plan. Not for reviewing written code or a diff — that is code-review — and not for a plan you are still drafting.
allowed-tools: Bash, Read, Edit
license: MIT
---

# Cross-model review

A model checking its own plan uses the same assumptions that produced it, so it
reads its own blind spots as sound. A different model brings different priors and
sees them. This skill runs that second pass.

Two roles, fixed for the run:

- **author** — the model that wrote the plan (you).
- **reviewer** — a different model, reached over CLI. Pick the reliable one over
  the pleasant one; the reviewer guards the last line of defence.

The run ends on a **stamp** written at the end of the plan file. The stamp means
consensus, not "we talked three times".

The stamp is enforced by a **gate** — a Stop hook,
[hooks/require-review-stamp.sh](hooks/require-review-stamp.sh), that refuses to
end a turn while an unstamped plan exists. Installing it: [INSTALL.md](INSTALL.md).

## Step 0 — name the reviewer

A reviewer earns the role by being a **frontier model from a different family
than yours**, reachable non-interactively, and able to resume a session. Where
the configured CLI is missing, the run has three honest endings: reach a
different frontier CLI, ask the user which reviewer to use, or report that no
qualifying reviewer is available and leave the plan unstamped.

A small local model is a **substitute**, not a reviewer. It will miss the class
of defect this skill exists to catch, so it stamps nothing on its own authority:
run it if the user asks, and say plainly in the final report that its sign-off
is weaker assurance than the skill intends.

Completion criterion: you can name the exact model that will review, and that
name reaches the user in the final report and in the stamp.

## Step 1 — open one reviewer session and keep it

Your first call to the reviewer is the review. Send the real request, capture
the session handle from that same call, and carry it through every later round.

```bash
# Scratch files are per-run. Parallel reviews across worktrees share /tmp,
# so a fixed filename would let one run read another's review.
W=$(mktemp -d "/tmp/cmr-$(basename "$PWD").XXXXXX")

# Round 1 — opens the session. Take thread_id from the JSONL.
codex exec --json --skip-git-repo-check -o "$W/r1.txt" "<review request>" 2>/dev/null \
  | grep -oE '"thread_id":"[^"]+"' | head -1

# Every later round — same thread, so it remembers what it already raised.
codex exec resume <thread_id> --json --skip-git-repo-check -o "$W/r2.txt" \
  "<your response to each finding>" 2>/dev/null
```

`-o` writes the reviewer's final message to a file, which reads more cleanly
than parsing it back out of the event stream.

A fresh session each round is a cold start: it remembers nothing, invents a new
crop of minor issues every round, and never converges. The same session
remembers what it already raised, so round one surfaces the real problems and
later rounds verify the fixes.

Completion criterion: one session id accounts for every reviewer call in this
run. If an early call left a session you then abandoned, name it in the final
report — an unaccounted session means part of the review happened somewhere you
are not reading.

## Step 2 — request the first review

Give the reviewer the plan file and the context it needs to judge design
decisions: what the code already does, what constraints are fixed, what is
deliberately out of scope. A reviewer starved of context reports intentional
decisions as bugs.

Require every finding to **quote the plan text it attacks**. A model handed a
file path will sometimes review a plan it never opened — fluent, well-organised,
and about nothing. Quoted text is what separates a real review from a plausible
one, and a finding whose quote appears nowhere in the file is the tell. On that
tell, send it back and make it quote before it judges.

Ask for concrete findings — the missing case, the unhandled boundary, the
concurrency the plan waves at without specifying. Ask it to say plainly when
the plan is sound on a point.

Completion criterion: every finding is written down with the plan section it
attacks.

## Step 3 — argue each finding to a resolution

For every finding, one of two things happens, and you record which:

- **fixed** — you agree, and the plan is edited.
- **defended** — you disagree, and you send the reviewer the reason. It then
  either concedes ("you're right, withdrawn") or holds and states exactly what
  it is holding on.

Send the resolutions back to the same reviewer session and let it re-review.
Repeat.

Two failure shapes to watch for, both of which end the round dishonestly:

- The reviewer nods everything through to be agreeable. Large models are
  sycophantic; a reviewer that finds nothing on a substantial plan has not
  read it.
- You wave a finding away as out of scope to get through the gate.

Completion criterion: no finding is open — each is fixed in the plan file or
defended and withdrawn by the reviewer. There is no round cap; a cap teaches
both sides to declare victory on the last round.

## Step 4 — stamp the plan

Once the reviewer states consensus, append the stamp as the final line of the
plan file:

```html
<!-- cross-model-review: approved by <reviewer model> (<cli>, thread <id>) -->
```

The thread id is what makes the stamp **auditable**. You write your own approval
mark, so on its own it asserts only that you say a review happened. Naming the
session turns that into a claim anyone can check by resuming the thread and
asking the reviewer what it read and whether it approved. A stamp without a
thread id is worth exactly your word.

Then report to the user: what the reviewer caught, what you fixed, and anything
it held on that you overrode.

## Scope

Review the plan, not the prose. Findings are about behaviour the plan gets wrong
or leaves unspecified — a race the plan doesn't arbitrate, an error path with no
handler, a migration with no rollback. Wording, naming taste, and speculative
extra features are not findings.
