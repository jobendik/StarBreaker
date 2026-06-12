// Persistent meta-progression storage (guarded against unavailable localStorage).

import type { Meta } from "../types";

const STORE = "voiddrift_meta_v1";

export const meta: Meta = {
  cores: 0,
  best: 0,
  ach: [],
  up: { hp: 0, dmg: 0, spd: 0, mag: 0, rev: 0 },
};

export function loadMeta(): void {
  try {
    const s = localStorage.getItem(STORE);
    if (s) {
      const o = JSON.parse(s);
      meta.cores = o.cores || 0;
      meta.best = o.best || 0;
      meta.ach = o.ach || [];
      meta.up = Object.assign({ hp: 0, dmg: 0, spd: 0, mag: 0, rev: 0 }, o.up || {});
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
