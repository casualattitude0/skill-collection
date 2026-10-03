---
name: kickoff
description: Brief a long task before starting it — confirm the task, end state, stop conditions, and time budget in one round of questions, then run it to the end state under a checklist-backed contract.
disable-model-invocation: true
user_invocable: true
allowed-tools: AskUserQuestion, Bash, Read, Write, Edit, Glob, Grep, Agent
license: MIT
---

# kickoff — brief once, then run to the end state

A long task stalls for one of two reasons: nobody said what *done* looks like, or
the agent mistakes a progress report for done. `kickoff` settles the first with a
four-slot **brief**, and the second with a **checklist** file.

The task is whatever follows `/kickoff`. With nothing after it, ask for the task
in plain text first.

The other three slots are drafted *from* the Task, so the Task settles first.
When the text names no concrete change ("test something simple", "clean this
up"), ask the Task question alone — candidate tasks drawn from the repo as
options — and draft the rest from the answer.

# Step 1 — Draft the brief

Read enough of the project to draft all four slots yourself: the files the task
names, the test command, the size of the surface. The user should be confirming a
draft, not filling blanks.

| Slot | What it pins down | A draft is good when |
|---|---|---|
| **Task** | The change, and its scope edge | It names what is in *and* the nearest thing that is out |
| **End state** | What is true when the work is finished | Every clause can be checked by a command or by reading a file |
| **Stop conditions** | The only reasons to pause and ask | Each is an event you can recognize, not a mood ("if unsure") |
| **Time budget** | How long the run may take | It is a number, set looser than the user's hope |

Worked example — the task as typed was "把付款功能從舊寫法換成新寫法":

- **Task**: migrate every caller of `LegacyPayment` to `PaymentClient`; the
  refund flow is out of scope.
- **End state**: zero references to `LegacyPayment` remain, the legacy module is
  deleted, and `npm test` passes.
- **Stop conditions**: a test fails and the cause cannot be explained after
  investigating; a caller needs a behavior change, not a mechanical swap.
- **Time budget**: 40 minutes.

Step 1 is done when all four slots have a draft specific to this task and this
repo.

# Step 2 — Ask once

Send **one** `AskUserQuestion` call with four questions, one per slot, in the
user's language.

- First option: your draft, labelled "(Recommended)". Its description holds the
  full wording.
- Remaining options: real alternatives — a narrower scope, a stricter end state,
  a tighter stop rule. Each description says what choosing it changes.
- **Time budget** options: your estimate with headroom (recommended), a tighter
  number, and "no number — time matters". A budget is usually beaten, so
  recommend more than the estimate.

Step 2 is done when every slot has an answer that fits the confirmed Task. Two
answers earn one follow-up round each:

- A Task answer that differs from every option you offered: redraft the other
  three slots for the new Task and ask those three again.
- An End state answer that cannot be checked: ask that slot alone, offering
  checkable versions of what the user wrote.

# Step 3 — Write the checklist file

Write the confirmed brief and the work items to a file: the session scratchpad
when there is one, otherwise `.kickoff/<task-slug>.md` in the project (leave it
uncommitted). Tell the user the path.

```markdown
# <task>
End state: …
Stop only if: …
Budget: … (started HH:MM)

- [ ] <item>
```

The file is the single source of truth for progress. Chat history gets
compacted on a long run; the file survives it.

Step 3 is done when the file exists and its items, taken together, reach the end
state.

# Step 4 — Run under the contract

Start immediately. The brief was the approval.

**Keep moving.** A progress report and the next action go in the same message:
report, then do the next thing in that turn. Pause only for:

1. a stop condition from the brief;
2. a step that cannot proceed without an instruction only the user can give;
3. a destructive action, asked **before** it happens: deleting data, force-pushing,
   or changing files outside this project.

A choice that leaves the end state unchanged is yours: pick, note it in the
file, continue.

**Keep the checklist true.** Tick an item when its part of the end state is
verified. Append work the moment it is discovered. After a compaction or a
resumed session, reread the file before anything else.

**Fan out only wide work.** When the task is the same check or edit across many
independent units — an audit, a migration, a broad review — give each unit to a
subagent, in parallel. Check the evidence behind every subagent report (the
diff, the command output, the file and line) before accepting it, then record
the result in the checklist. Smaller tasks stay inline.

**Hold the budget.** Pace against the start time in the file, and parallelize to
save time. With "no number", the rule is: time matters, and the earliest correct
result wins. The budget sets pace and parallelism; depth of thinking is the
effort setting, a separate dial.

**Finish on the end state.** The run is finished when every box is ticked and
each clause of the end state has been checked in this session. The final message
gives that evidence per clause, the elapsed time against the budget, and the
checklist path.

A turn that ends with open boxes is a progress report. Open it with
`Not finished — N items open` and the reason for stopping.
