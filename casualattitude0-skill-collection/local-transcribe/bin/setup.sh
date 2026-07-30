#!/usr/bin/env bash
# Set up local-transcribe on this machine. Idempotent — safe to re-run.
#
#   setup.sh          install anything missing
#   setup.sh --check  report only, change nothing
#
# Never uses sudo. If a system package manager is needed, it prints the command
# and stops so you can run it yourself.
set -uo pipefail

CHECK=0
[ "${1:-}" = "--check" ] && CHECK=1

ok=0; bad=0
have() { command -v "$1" >/dev/null 2>&1; }
pass() { echo "  ✅ $*"; ok=$((ok+1)); }
fail() { echo "  ❌ $*"; bad=$((bad+1)); }
run()  { if [ "$CHECK" = 1 ]; then echo "  [check] would run: $*"; else echo "  → $*"; "$@"; fi; }

os="$(uname -s)"; arch="$(uname -m)"
echo "local-transcribe setup — $os/$arch"
echo

# ── 1. pipx ───────────────────────────────────────────────────────────────────
echo "pipx (isolated CLI installs)"
if have pipx; then
  pass "pipx present"
else
  if have brew; then run brew install pipx && run pipx ensurepath
  elif have python3; then run python3 -m pip install --user pipx && run python3 -m pipx ensurepath
  else fail "no python3 — install Python 3.10+ first"
  fi
  have pipx && pass "pipx installed" || fail "pipx still missing — open a new shell and re-run"
fi
echo

# ── 2. ffmpeg ─────────────────────────────────────────────────────────────────
echo "ffmpeg (audio decode/resample)"
if have ffmpeg; then
  pass "ffmpeg present"
elif [ "$CHECK" = 1 ]; then
  fail "ffmpeg missing"
elif have brew; then
  run brew install ffmpeg
  have ffmpeg && pass "ffmpeg installed" || fail "ffmpeg install failed"
else
  fail "ffmpeg missing — install it yourself, e.g.:"
  echo "       Debian/Ubuntu:  sudo apt install ffmpeg"
  echo "       Fedora:         sudo dnf install ffmpeg"
  echo "       Windows:        winget install Gyan.FFmpeg"
fi
echo

# ── 3. yt-dlp ─────────────────────────────────────────────────────────────────
echo "yt-dlp (URL → audio)"
if have yt-dlp; then
  pass "yt-dlp present"
else
  run pipx install "yt-dlp[default]"
  have yt-dlp && pass "yt-dlp installed" || fail "yt-dlp install failed"
fi
# yt-dlp needs a JS runtime for YouTube's player challenges.
if have node; then
  cfg="${XDG_CONFIG_HOME:-$HOME/.config}/yt-dlp/config"
  if grep -qxF -- '--js-runtimes node' "$cfg" 2>/dev/null; then
    pass "yt-dlp JS runtime configured"
  elif [ "$CHECK" = 1 ]; then
    fail "yt-dlp JS runtime not configured ($cfg)"
  else
    mkdir -p "$(dirname "$cfg")" && printf '%s\n' '--js-runtimes node' >> "$cfg" \
      && pass "yt-dlp JS runtime configured" || fail "could not write $cfg"
  fi
else
  fail "node not found — YouTube extraction may fail on challenged videos"
fi
echo

# ── 4. whisper backend ────────────────────────────────────────────────────────
# Apple Silicon gets MLX (Metal). Everything else gets CTranslate2 (CPU/CUDA).
if [ "$os" = Darwin ] && [ "$arch" = arm64 ]; then
  want=mlx_whisper; pkg=mlx-whisper; why="Apple Silicon → MLX, Metal-accelerated"
else
  want=whisper-ctranslate2; pkg=whisper-ctranslate2; why="$os/$arch → CTranslate2, CPU/CUDA"
fi
echo "whisper backend ($why)"
if have "$want"; then
  pass "$want present"
elif have mlx_whisper || have whisper-ctranslate2; then
  pass "a different backend is already installed — transcribe.sh will use it"
else
  run pipx install "$pkg"
  have "$want" && pass "$want installed" || fail "$pkg install failed"
fi
echo

echo "──────────────────────────────"
if [ "$bad" -eq 0 ]; then
  echo "Ready. $ok checks passed."
  echo "Models download automatically on first run (~1.6 GB, cached in ~/.cache/huggingface)."
  exit 0
else
  echo "$ok ok, $bad need attention (see above)."
  exit 1
fi
