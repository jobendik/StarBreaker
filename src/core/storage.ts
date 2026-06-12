// Persistent meta-progression storage (guarded against unavailable localStorage).

import type { Meta } from "../types";

const STORE = "starbreaker_meta_v2";
const LEGACY = "voiddrift_meta_v1";

function defaults(): Meta {
  return {
    cores: 0,
    best: 0,
    ach: [],
    up: { hp: 0, dmg: 0, spd: 0, mag: 0, rev: 0, crit: 0, dash: 0, core: 0 },
    ship: "vanguard",
    ships: ["vanguard"],
    stats: {
      kills: 0,
      bosses: 0,
      runs: 0,
      time: 0,
      bestTime: 0,
      bestSector: 0,
      evolved: 0,
      dashes: 0,
      titans: 0,
    },
    daily: { date: "", streak: 0, cargo: false, done: [] },
    settings: { music: true, sfx: true, shake: true, dmgText: true, muted: false },
  };
}

export const meta: Meta = defaults();

export function loadMeta(): void {
  try {
    const s = localStorage.getItem(STORE);
    if (s) {
      const o = JSON.parse(s);
      const d = defaults();
      meta.cores = o.cores || 0;
      meta.best = o.best || 0;
      meta.ach = Array.isArray(o.ach) ? o.ach : [];
      meta.up = Object.assign(d.up, o.up || {});
      meta.ship = o.ship || "vanguard";
      meta.ships = Array.isArray(o.ships) && o.ships.length ? o.ships : ["vanguard"];
      meta.stats = Object.assign(d.stats, o.stats || {});
      meta.daily = Object.assign(d.daily, o.daily || {});
      meta.settings = Object.assign(d.settings, o.settings || {});
      return;
    }
    // Migrate progress from the original VOID DRIFT prototype if present.
    const old = localStorage.getItem(LEGACY);
    if (old) {
      const o = JSON.parse(old);
      meta.cores = o.cores || 0;
      meta.best = o.best || 0;
      if (Array.isArray(o.ach)) {
        if (o.ach.indexOf("firstblood") >= 0) meta.ach.push("firstblood");
        if (o.ach.indexOf("sentinel") >= 0) meta.ach.push("boss1");
      }
      if (o.up) {
        meta.up.hp = o.up.hp || 0;
        meta.up.dmg = o.up.dmg || 0;
        meta.up.spd = o.up.spd || 0;
        meta.up.mag = o.up.mag || 0;
        meta.up.rev = o.up.rev || 0;
      }
      saveMeta();
    }
  } catch (e) {
    /* ignore */
  }
}

export function saveMeta(): void {
  try {
    localStorage.setItem(STORE, JSON.stringify(meta));
  } catch (e) {
    /* ignore */
  }
}
