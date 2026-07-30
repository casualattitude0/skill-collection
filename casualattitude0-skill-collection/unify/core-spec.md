# Unify Core Spec — Single Source of Truth

Stack-agnostic and **unitless**. Adapters add units + syntax; they never add or change a
value here. If you need a concrete number, it is in this file. Six layers, from
non-negotiable rules down to the audit that enforces them.

---

## Layer 0 — Principles (failable rules)

Each is written so a reviewer or agent can return PASS/FAIL. These override taste.

- **P1 · Edge safety (no content *on a line*).** Content is never flush to, nor bisected
  by, **any** line — the outer container edge, a rounded-corner curve, **or an internal
  divider/separator**. Required clearances:
  - **Straight edge / border:** inner padding ≥ the breakpoint gutter (Layer 2).
  - **Internal divider or separator:** ≥ `space-3` (12) between the rule and the content
    on **each** side. The rule may be full-bleed, but the content beside it keeps its gap —
    a label must never sit *on* its divider.
  - **Rounded corner (radius `r`):** content is inset ≥ `r` from the corner so the curve
    never clips it (corner-safe inset). Toolbar/traffic-light content near a rounded window
    edge respects this.
  Content lives inside the frame, never on it — and never gets sliced by a rule.
- **P2 · Grid alignment.** Every box edge lands on the 4px base unit. Positions and sizes
  are token multiples — never eyeballed offsets.
- **P3 · One direction per surface.** A page = `template + tokens`. No bespoke page
  layouts. If a screen can't be expressed as a template filled with components, the
  template set is extended deliberately — not bypassed.
- **P4 · Token-only.** No raw px / hex / color / font-size literal appears in a component.
  Everything dereferences a token. This single rule unifies the visual *and* code sides.
- **P5 · Accessibility floor (non-negotiable).** Touch/click targets ≥ 44×44. Body text
  contrast ≥ 4.5:1, large/UI text ≥ 3:1. Focus is always visible. Color is never the only
  carrier of meaning. This layer wins over every aesthetic choice.

---

## Layer 1 — Tokens (abstract values)

### Spacing — base unit = 4
| token | multiple | value |
|---|---|---|
| `space-0` | 0× | 0 |
| `space-1` | 1× | 4 |
| `space-2` | 2× | 8 |
| `space-3` | 3× | 12 |
| `space-4` | 4× | 16 |
| `space-5` | 6× | 24 |
| `space-6` | 8× | 32 |
| `space-7` | 12× | 48 |
| `space-8` | 16× | 64 |
| `space-9` | 24× | 96 |

Only these values may appear. `5, 10, 18, 20, 30…` are violations.

### Type — role → size / line-height / weight
| role | size | line-height | weight |
|---|---|---|---|
| `caption` | 12 | 16 | 400 |
| `body-sm` | 14 | 20 | 400 |
| `body` | 16 | 24 | 400 |
| `label` | 14 | 20 | 600 |
| `h3` | 20 | 28 | 600 |
| `h2` | 24 | 32 | 700 |
| `h1` | 32 | 40 | 700 |
| `display` | 40 | 48 | 700 |

Components reference **roles**, never raw sizes. One type family + optional mono; the
family name is a token, not a literal.

### Color — semantic roles (hue-agnostic)
Roles, not hues. Build-from-scratch default = one neutral ramp (`neutral-0…900`) + one
accent. Dark theme remaps the same roles; components never know which theme is active.

| role | intent | default (light) |
|---|---|---|
| `bg` | page background | neutral-0 |
| `surface` | card / panel | neutral-50 |
| `surface-raised` | popover / modal | neutral-0 |
| `border` | default divider | neutral-200 |
| `border-strong` | emphasized edge | neutral-300 |
| `text` | primary text | neutral-900 |
| `text-muted` | secondary text | neutral-600 |
| `text-subtle` | tertiary / hint | neutral-400 |
| `primary` | accent / CTA | accent-600 |
| `on-primary` | text on accent | neutral-0 |
| `focus` | focus ring | accent-500 |
| `success` / `on-success` | positive | green-600 / neutral-0 |
| `warning` / `on-warning` | caution | amber-500 / neutral-900 |
| `danger` / `on-danger` | destructive | red-600 / neutral-0 |
| `info` / `on-info` | neutral notice | blue-600 / neutral-0 |

Neutral ramp (light): `0=#FFFFFF 50=#F7F8FA 100=#EEF0F3 200=#E2E5EA 300=#CBD0D8
400=#9AA1AD 500=#6B7280 600=#4B5361 700=#353B45 800=#22262D 900=#12141A`.
Accent ramp: `500=#3B82F6 600=#2563EB 700=#1D4ED8`.
Status hexes (pinned — adapters must use these exactly): `success=#16A34A ·
warning=#F59E0B · danger=#DC2626 · info=#2563EB`. `on-warning=neutral-900`; all other
`on-*` = `neutral-0`. These are *defaults* a project may retheme by role — but only by
role, never by re-hardcoding hues in components.

### Dark theme (role remap — pinned)
Dark is not a new palette; it re-points the **same roles** at the neutral ramp inverted.
Components never branch on theme. Adapters must use exactly this map:

| role | dark value |
|---|---|
| `bg` | neutral-900 `#12141A` |
| `surface` | neutral-800 `#22262D` |
| `surface-raised` | neutral-700 `#353B45` |
| `border` | neutral-700 `#353B45` |
| `border-strong` | neutral-600 `#4B5361` |
| `text` | neutral-0 `#FFFFFF` |
| `text-muted` | neutral-400 `#9AA1AD` |
| `text-subtle` | neutral-500 `#6B7280` |
| `primary` | accent-500 `#3B82F6` |
| `on-primary` | neutral-900 `#12141A` |
| `focus` | accent-500 `#3B82F6` |

Status roles keep their light hex in dark mode; only `on-*` pairings may lift for contrast.

### Radius / Elevation / Breakpoints / Motion
- **Radius:** `radius-0=0 · radius-1=4 · radius-2=8 · radius-3=12 · radius-full=9999`.
- **Elevation (pinned — `offset-y blur spread color`; adapter converts to native):**
  `e0` = none · `e1` = `0 1 2 0 rgba(0,0,0,.06)` · `e2` = `0 2 8 0 rgba(0,0,0,.10)` ·
  `e3` = `0 8 24 0 rgba(0,0,0,.16)`. Elevation always pairs with `surface*` roles.
- **Breakpoints:** `sm=360 · md=768 · lg=1024 · xl=1440`.
- **Motion:** `dur-fast=120ms · dur-base=200ms · dur-slow=320ms`; easing (pinned)
  `standard=cubic-bezier(.2,0,0,1)`, `enter=cubic-bezier(0,0,0,1)` (decelerate),
  `exit=cubic-bezier(.4,0,1,1)` (accelerate).
- **Touch target:** `target-min=44` (accessibility floor, not a spacing token).

---

## Layer 2 — Grid (where edge-safety is mechanical)

The grid makes P1/P2 impossible to violate — the layout *cannot* produce an edge-touch.

| context | columns | gutter | outer margin (edge-safety min) | container max |
|---|---|---|---|---|
| mobile (`< md`) | 4 | `space-4` (16) | `space-4` (16) | 100% − 2× margin |
| tablet (`md`) | 8 | `space-5` (24) | `space-6` (32) | 720 |
| desktop (`≥ lg`) | 12 | `space-5` (24) | `space-6` (32) | 1024 (`xl`: 1200) |

- **Outer margin is the edge-safety guarantee.** No content region may reduce it below the
  breakpoint minimum. This is the mechanical form of P1.
- Element boxes snap to the 4px unit (P2). Column spans are integers; no fractional columns.

---

## Layer 3 — Component contract (+ code conventions)

Every component obeys this contract. This is where the *code* unifies.

**Token-only body.** Zero raw px/hex/font literals inside a component (P4). All visual
values are token references.

**API shape — enums, not boolean sprawl.**
- `variant` — enum (e.g. `primary | secondary | ghost | danger`). Never a pile of
  booleans (`isPrimary`, `isGhost`…).
- `size` — enum `sm | md | lg`, each mapping to a fixed token bundle (padding, type role,
  radius, min target).
- `state` — the **9 canonical states**: `default · hover · active · focus · disabled ·
  loading · error · selected · read-only`. Every interactive component defines all it
  supports explicitly.

**Spacing ownership.** A component never sets its own **outer** margin. Spacing *between*
components is owned by the parent/template. This is what stops pages from drifting — the
component is a citizen, the template is the city planner. (P3)

**Naming.**
- Tokens: dot or kebab, lowercase — `space-4`, `color.text.muted`, `type.body`.
- Components: `PascalCase`. Props: `camelCase`. Enum values: lowercase strings.
- No magic numbers anywhere; a value that isn't a token is a bug.

**File structure.** One component per folder (`index` + view + types); one tokens source
of truth; templates live apart from components. The tokens file is generated from this
spec via the adapter — hand-editing it is a violation.

---

## Layer 4 — Page templates ("same direction")

A page is **built from a template**, never hand-assembled (P3). Minimum set:

| template | regions | grid | notes |
|---|---|---|---|
| `list` | header · toolbar · content(rows) · footer | full | row rhythm = `space-3`; sections = `space-6` |
| `detail` | header · hero · body · aside · footer | 12/8-col split | aside gutter = `space-5` |
| `form` | header · fieldset(s) · actions | narrow (max 640) | field gap = `space-4`; group gap = `space-6` |
| `dashboard` | header · filter bar · card grid | 12-col | card gap = `space-5`; cards on `e2` |
| `empty / error` | icon · headline(`h2`) · body · action | centered | vertical rhythm from spacing scale only |

Each template declares: its regions, the grid it uses, the spacing tier between regions,
and its edge-safety outer margins (from Layer 2). Filling a template = drop components into
regions. No region is placed with arbitrary coordinates.

---

## Layer 5 — Audit checklist (the enforcement gate)

Each row returns **PASS / FAIL** with file:line and the fix. `audit` mode runs all rows;
`generate` self-checks against them before returning.

1. **P1** — No element flush to, or bisected by, **any** line: container edge (padding ≥
   gutter), internal divider/separator (≥ `space-3` clear on each side), or rounded corner
   (content inset ≥ radius). A label sitting *on* its divider is a FAIL.
2. **P2** — Every box edge on the 4px unit; no arbitrary offsets.
3. **P3** — Page is built from a named template, not hand-placed.
4. **P4** — Zero raw px/hex/color/font-size literals in components.
5. **P5** — Targets ≥ 44; text contrast ≥ 4.5:1; focus visible; color not sole signal.
6. Spacing values all drawn from the scale (no `5,10,18,20,30…`).
7. Type uses roles, never ad-hoc sizes.
8. Colors reference roles, never inline hues.
9. Component APIs use enums, not boolean sprawl.
10. Components set no outer margin — parent/template owns between-component spacing.

A target that fails any row is **not unified**. Report the row, the location, and the
token/template that resolves it.

---

## Adapter contract (what every `adapters/<stack>.md` must deliver)

An adapter is a *projection* of this spec — same values, native syntax. Each must provide:

1. **Token materialization** — every Layer 1 token in the stack's native form
   (CSS custom properties / `ThemeData` / Swift constants), with units. No token added,
   dropped, or re-valued.
2. **Grid materialization** — Layer 2 as the stack's layout primitives (CSS grid/flex,
   Flutter `LayoutBuilder`+constants, SwiftUI `Grid`/`GeometryReader`), including the
   edge-safety outer margins.
3. **Principle enforcement mapping** — how each of P1–P5 is enforced natively
   (lint rule, analyzer option, custom check, or grep pattern).
4. **`generate` snippets** — one compliant component (using the API contract) and one
   compliant page template, token-only.
5. **`audit` commands** — concrete greps/lints that flag each of the 10 checklist rows
   (e.g. a regex that finds raw hex or off-scale px in that stack's source).

Adapters must not restate rationale — that lives here. They are pure translation.
