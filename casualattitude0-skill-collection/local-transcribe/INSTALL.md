# Setting up local-transcribe

Everything here is per-machine. The repo carries the skill and the scripts; each
machine carries the binaries and the model cache. Switching devices means
running one script, not repeating this page.

## New device — the whole checklist

```bash
git clone <this-repo> ~/Developer/Skills && cd ~/Developer/Skills
./productivity/local-transcribe/bin/setup.sh
ln -sfn "$PWD/productivity/local-transcribe" ~/.claude/skills/local-transcribe
```

Then verify:

```bash
./productivity/local-transcribe/bin/setup.sh --check
```

All ✅ means you are done. The skill is live in the next Claude Code session.

## What setup.sh does

Idempotent, and it never runs `sudo` — if something needs a system package
manager it prints the command and lets you decide. Re-run it any time.

| Dependency | Why | How it lands |
|------------|-----|--------------|
| `pipx` | isolated CLI installs, no venv juggling | brew, or `pip install --user` |
| `ffmpeg` | decode anything → 16 kHz mono | brew on macOS; printed instructions elsewhere |
| `yt-dlp` | URL → audio | `pipx install "yt-dlp[default]"` |
| yt-dlp JS runtime | YouTube's player challenges need Node | appends `--js-runtimes node` to `~/.config/yt-dlp/config` |
| whisper backend | the actual transcription | picked by platform, below |

`--check` reports without changing anything — that is the doctor command when a
machine starts misbehaving.

## Backend, by platform

Chosen automatically. You only care if you are curious or overriding.

| Platform | Backend | Package | Default model |
|----------|---------|---------|---------------|
| macOS Apple Silicon | MLX (Metal GPU) | `mlx-whisper` | `mlx-community/whisper-large-v3-turbo` |
| macOS Intel, Linux, WSL | CTranslate2 (CPU/CUDA) | `whisper-ctranslate2` | `large-v3` |

`transcribe.sh` detects whichever is installed at runtime, so a repo synced
between an M-series Mac and a Linux box works on both with no edits. Force one
with `--backend mlx` or `--backend ct2`.

Windows without WSL is not supported — the scripts are bash. Use WSL.

## Models

First run downloads the model into `~/.cache/huggingface` (MLX) or
`~/.cache/whisper-ctranslate2` (CT2). This cache is **not** in the repo and is
not worth syncing; it re-downloads in a couple of minutes on a new machine.

| Model | Size | Speed on M1 Pro | Use when |
|-------|------|-----------------|----------|
| `…/whisper-large-v3-turbo` | ~1.6 GB | ~8× real-time | default — right answer almost always |
| `…/whisper-large-v3` | ~3 GB | ~2× real-time | messy audio, heavy accents, transcript is the deliverable |
| `…/whisper-medium` | ~1.5 GB | ~10× real-time | low-RAM machine |
| `…/whisper-small` | ~0.5 GB | ~20× real-time | rough gist only |

Swap with `--model`. Use MLX repo ids (`mlx-community/…`) on Apple Silicon and
plain names (`large-v3`) on CT2.

## Relationship to Agent Reach

[Agent Reach](https://github.com/Panniantong/agent-reach) covers fetching from
the internet, and ships a `transcribe.sh` of its own — but that one is bound to
小宇宙 URLs and posts audio to Groq's hosted Whisper, which needs an API key and
uploads the audio. This skill is the local counterpart: any source, no key,
nothing leaves the machine. They coexist; prefer this one for private material.

## Uninstall

```bash
rm ~/.claude/skills/local-transcribe          # deactivate, repo untouched
pipx uninstall mlx-whisper                    # or whisper-ctranslate2
rm -rf ~/.cache/huggingface/hub/models--mlx-community--whisper-*
```

`ffmpeg` and `yt-dlp` are generally useful — left alone.
