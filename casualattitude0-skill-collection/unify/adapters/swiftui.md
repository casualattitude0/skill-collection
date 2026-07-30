# Unify Adapter — SwiftUI (Swift)

Native projection of `core-spec.md` for SwiftUI. **Every value below is frozen by
core-spec** — this file only adds Swift syntax and units; it never adds, drops, renames, or
re-values a token.

---

## Token materialization

`DesignTokens` is the one source of truth in-app (generated from the spec; hand-editing it
is a P4 violation). Namespaced caseless enums so nothing is instantiable.

```swift
import SwiftUI

enum DesignTokens {

    // MARK: Spacing — base unit = 4 (CGFloat, points)
    enum Space {
        static let s0: CGFloat = 0    // space-0 · 0×
        static let s1: CGFloat = 4    // space-1 · 1×
        static let s2: CGFloat = 8    // space-2 · 2×
        static let s3: CGFloat = 12   // space-3 · 3×
        static let s4: CGFloat = 16   // space-4 · 4×
        static let s5: CGFloat = 24   // space-5 · 6×
        static let s6: CGFloat = 32   // space-6 · 8×
        static let s7: CGFloat = 48   // space-7 · 12×
        static let s8: CGFloat = 64   // space-8 · 16×
        static let s9: CGFloat = 96   // space-9 · 24×
    }

    // MARK: Radius
    enum Radius {
        static let r0: CGFloat = 0
        static let r1: CGFloat = 4
        static let r2: CGFloat = 8
        static let r3: CGFloat = 12
        static let full: CGFloat = 9999
    }

    // MARK: Breakpoints (min width, points)
    enum Breakpoint {
        static let sm: CGFloat = 360
        static let md: CGFloat = 768
        static let lg: CGFloat = 1024
        static let xl: CGFloat = 1440
    }

    // MARK: Accessibility floor (not a spacing token)
    static let targetMin: CGFloat = 44

    // MARK: Type — role → size / lineSpacing / weight
    // SwiftUI lineSpacing is EXTRA leading, so lineSpacing = line-height − size.
    enum TypeRole {
        case caption, bodySm, body, label, h3, h2, h1, display

        var size: CGFloat {
            switch self {
            case .caption: return 12
            case .bodySm:  return 14
            case .body:    return 16
            case .label:   return 14
            case .h3:      return 20
            case .h2:      return 24
            case .h1:      return 32
            case .display: return 40
            }
        }
        var weight: Font.Weight {
            switch self {
            case .caption, .bodySm, .body:      return .regular   // 400
            case .label, .h3:                   return .semibold  // 600
            case .h2, .h1, .display:            return .bold      // 700
            }
        }
        /// line-height − size (extra leading SwiftUI adds between lines)
        var lineSpacing: CGFloat {
            switch self {
            case .caption: return 16 - 12   // 4
            case .bodySm:  return 20 - 14   // 6
            case .body:    return 24 - 16   // 8
            case .label:   return 20 - 14   // 6
            case .h3:      return 28 - 20   // 8
            case .h2:      return 32 - 24   // 8
            case .h1:      return 40 - 32   // 8
            case .display: return 48 - 40   // 8
            }
        }
        // One family token; use .monospaced design for the optional mono role.
        var font: Font { .system(size: size, weight: weight) }
    }

    // MARK: Motion
    enum Motion {
        static let durFast: Double = 0.120   // dur-fast 120ms
        static let durBase: Double = 0.200   // dur-base 200ms
        static let durSlow: Double = 0.320   // dur-slow 320ms
        // standard = cubic-bezier(.2,0,0,1)
        static func standard(_ d: Double) -> Animation { .timingCurve(0.2, 0, 0, 1, duration: d) }
        // enter = decelerate, exit = accelerate
        static func enter(_ d: Double) -> Animation { .timingCurve(0, 0, 0, 1, duration: d) }
        static func exit(_ d: Double)  -> Animation { .timingCurve(0.4, 0, 1, 1, duration: d) }
    }
}
```

### Colors — semantic roles resolving light/dark by remap only

Roles are `Color`s built from the frozen hex ramps. A component references **roles**, never
ramp steps or hues. Dark mode **remaps which ramp step a role points to** — the ramp hexes
never change. `dyn` returns a dynamic `Color` so components never read `colorScheme`.

```swift
extension DesignTokens {

    // Ramps (frozen hexes → sRGB). Private: components may not touch steps.
    private enum Ramp {
        // neutral 0…900
        static let n0   = Color(red: 1.000, green: 1.000, blue: 1.000)  // #FFFFFF
        static let n50  = Color(red: 0.969, green: 0.973, blue: 0.980)  // #F7F8FA
        static let n100 = Color(red: 0.933, green: 0.941, blue: 0.953)  // #EEF0F3
        static let n200 = Color(red: 0.886, green: 0.898, blue: 0.918)  // #E2E5EA
        static let n300 = Color(red: 0.796, green: 0.816, blue: 0.847)  // #CBD0D8
        static let n400 = Color(red: 0.604, green: 0.631, blue: 0.678)  // #9AA1AD
        static let n500 = Color(red: 0.420, green: 0.447, blue: 0.502)  // #6B7280
        static let n600 = Color(red: 0.294, green: 0.325, blue: 0.380)  // #4B5361
        static let n700 = Color(red: 0.208, green: 0.231, blue: 0.271)  // #353B45
        static let n800 = Color(red: 0.133, green: 0.149, blue: 0.176)  // #22262D
        static let n900 = Color(red: 0.071, green: 0.078, blue: 0.102)  // #12141A
        // accent 500…700
        static let a500 = Color(red: 0.231, green: 0.510, blue: 0.965)  // #3B82F6
        static let a600 = Color(red: 0.145, green: 0.388, blue: 0.922)  // #2563EB
        static let a700 = Color(red: 0.114, green: 0.306, blue: 0.847)  // #1D4ED8
        // status (pinned by core-spec)
        static let green600 = Color(red: 0.086, green: 0.639, blue: 0.290)  // #16A34A
        static let amber500 = Color(red: 0.961, green: 0.620, blue: 0.043)  // #F59E0B
        static let red600   = Color(red: 0.863, green: 0.149, blue: 0.149)  // #DC2626
        static let blue600  = a600                                          // #2563EB
    }

    /// Dynamic color: light step vs dark step of the SAME frozen ramp.
    private static func dyn(_ light: Color, _ dark: Color) -> Color {
        Color(uiColor: UIColor { $0.userInterfaceStyle == .dark
            ? UIColor(dark) : UIColor(light) })
    }

    enum Palette {
        // role                       light step        dark step (remap only)
        static let bg            = dyn(Ramp.n0,   Ramp.n900)
        static let surface       = dyn(Ramp.n50,  Ramp.n800)
        static let surfaceRaised = dyn(Ramp.n0,   Ramp.n700)
        static let border        = dyn(Ramp.n200, Ramp.n700)
        static let borderStrong  = dyn(Ramp.n300, Ramp.n600)
        static let text          = dyn(Ramp.n900, Ramp.n0)
        static let textMuted     = dyn(Ramp.n600, Ramp.n400)
        static let textSubtle    = dyn(Ramp.n400, Ramp.n500)
        static let primary       = dyn(Ramp.a600, Ramp.a500)
        static let onPrimary     = dyn(Ramp.n0,   Ramp.n900)
        static let focus         = dyn(Ramp.a500, Ramp.a500)
        static let success       = dyn(Ramp.green600, Ramp.green600)
        static let onSuccess     = dyn(Ramp.n0,   Ramp.n0)
        static let warning       = dyn(Ramp.amber500, Ramp.amber500)
        static let onWarning     = dyn(Ramp.n900, Ramp.n900)
        static let danger        = dyn(Ramp.red600, Ramp.red600)
        static let onDanger      = dyn(Ramp.n0,   Ramp.n0)
        static let info          = dyn(Ramp.blue600, Ramp.blue600)
        static let onInfo        = dyn(Ramp.n0,   Ramp.n0)
    }

    // MARK: Elevation — intent → native shadow (pairs with a surface* role)
    struct Elevation {
        let color: Color, radius: CGFloat, x: CGFloat, y: CGFloat
        static let e0 = Elevation(color: .clear,                       radius: 0,  x: 0, y: 0)
        static let e1 = Elevation(color: .black.opacity(0.06),         radius: 2,  x: 0, y: 1)
        static let e2 = Elevation(color: .black.opacity(0.10),         radius: 8,  x: 0, y: 2)
        static let e3 = Elevation(color: .black.opacity(0.16),         radius: 24, x: 0, y: 8)
    }
}

// Reusable modifiers so components stay literal-free.
extension View {
    func typeStyle(_ r: DesignTokens.TypeRole) -> some View {
        self.font(r.font).lineSpacing(r.lineSpacing)
    }
    func elevation(_ e: DesignTokens.Elevation) -> some View {
        self.shadow(color: e.color, radius: e.radius, x: e.x, y: e.y)
    }
}
```

---

## Grid materialization

Layer 2, driven by `GeometryReader` width → breakpoint. Outer margin is the mechanical
edge-safety guarantee (P1); columns/gutters/max-widths are frozen.

```swift
struct GridSpec {
    let columns: Int
    let gutter: CGFloat
    let outerMargin: CGFloat   // edge-safety minimum
    let maxWidth: CGFloat?     // nil = 100% − 2× margin

    static func resolve(width: CGFloat) -> GridSpec {
        if width >= DesignTokens.Breakpoint.lg {            // desktop ≥ lg
            let max: CGFloat = width >= DesignTokens.Breakpoint.xl ? 1200 : 1024
            return GridSpec(columns: 12, gutter: DesignTokens.Space.s5,
                            outerMargin: DesignTokens.Space.s6, maxWidth: max)
        } else if width >= DesignTokens.Breakpoint.md {     // tablet md
            return GridSpec(columns: 8, gutter: DesignTokens.Space.s5,
                            outerMargin: DesignTokens.Space.s6, maxWidth: 720)
        } else {                                            // mobile < md
            return GridSpec(columns: 4, gutter: DesignTokens.Space.s4,
                            outerMargin: DesignTokens.Space.s4, maxWidth: nil)
        }
    }
}

/// Applies edge-safety outer margins + max-width. Content never touches the frame (P1).
struct UnifyContainer<Content: View>: View {
    @ViewBuilder var content: (GridSpec) -> Content
    var body: some View {
        GeometryReader { geo in
            let spec = GridSpec.resolve(width: geo.size.width)
            HStack(spacing: 0) {
                Spacer(minLength: spec.outerMargin)
                content(spec)
                    .frame(maxWidth: spec.maxWidth ?? .infinity)
                Spacer(minLength: spec.outerMargin)
            }
        }
    }
}

/// A token-gutter column grid (P2: integer spans, edges on the 4px unit).
struct UnifyGrid<Content: View>: View {
    let spec: GridSpec
    @ViewBuilder var content: Content
    var body: some View {
        let cols = Array(repeating: GridItem(.flexible(), spacing: spec.gutter),
                         count: spec.columns)
        LazyVGrid(columns: cols, spacing: spec.gutter) { content }
    }
}
```

---

## Principle enforcement (P1–P5)

| Principle | SwiftUI-native enforcement mechanism |
|---|---|
| **P1 · Edge safety** | **Container edge:** screens must wrap content in `UnifyContainer` (applies `outerMargin`); build-phase grep flags root `.padding(0)` / `.padding(.horizontal, 0)` and top-level views not enclosed by `UnifyContainer`; SwiftLint bans `.ignoresSafeArea` on content containers. **Internal divider:** a `Divider()` must have ≥ `DesignTokens.Space.s3` (12) `.padding` on the neighboring views on **each** side — SwiftLint custom rule `divider_needs_padding` flags a `Divider()` whose adjacent view in the stack has no `.padding(≥ s3)` (a label must never sit on its rule); grep `rg -n 'Divider\(\)' -A2 --glob '*.swift' \| rg -L '\.padding'`. **Rounded corner:** a `.cornerRadius(r)` / `RoundedRectangle` / `.clipShape(RoundedRectangle…)` container must inset its content ≥ `r` (`.padding(≥ that radius)`) so the curve never clips it — grep `rg -n '\.cornerRadius\(\|RoundedRectangle\|\.clipShape\(' -A3 --glob '*.swift' \| rg -L '\.padding'`. Grep is approximate: whether a label truly sits *on* the rule, or toolbar/traffic-light content is clipped by the window's rounded corner, is a **snapshot/visual review** asserting no content paints within `s3` of a `Divider` or within `r` of a rounded corner. |
| **P2 · Grid alignment** | SwiftLint `no_offscale_cgfloat`: any numeric `.padding/.frame/.offset/spacing:` literal not in `{0,4,8,12,16,24,32,48,64,96}` fails. Off-4px offsets are rejected at review. |
| **P3 · One direction** | SwiftLint `screen_uses_template`: a `View` name ending in `Screen`/`Page` must compose a `*Template` view (see Layer 4) and must not declare raw `VStack`/`ZStack` roots. Build-phase grep enforces the `*Template` suffix presence. |
| **P4 · Token-only** | SwiftLint `no_literal_design_values`: bans `Color(red:…)`, `Color(hex:`, `.font(.system(size:`, and bare numeric spacing literals **outside `DesignTokens.swift`** (regex path exclusion). Any color/size/font literal in a component is a build failure. |
| **P5 · Accessibility floor** | SwiftLint + analyzer: interactive views must set `.frame(minWidth: DesignTokens.targetMin, minHeight: DesignTokens.targetMin)`; grep flags `.frame(width:` on tappables below 44. Focus: `.focusable`/`.focused` + visible `Palette.focus` ring required. Contrast checked with a `xcrun`-driven script against `Palette` pairs; color-only signaling flagged in review (icon/label required alongside `success/warning/danger`). |

---

## Generate snippets

### (a) Compliant component — `UnifyButton`

Enum `variant`/`size`/`state`; token-only; sets **no outer margin** (parent owns spacing).

```swift
struct UnifyButton: View {
    enum Variant { case primary, secondary, ghost, danger }
    enum Size { case sm, md, lg }
    // 9 canonical states; this component supports the interactive subset explicitly.
    enum State { case `default`, hover, active, focus, disabled, loading, selected }

    let title: String
    var variant: Variant = .primary
    var size: Size = .md
    var state: State = .default
    let action: () -> Void

    private var type: DesignTokens.TypeRole {
        switch size { case .sm: return .bodySm; case .md: return .label; case .lg: return .body }
    }
    private var padH: CGFloat {
        switch size { case .sm: return DesignTokens.Space.s3
                      case .md: return DesignTokens.Space.s4
                      case .lg: return DesignTokens.Space.s5 }
    }
    private var padV: CGFloat {
        switch size { case .sm: return DesignTokens.Space.s2; default: return DesignTokens.Space.s3 }
    }
    private var fg: Color {
        switch variant { case .primary: return DesignTokens.Palette.onPrimary
                         case .danger:  return DesignTokens.Palette.onDanger
                         case .secondary, .ghost: return DesignTokens.Palette.text }
    }
    private var bg: Color {
        switch variant { case .primary: return DesignTokens.Palette.primary
                         case .danger:  return DesignTokens.Palette.danger
                         case .secondary: return DesignTokens.Palette.surface
                         case .ghost: return .clear }
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: DesignTokens.Space.s2) {
                if state == .loading { ProgressView().tint(fg) }
                Text(title).typeStyle(type)
            }
            .frame(minWidth: DesignTokens.targetMin, minHeight: DesignTokens.targetMin) // P5
            .padding(.horizontal, padH)
            .padding(.vertical, padV)
            .foregroundStyle(fg)
            .background(bg)
            .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.r2)
                .stroke(variant == .secondary ? DesignTokens.Palette.border : .clear))
            .clipShape(RoundedRectangle(cornerRadius: DesignTokens.Radius.r2))
            .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.r2) // visible focus
                .stroke(DesignTokens.Palette.focus, lineWidth: state == .focus ? 2 : 0))
            .opacity(state == .disabled ? 0.5 : 1)
        }
        .disabled(state == .disabled || state == .loading)
        .animation(DesignTokens.Motion.standard(DesignTokens.Motion.durFast), value: state)
        // No .padding on the outer Button — parent/template owns between-component spacing (P3).
    }
}
```

### (b) Compliant screen — `form` template (Layer 4)

Narrow (max 640); field gap `space-4`, group gap `space-6`. Composed from regions; no
arbitrary coordinates; components carry no outer margin.

```swift
struct SignInScreen: View { var body: some View { FormTemplate(
    header: { Text("Sign in").typeStyle(.h2).foregroundStyle(DesignTokens.Palette.text) },
    fieldsets: {
        VStack(alignment: .leading, spacing: DesignTokens.Space.s6) {   // group gap
            VStack(alignment: .leading, spacing: DesignTokens.Space.s4) { // field gap
                LabeledField(label: "Email", text: .constant(""))
                LabeledField(label: "Password", text: .constant(""))
            }
        }
    },
    actions: {
        UnifyButton(title: "Continue", variant: .primary, size: .lg) {}
    }
) } }

/// `form` template: header · fieldset(s) · actions — narrow max 640, edge-safe.
struct FormTemplate<H: View, F: View, A: View>: View {
    @ViewBuilder var header: H
    @ViewBuilder var fieldsets: F
    @ViewBuilder var actions: A
    var body: some View {
        UnifyContainer { _ in
            VStack(alignment: .leading, spacing: DesignTokens.Space.s6) { // region tier
                header
                fieldsets
                actions
            }
            .frame(maxWidth: 640, alignment: .leading)
            .padding(.vertical, DesignTokens.Space.s6)
        }
        .background(DesignTokens.Palette.bg)
    }
}

struct LabeledField: View {
    let label: String
    @Binding var text: String
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.Space.s2) {
            Text(label).typeStyle(.label).foregroundStyle(DesignTokens.Palette.textMuted)
            TextField("", text: $text)
                .typeStyle(.body)
                .frame(minHeight: DesignTokens.targetMin)          // P5
                .padding(.horizontal, DesignTokens.Space.s3)
                .background(DesignTokens.Palette.surface)
                .clipShape(RoundedRectangle(cornerRadius: DesignTokens.Radius.r2))
                .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.r2)
                    .stroke(DesignTokens.Palette.border))
        }
    }
}
```

---

## Audit commands

Run over `**/*.swift`. `TOKENS=DesignTokens.swift` is the only file allowed to hold raw
values; every audit excludes it. Provide these as SwiftLint custom rules and/or CI greps.

| # | Row (Layer 5) | Concrete SwiftUI check |
|---|---|---|
| 1 | **P1** edge safety (edge · divider · corner) | **Edge:** `rg -n '\.padding\(\s*(\.horizontal\s*,\s*)?0\s*\)' --glob '*.swift'` + screens `rg -Ln 'struct \w+(Screen\|Page)' --glob '*.swift' \| xargs rg -L 'UnifyContainer'` (a screen with no container fails). **Divider:** `rg -n 'Divider\(\)' -A2 --glob '*.swift' \| rg -L '\.padding'` — a rule whose neighbors have no `.padding` ≥ `Space.s3` (label on its divider). **Corner:** `rg -n '\.cornerRadius\(\|RoundedRectangle\|\.clipShape\(' -A3 --glob '*.swift' \| rg -L '\.padding'` — rounded/clipped containers whose content lacks a corner-safe inset ≥ `r` (e.g. traffic-light content near a rounded window edge). Greps only surface candidates; actual bisection by the rule or clipping by the curve needs a **snapshot/visual review**. |
| 2 | **P2** edges on 4px unit | `rg -n '\.(padding\|offset\|frame\|cornerRadius)\([^)]*\b(1\|2\|3\|5\|6\|7\|9\|10\|11\|13\|14\|15\|17\|18\|19\|20\|21\|22\|23\|25\|30\|36\|40\|50\|60)\b' --glob '*.swift' -g '!DesignTokens.swift'`. |
| 3 | **P3** built from a template | `rg -Ln 'struct \w+(Screen\|Page): View' --glob '*.swift' \| xargs rg -L '\w+Template'` lists screens that never compose a `*Template` → FAIL. |
| 4 | **P4** no raw px/hex/color/font literal | `rg -n 'Color\((red:\|hex:\|#)\|\.font\(\.system\(size:\|UIColor\(red:' --glob '*.swift' -g '!DesignTokens.swift'`. |
| 5 | **P5** target ≥44 / contrast / focus | Tappables under 44: `rg -n 'Button\|onTapGesture\|TextField' -l --glob '*.swift' \| xargs rg -L 'targetMin'`. Focus: `rg -Ln '\.focus' --glob '*.swift'` missing on interactive views. Contrast: script asserts `Palette` fg/bg pairs ≥ 4.5:1 (body) / 3:1 (UI). |
| 6 | Spacing off-scale (`5,10,18,20,30…`) | `rg -n '(padding\|spacing:\|frame\([^)]*(width\|height):)\s*[,:]?\s*(5\|10\|18\|20\|30)\b' --glob '*.swift' -g '!DesignTokens.swift'`. |
| 7 | Type uses roles not ad-hoc sizes | `rg -n '\.font\(\.system\(size:\|\.font\(\.custom\(' --glob '*.swift' -g '!DesignTokens.swift'` (any direct size = FAIL; must be `.typeStyle(.role)`). |
| 8 | Colors reference roles not inline hues | `rg -n 'Color\((red:\|green:\|hex:)\|\.foregroundColor\(Color\(' --glob '*.swift' -g '!DesignTokens.swift'` (must be `Palette.*`). |
| 9 | Enums not boolean sprawl | `rg -n 'var is[A-Z]\w*\s*:\s*Bool\|let is[A-Z]\w*\s*:\s*Bool' --glob '*.swift'` inside `View` structs → prefer `variant/size/state` enums. |
| 10 | Components set no outer margin | `rg -n 'struct \w+: View' -A40 --glob '*.swift' \| rg -n '^\s*}\s*$\|\.padding' ` — flag a trailing `.padding(` applied to the component's outermost returned view; spacing between components must live in the parent/template. |
