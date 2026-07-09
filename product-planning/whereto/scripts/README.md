# whereto bundle maintenance

`whereto/skills/` vendors 37 skills so the pack is self-contained. Those copies
can silently drift from their originals. These scripts keep the relationship
honest.

## Files

| File | Role |
|------|------|
| `bundle.manifest.json` | Source of truth: every bundled skill → its canonical source + `mode`. |
| `check-bundle.mjs` | Read-only drift/consistency check. Exit 1 on a real problem. |
| `adapt-bundled-skills.mjs` | One-shot, in-place adapter that strips gstack/telemetry from copied game skills. Idempotent. |

## Two bundle modes

- **`copy`** (8 skills) — vendored unchanged from a canonical skill (`engineering/`,
  `design/`, `impact-driven-writing/skills/`, `product-planning/prd`), plus a
  `bundled_into: whereto` marker. These **must not drift**: any shared file has to
  stay byte-identical to source. The bundle may take a subset (skill files only,
  not upstream plugin scaffolding); that is fine.
- **`adapt`** (29 skills) — copied from `game/skills/<name>` and then stripped of
  gstack specifics. These are **expected** to diverge from source, so content is
  not diffed; the check only confirms presence.

## Check the bundle

```bash
node product-planning/whereto/scripts/check-bundle.mjs
```

It fails when:

- a `copy`-mode file has drifted from its source,
- a bundled skill is missing from the manifest (or vice versa),
- a manifest `source` path no longer exists.

It runs in CI on every push/PR that touches the bundle or its sources
(`.github/workflows/check-bundle.yml`).

## Updating a bundled skill

1. Edit the **canonical** source (e.g. `engineering/tdd/`).
2. For `copy` skills: re-copy the changed files into `whereto/skills/<name>/`,
   keeping the `bundled_into` marker. Re-run `check-bundle.mjs` — it must pass.
3. For `adapt` skills: re-copy from `game/skills/<name>/`, then run
   `adapt-bundled-skills.mjs` to re-strip gstack bits.

## History: orphan `.tmpl` files (removed)

The 29 `adapt` skills each used to carry a `SKILL.md.tmpl` that nothing read —
`adapt-bundled-skills.mjs` mutated it in place but never consumed it. They were a
second full copy of each game skill, so they were deleted (no behavioural change).
Do not reintroduce them: edit the canonical source and re-run the adapter instead.
