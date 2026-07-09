#!/usr/bin/env bash
# Install product-planning skills (whereto, prd) into AI agent harness directories.
#
# Usage:
#   ./product-planning/bin/install.sh                    # interactive: scope + harnesses
#   ./product-planning/bin/install.sh --user           # all harnesses under ~/
#   ./product-planning/bin/install.sh --project          # all harnesses under ./
#   ./product-planning/bin/install.sh --user --harness claude,cursor
#   ./product-planning/bin/install.sh --project whereto  # one skill only
#   ./product-planning/bin/install.sh --list             # list skills + harnesses
#   ./product-planning/bin/install.sh --copy --user      # copy instead of symlink
#
# Default: symlink into every known harness (updates when this repo changes).
# Compatible with bash 3.2+ (macOS default).

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PKG_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILLS_DIR="$PKG_DIR"

# id:dot_dir:skills_subpath
HARNESS_REGISTRY="claude:.claude:skills cursor:.cursor:skills agents:.agents:skills codex:.codex:skills gemini:.gemini:skills opencode:.opencode:skills openclaw:.openclaw:skills hermes:.hermes:skills/writing pi:.pi:skills kiro:.kiro:skills trae:.trae:skills trae-cn:.trae-cn:skills rovodev:.rovodev:skills"

SCOPE=""
MODE="link"
FORCE=false
LIST=false
SELECTED_HARNESSES=""
SKILL_NAMES=""

usage() {
  cat <<'EOF'
product-planning skills installer

Installs whereto and prd into AI agent skill directories.

Usage:
  install.sh [options] [skill-name...]

Options:
  -u, --user       Install to home directory harnesses (~/.claude/skills, etc.)
  -p, --project    Install to current project harnesses (./.claude/skills, etc.)
  -h, --harness    Comma-separated harness IDs (default: all)
                   claude, cursor, agents, codex, gemini, opencode, openclaw,
                   hermes, pi, kiro, trae, trae-cn, rovodev
  --copy           Copy files instead of symlinking
  --link           Symlink (default)
  -f, --force      Overwrite existing installations
  -l, --list       List available skills and harnesses
  --help           Show this help

Examples:
  install.sh --user
  install.sh --project whereto
  install.sh --user --harness claude,cursor,agents whereto
EOF
}

harness_meta() {
  local id="$1"
  local entry id_part
  for entry in $HARNESS_REGISTRY; do
    id_part="${entry%%:*}"
    if [ "$id_part" = "$id" ]; then
      local rest="${entry#*:}"
      local dot="${rest%%:*}"
      local sub="${rest#*:}"
      echo "$dot|$sub"
      return 0
    fi
  done
  return 1
}

list_skills() {
  for name in whereto prd; do
    if [ -f "$SKILLS_DIR/$name/SKILL.md" ]; then
      echo "  $name"
    fi
  done
}

list_harnesses() {
  local entry id_part rest dot sub
  for entry in $HARNESS_REGISTRY; do
    id_part="${entry%%:*}"
    rest="${entry#*:}"
    dot="${rest%%:*}"
    sub="${rest#*:}"
    echo "  $id_part → $dot/$sub/<skill>"
  done
}

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      -u|--user) SCOPE="user" ;;
      -p|--project) SCOPE="project" ;;
      --copy) MODE="copy" ;;
      --link) MODE="link" ;;
      -f|--force) FORCE=true ;;
      -l|--list) LIST=true ;;
      --help|-h) HELP=true ;;
      --harness)
        shift
        SELECTED_HARNESSES="${1:-}"
        ;;
      -*)
        echo "Unknown option: $1" >&2
        HELP=true
        ;;
      *)
        SKILL_NAMES="$SKILL_NAMES $1"
        ;;
    esac
    shift
  done
  SKILL_NAMES="${SKILL_NAMES# }"
}

resolve_scope() {
  if [ -n "$SCOPE" ]; then
    return
  fi
  if [ ! -t 0 ]; then
    echo "Non-interactive shell; defaulting to --user."
    SCOPE="user"
    return
  fi
  echo "Install scope:"
  echo "  1) User    (~/*) — all projects"
  echo "  2) Project (./.*) — this repo only"
  printf "Choose [1/2] (default 1): "
  read -r choice
  case "${choice:-1}" in
    2) SCOPE="project" ;;
    *) SCOPE="user" ;;
  esac
}

resolve_harnesses() {
  if [ -n "$SELECTED_HARNESSES" ]; then
    # Split comma-separated list into space-separated tokens
    local normalized=""
    local part
    OLD_IFS="$IFS"
    IFS=','
    for part in $SELECTED_HARNESSES; do
      part="$(echo "$part" | tr -d ' ')"
      [ -z "$part" ] && continue
      if [ -z "$normalized" ]; then
        normalized="$part"
      else
        normalized="$normalized $part"
      fi
    done
    IFS="$OLD_IFS"
    SELECTED_HARNESSES="$normalized"
    return
  fi
  local entry id_part
  for entry in $HARNESS_REGISTRY; do
    id_part="${entry%%:*}"
    if [ -z "$SELECTED_HARNESSES" ]; then
      SELECTED_HARNESSES="$id_part"
    else
      SELECTED_HARNESSES="$SELECTED_HARNESSES $id_part"
    fi
  done
}

harness_root() {
  local dot="$1"
  if [ "$SCOPE" = "user" ]; then
    echo "$HOME/$dot"
  else
    echo "$(pwd)/$dot"
  fi
}

install_skill() {
  local harness_id="$1"
  local skill="$2"
  local meta dot sub root dest_dir dest src

  meta="$(harness_meta "$harness_id")" || {
    echo "Unknown harness: $harness_id" >&2
    return 0
  }
  dot="${meta%%|*}"
  sub="${meta#*|}"
  root="$(harness_root "$dot")"
  src="$SKILLS_DIR/$skill"
  dest_dir="$root/$sub"
  dest="$dest_dir/$skill"

  if [ ! -f "$src/SKILL.md" ]; then
    echo "  skip $skill — no SKILL.md at $src" >&2
    return 0
  fi

  mkdir -p "$dest_dir"

  if [ -e "$dest" ] && [ "$FORCE" != true ]; then
    echo "  · $harness_id: $skill already exists (use --force)"
    return 0
  fi

  if [ -e "$dest" ]; then
    rm -rf "$dest"
  fi

  if [ "$MODE" = "link" ]; then
    ln -sfn "$src" "$dest"
    echo "  ✓ $harness_id: linked $dest → $src"
  else
    cp -R "$src" "$dest"
    echo "  ✓ $harness_id: copied $dest"
  fi
}

main() {
  parse_args "$@"

  if [ "$HELP" = true ]; then
    usage
    exit 0
  fi

  if [ "$LIST" = true ]; then
    echo "Skills:"
    list_skills
    echo ""
    echo "Harnesses:"
    list_harnesses
    exit 0
  fi

  if [ -z "$SKILL_NAMES" ]; then
    SKILL_NAMES="whereto prd"
  fi

  resolve_scope
  resolve_harnesses

  echo "Installing product-planning skills ($MODE mode, scope: $SCOPE)"
  echo "Skills: $SKILL_NAMES"
  echo ""

  local id skill
  for id in $SELECTED_HARNESSES; do
    echo "[$id]"
    for skill in $SKILL_NAMES; do
      install_skill "$id" "$skill"
    done
    echo ""
  done

  echo "Done. Restart your agent IDE or reload skills to pick up changes."
  echo "See product-planning/whereto/INSTALL.md for per-IDE notes."
}

main "$@"
