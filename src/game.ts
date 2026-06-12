// Fixed-update game loop: simulation step plus render.

import { game, PLAYING } from "./core/state";
import { view } from "./core/canvas";
import { CFG } from "./config/tuning";
import { rnd } from "./utils/math";
import { updateWeapons } from "./systems/weapons";
import { spawnEnemies } from "./systems/spawn";
import { updateEnemies } from "./systems/enemies";
import { buildGrid } from "./systems/grid";
import { updateProjectiles } from "./systems/projectiles";
import { collisions } from "./systems/combat";
import { updateGems } from "./systems/pickups";
import { addParticle, updateParticles, updateTexts, updateAnnounces } from "./systems/effects";
import { render } from "./render/render";

function update(dt: number): void {
  const { player, run, keys, joy, cam, shake } = game;
  run.time += dt;
  if (run.bannerT > 0) run.bannerT -= dt;
  if (run.reviveFlash > 0) run.reviveFlash -= dt;
  let ix = 0;
  let iy = 0;
  if (joy.active) {
    ix = joy.dx / joy.max;
    iy = joy.dy / joy.max;
  } else {
    if (keys["arrowleft"] || keys["a"]) ix -= 1;
    if (keys["arrowright"] || keys["d"]) ix += 1;
    if (keys["arrowup"] || keys["w"]) iy -= 1;
    if (keys["arrowdown"] || keys["s"]) iy += 1;
  }
  const il = Math.hypot(ix, iy);
  if (il > 1) {
    ix /= il;
    iy /= il;
  }
  player.vx = ix * CFG.player.speed * player.speedMul;
  player.vy = iy * CFG.player.speed * player.speedMul;
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  player.moving = il > 0.05;
  if (player.moving) {
    player.angle = Math.atan2(iy, ix);
    if (Math.random() < 0.7)
      addParticle(
        player.x - Math.cos(player.angle) * 12,
        player.y - Math.sin(player.angle) * 12,
        -player.vx * 0.2 + rnd(-20, 20),
        -player.vy * 0.2 + rnd(-20, 20),
        0.3,
        4,
        "#46e0ff",
      );
  }
  if (player.invuln > 0) player.invuln -= dt;
  if (player.hurtFlash > 0) player.hurtFlash -= dt;
  if (player.regen > 0) player.hp = Math.min(player.maxHP, player.hp + player.regen * dt);

  updateWeapons(dt);
  spawnEnemies(dt);
  updateEnemies(dt);
  buildGrid();
  updateProjectiles(dt);
  collisions(dt);
  updateGems(dt);
  updateParticles(dt);
  updateTexts(dt);
  updateAnnounces(dt);
  if (run.streak > 0 && run.time - run.lastKillTime > 2) {
    run.streak = 0;
    run.lastMilestone = 0;
  }

  if (game.enemies.length) game.enemies = game.enemies.filter((e) => !e.dead);
  game.bullets = game.bullets.filter((b) => !b.dead);
  game.missiles = game.missiles.filter((m) => !m.dead);
  game.novas = game.novas.filter((n) => !n.dead);

  cam.x += (player.x - view.W / 2 - cam.x) * Math.min(1, dt * 14);
  cam.y += (player.y - view.H / 2 - cam.y) * Math.min(1, dt * 14);
  shake.mag *= 0.86;
  if (shake.mag < 0.1) shake.mag = 0;
}

export function frame(t: number): void {
  requestAnimationFrame(frame);
  let dt = (t - game.last) / 1000;
  game.last = t;
  if (dt > 0.05) dt = 0.05;
  if (dt < 0) dt = 0;
  if (game.state === PLAYING) update(dt);
  render();
}
