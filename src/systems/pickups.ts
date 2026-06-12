// Gem and pickup magnetism, collection, and healing.

import { game } from "../core/state";
import { CFG } from "../config/tuning";
import { lerp } from "../utils/math";
import { sfx } from "../core/audio";
import { addParticle, popText } from "./effects";
import { addXP } from "./progression";

export function updateGems(dt: number): void {
  const { player } = game;
  const pr = CFG.player.pickup * player.pickupMul;
  for (let i = game.gems.length - 1; i >= 0; i--) {
    const g = game.gems[i];
    const dx = player.x - g.x;
    const dy = player.y - g.y;
    const d = Math.hypot(dx, dy) || 0.001;
    if (d < pr || g.mag) {
      g.mag = true;
      const sp = Math.min(620, 180 + (pr - d) * 4);
      g.vx = lerp(g.vx, (dx / d) * sp, 0.25);
      g.vy = lerp(g.vy, (dy / d) * sp, 0.25);
    } else {
      g.vx *= 0.9;
      g.vy *= 0.9;
    }
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    if (d < player.radius + 8) {
      addXP(g.value);
      sfx.pickup();
      addParticle(g.x, g.y, 0, 0, 0.2, 5, "#7cfc8a");
      game.gems.splice(i, 1);
    }
  }
  for (let i = game.pickups.length - 1; i >= 0; i--) {
    const p = game.pickups[i];
    const dx = player.x - p.x;
    const dy = player.y - p.y;
    const d = Math.hypot(dx, dy) || 0.001;
    if (d < pr * 1.1) {
      const sp = 260;
      p.x += (dx / d) * sp * dt;
      p.y += (dy / d) * sp * dt;
    }
    if (d < player.radius + 12) {
      player.hp = Math.min(player.maxHP, player.hp + player.maxHP * p.value);
      popText(player.x, player.y - 20, "+" + Math.round(player.maxHP * p.value), "#7cfc8a");
      sfx.revive();
      game.pickups.splice(i, 1);
    }
  }
}
