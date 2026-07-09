#!/usr/bin/env node
/**
 * check-bundle.mjs — report drift between whereto's vendored skills and their
 * canonical sources. Read-only: never writes, never regenerates. Exit 1 on a
 * real problem, 0 when clean. Advisories (orphan .tmpl) never fail the run.
 *
 * Reads bundle.manifest.json for the source-of-truth map.
 *
 *   node scripts/check-bundle.mjs          # from product-planning/whereto/
 *   node product-planning/whereto/scripts/check-bundle.mjs   # from repo root
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const whereto = path.resolve(__dirname, "..");
const repoRoot = path.resolve(whereto, "../..");
const skillsRoot = path.join(whereto, "skills");
const manifestPath = path.join(__dirname, "bundle.manifest.json");

const errors = [];
const advisories = [];

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const byName = new Map(manifest.skills.map((s) => [s.name, s]));

// Lines the adapter injects into a copied skill. Ignored when diffing copy-mode.
const isInjectedLine = (line) =>
  line.trim() === "bundled_into: whereto" || line.includes("Bundled into whereto");

const normalize = (text) =>
  text.split("\n").filter((l) => !isInjectedLine(l)).join("\n");

function listFiles(dir) {
  const out = [];
  const walk = (d, rel = "") => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const r = rel ? `${rel}/${ent.name}` : ent.name;
      if (ent.isDirectory()) walk(path.join(d, ent.name), r);
      else out.push(r);
    }
  };
  walk(dir);
  return out;
}

// 1. manifest <-> disk consistency
const onDisk = fs
  .readdirSync(skillsRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== "shared")
  .map((e) => e.name)
  .sort();

for (const name of onDisk) {
  if (!byName.has(name))
    errors.push(`skills/${name}/ exists on disk but is missing from bundle.manifest.json`);
}
for (const s of manifest.skills) {
  if (!onDisk.includes(s.name))
    errors.push(`manifest lists "${s.name}" but skills/${s.name}/ is not on disk`);
}

// 2. per-skill checks
for (const s of manifest.skills) {
  const bundleDir = path.join(skillsRoot, s.name);
  const sourceDir = path.join(repoRoot, s.source || "");
  if (!s.source || !fs.existsSync(sourceDir)) {
    errors.push(`"${s.name}": source "${s.source}" does not exist`);
    continue;
  }
  if (!fs.existsSync(bundleDir)) continue; // already reported above

  if (s.mode === "copy") {
    // The bundle may vendor a SUBSET of the source (skill files only, not the
    // upstream plugin scaffolding). So: every file the bundle DID take must
    // still match its source counterpart. Source-only files are not drift.
    const srcFiles = new Set(listFiles(sourceDir).filter((f) => !f.endsWith(".tmpl")));
    const bunFiles = listFiles(bundleDir).filter((f) => !f.endsWith(".tmpl"));
    let compared = 0;
    for (const f of bunFiles) {
      if (!srcFiles.has(f)) {
        errors.push(`"${s.name}" (copy): bundle has ${f} with no counterpart in ${s.source}`);
        continue;
      }
      compared++;
      const a = normalize(fs.readFileSync(path.join(sourceDir, f), "utf8"));
      const b = normalize(fs.readFileSync(path.join(bundleDir, f), "utf8"));
      if (a !== b) errors.push(`"${s.name}" (copy): ${f} has DRIFTED from ${s.source}/${f}`);
    }
    if (compared === 0)
      advisories.push(`"${s.name}" (copy): no shared files found to compare against ${s.source}`);
  } else {
    // adapt-mode: content intentionally diverges from game source; can't diff.
    // Just confirm the skill is present and flag orphan .tmpl dead weight.
    if (!fs.existsSync(path.join(bundleDir, "SKILL.md")))
      errors.push(`"${s.name}" (adapt): skills/${s.name}/SKILL.md missing`);
    for (const f of listFiles(bundleDir).filter((f) => f.endsWith(".tmpl")))
      advisories.push(`"${s.name}": orphan ${f} (not consumed by any build step — dead weight)`);
  }
}

// report
const line = (c, msg) => console.log(`${c} ${msg}`);
if (errors.length === 0) line("✓", `bundle clean: ${manifest.skills.length} skills, no drift`);
else {
  line("✗", `${errors.length} problem(s):`);
  for (const e of errors) line("  ✗", e);
}
if (advisories.length) {
  console.log(`\nadvisories (${advisories.length}, non-failing):`);
  for (const a of advisories) line("  •", a);
}

process.exit(errors.length ? 1 : 0);
