# APP project playbook (mobile / desktop application)

Apps live or die on whether real users can complete real tasks reliably, on real devices, and — for most — whether they can get through a store review and get updated safely. Weight your read toward **end-to-end user flows** (can someone sign up, do the core action, and come back tomorrow?) and toward **release plumbing** (build, sign, distribute, update). A pile of beautiful screens with no working data layer is early-stage no matter how it looks.

## Phase ladder

1. **Concept / Prototype** — proving the idea or a key interaction. Hardcoded/mock data, one or two screens, no persistence, no auth. Signal: UI exists but no real backend/storage wiring; lots of `TODO`, fake data.
2. **MVP build-out** — the core flow is being wired end-to-end for the first time. Signal: real data layer appearing (API client, local DB), auth stubs, navigation across the main screens, but edge cases and secondary flows missing.
3. **Feature-complete / Alpha** — all primary flows work on the happy path; internal/dogfood use. Signal: persistence, auth, main features present; error handling and empty/loading states thin; few tests.
4. **Beta** — hardening for real users: error states, offline behavior, device/OS matrix, performance, crash reporting, TestFlight/Play internal testing. Signal: crash/analytics SDKs, feature flags, beta distribution config, bugfix-heavy commits.
5. **Launch / Release** — store submission and public availability. Signal: store metadata (`fastlane/`, screenshots, `*.plist`, `AndroidManifest` with release config), signing config, release CI, version tags.
6. **Growth / Maintenance** — post-launch: retention, updates, new features against a live user base. Signal: analytics-driven work, A/B infra, staged rollouts, changelog cadence, deprecation cleanup.

## What to look for

- **Platform & stack** — Flutter (`pubspec.yaml`, `lib/`), iOS/macOS (`*.xcodeproj`, `Package.swift`, SwiftUI/UIKit), Android (`build.gradle`, Kotlin/Java, Compose), React Native/Expo, Electron/Tauri (desktop). Tells you where screens, state, and platform config live.
- **Core user flows end-to-end** — trace the primary journey (onboard → core action → result). Note where it breaks: is the UI ahead of the data layer, or vice versa?
- **Data & backend wiring** — API clients, local database (SQLite/Realm/Core Data/Hive), caching, sync. Real persistence vs. mock data is the prototype→MVP line.
- **Auth & accounts** — presence and completeness of sign-in, session handling, account state. Often the gate between MVP and beta.
- **Robustness states** — loading, empty, error, offline, and permission-denied states. Their presence is what separates "demoable" from "shippable."
- **Release plumbing** — signing, build automation (`fastlane`, Gradle/Xcode release configs), store metadata and assets, versioning. Presence means the project is reaching for launch.
- **Observability** — crash reporting (Sentry/Crashlytics), analytics, feature flags. Beta-and-beyond hallmark.
- **Tests** — unit/widget/integration/E2E coverage of the core flows; whether CI runs them.

## Destinations to disambiguate in conversation

- **Personal / internal tool** — ship to a handful of known users; skip store, skip growth infra. Destination is "reliable for us."
- **Public store launch** — full beta → store review → public release on named platforms.
- **Product with growth ambitions** — launch is a milestone; roadmap must include retention/analytics/iteration.
- **Cross-platform expansion** — an app that exists on one platform aiming to add another; the phases are per-platform parity.

## Common failure modes to flag

- UI far ahead of the data layer — screens that can't actually load or save anything real.
- No error/offline/empty states — will feel broken to real users the moment the network hiccups.
- No crash reporting before a public launch — you'll be blind to the failures that lose users.
- Underestimated store-review / signing / distribution work — routinely the surprise that stalls a "nearly done" app.
- Auth and account edge cases (password reset, token expiry, logout) left as `TODO` into beta.
