# Unify Adapter — Web (CSS / React)

Pure projection of `core-spec.md` into CSS custom properties + React/Tailwind. Every value
below is **frozen by core-spec** — this file only adds units and syntax. No token is added,
dropped, renamed, or re-valued.

---

## Token materialization

`tokens.css` — generated from the spec; hand-editing is a Layer 3 violation.

```css
/* tokens.css — materialized from core-spec.md Layer 1 */
:root {
  /* Spacing — base unit = 4 */
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;

  /* Type family — token, never a literal */
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, "SF Mono", "Cascadia Code", Menlo, monospace;

  /* Type roles — size / line-height / weight */
  --type-caption-size: 12px;   --type-caption-line: 16px;   --type-caption-weight: 400;
  --type-body-sm-size: 14px;   --type-body-sm-line: 20px;   --type-body-sm-weight: 400;
  --type-body-size: 16px;      --type-body-line: 24px;      --type-body-weight: 400;
  --type-label-size: 14px;     --type-label-line: 20px;     --type-label-weight: 600;
  --type-h3-size: 20px;        --type-h3-line: 28px;        --type-h3-weight: 600;
  --type-h2-size: 24px;        --type-h2-line: 32px;        --type-h2-weight: 700;
  --type-h1-size: 32px;        --type-h1-line: 40px;        --type-h1-weight: 700;
  --type-display-size: 40px;   --type-display-line: 48px;   --type-display-weight: 700;

  /* Neutral ramp (light) */
  --neutral-0: #FFFFFF;
  --neutral-50: #F7F8FA;
  --neutral-100: #EEF0F3;
  --neutral-200: #E2E5EA;
  --neutral-300: #CBD0D8;
  --neutral-400: #9AA1AD;
  --neutral-500: #6B7280;
  --neutral-600: #4B5361;
  --neutral-700: #353B45;
  --neutral-800: #22262D;
  --neutral-900: #12141A;

  /* Accent ramp */
  --accent-500: #3B82F6;
  --accent-600: #2563EB;
  --accent-700: #1D4ED8;

  /* Status hues (from role defaults) */
  --green-600: #16A34A;
  --amber-500: #F59E0B;
  --red-600: #DC2626;
  --blue-600: #2563EB;

  /* Color roles — the only names components may reference */
  --color-bg: var(--neutral-0);
  --color-surface: var(--neutral-50);
  --color-surface-raised: var(--neutral-0);
  --color-border: var(--neutral-200);
  --color-border-strong: var(--neutral-300);
  --color-text: var(--neutral-900);
  --color-text-muted: var(--neutral-600);
  --color-text-subtle: var(--neutral-400);
  --color-primary: var(--accent-600);
  --color-on-primary: var(--neutral-0);
  --color-focus: var(--accent-500);
  --color-success: var(--green-600);     --color-on-success: var(--neutral-0);
  --color-warning: var(--amber-500);     --color-on-warning: var(--neutral-900);
  --color-danger: var(--red-600);        --color-on-danger: var(--neutral-0);
  --color-info: var(--blue-600);         --color-on-info: var(--neutral-0);

  /* Radius */
  --radius-0: 0;
  --radius-1: 4px;
  --radius-2: 8px;
  --radius-3: 12px;
  --radius-full: 9999px;

  /* Elevation — intent → native shadow (pairs with surface* roles) */
  --elevation-0: none;
  --elevation-1: 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --elevation-2: 0 2px 8px 0 rgba(0, 0, 0, 0.10);
  --elevation-3: 0 8px 24px 0 rgba(0, 0, 0, 0.16);

  /* Breakpoints (also exposed for JS/container queries) */
  --bp-sm: 360px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1440px;

  /* Motion */
  --dur-fast: 120ms;
  --dur-base: 200ms;
  --dur-slow: 320ms;
  --ease-standard: cubic-bezier(.2, 0, 0, 1);
  --ease-enter: cubic-bezier(0, 0, 0, 1);   /* decelerate */
  --ease-exit: cubic-bezier(.4, 0, 1, 1);   /* accelerate */

  /* Accessibility floor — not a spacing token */
  --target-min: 44px;
}
```

**Type role classes** — components reference roles, never raw sizes:

```css
.type-caption { font: var(--type-caption-weight) var(--type-caption-size)/var(--type-caption-line) var(--font-sans); }
.type-body-sm { font: var(--type-body-sm-weight) var(--type-body-sm-size)/var(--type-body-sm-line) var(--font-sans); }
.type-body    { font: var(--type-body-weight) var(--type-body-size)/var(--type-body-line) var(--font-sans); }
.type-label   { font: var(--type-label-weight) var(--type-label-size)/var(--type-label-line) var(--font-sans); }
.type-h3      { font: var(--type-h3-weight) var(--type-h3-size)/var(--type-h3-line) var(--font-sans); }
.type-h2      { font: var(--type-h2-weight) var(--type-h2-size)/var(--type-h2-line) var(--font-sans); }
.type-h1      { font: var(--type-h1-weight) var(--type-h1-size)/var(--type-h1-line) var(--font-sans); }
.type-display { font: var(--type-display-weight) var(--type-display-size)/var(--type-display-line) var(--font-sans); }
```

**Dark theme — remaps color ROLES only** (ramps and every other token are untouched;
components never know which theme is active):

```css
[data-theme="dark"] {
  --color-bg: var(--neutral-900);
  --color-surface: var(--neutral-800);
  --color-surface-raised: var(--neutral-700);
  --color-border: var(--neutral-700);
  --color-border-strong: var(--neutral-600);
  --color-text: var(--neutral-0);
  --color-text-muted: var(--neutral-400);
  --color-text-subtle: var(--neutral-500);
  --color-primary: var(--accent-500);
  --color-on-primary: var(--neutral-900);
  --color-focus: var(--accent-500);
  --color-success: var(--green-600);     --color-on-success: var(--neutral-0);
  --color-warning: var(--amber-500);     --color-on-warning: var(--neutral-900);
  --color-danger: var(--red-600);        --color-on-danger: var(--neutral-0);
  --color-info: var(--blue-600);         --color-on-info: var(--neutral-0);
}
```

**Tailwind `theme.extend`** — every entry dereferences the same vars (no re-hardcoded values):

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        0: "var(--space-0)", 1: "var(--space-1)", 2: "var(--space-2)", 3: "var(--space-3)",
        4: "var(--space-4)", 5: "var(--space-5)", 6: "var(--space-6)", 7: "var(--space-7)",
        8: "var(--space-8)", 9: "var(--space-9)",
      },
      colors: {
        bg: "var(--color-bg)", surface: "var(--color-surface)",
        "surface-raised": "var(--color-surface-raised)",
        border: "var(--color-border)", "border-strong": "var(--color-border-strong)",
        text: "var(--color-text)", "text-muted": "var(--color-text-muted)",
        "text-subtle": "var(--color-text-subtle)",
        primary: "var(--color-primary)", "on-primary": "var(--color-on-primary)",
        focus: "var(--color-focus)",
        success: "var(--color-success)", "on-success": "var(--color-on-success)",
        warning: "var(--color-warning)", "on-warning": "var(--color-on-warning)",
        danger: "var(--color-danger)", "on-danger": "var(--color-on-danger)",
        info: "var(--color-info)", "on-info": "var(--color-on-info)",
      },
      borderRadius: {
        0: "var(--radius-0)", 1: "var(--radius-1)", 2: "var(--radius-2)",
        3: "var(--radius-3)", full: "var(--radius-full)",
      },
      boxShadow: {
        e0: "var(--elevation-0)", e1: "var(--elevation-1)",
        e2: "var(--elevation-2)", e3: "var(--elevation-3)",
      },
      fontFamily: { sans: "var(--font-sans)", mono: "var(--font-mono)" },
      screens: {
        sm: "360px", md: "768px", lg: "1024px", xl: "1440px",
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)", enter: "var(--ease-enter)", exit: "var(--ease-exit)",
      },
      transitionDuration: {
        fast: "120ms", base: "200ms", slow: "320ms",
      },
    },
  },
};
```

---

## Grid materialization

Layer 2 grid. The outer margin is the mechanical form of P1 — a content region can never
reduce it below the breakpoint minimum.

```css
/* Container: centers content, guarantees edge-safety outer margins per breakpoint */
.u-container {
  margin-inline: auto;
  /* mobile (< md): outer margin = space-4 (16), max = 100% − 2× margin */
  padding-inline: var(--space-4);
  max-width: 100%;
}

@media (min-width: 768px) {  /* tablet (md) */
  .u-container {
    padding-inline: var(--space-6); /* outer margin = 32 */
    max-width: 720px;
  }
}

@media (min-width: 1024px) { /* desktop (lg) */
  .u-container {
    padding-inline: var(--space-6); /* outer margin = 32 */
    max-width: 1024px;
  }
}

@media (min-width: 1440px) { /* xl */
  .u-container { max-width: 1200px; }
}

/* Column grid — integer spans only, no fractional columns (P2) */
.u-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)); /* mobile: 4 cols */
  gap: var(--space-4);                              /* mobile gutter = 16 */
}

@media (min-width: 768px) {  /* tablet: 8 cols, gutter 24 */
  .u-grid { grid-template-columns: repeat(8, minmax(0, 1fr)); gap: var(--space-5); }
}

@media (min-width: 1024px) { /* desktop: 12 cols, gutter 24 */
  .u-grid { grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--space-5); }
}

/* Span helpers snap boxes to integer columns (P2). e.g.: */
.u-col-4  { grid-column: span 4; }
.u-col-6  { grid-column: span 6; }
.u-col-8  { grid-column: span 8; }
.u-col-12 { grid-column: span 12; }
```

---

## Principle enforcement (P1–P5)

| Principle | Native web mechanism |
|---|---|
| **P1 · Edge safety** | **Container edge:** layout only through `.u-container` (padding-inline = gutter token); Stylelint `declaration-property-value-disallowed-list` on `padding: 0` for containers; grep components that set `padding: 0` / negative margins on layout wrappers. **Internal divider:** any `<hr>`, `.divider`, or element with `border-top`/`border-bottom` must keep ≥ `space-3` (12px) padding/margin on the content on **each** side — Stylelint flags a `border-bottom`/`.divider` row whose block padding is `0` or `< var(--space-3)`; grep `border-(top\|bottom)`/`.divider` blocks lacking `padding: var(--space-3…9)`. **Rounded corner:** a `border-radius` container must inset children ≥ `r` (`padding ≥ var(--radius-*)`) so the curve never clips them — grep `border-radius` wrappers whose direct children set `padding: 0`. Grep is approximate: whether a label actually sits *on* a rule, or toolbar/traffic-light content is clipped by a specific corner, is a **visual reviewer / Playwright bounding-box check** — assert no child box lands within `space-3` of a rule or within `r` of a rounded corner. |
| **P2 · Grid alignment** | Stylelint `declaration-property-value-allowed-list` restricting `margin`/`padding`/`gap`/`top`/`left`/`width`/`height` to `var(--space-*)` / `var(--radius-*)`. Reject any raw `px` via regex `\b\d+px\b` in component CSS (see audit row 6). |
| **P3 · One direction / surface** | ESLint: pages must render a `<Template*>` root — custom rule / `no-restricted-syntax` forbidding raw `<div>` layout roots in `pages/**` and `app/**/page.tsx`. Grep pages for absence of `Template` import. |
| **P4 · Token-only** | Stylelint `color-no-hex` + `declaration-property-value-disallowed-list` (no raw hex, no raw `font-size`). ESLint `no-restricted-syntax` on JSX `style={{…}}` with literal px/hex. Grep `#[0-9a-fA-F]{3,6}` in `components/**`. |
| **P5 · Accessibility floor** | `min-height`/`min-width: var(--target-min)` on interactive base classes; eslint-plugin-jsx-a11y (`no-noninteractive-element-interactions`, `interactive-supports-focus`); axe-core in CI (contrast ≥ 4.5:1 / 3:1, focus visible); `:focus-visible { outline: 2px solid var(--color-focus); }` required, never `outline: none` without replacement. |

---

## Generate snippets

### (a) Compliant component — token-only, enum API, sets no outer margin

```tsx
// components/Button/types.ts
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonState = "default" | "loading" | "disabled";

// components/Button/Button.tsx
import type { ButtonVariant, ButtonSize } from "./types";
import "./button.css";

interface ButtonProps {
  variant?: ButtonVariant;   // enum, never isPrimary/isGhost booleans
  size?: ButtonSize;         // enum → fixed token bundle
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({
  variant = "primary", size = "md", loading = false, disabled = false, children, onClick,
}: ButtonProps) {
  return (
    <button
      className={`u-btn u-btn--${variant} u-btn--${size}`}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

```css
/* components/Button/button.css — zero raw px/hex; every value is a token */
.u-btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: var(--space-2);
  min-height: var(--target-min); min-width: var(--target-min); /* P5 */
  border: 1px solid transparent;
  border-radius: var(--radius-2);
  font: var(--type-label-weight) var(--type-label-size)/var(--type-label-line) var(--font-sans);
  cursor: pointer;
  transition: background-color var(--dur-fast) var(--ease-standard),
              box-shadow var(--dur-fast) var(--ease-standard);
  /* NOTE: no outer margin — the parent/template owns between-component spacing (P3) */
}
.u-btn:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; } /* P5 */

/* size → fixed token bundle */
.u-btn--sm { padding: var(--space-2) var(--space-3);
  font: var(--type-body-sm-weight) var(--type-body-sm-size)/var(--type-body-sm-line) var(--font-sans); }
.u-btn--md { padding: var(--space-3) var(--space-4); }
.u-btn--lg { padding: var(--space-4) var(--space-5);
  font: var(--type-body-weight) var(--type-body-size)/var(--type-body-line) var(--font-sans); }

/* variant → color roles only */
.u-btn--primary   { background: var(--color-primary); color: var(--color-on-primary); }
.u-btn--secondary { background: var(--color-surface); color: var(--color-text);
  border-color: var(--color-border-strong); }
.u-btn--ghost     { background: transparent; color: var(--color-primary); }
.u-btn--danger    { background: var(--color-danger); color: var(--color-on-danger); }

.u-btn:disabled, .u-btn[data-loading] { opacity: .6; cursor: not-allowed; }
```

### (b) Compliant page — built from the `form` template (Layer 4)

Regions: header · fieldset(s) · actions; narrow grid (max 640); field gap `space-4`,
group gap `space-6`. The template owns all spacing between regions and components.

```tsx
// components/TemplateForm/TemplateForm.tsx
import "./template-form.css";

export function TemplateForm({ header, fieldsets, actions }: {
  header: React.ReactNode; fieldsets: React.ReactNode[]; actions: React.ReactNode;
}) {
  return (
    <div className="u-container">
      <form className="tpl-form">
        <header className="tpl-form__header">{header}</header>
        {fieldsets.map((fs, i) => (
          <fieldset key={i} className="tpl-form__group">{fs}</fieldset>
        ))}
        <div className="tpl-form__actions">{actions}</div>
      </form>
    </div>
  );
}
```

```css
/* components/TemplateForm/template-form.css — spacing owned by the template (P3) */
.tpl-form { max-width: 640px; margin-inline: auto;
  display: flex; flex-direction: column; gap: var(--space-6); } /* group gap */
.tpl-form__header { color: var(--color-text);
  font: var(--type-h2-weight) var(--type-h2-size)/var(--type-h2-line) var(--font-sans); }
.tpl-form__group { border: 0; padding: 0;
  display: flex; flex-direction: column; gap: var(--space-4); } /* field gap */
.tpl-form__actions { display: flex; gap: var(--space-3); justify-content: flex-end; }
```

```tsx
// pages/SignUp.tsx — page = template + components, no hand-placed layout (P3)
import { TemplateForm } from "../components/TemplateForm/TemplateForm";
import { Button } from "../components/Button/Button";

export default function SignUp() {
  return (
    <TemplateForm
      header={<h1>Create account</h1>}
      fieldsets={[
        <>
          <label className="type-label" htmlFor="email">Email</label>
          <input id="email" className="u-input" type="email" />
          <label className="type-label" htmlFor="pw">Password</label>
          <input id="pw" className="u-input" type="password" />
        </>,
      ]}
      actions={
        <>
          <Button variant="ghost" size="md">Cancel</Button>
          <Button variant="primary" size="md">Sign up</Button>
        </>
      }
    />
  );
}
```

---

## Audit commands

Layer 5 checklist → concrete web checks. Run against `components/**` and `src/**` (adjust
globs). Each is designed to be a FAIL gate.

```bash
# 1 · P1 — edge safety: container edge, internal divider, AND rounded corner
# (a) container/layout wrappers that kill their edge-safety padding
grep -rniE 'padding(-inline)?\s*:\s*0(px|;| )|margin(-inline)?\s*:\s*-' components/ src/
# (b) divider rows — <hr>, .divider, or border-top/bottom lacking ≥12px padding each side
grep -rniE 'border-(top|bottom)\s*:|\.divider\b|<hr\b' components/ src/ \
  | grep -vE 'padding[^;]*var\(--space-[3-9]'   # flag rules whose block lacks ≥ space-3 padding
# (c) rounded-corner containers whose children may lack corner inset ≥ r (candidates)
grep -rniE 'border-radius\s*:\s*var\(--radius-[23]' components/ src/
# NOTE: (b) and (c) only surface CANDIDATES. Whether a label actually sits ON its rule, or
# content is clipped by the corner curve, needs a VISUAL reviewer / Playwright bounding-box
# assertion (no child box within space-3 of a rule, nor within r of a rounded corner).

# 2 · P2 — arbitrary offsets: raw px anywhere in component CSS (must be var(--space-*))
grep -rnE '\b[0-9]+px\b' components/ src/**/*.css \
  | grep -vE 'var\(--|1px solid|0px'   # 1px hairline borders are the only allowed literal

# 3 · P3 — pages not built from a template (no Template* root import)
for f in $(grep -rL 'Template' pages/ app/ --include='*.tsx' 2>/dev/null); do echo "no template: $f"; done

# 4 · P4 — raw hex or inline style literals inside components
grep -rniE '#[0-9a-fA-F]{3,6}\b' components/                     # raw hex
grep -rnE 'style=\{\{[^}]*(px|#[0-9a-fA-F]{3,6})' components/     # inline literal px/hex in JSX

# 5 · P5 — a11y: killed focus, undersized targets, missing labels
grep -rnE 'outline\s*:\s*none' components/ src/ | grep -v ':focus-visible'  # focus removed
npx eslint --plugin jsx-a11y 'components/**/*.tsx'                          # roles/labels/focus
npx axe --stdout http://localhost:3000                                     # contrast ≥4.5:1 / focus visible

# 6 · Off-scale spacing — the classic non-multiples of the 4 scale
grep -rnE '\b(5|10|18|20|30|15|25|35)px\b' components/ src/

# 7 · Type — ad-hoc font sizes instead of roles/vars
grep -rnE 'font-size\s*:\s*[0-9]' components/ src/ | grep -v 'var(--type-'

# 8 · Color — inline hues instead of role vars
grep -rniE '(color|background|border-color)\s*:\s*(#[0-9a-fA-F]{3,6}|rgb|hsl)' components/ \
  | grep -v 'var(--color-'

# 9 · Boolean sprawl in component APIs instead of enums
grep -rnE 'is[A-Z][a-zA-Z]+\??\s*:\s*boolean' components/**/types.ts components/**/*.tsx

# 10 · Components setting their own outer margin (parent/template owns it)
grep -rnE 'margin(-top|-bottom|-left|-right|-inline|-block)?\s*:' components/ \
  | grep -vE 'margin-inline\s*:\s*auto|var\(--space'   # only centering / token gaps allowed
```

Stylelint config that encodes rows 2/4/7/8 as a build gate:

```json
{
  "rules": {
    "color-no-hex": true,
    "declaration-property-value-disallowed-list": {
      "/^(padding|margin|gap|top|left|right|bottom|width|height)$/": ["/\\b\\d+px\\b/"],
      "font-size": ["/^[0-9]/"],
      "/color/": ["/#[0-9a-fA-F]{3,6}/", "/rgb/", "/hsl/"]
    }
  }
}
```
