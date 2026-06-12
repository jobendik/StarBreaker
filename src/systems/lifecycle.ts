// Run initialization, player stat recomputation, death, revive, and scoring.

import { game, PLAYING, DEAD } from "../core/state";
import { view } from "../core/canvas";
import { CFG } from "../config/tuning";
import { meta, saveMeta } from "../core/storage";
import { sdkStart, sdkStop } from "../core/sdk";
import { sfx } from "../core/audio";
import { xpReq } from "./progression";
import { damageEnemy } from "./combat";
import { hideAll, showGameOver } from "../ui/overlays";

export function recompute(): void {
  const p = game.player;
  const P = p.passt;
  p.dmgMul = (1 + 0.13 * P.power) * (1 + 0.06 * meta.up.dmg);
  p.fireMul = Math.pow(0.9, P.haste);
  p.speedMul = (1 + 0.08 * P.speed) * (1 + 0.04 * meta.up.spd);
  p.pickupMul = (1 + 0.3 * P.magnet) * (1 + 0.15 * meta.up.mag);
  p.regen = 0.6 * P.regen;
  p.xpMul = 1 + 0.15 * P.greed;
  p.armor = Math.min(0.6, 0.1 * P.armor);
  p.critChance = 0.08 + 0.05 * (P.crit || 0);
  const newMax = CFG.player.maxHP + 20 * meta.up.hp + 25 * P.maxhp;
  if (p.maxHP) {
    const d = newMax - p.maxHP;
    if (d > 0) p.hp = Math.min(newMax, p.hp + d);
  }
  p.maxHP = newMax;
}

export function startRun(): void {
  const { player, run } = game;
  game.enemies = [];
  game.bullets = [];
  game.missiles = [];
  game.novas = [];
  game.gems = [];
  game.pickups = [];
  game.particles = [];
  game.texts = [];
  game.spawnTimer = 0;
  player.x = 0;
  player.y = 0;
  player.vx = 0;
  player.vy = 0;
  player.angle = -Math.PI / 2;
  player.moving = false;
  player.radius = CFG.player.radius;
  player.invuln = 1.0;
  player.hurtFlash = 0;
  player.weapons = [{ type: "pulse", level: 1, t: 0 }];
  player.passt = { power: 0, haste: 0, speed: 0, maxhp: 0, magnet: 0, regen: 0, greed: 0, armor: 0, crit: 0 };
  player.maxHP = 0;
  recompute();
  player.hp = player.maxHP;
  run.time = 0;
  run.kills = 0;
  run.level = 1;
  run.xp = 0;
  run.xpNeed = xpReq(1);
  run.pendingLevel = 0;
  run.nextBoss = CFG.boss.every;
  run.bannerT = 0;
  run.banner = "";
  run.revivesLeft = 1 + meta.up.rev;
  run.reviveFlash = 0;
  run.finalized = false;
  run.streak = 0;
  run.maxStreak = 0;
  run.lastKillTime = -9;
  run.multiKill = 0;
  run.multiKillTime = -9;
  run.lastMilestone = 0;
  run.score = 0;
  game.announces = [];
  game.cam.x = player.x - view.W / 2;
  game.cam.y = player.y - view.H / 2;
  game.state = PLAYING;
  hideAll();
  game.last = performance.now();
  sdkStart();
}

export function onDeath(): void {
  game.state = DEAD;
  sdkStop();
  showGameOver();
}

export function score(): number {
  return game.run.score;
}

export function doRevive(): void {
  const { player, run } = game;
  player.hp = player.maxHP;
  player.invuln = 2.6;
  run.reviveFlash = 0.8;
  sfx.revive();
  for (const e of game.enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - player.x, e.y - player.y);
    if (d < 240 && d > 0.001) {
      if (e.boss) {
        e.kbx += ((e.x - player.x) / d) * 40;
        e.kby += ((e.y - player.y) / d) * 40;
      } else {
        const a = Math.atan2(e.y - player.y, e.x - player.x);
        damageEnemy(e, 9999, Math.cos(a) * 8, Math.sin(a) * 8);
      }
    }
  }
  game.shake.mag = 14;
  game.state = PLAYING;
  hideAll();
  game.last = performance.now();
  sdkStart();
}

export function finalizeRun(): void {
  const run = game.run;
  if (run.finalized) return;
  run.finalized = true;
  const sc = score();
  const earned = Math.floor(run.score / 300) + run.level;
  meta.cores += earned;
  if (sc > meta.best) meta.best = sc;
  saveMeta();
}
