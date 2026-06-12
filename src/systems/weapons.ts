// Weapon firing logic and projectile spawning for all 8 weapons + evolutions.

import { game } from "../core/state";
import { CFG } from "../config/tuning";
import { rnd, segDist2 } from "../utils/math";
import { sfx } from "../core/audio";
import { addParticle } from "./effects";
import { damageEnemy } from "./combat";
import type { Enemy, Weapon } from "../types";

export function nearestEnemy(x: number, y: number, maxD = 1e9): Enemy | null {
  let best: Enemy | null = null;
  let bd = maxD * maxD;
  for (const e of game.enemies) {
    if (e.dead || e.spawnT > 0.25) continue;
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
  trail = false,
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
    trail,
    dead: false,
  });
}

export function spawnMissile(x: number, y: number, vx: number, vy: number, dmg: number, aoe: number): void {
  if (game.missiles.length >= CFG.caps.missiles) game.missiles.shift();
  game.missiles.push({ x, y, vx, vy, dmg, aoe, life: 3, spd: 120, dead: false });
}

export function updateWeapons(dt: number): void {
  for (const w of game.player.weapons) {
    if (w.type === "orbital") {
      const spin = (1.8 + (w.level - 1) * 0.18) * (w.evolved ? 1.5 : 1);
      w.ang = (w.ang || 0) + spin * dt;
      continue;
    }
    w.t -= dt;
    if (w.t > 0) continue;
    fireWeapon(w);
  }
}

function muzzle(color: string): void {
  const { player } = game;
  addParticle(
    player.x + Math.cos(player.angle) * 16,
    player.y + Math.sin(player.angle) * 16,
    Math.cos(player.angle) * 60,
    Math.sin(player.angle) * 60,
    0.08,
    7,
    color,
  );
}

function fireWeapon(w: Weapon): void {
  const { player } = game;
  const lvl = w.level;
  const dmgMul = player.dmgMul;
  const fireMul = player.fireMul;
  const ev = w.evolved;

  if (w.type === "pulse") {
    w.t = Math.max(0.14, 0.58 - (lvl - 1) * 0.05) * fireMul * (ev ? 0.72 : 1);
    const count = [1, 2, 2, 3, 3, 4, 5][Math.min(lvl - 1, 6)] + (ev ? 1 : 0);
    const dmg = (10 + (lvl - 1) * 4) * dmgMul * (ev ? 1.9 : 1);
    const pierce = ev ? 3 : lvl >= 6 ? 1 : 0;
    const spd = ev ? 660 : 545;
    const tgt = nearestEnemy(player.x, player.y);
    const base = tgt ? Math.atan2(tgt.y - player.y, tgt.x - player.x) : player.angle;
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * 0.15;
      spawnBullet(player.x, player.y, Math.cos(a) * spd, Math.sin(a) * spd, dmg, ev ? 7 : 5, pierce, ev ? "#ffd87d" : "#9af2ff", ev);
    }
    muzzle(ev ? "#ffd87d" : "#9af2ff");
    sfx.shoot();
  } else if (w.type === "spread") {
    w.t = Math.max(0.26, 0.85 - (lvl - 1) * 0.06) * fireMul * (ev ? 0.8 : 1);
    const count = 3 + (lvl - 1) + (ev ? 4 : 0);
    const dmg = (7 + (lvl - 1) * 3) * dmgMul * (ev ? 1.7 : 1);
    const cone = (0.5 + (lvl >= 6 ? 0.28 : 0)) * (ev ? 2.1 : 1);
    const tgt = nearestEnemy(player.x, player.y);
    const base = tgt ? Math.atan2(tgt.y - player.y, tgt.x - player.x) : player.angle;
    for (let i = 0; i < count; i++) {
      const frac = count > 1 ? i / (count - 1) - 0.5 : 0;
      const a = base + frac * cone;
      spawnBullet(player.x, player.y, Math.cos(a) * 475, Math.sin(a) * 475, dmg, ev ? 6 : 4, ev ? 1 : 0, ev ? "#b6ffd9" : "#8affc1", ev);
    }
    muzzle("#8affc1");
    sfx.spread();
  } else if (w.type === "missile") {
    w.t = Math.max(0.45, 1.5 - (lvl - 1) * 0.12) * fireMul * (ev ? 0.8 : 1);
    const count = [1, 1, 2, 2, 3, 3, 4][Math.min(lvl - 1, 6)] + (ev ? 2 : 0);
    const dmg = (20 + (lvl - 1) * 8) * dmgMul * (ev ? 1.6 : 1);
    const aoe = (56 + (lvl - 1) * 8) * (ev ? 1.5 : 1);
    for (let i = 0; i < count; i++) {
      const a = player.angle + rnd(-0.7, 0.7);
      spawnMissile(player.x, player.y, Math.cos(a) * 120, Math.sin(a) * 120, dmg, aoe);
    }
    sfx.missile();
  } else if (w.type === "nova") {
    w.t = Math.max(1.0, 3.2 - (lvl - 1) * 0.25) * fireMul * (ev ? 0.85 : 1);
    const radius = (130 + (lvl - 1) * 22) * (ev ? 1.45 : 1);
    const dmg = (16 + (lvl - 1) * 7) * dmgMul * (ev ? 1.8 : 1);
    game.novas.push({
      x: player.x,
      y: player.y,
      r: 10,
      maxR: radius,
      dmg,
      hit: new Set<number>(),
      dur: 0.42,
      t: 0,
      pull: ev,
    });
    sfx.nova();
  } else if (w.type === "railgun") {
    const tgt = nearestEnemy(player.x, player.y);
    if (!tgt) {
      w.t = 0.2;
      return;
    }
    w.t = Math.max(1.1, 2.4 - (lvl - 1) * 0.16) * fireMul * (ev ? 0.85 : 1);
    const dmg = (42 + (lvl - 1) * 16) * dmgMul * (ev ? 1.7 : 1);
    const wdt = (lvl >= 4 ? 11 : 8) * (ev ? 1.4 : 1);
    const base = Math.atan2(tgt.y - player.y, tgt.x - player.x);
    const angles = ev ? [base - 0.16, base + 0.16] : [base];
    for (const a of angles) fireBeam(a, dmg, wdt, ev ? "#ffb7f7" : "#ff9af2");
    sfx.rail();
    game.shake.mag = Math.max(game.shake.mag, 4);
  } else if (w.type === "tesla") {
    const range = 340;
    const first = nearestEnemy(player.x, player.y, range);
    if (!first) {
      w.t = 0.2;
      return;
    }
    w.t = Math.max(0.7, 1.7 - (lvl - 1) * 0.08) * fireMul * (ev ? 0.8 : 1);
    const chains = 3 + Math.floor((lvl - 1) / 2) + (ev ? 3 : 0);
    const dmg = (20 + (lvl - 1) * 8) * dmgMul * (ev ? 1.6 : 1);
    fireTesla(first, chains, dmg, ev);
    sfx.tesla();
  } else if (w.type === "glaive") {
    w.t = Math.max(0.9, 2.0 - (lvl - 1) * 0.1) * fireMul * (ev ? 0.85 : 1);
    const count = 1 + Math.floor((lvl - 1) / 3) + (ev ? 1 : 0);
    const dmg = (24 + (lvl - 1) * 9) * dmgMul * (ev ? 1.8 : 1);
    const maxDist = (240 + (lvl - 1) * 14) * (ev ? 1.25 : 1);
    const tgt = nearestEnemy(player.x, player.y);
    const base = tgt ? Math.atan2(tgt.y - player.y, tgt.x - player.x) : player.angle;
    for (let i = 0; i < count; i++) {
      if (game.glaives.length >= CFG.caps.glaives) break;
      const a = base + (i - (count - 1) / 2) * 0.55;
      game.glaives.push({
        x: player.x,
        y: player.y,
        ang: a,
        spin: 0,
        dist: 0,
        maxDist,
        speed: 520,
        dmg,
        r: ev ? 22 : 14,
        state: 0,
        hit: new Set<number>(),
        evolved: ev,
        dead: false,
      });
    }
    sfx.glaive();
  }
}

function fireBeam(ang: number, dmg: number, w: number, color: string): void {
  const { player } = game;
  const len = 920;
  if (game.beams.length >= CFG.caps.beams) game.beams.shift();
  game.beams.push({ x: player.x, y: player.y, ang, len, w, life: 0.18, max: 0.18, color });
  const x2 = player.x + Math.cos(ang) * len;
  const y2 = player.y + Math.sin(ang) * len;
  for (const e of game.enemies) {
    if (e.dead) continue;
    const rr = e.r + w;
    if (segDist2(e.x, e.y, player.x, player.y, x2, y2) < rr * rr) {
      damageEnemy(e, dmg, Math.cos(ang) * 3, Math.sin(ang) * 3);
      addParticle(e.x, e.y, rnd(-60, 60), rnd(-60, 60), 0.25, 5, color);
    }
  }
}

function fireTesla(first: Enemy, chains: number, dmg: number, ev: boolean): void {
  const { player } = game;
  const pts = [{ x: player.x, y: player.y }];
  const hitSet = new Set<number>();
  let cur: Enemy | null = first;
  let remaining = chains;
  let falloff = 1;
  while (cur && remaining > 0) {
    hitSet.add(cur.id);
    pts.push({ x: cur.x, y: cur.y });
    damageEnemy(cur, dmg * falloff, 0, 0);
    falloff *= 0.85;
    remaining--;
    // Find next unvisited enemy near the current one.
    let next: Enemy | null = null;
    let bd = 210 * 210 * (ev ? 1.6 : 1);
    for (const e of game.enemies) {
      if (e.dead || hitSet.has(e.id)) continue;
      const dx = e.x - cur.x;
      const dy = e.y - cur.y;
      const d = dx * dx + dy * dy;
      if (d < bd) {
        bd = d;
        next = e;
      }
    }
    cur = next;
  }
  // Jittered lightning polyline for the visual.
  const jag: { x: number; y: number }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    jag.push(a);
    const segs = 3;
    for (let s = 1; s < segs; s++) {
      const t = s / segs;
      jag.push({
        x: a.x + (b.x - a.x) * t + rnd(-14, 14),
        y: a.y + (b.y - a.y) * t + rnd(-14, 14),
      });
    }
  }
  if (pts.length) jag.push(pts[pts.length - 1]);
  if (game.arcs.length >= CFG.caps.arcs) game.arcs.shift();
  game.arcs.push({ pts: jag, life: 0.16, max: 0.16, color: ev ? "#dffbff" : "#aef0ff" });
}

export function orbsFor(w: Weapon): number {
  return [2, 2, 3, 3, 4, 5, 6][Math.min(w.level - 1, 6)] + (w.evolved ? 2 : 0);
}

export function orbitRadius(w: Weapon): number {
  return 64 + (w.level - 1) * 8 + (w.evolved ? 30 : 0);
}

export function orbitDps(w: Weapon): number {
  return (26 + (w.level - 1) * 10) * (w.evolved ? 2 : 1) * game.player.dmgMul;
}
