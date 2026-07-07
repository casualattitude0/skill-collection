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
//   fail  <pr> --reason <text>
//         Post a review comment with the failure reasons (requests changes).
//   status <pr>
//         Print JSON {number,state,mergeable,merged,base,head}.
//
// Every command shells out to `gh`; requires `gh auth status` to be green.

import { execFileSync } from "node:child_process";

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

switch (cmd) {
  case "open": {
    const head = opt.head, base = opt.base;
    if (!head || !base) die("open requires --head <branch> --base <branch>");
    // Ensure the head branch exists on the remote.
    try {
      execFileSync("git", ["push", "-u", "origin", head], { stdio: "pipe" });
    } catch (e) {
      // Already pushed / up to date is fine; surface real failures.
      const m = (e.stderr || "").toString();
      if (!/up-to-date|up to date|Everything up-to-date/.test(m)) {
        // try a plain push (branch may already track)
        try { execFileSync("git", ["push", "origin", head], { stdio: "pipe" }); }
        catch { /* let gh pr create report a clearer error */ }
      }
    }
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
    die(`usage: node driver.mjs <open|context|pass|fail|status> ...
  open    --head <b> --base <b> [--title T] [--body B] [--draft]
  context <pr>
  pass    <pr> [--method merge|squash|rebase] [--no-delete-branch]
  fail    <pr> --reason <text>
  status  <pr>`);
}
