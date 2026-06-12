// Core gameplay tuning values — "the real 90%".

export const CFG = {
  player: {
    maxHP: 100,
    speed: 244,
    radius: 13,
    invuln: 0.6,
    pickup: 84,
    dashSpeed: 3.5,
    dashDur: 0.17,
    dashCd: 2.3,
    dashInv: 0.34,
  },
  xp: { base: 4 },
  spawn: {
    baseInterval: 1.0,
    minInterval: 0.16,
    ramp: 0.011,
    maxEnemies: 190,
    hpRamp: 1 / 40,
    dmgRamp: 1 / 210,
  },
  boss: { every: 60, hpRamp: 1 / 75, titanAt: 600 },
  sector: { every: 120 },
  events: { first: 38, every: 44 },
  elites: { first: 95, every: 38 },
  caps: {
    bullets: 260,
    missiles: 70,
    particles: 900,
    gems: 420,
    texts: 70,
    ebullets: 140,
    rings: 60,
    beams: 24,
    arcs: 30,
    glaives: 12,
  },
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
  drone: { hp: 14, speed: 94, r: 13, dmg: 8, xp: 1, color: "#ff6b5b", sides: 3 },
  swarmer: { hp: 7, speed: 172, r: 9, dmg: 5, xp: 1, color: "#ff5c8a", sides: 4 },
  brute: { hp: 64, speed: 62, r: 22, dmg: 16, xp: 5, color: "#ff3b3b", sides: 6 },
  splitter: { hp: 26, speed: 104, r: 16, dmg: 7, xp: 2, color: "#ffa24a", sides: 4 },
  shard: { hp: 5, speed: 190, r: 7, dmg: 5, xp: 1, color: "#ffb24a", sides: 3 },
  weaver: { hp: 18, speed: 150, r: 12, dmg: 9, xp: 2, color: "#ff8ad8", sides: 4 },
  dasher: { hp: 34, speed: 120, r: 14, dmg: 18, xp: 3, color: "#ffe14a", sides: 5 },
  spitter: { hp: 30, speed: 86, r: 15, dmg: 10, xp: 3, color: "#c84bff", sides: 6 },
};

export interface BossDef {
  name: string;
  hp: number;
  speed: number;
  r: number;
  dmg: number;
  xp: number;
  color: string;
  sides: number;
}

export const BOSSES: Record<string, BossDef> = {
  sentinel: { name: "SENTINEL", hp: 680, speed: 52, r: 40, dmg: 26, xp: 40, color: "#ff2d6f", sides: 8 },
  queen: { name: "HIVE QUEEN", hp: 950, speed: 40, r: 46, dmg: 24, xp: 46, color: "#c84bff", sides: 6 },
  ravager: { name: "RAVAGER", hp: 860, speed: 62, r: 36, dmg: 30, xp: 46, color: "#ff7b2d", sides: 5 },
  titan: { name: "VOID TITAN", hp: 3800, speed: 36, r: 64, dmg: 34, xp: 200, color: "#b14bff", sides: 10 },
};

export const BOSS_CYCLE = ["sentinel", "queen", "ravager"];
