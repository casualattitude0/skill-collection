---
name: motion-graphics
description: Direct a motion graphics video in Remotion from brief to rendered MP4 — interview the user, write a shotlist, build, critique the frames, score it with sound. Use when asked to make a launch or product video, ad, explainer, showreel, intro, logo animation, kinetic typography, animated chart, or lower third (做影片、動態圖像、動畫). Not for cutting recorded footage.
---

# Motion graphics

You are the **director**: the brief, the shotlist, the look, the sound and the
critique are yours. Remotion syntax belongs to the `remotion-best-practices`
skill — read it before writing composition code. If the video's project has
no `.claude/skills/remotion-best-practices/SKILL.md`, install it from inside
the project directory, then read that file:

```bash
npx skills add remotion-dev/skills -a claude-code -s remotion-best-practices -y
```

The prompt is 10% of a good video. The other 90% is this harness: a reference,
a shotlist on a beat grid, and looking at your own frames.

If [preferences.md](preferences.md) exists, read it first; it holds this user's
standing taste and overrides the defaults below.

## 1. Brief — interview the user

Speak the user's language. Take from their request everything it already
answers, then ask for the rest with `AskUserQuestion`: concrete options, your
recommendation first, so an unsure user can pick instead of invent. When they
have no idea for a field, propose two or three directions and let them choose.

| Field | Ask for | Default when the user has no preference |
|---|---|---|
| Subject | Product, topic or person; URL if one exists | — (required) |
| Message | The one thing a viewer should remember; CTA | — (required) |
| Kind | Launch ad, explainer, showreel/intro, data chart, overlay | Infer from the request |
| Audience & platform | Who watches, where | Social feed, sound on |
| Duration | Seconds | 15–20 |
| Formats | 16:9, 9:16, 1:1 (several allowed) | 16:9 |
| Brand | Hex colors, fonts, logo — or "take them from the URL" | Take from URL; else propose a palette |
| Reference | A video, a frame, an image folder, or a named style | Propose three named styles |
| On-screen text | Their script, or you draft it | You draft, they approve in step 3 |
| Sound | Synthesized score + SFX, their track, SFX only, silent | Synthesized score + SFX |
| Voiceover | None, their script, or you draft — only when a TTS tool is connected | None |

Done when every field holds a value or an explicit default, and you have
restated the film in one line ("a 20s 9:16 launch film that makes founders
feel X") and the user has agreed to that line.

## 2. Project, assets, style guide

1. Scaffold the video's own project as the workspace's `CLAUDE.md` describes,
   or use the project the user names. Everything below lives inside it.
2. Collect real assets into `public/`: logo, screenshots of the real product
   (capture them from the URL), fonts, the user's track. List what you found.
3. With a reference, write `docs/style_guide.md` from it — recipe in
   [techniques.md](techniques.md#reference). With only a named style, write the
   same file from what that style is known for.

Done when `docs/style_guide.md` states palette (hex), one display face, one UI
face, one accent, texture, camera language, and how text enters and exits.

## 3. Shotlist on the beat grid — gate

Fix the BPM, then write `docs/shotlist.md`: one row per shot with start beat,
frames, what is on screen, the exact text, the motion, and the sound cue.
Pacing rules are in [techniques.md](techniques.md#pacing).

Show the shotlist to the user and wait for their OK. This is the cheap place
to change the film.

Done when the user has approved it and every second of the duration belongs to
a shot.

## 4. Build

Open Studio so the user can watch, then build shot by shot from the shotlist,
applying every rule in [techniques.md](techniques.md). One component per shot,
timings derived from the beat grid.

Done when every shotlist row plays in Studio at its listed frames.

## 5. Sound

A video is silent unless you make sound. Produce the score and SFX per
[techniques.md](techniques.md#sound), place every hit on a shotlist cue, and
add the file to the composition so Studio plays it.

Done when each sound cue in the shotlist is audible at its frame and the mix
measures −14 LUFS.

## 6. Critique loop

Follow [critique.md](critique.md): render a draft, look at the contact sheet,
score it, fix the three worst problems, repeat.

Done when every axis scores 8 or higher after at least three rounds, or the
user calls it finished.

## 7. Deliver

Render every requested format to `out/`, each reframed rather than cropped,
plus `out/poster.png` and the final contact sheet. Confirm with `ffprobe` that
duration, resolution and an audio stream match the brief.

Tell the user where the files are and the one thing you would improve next.
When they give feedback, change a copy of the composition so the previous
version survives, and ask whether the note is a standing preference — if so,
append it to [preferences.md](preferences.md).
