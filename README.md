# Vice Poster Studio — GTA-style cover art maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/rangerkit/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/rangerkit/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns your photos and a caption into a multi-panel GTA-style poster cover, built as an entry for the [gta6-cover-art-01 bounty on make.fun](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- **Multi-panel poster layouts** — Vice Five (hero + four panels), Three Up, Duo and Hero, with slanted comic-book dividers and white gutters.
- **Any photo** — load photos from your machine (file picker or drag-and-drop); each panel's photo can be cropped, panned and zoomed. One photo can fill every panel, or each panel can hold a different one. Photos never leave your machine.
- **Vice City grades** — Sunset, Neon and Dusk colour grades: warm washes, teal-pink neon, deep dusk, plus vignette and grain.
- **Bold poster lettering** — an editable caption with gradient fill and outline, plus an optional subtitle, drawn on a dark foot band.
- **One-click export** — PNG at the common post sizes 1920 × 1080, 1080 × 1080 and 1080 × 1350.
- **Live preview** — the editor shows the cover as you build it; click a panel to select it, drag to move its photo, scroll to zoom.

No Rockstar Games logo, wordmark, artwork or fonts are used anywhere; the lettering is drawn with system fonts and the look is our own.

## Run it

The app is static files under `app/` and works fully offline. Serve the folder with any static server, for example:

```
node serve.ts
```

then open http://localhost:8080 in a desktop browser. Or hand the entry in the way the grader does:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

which copies `app/` and `screenshots/` to the output directory and writes its `dossier.json`.

## Layout

- `app/index.html`, `app/src/` (cover renderer, layouts, editor wiring, screenshot scenes), `app/style.css` — the cover maker itself
- `app/samples/` — two AI-made sample photos (boulevard, pier), free to use, preloaded as demo content
- `screenshots/` — renders of the app and covers it exported
- `main.ts` — the hand-in program; `vendor/makefun-app.ts` — the kit's dossier library

MIT licensed.
