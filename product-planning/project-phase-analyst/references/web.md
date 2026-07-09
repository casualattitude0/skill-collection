# WEB project playbook (website / web app)

Web projects range from a static marketing page to a full SaaS application, so first decide which end of that range you're on — the phase ladder is the same shape but the weight differs. For a **content/marketing site**, weight toward content completeness, responsive/cross-browser polish, SEO, and deploy. For a **web app / SaaS**, weight toward end-to-end user flows, data/auth, and production hardening (much like an APP that happens to run in a browser). The fastest tell is whether there's meaningful application state and a backend, or mostly pages and content.

## Phase ladder

1. **Concept / Prototype** — a few pages or a spike of the core interaction. Placeholder copy (`lorem ipsum`), mock data, no real backend, runs only locally. Signal: static markup or a component sketch, no data layer, no deploy config.
2. **MVP build-out** — core pages/flows wired together for the first time. Signal: real routing, first API/data integration, primary flow works on happy path, secondary pages stubbed.
3. **Feature-complete / Alpha** — all primary pages/flows exist; internal review. Signal: content mostly real, main features present, but responsive edge cases, error states, and accessibility thin; little SEO/meta.
4. **Beta / Staging** — hardening: responsive + cross-browser, accessibility, performance (Core Web Vitals), error handling, staging deploy, real content. Signal: staging environment, Lighthouse/perf work, a11y fixes, analytics wiring, bugfix commits.
5. **Launch / Production** — deployed publicly on a real domain with production infra. Signal: deploy config (`vercel.json`, `netlify.toml`, Dockerfile, CI/CD to prod), env/secrets management, domain/DNS notes, sitemap/robots, release tags.
6. **Growth / Maintenance** — post-launch: SEO iteration, analytics-driven changes, new features, dependency upkeep against live traffic. Signal: A/B or experiment infra, feature flags, ongoing content updates, monitoring/alerting.

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
