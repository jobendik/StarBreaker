// XP, leveling, and the upgrade-offer system.

import { game, PLAYING } from "../core/state";
import { CFG } from "../config/tuning";
import { WDEF, PDEF } from "../config/definitions";
import { shuffle } from "../utils/math";
import { sfx } from "../core/audio";
import { popText } from "./effects";
import { damageEnemy } from "./combat";
import { recompute } from "./lifecycle";
import { openLevelUp } from "../ui/overlays";
import type { Offer } from "../types";

export function xpReq(lv: number): number {
  return Math.floor(CFG.xp.base + (lv - 1) * 6 + Math.pow(lv - 1, 2) * 1.1);
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

export function buildOffers(): Offer[] {
  const { player } = game;
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
    const lv = player.passt[t as keyof typeof player.passt];
    if (lv < PDEF[t].max) pool.push({ kind: "plvl", type: t, lv });
  }
  shuffle(pool);
  const out = pool.slice(0, 3);
  while (out.length < 3) out.push(Math.random() < 0.5 ? { kind: "heal" } : { kind: "bomb" });
  out.forEach((o) => {
    const r = Math.random();
    if (o.kind === "heal" || o.kind === "bomb") {
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
  if (o.kind === "wnew") {
    player.weapons.push({ type: o.type!, level: Math.min(WDEF[o.type!].max, n), t: 0 });
  } else if (o.kind === "wlvl") {
    const w = player.weapons.find((w) => w.type === o.type)!;
    w.level = Math.min(WDEF[o.type!].max, w.level + n);
  } else if (o.kind === "plvl") {
    const d = PDEF[o.type!];
    const key = o.type as keyof typeof player.passt;
    player.passt[key] = Math.min(d.max, player.passt[key] + n);
    if (o.type === "maxhp") player.hp += 25 * n;
    recompute();
  } else if (o.kind === "heal") {
    player.hp = Math.min(player.maxHP, player.hp + player.maxHP * 0.35);
    popText(player.x, player.y - 20, "REPAIRED", "#7cfc8a");
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
