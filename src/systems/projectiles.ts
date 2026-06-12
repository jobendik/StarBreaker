// Projectile movement: bullets, homing missiles, novas, glaives, enemy bullets.

import { game } from "../core/state";
import { TAU, rnd, clamp, lerp } from "../utils/math";
import { sfx } from "../core/audio";
import { queryCircle } from "./grid";
import { nearestEnemy } from "./weapons";
import { damageEnemy, hurtPlayer } from "./combat";
import { addParticle, popText, ring } from "./effects";
import type { Missile } from "../types";

export function updateProjectiles(dt: number): void {
  const { player } = game;

  for (const b of game.bullets) {
    if (b.dead) continue;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.trail && Math.random() < 0.5) addParticle(b.x, b.y, rnd(-10, 10), rnd(-10, 10), 0.14, 4, b.color);
    if (b.life <= 0 || Math.hypot(b.x - player.x, b.y - player.y) > 1500) b.dead = true;
  }

  for (const m of game.missiles) {
    if (m.dead) continue;
    const tgt = nearestEnemy(m.x, m.y);
    if (tgt) {
      const dA = Math.atan2(tgt.y - m.y, tgt.x - m.x);
      let cA = Math.atan2(m.vy, m.vx);
      const diff = ((((dA - cA + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
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
    if (Math.random() < 0.7) addParticle(m.x, m.y, rnd(-20, 20), rnd(-20, 20), 0.3, 4, "#ffb24a");
  }

  for (const nv of game.novas) {
    if (nv.dead) continue;
    nv.t += dt;
    nv.r = lerp(10, nv.maxR, nv.t / nv.dur);
    const near = queryCircle(nv.x, nv.y, nv.r + 30);
    for (const e of near) {
      if (e.dead) continue;
      if (nv.pull && !e.boss) {
        // Event Horizon: drag enemies toward the wave's centre.
        const d = Math.hypot(e.x - nv.x, e.y - nv.y) || 1;
        if (d < nv.maxR + 60) {
          e.kbx -= ((e.x - nv.x) / d) * 1.4;
          e.kby -= ((e.y - nv.y) / d) * 1.4;
        }
      }
      if (nv.hit.has(e.id)) continue;
      const d = Math.hypot(e.x - nv.x, e.y - nv.y);
      if (d < nv.r + e.r) {
        nv.hit.add(e.id);
        const a = Math.atan2(e.y - nv.y, e.x - nv.x);
        const kb = nv.pull ? -3 : 8;
        damageEnemy(e, nv.dmg, Math.cos(a) * kb, Math.sin(a) * kb);
      }
    }
    if (nv.t >= nv.dur) nv.dead = true;
  }

  for (const g of game.glaives) {
    if (g.dead) continue;
    g.spin += 14 * dt;
    if (g.state === 0) {
      const step = g.speed * dt;
      g.x += Math.cos(g.ang) * step;
      g.y += Math.sin(g.ang) * step;
      g.dist += step;
      g.speed = Math.max(220, g.speed - 380 * dt);
      if (g.dist >= g.maxDist) {
        g.state = 1;
        g.hit.clear();
      }
    } else {
      const dx = player.x - g.x;
      const dy = player.y - g.y;
      const d = Math.hypot(dx, dy) || 1;
      g.speed = Math.min(720, g.speed + 900 * dt);
      g.x += (dx / d) * g.speed * dt;
      g.y += (dy / d) * g.speed * dt;
      if (d < 26) {
        g.dead = true;
        continue;
      }
    }
    const near = queryCircle(g.x, g.y, g.r + 26);
    for (const e of near) {
      if (e.dead || g.hit.has(e.id)) continue;
      const rr = g.r + e.r;
      if ((e.x - g.x) * (e.x - g.x) + (e.y - g.y) * (e.y - g.y) < rr * rr) {
        g.hit.add(e.id);
        const a = Math.atan2(e.y - g.y, e.x - g.x);
        damageEnemy(e, g.dmg, Math.cos(a) * 4, Math.sin(a) * 4);
      }
    }
    if (Math.random() < 0.4) addParticle(g.x, g.y, rnd(-15, 15), rnd(-15, 15), 0.18, 4, g.evolved ? "#eaffc0" : "#d6ff7d");
  }

  // Enemy projectiles.
  for (const eb of game.ebullets) {
    if (eb.dead) continue;
    eb.x += eb.vx * dt;
    eb.y += eb.vy * dt;
    eb.life -= dt;
    if (eb.life <= 0 || Math.hypot(eb.x - player.x, eb.y - player.y) > 1400) {
      eb.dead = true;
      continue;
    }
    if (player.invuln <= 0) {
      const rr = eb.r + player.radius;
      if ((eb.x - player.x) * (eb.x - player.x) + (eb.y - player.y) * (eb.y - player.y) < rr * rr) {
        hurtPlayer(eb.dmg);
        eb.dead = true;
      }
    }
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
  for (let i = 0; i < 14; i++) {
    const a = rnd(TAU);
    const s = rnd(40, 200);
    addParticle(m.x, m.y, Math.cos(a) * s, Math.sin(a) * s, rnd(0.3, 0.6), rnd(4, 9), "#ffb24a");
  }
  ring(m.x, m.y, m.aoe, "#ffb24a", 3, 0.32);
  popText(m.x, m.y, Math.round(m.dmg), "#ffb24a");
  game.shake.mag = Math.max(game.shake.mag, 6);
  sfx.explode();
}
