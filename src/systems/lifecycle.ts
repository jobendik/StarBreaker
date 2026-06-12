// Run initialization, ship loadouts, stat recomputation, death, revive,
// victory, scoring, missions, and meta finalization.

import { game, PLAYING, DEAD, VICTORY } from "../core/state";
import { view } from "../core/canvas";
import { CFG } from "../config/tuning";
import { meta, saveMeta } from "../core/storage";
import { sdkStart, sdkStop } from "../core/sdk";
import { sfx, musicSetIntensity, musicSetBoss } from "../core/audio";
import { shipById, SHIPS, MISSION_POOL, MissionDef } from "../config/definitions";
import { seededRand, dateSeed, todayKey } from "../utils/math";
import { xpReq } from "./progression";
import { damageEnemy } from "./combat";
import { unlockAch, toast } from "./effects";
import { hideAll, showGameOver, showVictory } from "../ui/overlays";
import type { CoreBreakdown } from "../types";

export function recompute(): void {
  const p = game.player;
  const P = p.passt;
  const ship = shipById(meta.ship);
  p.dmgMul = (1 + 0.13 * P.power) * (1 + 0.06 * meta.up.dmg) * ship.dmg;
  p.fireMul = Math.pow(0.9, P.haste);
  p.speedMul = (1 + 0.08 * P.speed) * (1 + 0.04 * meta.up.spd) * ship.speed;
  p.pickupMul = (1 + 0.3 * P.magnet) * (1 + 0.15 * meta.up.mag);
  p.regen = 0.6 * P.regen;
  p.xpMul = 1 + 0.15 * P.greed;
  p.armor = Math.min(0.6, 0.1 * P.armor);
  p.critChance = 0.05 + 0.05 * P.crit + 0.02 * meta.up.crit + ship.crit;
  p.dashCdMax = CFG.player.dashCd * ship.dashCd * (1 - 0.08 * meta.up.dash);
  const newMax = Math.max(40, CFG.player.maxHP + ship.hp + 20 * meta.up.hp + 25 * P.maxhp);
  if (p.maxHP) {
    const d = newMax - p.maxHP;
    if (d > 0) p.hp = Math.min(newMax, p.hp + d);
  }
  p.maxHP = newMax;
}

export function startRun(): void {
  const { player, run } = game;
  const ship = shipById(meta.ship);
  game.enemies = [];
  game.bullets = [];
  game.missiles = [];
  game.novas = [];
  game.glaives = [];
  game.beams = [];
  game.arcs = [];
  game.rings = [];
  game.ebullets = [];
  game.gems = [];
  game.pickups = [];
  game.particles = [];
  game.texts = [];
  game.announces = [];
  game.spawnTimer = 0;
  game.freeze = 0;
  game.flash.t = 0;
  player.x = 0;
  player.y = 0;
  player.vx = 0;
  player.vy = 0;
  player.angle = -Math.PI / 2;
  player.moving = false;
  player.radius = CFG.player.radius;
  player.invuln = 1.0;
  player.hurtFlash = 0;
  player.weapons = [{ type: ship.weapon, level: 1, t: 0, evolved: false }];
  player.passt = { power: 0, haste: 0, speed: 0, maxhp: 0, magnet: 0, regen: 0, greed: 0, armor: 0, crit: 0 };
  player.maxHP = 0;
  player.dashCd = 0;
  player.dashT = 0;
  player.dashX = 0;
  player.dashY = -1;
  player.trail = [];
  recompute();
  player.hp = player.maxHP;
  run.time = 0;
  run.kills = 0;
  run.level = 1;
  run.xp = 0;
  run.xpNeed = xpReq(1);
  run.pendingLevel = 0;
  run.nextBoss = CFG.boss.every;
  run.bossIndex = 0;
  run.bannerT = 0;
  run.banner = "";
  run.bannerColor = "#ff5c8a";
  run.revivesLeft = 1 + meta.up.rev;
  run.adRevivesLeft = 1;
  run.reviveFlash = 0;
  run.levelFlash = 0;
  run.finalized = false;
  run.streak = 0;
  run.maxStreak = 0;
  run.lastKillTime = -9;
  run.multiKill = 0;
  run.multiKillTime = -9;
  run.lastMilestone = 0;
  run.score = 0;
  run.sector = 1;
  run.coins = 0;
  run.gems = 0;
  run.elites = 0;
  run.bosses = 0;
  run.dashes = 0;
  run.nextEventT = CFG.events.first;
  run.lastEvent = "";
  run.nextEliteT = CFG.elites.first;
  run.titanAlive = false;
  run.titanDead = false;
  run.overdrive = false;
  run.rerolls = 2;
  run.lowHpT = 0;
  game.cam.x = player.x - view.W / 2;
  game.cam.y = player.y - view.H / 2;
  game.state = PLAYING;
  game.hintT = meta.stats.runs === 0 ? 14 : 0;
  hideAll();
  game.last = performance.now();
  musicSetIntensity(0.3);
  musicSetBoss(false);
  sdkStart();
}

export function onDeath(): void {
  game.state = DEAD;
  sdkStop();
  musicSetIntensity(0.12);
  musicSetBoss(false);
  sfx.gameover();
  showGameOver();
}

export function onVictory(): void {
  const run = game.run;
  run.coins += 150; // Titan bounty, shown in the cores breakdown.
  game.state = VICTORY;
  sdkStop();
  musicSetBoss(false);
  musicSetIntensity(0.2);
  showVictory();
}

export function continueOverdrive(): void {
  const run = game.run;
  run.overdrive = true;
  run.nextBoss = run.time + 30;
  game.state = PLAYING;
  hideAll();
  game.last = performance.now();
  musicSetIntensity(0.9);
  sdkStart();
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
    if (d < 260 && d > 0.001) {
      if (e.boss) {
        e.kbx += ((e.x - player.x) / d) * 40;
        e.kby += ((e.y - player.y) / d) * 40;
      } else {
        const a = Math.atan2(e.y - player.y, e.x - player.x);
        damageEnemy(e, 9999, Math.cos(a) * 8, Math.sin(a) * 8, true);
      }
    }
  }
  game.shake.mag = 14;
  game.state = PLAYING;
  hideAll();
  game.last = performance.now();
  sdkStart();
}

// ── Daily missions ──────────────────────────────────────────────────────────

export function todaysMissions(): MissionDef[] {
  const rng = seededRand(dateSeed(todayKey()));
  const pool = MISSION_POOL.slice();
  const out: MissionDef[] = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

export function missionProgress(m: MissionDef): number {
  const run = game.run;
  switch (m.stat) {
    case "kills":
      return run.kills;
    case "time":
      return run.time;
    case "gems":
      return run.gems;
    case "elites":
      return run.elites;
    case "bosses":
      return run.bosses;
    case "streak":
      return run.maxStreak;
    case "level":
      return run.level;
    case "dashes":
      return run.dashes;
  }
}

export function ensureDaily(): { cargoAvailable: boolean } {
  const today = todayKey();
  if (meta.daily.date !== today) {
    const yesterday = new Date(Date.now() - 86400000);
    const ym = String(yesterday.getMonth() + 1).padStart(2, "0");
    const yd = String(yesterday.getDate()).padStart(2, "0");
    const ykey = yesterday.getFullYear() + "-" + ym + "-" + yd;
    if (meta.daily.date !== ykey) meta.daily.streak = 0;
    meta.daily.date = today;
    meta.daily.cargo = false;
    meta.daily.done = [];
    saveMeta();
  }
  return { cargoAvailable: !meta.daily.cargo };
}

export function claimCargo(): number {
  ensureDaily();
  if (meta.daily.cargo) return 0;
  meta.daily.streak++;
  const amount = Math.min(60, 20 + meta.daily.streak * 5);
  meta.daily.cargo = true;
  meta.cores += amount;
  saveMeta();
  return amount;
}

// ── Run finalization ────────────────────────────────────────────────────────

export function finalizeRun(): CoreBreakdown {
  const run = game.run;
  const empty: CoreBreakdown = { scoreCores: 0, coins: 0, missions: [], total: 0, newBest: false };
  if (run.finalized) return empty;
  run.finalized = true;
  ensureDaily();

  // Square-root scaling keeps the economy sane on monster runs.
  const coreMul = 1 + 0.1 * meta.up.core;
  const scoreCores = Math.floor((Math.floor(Math.sqrt(run.score) / 3) + run.level) * coreMul);
  const breakdown: CoreBreakdown = {
    scoreCores,
    coins: run.coins,
    missions: [],
    total: scoreCores + run.coins,
    newBest: false,
  };

  // Daily missions completed this run.
  for (const m of todaysMissions()) {
    if (meta.daily.done.indexOf(m.id) >= 0) continue;
    if (missionProgress(m) >= m.target) {
      meta.daily.done.push(m.id);
      meta.cores += m.reward;
      breakdown.missions.push({ name: m.txt, reward: m.reward });
      breakdown.total += m.reward;
      toast("MISSION COMPLETE", m.txt + "  ·  +" + m.reward + " ◆", "◎", true);
      sfx.mission();
    }
  }

  meta.cores += scoreCores + run.coins;
  if (run.score > meta.best) {
    meta.best = run.score;
    breakdown.newBest = true;
  }
  meta.stats.runs++;
  meta.stats.time += run.time;
  if (run.time > meta.stats.bestTime) meta.stats.bestTime = run.time;
  if (run.sector > meta.stats.bestSector) meta.stats.bestSector = run.sector;
  meta.stats.dashes += run.dashes;
  if (meta.stats.dashes >= 100) unlockAch("dash100");

  // Ship unlock conditions (achievement-style unlock, separate from buying).
  for (const s of SHIPS) {
    if (meta.ships.indexOf(s.id) >= 0) continue;
    const u = s.unlock;
    const ok =
      (u.type === "sector" && meta.stats.bestSector >= u.v) ||
      (u.type === "time" && meta.stats.bestTime >= u.v) ||
      (u.type === "bosses" && meta.stats.bosses >= u.v);
    if (ok) {
      meta.ships.push(s.id);
      toast("NEW SHIP UNLOCKED", s.name + " is ready in the hangar", "▲", true);
      sfx.unlock();
    }
  }

  saveMeta();
  return breakdown;
}
