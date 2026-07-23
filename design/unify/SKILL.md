---
name: unify
description: Enforce one unified design direction across UI and code. Defines a single source-of-truth standard (principles, tokens, grid, component contract, templates, audit checklist), generates UI that follows it by construction, and audits existing UI/code for violations — starting with "nothing touches the edge" and "one design direction per surface". Materializes to Web (CSS/React), Flutter, and SwiftUI from one abstract core. Use when a project's screens look casually laid-out, drift apart, or need a shared design system built from scratch.
user_invocable: true
license: MIT
metadata:
  author: unify
---

# Unify — One Design Direction, Enforced

This skill exists to kill two failures:

1. **Edge-touch** — UI elements flush against a container boundary.
2. **Casual layout** — each page invented on its own instead of sharing a direction.

It does this by making the design standard a *single source of truth* that everything
downstream references. Nothing invents its own values; everything dereferences the core.

## Architecture — one core, projected outward

```
                  core-spec.md   ← the ONLY source of truth
                       │
          ┌────────────┼────────────┐
     materialize    read-by      read-by
          │            │            │
   adapters/*     modes: define / generate / audit
   web·flutter·swiftui
```

- **[core-spec.md](core-spec.md)** — the frozen standard: Layers 0–5. Stack-agnostic,
  unitless. This file is authoritative. Adapters and modes never contradict it; if a
  concrete value is needed, it comes from here.
- **adapters/** — thin per-stack files that *materialize* the abstract core into that
  stack's native form (CSS variables, Flutter `ThemeData`, SwiftUI constants). An adapter
  adds **units and syntax only** — never a new token, scale, or rule.

## Modes

Invoke the skill with one intent. All three read `core-spec.md`.

### `define` — emit the standard into a project
1. Read `core-spec.md`.
2. Detect the stack; open the matching `adapters/<stack>.md`.
3. Write the materialized tokens + grid into the project (e.g. `tokens.css`,
   `theme.dart`, `DesignTokens.swift`) exactly as the adapter specifies.
4. Drop the audit checklist (Layer 5) into the repo as the review gate.
5. Do **not** invent values. Every emitted value traces to a core token.

### `generate` — build UI that is compliant by construction
1. Pick a **template** (Layer 4) for the page — never hand-place a layout.
2. Fill its regions with components from the **component contract** (Layer 3).
3. Every spacing/type/color value is a **token reference** (Layer 1). No raw literals.
4. Spacing between regions is owned by the template; components set no outer margin.
5. Self-check against the Layer 5 checklist before returning.

### `audit` — enforce the standard on existing UI/code
1. Run the Layer 5 checklist against the target (a diff, a file, or a screen).
2. For each row, use the adapter's audit commands (greps/lints) to find violations.
3. Report **PASS/FAIL per row** with file:line and the fix (which token replaces the
   literal, which template the page should adopt). Do not silently pass.

## Load order

1. Always read **core-spec.md** first — it decides all concrete values.
2. Then the relevant **adapters/<stack>.md** for syntax.
3. `design/typeui-fundamentals` (sibling skill) explains *why* these principles hold;
   consult it for edge cases the core is silent on. Core wins on concrete values;
   accessibility is non-negotiable everywhere.

## The one rule that unifies everything

**No raw values in components.** Every px, every hex, every size dereferences a token.
The moment a literal appears, unification is already broken — that is what `audit` hunts.
