#!/usr/bin/env python3
"""skill-library — an MCP server that lets jev pick a skill and hands over its content.

Skills with status `library` in MANIFEST.md are not symlinked into
~/.claude/skills, so their descriptions cost nothing per session. An agent
reaches them through three tools:

  find_skill(task)        jev picks from the catalog; returns choice + band
  get_skill(name, file?)  SKILL.md (or one supporting file) with paths resolved
  list_skills()           the catalog itself, for when jev is unavailable

Transport: MCP over stdio, newline-delimited JSON-RPC. Stdlib only.
Register:  claude mcp add --scope user skill-library -- python3 <this file>
"""
import importlib.machinery
import importlib.util
import json
import os
import re
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MANIFEST = os.path.join(REPO_ROOT, "MANIFEST.md")
JEV_PATH = os.path.join(REPO_ROOT, "casualattitude0-skill-collection", "manager", "scripts", "jev")

SERVED = {"library", "linked"}           # statuses get_skill will serve
MANAGER_SIDE = {"manager", "model-selection"}  # routing skills, never a worker's pick
DESC_CAP = 800                           # chars of description handed to jev per option
MIN_P = 0.05                             # find_skill returns every candidate at or above this
MAX_CANDIDATES = 5
MAX_FILES_LISTED = 60

INSTRUCTIONS = (
    "Skill library: most skills are not preloaded. Before a task that may have an "
    "established procedure (review, testing, git/PR flow, writing, design, debugging, "
    "research, a named tool), call find_skill with the task in English, choose among the "
    "candidates it returns, then call get_skill and follow it. When briefing a subagent, name the "
    "skill and tell it to call get_skill first."
)


def _load_jev():
    loader = importlib.machinery.SourceFileLoader("jev", JEV_PATH)
    spec = importlib.util.spec_from_loader("jev", loader)
    mod = importlib.util.module_from_spec(spec)
    loader.exec_module(mod)
    return mod


def manifest_rows():
    """{name: {"dir": abs path, "status": str}} from the MANIFEST skills table."""
    rows = {}
    with open(MANIFEST, encoding="utf-8") as f:
        for line in f:
            if not line.startswith("| ") or "---" in line or line.startswith("| Skill |"):
                continue
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) < 3 or not cells[0]:
                continue
            rows[cells[0]] = {"dir": os.path.join(REPO_ROOT, cells[1]), "status": cells[2]}
    return rows


def frontmatter(path):
    try:
        with open(path, encoding="utf-8") as f:
            text = f.read()
    except OSError:
        return None, None
    m = re.match(r"---\n(.*?)\n---\n?", text, re.S)
    return (m.group(1) if m else ""), text


def description(fm):
    d = re.search(r"^description:\s*(.*?)(?=\n[A-Za-z_-]+:|\Z)", fm, re.S | re.M)
    if not d:
        return ""
    desc = d.group(1).strip()
    if desc[:1] in "|>":
        desc = desc[1:]
    return " ".join(desc.strip().strip("'\"").split())


def catalog():
    """Skills jev may pick: served, model-invocable, not manager-side."""
    out = {}
    for name, row in sorted(manifest_rows().items()):
        if row["status"] not in SERVED or name in MANAGER_SIDE:
            continue
        fm, _ = frontmatter(os.path.join(row["dir"], "SKILL.md"))
        if fm is None or re.search(r"^disable-model-invocation:\s*true", fm, re.M):
            continue
        out[name] = description(fm)[:DESC_CAP]
    return out


# ───────────────────────────── tools ─────────────────────────────

def tool_find_skill(args):
    task = (args.get("task") or "").strip()
    if not task:
        return {"ok": False, "error": "task is required"}, True
    min_p = float(args.get("min_p") or MIN_P)
    cands = catalog()
    if len(cands) > 254:
        return {"ok": False, "error": f"{len(cands)} candidates exceed jev's 255-option limit; "
                "split the catalog into groups"}, True
    jev = _load_jev()
    criteria = {n: (d or None) for n, d in cands.items()}
    criteria["none"] = jev.NONE_DESCRIPTION
    state = {"task": task}
    if args.get("context"):
        state["context"] = args["context"]
    resp, err = jev.call(state, {"pick": {"type": "choice",
                                          "instructions": jev.PICK_INSTRUCTIONS["skills"],
                                          "criteria": criteria}})
    if err:
        # Fail open: hand back the catalog so the caller can choose itself.
        return {"ok": False, "band": "ignore", "error": err,
                "fallback": "choose from catalog yourself",
                "catalog": {n: d[:160] for n, d in cands.items()}}, False
    ans = resp["answers"]["pick"]
    ranked = sorted(ans["probabilities"].items(), key=lambda kv: -kv[1])
    # Every skill jev gives real weight to, so the caller decides between close calls.
    hits = [(n, p) for n, p in ranked if n != "none" and p >= min_p][:MAX_CANDIDATES]
    if not hits:
        nxt = "no skill clears the threshold; proceed without one"
    elif len(hits) == 1:
        nxt = f"one candidate; get_skill({hits[0][0]!r}) and follow it"
    else:
        nxt = ("several candidates: read their descriptions, pick the one that fits "
               "(or load more than one if they cover different parts), then get_skill")
    return {
        "ok": True,
        "choice": ans["choice"],
        "confidence": round(ans["confidence"], 3),
        "band": jev.band(ans["confidence"]),
        "none_p": round(ans["probabilities"].get("none", 0.0), 3),
        "candidates": [{"name": n, "p": round(p, 3), "description": cands.get(n, "")[:300]}
                       for n, p in hits],
        "jev": resp.get("model"),
        "next": nxt,
    }, False


def _resolve(text, name, base):
    text = text.replace("${CLAUDE_SKILL_DIR}", base)
    for prefix in ("~/.claude/skills/", "$HOME/.claude/skills/"):
        text = text.replace(f"{prefix}{name}/", base + "/").replace(f"{prefix}{name}`", base + "`")
    return text


def tool_get_skill(args):
    name = (args.get("name") or "").strip()
    row = manifest_rows().get(name)
    if not row:
        return f"unknown skill: {name!r}. Call list_skills or find_skill.", True
    if row["status"] not in SERVED:
        return f"{name} is {row['status']} in MANIFEST.md; not served.", True
    base = row["dir"]
    rel = args.get("file")
    if rel:
        path = os.path.realpath(os.path.join(base, rel))
        if not path.startswith(os.path.realpath(base) + os.sep):
            return "file must stay inside the skill directory", True
        try:
            with open(path, encoding="utf-8") as f:
                return _resolve(f.read(), name, base), False
        except (OSError, UnicodeDecodeError) as e:
            return f"cannot read {rel}: {e}", True
    _, text = frontmatter(os.path.join(base, "SKILL.md"))
    if text is None:
        return f"{name}: SKILL.md missing at {base}", True
    files = []
    for root, dirs, fnames in os.walk(base):
        dirs[:] = [d for d in dirs if not d.startswith(".") and d != "__pycache__"]
        for fn in fnames:
            r = os.path.relpath(os.path.join(root, fn), base)
            if r != "SKILL.md" and not fn.startswith("."):
                files.append(r)
    files.sort()
    more = f" (+{len(files) - MAX_FILES_LISTED} more)" if len(files) > MAX_FILES_LISTED else ""
    header = (
        f"<skill name=\"{name}\" base_dir=\"{base}\">\n"
        f"Relative paths in this skill resolve against base_dir. Read supporting files with "
        f"get_skill(name, file=...) or directly from base_dir; run scripts from there.\n"
        f"Supporting files: {', '.join(files[:MAX_FILES_LISTED]) or 'none'}{more}\n\n"
    )
    return header + _resolve(text, name, base) + "\n</skill>", False


def tool_list_skills(_args):
    return {n: d[:160] for n, d in catalog().items()}, False


TOOLS = {
    "find_skill": (tool_find_skill, {
        "description": "Ask jev which library skills fit a task. Returns every candidate "
                       "whose probability clears min_p (often one, several when the call is "
                       "close) for you to choose from. Write the task in English.",
        "inputSchema": {"type": "object", "properties": {
            "task": {"type": "string", "description": "The task or subagent brief, in English"},
            "context": {"type": "string", "description": "Facts the task text does not carry"},
            "min_p": {"type": "number", "description": "Probability floor for a candidate (default 0.05)"},
        }, "required": ["task"]},
    }),
    "get_skill": (tool_get_skill, {
        "description": "Return a library skill's SKILL.md with its base_dir and file list, "
                       "or one supporting file when `file` is given. Follow it as if the skill were loaded.",
        "inputSchema": {"type": "object", "properties": {
            "name": {"type": "string"},
            "file": {"type": "string", "description": "Path relative to the skill directory"},
        }, "required": ["name"]},
    }),
    "list_skills": (tool_list_skills, {
        "description": "List every library skill jev can pick, with a short description. "
                       "Use only when find_skill fails.",
        "inputSchema": {"type": "object", "properties": {}},
    }),
}


# ───────────────────────────── MCP stdio ─────────────────────────────

def reply(msg_id, result=None, error=None):
    msg = {"jsonrpc": "2.0", "id": msg_id}
    if error:
        msg["error"] = error
    else:
        msg["result"] = result
    sys.stdout.write(json.dumps(msg, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def handle(req):
    method, msg_id, params = req.get("method"), req.get("id"), req.get("params") or {}
    if msg_id is None:  # notification
        return
    if method == "initialize":
        reply(msg_id, {
            "protocolVersion": params.get("protocolVersion", "2025-06-18"),
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "skill-library", "version": "1.0.0"},
            "instructions": INSTRUCTIONS,
        })
    elif method == "ping":
        reply(msg_id, {})
    elif method == "tools/list":
        reply(msg_id, {"tools": [{"name": n, **spec} for n, (_, spec) in TOOLS.items()]})
    elif method == "tools/call":
        entry = TOOLS.get(params.get("name"))
        if not entry:
            reply(msg_id, error={"code": -32602, "message": f"unknown tool {params.get('name')}"})
            return
        try:
            out, is_err = entry[0](params.get("arguments") or {})
        except Exception as e:  # never kill the server over one call
            out, is_err = f"{type(e).__name__}: {e}", True
        text = out if isinstance(out, str) else json.dumps(out, indent=1, ensure_ascii=False)
        reply(msg_id, {"content": [{"type": "text", "text": text}], "isError": is_err})
    else:
        reply(msg_id, error={"code": -32601, "message": f"method not found: {method}"})


def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError:
            continue
        handle(req)


if __name__ == "__main__":
    main()
