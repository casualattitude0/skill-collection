---
name: prompt-debt
description: Audit CLAUDE.md, AGENTS.md, skill bodies and hooks for prompt debt — rules written for an older model that now just cost context. Scopes each rule as Necessary Context, Workflow Control, or Safety Boundary, then proves each cut by ablation. Use when asked which rules to delete, why a CLAUDE.md got so long, what to trim from a skill, after a model upgrade, or to A/B test a prompt. Not for picking which skills to enable (skill-curator), ship checks (skill-verdict), or code bloat (ponytail-audit).
user_invocable: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Task
license: MIT
---

# prompt-debt — delete the rules the model outgrew

Every rule in your instructions was written to fix something the model got wrong
**at the time**. Models improve; rules don't expire on their own. What was a patch
becomes a constraint — the model would now do the right thing unprompted, but your
prompt still routes it the long way round. That accumulation is **prompt debt**.

**The rule this skill enforces on itself:** a rule stays only if evidence says
removing it makes things worse. "It feels safer to keep" is how the debt got here.

# The three scopes

**Every rule is assigned a scope before it gets a verdict.** Scope decides the
default verdict, whether the rule may be tested, and whether it may ever be
removed from a live setup.

| Scope | What it is | Default | Ablatable? |
|---|---|---|---|
| **1. Necessary Context** | What the model cannot know or look up | **keep** | No — audited for truth, not size |
| **2. Workflow Control** | How you dictate the model must work | **suspect** | Yes — the debt lives here |
| **3. Safety Boundary** | What must not happen, what counts as done | **keep** | Isolated tests only, never live |

- **Exactly one scope per rule.** A rule doing two jobs is two rules — split it,
  then scope each half. Compound rules are how workflow control smuggles itself
  in beside a real boundary.
- **When genuinely ambiguous, take the more protective scope** (3 over 2, 1 over
  2). Wrong toward keeping costs tokens; wrong toward cutting costs an incident.
- **Scope is not seniority.** Context can be false, a boundary can be
  unenforceable. Each scope has its own failure mode.

Extract candidates mechanically, then scope each by hand:

```bash
grep -nE '^\s*[-*0-9.]*\s*(Always|Never|Must|Do not|Don.t|You must|Make sure|Ensure|First|Then|Step [0-9])' <file>
```

## Scope 1 — Necessary Context

Brand positioning, audience, where data lives, unwritten conventions, *why* a past
decision went that way. No model upgrade makes this deducible.

**This scope carries no prompt debt — do not ablate it.** Its failure mode is the
opposite: context rots when the *project* changes, not when the model does. A
stale fact here is worse than a redundant rule, because the model acts on it
confidently.

- **Verify, don't measure.** Ask *is this still true?*, not *is this too long?*
  Check against the repo, not your memory of it.
- **Cut what it can look up.** File layout, available commands — it reads those.
  What survives is what it cannot look up.
- **Keep the reasoning.** "We do X" is half a rule. "We do X because Y" survives
  the next refactor, because the model can tell when Y stops holding.

Verdicts: `keep:` · `cut:` (only looks-it-up-itself) · `fix:` (stale).

## Scope 2 — Workflow Control

Fixed tool order, "list three points first", mandatory step sequences, hand-drawn
flowcharts, restatements of what the model already does. **Nearly all prompt debt
is here** — nearly every one of these lines patched a weaker model.

The only scope where deletion is the default hypothesis. Three passes, cheapest
first:

**Pass A — the two free questions.** These retire most of the scope with no test:

1. **Does this change behavior?** If the model already does it unprompted, the
   line buys nothing and is taxed every turn. Cut.
2. **Can it find this out itself?** If yes, cut — it belongs to Scope 1 and
   already failed the test there.

**Pass B — ablate what survives.** Anything unresolved by inspection goes through
[the protocol](references/ablation.md). No test, no cut.

**Pass C — invert the keepers.** Cutting workflow control is not leaving a blank.
Rewrite *how to do it* as **what to achieve, which line not to cross, what counts
as done**. Teach the destination, not the route — a rule that survives ablation
but still reads as a route is debt in slower form.

Then relocate: a rule that applies to one task does not belong in a global
`CLAUDE.md`. Push it into the skill or directory that owns the task.

Verdicts: `cut:` · `test:` · `invert:` · `move:` · `keep:` (ablation-proven).

## Scope 3 — Safety Boundary

What must not be touched, what needs human approval, citation requirements,
release gates, the definition of done. **These never existed to make the model
smarter, so "the model got better" is not an argument for removing them.**

Its own failure mode: a boundary nobody can check is not a boundary. Review for
**enforceability, not size**:

- **Is it verifiable?** If the model cannot check compliance itself, it is a wish
  that quietly falls back to you. This is where most setups are actually broken —
  see the verification gate in [references/ablation.md](references/ablation.md).
- **Is there a stopping condition?** Name the finish line and the evidence needed
  to claim it. A target with no stopping condition produces mediocre output, and
  that is the prompt's fault, not the model's.
- **Too widely scoped?** A global prohibition that matters for one task is still a
  boundary — `move:` it, never `cut:` it.
- **Duplicated?** Two boundaries saying the same thing drift apart. Merge.

Quality rules that are neither boundary nor how-to ("check the file exists")
belong to Scope 2, but are the **first class restored** when an ablated run
regresses.

Verdicts: `keep:` · `move:` · `fix:`. **`cut:` is unavailable in this scope**
without an explicit, recorded decision from the user.

# Procedure

1. **Inventory** the surfaces, weighted by load frequency — always-on files first.
2. **Scope** every extracted rule (above).
3. **Scope 1**: verify truth. **Scope 3**: verify enforceability. Neither is
   ablated.
4. **Scope 2**: Pass A, then ablate survivors, then invert and relocate.
5. **Report** grouped by scope.

Inventory commands, the verification gate, the ablation protocol, and eval expiry:
**[references/ablation.md](references/ablation.md)** — read it before running any
test.

# Output

Grouped **by scope**, ranked by always-on cost within each group:

```text
[scope 2] <tag> <rule, quoted or summarized>. <reason>. [file:line]
```

Tags: `keep:` earns its place (say why) · `cut:` proven removable · `test:`
pending ablation · `invert:` keep intent, rewrite as goal + boundary + done ·
`move:` relocate, name the destination · `fix:` stale, unverifiable, or missing a
stopping condition.

End with: `<N> rules — <A> context / <B> workflow / <C> boundary. <X> cut, <Y>
pending test, ~<L> always-on lines removed.`

An untested cut ships as `test:`, never `cut:`. Nothing to pay down:
`No prompt debt. Every rule earns its context.`

# Boundaries

Instruction surfaces only — `CLAUDE.md`, `AGENTS.md`, `SKILL.md`, hooks. Not
application code. Use instead when they fit: **skill-verdict** (is one skill fit
to ship), **skill-curator** (which skills should be enabled at all),
**ponytail-audit** (over-engineering in the codebase).

Proposes edits, applies none without confirmation. Never removes a Scope 3
boundary from a live environment. Never reports a cut as proven on a single run.
