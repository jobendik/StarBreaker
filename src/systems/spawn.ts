// Enemy spawning, wave composition, and boss cadence.

import { game } from "../core/state";
import { view } from "../core/canvas";
import { CFG, ENEMIES } from "../config/tuning";
import { TAU, rnd, pick, clamp } from "../utils/math";
import { sfx } from "../core/audio";

export function spawnEnemy(type: string, isBoss?: boolean): void {
  const d = ENEMIES[type];
  const { player } = game;
  const ang = rnd(TAU);
  const dist = Math.max(view.W, view.H) / 2 + rnd(40, 120);
  const hpScale = 1 + game.run.time * CFG.spawn.hpRamp;
  game.enemies.push({
    id: game.idc++,
    type,
    x: player.x + Math.cos(ang) * dist,
    y: player.y + Math.sin(ang) * dist,
    vx: 0,
    vy: 0,
    kbx: 0,
    kby: 0,
    r: d.r,
    hp: d.hp * hpScale,
    maxhp: d.hp * hpScale,
    speed: d.speed * (0.9 + Math.random() * 0.2),
    dmg: d.dmg,
    _dmg: d.dmg,
    xp: d.xp,
    color: d.color,
    sides: d.sides,
    spin: rnd(TAU),
    spv: rnd(-1.4, 1.4),
    flash: 0,
    boss: !!isBoss,
    dead: false,
  });
}

function weightedType(): string {
  const t = game.run.time;
  const bag = ["drone", "drone", "drone"];
  if (t > 10) bag.push("swarmer", "swarmer");
  if (t > 25) bag.push("brute");
  if (t > 40) bag.push("splitter", "swarmer");
  if (t > 70) bag.push("brute", "splitter");
  return pick(bag);
}

export function spawnEnemies(dt: number): void {
  const run = game.run;
  game.spawnTimer -= dt;
  const interval = clamp(
    CFG.spawn.baseInterval - run.time * CFG.spawn.ramp,
    CFG.spawn.minInterval,
    CFG.spawn.baseInterval,
  );
  if (game.spawnTimer <= 0 && game.enemies.length < CFG.spawn.maxEnemies) {
    game.spawnTimer = interval;
    const group = 1 + Math.floor(run.time / 18);
    for (let i = 0; i < group && game.enemies.length < CFG.spawn.maxEnemies; i++)
      spawnEnemy(weightedType());
  }
  if (run.time >= run.nextBoss) {
    run.nextBoss += CFG.boss.every;
    spawnEnemy("boss", true);
    run.banner = "\u26A0  SENTINEL INCOMING";
    run.bannerT = 2.6;
    sfx.boss();
  }
}
