// Headless simulation smoke test: runs an 11-minute game at 60 fps,
// auto-picking the first level-up offer, reviving on death, and entering
// overdrive on victory. Fails loudly on NaN state or exceptions.

import "./smoke-stubs.mjs";
import { game, PLAYING, LEVELUP, DEAD, VICTORY } from "../src/core/state";
import { loadMeta, meta } from "../src/core/storage";
import { startRun, doRevive, continueOverdrive, finalizeRun } from "../src/systems/lifecycle";
import { buildOffers, applyOffer } from "../src/systems/progression";
import { tick } from "../src/game";

loadMeta();
let deaths = 0;
let victories = 0;
let levelups = 0;
let firstDeathAt = -1;
startRun();
const dt = 1 / 60;
const SIM_SECONDS = 11 * 60;

for (let t = 0; t < SIM_SECONDS * 60; t++) {
  if (game.state === LEVELUP) {
    const o = buildOffers()[0];
    applyOffer(o);
    levelups++;
    game.run.pendingLevel--;
    if (game.run.pendingLevel <= 0) game.state = PLAYING;
    continue;
  }
  if (game.state === DEAD) {
    deaths++;
    if (firstDeathAt < 0) firstDeathAt = game.run.time;
    doRevive();
    continue;
  }
  if (game.state === VICTORY) {
    victories++;
    continueOverdrive();
    continue;
  }
  tick(dt);
  if (!isFinite(game.player.x) || !isFinite(game.player.y) || !isFinite(game.player.hp))
    throw new Error("Non-finite player state at t=" + game.run.time.toFixed(1));
  if (!isFinite(game.run.score)) throw new Error("Non-finite score at t=" + game.run.time.toFixed(1));
}

finalizeRun();

const summary = {
  simTime: game.run.time.toFixed(1),
  kills: game.run.kills,
  level: game.run.level,
  levelups,
  sector: game.run.sector,
  bossesKilled: game.run.bosses,
  elitesKilled: game.run.elites,
  coins: game.run.coins,
  score: game.run.score,
  deaths,
  firstDeathAt: firstDeathAt.toFixed(1),
  victories,
  titanDead: game.run.titanDead,
  liveEnemies: game.enemies.length,
  weapons: game.player.weapons.map((w) => w.type + ":" + w.level + (w.evolved ? "*EVO*" : "")),
  metaCores: meta.cores,
  achievements: meta.ach,
};
console.log(JSON.stringify(summary, null, 1));

const fail = (msg: string): never => {
  throw new Error("SMOKE FAIL: " + msg);
};
if (game.run.kills < 100) fail("too few kills: " + game.run.kills);
if (game.run.level < 8) fail("too little leveling: " + game.run.level);
if (game.run.bosses < 1) fail("no boss was killed");
if (game.run.sector < 5) fail("sector did not advance: " + game.run.sector);
console.log("SMOKE OK");
