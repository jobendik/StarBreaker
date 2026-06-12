// Damage application, enemy death, drops, and all collision resolution.

import { game, screenFlash } from "../core/state";
import { CFG, ENEMIES } from "../config/tuning";
import { TAU, rnd } from "../utils/math";
import { sfx, musicSetBoss } from "../core/audio";
import { sdkHappy } from "../core/sdk";
import { meta } from "../core/storage";
import { queryCircle } from "./grid";
import { addParticle, dmgText, announce, unlockAch, checkAch, ring, burst, hitStop } from "./effects";
import { orbsFor, orbitRadius, orbitDps } from "./weapons";
import { onDeath, onVictory } from "./lifecycle";
import type { Enemy, PickupType } from "../types";

export function damageEnemy(e: Enemy, dmg: number, kbx: number, kby: number, quiet?: boolean): void {
  if (e.dead) return;
  let crit = false;
  if (!quiet && game.player.critChance > 0 && Math.random() < game.player.critChance) {
    dmg *= 1.7 + Math.random() * 0.6;
    crit = true;
  }
  e.hp -= dmg;
  e.flash = 0.12;
  if (!e.boss) {
    e.kbx += kbx;
    e.kby += kby;
  }
  if (!quiet) {
    sfx.hit();
    dmgText(e.x, e.y - 6, dmg, crit);
  }
  if (crit) game.shake.mag = Math.max(game.shake.mag, 3);
  if (Math.random() < 0.5)
    addParticle(e.x, e.y, kbx * 6 + rnd(-30, 30), kby * 6 + rnd(-30, 30), 0.25, 3, crit ? "#ffd34a" : e.color);
  if (e.hp <= 0) killEnemy(e);
}

function maybeDropPickup(e: Enemy): void {
  const types: PickupType[] = ["heal", "magnet", "bomb"];
  if (e.elite) {
    const t = types[Math.floor(Math.random() * types.length)];
    game.pickups.push({ type: t, x: e.x, y: e.y, r: 12, value: t === "heal" ? 0.3 : 1, t: 0 });
    game.pickups.push({ type: "coin", x: e.x + rnd(-20, 20), y: e.y + rnd(-20, 20), r: 10, value: 1, t: 0 });
    if (Math.random() < 0.6)
      game.pickups.push({ type: "coin", x: e.x + rnd(-26, 26), y: e.y + rnd(-26, 26), r: 10, value: 1, t: 0 });
    return;
  }
  const r = Math.random();
  if (r < 0.006) {
    const t = types[Math.floor(Math.random() * types.length)];
    game.pickups.push({ type: t, x: e.x, y: e.y, r: 12, value: t === "heal" ? 0.3 : 1, t: 0 });
  } else if (r < 0.016) {
    game.pickups.push({ type: "coin", x: e.x, y: e.y, r: 10, value: 1, t: 0 });
  }
}

function killEnemy(e: Enemy): void {
  if (e.dead) return;
  e.dead = true;
  const run = game.run;
  run.kills++;
  meta.stats.kills++;
  const now = run.time;
  if (now - run.multiKillTime < 1.2) run.multiKill++;
  else run.multiKill = 1;
  run.multiKillTime = now;
  run.streak++;
  if (run.streak > run.maxStreak) run.maxStreak = run.streak;
  run.lastKillTime = now;
  if (run.multiKill >= 2) {
    const names = ["", "", "DOUBLE KILL", "TRIPLE KILL", "MEGA KILL", "ULTRA KILL", "MONSTER KILL", "GODLIKE"];
    announce(
      names[Math.min(run.multiKill, 7)],
      run.multiKill >= 5 ? "#ffd34a" : "#9af2ff",
      40 + Math.min(run.multiKill, 6) * 3,
    );
  }
  if (run.streak % 10 === 0 && run.streak > run.lastMilestone) {
    announce("COMBO x" + run.streak, "#46e0ff", 46);
    run.lastMilestone = run.streak;
    sfx.combo();
    sdkHappy();
  }
  run.score += Math.round(
    (e.xp * 8 + 4) *
      (1 + Math.min(run.streak, 50) * 0.04) *
      (1 + Math.min(run.multiKill - 1, 6) * 0.12) *
      (1 + (run.sector - 1) * 0.1),
  );

  // Death visuals.
  const np = e.boss ? 34 : e.elite ? 20 : 10;
  for (let i = 0; i < np; i++) {
    const a = rnd(TAU);
    const s = rnd(40, e.boss ? 320 : 180);
    addParticle(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, rnd(0.3, 0.7), rnd(3, e.boss ? 10 : 7), e.color);
  }
  ring(e.x, e.y, e.boss ? 200 : e.elite ? 90 : 44, e.color, e.boss ? 5 : 2.5, e.boss ? 0.6 : 0.35);
  game.shake.mag = Math.max(game.shake.mag, e.boss ? 16 : e.elite ? 6 : 2.4);

  if (e.boss) {
    run.bosses++;
    meta.stats.bosses++;
    sfx.bigExplode();
    burst(e.x, e.y, "#ffffff", 16, 260, 5);
    unlockAch("boss1");
    if (meta.stats.bosses >= 10) unlockAch("boss10");
    // Reward shower.
    for (let i = 0; i < 4; i++) dropGem(e.x + rnd(-30, 30), e.y + rnd(-30, 30), 10);
    game.pickups.push({ type: "heal", x: e.x, y: e.y, r: 13, value: 0.35, t: 0 });
    for (let i = 0; i < 5; i++)
      game.pickups.push({ type: "coin", x: e.x + rnd(-50, 50), y: e.y + rnd(-50, 50), r: 10, value: 1, t: 0 });
    if (!game.enemies.some((b) => b.boss && !b.dead && b !== e)) musicSetBoss(false);
    if (e.bossKind === "titan") {
      run.titanAlive = false;
      run.titanDead = true;
      meta.stats.titans++;
      unlockAch("titan");
      hitStop(0.9);
      screenFlash("#b14bff", 0.8);
      announce("TITAN DESTROYED", "#ffd34a", 52);
      sfx.victory();
      onVictory();
    } else {
      hitStop(0.35);
      screenFlash("#ffffff", 0.25);
      announce(e.name + " DOWN", "#ffcf4a", 44);
    }
  } else {
    if (e.elite) {
      run.elites++;
      announce("ELITE DOWN", "#ffcf4a", 36);
      sfx.explode();
    }
    dropGem(e.x, e.y, e.xp);
    maybeDropPickup(e);
  }
  checkAch();

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
        elite: false,
        dead: false,
        spawnT: 0.15,
        phase: 0,
        pt: 0,
        tx: 0,
        ty: 0,
        fireT: 0,
        atkT: 0,
        bossKind: "",
        name: "",
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
    r: xp >= 10 ? 8 : xp >= 4 ? 6 : 4,
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
    const orbs = orbsFor(w);
    const rad = orbitRadius(w);
    const dps = orbitDps(w);
    const orbR = w.evolved ? 17 : 11;
    w._orbs = [];
    for (let k = 0; k < orbs; k++) {
      const oa = (w.ang || 0) + (k * TAU) / orbs;
      const ox = player.x + Math.cos(oa) * rad;
      const oy = player.y + Math.sin(oa) * rad;
      w._orbs.push({ x: ox, y: oy });
      const near = queryCircle(ox, oy, orbR + 26);
      for (const e of near) {
        if (e.dead) continue;
        const rr = e.r + orbR;
        if ((e.x - ox) * (e.x - ox) + (e.y - oy) * (e.y - oy) < rr * rr) {
          const a = Math.atan2(e.y - player.y, e.x - player.x);
          damageEnemy(e, dps * dt, Math.cos(a) * 1.5, Math.sin(a) * 1.5, true);
          if (Math.random() < 0.15) addParticle(ox, oy, rnd(-30, 30), rnd(-30, 30), 0.25, 3, "#9af2ff");
        }
      }
    }
  }
  if (player.invuln <= 0) {
    const near = queryCircle(player.x, player.y, player.radius + 60);
    for (const e of near) {
      if (e.dead || e.spawnT > 0.2) continue;
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
