#!/usr/bin/env node
// driver.mjs — gh-CLI plumbing for the github-pr-workflow skill.
//
// The deterministic GitHub operations live here; the Pass/Failed *decision*
// is made by a Claude sub-agent the orchestrator spawns (see SKILL.md).
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
//   push  <branch>
//         Push <branch> to origin as ACCOUNT (used by the fix loop after a
//         Failed verdict, so the fix commits land under the same identity).
//   fail  <pr> --reason <text>
//         Post a review comment with the failure reasons (requests changes).
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
const REAL = new Set(["open", "context", "pass", "fail", "status", "push"]);
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
    const args = ["pr", "merge", pr, flag];
    if (!opt["no-delete-branch"]) args.push("--delete-branch");
    gh(args);
    console.log(JSON.stringify({ number: Number(pr), merged: true, method }));
    break;
  }

  case "push": {
    const head = pos[0] || opt.head;
    if (!head) die("push requires <branch>");
    pushHead(head);
    console.log(JSON.stringify({ pushed: head, account: ACCOUNT }));
    break;
  }

  case "fail": {
    const pr = pos[0];
    const reason = opt.reason;
    if (!pr || !reason) die("fail requires <pr> --reason <text>");
    const body = `## ❌ Automated review: Failed\n\n${reason}\n\n` +
      `_Pushed fixes will appear as new commits on this PR._`;
    gh(["pr", "comment", pr, "--body", body]);
    console.log(JSON.stringify({ number: Number(pr), commented: true }));
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
    die(`usage: node driver.mjs <open|context|pass|fail|push|status> ...
  open    --head <b> --base <b> [--title T] [--body B] [--draft]
  context <pr>
  pass    <pr> [--method merge|squash|rebase] [--no-delete-branch]
  fail    <pr> --reason <text>
  push    <branch>
  status  <pr>`);
}
