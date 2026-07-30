#!/usr/bin/env node
// driver.mjs — gh-CLI plumbing for the github-pr-workflow-only skill.
//
// A single-pass variant of github-pr-workflow: open → review → act → STOP.
// There is no fix loop, so there is no `push` command. The Pass/Failed
// *decision* is made by a Claude sub-agent the orchestrator spawns (see
// SKILL.md); the driver only ever talks to `gh`.
//
// Commands:
//   open  --head <branch> --base <branch> [--title T] [--body B] [--draft]
//         Push <head> if needed, open a PR, print JSON {number,url,base,head}.
//   context <pr>
//         Print review context for the sub-agent: title, body, files, diff.
//   pass  <pr> [--method merge|squash|rebase] [--no-delete-branch]
//         Merge the PR (default: merge commit + delete branch). Closes it on
//         merge. The default `merge` records a "Merge pull request #N from
//         <head>" commit on the base — the source branch joins back into the
//         target branch instead of being replayed as a parallel line.
//   fail  <pr> --reason <text>
//         Submit a formal PR review (event=COMMENT) with the failure reasons,
//         so the rejection lands under the "Reviews" section, then STOP. No
//         fix is applied. COMMENT rather than "request changes" because the
//         whole flow runs as one account and GitHub forbids Approve/
//         Request-changes on your own PR.
//   status <pr>
//         Print JSON {number,state,mergeable,merged,base,head}.
//
// Every command shells out to `gh`; requires `gh auth status` to be green.
//
// One-account guarantee: the whole PR process (branch push, open, merge,
// comment) runs as a single GitHub identity — ACCOUNT below. `gh` is pinned
// with `gh auth switch`, and the branch push goes over HTTPS using that same
// account's credential (via `gh auth git-credential`) instead of whatever
// SSH key `origin` happens to resolve to. Override with GH_PR_ACCOUNT=<user>.

import { execFileSync } from "node:child_process";

// Account #1 from `gh auth status` — the identity that drives every PR here.
const ACCOUNT = process.env.GH_PR_ACCOUNT || "casualattitude0";

// Long-lived branches that must never be auto-deleted when they're the source
// of a merged PR. A merge back into the target should not remove the branch
// you merged *from* if it's a shared trunk/integration/release line. Matched
// case-insensitively against the exact branch name or a leading path segment
// (e.g. `release`, `release/1.2`, `hotfix/x`). Extend with GH_PR_PROTECTED
// (comma/space-separated names or prefixes).
const PROTECTED = [
  "main", "master", "trunk", "default",
  "dev", "develop", "development",
  "release", "releases", "stable",
  "staging", "stage", "preprod", "pre-production",
  "prod", "production",
  "hotfix", "support", "next", "canary", "integration",
  ...(process.env.GH_PR_PROTECTED || "").split(/[,\s]+/).filter(Boolean),
];

// True if `name` is (or lives under) a protected long-lived branch.
function isProtectedBranch(name) {
  if (!name) return false;
  const first = String(name).toLowerCase().split("/")[0];
  return PROTECTED.map((p) => p.toLowerCase()).includes(first);
}

function gh(args, { json = false, input } = {}) {
  try {
    const out = execFileSync("gh", args, {
      encoding: "utf8",
      input,
      maxBuffer: 64 * 1024 * 1024,
    });
    return json ? JSON.parse(out) : out;
  } catch (e) {
    const msg = e.stderr || e.stdout || e.message;
    throw new Error(`gh ${args.join(" ")}\n${msg}`);
  }
}

// Make ACCOUNT the active gh account and verify it, so every `gh` call in
// this process is that identity. Idempotent — a no-op when already active.
function ensureAccount() {
  try {
    execFileSync("gh", ["auth", "switch", "--hostname", "github.com", "--user", ACCOUNT],
      { stdio: "pipe" });
  } catch { /* already active, single account, or older gh — verify below */ }
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

// Push <head> to origin's repo over HTTPS using ACCOUNT's gh credential, so
// the branch is created by the same identity that opens/merges the PR — not
// by whatever SSH key `origin` uses. Assumes ensureAccount() already ran.
function pushHead(head) {
  const slug = gh(["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]).trim();
  const url = `https://github.com/${slug}.git`;
  execFileSync("git", [
    "-c", "credential.https://github.com.helper=",
    "-c", "credential.https://github.com.helper=!gh auth git-credential",
    "push", url, `${head}:refs/heads/${head}`,
  ], { stdio: "pipe" });
}

// minimal flag parser: positional args + --key value / --bool
function parse(argv) {
  const pos = [];
  const opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) opt[key] = true;
      else { opt[key] = next; i++; }
    } else pos.push(a);
  }
  return { pos, opt };
}

function die(msg) {
  console.error(msg);
  process.exit(1);
}

const [cmd, ...rest] = process.argv.slice(2);
const { pos, opt } = parse(rest);

// Pin every real command to the one account before it touches GitHub.
const REAL = new Set(["open", "context", "pass", "fail", "status"]);
if (REAL.has(cmd)) ensureAccount();

switch (cmd) {
  case "open": {
    const head = opt.head, base = opt.base;
    if (!head || !base) die("open requires --head <branch> --base <branch>");
    // Ensure the head branch exists on the remote, pushed as ACCOUNT.
    pushHead(head);
    const title = opt.title || `Merge ${head} into ${base}`;
    const body = opt.body || `Automated PR: \`${head}\` → \`${base}\`.`;
    const args = ["pr", "create", "--head", head, "--base", base,
      "--title", title, "--body", body];
    if (opt.draft) args.push("--draft");
    const url = gh(args).trim();
    const number = Number(url.split("/").pop());
    console.log(JSON.stringify({ number, url, base, head }));
    break;
  }

  case "context": {
    const pr = pos[0];
    if (!pr) die("context requires <pr>");
    const meta = gh(["pr", "view", pr, "--json",
      "number,title,body,baseRefName,headRefName,additions,deletions,changedFiles,files"],
      { json: true });
    const diff = gh(["pr", "diff", pr]);
    console.log(`# PR #${meta.number}: ${meta.title}`);
    console.log(`# ${meta.headRefName} -> ${meta.baseRefName}`);
    console.log(`# +${meta.additions} -${meta.deletions} across ${meta.changedFiles} file(s)\n`);
    if (meta.body) console.log(`## Description\n${meta.body}\n`);
    console.log(`## Files`);
    for (const f of meta.files) console.log(`- ${f.path} (+${f.additions} -${f.deletions})`);
    console.log(`\n## Diff\n${diff}`);
    break;
  }

  case "pass": {
    const pr = pos[0];
    if (!pr) die("pass requires <pr>");
    const method = opt.method || "merge";
    const flag = { squash: "--squash", merge: "--merge", rebase: "--rebase" }[method];
    if (!flag) die(`unknown --method ${method}`);
    // Look up the source branch so we never delete a protected trunk/release
    // line, even when --delete-branch is the default.
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

  case "fail": {
    const pr = pos[0];
    const reason = opt.reason;
    if (!pr || !reason) die("fail requires <pr> --reason <text>");
    const body = `## ❌ Automated review: Changes requested\n\n${reason}\n\n` +
      `_This is a single-pass review — no automated fix will be applied. ` +
      `Address the notes above and re-run the workflow when ready._`;
    // Submit as a formal PR review (event=COMMENT) so the rejection shows up
    // under the "Reviews" section rather than as a loose conversation comment.
    // COMMENT is used instead of --request-changes because the whole flow runs
    // as a single account, and GitHub returns 422 for Approve/Request-changes
    // on your own PR. To get a true "Changes requested" state, run the review
    // step under a second account (see SKILL.md).
    gh(["pr", "review", pr, "--comment", "--body", body]);
    console.log(JSON.stringify({ number: Number(pr), reviewed: "commented", stopped: true }));
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
    die(`usage: node driver.mjs <open|context|pass|fail|status> ...
  open    --head <b> --base <b> [--title T] [--body B] [--draft]
  context <pr>
  pass    <pr> [--method merge|squash|rebase] [--no-delete-branch]
  fail    <pr> --reason <text>
  status  <pr>`);
}
