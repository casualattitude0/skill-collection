#!/usr/bin/env node
// driver.mjs — git/gh plumbing for the git-hot-fix skill.
//
// A hotfix is an urgent bug fix that ships straight to production, off-cycle.
// The dangerous part isn't the fix — it's making sure the fix lands on EVERY
// long-lived branch that needs it, so it can't silently vanish on the next
// release. This driver handles the deterministic plumbing; the skill (an
// orchestrating agent) makes the judgment calls (which fix, conflict
// resolution, whether to tag).
//
// Commands:
//   detect
//         Inspect the repo and print JSON describing the flow, the base to
//         branch from, the branches a hotfix must merge back into, versioning,
//         and the remote. This is what the skill reads first to plan the run.
//   start   --base <branch> --name <slug>
//         Fetch, then create `hotfix/<slug>` fresh off origin/<base>. Prints
//         JSON {branch, base, sha}.
//   open    --head <branch> --base <branch> [--title T] [--body B] [--draft]
//         Push <head> as ACCOUNT, open a PR into <base>, print JSON.
//   merge   <pr> [--method merge|squash|rebase] [--no-delete-branch]
//         Merge the PR (default: real merge commit; hotfix/protected source
//         branches are never auto-deleted). Prints JSON.
//   tag     <name> [--message M] [--ref <branch|sha>]
//         Create an annotated tag on <ref> (default: current HEAD) and push it.
//   status  <pr>
//         Print JSON {number,state,mergeable,merged,base,head}.
//
// Every command shells out to `git`/`gh`; requires `gh auth status` green.
//
// One-account guarantee: mirrors github-pr-workflow — every GitHub call runs
// as ACCOUNT (`gh auth switch`), and branch pushes go over HTTPS with that
// account's credential. Override with GH_PR_ACCOUNT=<user>.

import { execFileSync } from "node:child_process";

const ACCOUNT = process.env.GH_PR_ACCOUNT || "casualattitude0";

// Long-lived branches that must never be auto-deleted as a merged PR's source.
const PROTECTED = [
  "main", "master", "trunk", "default",
  "dev", "develop", "development",
  "release", "releases", "stable",
  "staging", "stage", "preprod", "pre-production",
  "prod", "production",
  "hotfix", "support", "next", "canary", "integration",
  ...(process.env.GH_PR_PROTECTED || "").split(/[,\s]+/).filter(Boolean),
];

function isProtectedBranch(name) {
  if (!name) return false;
  const first = String(name).toLowerCase().split("/")[0];
  return PROTECTED.map((p) => p.toLowerCase()).includes(first);
}

function gh(args, { json = false, input } = {}) {
  try {
    const out = execFileSync("gh", args, {
      encoding: "utf8", input, maxBuffer: 64 * 1024 * 1024,
    });
    return json ? JSON.parse(out) : out;
  } catch (e) {
    throw new Error(`gh ${args.join(" ")}\n${e.stderr || e.stdout || e.message}`);
  }
}

// git that throws on failure (for mutations we care about).
function git(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    throw new Error(`git ${args.join(" ")}\n${e.stderr || e.stdout || e.message}`);
  }
}

// git that returns "" instead of throwing (for probes).
function gitTry(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch { return ""; }
}

function ensureAccount() {
  try {
    execFileSync("gh", ["auth", "switch", "--hostname", "github.com", "--user", ACCOUNT],
      { stdio: "pipe" });
  } catch { /* already active / single account / older gh */ }
  let who;
  try {
    who = execFileSync("gh", ["api", "user", "--jq", ".login"], { encoding: "utf8" }).trim();
  } catch (e) {
    throw new Error(`gh auth check failed — run \`gh auth status\`:\n${e.stderr || e.message}`);
  }
  if (who !== ACCOUNT) {
    throw new Error(
      `gh is authenticated as "${who}", but this skill is pinned to "${ACCOUNT}".\n` +
      `Fix: gh auth switch --user ${ACCOUNT}   (or set GH_PR_ACCOUNT=${who}).`);
  }
}

function pushHead(head) {
  const slug = gh(["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]).trim();
  const url = `https://github.com/${slug}.git`;
  execFileSync("git", [
    "-c", "credential.https://github.com.helper=",
    "-c", "credential.https://github.com.helper=!gh auth git-credential",
    "push", url, `${head}:refs/heads/${head}`,
  ], { stdio: "pipe" });
}

// Does a branch exist on origin?
function remoteHas(branch) {
  return gitTry(["ls-remote", "--heads", "origin", branch]).includes(`refs/heads/${branch}`);
}

// The production base a hotfix branches from: prefer main, then master, then
// the remote's default branch.
function productionBase() {
  for (const c of ["main", "master"]) if (remoteHas(c)) return c;
  const head = gitTry(["symbolic-ref", "--short", "refs/remotes/origin/HEAD"]);
  return head ? head.replace(/^origin\//, "") : "main";
}

// Best-effort read of a version string from common manifests. Returns
// {file, version} or null. Kept intentionally small — the skill handles
// exotic ecosystems; this covers the common ones for auto-detection.
function detectVersion() {
  const readers = [
    ["package.json", (t) => JSON.parse(t).version],
    ["pyproject.toml", (t) => (t.match(/^\s*version\s*=\s*["']([^"']+)["']/m) || [])[1]],
    ["Cargo.toml", (t) => (t.match(/^\s*version\s*=\s*["']([^"']+)["']/m) || [])[1]],
    ["VERSION", (t) => t.trim() || undefined],
  ];
  for (const [file, read] of readers) {
    const raw = gitTry(["show", `HEAD:${file}`]);
    if (!raw) continue;
    try { const v = read(raw); if (v) return { file, version: v }; } catch { /* skip */ }
  }
  return null;
}

function parse(argv) {
  const pos = [], opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2), next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) opt[key] = true;
      else { opt[key] = next; i++; }
    } else pos.push(a);
  }
  return { pos, opt };
}

function die(msg) { console.error(msg); process.exit(1); }

const [cmd, ...rest] = process.argv.slice(2);
const { pos, opt } = parse(rest);

// Commands that touch GitHub get pinned to the one account first.
const REAL = new Set(["start", "open", "merge", "tag", "status"]);
if (REAL.has(cmd)) ensureAccount();

switch (cmd) {
  case "detect": {
    git(["fetch", "--prune", "--tags", "origin"]);
    const base = productionBase();
    const hasDevelop = ["develop", "development", "dev"].find(remoteHas) || null;
    // Live release lines that may also need the fix (GitHub-flow / multi-release).
    const releaseBranches = gitTry(["for-each-ref", "--format=%(refname:short)",
      "refs/remotes/origin/release/*", "refs/remotes/origin/support/*"])
      .split("\n").map((s) => s.replace(/^origin\//, "")).filter(Boolean);

    // Merge-back targets: always the production base; Git Flow adds develop.
    const targets = [base, ...(hasDevelop ? [hasDevelop] : [])];

    const flow = hasDevelop ? "git-flow" : "github-flow";
    const version = detectVersion();
    const tagCount = Number(gitTry(["tag", "--list", "v*.*.*"]).split("\n").filter(Boolean).length)
      || Number(gitTry(["tag", "--list", "[0-9]*.[0-9]*.[0-9]*"]).split("\n").filter(Boolean).length);
    const hasRemote = !!gitTry(["remote", "get-url", "origin"]);

    console.log(JSON.stringify({
      flow, base, develop: hasDevelop, targets,
      releaseBranches, version, semverTags: tagCount, hasRemote,
    }, null, 2));
    break;
  }

  case "start": {
    const base = opt.base, name = opt.name;
    if (!base || !name) die("start requires --base <branch> --name <slug>");
    const branch = name.startsWith("hotfix/") ? name : `hotfix/${name}`;
    git(["fetch", "origin", base]);
    // Branch fresh off the remote base so the fix starts from real production.
    git(["switch", "-c", branch, `origin/${base}`]);
    const sha = gitTry(["rev-parse", "HEAD"]);
    console.log(JSON.stringify({ branch, base, sha }));
    break;
  }

  case "open": {
    const head = opt.head, base = opt.base;
    if (!head || !base) die("open requires --head <branch> --base <branch>");
    pushHead(head);
    const title = opt.title || `Hotfix: ${head} → ${base}`;
    const body = opt.body || `Hotfix PR: \`${head}\` → \`${base}\`.`;
    const args = ["pr", "create", "--head", head, "--base", base,
      "--title", title, "--body", body];
    if (opt.draft) args.push("--draft");
    const url = gh(args).trim();
    const number = Number(url.split("/").pop());
    console.log(JSON.stringify({ number, url, base, head }));
    break;
  }

  case "merge": {
    const pr = pos[0];
    if (!pr) die("merge requires <pr>");
    const method = opt.method || "merge";
    const flag = { squash: "--squash", merge: "--merge", rebase: "--rebase" }[method];
    if (!flag) die(`unknown --method ${method}`);
    const head = gh(["pr", "view", pr, "--json", "headRefName", "--jq", ".headRefName"]).trim();
    const protectedHead = isProtectedBranch(head);
    const deleteBranch = !opt["no-delete-branch"] && !protectedHead;
    const args = ["pr", "merge", pr, flag];
    if (deleteBranch) args.push("--delete-branch");
    gh(args);
    if (protectedHead && !opt["no-delete-branch"]) {
      console.error(`note: kept protected source branch "${head}" (not deleted).`);
    }
    console.log(JSON.stringify({
      number: Number(pr), merged: true, method, head, branchDeleted: deleteBranch,
    }));
    break;
  }

  case "tag": {
    const name = pos[0];
    if (!name) die("tag requires <name>");
    const ref = opt.ref || "HEAD";
    const message = opt.message || `Hotfix ${name}`;
    git(["tag", "-a", name, ref, "-m", message]);
    // Push the tag over HTTPS as ACCOUNT, same as branch pushes.
    const slug = gh(["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]).trim();
    execFileSync("git", [
      "-c", "credential.https://github.com.helper=",
      "-c", "credential.https://github.com.helper=!gh auth git-credential",
      "push", `https://github.com/${slug}.git`, `refs/tags/${name}`,
    ], { stdio: "pipe" });
    console.log(JSON.stringify({ tag: name, ref, pushed: true }));
    break;
  }

  case "status": {
    const pr = pos[0];
    if (!pr) die("status requires <pr>");
    const m = gh(["pr", "view", pr, "--json",
      "number,state,mergeable,mergedAt,baseRefName,headRefName"], { json: true });
    console.log(JSON.stringify({
      number: m.number, state: m.state, mergeable: m.mergeable,
      merged: m.mergedAt != null, base: m.baseRefName, head: m.headRefName,
    }));
    break;
  }

  default:
    die(`usage: node driver.mjs <detect|start|open|merge|tag|status> ...
  detect
  start   --base <b> --name <slug>
  open    --head <b> --base <b> [--title T] [--body B] [--draft]
  merge   <pr> [--method merge|squash|rebase] [--no-delete-branch]
  tag     <name> [--message M] [--ref <branch|sha>]
  status  <pr>`);
}
