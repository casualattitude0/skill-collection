---
name: manager
description: Run a goal as a manager — decompose it into stages, brief one subagent per stage, route each brief with jev (model, effort, skill, tool), and verify every report against its done-condition. Use when a goal has several pieces, or before any Agent dispatch.
---

# Manager

Two roles, fixed for the run:

- **manager** — you. You own the goal: you cut it into stages, write each
  brief, choose who runs it, and judge what comes back.
- **worker** — a subagent reached through the Agent tool. It starts **cold**:
  nothing in this conversation reaches it except the brief.

Code owns control flow; **jev** supplies judgment. jev is TypeSafe's System One
model: it returns calibrated probabilities over options you hand it, never
text. [`references/jev.md`](references/jev.md) has the API, the confidence
bands, and how to tune the questions.

The run ends when every stage's done-condition holds, checked by you.

## Step 1 — decompose

Cut the goal into stages. A stage is one worker's job: a bounded change or
finding with a done-condition you can check from here (a file exists, a test
passes, a list is complete). Mark which stages depend on another's result;
the rest run in parallel.

Done when every stage has a checkable done-condition and the dependency
order is written down.

## Step 2 — brief

One brief per stage, written as a file so it survives quoting and can be
re-read:

- **task** — one paragraph, imperative.
- **context** — what already exists, fixed constraints, what is out of
  scope. A worker starved of context re-decides settled questions.
- **boundaries** — which paths it may edit; everything else is read-only.
- **done-condition** — the stage's, verbatim.
- **report format** — what it changed, what it verified, what it could not do.

Done when you could judge the result against the brief without asking the
worker a question.

## Step 3 — route

Run both calls on every brief, including the obvious ones:

```bash
~/.claude/skills/manager/scripts/jev route --task-file BRIEF
```

```
mcp__skill-library__find_skill(task=<brief text>)
```

`route` returns a rung (`model`, `effort`) for the Agent call plus two
probabilities, `followup` and `codex`. `find_skill` asks jev to pick from
the skill library (skills not preloaded into any session) and returns every
candidate at or above `min_p` (0.05). One candidate: take it. Several: read
their descriptions and choose — or name more than one when they cover
different parts of the brief — and record why in the routing line. If the tool is missing, fall back to
`~/.claude/skills/manager/scripts/list-skills > skills.json && ~/.claude/skills/manager/scripts/jev pick --kind skills
--candidates skills.json --task-file BRIEF`.
When the brief touches an external system, write a `{server: description}`
file from the deferred-tool listing in your context (nothing on disk holds
it), `pick --kind tools` over it, then once more over that server's tools.

Read the `band`:

- **act** — take the answer.
- **consider** — the answer is a hint; decide yourself and say why.
- **ignore** (or `ok: false`) — decide yourself from the brief.

A `followup` above 0.7 says the brief continues earlier work: hand it to the
same worker with SendMessage instead of a fresh one.

A `codex` at or above 0.7 says the stage belongs with a GPT model (the user
named GPT or Codex, or it is a second opinion on Claude's own work): route it
through the `cross-model-delegate` skill instead of the Agent tool. Between
0.5 and 0.7 it is a hint; decide yourself. The rung still stands as the
Claude fallback if Codex cannot run.

Close each brief file with a **routing line**, the record Step 4 copies from:

```
route: model=opus effort=high skill=tdd source=jev(act)
```

`source` is `jev(act)`, `jev(consider)+<reason>`, `override: <reason>`, or
`codex` for a Codex stage.

Done when every brief file ends in a routing line whose `model`, `effort`
and `skill` (or `none`) are all filled, or that says `codex`.

## Step 4 — dispatch

Launch independent stages in one message. Each Agent call copies its
routing line: `model` and `effort` as the call's parameters, the brief as
the prompt, and the skill named in the prompt's first line with an
instruction to load it first by calling `get_skill(name=<skill>)` on the
`skill-library` MCP server (library skills are not in the worker's skill
list, so the Skill tool cannot load them). Set `run_in_background` unless the next action
needs the result.

A Codex stage skips the Agent tool: load `cross-model-delegate` and hand it
the brief file unchanged, since both skills use the same five fields. The
rung's `model` and `effort` do not apply; the Codex model id is chosen
there, and a missing `codex` executable falls back to the rung, not to a
simulated delegate. When `followup` is also high, resume that stage's
existing Codex thread.

Done when every stage with satisfied dependencies is running and each Agent
call's `model`, `effort` and named skill match its brief's routing line.

## Step 5 — verify

Check each report against its done-condition yourself: run the test, open
the file, count the list. A report is a claim.

On a shortfall, add the shortfall to the brief and redispatch one rung up
(light → standard → hard). A Codex stage has no rungs: correct it on the
same thread, as `cross-model-delegate` Step 3 says. A stage that fails at
`hard`, or that Codex states it cannot meet, stops the run: report it to the
user with the brief and the last report.

Done when every stage's done-condition holds under your own check. Then
report: what each stage changed, what you verified, what stopped.
