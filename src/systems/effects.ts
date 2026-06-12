// Visual feedback: particles, floating text, announcements, achievements.

import { game } from "../core/state";
import { CFG } from "../config/tuning";
import { ACH } from "../config/definitions";
import { meta, saveMeta } from "../core/storage";

export function addParticle(
  x: number,
  y: number,
  vx: number,
  vy: number,
  life: number,
  size: number,
  color: string,
): void {
  if (game.particles.length >= CFG.caps.particles) game.particles.shift();
  game.particles.push({ x, y, vx, vy, life, max: life, size, color });
}

export function updateParticles(dt: number): void {
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      game.particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.92;
    p.vy *= 0.92;
  }
}

export function popText(x: number, y: number, txt: string | number, color: string): void {
  if (game.texts.length >= CFG.caps.texts) game.texts.shift();
  game.texts.push({ x, y, txt: String(txt), color, life: 0.85, max: 0.85 });
}

export function updateTexts(dt: number): void {
  for (let i = game.texts.length - 1; i >= 0; i--) {
    const t = game.texts[i];
    t.life -= dt;
    t.y -= 34 * dt;
    if (t.life <= 0) game.texts.splice(i, 1);
  }
}

export function announce(text: string, color: string, size?: number): void {
  game.announces.push({ text, color, size: size || 40, life: 1.5, max: 1.5 });
  if (game.announces.length > 5) game.announces.shift();
}

export function updateAnnounces(dt: number): void {
  for (let i = game.announces.length - 1; i >= 0; i--) {
    game.announces[i].life -= dt;
    if (game.announces[i].life <= 0) game.announces.splice(i, 1);
  }
}

export function unlockAch(id: string): void {
  if (meta.ach.indexOf(id) >= 0) return;
  meta.ach.push(id);
  saveMeta();
  announce("\u2605 " + ACH[id], "#ffd34a", 36);
}

export function checkAch(): void {
  const run = game.run;
  if (run.kills >= 1) unlockAch("firstblood");
  if (run.maxStreak >= 10) unlockAch("streak10");
  if (run.maxStreak >= 25) unlockAch("streak25");
  if (run.maxStreak >= 50) unlockAch("streak50");
  if (run.multiKill >= 6) unlockAch("godlike");
  if (run.kills >= 500) unlockAch("slayer");
}
