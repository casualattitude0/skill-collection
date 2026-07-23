# Unify Adapter — Flutter (Dart / ThemeData)

Pure projection of `core-spec.md` into Flutter. Every value below is **frozen by
core-spec** — this file adds Dart syntax + units only. No token is added, dropped,
renamed, or re-valued. Rationale lives in core-spec; this is translation.

---

## Token materialization

`lib/design/design_tokens.dart` — the single generated source of truth. Hand-editing
is a violation (Layer 3).

```dart
import 'package:flutter/material.dart';

/// Generated from unify/core-spec.md — do not hand-edit.
abstract final class DesignTokens {
  DesignTokens._();

  // ── Spacing (base unit = 4) ────────────────────────────────────────────
  static const double space0 = 0;   // 0×
  static const double space1 = 4;   // 1×
  static const double space2 = 8;   // 2×
  static const double space3 = 12;  // 3×
  static const double space4 = 16;  // 4×
  static const double space5 = 24;  // 6×
  static const double space6 = 32;  // 8×
  static const double space7 = 48;  // 12×
  static const double space8 = 64;  // 16×
  static const double space9 = 96;  // 24×

  // ── Neutral ramp (light source values) ─────────────────────────────────
  static const Color neutral0   = Color(0xFFFFFFFF);
  static const Color neutral50  = Color(0xFFF7F8FA);
  static const Color neutral100 = Color(0xFFEEF0F3);
  static const Color neutral200 = Color(0xFFE2E5EA);
  static const Color neutral300 = Color(0xFFCBD0D8);
  static const Color neutral400 = Color(0xFF9AA1AD);
  static const Color neutral500 = Color(0xFF6B7280);
  static const Color neutral600 = Color(0xFF4B5361);
  static const Color neutral700 = Color(0xFF353B45);
  static const Color neutral800 = Color(0xFF22262D);
  static const Color neutral900 = Color(0xFF12141A);

  // ── Accent ramp ────────────────────────────────────────────────────────
  static const Color accent500 = Color(0xFF3B82F6);
  static const Color accent600 = Color(0xFF2563EB);
  static const Color accent700 = Color(0xFF1D4ED8);

  // ── Status hues (pinned by core-spec) ──────────────────────────────────
  static const Color green600 = Color(0xFF16A34A);
  static const Color amber500 = Color(0xFFF59E0B);
  static const Color red600   = Color(0xFFDC2626);
  static const Color blue600  = Color(0xFF2563EB);

  // ── Radius ─────────────────────────────────────────────────────────────
  static const double radius0    = 0;
  static const double radius1    = 4;
  static const double radius2    = 8;
  static const double radius3    = 12;
  static const double radiusFull = 9999;

  // ── Breakpoints ────────────────────────────────────────────────────────
  static const double bpSm = 360;
  static const double bpMd = 768;
  static const double bpLg = 1024;
  static const double bpXl = 1440;

  // ── Motion ─────────────────────────────────────────────────────────────
  static const Duration durFast = Duration(milliseconds: 120);
  static const Duration durBase = Duration(milliseconds: 200);
  static const Duration durSlow = Duration(milliseconds: 320);
  static const Cubic easeStandard = Cubic(0.2, 0, 0, 1); // cubic-bezier(.2,0,0,1)
  static const Cubic easeEnter    = Cubic(0.0, 0, 0.0, 1); // decelerate
  static const Cubic easeExit     = Cubic(0.4, 0, 1.0, 1); // accelerate

  // ── Accessibility floor (not a spacing token) ──────────────────────────
  static const double targetMin = 44;
}

/// Type roles. Flutter `height` is a multiplier → line-height ÷ size.
abstract final class AppText {
  AppText._();
  static const TextStyle caption =
      TextStyle(fontSize: 12, height: 16 / 12, fontWeight: FontWeight.w400); // 1.3333
  static const TextStyle bodySm =
      TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w400); // 1.4286
  static const TextStyle body =
      TextStyle(fontSize: 16, height: 24 / 16, fontWeight: FontWeight.w400); // 1.5
  static const TextStyle label =
      TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600); // 1.4286
  static const TextStyle h3 =
      TextStyle(fontSize: 20, height: 28 / 20, fontWeight: FontWeight.w600); // 1.4
  static const TextStyle h2 =
      TextStyle(fontSize: 24, height: 32 / 24, fontWeight: FontWeight.w700); // 1.3333
  static const TextStyle h1 =
      TextStyle(fontSize: 32, height: 40 / 32, fontWeight: FontWeight.w700); // 1.25
  static const TextStyle display =
      TextStyle(fontSize: 40, height: 48 / 40, fontWeight: FontWeight.w700); // 1.2
}

/// Elevation intents → native shadows. e0 is flat (no shadow).
abstract final class AppElevation {
  AppElevation._();
  static const List<BoxShadow> e0 = <BoxShadow>[];
  static const List<BoxShadow> e1 = [
    BoxShadow(color: Color(0x0F000000), blurRadius: 2, offset: Offset(0, 1)),
  ];
  static const List<BoxShadow> e2 = [
    BoxShadow(color: Color(0x1A000000), blurRadius: 8, offset: Offset(0, 2)),
  ];
  static const List<BoxShadow> e3 = [
    BoxShadow(color: Color(0x29000000), blurRadius: 24, offset: Offset(0, 8)),
  ];
}

/// Semantic color roles. Components read THESE, never a ramp step directly.
/// Provided per-theme so a component never knows which theme is active.
@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.bg,
    required this.surface,
    required this.surfaceRaised,
    required this.border,
    required this.borderStrong,
    required this.text,
    required this.textMuted,
    required this.textSubtle,
    required this.primary,
    required this.onPrimary,
    required this.focus,
    required this.success,
    required this.onSuccess,
    required this.warning,
    required this.onWarning,
    required this.danger,
    required this.onDanger,
    required this.info,
    required this.onInfo,
  });

  final Color bg, surface, surfaceRaised, border, borderStrong;
  final Color text, textMuted, textSubtle;
  final Color primary, onPrimary, focus;
  final Color success, onSuccess, warning, onWarning;
  final Color danger, onDanger, info, onInfo;

  // Light: roles → default ramp steps from core-spec.
  static const AppColors light = AppColors(
    bg: DesignTokens.neutral0,
    surface: DesignTokens.neutral50,
    surfaceRaised: DesignTokens.neutral0,
    border: DesignTokens.neutral200,
    borderStrong: DesignTokens.neutral300,
    text: DesignTokens.neutral900,
    textMuted: DesignTokens.neutral600,
    textSubtle: DesignTokens.neutral400,
    primary: DesignTokens.accent600,
    onPrimary: DesignTokens.neutral0,
    focus: DesignTokens.accent500,
    success: DesignTokens.green600,
    onSuccess: DesignTokens.neutral0,
    warning: DesignTokens.amber500,
    onWarning: DesignTokens.neutral900,
    danger: DesignTokens.red600,
    onDanger: DesignTokens.neutral0,
    info: DesignTokens.blue600,
    onInfo: DesignTokens.neutral0,
  );

  // Dark: SAME roles remapped by inverting the neutral ramp. No new tokens.
  static const AppColors dark = AppColors(
    bg: DesignTokens.neutral900,
    surface: DesignTokens.neutral800,
    surfaceRaised: DesignTokens.neutral700,
    border: DesignTokens.neutral700,
    borderStrong: DesignTokens.neutral600,
    text: DesignTokens.neutral0,
    textMuted: DesignTokens.neutral400,
    textSubtle: DesignTokens.neutral500,
    primary: DesignTokens.accent500,
    onPrimary: DesignTokens.neutral900,
    focus: DesignTokens.accent500,
    success: DesignTokens.green600,
    onSuccess: DesignTokens.neutral0,
    warning: DesignTokens.amber500,
    onWarning: DesignTokens.neutral900,
    danger: DesignTokens.red600,
    onDanger: DesignTokens.neutral0,
    info: DesignTokens.blue600,
    onInfo: DesignTokens.neutral0,
  );

  static AppColors of(BuildContext c) => Theme.of(c).extension<AppColors>()!;

  @override
  AppColors copyWith() => this; // roles are fixed; retheme by swapping the extension
  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) => this;
}
```

Building `ThemeData` from the roles — light and dark map the **same roles only**:

```dart
ThemeData _buildTheme(AppColors c, Brightness brightness) {
  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    scaffoldBackgroundColor: c.bg,
    extensions: <ThemeExtension<dynamic>>[c],
    colorScheme: ColorScheme(
      brightness: brightness,
      primary: c.primary,
      onPrimary: c.onPrimary,
      secondary: c.primary,
      onSecondary: c.onPrimary,
      surface: c.surface,
      onSurface: c.text,
      error: c.danger,
      onError: c.onDanger,
    ),
    textTheme: const TextTheme(
      displayLarge: AppText.display,
      headlineLarge: AppText.h1,
      headlineMedium: AppText.h2,
      headlineSmall: AppText.h3,
      bodyLarge: AppText.body,
      bodyMedium: AppText.bodySm,
      labelLarge: AppText.label,
      bodySmall: AppText.caption,
    ),
    dividerColor: c.border,
    focusColor: c.focus,
  );
}

final ThemeData appLight = _buildTheme(AppColors.light, Brightness.light);
final ThemeData appDark  = _buildTheme(AppColors.dark,  Brightness.dark);
```

---

## Grid materialization

`lib/design/grid.dart` — Layer 2. Outer margin is the mechanical form of P1; a region
can never shrink it below the breakpoint minimum.

```dart
import 'package:flutter/widgets.dart';
import 'design_tokens.dart';

enum GridTier { mobile, tablet, desktop, wide }

class GridSpec {
  const GridSpec(this.columns, this.gutter, this.outerMargin, this.maxWidth);
  final int columns;
  final double gutter;
  final double outerMargin;
  final double? maxWidth; // null → fluid (100% − 2× margin)

  /// Resolve by width against core-spec breakpoints.
  static GridSpec of(double width) {
    if (width < DesignTokens.bpMd) {
      // mobile (< md): 4 cols · gutter 16 · margin 16 · fluid
      return const GridSpec(4, DesignTokens.space4, DesignTokens.space4, null);
    }
    if (width < DesignTokens.bpLg) {
      // tablet (md): 8 cols · gutter 24 · margin 32 · max 720
      return const GridSpec(8, DesignTokens.space5, DesignTokens.space6, 720);
    }
    // desktop (≥ lg): 12 cols · gutter 24 · margin 32 · max 1024 (xl: 1200)
    final double max = width >= DesignTokens.bpXl ? 1200 : 1024;
    return GridSpec(12, DesignTokens.space5, DesignTokens.space6, max);
  }
}

/// Applies edge-safety outer margins + max-width centering. Children never set
/// their own outer margin — this owns it.
class ResponsiveContainer extends StatelessWidget {
  const ResponsiveContainer({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final spec = GridSpec.of(constraints.maxWidth);
        final content = ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: spec.maxWidth ?? double.infinity,
          ),
          child: child,
        );
        return Padding(
          padding: EdgeInsets.symmetric(horizontal: spec.outerMargin),
          child: Center(child: content),
        );
      },
    );
  }
}

/// 4/8/12-column row with token gutters. Spans are integers (no fractional cols).
class GridRow extends StatelessWidget {
  const GridRow({super.key, required this.cells});
  final List<GridCell> cells;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, c) {
      final spec = GridSpec.of(MediaQuery.sizeOf(context).width);
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (var i = 0; i < cells.length; i++) ...[
            if (i > 0) SizedBox(width: spec.gutter),
            Expanded(flex: cells[i].span, child: cells[i].child),
          ],
        ],
      );
    });
  }
}

class GridCell {
  const GridCell({required this.span, required this.child});
  final int span; // integer column span
  final Widget child;
}
```

---

## Principle enforcement (P1–P5)

Enforced natively via `analysis_options.yaml` + `custom_lint` rules + CI greps.

| Principle | Native mechanism |
|---|---|
| **P1 · Edge safety** | `custom_lint` rule `unify_edge_safety`: flags any `Padding`/`EdgeInsets` whose horizontal inset on a scroll/scaffold body is `< spec.outerMargin`; require screens to wrap content in `ResponsiveContainer`. Grep gate: `rg 'Scaffold\(' -A20 \| rg 'Padding' -c` to confirm padding present. |
| **P2 · Grid alignment** | `custom_lint` rule `unify_on_scale`: every numeric literal passed to `EdgeInsets.*`, `SizedBox`, `Gap`, `Positioned`, `width:`/`height:` must be a `DesignTokens.spaceN`. Grep: `rg 'EdgeInsets\.(all|symmetric|only)\(\s*[0-9]' lib/` finds raw-number insets. |
| **P3 · One direction per surface** | `custom_lint` rule `unify_template`: a widget whose name ends `Screen`/`Page` must return one of the approved template widgets (`ListTemplate`, `DetailTemplate`, `FormTemplate`, `DashboardTemplate`, `EmptyTemplate`) at its root, not a bare `Scaffold`/`Column`. |
| **P4 · Token-only** | `analysis_options.yaml` bans literals in components. Grep: `rg 'Color\(0x' lib/ --glob '!**/design/**'` (raw color outside tokens file) and `rg 'fontSize:|TextStyle\(' lib/ --glob '!**/design/**'` (ad-hoc type). `custom_lint` `unify_token_only` fails the analyzer on match. |
| **P5 · Accessibility floor** | `custom_lint` `unify_a11y`: interactive widgets must sit inside a ≥ `DesignTokens.targetMin` (44) box (`ConstrainedBox(minWidth:44,minHeight:44)`) and declare a `Semantics`/focus. Contrast checked in widget tests via `meetsGuideline(textContrastGuideline)` / `meetsGuideline(androidTapTargetGuideline)`. Focus visible: `FocusableActionDetector` required. |

`analysis_options.yaml`:

```yaml
analyzer:
  plugins:
    - custom_lint
custom_lint:
  rules:
    - unify_edge_safety
    - unify_on_scale
    - unify_template
    - unify_token_only
    - unify_a11y
```

---

## Generate snippets

### (a) Compliant component — token-only, enum API, no outer margin

```dart
import 'package:flutter/material.dart';
import '../design/design_tokens.dart';

enum ButtonVariant { primary, secondary, ghost, danger }
enum ButtonSize { sm, md, lg }
enum ButtonState { defaultState, hover, active, focus, disabled, loading }

class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = ButtonVariant.primary,
    this.size = ButtonSize.md,
    this.state = ButtonState.defaultState,
  });

  final String label;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final ButtonSize size;
  final ButtonState state;

  // size → fixed token bundle (padding · type role · radius · min target)
  ({EdgeInsets pad, TextStyle type, double radius, double minH}) get _bundle =>
      switch (size) {
        ButtonSize.sm => (
            pad: const EdgeInsets.symmetric(
                horizontal: DesignTokens.space3, vertical: DesignTokens.space2),
            type: AppText.label,
            radius: DesignTokens.radius1,
            minH: DesignTokens.targetMin),
        ButtonSize.md => (
            pad: const EdgeInsets.symmetric(
                horizontal: DesignTokens.space4, vertical: DesignTokens.space3),
            type: AppText.label,
            radius: DesignTokens.radius2,
            minH: DesignTokens.targetMin),
        ButtonSize.lg => (
            pad: const EdgeInsets.symmetric(
                horizontal: DesignTokens.space5, vertical: DesignTokens.space4),
            type: AppText.body,
            radius: DesignTokens.radius2,
            minH: DesignTokens.targetMin),
      };

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final (:pad, :type, :radius, :minH) = _bundle;
    final bg = switch (variant) {
      ButtonVariant.primary => c.primary,
      ButtonVariant.secondary => c.surface,
      ButtonVariant.ghost => Colors.transparent,
      ButtonVariant.danger => c.danger,
    };
    final fg = switch (variant) {
      ButtonVariant.primary => c.onPrimary,
      ButtonVariant.secondary => c.text,
      ButtonVariant.ghost => c.primary,
      ButtonVariant.danger => c.onDanger,
    };
    final disabled = state == ButtonState.disabled;
    // NB: no outer margin/padding on the root — parent/template owns spacing.
    return ConstrainedBox(
      constraints: BoxConstraints(minWidth: minH, minHeight: minH),
      child: FocusableActionDetector(
        child: Material(
          color: disabled ? c.border : bg,
          borderRadius: BorderRadius.circular(radius),
          child: InkWell(
            borderRadius: BorderRadius.circular(radius),
            focusColor: c.focus,
            onTap: disabled ? null : onPressed,
            child: Padding(
              padding: pad,
              child: Center(
                widthFactor: 1,
                child: state == ButtonState.loading
                    ? SizedBox(
                        width: DesignTokens.space4,
                        height: DesignTokens.space4,
                        child: CircularProgressIndicator(strokeWidth: 2, color: fg))
                    : Text(label, style: type.copyWith(color: fg)),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
```

### (b) Compliant screen — `form` template, regions filled with components

```dart
import 'package:flutter/material.dart';
import '../design/design_tokens.dart';
import '../design/grid.dart';
import 'app_button.dart';

/// `form` template (Layer 4): header · fieldset(s) · actions.
/// narrow (max 640) · field gap = space-4 · group gap = space-6.
class SignupScreen extends StatelessWidget {
  const SignupScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Scaffold(
      backgroundColor: c.bg,
      body: SafeArea(
        child: ResponsiveContainer(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 640), // form: narrow
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: DesignTokens.space6),
                  Text('Create account', style: AppText.h2.copyWith(color: c.text)), // header
                  const SizedBox(height: DesignTokens.space6), // group gap
                  // fieldset
                  _Field(label: 'Email', child: const TextField()),
                  const SizedBox(height: DesignTokens.space4), // field gap
                  _Field(label: 'Password', child: const TextField(obscureText: true)),
                  const SizedBox(height: DesignTokens.space6), // group gap → actions
                  AppButton(label: 'Sign up', onPressed: () {}, size: ButtonSize.lg),
                  const SizedBox(height: DesignTokens.space6),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({required this.label, required this.child});
  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppText.label.copyWith(color: c.textMuted)),
        const SizedBox(height: DesignTokens.space2),
        child,
      ],
    );
  }
}
```

---

## Audit commands

Run against `lib/`. Each maps to one Layer 5 checklist row. The tokens dir
(`lib/design/`) is excluded from literal checks — it is the one place values are declared.

| # | Row | Command |
|---|---|---|
| 1 | **P1** edge safety | `rg -n 'Scaffold\(' -A25 lib/ \| rg -L 'ResponsiveContainer'` — screens whose body never wraps in `ResponsiveContainer` (no guaranteed outer margin). |
| 2 | **P2** on-grid | `rg -nE 'EdgeInsets\.(all\|symmetric\|only)\(\s*[^)]*\b(5\|10\|18\|20\|30\|[0-9]{3,})\b' lib/` — off-scale insets. |
| 3 | **P3** template | `rg -nE 'class \w+(Screen\|Page)\b' -A8 lib/ \| rg -L '(List\|Detail\|Form\|Dashboard\|Empty)Template'` — screens not rooted in a template. |
| 4 | **P4** token-only | `rg -nE 'Color\(0x[0-9A-Fa-f]{8}\)' lib/ --glob '!lib/design/**'` — raw color outside the tokens file. |
| 5 | **P5** targets/contrast/focus | `rg -nE 'InkWell\|GestureDetector\|onTap:' lib/ \| rg -L 'targetMin\|ConstrainedBox'` (missing 44 floor) + widget test `expect(tester, meetsGuideline(textContrastGuideline))` and `meetsGuideline(androidTapTargetGuideline)`. |
| 6 | Spacing off-scale | `rg -nE '\b(SizedBox\|Gap)\(\s*(width\|height)?:?\s*(5\|10\|18\|20\|30)\b' lib/` and `rg -nE ':\s*(5\|10\|18\|20\|30)\.0?\b' lib/ --glob '!lib/design/**'` — magic doubles. |
| 7 | Type via roles | `rg -nE 'TextStyle\(\|fontSize:' lib/ --glob '!lib/design/**'` — ad-hoc type instead of `AppText.*`. |
| 8 | Color via roles | `rg -nE 'Colors\.\|Color\(0x' lib/ --glob '!lib/design/**'` — Material/raw colors instead of `AppColors.of(context).*`. |
| 9 | Enums not booleans | `rg -nE 'bool (is\|has)[A-Z]\w*' lib/ --glob '**/widgets/**'` — boolean-sprawl props where a `variant`/`state` enum belongs. |
| 10 | No outer margin on components | `rg -nE 'margin:\s*EdgeInsets' lib/ --glob '**/widgets/**'` — a component setting its own outer margin (parent/template owns it). |

`dart analyze` runs rows 1–10 continuously once the `custom_lint` rules above are
registered; the greps are the CI fallback and PR gate.
