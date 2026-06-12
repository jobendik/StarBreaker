// Projectile movement: bullets, homing missiles, and nova shockwaves.

import { game } from "../core/state";
import { TAU, rnd, clamp, lerp } from "../utils/math";
import { sfx } from "../core/audio";
import { queryCircle } from "./grid";
import { nearestEnemy } from "./weapons";
import { damageEnemy } from "./combat";
import { addParticle, popText } from "./effects";
import type { Missile } from "../types";

export function updateProjectiles(dt: number): void {
  const { player } = game;
  for (const b of game.bullets) {
    if (b.dead) continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || Math.hypot(b.x - player.x, b.y - player.y) > 1500) b.dead = true;
  }
  for (const m of game.missiles) {
    if (m.dead) continue;
    const tgt = nearestEnemy(m.x, m.y);
    if (tgt) {
      const dA = Math.atan2(tgt.y - m.y, tgt.x - m.x);
      let cA = Math.atan2(m.vy, m.vx);
      const diff = (((dA - cA + Math.PI) % TAU) + TAU) % TAU - Math.PI;
      cA += clamp(diff, -6 * dt, 6 * dt);
      m.spd = Math.min(380, m.spd + 520 * dt);
      m.vx = Math.cos(cA) * m.spd;
      m.vy = Math.sin(cA) * m.spd;
    }
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    m.life -= dt;
    if (m.life <= 0) {
      explodeMissile(m);
      continue;
    }
    const near = queryCircle(m.x, m.y, m.aoe);
    let hitc = false;
    for (const e of near) {
      if (e.dead) continue;
      const dd = (e.x - m.x) * (e.x - m.x) + (e.y - m.y) * (e.y - m.y);
      if (dd < (e.r + 6) * (e.r + 6)) {
        hitc = true;
        break;
      }
    }
    if (hitc) {
      explodeMissile(m);
      continue;
    }
    if (Math.random() < 0.6) addParticle(m.x, m.y, rnd(-20, 20), rnd(-20, 20), 0.3, 4, "#ffb24a");
  }
  for (const nv of game.novas) {
    if (nv.dead) continue;
    nv.t += dt;
    nv.r = lerp(10, nv.maxR, nv.t / nv.dur);
    const near = queryCircle(nv.x, nv.y, nv.r + 30);
    for (const e of near) {
      if (e.dead || nv.hit.has(e.id)) continue;
      const d = Math.hypot(e.x - nv.x, e.y - nv.y);
      if (d < nv.r + e.r) {
        nv.hit.add(e.id);
        const a = Math.atan2(e.y - nv.y, e.x - nv.x);
        damageEnemy(e, nv.dmg, Math.cos(a) * 8, Math.sin(a) * 8);
      }
    }
    if (nv.t >= nv.dur) nv.dead = true;
  }
}

function explodeMissile(m: Missile): void {
  if (m.dead) return;
  m.dead = true;
  const near = queryCircle(m.x, m.y, m.aoe);
  for (const e of near) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - m.x, e.y - m.y);
    if (d < m.aoe + e.r) {
      const a = Math.atan2(e.y - m.y, e.x - m.x);
      damageEnemy(e, m.dmg, Math.cos(a) * 10, Math.sin(a) * 10);
    }
  }
  for (let i = 0; i < 16; i++) {
    const a = rnd(TAU);
    const s = rnd(40, 200);
    addParticle(m.x, m.y, Math.cos(a) * s, Math.sin(a) * s, rnd(0.3, 0.6), rnd(4, 9), "#ffb24a");
  }
  popText(m.x, m.y, Math.round(m.dmg), "#ffb24a");
  game.shake.mag = Math.max(game.shake.mag, 7);
  sfx.explode();
}
