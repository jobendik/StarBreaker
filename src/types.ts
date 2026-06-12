// Shared type definitions for STARBREAKER.

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
  elite: boolean;
  dead: boolean;
  spawnT: number; // spawn-in animation timer (counts down)
  // Behaviour state (dasher charge phases, spitter fire timer, boss attacks).
  phase: number;
  pt: number;
  tx: number;
  ty: number;
  fireT: number;
  atkT: number;
  bossKind: string;
  name: string;
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
  trail: boolean;
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
  pull: boolean;
  dead?: boolean;
}

export interface Glaive {
  x: number;
  y: number;
  ang: number;
  spin: number;
  dist: number;
  maxDist: number;
  speed: number;
  dmg: number;
  r: number;
  state: 0 | 1; // 0 = outbound, 1 = returning
  hit: Set<number>;
  evolved: boolean;
  dead: boolean;
}

export interface Snare {
  x: number;
  y: number;
  r: number;
  dmg: number;
  life: number;
  max: number;
  color: string;
  dead: boolean;
}

export interface Beam {
  x: number;
  y: number;
  ang: number;
  len: number;
  w: number;
  life: number;
  max: number;
  color: string;
}

export interface Arc {
  pts: Vec2[];
  life: number;
  max: number;
  color: string;
}

export interface Ring {
  x: number;
  y: number;
  r: number;
  maxR: number;
  life: number;
  max: number;
  color: string;
  lw: number;
}

export interface EBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  dmg: number;
  life: number;
  color: string;
  dead: boolean;
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

export type PickupType = "heal" | "magnet" | "bomb" | "coin";

export interface Pickup {
  type: PickupType;
  x: number;
  y: number;
  r: number;
  value: number;
  t: number;
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
  size: number;
}

export interface Announce {
  text: string;
  color: string;
  size: number;
  life: number;
  max: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  ang: number;
  life: number;
  max: number;
  dash: boolean;
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
  evolved: boolean;
  ang?: number;
  _orbs?: Vec2[];
  _units?: WeaponUnit[];
}

export interface WeaponUnit {
  x: number;
  y: number;
  ang: number;
  t: number;
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
  // Dash state.
  dashCd: number;
  dashT: number;
  dashX: number;
  dashY: number;
  dashCdMax: number;
  trail: TrailPoint[];
}

export interface Run {
  time: number;
  kills: number;
  level: number;
  xp: number;
  xpNeed: number;
  pendingLevel: number;
  nextBoss: number;
  bossIndex: number;
  bannerT: number;
  banner: string;
  bannerColor: string;
  revivesLeft: number;
  adRevivesLeft: number;
  reviveFlash: number;
  levelFlash: number;
  finalized: boolean;
  streak: number;
  maxStreak: number;
  lastKillTime: number;
  multiKill: number;
  multiKillTime: number;
  lastMilestone: number;
  score: number;
  // New progression / director state.
  sector: number;
  coins: number;
  gems: number;
  elites: number;
  bosses: number;
  dashes: number;
  nextEventT: number;
  lastEvent: string;
  nextEliteT: number;
  titanAlive: boolean;
  titanDead: boolean;
  overdrive: boolean;
  rerolls: number;
  lowHpT: number;
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
  crit: number;
  dash: number;
  core: number;
  xp: number;
}

export interface MetaStats {
  kills: number;
  bosses: number;
  runs: number;
  time: number;
  bestTime: number;
  bestSector: number;
  evolved: number;
  dashes: number;
  titans: number;
}

export interface MetaDaily {
  date: string;
  streak: number;
  cargo: boolean; // true = today's cargo already claimed
  done: string[]; // mission ids completed today
}

export interface MetaSettings {
  music: boolean;
  sfx: boolean;
  shake: boolean;
  dmgText: boolean;
  muted: boolean;
}

export interface Meta {
  cores: number;
  best: number;
  ach: string[];
  up: MetaUpgrades;
  ship: string;
  ships: string[];
  weaponPool: string[];
  skin: string;
  skins: string[];
  stats: MetaStats;
  daily: MetaDaily;
  settings: MetaSettings;
}

export interface Offer {
  kind: "wnew" | "wlvl" | "plvl" | "evo" | "heal" | "bomb" | "greed";
  type?: string;
  lv?: number;
  rarity?: "common" | "epic" | "legendary";
  lvls?: number;
}

export interface CoreBreakdown {
  scoreCores: number;
  coins: number;
  missions: { name: string; reward: number }[];
  total: number;
  newBest: boolean;
}
