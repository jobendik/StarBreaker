// Fixed-update game loop: simulation step plus render.

import { game, PLAYING } from "./core/state";
import { view } from "./core/canvas";
import { CFG } from "./config/tuning";
import { rnd } from "./utils/math";
import { sfx } from "./core/audio";
import { meta } from "./core/storage";
import { updateWeapons } from "./systems/weapons";
import { spawnEnemies } from "./systems/spawn";
import { updateEnemies } from "./systems/enemies";
import { buildGrid } from "./systems/grid";
import { updateProjectiles } from "./systems/projectiles";
import { collisions } from "./systems/combat";
import { updateGems } from "./systems/pickups";
import { addParticle, updateParticles, updateTexts, updateAnnounces, ring } from "./systems/effects";
import { updateBackground } from "./render/background";
import { render } from "./render/render";

export function tryDash(): void {
  const { player, run } = game;
  if (game.state !== PLAYING || player.dashCd > 0 || player.dashT > 0) return;
  player.dashT = CFG.player.dashDur;
  player.dashCd = player.dashCdMax;
  player.invuln = Math.max(player.invuln, CFG.player.dashInv);
  // Dash along current movement, or facing if standing still.
  const il = Math.hypot(player.vx, player.vy);
  if (il > 10) {
    player.dashX = player.vx / il;
    player.dashY = player.vy / il;
  } else {
    player.dashX = Math.cos(player.angle);
    player.dashY = Math.sin(player.angle);
  }
  run.dashes++;
  meta.stats.dashes++;
  ring(player.x, player.y, 46, "#9af2ff", 2.5, 0.3);
  sfx.dash();
}

function update(dt: number): void {
  const { player, run, keys, joy, cam, shake } = game;
  run.time += dt;
  if (run.bannerT > 0) run.bannerT -= dt;
  if (run.reviveFlash > 0) run.reviveFlash -= dt;
  if (run.levelFlash > 0) run.levelFlash -= dt;
  if (game.flash.t > 0) game.flash.t -= dt;
  if (game.hintT > 0) game.hintT -= dt;

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

  if (player.dashCd > 0) player.dashCd -= dt;
  if (player.dashT > 0) {
    // Dashing: locked high-speed burst with afterimages.
    player.dashT -= dt;
    const sp = CFG.player.speed * player.speedMul * CFG.player.dashSpeed;
    player.vx = player.dashX * sp;
    player.vy = player.dashY * sp;
    player.trail.push({ x: player.x, y: player.y, ang: player.angle, life: 0.3, max: 0.3, dash: true });
  } else {
    player.vx = ix * CFG.player.speed * player.speedMul;
    player.vy = iy * CFG.player.speed * player.speedMul;
  }
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  player.moving = il > 0.05 || player.dashT > 0;
  if (il > 0.05 && player.dashT <= 0) player.angle = Math.atan2(iy, ix);
  if (player.moving) {
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
    if (Math.random() < 0.5)
      player.trail.push({ x: player.x, y: player.y, ang: player.angle, life: 0.25, max: 0.25, dash: false });
  }
  for (let i = player.trail.length - 1; i >= 0; i--) {
    player.trail[i].life -= dt;
    if (player.trail[i].life <= 0) player.trail.splice(i, 1);
  }
  if (player.trail.length > 30) player.trail.splice(0, player.trail.length - 30);

  if (player.invuln > 0) player.invuln -= dt;
  if (player.hurtFlash > 0) player.hurtFlash -= dt;
  if (player.regen > 0) player.hp = Math.min(player.maxHP, player.hp + player.regen * dt);

  // Low-integrity heartbeat.
  if (player.hp / player.maxHP < 0.3) {
    run.lowHpT -= dt;
    if (run.lowHpT <= 0) {
      run.lowHpT = 1.1;
      sfx.heart();
    }
  }

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
  updateBackground(dt);
  if (run.streak > 0 && run.time - run.lastKillTime > 2) {
    run.streak = 0;
    run.lastMilestone = 0;
  }

  if (game.enemies.length) game.enemies = game.enemies.filter((e) => !e.dead);
  game.bullets = game.bullets.filter((b) => !b.dead);
  game.missiles = game.missiles.filter((m) => !m.dead);
  game.novas = game.novas.filter((n) => !n.dead);
  game.snares = game.snares.filter((s) => !s.dead);
  game.glaives = game.glaives.filter((g) => !g.dead);
  game.ebullets = game.ebullets.filter((b) => !b.dead);

  // Camera: soft follow with velocity lookahead.
  const lookX = player.vx * 0.14;
  const lookY = player.vy * 0.14;
  cam.x += (player.x + lookX - view.W / 2 - cam.x) * Math.min(1, dt * 9);
  cam.y += (player.y + lookY - view.H / 2 - cam.y) * Math.min(1, dt * 9);
  shake.mag *= 0.86;
  if (shake.mag < 0.1) shake.mag = 0;
}

export function tick(dt: number): void {
  update(dt);
}

export function frame(t: number): void {
  requestAnimationFrame(frame);
  let dt = (t - game.last) / 1000;
  game.last = t;
  if (dt > 0.05) dt = 0.05;
  if (dt < 0) dt = 0;
  // Hit-stop: world runs in slow motion for a beat after big impacts.
  if (game.freeze > 0) {
    game.freeze -= dt;
    dt *= 0.15;
  }
  if (game.state === PLAYING) update(dt);
  render();
}
