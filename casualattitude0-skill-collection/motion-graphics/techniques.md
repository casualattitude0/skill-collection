# Techniques

The rules the build applies. Each heading is one concern; apply all of them.

## Look

- One display face, one UI face, one accent color. Everything else is neutral.
- Compose off-center with a clear hierarchy: one thing is biggest in every shot.
- Type is large enough to read on a phone at 360px wide.
- Each shot uses a different technique from the one before it: kinetic type,
  UI assembling piece by piece, a chart drawing itself, a camera push, a morph.
- Elements arrive by moving, scaling, wiping, drawing on or morphing. Reserve a
  plain fade for one deliberate moment.
- Depth comes from layering, parallax and scale, with flat, crisp UI chrome.
- Name a style rather than describe one ("Vox editorial", "Swiss poster",
  "PC-98 pixel art"): a name carries pacing, type and texture together.

## Motion

- Springs for everything that moves: motion with mass accelerates, overshoots
  a hair, settles. Tiny overshoot on UI, none on type.

  | Feel | Use for |
  |---|---|
  | Snappy | Buttons, toggles, cursors, leading edges |
  | Default | Cards, containers, camera |
  | Heavy | Big type, 3D objects, logo lockups |
  | Playful (visible overshoot) | Mascots, stickers |

- A value that changes target several times (a cursor, a container's width) is
  the sum of one spring per change, each starting at its own frame. It stays
  continuous and still depends only on the frame number.
- Stagger groups by 1–3 frames per item so they ripple.
- A stretching indicator: leading edge on a stiffer spring than the trailing edge.
- Text inside a morphing container enters after the morph starts and leaves
  before the next one begins.
- One shape, never cut: for a UI film, a single container morphs size, radius
  and fill from state to state while a cursor drives each change with a real
  click. It reads as one continuous take.
- For a loop, the last frame equals the first, cursor position included.

## Pacing

- The first 2 seconds are the hook: the single most striking image, or the
  problem in five words of huge type.
- Something new happens on screen every 2–4 seconds; in a longer film, a visual
  payoff every 3–5.
- Cuts and state changes land on beats, big moments on downbeats. Choose a BPM
  whose beat is a whole number of frames: 120 BPM at 30 fps is 15 frames.
- Product film skeleton, one beat each: hook → the product appears and its UI
  assembles → three features, each a UI moment with a cursor doing a real
  action → one number that proves it works → logo lockup and CTA.
- Story instead of features when the subject allows: a history, a journey, one
  request followed from start to finish.

## Brand and assets

- Product UI is the real thing: crop and animate real screenshots and the real
  logo, in the real colors and fonts.
- API keys live in `.env` and are referred to by variable name.
- Keep one session per brand; the second video reuses the first one's
  components, style guide and sound pipeline.

## Reference

A reference gives pacing, type and transitions to copy. Take its grammar,
leave its content, logos and characters.

1. Video reference: `mkdir -p refs/frames && ffmpeg -i ref.mp4 -vf fps=2 refs/frames/%03d.png`, then
   read the frames in order. Single frame or image folder: read them directly.
2. Write `docs/style_guide.md`: palette (hex), type (family, weight, tracking),
   shot lengths, transition types, camera moves, texture and grain, how text
   enters and exits.
3. Say what you take (palette, type, rhythm) and what you leave (subject).

Sources when the user has none: whatships.com for launch films, Dribbble
motion, a competitor's launch video.

## Sound

- Default: synthesize score and SFX in code on the same beat grid as the
  picture. [bin/sfx.mjs](bin/sfx.mjs) does both with no dependencies:

  ```bash
  node <skill-dir>/bin/sfx.mjs docs/cues.json public/audio.wav --bpm 120 --dur 20
  ```

  `cues.json` is `[{"t": 0.5, "type": "click"}, ...]`, `t` in seconds, type one
  of `click`, `pop`, `thump`, `whoosh`, `riser`. `--bpm` adds a music bed;
  leave it off for SFX only.
- Cue vocabulary: a click on every cursor press, a pop when text or an element
  lands, a whoosh on every transition or morph, a riser into a reveal, a thump
  on the logo.
- A supplied track is used unchanged and measured first: get BPM and beat
  times (ask the user for the BPM, or `pip install librosa` and use
  `librosa.beat.beat_track`), then put the shotlist on those beats.
- Bring the mix to −14 LUFS before adding it to the composition. Measure,
  then apply the difference as gain (single-pass `loudnorm` misses on clips
  this short):

  ```bash
  ffmpeg -i in.wav -af ebur128 -f null - 2>&1 | grep -E '^ +I:' | tail -1
  ffmpeg -i in.wav -af "volume=<-14 minus measured>dB,alimiter=limit=0.84" out.wav
  ```
- With a music or voice generation tool connected, prefer it over synthesis
  for that layer, and time the picture to the voiceover's real duration.

## Orchestrating other tools

Connected tools raise the ceiling; use the ones the brief calls for. An image
generator makes custom illustrations and textures, a voice generator narrates,
a music generator scores, and Blender renders 3D shots. Each output lands in
`public/` as an asset the composition plays.

## Determinism

Every frame is a pure function of the frame number: all motion derives from
`useCurrentFrame()`, randomness from Remotion's seeded `random()`. A frame
rendered twice is identical, so a fix is an edit plus a re-render of the
affected seconds.

## Formats

Write each scene against the composition's width and height. A second format
is a second composition that re-lays-out type and UI for its aspect ratio.

## Long films

Past about 60 seconds: write `docs/ANIMATION_GUIDE.md` (the style guide plus
shared components and spring presets), then give each chapter to its own
subagent with that guide and its slice of the shotlist. Build stills for every
shot, then a low-resolution animatic to fix pacing, then the full pass.

## Effort

New film: high or xhigh. Small fixes and re-renders: medium. A launch whose
first three seconds must carry it: max.

## Working with feedback

- Change a copy; the original stays for comparison.
- Ask what they like as well as what they dislike, and keep the liked parts
  untouched.
- Feedback with a timestamp ("at 0:07 the card is too small") is the unit;
  ask for it in that form.
