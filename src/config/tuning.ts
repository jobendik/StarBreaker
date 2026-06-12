// Core gameplay tuning values — "the real 90%".

export const CFG = {
  player: { maxHP: 100, speed: 236, radius: 13, invuln: 0.55, pickup: 78 },
  xp: { base: 8 },
  spawn: {
    baseInterval: 1.05,
    minInterval: 0.16,
    ramp: 0.013,
    maxEnemies: 170,
    hpRamp: 1 / 42,
    dmgRamp: 1 / 200,
  },
  boss: { every: 60 },
  caps: { bullets: 240, missiles: 70, particles: 640, gems: 400, texts: 48 },
} as const;

export interface EnemyDef {
  hp: number;
  speed: number;
  r: number;
  dmg: number;
  xp: number;
  color: string;
  sides: number;
}

export const ENEMIES: Record<string, EnemyDef> = {
  drone: { hp: 14, speed: 92, r: 13, dmg: 8, xp: 1, color: "#ff6b5b", sides: 3 },
  swarmer: { hp: 7, speed: 170, r: 9, dmg: 5, xp: 1, color: "#ff5c8a", sides: 4 },
  brute: { hp: 62, speed: 64, r: 22, dmg: 16, xp: 5, color: "#ff3b3b", sides: 6 },
  splitter: { hp: 26, speed: 104, r: 16, dmg: 7, xp: 2, color: "#ffa24a", sides: 4 },
  shard: { hp: 5, speed: 188, r: 7, dmg: 5, xp: 1, color: "#ffb24a", sides: 3 },
  boss: { hp: 620, speed: 50, r: 40, dmg: 30, xp: 30, color: "#ff2d6f", sides: 8 },
};
