#!/usr/bin/env node
"use strict";

/**
 * Installer for the AI Skills collection.
 *
 * Copies every skill folder from this package's `skills/` directory into the
 * target `.claude/skills/` directory. Designed to be run with no install step:
 *
 *   npx github:youruser/yourrepo            # interactive: pick user or project
 *   npx github:youruser/yourrepo --user     # install to ~/.claude/skills
 *   npx github:youruser/yourrepo --project  # install to ./.claude/skills
 *   npx github:youruser/yourrepo --list     # list available skills
 *   npx github:youruser/yourrepo my-skill   # install only named skill(s)
 *
 * No runtime dependencies — uses only the Node standard library.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");

const SKILLS_SRC = path.join(__dirname, "..", "skills");

function parseArgs(argv) {
  const opts = { scope: null, force: false, list: false, help: false, names: [] };
  for (const arg of argv) {
    switch (arg) {
      case "--user":
      case "-u":
        opts.scope = "user";
        break;
      case "--project":
      case "-p":
        opts.scope = "project";
        break;
      case "--force":
      case "-f":
        opts.force = true;
        break;
      case "--list":
      case "-l":
        opts.list = true;
        break;
      case "--help":
      case "-h":
        opts.help = true;
        break;
      default:
        if (arg.startsWith("-")) {
          console.error(`Unknown option: ${arg}`);
          opts.help = true;
        } else {
          opts.names.push(arg);
        }
    }
  }
  return opts;
}

function printHelp() {
  console.log(`
ai-skills — install Claude Code Agent Skills into .claude/skills/

Usage:
  npx github:youruser/yourrepo [options] [skill-name...]

Options:
  -u, --user      Install to ~/.claude/skills (available in every project)
  -p, --project   Install to ./.claude/skills (current project only)
  -f, --force     Overwrite skills that already exist at the target
  -l, --list      List the skills available in this package
  -h, --help      Show this help

If no scope is given and the terminal is interactive, you'll be prompted.
If one or more skill-names are given, only those skills are installed;
otherwise every skill in the package is installed.
`);
}

function listSkills() {
  if (!fs.existsSync(SKILLS_SRC)) return [];
  return fs
    .readdirSync(SKILLS_SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => fs.existsSync(path.join(SKILLS_SRC, name, "SKILL.md")))
    .sort();
}

function readDescription(skillName) {
  const file = path.join(SKILLS_SRC, skillName, "SKILL.md");
  try {
    const text = fs.readFileSync(file, "utf8");
    const match = text.match(/^description:[ \t]*(.*)$/m);
    if (!match) return "";
    const inline = match[1].trim();
    // Plain inline value.
    if (inline && inline !== "|" && inline !== ">" && !/^[|>][+-]?$/.test(inline)) {
      return inline.replace(/^["']|["']$/g, "");
    }
    // YAML block scalar (| or >): collect the following indented lines.
    const lines = text.slice(match.index + match[0].length).split("\n").slice(1);
    const collected = [];
    for (const line of lines) {
      if (line.trim() === "") {
        if (collected.length) break;
        continue;
      }
      if (!/^\s/.test(line)) break; // dedented back to a new key
      collected.push(line.trim());
    }
    return collected.join(" ").trim();
  } catch {
    /* ignore */
  }
  return "";
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else if (entry.isSymbolicLink()) {
      fs.symlinkSync(fs.readlinkSync(s), d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

async function resolveScope(opts) {
  if (opts.scope) return opts.scope;
  if (!process.stdin.isTTY) {
    // Non-interactive (e.g. piped) — default to user scope.
    console.log("No scope flag and non-interactive shell; defaulting to --user.");
    return "user";
  }
  console.log("Where should the skills be installed?");
  console.log("  1) User    ~/.claude/skills      (all projects)");
  console.log("  2) Project  ./.claude/skills      (this folder only)");
  const answer = (await ask("Choose [1/2] (default 1): ")) || "1";
  return answer === "2" ? "project" : "user";
}

function targetDir(scope) {
  const base = scope === "project" ? process.cwd() : os.homedir();
  return path.join(base, ".claude", "skills");
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    printHelp();
    return;
  }

  const available = listSkills();

  if (opts.list) {
    if (available.length === 0) {
      console.log("No skills found in this package.");
      return;
    }
    console.log("Available skills:\n");
    for (const name of available) {
      const desc = readDescription(name);
      console.log(`  ${name}${desc ? `\n    ${desc}` : ""}`);
    }
    return;
  }

  if (available.length === 0) {
    console.error("No skills found in this package (expected folders under skills/).");
    process.exitCode = 1;
    return;
  }

  // Determine which skills to install.
  let toInstall = available;
  if (opts.names.length > 0) {
    const unknown = opts.names.filter((n) => !available.includes(n));
    if (unknown.length > 0) {
      console.error(`Unknown skill(s): ${unknown.join(", ")}`);
      console.error(`Available: ${available.join(", ")}`);
      process.exitCode = 1;
      return;
    }
    toInstall = opts.names;
  }

  const scope = await resolveScope(opts);
  const dest = targetDir(scope);
  fs.mkdirSync(dest, { recursive: true });

  let installed = 0;
  let skipped = 0;

  for (const name of toInstall) {
    const skillDest = path.join(dest, name);
    if (fs.existsSync(skillDest) && !opts.force) {
      console.log(`• ${name} — already installed (use --force to overwrite), skipping`);
      skipped += 1;
      continue;
    }
    if (fs.existsSync(skillDest)) {
      fs.rmSync(skillDest, { recursive: true, force: true });
    }
    copyDir(path.join(SKILLS_SRC, name), skillDest);
    console.log(`✓ ${name}`);
    installed += 1;
  }

  console.log(
    `\nDone. ${installed} installed, ${skipped} skipped → ${dest}`
  );
  if (installed > 0) {
    console.log("Restart Claude Code (or reload skills) to pick them up.");
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
