// Gem and pickup magnetism, collection, and pickup effects.

import { game, screenFlash } from "../core/state";
import { CFG } from "../config/tuning";
import { lerp } from "../utils/math";
import { sfx } from "../core/audio";
import { addParticle, popText, announce, ring } from "./effects";
import { addXP } from "./progression";
import { damageEnemy } from "./combat";

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
      const sp = Math.min(720, 200 + (pr - d) * 4 + (g.mag ? 240 : 0));
      g.vx = lerp(g.vx, (dx / d) * sp, 0.25);
      g.vy = lerp(g.vy, (dy / d) * sp, 0.25);
    } else {
      g.vx *= 0.9;
      g.vy *= 0.9;
    }
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    if (d < player.radius + 9) {
      addXP(g.value);
      game.run.gems++;
      sfx.pickup();
      addParticle(g.x, g.y, 0, 0, 0.2, 5, "#7cfc8a");
      game.gems.splice(i, 1);
    }
  }
  for (let i = game.pickups.length - 1; i >= 0; i--) {
    const p = game.pickups[i];
    p.t += dt;
    const dx = player.x - p.x;
    const dy = player.y - p.y;
    const d = Math.hypot(dx, dy) || 0.001;
    if (d < pr * 1.15) {
      const sp = 280;
      p.x += (dx / d) * sp * dt;
      p.y += (dy / d) * sp * dt;
    }
    if (d < player.radius + 13) {
      applyPickup(p.type, p.value);
      game.pickups.splice(i, 1);
    }
  }
}

function applyPickup(type: string, value: number): void {
  const { player, run } = game;
  if (type === "heal") {
    player.hp = Math.min(player.maxHP, player.hp + player.maxHP * value);
    popText(player.x, player.y - 20, "+" + Math.round(player.maxHP * value), "#7cfc8a", 16);
    sfx.revive();
  } else if (type === "coin") {
    run.coins += value;
    popText(player.x, player.y - 20, "+" + value + " ◆", "#ffcf4a", 15);
    sfx.coin();
  } else if (type === "magnet") {
    for (const g of game.gems) g.mag = true;
    announce("MAGNETIZED", "#7cfc8a", 36);
    ring(player.x, player.y, 380, "#7cfc8a", 3, 0.5);
    sfx.revive();
  } else if (type === "bomb") {
    for (const e of game.enemies) {
      if (e.dead) continue;
      const a = Math.atan2(e.y - player.y, e.x - player.x);
      damageEnemy(e, e.boss ? 250 : 9999, Math.cos(a) * 10, Math.sin(a) * 10, true);
    }
    announce("OVERLOAD", "#ffb24a", 42);
    ring(player.x, player.y, 520, "#ffb24a", 5, 0.6);
    screenFlash("#ffb24a", 0.3);
    game.shake.mag = Math.max(game.shake.mag, 14);
    sfx.bigExplode();
  }
}
