#!/usr/bin/env node
// driver.mjs — SSH plumbing for the ssh-account-doctor skill.
//
// Diagnoses and fixes the "wrong GitHub account over SSH" symptom: two host
// aliases (e.g. github-aaronxue0, github-buhoaaron) that each name their own
// IdentityFile still authenticate as some *other* account.
//
// Root cause this targets: a catch-all `Host *` block with an IdentityFile
// (a default key) plus `AddKeysToAgent yes` loads that default key into the
// ssh-agent. When an alias then connects, SSH offers *agent* keys in agent
// order — not config order — so the earlier-loaded default key is presented
// first. GitHub accepts ANY key registered to ANY account, so the first key
// that matches wins and the session logs in as the default key's account.
// The account-specific key is never even offered. `IdentitiesOnly yes` does
// not save you: the `Host *` IdentityFile is itself a named identity, so it
// stays an allowed (and earlier) candidate.
//
// The fix is `IdentityAgent none` on each account block: that alias bypasses
// the agent entirely and reads only its own IdentityFile(s), in config order,
// so the account-specific key is offered first and the login resolves right.
// (Safe when the account keys are passphraseless — no interactive prompt.)
//
// Commands:
//   diagnose [--alias A ...]
//         Read the EFFECTIVE config (`ssh -G`) for each alias, list the agent
//         keys and their order (`ssh-add -l`), and flag every alias whose
//         login the agent can hijack. Prints a JSON report. Read-only, no net.
//   verify  [--alias A ...] [--expect A=login ...]
//         Actually connect (`ssh -T <alias>`) and report which GitHub login
//         each alias resolves to, plus which key was accepted. With --expect,
//         marks each pass/fail. Hits the network.
//   plan    [--alias A ...]
//         Show the unified diff that `fix` would apply to the config — no
//         write. Use this to eyeball the change before committing to it.
//   fix     [--alias A ...]
//         Back up the config, add `IdentityAgent none` to each account block
//         that lacks it, and print the backup path + the applied diff.
//
// With no --alias flags, aliases are auto-detected: every `Host` entry in the
// config file whose name isn't a pattern (`*`, `?`, `!`) and that declares its
// own IdentityFile — i.e. the per-account blocks, never the `Host *` default.
//
// Config path defaults to ~/.ssh/config; override with SSH_CONFIG=<path>.
// Every command shells out to `ssh` / `ssh-add`; no external deps.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG = process.env.SSH_CONFIG || join(homedir(), ".ssh", "config");

// --- shell helpers ----------------------------------------------------------

// Run a command and return {code, out} with stdout+stderr merged. Never throws
// on a non-zero exit — `ssh -T github` exits 1 on success (no shell access),
// and `ssh-add -l` exits 1 when the agent is empty, so exit code is data here.
function run(cmd, args) {
  try {
    const out = execFileSync(cmd, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 16 * 1024 * 1024,
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout || ""}${e.stderr || ""}` };
  }
}

function die(msg) {
  console.error(msg);
  process.exit(1);
}

// minimal flag parser: repeatable --alias / --expect, plus bare positionals.
function parse(argv) {
  const opt = { alias: [], expect: [] };
  const pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--alias") opt.alias.push(argv[++i]);
    else if (a === "--expect") opt.expect.push(argv[++i]);
    else if (a.startsWith("--")) opt[a.slice(2)] = true;
    else pos.push(a);
  }
  return { pos, opt };
}

// --- config reading ---------------------------------------------------------

// Split the raw config into blocks keyed by their `Host` line. We only touch
// blocks the user could sanely add IdentityAgent to (concrete host aliases),
// so Match blocks and pattern hosts (*, ?, !) are read but never rewritten.
// Returns [{header, patterns, isPattern, start, end, lines}] over file lines.
function readBlocks() {
  if (!existsSync(CONFIG)) die(`No SSH config at ${CONFIG} (set SSH_CONFIG=<path>).`);
  const lines = readFileSync(CONFIG, "utf8").split("\n");
  const blocks = [];
  let cur = null;
  lines.forEach((line, i) => {
    const m = line.match(/^\s*Host\s+(.+?)\s*$/i);
    if (m) {
      if (cur) { cur.end = i; blocks.push(cur); }
      const patterns = m[1].split(/\s+/);
      cur = {
        header: patterns.join(" "),
        patterns,
        isPattern: patterns.some((p) => /[*?!]/.test(p)),
        start: i,
        end: lines.length,
        lines,
      };
    }
  });
  if (cur) blocks.push(cur);
  return { lines, blocks };
}

function blockText(block) {
  return block.lines.slice(block.start, block.end).join("\n");
}
function blockHas(block, directive) {
  const re = new RegExp(`^\\s*${directive}\\b`, "i");
  return block.lines.slice(block.start, block.end).some((l) => re.test(l));
}

// Aliases to operate on: explicit --alias wins; otherwise every concrete Host
// alias that declares its own IdentityFile (the per-account blocks).
function targetAliases(explicit) {
  if (explicit.length) return explicit;
  const { blocks } = readBlocks();
  return blocks
    .filter((b) => !b.isPattern && blockHas(b, "IdentityFile"))
    .flatMap((b) => b.patterns);
}

// --- effective config via `ssh -G` -----------------------------------------

// `ssh -G <alias>` resolves the FULL effective config — Host * merges,
// Includes, everything — the way the real client will. This is the source of
// truth; hand-parsing the file would miss included files and pattern merges.
function effective(alias) {
  // -F CONFIG so `ssh -G` resolves against the SAME file plan/fix edit — else
  // an SSH_CONFIG override (or a non-default path) would be diagnosed against
  // the real ~/.ssh/config and disagree with what fix actually changes.
  const { out, code } = run("ssh", ["-F", CONFIG, "-G", alias]);
  if (code !== 0) return { error: out.trim() };
  const cfg = { identityfile: [] };
  for (const line of out.split("\n")) {
    const sp = line.indexOf(" ");
    if (sp < 0) continue;
    const key = line.slice(0, sp).toLowerCase();
    const val = line.slice(sp + 1);
    if (key === "identityfile") cfg.identityfile.push(val);
    else cfg[key] = val;
  }
  return cfg;
}

// Keys currently in the agent, in the order the agent will offer them. The
// FIRST entry is the one presented first — the account-hijacker when a default
// key sits ahead of the account key.
function agentKeys() {
  const { out, code } = run("ssh-add", ["-l"]);
  if (code !== 0) return []; // empty agent or none running
  return out.trim().split("\n").filter(Boolean).map((l) => {
    const parts = l.split(/\s+/);
    return { bits: parts[0], fingerprint: parts[1], comment: parts.slice(2).join(" ") };
  });
}

// --- diagnose ---------------------------------------------------------------

function diagnose(aliases) {
  const agent = agentKeys();
  const report = aliases.map((alias) => {
    const cfg = effective(alias);
    if (cfg.error) return { alias, error: cfg.error };
    const usesAgent = (cfg.identityagent || "").toLowerCase() !== "none";
    // The agent can hijack this alias only if the alias still consults the
    // agent AND the agent holds any key: SSH will offer agent keys (in agent
    // order) ahead of the config's own IdentityFile candidates.
    const agentCanHijack = usesAgent && agent.length > 0;
    return {
      alias,
      hostname: cfg.hostname,
      user: cfg.user,
      identityAgent: cfg.identityagent || "(default)",
      identitiesOnly: cfg.identitiesonly || "no",
      identityFiles: cfg.identityfile,
      agentCanHijack,
      // Fix already in place when the alias bypasses the agent.
      fixApplied: !usesAgent,
    };
  });
  const atRisk = report.filter((r) => r.agentCanHijack).map((r) => r.alias);
  console.log(JSON.stringify({
    config: CONFIG,
    agentKeyOrder: agent.map((k, i) => ({ position: i, ...k })),
    aliases: report,
    atRisk,
    summary: atRisk.length
      ? `${atRisk.length} alias(es) can be hijacked by the agent: ${atRisk.join(", ")}. `
        + `Run \`node driver.mjs plan\` then \`fix\` to add IdentityAgent none.`
      : "No agent-order hijack risk detected on the checked aliases.",
  }, null, 2));
}

// --- verify -----------------------------------------------------------------

function verify(aliases, expectPairs) {
  const expect = Object.fromEntries(
    expectPairs.map((p) => { const [a, l] = p.split("="); return [a, l]; })
  );
  const results = aliases.map((alias) => {
    // BatchMode keeps a passphrase-protected key from hanging on a prompt.
    const { out } = run("ssh", ["-F", CONFIG, "-T", "-o", "BatchMode=yes", "-v", alias]);
    const login = (out.match(/Hi (\S+?)!/) || [])[1] || null;
    // Last "Server accepts key" (or offered key) = the key that authenticated.
    const accepts = [...out.matchAll(/Server accepts key:.*?(\/\S+)/g)];
    const offers = [...out.matchAll(/Offering public key:.*?(\/\S+)/g)];
    const acceptedKey = accepts.length ? accepts.at(-1)[1]
      : (offers.length ? offers.at(-1)[1] : null);
    const res = { alias, login, acceptedKey };
    if (expect[alias]) {
      res.expected = expect[alias];
      res.pass = login === expect[alias];
    }
    if (!login) res.note = "No 'Hi <user>!' — auth failed or host is not GitHub. "
      + "Check the raw output with: ssh -T -v " + alias;
    return res;
  });
  const failed = results.filter((r) => r.pass === false).map((r) => r.alias);
  console.log(JSON.stringify({
    aliases: results,
    failed,
    summary: failed.length
      ? `${failed.length} alias(es) resolved to the WRONG account: ${failed.join(", ")}.`
      : "Every checked alias resolved to its expected (or a valid) account.",
  }, null, 2));
}

// --- plan / fix -------------------------------------------------------------

// Compute the edited file: for each concrete block matching a target alias
// that has an IdentityFile but no IdentityAgent, insert `IdentityAgent none`
// right after the Host line, matching the block's existing indentation.
function computeEdit(aliases) {
  const { lines, blocks } = readBlocks();
  const want = new Set(aliases);
  const edited = [...lines];
  const changed = [];
  // Apply from the bottom so earlier insertions don't shift later indices.
  const targets = blocks
    .filter((b) => !b.isPattern
      && b.patterns.some((p) => want.has(p))
      && blockHas(b, "IdentityFile"))
    .sort((a, b) => b.start - a.start);
  for (const b of targets) {
    if (blockHas(b, "IdentityAgent")) continue; // already set — leave it alone
    // Match indentation of an existing directive line in the block.
    const sample = b.lines.slice(b.start + 1, b.end).find((l) => /^\s+\S/.test(l));
    const indent = sample ? (sample.match(/^\s+/) || ["    "])[0] : "    ";
    edited.splice(b.start + 1, 0, `${indent}IdentityAgent none`);
    changed.push(b.header);
  }
  return { original: lines, edited, changed };
}

// A compact, readable unified-ish diff (added lines only — fix is insert-only).
function showDiff(original, edited) {
  const out = [];
  let oi = 0;
  for (const line of edited) {
    if (oi < original.length && line === original[oi]) { out.push(`  ${line}`); oi++; }
    else out.push(`+ ${line}`);
  }
  return out.join("\n");
}

function plan(aliases) {
  const { original, edited, changed } = computeEdit(aliases);
  if (!changed.length) {
    console.log(`No changes needed — IdentityAgent already set (or no IdentityFile) on: ${aliases.join(", ")}`);
    return;
  }
  console.log(`Would add \`IdentityAgent none\` to: ${changed.join(", ")}\n`);
  console.log(showDiff(original, edited));
  console.log(`\nApply with: node driver.mjs fix ${aliases.map((a) => `--alias ${a}`).join(" ")}`);
}

function fix(aliases) {
  const { original, edited, changed } = computeEdit(aliases);
  if (!changed.length) {
    console.log(JSON.stringify({ changed: [], note: "Nothing to change — already fixed or no IdentityFile blocks." }));
    return;
  }
  const backup = `${CONFIG}.bak.${process.pid}`;
  copyFileSync(CONFIG, backup);
  writeFileSync(CONFIG, edited.join("\n"));
  console.log(JSON.stringify({
    config: CONFIG,
    backup,
    changed,
    next: `Verify: node driver.mjs verify ${aliases.map((a) => `--alias ${a}`).join(" ")}`,
  }, null, 2));
  console.log("\n--- applied diff ---\n" + showDiff(original, edited));
}

// --- dispatch ---------------------------------------------------------------

const [cmd, ...rest] = process.argv.slice(2);
const { opt } = parse(rest);
const aliases = ["diagnose", "verify", "plan", "fix"].includes(cmd)
  ? targetAliases(opt.alias)
  : [];

if (["diagnose", "verify", "plan", "fix"].includes(cmd) && aliases.length === 0)
  die("No target aliases. Pass --alias <name> (repeatable), or add per-account "
    + "Host blocks with their own IdentityFile to " + CONFIG + ".");

switch (cmd) {
  case "diagnose": diagnose(aliases); break;
  case "verify": verify(aliases, opt.expect); break;
  case "plan": plan(aliases); break;
  case "fix": fix(aliases); break;
  default:
    die(`usage: node driver.mjs <diagnose|verify|plan|fix> [--alias A ...]
  diagnose                 Report which aliases the agent can hijack (read-only)
  verify  [--expect A=login]  Connect and report the real GitHub login per alias
  plan                     Show the config diff fix would apply (no write)
  fix                      Back up config, add IdentityAgent none, print diff

  --alias <name>   Repeatable. Default: every concrete Host with its own IdentityFile.
  SSH_CONFIG=<path>  Override the config file (default ~/.ssh/config).`);
}
