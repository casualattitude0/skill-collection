# APP project playbook (mobile / desktop application)

Apps live or die on whether real users can complete real tasks reliably, on real devices, and — for most — whether they can get through a store review and get updated safely. Weight your read toward **end-to-end user flows** (can someone sign up, do the core action, and come back tomorrow?) and toward **release plumbing** (build, sign, distribute, update). A pile of beautiful screens with no working data layer is early-stage no matter how it looks.

Use with [phase-scoring.md](phase-scoring.md) for placement and [next-slice.md](next-slice.md) for slice patterns.

## Phase ladder

### 1. Concept / Prototype
Proving the idea or a key interaction. Hardcoded/mock data, one or two screens, no persistence, no auth.

**Evidence bullets:**
- UI screens exist (Flutter widgets, SwiftUI views, Compose screens) but data is hardcoded or mock
- No API client, local DB, or persistence layer wired
- Navigation may exist between 2–3 screens only
- Lots of `TODO`, `mock`, `fake`, or `sample` in data layer
- Runs locally only; no release config

### 2. MVP build-out
The core flow is being wired end-to-end for the first time.

**Evidence bullets:**
- Real API client or local database appearing in codebase
- Auth stubs or basic sign-in flow (happy path)
- Navigation across main screens connected
- Primary action persists or fetches real data
- Edge cases, secondary flows, and error states still missing

### 3. Feature-complete / Alpha
All primary flows work on the happy path; internal/dogfood use.

**Evidence bullets:**
- Persistence and auth work on happy path
- Main features from PRD/README present in code
- Error handling and empty/loading states thin or absent
- Few tests — maybe one smoke test
- No crash reporting or analytics SDK yet

### 4. Beta
Hardening for real users: error states, offline behavior, device/OS matrix, performance, crash reporting, TestFlight/Play internal testing.

**Evidence bullets:**
- Crash reporting SDK (Sentry, Crashlytics, Firebase Crashlytics)
- Error, empty, loading, offline states on core flows
- Beta distribution config (TestFlight, internal track, Firebase App Distribution)
- Feature flags may appear
- Bugfix-heavy commits; analytics integration

### 5. Launch / Release
Store submission and public availability.

**Evidence bullets:**
- Store metadata (`fastlane/`, screenshots, store listing JSON)
- Signing config (provisioning profiles, keystore, release build.gradle)
- Release CI pipeline
- Version tags; release branches
- `AndroidManifest` / `Info.plist` release configurations

### 6. Growth / Maintenance
Post-launch: retention, updates, new features against a live user base.

**Evidence bullets:**
- Analytics-driven commits; funnel or retention work
- A/B or experiment infrastructure
- Staged rollouts; changelog cadence
- Deprecation cleanup; dependency updates against production

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

## Typical next-slice types (see [next-slice.md](next-slice.md))

| Situation | Slice pattern |
|-----------|---------------|
| UI exists, data mocked | Core flow E2E — wire real persistence on primary journey |
| Happy path works, fragile | Robustness pass — error/empty/offline on core screens |
| Alpha quality, no observability | Observability slice — crash reporting before beta |
| Beta quality, no store assets | Store-readiness — signing, metadata, release build |

## Bundled deep tools (same pack)

After the parent chain writes the handoff, route inside `skills/` — do not leave this pack:

| Finding | Tool |
|---------|------|
| Need a full feature PRD, not a build slice | `skills/prd` |
| Unsure about state model / UI shape | `skills/prototype` |
| Domain terms conflicting or missing | `skills/domain-modeling` |
| Module boundaries fuzzy | `skills/codebase-design` |
| Building from handoff | `skills/tdd` |
| UI/a11y while implementing screens | `skills/typeui-fundamentals` |
| Stuck on a hard bug | `skills/diagnosing-bugs` |
| Stress-test destination / slice | [grilling.md](grilling.md) |

Catalog: [skills/README.md](../skills/README.md).
