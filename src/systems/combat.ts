// Damage application, enemy death, drops, and all collision resolution.

import { game } from "../core/state";
import { CFG, ENEMIES } from "../config/tuning";
import { TAU, rnd } from "../utils/math";
import { sfx } from "../core/audio";
import { sdkHappy } from "../core/sdk";
import { queryCircle } from "./grid";
import { addParticle, popText, announce, unlockAch, checkAch } from "./effects";
import { onDeath } from "./lifecycle";
import type { Enemy } from "../types";

export function damageEnemy(
  e: Enemy,
  dmg: number,
  kbx: number,
  kby: number,
  quiet?: boolean,
): void {
  let crit = false;
  if (!quiet && game.player.critChance > 0 && Math.random() < game.player.critChance) {
    dmg *= 1.6 + Math.random() * 0.8;
    crit = true;
  }
  e.hp -= dmg;
  e.flash = 0.12;
  if (!e.boss) {
    e.kbx += kbx;
    e.kby += kby;
  }
  if (!quiet) sfx.hit();
  if (crit) {
    popText(e.x, e.y - 6, "CRIT " + Math.round(dmg), "#ffd34a");
    game.shake.mag = Math.max(game.shake.mag, 3.5);
  }
  if (Math.random() < 0.5)
    addParticle(e.x, e.y, kbx * 6 + rnd(-30, 30), kby * 6 + rnd(-30, 30), 0.25, 3, crit ? "#ffd34a" : e.color);
  if (e.hp <= 0) killEnemy(e);
}

function killEnemy(e: Enemy): void {
  if (e.dead) return;
  e.dead = true;
  const run = game.run;
  run.kills++;
  const now = run.time;
  if (now - run.multiKillTime < 1.2) run.multiKill++;
  else run.multiKill = 1;
  run.multiKillTime = now;
  run.streak++;
  if (run.streak > run.maxStreak) run.maxStreak = run.streak;
  run.lastKillTime = now;
  if (run.multiKill >= 2) {
    const names = ["", "", "DOUBLE KILL", "TRIPLE KILL", "MEGA KILL", "ULTRA KILL", "MONSTER KILL", "GODLIKE"];
    announce(names[Math.min(run.multiKill, 7)], run.multiKill >= 5 ? "#ffd34a" : "#9af2ff", 40 + Math.min(run.multiKill, 6) * 3);
  }
  if (run.streak % 10 === 0 && run.streak > run.lastMilestone) {
    announce("COMBO x" + run.streak, "#46e0ff", 46);
    run.lastMilestone = run.streak;
    sdkHappy();
  }
  run.score += Math.round((e.xp * 8 + 4) * (1 + run.streak * 0.04) * (1 + (run.multiKill - 1) * 0.12));
  checkAch();
  const np = e.boss ? 34 : 10;
  for (let i = 0; i < np; i++) {
    const a = rnd(TAU);
    const s = rnd(40, e.boss ? 320 : 180);
    addParticle(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, rnd(0.3, 0.7), rnd(3, e.boss ? 10 : 7), e.color);
  }
  game.shake.mag = Math.max(game.shake.mag, e.boss ? 16 : 2.4);
  if (e.boss) {
    sfx.explode();
    announce("SENTINEL DOWN", "#ffcf4a", 44);
    unlockAch("sentinel");
    dropGem(e.x, e.y, e.xp);
    game.pickups.push({ type: "heal", x: e.x, y: e.y, r: 13, value: 0.35 });
  } else dropGem(e.x, e.y, e.xp);
  if (e.type === "splitter") {
    for (let i = 0; i < 3; i++) {
      const a = rnd(TAU);
      const c = ENEMIES.shard;
      game.enemies.push({
        id: game.idc++,
        type: "shard",
        x: e.x + Math.cos(a) * 10,
        y: e.y + Math.sin(a) * 10,
        vx: 0,
        vy: 0,
        kbx: Math.cos(a) * 6,
        kby: Math.sin(a) * 6,
        r: c.r,
        hp: c.hp,
        maxhp: c.hp,
        speed: c.speed,
        dmg: c.dmg,
        _dmg: c.dmg,
        xp: c.xp,
        color: c.color,
        sides: c.sides,
        spin: rnd(TAU),
        spv: rnd(-2, 2),
        flash: 0,
        boss: false,
        dead: false,
      });
    }
  }
}

export function dropGem(x: number, y: number, xp: number): void {
  if (game.gems.length >= CFG.caps.gems) return;
  const a = rnd(TAU);
  const s = rnd(20, 70);
  game.gems.push({
    x,
    y,
    vx: Math.cos(a) * s,
    vy: Math.sin(a) * s,
    value: xp,
    r: xp >= 12 ? 8 : xp >= 5 ? 6 : 4,
    mag: false,
  });
}

export function hurtPlayer(d: number): void {
  const { player, run } = game;
  if (!isFinite(d)) d = 6;
  d *= 1 - player.armor;
  player.hp -= d;
  player.invuln = CFG.player.invuln;
  player.hurtFlash = 0.5;
  game.shake.mag = Math.max(game.shake.mag, 9);
  sfx.hurt();
  if (run.streak >= 5) announce("COMBO BROKEN", "#ff5b6e", 38);
  run.streak = 0;
  run.lastMilestone = 0;
  run.multiKill = 0;
  if (player.hp <= 0) {
    player.hp = 0;
    onDeath();
  }
}

export function collisions(dt: number): void {
  const { player } = game;
  for (const b of game.bullets) {
    if (b.dead) continue;
    const near = queryCircle(b.x, b.y, b.r + 24);
    for (const e of near) {
      if (e.dead) continue;
      if (b.hit && b.hit.has(e.id)) continue;
      const rr = b.r + e.r;
      if ((e.x - b.x) * (e.x - b.x) + (e.y - b.y) * (e.y - b.y) < rr * rr) {
        damageEnemy(e, b.dmg, b.vx * 0.012, b.vy * 0.012);
        if (b.hit) b.hit.add(e.id);
        b.hits++;
        if (b.hits > b.pierce) {
          b.dead = true;
          break;
        }
      }
    }
  }
  for (const w of player.weapons) {
    if (w.type !== "orbital") continue;
    const lvl = w.level;
    const orbs = [2, 2, 3, 3, 4, 5, 6][Math.min(lvl - 1, 6)];
    const rad = 64 + (lvl - 1) * 8;
    const dps = (26 + (lvl - 1) * 10) * player.dmgMul;
    w._orbs = [];
    for (let k = 0; k < orbs; k++) {
      const oa = (w.ang || 0) + (k * TAU) / orbs;
      const ox = player.x + Math.cos(oa) * rad;
      const oy = player.y + Math.sin(oa) * rad;
      w._orbs.push({ x: ox, y: oy });
      const near = queryCircle(ox, oy, 12 + 24);
      for (const e of near) {
        if (e.dead) continue;
        const rr = e.r + 11;
        if ((e.x - ox) * (e.x - ox) + (e.y - oy) * (e.y - oy) < rr * rr) {
          const a = Math.atan2(e.y - player.y, e.x - player.x);
          damageEnemy(e, dps * dt, Math.cos(a) * 1.5, Math.sin(a) * 1.5, true);
          if (Math.random() < 0.15) addParticle(ox, oy, rnd(-30, 30), rnd(-30, 30), 0.25, 3, "#9af2ff");
        }
      }
    }
  }
  if (player.invuln <= 0) {
    const near = queryCircle(player.x, player.y, player.radius + 30);
    for (const e of near) {
      if (e.dead) continue;
      const rr = player.radius + e.r;
      if ((e.x - player.x) * (e.x - player.x) + (e.y - player.y) * (e.y - player.y) < rr * rr) {
        hurtPlayer(e._dmg);
        const a = Math.atan2(player.y - e.y, player.x - e.x);
        player.x += Math.cos(a) * 14;
        player.y += Math.sin(a) * 14;
        break;
      }
    }
  }
}
