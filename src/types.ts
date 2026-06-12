// Shared type definitions for the VOID DRIFT game.

export interface Vec2 {
  x: number;
  y: number;
}

export interface Enemy {
  id: number;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  kbx: number;
  kby: number;
  r: number;
  hp: number;
  maxhp: number;
  speed: number;
  dmg: number;
  _dmg: number;
  xp: number;
  color: string;
  sides: number;
  spin: number;
  spv: number;
  flash: number;
  boss: boolean;
  dead: boolean;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  dmg: number;
  r: number;
  pierce: number;
  color: string;
  life: number;
  hits: number;
  hit: Set<number> | null;
  dead: boolean;
}

export interface Missile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  dmg: number;
  aoe: number;
  life: number;
  spd: number;
  dead: boolean;
}

export interface Nova {
  x: number;
  y: number;
  r: number;
  maxR: number;
  dmg: number;
  hit: Set<number>;
  dur: number;
  t: number;
  dead?: boolean;
}

export interface Gem {
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  r: number;
  mag: boolean;
}

export interface Pickup {
  type: string;
  x: number;
  y: number;
  r: number;
  value: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

export interface FloatingText {
  x: number;
  y: number;
  txt: string;
  color: string;
  life: number;
  max: number;
}

export interface Announce {
  text: string;
  color: string;
  size: number;
  life: number;
  max: number;
}

export type PassiveKey =
  | "power"
  | "haste"
  | "speed"
  | "maxhp"
  | "magnet"
  | "regen"
  | "greed"
  | "armor"
  | "crit";

export type Passives = Record<PassiveKey, number>;

export interface Weapon {
  type: string;
  level: number;
  t: number;
  ang?: number;
  _orbs?: Vec2[];
}

export interface Player {
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  moving: boolean;
  radius: number;
  invuln: number;
  hurtFlash: number;
  weapons: Weapon[];
  passt: Passives;
  hp: number;
  maxHP: number;
  dmgMul: number;
  fireMul: number;
  speedMul: number;
  pickupMul: number;
  regen: number;
  xpMul: number;
  armor: number;
  critChance: number;
}

export interface Run {
  time: number;
  kills: number;
  level: number;
  xp: number;
  xpNeed: number;
  pendingLevel: number;
  nextBoss: number;
  bannerT: number;
  banner: string;
  revivesLeft: number;
  reviveFlash: number;
  finalized: boolean;
  streak: number;
  maxStreak: number;
  lastKillTime: number;
  multiKill: number;
  multiKillTime: number;
  lastMilestone: number;
  score: number;
}

export interface Joystick {
  active: boolean;
  id: number | null;
  ox: number;
  oy: number;
  dx: number;
  dy: number;
  max: number;
}

export interface MetaUpgrades {
  hp: number;
  dmg: number;
  spd: number;
  mag: number;
  rev: number;
}

export interface Meta {
  cores: number;
  best: number;
  ach: string[];
  up: MetaUpgrades;
}

export interface Offer {
  kind: "wnew" | "wlvl" | "plvl" | "heal" | "bomb";
  type?: string;
  lv?: number;
  rarity?: "common" | "epic" | "legendary";
  lvls?: number;
}
