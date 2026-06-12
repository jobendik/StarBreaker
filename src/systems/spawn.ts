// The "director": enemy waves, sector escalation, wave events, elites,
// rotating bosses, and the Void Titan finale.

import { game, screenFlash } from "../core/state";
import { view } from "../core/canvas";
import { CFG, ENEMIES, BOSSES, BOSS_CYCLE } from "../config/tuning";
import { TAU, rnd, pick, clamp } from "../utils/math";
import { sfx, musicSetIntensity, musicSetBoss } from "../core/audio";
import { announce } from "./effects";
import { dropGem } from "./combat";

export interface SpawnOpts {
  x?: number;
  y?: number;
  elite?: boolean;
  boss?: string; // boss kind
}

export function spawnEnemy(type: string, opts: SpawnOpts = {}): void {
  const isBoss = !!opts.boss;
  const bd = isBoss ? BOSSES[opts.boss!] : null;
  const d = bd || ENEMIES[type];
  if (!d) return;
  const { player } = game;
  let x = opts.x;
  let y = opts.y;
  if (x === undefined || y === undefined) {
    const ang = rnd(TAU);
    const dist = Math.max(view.W, view.H) / 2 + rnd(60, 140);
    x = player.x + Math.cos(ang) * dist;
    y = player.y + Math.sin(ang) * dist;
  }
  const elite = !!opts.elite;
  const hpScale = isBoss
    ? (1 + game.run.time * CFG.boss.hpRamp) * (game.run.overdrive ? 1.5 : 1)
    : 1 + game.run.time * CFG.spawn.hpRamp;
  const eliteHp = elite ? 7 : 1;
  const eliteR = elite ? 1.45 : 1;
  const eliteDmg = elite ? 1.8 : 1;
  game.enemies.push({
    id: game.idc++,
    type: isBoss ? opts.boss! : type,
    x,
    y,
    vx: 0,
    vy: 0,
    kbx: 0,
    kby: 0,
    r: d.r * eliteR,
    hp: d.hp * hpScale * eliteHp,
    maxhp: d.hp * hpScale * eliteHp,
    speed: d.speed * (0.9 + Math.random() * 0.2) * (elite ? 0.9 : 1),
    dmg: d.dmg * eliteDmg,
    _dmg: d.dmg * eliteDmg,
    xp: d.xp * (elite ? 4 : 1),
    color: elite ? "#ffcf4a" : d.color,
    sides: d.sides,
    spin: rnd(TAU),
    spv: rnd(-1.4, 1.4),
    flash: 0,
    boss: isBoss,
    elite,
    dead: false,
    spawnT: 0.4,
    phase: 0,
    pt: 0,
    tx: 0,
    ty: 0,
    fireT: rnd(1, 2.5),
    atkT: isBoss ? 2.2 : 0,
    bossKind: isBoss ? opts.boss! : "",
    name: bd ? bd.name : "",
  });
}

function weightedType(): string {
  const t = game.run.time;
  const bag = ["drone", "drone", "drone"];
  if (t > 10) bag.push("swarmer", "swarmer");
  if (t > 25) bag.push("brute");
  if (t > 40) bag.push("splitter", "swarmer");
  if (t > 55) bag.push("weaver");
  if (t > 70) bag.push("brute", "splitter");
  if (t > 90) bag.push("dasher", "weaver");
  if (t > 120) bag.push("spitter");
  if (t > 180) bag.push("dasher", "spitter", "brute");
  if (t > 300) bag.push("weaver", "dasher", "brute");
  return pick(bag);
}

function setBanner(text: string, color: string, dur = 2.6): void {
  game.run.banner = text;
  game.run.bannerColor = color;
  game.run.bannerT = dur;
}

// ── Wave events: scripted dopamine spikes ───────────────────────────────────

function eventSwarmRing(): void {
  const { player } = game;
  const n = 22 + game.run.sector * 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    spawnEnemy("swarmer", { x: player.x + Math.cos(a) * 560, y: player.y + Math.sin(a) * 560 });
  }
  setBanner("⚠ SWARM RING — BREAK OUT", "#ff5c8a");
  sfx.boss();
}

function eventGoldRush(): void {
  const { player } = game;
  for (let i = 0; i < 14; i++) {
    const a = rnd(TAU);
    const d = rnd(120, 420);
    dropGem(player.x + Math.cos(a) * d, player.y + Math.sin(a) * d, pick([2, 3, 5]));
  }
  for (let i = 0; i < 2; i++) {
    const a = rnd(TAU);
    const d = rnd(150, 380);
    game.pickups.push({ type: "coin", x: player.x + Math.cos(a) * d, y: player.y + Math.sin(a) * d, r: 10, value: 1, t: 0 });
  }
  setBanner("◆ SALVAGE FIELD — COLLECT", "#ffcf4a");
  sfx.coin();
}

function eventElitePack(): void {
  const n = 1 + Math.min(game.run.sector, 3);
  for (let i = 0; i < n; i++) spawnEnemy(pick(["brute", "dasher", "splitter"]), { elite: true });
  setBanner("⚠ ELITE PACK DETECTED", "#ffcf4a");
  sfx.boss();
}

function eventBruteWall(): void {
  const { player } = game;
  const a = rnd(TAU);
  const n = 8 + game.run.sector;
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * 70;
    const px = -Math.sin(a);
    const py = Math.cos(a);
    spawnEnemy("brute", {
      x: player.x + Math.cos(a) * 620 + px * off,
      y: player.y + Math.sin(a) * 620 + py * off,
    });
  }
  setBanner("⚠ BRUTE WALL INBOUND", "#ff3b3b");
  sfx.boss();
}

function runEvent(): void {
  const run = game.run;
  const pool = ["ring", "gold"];
  if (run.sector >= 2) pool.push("elites", "wall");
  let ev = pick(pool);
  if (ev === run.lastEvent && pool.length > 1) ev = pick(pool.filter((p) => p !== ev));
  run.lastEvent = ev;
  if (ev === "ring") eventSwarmRing();
  else if (ev === "gold") eventGoldRush();
  else if (ev === "elites") eventElitePack();
  else eventBruteWall();
}

// ── Main director tick ──────────────────────────────────────────────────────

export function spawnEnemies(dt: number): void {
  const run = game.run;

  // Sector escalation every 2 minutes.
  const sector = 1 + Math.floor(run.time / CFG.sector.every);
  if (sector > run.sector) {
    run.sector = sector;
    setBanner("SECTOR " + sector + " — THREAT RISING", "#9af2ff", 3);
    announce("SECTOR " + sector, "#9af2ff", 48);
    screenFlash("#46e0ff", 0.35);
    sfx.levelup();
  }

  // Music intensity follows the action.
  musicSetIntensity(clamp(0.25 + run.sector * 0.09 + (run.titanAlive ? 0.3 : 0) + game.enemies.length / 400, 0, 1));

  // Regular waves (throttled while the Titan holds the field).
  game.spawnTimer -= dt;
  const titanMul = run.titanAlive ? 2.6 : 1;
  const interval =
    clamp(
      CFG.spawn.baseInterval - run.time * CFG.spawn.ramp,
      CFG.spawn.minInterval,
      CFG.spawn.baseInterval,
    ) * titanMul * (run.overdrive ? 0.8 : 1);
  if (game.spawnTimer <= 0 && game.enemies.length < CFG.spawn.maxEnemies) {
    game.spawnTimer = interval;
    const group = 1 + Math.floor(run.time / 20) + (run.overdrive ? 2 : 0);
    for (let i = 0; i < group && game.enemies.length < CFG.spawn.maxEnemies; i++) spawnEnemy(weightedType());
  }

  // Elites.
  if (run.time >= run.nextEliteT && !run.titanAlive) {
    run.nextEliteT = run.time + CFG.elites.every;
    if (run.time >= CFG.elites.first) {
      spawnEnemy(pick(["brute", "dasher", "weaver", "splitter"]), { elite: true });
    }
  }

  // Wave events.
  if (run.time >= run.nextEventT && !run.titanAlive) {
    run.nextEventT = run.time + CFG.events.every;
    if (run.time >= CFG.events.first) runEvent();
  }

  // Bosses & the Titan.
  if (run.time >= run.nextBoss && !run.titanAlive) {
    run.nextBoss += CFG.boss.every;
    if (run.time >= CFG.boss.titanAt && !run.titanDead) {
      spawnEnemy("titan", { boss: "titan" });
      run.titanAlive = true;
      setBanner("☠ THE VOID TITAN AWAKENS", "#b14bff", 4);
      announce("VOID TITAN", "#b14bff", 52);
      screenFlash("#b14bff", 0.5);
      musicSetBoss(true);
      sfx.boss();
    } else {
      const kind = BOSS_CYCLE[run.bossIndex % BOSS_CYCLE.length];
      run.bossIndex++;
      spawnEnemy(kind, { boss: kind });
      setBanner("⚠ " + BOSSES[kind].name + " INCOMING", "#ff5c8a");
      musicSetBoss(true);
      sfx.boss();
    }
  }
}
