# VOID DRIFT

A fast-paced survival arena shooter rendered on an HTML5 canvas. Survive escalating
swarms, collect XP gems, level up to pick weapon and passive upgrades, and bank
"cores" between runs to buy permanent meta upgrades.

Originally a single `void-drift-v2.html` file, the game has been split into a
professional, modular **TypeScript** codebase built with **Vite**.

## Project structure

```
.
├── index.html              # HTML shell + DOM overlays, loads src/main.ts
├── vite.config.ts          # Vite config (GitHub Pages base path)
├── tsconfig.json           # TypeScript compiler options
├── .github/workflows/      # GitHub Actions → GitHub Pages deployment
└── src/
    ├── main.ts             # Entry point / boot sequence
    ├── game.ts             # Fixed-update game loop (update + render)
    ├── types.ts            # Shared type definitions
    ├── styles/main.css     # All styling
    ├── config/             # Static data: tuning, weapon/passive defs, icons
    ├── core/               # Engine: state, canvas, audio, storage, SDK
    ├── systems/            # Gameplay: spawning, enemies, weapons, combat, etc.
    ├── render/             # Canvas rendering: world, entities, HUD
    ├── ui/                 # DOM overlays (menu, level-up, pause, shop)
    └── input/              # Pointer/keyboard input handling
```

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the Vite dev server (http://localhost:5173)
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build locally
```

## Deployment (GitHub Pages)

Pushing to `main` triggers the workflow in `.github/workflows/deploy.yml`, which
builds the project and publishes `dist/` to GitHub Pages.

To enable it once: in the repository's **Settings → Pages**, set **Source** to
**GitHub Actions**.

The site is served from `https://<user>.github.io/StarBreaker/`. The Vite `base`
is set to `/StarBreaker/` for production builds so all assets resolve correctly.

## Controls

- **Move:** WASD / arrow keys, or touch-drag anywhere to use the virtual joystick.
- **Pause:** `P` or the pause button (top-left).
- **Mute:** the speaker button (top-right).
