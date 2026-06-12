// Enemy steering, behaviours (weaver/dasher/spitter), boss attack patterns,
// separation, and movement integration.

import { game } from "../core/state";
import { CFG } from "../config/tuning";
import { TAU, rnd } from "../utils/math";
import { buildGrid, queryCircle } from "./grid";
import { spawnEnemy } from "./spawn";
import { addParticle } from "./effects";
import type { Enemy } from "../types";

function fireEBullet(e: Enemy, ang: number, speed: number, dmg: number, r = 6): void {
  if (game.ebullets.length >= CFG.caps.ebullets) game.ebullets.shift();
  game.ebullets.push({
    x: e.x,
    y: e.y,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    r,
    dmg,
    life: 7,
    color: "#ff6fae",
    dead: false,
  });
}

function bossBehavior(e: Enemy, dt: number, dx: number, dy: number, dl: number): { mx: number; my: number; spdMul: number } {
  const { player } = game;
  const enraged = e.hp < e.maxhp * 0.5;
  e.atkT -= dt;
  let spdMul = 1;

  if (e.bossKind === "sentinel" || (e.bossKind === "titan" && e.hp > e.maxhp * 0.66)) {
    if (e.atkT <= 0) {
      e.atkT = enraged ? 3.6 : 5;
      const n = (enraged ? 18 : 13) + (e.bossKind === "titan" ? 6 : 0);
      for (let i = 0; i < n; i++) fireEBullet(e, (i / n) * TAU + e.spin, 150, e._dmg * 0.45, 6);
    }
  } else if (e.bossKind === "queen") {
    if (e.atkT <= 0) {
      e.atkT = enraged ? 4 : 6;
      const n = enraged ? 6 : 4;
      for (let i = 0; i < n; i++) {
        const a = rnd(TAU);
        spawnEnemy("swarmer", { x: e.x + Math.cos(a) * (e.r + 16), y: e.y + Math.sin(a) * (e.r + 16) });
      }
      e.flash = 0.2;
    }
    spdMul = 0.8;
  } else if (e.bossKind === "ravager" || (e.bossKind === "titan" && e.hp <= e.maxhp * 0.66)) {
    // Charge cycle: 0 approach → 1 telegraph → 2 charge → back to 0.
    if (e.phase === 0) {
      if (e.atkT <= 0 && dl < 420) {
        e.phase = 1;
        e.pt = 0.7;
        e.tx = dx / dl;
        e.ty = dy / dl;
      }
    } else if (e.phase === 1) {
      e.pt -= dt;
      e.flash = 0.1;
      spdMul = 0.1;
      if (e.pt <= 0) {
        e.phase = 2;
        e.pt = 0.75;
      }
    } else if (e.phase === 2) {
      e.pt -= dt;
      e.x += e.tx * 560 * dt;
      e.y += e.ty * 560 * dt;
      spdMul = 0;
      if (Math.random() < 0.6) addParticle(e.x, e.y, rnd(-40, 40), rnd(-40, 40), 0.25, 6, e.color);
      if (e.pt <= 0) {
        e.phase = 0;
        e.atkT = enraged ? 2.2 : 3.6;
      }
    }
    // Titan in its final phase also spawns swarm + keeps charging.
    if (e.bossKind === "titan" && e.hp <= e.maxhp * 0.33) {
      e.fireT -= dt;
      if (e.fireT <= 0) {
        e.fireT = 5;
        for (let i = 0; i < 5; i++) {
          const a = rnd(TAU);
          spawnEnemy("swarmer", { x: e.x + Math.cos(a) * (e.r + 16), y: e.y + Math.sin(a) * (e.r + 16) });
        }
        const n2 = 16;
        for (let i = 0; i < n2; i++) fireEBullet(e, (i / n2) * TAU, 170, e._dmg * 0.45, 6);
      }
    }
  }
  // Bosses always drift toward the player while not charging.
  void player;
  return { mx: dx / dl, my: dy / dl, spdMul };
}

export function updateEnemies(dt: number): void {
  buildGrid();
  const { player } = game;
  const dmgScale = 1 + game.run.time * CFG.spawn.dmgRamp;
  for (const e of game.enemies) {
    if (e.dead) continue;
    if (e.spawnT > 0) e.spawnT -= dt;
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    const dl = Math.hypot(dx, dy) || 1;

    let mx = dx / dl;
    let my = dy / dl;
    let spdMul = 1;

    if (e.boss) {
      const b = bossBehavior(e, dt, dx, dy, dl);
      mx = b.mx;
      my = b.my;
      spdMul = b.spdMul;
    } else if (e.type === "weaver") {
      // Sinusoidal strafe while approaching — hard to track.
      const px = -my;
      const py = mx;
      const sway = Math.sin(game.run.time * 4.2 + e.id * 1.7) * 0.85;
      mx = mx + px * sway;
      my = my + py * sway;
      const ml = Math.hypot(mx, my) || 1;
      mx /= ml;
      my /= ml;
    } else if (e.type === "dasher") {
      if (e.phase === 0) {
        if (dl < 270) {
          e.phase = 1;
          e.pt = 0.5;
          e.tx = mx;
          e.ty = my;
        }
      } else if (e.phase === 1) {
        e.pt -= dt;
        e.flash = 0.08;
        spdMul = 0.08;
        if (e.pt <= 0) {
          e.phase = 2;
          e.pt = 0.5;
        }
      } else if (e.phase === 2) {
        e.pt -= dt;
        e.x += e.tx * 540 * dt;
        e.y += e.ty * 540 * dt;
        spdMul = 0;
        if (e.pt <= 0) {
          e.phase = 3;
          e.pt = 0.9;
        }
      } else {
        e.pt -= dt;
        spdMul = 0.4;
        if (e.pt <= 0) e.phase = 0;
      }
    } else if (e.type === "spitter") {
      // Keeps range and lobs plasma at the player.
      if (dl < 240) {
        mx = -mx;
        my = -my;
        spdMul = 0.7;
      } else if (dl < 330) {
        spdMul = 0.1;
      }
      e.fireT -= dt;
      if (e.fireT <= 0 && dl < 560) {
        e.fireT = 2.6;
        const a = Math.atan2(dy, dx) + rnd(-0.08, 0.08);
        fireEBullet(e, a, 140, e._dmg, 5);
        e.flash = 0.12;
      }
    }

    // Separation from neighbours.
    let sx = 0;
    let sy = 0;
    const near = queryCircle(e.x, e.y, e.r + 12);
    let cnt = 0;
    for (const o of near) {
      if (o === e || o.dead) continue;
      const ox = e.x - o.x;
      const oy = e.y - o.y;
      const od = ox * ox + oy * oy;
      const md = e.r + o.r;
      if (od < md * md && od > 0.01) {
        const id = 1 / Math.sqrt(od);
        sx += ox * id;
        sy += oy * id;
        if (++cnt > 6) break;
      }
    }
    e.vx = mx * e.speed * spdMul + sx * e.speed * 0.6;
    e.vy = my * e.speed * spdMul + sy * e.speed * 0.6;
    e.x += e.vx * dt + e.kbx;
    e.y += e.vy * dt + e.kby;
    e.kbx *= 0.84;
    e.kby *= 0.84;
    e.spin += e.spv * dt;
    if (e.flash > 0) e.flash -= dt;
    e._dmg = e.dmg * dmgScale;
  }
}
