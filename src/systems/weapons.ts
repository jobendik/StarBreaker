// Weapon firing logic and projectile spawning.

import { game } from "../core/state";
import { CFG } from "../config/tuning";
import { rnd } from "../utils/math";
import { sfx } from "../core/audio";
import type { Enemy, Weapon } from "../types";

export function nearestEnemy(x: number, y: number): Enemy | null {
  let best: Enemy | null = null;
  let bd = 1e18;
  for (const e of game.enemies) {
    if (e.dead) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    const d = dx * dx + dy * dy;
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return best;
}

export function spawnBullet(
  x: number,
  y: number,
  vx: number,
  vy: number,
  dmg: number,
  r: number,
  pierce: number,
  color: string,
): void {
  if (game.bullets.length >= CFG.caps.bullets) game.bullets.shift();
  game.bullets.push({
    x,
    y,
    vx,
    vy,
    dmg,
    r,
    pierce,
    color,
    life: 1.5,
    hits: 0,
    hit: pierce > 0 ? new Set<number>() : null,
    dead: false,
  });
}

export function spawnMissile(
  x: number,
  y: number,
  vx: number,
  vy: number,
  dmg: number,
  aoe: number,
): void {
  if (game.missiles.length >= CFG.caps.missiles) game.missiles.shift();
  game.missiles.push({ x, y, vx, vy, dmg, aoe, life: 3, spd: 120, dead: false });
}

export function updateWeapons(dt: number): void {
  for (const w of game.player.weapons) {
    if (w.type === "orbital") {
      const lvl = w.level;
      const spin = 1.8 + (lvl - 1) * 0.18;
      w.ang = (w.ang || 0) + spin * dt;
      continue;
    }
    w.t -= dt;
    if (w.t > 0) continue;
    fireWeapon(w);
  }
}

function fireWeapon(w: Weapon): void {
  const { player } = game;
  const lvl = w.level;
  const dmgMul = player.dmgMul;
  const fireMul = player.fireMul;
  if (w.type === "pulse") {
    w.t = Math.max(0.16, 0.6 - (lvl - 1) * 0.05) * fireMul;
    const count = [1, 2, 2, 3, 3, 4, 5][Math.min(lvl - 1, 6)];
    const dmg = (10 + (lvl - 1) * 4) * dmgMul;
    const pierce = lvl >= 6 ? 1 : 0;
    const tgt = nearestEnemy(player.x, player.y);
    const base = tgt ? Math.atan2(tgt.y - player.y, tgt.x - player.x) : player.angle;
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * 0.16;
      spawnBullet(player.x, player.y, Math.cos(a) * 545, Math.sin(a) * 545, dmg, 5, pierce, "#9af2ff");
    }
    sfx.shoot();
  } else if (w.type === "spread") {
    w.t = Math.max(0.3, 0.85 - (lvl - 1) * 0.06) * fireMul;
    const count = 3 + (lvl - 1);
    const dmg = (7 + (lvl - 1) * 3) * dmgMul;
    const cone = 0.5 + (lvl >= 6 ? 0.28 : 0);
    const tgt = nearestEnemy(player.x, player.y);
    const base = tgt ? Math.atan2(tgt.y - player.y, tgt.x - player.x) : player.angle;
    for (let i = 0; i < count; i++) {
      const frac = count > 1 ? i / (count - 1) - 0.5 : 0;
      const a = base + frac * cone;
      spawnBullet(player.x, player.y, Math.cos(a) * 475, Math.sin(a) * 475, dmg, 4, 0, "#bff6ff");
    }
    sfx.spread();
  } else if (w.type === "missile") {
    w.t = Math.max(0.55, 1.5 - (lvl - 1) * 0.12) * fireMul;
    const count = [1, 1, 2, 2, 3, 3, 4][Math.min(lvl - 1, 6)];
    const dmg = (20 + (lvl - 1) * 8) * dmgMul;
    const aoe = 56 + (lvl - 1) * 8;
    for (let i = 0; i < count; i++) {
      const a = player.angle + rnd(-0.6, 0.6);
      spawnMissile(player.x, player.y, Math.cos(a) * 120, Math.sin(a) * 120, dmg, aoe);
    }
    sfx.missile();
  } else if (w.type === "nova") {
    w.t = Math.max(1.2, 3.2 - (lvl - 1) * 0.25) * fireMul;
    const radius = 130 + (lvl - 1) * 22;
    const dmg = (16 + (lvl - 1) * 7) * dmgMul;
    game.novas.push({
      x: player.x,
      y: player.y,
      r: 10,
      maxR: radius,
      dmg,
      hit: new Set<number>(),
      dur: 0.42,
      t: 0,
    });
    sfx.nova();
  }
}
