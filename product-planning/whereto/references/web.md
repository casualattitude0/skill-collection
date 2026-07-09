# WEB project playbook (website / web app)

Web projects range from a static marketing page to a full SaaS application, so first decide which end of that range you're on — the phase ladder is the same shape but the weight differs. For a **content/marketing site**, weight toward content completeness, responsive/cross-browser polish, SEO, and deploy. For a **web app / SaaS**, weight toward end-to-end user flows, data/auth, and production hardening (much like an APP that happens to run in a browser). The fastest tell is whether there's meaningful application state and a backend, or mostly pages and content.

Use with [phase-scoring.md](phase-scoring.md) for placement and [next-slice.md](next-slice.md) for slice patterns.

## Phase ladder

### 1. Concept / Prototype
A few pages or a spike of the core interaction. Placeholder copy (`lorem ipsum`), mock data, no real backend, runs only locally.

**Evidence bullets:**
- Static markup or component sketch; few routes/pages
- `lorem ipsum`, placeholder images, or `[TODO]` copy visible in source
- No API routes, database, or auth
- No deploy config (`vercel.json`, `netlify.toml`, CI)
- Runs via `npm run dev` only

### 2. MVP build-out
Core pages/flows wired together for the first time.

**Evidence bullets:**
- Real routing across primary pages
- First API integration or data layer (for web apps)
- Primary user journey works on happy path
- Secondary pages stubbed or missing
- Still no staging/prod deploy pipeline

### 3. Feature-complete / Alpha
All primary pages/flows exist; internal review.

**Evidence bullets:**
- Content mostly real (except known gaps)
- Main features present for web apps (auth, core action)
- Responsive edge cases, error states, accessibility thin
- Little SEO/meta work (title tags may be default)
- Few or no automated tests

### 4. Beta / Staging
Hardening: responsive + cross-browser, accessibility, performance (Core Web Vitals), error handling, staging deploy, real content.

**Evidence bullets:**
- Staging environment configured
- Lighthouse/perf optimization commits
- Accessibility fixes (alt text, keyboard nav, ARIA)
- Analytics wiring (GA, Plausible, etc.)
- Bugfix commits; error boundaries or error pages

### 5. Launch / Production
Deployed publicly on a real domain with production infra.

**Evidence bullets:**
- Deploy config committed (`vercel.json`, `netlify.toml`, Dockerfile, CI/CD to prod)
- Env/secrets management documented or configured
- Custom domain/DNS references
- `sitemap.xml`, `robots.txt` (content sites)
- Meta/OG tags per page; release tags

### 6. Growth / Maintenance
Post-launch: SEO iteration, analytics-driven changes, new features, dependency upkeep against live traffic.

**Evidence bullets:**
- A/B or experiment infrastructure
- Feature flags
- Ongoing content updates in commits
- Monitoring/alerting (Sentry, uptime checks)
- SEO iteration (structured data, content expansion)

## What to look for

- **Framework & rendering** — Next.js/Nuxt/Astro/SvelteKit (SSR/SSG), Vite+React/Vue SPA, or plain static HTML/CSS. Rendering model shapes SEO and deploy expectations.
- **Site vs. app** — is there real application state, auth, and a backend, or mostly routed content pages? This decides which risks matter.
- **Core flows / pages end-to-end** — trace the primary journey (landing → convert, or sign-in → core action). Note where UI outpaces data or content.
- **Content completeness** — real copy and assets vs. `lorem ipsum`/placeholder images. For content sites this is the dominant phase signal.
- **Data & auth (for web apps)** — API routes/backend, database, sessions/auth, form handling and validation. Same MVP→beta gates as an app.
- **Responsive & cross-browser** — breakpoints, mobile layout, tested browsers. Thin coverage caps the project below beta.
- **Accessibility** — semantic HTML, alt text, keyboard nav, ARIA, contrast. Often ignored until beta; flag if a public launch is intended.
- **SEO & meta** — titles/meta/Open Graph, `sitemap.xml`, `robots.txt`, structured data. Matters most for content/marketing sites reaching launch.
- **Performance** — bundle size, image optimization, Core Web Vitals, caching. A beta-and-beyond concern.
- **Deploy & infra** — hosting config, CI/CD, environments, env vars/secrets, custom domain. Presence signals reach toward production.

## Destinations to disambiguate in conversation

- **Personal site / portfolio / one-off marketing page** — polish + deploy, done. No app infra, light ongoing work.
- **Content site / blog** — launch + a content and SEO cadence afterward.
- **Web app / SaaS** — full beta hardening → production launch → growth; treat much like a shippable product.
- **Internal tool** — reliability for known users; skip SEO/marketing polish.

## Common failure modes to flag

- Placeholder copy/images lingering into what's called "almost launched."
- No responsive or accessibility work before a public launch — breaks for a large share of real visitors.
- SEO/meta/sitemap absent on a content site that depends on search traffic.
- No staging environment or deploy pipeline — "it works on my machine" isn't a launch.
- For web apps: UI ahead of the data/auth layer, and missing error/loading/empty states, exactly as with native apps.

## Typical next-slice types (see [next-slice.md](next-slice.md))

| Situation | Slice pattern |
|-----------|---------------|
| README says launch-ready but gaps remain | Launch-gap close — content + deploy + SEO |
| Web app UI ahead of data | Core flow E2E — auth + primary action with real backend |
| Content real, layout broken on mobile | Responsive/a11y pass |
| Works locally, no pipeline | Staging + CI — deploy config before prod |

## Bundled deep tools (same pack)

After the parent chain writes the handoff, route inside `skills/` — do not leave this pack:

| Finding | Tool |
|---------|------|
| Need a full feature PRD, not a build slice | `skills/prd` |
| Unsure about state model / UI shape | `skills/prototype` |
| Domain terms conflicting or missing | `skills/domain-modeling` |
| Module boundaries fuzzy | `skills/codebase-design` |
| Building from handoff | `skills/tdd` |
| UI/a11y while implementing pages | `skills/typeui-fundamentals` |
| Stuck on a hard bug | `skills/diagnosing-bugs` |
| Stress-test destination / slice | [grilling.md](grilling.md) |

Catalog: [skills/README.md](../skills/README.md).
