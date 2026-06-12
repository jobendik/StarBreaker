// Central mutable game state shared across all systems.

import type {
  Announce,
  Arc,
  Beam,
  Bullet,
  EBullet,
  Enemy,
  FloatingText,
  Gem,
  Glaive,
  Joystick,
  Missile,
  Nova,
  Particle,
  Pickup,
  Player,
  Ring,
  Run,
  Vec2,
} from "../types";

// Game phases.
export const MENU = 0;
export const PLAYING = 1;
export const LEVELUP = 2;
export const PAUSED = 3;
export const DEAD = 4;
export const VICTORY = 5;

function makePlayer(): Player {
  return {
    x: 0,
    y: 0,
    angle: -Math.PI / 2,
    vx: 0,
    vy: 0,
    moving: false,
    radius: 13,
    invuln: 0,
    hurtFlash: 0,
    weapons: [],
    passt: {
      power: 0,
      haste: 0,
      speed: 0,
      maxhp: 0,
      magnet: 0,
      regen: 0,
      greed: 0,
      armor: 0,
      crit: 0,
    },
    hp: 0,
    maxHP: 0,
    dmgMul: 1,
    fireMul: 1,
    speedMul: 1,
    pickupMul: 1,
    regen: 0,
    xpMul: 1,
    armor: 0,
    critChance: 0,
    dashCd: 0,
    dashT: 0,
    dashX: 0,
    dashY: -1,
    dashCdMax: 2.3,
    trail: [],
  };
}

function makeRun(): Run {
  return {
    time: 0,
    kills: 0,
    level: 1,
    xp: 0,
    xpNeed: 0,
    pendingLevel: 0,
    nextBoss: 0,
    bossIndex: 0,
    bannerT: 0,
    banner: "",
    bannerColor: "#ff5c8a",
    revivesLeft: 0,
    adRevivesLeft: 1,
    reviveFlash: 0,
    levelFlash: 0,
    finalized: false,
    streak: 0,
    maxStreak: 0,
    lastKillTime: -9,
    multiKill: 0,
    multiKillTime: -9,
    lastMilestone: 0,
    score: 0,
    sector: 1,
    coins: 0,
    gems: 0,
    elites: 0,
    bosses: 0,
    dashes: 0,
    nextEventT: 0,
    lastEvent: "",
    nextEliteT: 0,
    titanAlive: false,
    titanDead: false,
    overdrive: false,
    rerolls: 2,
    lowHpT: 0,
  };
}

interface GameState {
  state: number;
  enemies: Enemy[];
  bullets: Bullet[];
  missiles: Missile[];
  novas: Nova[];
  glaives: Glaive[];
  beams: Beam[];
  arcs: Arc[];
  rings: Ring[];
  ebullets: EBullet[];
  gems: Gem[];
  pickups: Pickup[];
  particles: Particle[];
  texts: FloatingText[];
  announces: Announce[];
  idc: number;
  cam: Vec2;
  shake: { mag: number };
  freeze: number; // hit-stop / slow-mo timer (real seconds)
  flash: { color: string; t: number; max: number };
  player: Player;
  run: Run;
  keys: Record<string, boolean>;
  joy: Joystick;
  isTouch: boolean;
  spawnTimer: number;
  last: number;
  hintT: number; // onboarding hints countdown (first run only)
}

export const game: GameState = {
  state: MENU,
  enemies: [],
  bullets: [],
  missiles: [],
  novas: [],
  glaives: [],
  beams: [],
  arcs: [],
  rings: [],
  ebullets: [],
  gems: [],
  pickups: [],
  particles: [],
  texts: [],
  announces: [],
  idc: 1,
  cam: { x: 0, y: 0 },
  shake: { mag: 0 },
  freeze: 0,
  flash: { color: "#ffffff", t: 0, max: 1 },
  player: makePlayer(),
  run: makeRun(),
  keys: Object.create(null),
  joy: { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0, max: 62 },
  isTouch: false,
  spawnTimer: 0,
  last: performance.now(),
  hintT: 0,
};

export function screenFlash(color: string, dur: number): void {
  game.flash.color = color;
  game.flash.t = dur;
  game.flash.max = dur;
}
