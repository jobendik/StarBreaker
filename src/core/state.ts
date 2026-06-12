// Central mutable game state shared across all systems.

import type {
  Announce,
  Bullet,
  Enemy,
  FloatingText,
  Gem,
  Joystick,
  Missile,
  Nova,
  Particle,
  Pickup,
  Player,
  Run,
  Vec2,
} from "../types";

// Game phases.
export const MENU = 0;
export const PLAYING = 1;
export const LEVELUP = 2;
export const PAUSED = 3;
export const DEAD = 4;

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
    bannerT: 0,
    banner: "",
    revivesLeft: 0,
    reviveFlash: 0,
    finalized: false,
    streak: 0,
    maxStreak: 0,
    lastKillTime: -9,
    multiKill: 0,
    multiKillTime: -9,
    lastMilestone: 0,
    score: 0,
  };
}

interface GameState {
  state: number;
  enemies: Enemy[];
  bullets: Bullet[];
  missiles: Missile[];
  novas: Nova[];
  gems: Gem[];
  pickups: Pickup[];
  particles: Particle[];
  texts: FloatingText[];
  announces: Announce[];
  idc: number;
  cam: Vec2;
  shake: { mag: number };
  player: Player;
  run: Run;
  keys: Record<string, boolean>;
  joy: Joystick;
  spawnTimer: number;
  last: number;
}

export const game: GameState = {
  state: MENU,
  enemies: [],
  bullets: [],
  missiles: [],
  novas: [],
  gems: [],
  pickups: [],
  particles: [],
  texts: [],
  announces: [],
  idc: 1,
  cam: { x: 0, y: 0 },
  shake: { mag: 0 },
  player: makePlayer(),
  run: makeRun(),
  keys: Object.create(null),
  joy: { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0, max: 62 },
  spawnTimer: 0,
  last: performance.now(),
};
