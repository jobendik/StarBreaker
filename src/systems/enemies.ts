// Enemy steering, separation, and movement integration.

import { game } from "../core/state";
import { CFG } from "../config/tuning";
import { buildGrid, queryCircle } from "./grid";

export function updateEnemies(dt: number): void {
  buildGrid();
  const { player } = game;
  const dmgScale = 1 + game.run.time * CFG.spawn.dmgRamp;
  for (const e of game.enemies) {
    if (e.dead) continue;
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    const dl = Math.hypot(dx, dy) || 1;
    dx /= dl;
    dy /= dl;
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
    e.vx = dx * e.speed + sx * e.speed * 0.6;
    e.vy = dy * e.speed + sy * e.speed * 0.6;
    e.x += e.vx * dt + e.kbx;
    e.y += e.vy * dt + e.kby;
    e.kbx *= 0.84;
    e.kby *= 0.84;
    e.spin += e.spv * dt;
    if (e.flash > 0) e.flash -= dt;
    e._dmg = e.dmg * dmgScale;
  }
}
