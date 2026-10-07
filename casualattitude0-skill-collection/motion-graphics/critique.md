# Critique loop

You can read images, so watch what you rendered. Be a harsh motion director
looking at someone else's work.

## Render what you will look at

A draft render at reduced scale is your own eyes, separate from the final
render in step 7. `<id>` is the composition id, `D` its duration in seconds.

```bash
npx remotion render <id> out/draft.mp4 --scale=0.5

# Contact sheet: 2 frames per second, 6 across (rows = ceil(D*2/6))
ffmpeg -y -i out/draft.mp4 -vf "fps=2,scale=320:-1,tile=6x<rows>" -frames:v 1 out/contact.png

# Strip: 12 consecutive frames around a fast action at T seconds
ffmpeg -y -ss <T> -i out/draft.mp4 -vf "scale=320:-1,tile=12x1" -frames:v 1 out/strip.png

# Phone test: 1 frame per second at 360px wide
ffmpeg -y -i out/draft.mp4 -vf "fps=1,scale=360:-1,tile=5x<rows>" -frames:v 1 out/phone.png
```

Read `contact.png`, `phone.png`, and a strip for every transition.

## Score 1–10

| Axis | An 8 looks like |
|---|---|
| Hook | The first 2 seconds would stop a scroll |
| Readability | Every word is legible in `phone.png` |
| Motion | Springs with mass; every frame in a strip differs from its neighbor |
| Variety | A new thing every 2–4 seconds, a new technique each shot |
| Composition | Clear hierarchy, intentional asymmetry, nothing touching an edge by accident |
| Brand accuracy | Real assets, style-guide colors and faces only |
| Sound sync | Every shotlist cue lands on its frame |

## Hunt list

Look for these specifically; each one caps its axis at 6:

- A centered title on a gradient
- Everything fading in
- Labels in the corners, or a border around the frame
- Glow or gradient on UI chrome, generic particle bursts
- Text overlapping other text during a swap
- Anything sliding at constant speed
- Blurry scaled text
- A dead beat where nothing changes
- A stutter at the loop seam

## Fix and repeat

1. Append the scores and the three biggest problems, with timestamps, to
   `docs/review_log.md`.
2. Fix those three.
3. Check each fix with a strip from a range render (`--frames=<from>-<to>`),
   then re-render the whole draft, rebuild the sheets, and score again.

Stop when every axis is 8 or higher after at least three rounds. Show the user
the final contact sheet and the score history.
