// XP, leveling, and the upgrade-offer system (incl. weapon evolutions).

import { game, PLAYING, screenFlash } from "../core/state";
import { CFG } from "../config/tuning";
import { WDEF, PDEF } from "../config/definitions";
import { shuffle } from "../utils/math";
import { sfx } from "../core/audio";
import { meta, saveMeta } from "../core/storage";
import { popText, announce, hitStop, unlockAch, burst } from "./effects";
import { damageEnemy } from "./combat";
import { recompute } from "./lifecycle";
import { openLevelUp } from "../ui/overlays";
import type { Offer, PassiveKey } from "../types";

export function xpReq(lv: number): number {
  return Math.floor(CFG.xp.base + (lv - 1) * 7 + Math.pow(lv - 1, 2) * 1.05);
}

export function addXP(v: number): void {
  const run = game.run;
  run.xp += v * game.player.xpMul;
  while (run.xp >= run.xpNeed) {
    run.xp -= run.xpNeed;
    run.level++;
    run.xpNeed = xpReq(run.level);
    run.pendingLevel++;
  }
  if (run.pendingLevel > 0 && game.state === PLAYING) openLevelUp();
}

// A weapon can evolve once it is max level and its paired passive is at 3+.
export function evolveCandidates(): string[] {
  const { player } = game;
  const out: string[] = [];
  for (const w of player.weapons) {
    const d = WDEF[w.type];
    if (!w.evolved && w.level >= d.max && player.passt[d.evoPassive] >= 3) out.push(w.type);
  }
  return out;
}

export function buildOffers(): Offer[] {
  const { player } = game;
  const out: Offer[] = [];

  // Evolution offers take priority — max one per screen.
  const evos = evolveCandidates();
  if (evos.length) out.push({ kind: "evo", type: evos[0], rarity: "legendary", lvls: 1 });

  const pool: Offer[] = [];
  for (const w of player.weapons) {
    const d = WDEF[w.type];
    if (w.level < d.max) pool.push({ kind: "wlvl", type: w.type });
  }
  const owned = new Set(player.weapons.map((w) => w.type));
  if (player.weapons.length < 5) {
    for (const t in WDEF) {
      if (!owned.has(t)) pool.push({ kind: "wnew", type: t });
    }
  }
  for (const t in PDEF) {
    const lv = player.passt[t as PassiveKey];
    if (lv < PDEF[t].max) pool.push({ kind: "plvl", type: t, lv });
  }
  shuffle(pool);
  while (out.length < 3 && pool.length) out.push(pool.shift()!);
  while (out.length < 3) {
    const r = Math.random();
    out.push(r < 0.4 ? { kind: "heal" } : r < 0.8 ? { kind: "bomb" } : { kind: "greed" });
  }
  out.forEach((o) => {
    if (o.rarity) return;
    const r = Math.random();
    if (o.kind === "heal" || o.kind === "bomb" || o.kind === "greed") {
      o.rarity = "common";
      o.lvls = 1;
    } else if (r < 0.06) {
      o.rarity = "legendary";
      o.lvls = 3;
    } else if (r < 0.3) {
      o.rarity = "epic";
      o.lvls = 2;
    } else {
      o.rarity = "common";
      o.lvls = 1;
    }
  });
  return out;
}

export function applyOffer(o: Offer): void {
  const { player } = game;
  const n = o.lvls || 1;
  if (o.kind === "evo") {
    const w = player.weapons.find((w) => w.type === o.type)!;
    const d = WDEF[o.type!];
    w.evolved = true;
    meta.stats.evolved++;
    saveMeta();
    unlockAch("evolve1");
    announce(d.evoName, "#ffd34a", 50);
    burst(player.x, player.y, d.color, 30, 320, 6);
    screenFlash("#ffd34a", 0.4);
    hitStop(0.5);
    sfx.evolve();
  } else if (o.kind === "wnew") {
    player.weapons.push({ type: o.type!, level: Math.min(WDEF[o.type!].max, n), t: 0, evolved: false });
  } else if (o.kind === "wlvl") {
    const w = player.weapons.find((w) => w.type === o.type)!;
    w.level = Math.min(WDEF[o.type!].max, w.level + n);
  } else if (o.kind === "plvl") {
    const d = PDEF[o.type!];
    const key = o.type as PassiveKey;
    player.passt[key] = Math.min(d.max, player.passt[key] + n);
    if (o.type === "maxhp") player.hp += 25 * n;
    recompute();
  } else if (o.kind === "heal") {
    player.hp = Math.min(player.maxHP, player.hp + player.maxHP * 0.35);
    popText(player.x, player.y - 20, "REPAIRED", "#7cfc8a", 15);
  } else if (o.kind === "greed") {
    game.run.coins += 15;
    popText(player.x, player.y - 20, "+15 ◆", "#ffcf4a", 16);
    sfx.coin();
  } else {
    for (const e of game.enemies) {
      if (!e.dead && !e.boss) {
        const a = Math.atan2(e.y - player.y, e.x - player.x);
        damageEnemy(e, 9999, Math.cos(a) * 10, Math.sin(a) * 10, true);
      }
    }
    game.shake.mag = Math.max(game.shake.mag, 12);
    sfx.explode();
  }
}
