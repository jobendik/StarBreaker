# STARBREAKER — CrazyGames upload folder

This folder is a ready-to-upload **HTML5 build** of STARBREAKER for CrazyGames.
It is provided **unzipped** (not a `.zip`) as requested.

## What's in here

```
crazygames/
├── index.html              ← entry point (relative ./assets paths, SDK v3 loaded)
├── assets/
│   ├── index-*.js          ← game bundle
│   └── index-*.css         ← styles
├── audio/
│   ├── music/*.ogg         ← menu / game / game-over tracks
│   └── sfx/*.ogg           ← sound effects
├── README.md               ← this file
├── GAME-DESCRIPTION.md     ← store description / blurbs / tags
├── CONTROLS.md             ← input mapping
└── SUBMISSION-ANSWERS.md   ← exact answers for the submission form
```

> The `.md` files are documentation only and are ignored by CrazyGames (it reads
> `index.html`). You can leave them or delete them before uploading.

## How to upload

1. Go to <https://developer.crazygames.com/> → **Add game** → **HTML5**.
2. Upload the **contents of this folder** (or zip the folder and upload the zip).
   CrazyGames uses `index.html` as the entry point.
3. Fill in the form using **`SUBMISSION-ANSWERS.md`** (progress save, mobile,
   multiplayer, audio-mute) and **`GAME-DESCRIPTION.md`** / **`CONTROLS.md`** for
   the qualitative metadata.

## Build facts

- Initial download size: **~5.3 MB** (limit 50 MB) ✅
- File count: **24 game files** (limit 1500) ✅
- CrazyGames **HTML5 SDK v3** integrated: loading events, gameplayStart/Stop,
  happytime, rewarded + midgame ads, and audio muting via the settings listener.
- Progress is saved to **LocalStorage** (`starbreaker_meta_v2`), compatible with
  CrazyGames **Automatic Progress Save**.

## Rebuilding this folder

From the project root:

```bash
npm install
npm run typecheck
npx vite build --mode crazygames    # outputs to ./crazygames with relative paths
```

The `crazygames` mode sets Vite `base: "./"` so the build runs from any host path
(plain GitHub Pages builds use `/StarBreaker/` and would NOT work on CrazyGames).
