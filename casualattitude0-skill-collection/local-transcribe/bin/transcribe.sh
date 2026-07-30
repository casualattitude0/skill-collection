#!/usr/bin/env bash
# Local speech-to-text. No API key, no upload — audio never leaves the machine.
#
#   transcribe.sh <URL|FILE> [--lang zh] [--out DIR] [--model NAME] [--backend auto|mlx|ct2]
#
# URL: anything yt-dlp supports (YouTube, Bilibili, podcast links, ...).
# FILE: any audio or video file ffmpeg can read.
# Writes <out>/<slug>.{txt,srt,vtt,json}; prints the .txt path on stdout.
set -euo pipefail

OUT="$PWD"
LANG=""
MODEL=""
BACKEND="auto"
SRC=""

while [ $# -gt 0 ]; do
  case "$1" in
    --lang)    LANG="$2";    shift 2 ;;
    --out)     OUT="$2";     shift 2 ;;
    --model)   MODEL="$2";   shift 2 ;;
    --backend) BACKEND="$2"; shift 2 ;;
    -h|--help) sed -n '2,8p' "$0" | cut -c3-; exit 0 ;;
    -*) echo "unknown flag: $1" >&2; exit 1 ;;
    *) SRC="$1"; shift ;;
  esac
done

[ -n "$SRC" ] || { sed -n '2,8p' "$0" | cut -c3- >&2; exit 1; }

die() { echo "error: $*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

# ── pick a backend ────────────────────────────────────────────────────────────
# mlx: Apple Silicon, Metal-accelerated. ct2: whisper-ctranslate2, runs anywhere.
if [ "$BACKEND" = auto ]; then
  if have mlx_whisper; then BACKEND=mlx
  elif have whisper-ctranslate2; then BACKEND=ct2
  else die "no whisper backend found. Run: $(dirname "$0")/setup.sh"
  fi
fi

case "$BACKEND" in
  mlx) have mlx_whisper        || die "backend 'mlx' requested but mlx_whisper is not installed" ;;
  ct2) have whisper-ctranslate2 || die "backend 'ct2' requested but whisper-ctranslate2 is not installed" ;;
  *)   die "unknown backend: $BACKEND (expected auto|mlx|ct2)" ;;
esac

have ffmpeg || die "ffmpeg not found. Run: $(dirname "$0")/setup.sh"

mkdir -p "$OUT"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# ── get 16 kHz mono audio ─────────────────────────────────────────────────────
if [ -f "$SRC" ]; then
  slug="$(basename "${SRC%.*}")"
  ffmpeg -nostdin -loglevel error -i "$SRC" -vn -ac 1 -ar 16000 "$work/audio.wav"
else
  have yt-dlp || die "yt-dlp not found (needed for URLs). Run: $(dirname "$0")/setup.sh"
  echo "→ downloading audio…" >&2
  yt-dlp -f bestaudio -x --audio-format wav \
         --postprocessor-args "-ac 1 -ar 16000" \
         -o "$work/audio.%(ext)s" "$SRC" >&2
  # Keep the title readable — strip only path-hostile characters, not every
  # non-ASCII byte (a CJK title must survive as a CJK filename). `cut` counts
  # bytes, so an 80-byte cut lands mid-character on CJK; iconv -c drops the
  # broken tail rather than leaving a name the filesystem will reject.
  slug="$(yt-dlp --print "%(title)s" --skip-download "$SRC" 2>/dev/null \
          | tr -d '\000-\037' | sed 's#[/\\:*?"<>|]#_#g; s#[[:space:]]\{1,\}#_#g' \
          | cut -c1-80 | iconv -c -f UTF-8 -t UTF-8 2>/dev/null || true)"
  [ -n "$slug" ] || slug="transcript"
fi

# Whatever the name ended up as, prove the filesystem accepts it *before*
# spending GPU minutes — a rejected name must not cost a finished transcript.
if ! : > "$OUT/$slug.probe" 2>/dev/null; then
  echo "warn: filesystem rejected '$slug' — falling back to 'transcript'" >&2
  slug=transcript
fi
rm -f "$OUT/$slug.probe"
[ -f "$work/audio.wav" ] || die "no audio produced from: $SRC"

# ── transcribe ────────────────────────────────────────────────────────────────
echo "→ transcribing locally (backend: $BACKEND)…" >&2
if [ "$BACKEND" = mlx ]; then
  mlx_whisper "$work/audio.wav" \
    --model "${MODEL:-mlx-community/whisper-large-v3-turbo}" \
    ${LANG:+--language "$LANG"} \
    --output-dir "$work" --output-name audio --output-format all >&2
else
  whisper-ctranslate2 "$work/audio.wav" \
    --model "${MODEL:-large-v3}" \
    ${LANG:+--language "$LANG"} \
    --output_dir "$work" --output_format all >&2
fi

wrote=0
for ext in txt srt vtt json tsv; do
  [ -f "$work/audio.$ext" ] || continue
  # Last-ditch: a failed copy here would throw away the whole transcription.
  cp "$work/audio.$ext" "$OUT/$slug.$ext" 2>/dev/null \
    || cp "$work/audio.$ext" "$OUT/transcript.$ext" \
    || { echo "error: cannot write to $OUT — transcript left in $work" >&2; trap - EXIT; exit 1; }
  wrote=1
done
[ "$wrote" = 1 ] || die "backend produced no transcript files"

echo "$OUT/$slug.txt"
