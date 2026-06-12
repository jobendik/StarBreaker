// Layered space background: gradient wash, drifting nebulae, three-depth
// starfield with twinkle, shooting stars, and a faint tactical grid.
// Colors shift per sector for a sense of journey.

import { ctx, view, stars, nebulae, nebSprite } from "../core/canvas";
import { game } from "../core/state";
import { rnd, hexA, mixHex } from "../utils/math";

interface SectorPalette {
  top: string;
  bottom: string;
  nebA: string;
  nebB: string;
  grid: string;
}

const PALETTES: SectorPalette[] = [
  { top: "#060a18", bottom: "#03040c", nebA: "#1b3a6e", nebB: "#0e4d5c", grid: "#46e0ff" },
  { top: "#06141a", bottom: "#02070a", nebA: "#0e5c4a", nebB: "#14406e", grid: "#46ffd0" },
  { top: "#0d0a1e", bottom: "#050310", nebA: "#46226e", nebB: "#1b2a6e", grid: "#a26bff" },
  { top: "#160a14", bottom: "#080308", nebA: "#6e2246", nebB: "#46226e", grid: "#ff6bb0" },
  { top: "#180b08", bottom: "#0a0404", nebA: "#6e3a22", nebB: "#6e2230", grid: "#ff9a5b" },
  { top: "#120618", bottom: "#06020a", nebA: "#5c1b6e", nebB: "#2a0e5c", grid: "#c46bff" },
];

let curIdx = 0;
let blend = 1; // 0..1 transition into palette curIdx

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}
let shooter: ShootingStar | null = null;
let shooterCd = 5;

function pal(i: number): SectorPalette {
  return PALETTES[Math.min(i, PALETTES.length - 1)];
}

export function updateBackground(dt: number): void {
  const want = Math.min(game.run.sector - 1, PALETTES.length - 1);
  if (want !== curIdx && blend >= 1) {
    curIdx = want;
    blend = 0;
  }
  if (blend < 1) blend = Math.min(1, blend + dt * 0.5);

  shooterCd -= dt;
  if (shooterCd <= 0 && !shooter) {
    shooterCd = rnd(7, 16);
    const a = rnd(Math.PI * 0.15, Math.PI * 0.45);
    shooter = {
      x: rnd(view.W),
      y: rnd(view.H * 0.4),
      vx: Math.cos(a) * 900,
      vy: Math.sin(a) * 900,
      life: 0.7,
    };
  }
  if (shooter) {
    shooter.x += shooter.vx * dt;
    shooter.y += shooter.vy * dt;
    shooter.life -= dt;
    if (shooter.life <= 0) shooter = null;
  }
}

export function renderBackground(camX: number, camY: number, time: number): void {
  const W = view.W;
  const H = view.H;
  const prev = pal(Math.max(0, curIdx - 1));
  const cur = pal(curIdx);
  const k = blend;
  const top = mixHex(prev.top, cur.top, k);
  const bottom = mixHex(prev.bottom, cur.bottom, k);

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Nebula clouds (deep parallax, slow self-drift).
  ctx.globalCompositeOperation = "screen";
  const span = 2400;
  for (const nb of nebulae) {
    const col = nb.c === 0 ? cur.nebA : cur.nebB;
    const drift = Math.sin(time * 0.05 + nb.drift) * 40;
    const sx = ((((nb.x - camX * nb.z + drift) % span) + span) % span) - nb.r;
    const sy = ((((nb.y - camY * nb.z) % span) + span) % span) - nb.r;
    // Wrap-draw so clouds cover the viewport seamlessly.
    for (const ox of [0, -span]) {
      for (const oy of [0, -span]) {
        const x = sx + ox;
        const y = sy + oy;
        if (x + nb.r * 2 < 0 || x > W || y + nb.r * 2 < 0 || y > H) continue;
        ctx.globalAlpha = 0.5;
        ctx.drawImage(nebSprite(col), x, y, nb.r * 2, nb.r * 2);
      }
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  // Stars (existing twinkle field, parallax by z).
  for (const s of stars) {
    const sx = (((s.x - camX * s.z) % W) + W) % W;
    const sy = (((s.y - camY * s.z) % H) + H) % H;
    const a = s.a * (0.6 + 0.4 * Math.sin(time * s.tw + s.ph));
    ctx.fillStyle = hexA("#bfe9ff", a);
    ctx.fillRect(sx, sy, s.s, s.s);
  }

  // Shooting star streak.
  if (shooter) {
    const a = Math.min(1, shooter.life / 0.3) * 0.8;
    ctx.strokeStyle = hexA("#cfeeff", a);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(shooter.x, shooter.y);
    ctx.lineTo(shooter.x - shooter.vx * 0.06, shooter.y - shooter.vy * 0.06);
    ctx.stroke();
  }

  // Faint tactical grid.
  const S2 = 64;
  const gridCol = mixHex(prev.grid, cur.grid, k);
  const ox = -(((camX % S2) + S2) % S2);
  const oy = -(((camY % S2) + S2) % S2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = gridCol.replace("rgb", "rgba").replace(")", ",0.035)");
  ctx.beginPath();
  for (let x = ox; x < W; x += S2) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = oy; y < H; y += S2) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
  ctx.strokeStyle = gridCol.replace("rgb", "rgba").replace(")", ",0.08)");
  ctx.beginPath();
  const big = S2 * 4;
  const bigx = -(((camX % big) + big) % big);
  const bigy = -(((camY % big) + big) % big);
  for (let x = bigx; x < W; x += big) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = bigy; y < H; y += big) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
}
