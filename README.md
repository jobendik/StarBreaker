# STARBREAKER

**Survive the swarm. Break the Titan.**

A fast-paced arcade survival shooter built for the web (CrazyGames-ready).
Fly an auto-firing starfighter through escalating swarms, dash through
bullets, draft an evolving arsenal, and bring down the **Void Titan** at
10:00 — then push into Overdrive for the leaderboard.

Graphics and music are fully procedural. Sound effects use curated, compressed
samples (264 KB total) wired into the Web Audio API with procedural fallback.

## The game

- **8 weapons** — Pulse Blaster, Scatter Laser, Orbital Ring, Seeker Pods,
  Pulse Nova, Rail Lance, Arc Coil, Void Glaive — each with 7 levels.
- **8 weapon evolutions** — max a weapon and pair it with the right passive
  to unlock a legendary evolved form (Hyperion Lance, Blade Cyclone,
  Event Horizon, …).
- **Dash** with i-frames (Shift/Space, or the ⚡ button on touch).
- **9 enemy types** with distinct behaviours: weavers strafe, dashers
  telegraph and charge, spitters keep range and shoot back. Gold **elites**
  drop pickups and cores.
- **3 rotating bosses** (Sentinel, Hive Queen, Ravager) every minute, with
  radial barrages, minion spawning, and charge attacks — then the
  **Void Titan** finale with phased attacks. Beat it for a Victory screen
  and optional endless **Overdrive**.
- **Director events**: swarm rings, brute walls, elite packs, salvage
  fields. **Sectors** escalate every 2 minutes and re-grade the entire
  color palette.
- **Pickups**: heal, magnet, screen-clearing overload bomb, and core coins.

## Retention systems

- **4 unlockable ships** (Vanguard, Tempest, Bastion, Reaper) with distinct
  stats and starting weapons — unlock by feat or buy with cores.
- **Meta shop**: 8 permanent upgrade tracks bought with cores.
- **Daily cargo**: escalating login reward with streak.
- **3 daily missions** (seeded rotation) with core rewards.
- **14 achievements**, each paying out cores.
- Combo streaks, multi-kill announcements, score multipliers, instant
  retry, and a cores-earned breakdown on every run.

## Project structure

```
.
├── index.html              # HTML shell + DOM overlays, loads src/main.ts
├── vite.config.ts          # Vite config (GitHub Pages base path)
├── scripts/                # Headless simulation smoke test (npm run smoke)
├── .github/workflows/      # GitHub Actions → GitHub Pages deployment
└── src/
    ├── main.ts             # Entry point / boot sequence
    ├── game.ts             # Fixed-update game loop, dash, hit-stop
    ├── types.ts            # Shared type definitions
    ├── styles/main.css     # All overlay styling
    ├── config/             # Tuning, weapons/passives/ships/missions, icons
    ├── core/               # State, canvas, audio + music engine (samples + procedural), storage, SDK
    ├── systems/            # Spawning/director, enemies, weapons, combat,
    │                       # projectiles, pickups, progression, lifecycle
    ├── render/             # Background, entities, HUD, compositing
    ├── ui/                 # DOM overlays (menu, level-up, pause, game over)
    └── input/              # Pointer/keyboard/virtual-joystick input
```

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the Vite dev server (http://localhost:5173)
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build locally
npm run smoke    # headless 11-minute simulation (balance & stability check)
```

## Sound effects

22 curated one-shot samples (mono Vorbis, ~4–18 KB each, 264 KB total) are
decoded into Web Audio buffers at runtime and peak-normalized with per-event
gain tuning. The 5 melodic cues (`pickup`, `heart`, `victory`, and the chiptune
arpeggio notes) stay procedural to stay in key with the 112 BPM score.
Every event falls back to procedural synthesis while buffers load or if a
fetch fails.

Sources: Shapeforms Audio Free Sound Effects (Cyberpunk Arsenal, Future UI,
Arcane Activations, The Mint, Hit and Punch, Glitch and Noise packs).

## Deployment (GitHub Pages)

Pushing to `main` triggers the workflow in `.github/workflows/deploy.yml`,
which builds the project and publishes `dist/` to GitHub Pages.

To enable it once: in the repository's **Settings → Pages**, set **Source**
to **GitHub Actions**.

The site is served from `https://<user>.github.io/StarBreaker/`. The Vite
`base` is set to `/StarBreaker/` for production builds (and `vite preview`)
so all assets resolve correctly.

For CrazyGames, run `npx vite build --mode crazygames` to produce the
`crazygames/` folder, which uses relative (`base: "./"`) asset paths so it runs
from any host path. Upload the contents of that folder; see
`crazygames/SUBMISSION-ANSWERS.md` for the submission-form answers. The
CrazyGames SDK v3 is integrated: loading events, gameplay start/stop, happytime
on milestones, rewarded ads for revives, rate-limited midgame ads between runs,
and audio muting via the SDK settings listener — all guarded so the game runs
fine without the SDK.

## Controls

- **Move:** WASD / arrow keys, or touch-drag anywhere (virtual joystick).
- **Dash:** Shift or Space (desktop), ⚡ button (touch).
- **Pause:** `P` / `Esc` or the pause button. **Mute:** `M` or the speaker button.
