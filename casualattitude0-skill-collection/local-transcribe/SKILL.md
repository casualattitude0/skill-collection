---
name: local-transcribe
description: Transcribe speech to text on this machine — no API key, no upload. Use when a video has no subtitles, when asked for a transcript or 逐字稿 of a link or media file, or to transcribe a podcast, recording, voice memo, meeting audio, or interview. Not for reading text pages, and not for videos that already publish captions — fetch those instead.
allowed-tools: Bash, Read, Write
license: MIT
---

# Local transcription

Whisper, running on the user's own hardware. Audio never leaves the machine, so
there is no key to configure and nothing to leak.

Setup and cross-device notes: [INSTALL.md](INSTALL.md).

## Step 1 — for a URL, check for published captions first

Transcription costs minutes of compute. Published captions cost seconds.

```bash
yt-dlp --list-subs "<URL>"
```

Captions listed → download them (`--write-auto-subs --skip-download`) and stop
here. `has no subtitles` / `has no automatic captions` → continue. Local files
skip this step.

## Step 2 — run it

```bash
productivity/local-transcribe/bin/transcribe.sh <URL|FILE> --lang zh --out ./out
```

Takes a URL (anything yt-dlp supports) or a local audio/video file. Writes
`<out>/<slug>.txt`, `.srt`, `.vtt`, `.json` and prints the `.txt` path on
stdout, so it pipes:

```bash
txt=$(bin/transcribe.sh "$url" --lang zh --out ./out) && wc -l "$txt"
```

| Flag | Default | Notes |
|------|---------|-------|
| `--lang` | auto-detect | Set it when you know the language — faster and stops mid-file language drift. `zh`, `en`, `ja`, `yue`… |
| `--out` | `$PWD` | Created if missing. |
| `--model` | per backend | See INSTALL.md for the size/accuracy ladder. |
| `--backend` | `auto` | `mlx` (Apple Silicon) or `ct2` (everywhere else). |

**Long media is slow.** Roughly real-time ÷ 8 on an M1 Pro with the default
model — a 75-minute talk lands around 9 minutes. Run it in the background and
do something else; do not sit in a polling loop.

## Step 3 — read the output

`.txt` is the flat transcript — feed this to summarization. `.srt`/`.vtt` carry
timestamps, for quoting a moment or building chapter marks. `.json` has
per-segment confidence, useful when the audio is rough and you need to tell the
model apart from the mumbling.

Whisper punctuates and segments, but it does **not** label speakers. A
two-person interview comes back as one undifferentiated stream. If who-said-what
matters, say so — that needs diarization, which this does not do.

## Failure modes worth knowing

- **Repeated phrases looping** at the end of a segment — a known Whisper
  hallucination on silence or music. Re-run that stretch with `--model` one size
  up, or trim the dead air first.
- **Wrong language mid-file** — pass `--lang` explicitly.
- **First run stalls for minutes** — it is downloading the model (~1.6 GB) into
  `~/.cache/huggingface`. Once only, per machine.
- **`no whisper backend found`** — new machine. Run
  `productivity/local-transcribe/bin/setup.sh`.
