---
name: ssh-account-doctor
description: Diagnose and fix SSH connecting to GitHub (or any host) as the WRONG account when you keep multiple accounts/keys on one machine. Use whenever `git push`/`git clone`/`ssh -T` authenticates as the wrong GitHub user, a per-account host alias logs in as someone else, `Permission denied` or `does not have access to this repository` hits an account you know owns it, or the user mentions multiple SSH keys, multiple GitHub accounts, `IdentityFile`, `IdentitiesOnly`, `IdentityAgent`, ssh-agent key order, or a `Host *` catch-all overriding a per-account key. Also use to audit a `~/.ssh/config` for account-hijack risk before it bites.
license: MIT
metadata:
  author: skill-collection
  version: "1.0.0"
---

# SSH Account Doctor

Fix the classic multi-account SSH failure: you set up `github-work` and
`github-personal` aliases, each with its own `IdentityFile` and even
`IdentitiesOnly yes` — yet both still authenticate to GitHub as some *other*
account. Pushes land as the wrong user; private repos throw `Permission
denied` for an account you *know* has access.

## The mechanism (why the "obvious" config fails)

The trap is a catch-all `Host *` block with a default key plus agent loading:

```
Host *
    AddKeysToAgent yes
    IdentityFile ~/.ssh/id_ed25519   # the "default" account's key
```

Because `Host *` matches **every** host, that default key becomes a candidate
identity for your per-account aliases too, and `AddKeysToAgent yes` loads it
into the ssh-agent. Here's the killer detail: **once keys are in the agent, SSH
offers them in *agent* order, not config order.** If the default key sits ahead
of the account-specific key in the agent, it gets presented first.

GitHub accepts **any** key registered to **any** account and identifies you by
whichever key authenticates *first*. So the default key matches, the session
logs in as that account, and your account-specific key is never even offered.

`IdentitiesOnly yes` does **not** rescue you: it restricts SSH to keys named by
`IdentityFile` directives — but the `Host *` block *is* an `IdentityFile`
directive, so the default key stays an allowed (and earlier-ordered) candidate.

**The fix:** add `IdentityAgent none` to each account block. That alias then
bypasses the agent entirely and reads only its own `IdentityFile`(s) in config
order, so the account-specific key is offered first and the login resolves to
the right account.

## The tool

[`driver.mjs`](driver.mjs) is deterministic Node (no deps, no network except
`verify`). Run it from this directory, or with the full path
`node git/ssh-account-doctor/driver.mjs ...` from the repo root.

| Command | What it does |
|---|---|
| `diagnose` | Read the **effective** config (`ssh -G`) + agent key order (`ssh-add -l`); flag every alias the agent can hijack. Read-only. |
| `verify [--expect A=login]` | Actually connect (`ssh -T <alias>`) and report the real GitHub login + accepted key per alias. Hits the network. |
| `plan` | Print the exact config diff `fix` would apply. No write. |
| `fix` | Back up the config, insert `IdentityAgent none` into each account block, print backup path + diff. |

By default the commands target **every concrete `Host` alias that declares its
own `IdentityFile`** (i.e. your per-account blocks — never `Host *`). Narrow
with repeatable `--alias <name>`. Point at a non-default config with
`SSH_CONFIG=<path>`.

## Workflow

Work in this order — diagnose before touching anything, preview before writing,
verify after. Editing `~/.ssh/config` is sensitive, so `fix` always writes a
timestamped `.bak` first, and you should show the user the diff before applying.

1. **Diagnose.** `node driver.mjs diagnose`
   Read the JSON. `atRisk` lists aliases the agent can hijack (they still
   consult the agent *and* the agent holds keys). `agentKeyOrder` shows exactly
   which key would be offered first — position 0 is the culprit when it's the
   default/wrong-account key. An alias already carrying `IdentityAgent none`
   shows `fixApplied: true` and won't appear in `atRisk`.

2. **Confirm the symptom (optional but reassuring).**
   `node driver.mjs verify --expect github-work=work-login --expect github-personal=personal-login`
   Each alias reports the real `login` it resolves to and the `acceptedKey`.
   Without `--expect` it just prints what each alias *is* right now — useful to
   catch the wrong-account login in the act. (Needs network + your keys on the
   agent or disk; a passphrase-locked key with no agent may fail here — see
   Gotchas.)

3. **Preview the fix.** `node driver.mjs plan`
   Shows the one-line `+ IdentityAgent none` insertion per block. Show this diff
   to the user and get a nod before writing — it's their `~/.ssh/config`.

4. **Apply.** `node driver.mjs fix`
   Backs up to `~/.ssh/config.bak.<pid>`, inserts the lines, prints the diff.
   To roll back: `cp ~/.ssh/config.bak.<pid> ~/.ssh/config`.

5. **Re-verify.** `node driver.mjs verify --expect ...`
   Every alias should now resolve to its intended account. If one still doesn't,
   jump to Gotchas — the usual culprit is a stale or swapped key file, not the
   config.

Then confirm end-to-end the way the user actually hits it:
`ssh -T git@github-work` should greet the work account;
`GIT_SSH_COMMAND='ssh -v' git ls-remote git@github-work:...` shows which key won.

## When `IdentityAgent none` isn't enough

`IdentityAgent none` is the right fix **when each account key is passphraseless**
(GitHub deploy-style keys usually are), because bypassing the agent means the
key is read straight from disk with no prompt. If a key **has a passphrase**,
bypassing the agent forces an interactive prompt on every connection — annoying
and script-hostile. In that case prefer per-alias agent scoping instead:
give each alias its own agent socket, or keep the agent but ensure only the
correct key is loaded for that host. Ask the user whether their account keys
have passphrases before defaulting to `IdentityAgent none`.

**The other real-world trap — the key file itself is wrong.** During messy
multi-account setups, key files get overwritten, swapped, or point at the wrong
public key on GitHub. If `verify` still shows the wrong account (or a flat
`Permission denied`) *after* the config fix, stop trusting the filenames and
check the actual keys:

```bash
ssh-keygen -lf ~/.ssh/id_ed25519_work           # fingerprint of the private key's pair
ssh-keygen -yf ~/.ssh/id_ed25519_work | ssh-keygen -lf -   # fingerprint derived from the key
```

Compare against the fingerprints GitHub lists under **Settings → SSH and GPG
keys** for that account. When a key is ambiguous or has been clobbered, the
clean move is a fresh dedicated key with an unmistakable name:

```bash
ssh-keygen -t ed25519 -C "work-account" -f ~/.ssh/id_ed25519_work_gh -N ""
#  -N ""  => passphraseless, so IdentityAgent none stays prompt-free
```

Add its `.pub` to the intended GitHub account, point that alias's `IdentityFile`
at it, and re-verify. A dedicated, clearly-named key per account removes the
"which key is this really?" confusion for good.

## Gotchas

- **Agent order, not config order, decides.** This is the whole bug. You can
  have a flawless per-account block and still lose because a `Host *` key loaded
  earlier in the agent gets offered first. `diagnose` surfaces this via
  `agentKeyOrder`; `ssh-add -l` shows it raw.
- **`IdentitiesOnly yes` is not a fix here.** It only limits SSH to
  `IdentityFile`-named keys — and the `Host *` default key is exactly that. Keep
  it (it's good hygiene) but don't rely on it to isolate accounts.
- **`ssh -G <alias>` is the source of truth.** It resolves Includes, `Host *`
  merges, and every directive the way the real client will. Hand-reading the
  file misses included snippets — the driver uses `ssh -G` for diagnosis and
  only edits the raw file for the `fix` insertion.
- **`ssh -T git@github.com` "succeeds" with exit code 1.** GitHub has no shell,
  so a *successful* auth still exits non-zero with `Hi <user>! You've
  successfully authenticated...`. The `login` in that line is the ground truth
  for which account you are; the driver parses it and doesn't treat exit 1 as
  failure.
- **`fix` is insert-only and reversible.** It never edits existing directives —
  if a block already has an `IdentityAgent`, it's left untouched and reported as
  unchanged. Every apply leaves a `.bak.<pid>` next to the config.
- **macOS Keychain can re-add keys.** `UseKeychain yes` + `AddKeysToAgent yes`
  can silently reload the default key into the agent on login, re-arming the
  trap. `IdentityAgent none` on the account blocks makes them immune regardless.

## Relationship to the other git skills

This skill owns the **SSH-key identity** side of the multi-account problem —
which account a raw `git`/`ssh` operation authenticates as. The
[`github-pr-merge`](../github-pr-merge/SKILL.md) and
[`github-pr-workflow`](../github-pr-workflow/SKILL.md) skills own the **`gh`
CLI / PR** side, pinning the PR process to one `gh` account and pushing branches
over HTTPS with that account's credential. If a push lands as the wrong user,
this skill diagnoses the key; if a *PR* opens as the wrong user, those do.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `verify` shows the wrong `login` after `fix` | Key file is wrong/swapped — check fingerprints against GitHub (see "When `IdentityAgent none` isn't enough"). |
| `verify` fails with no `Hi <user>!` line | Auth failed (key not on that account) or a passphrase-locked key with no agent — run `ssh -T -v <alias>` and read the offered keys. |
| `diagnose` finds no aliases | No concrete `Host` block declares its own `IdentityFile`. Pass `--alias <name>` explicitly, or the accounts aren't set up as aliases yet. |
| Prompted for a passphrase after `fix` | The account key isn't passphraseless — see "When `IdentityAgent none` isn't enough" for the per-agent-socket alternative. |
| Fixed the config but `git push` still wrong | The remote URL uses `git@github.com`, not your alias. Point it at the alias: `git remote set-url origin git@github-work:owner/repo.git`. |
