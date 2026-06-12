// Visual feedback: particles, floating text, rings, announcements, toasts,
// achievements (with core rewards), and hit-stop.

import { game } from "../core/state";
import { CFG } from "../config/tuning";
import { ACH_BY_ID } from "../config/definitions";
import { meta, saveMeta } from "../core/storage";
import { sfx } from "../core/audio";

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

export function burst(x: number, y: number, color: string, n: number, speed: number, size: number): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.3 + Math.random() * 0.7);
    addParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, 0.3 + Math.random() * 0.4, size * (0.5 + Math.random()), color);
  }
}

export function ring(x: number, y: number, maxR: number, color: string, lw = 3, dur = 0.45): void {
  if (game.rings.length >= CFG.caps.rings) game.rings.shift();
  game.rings.push({ x, y, r: 6, maxR, life: dur, max: dur, color, lw });
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
  for (let i = game.rings.length - 1; i >= 0; i--) {
    const r = game.rings[i];
    r.life -= dt;
    if (r.life <= 0) {
      game.rings.splice(i, 1);
      continue;
    }
    const k = 1 - r.life / r.max;
    r.r = 6 + (r.maxR - 6) * (1 - (1 - k) * (1 - k));
  }
  for (let i = game.beams.length - 1; i >= 0; i--) {
    game.beams[i].life -= dt;
    if (game.beams[i].life <= 0) game.beams.splice(i, 1);
  }
  for (let i = game.arcs.length - 1; i >= 0; i--) {
    game.arcs[i].life -= dt;
    if (game.arcs[i].life <= 0) game.arcs.splice(i, 1);
  }
}

export function popText(x: number, y: number, txt: string | number, color: string, size = 14): void {
  if (game.texts.length >= CFG.caps.texts) game.texts.shift();
  game.texts.push({ x, y, txt: String(txt), color, life: 0.85, max: 0.85, size });
}

export function dmgText(x: number, y: number, dmg: number, crit: boolean): void {
  if (!meta.settings.dmgText) return;
  if (crit) popText(x, y - 6, Math.round(dmg) + "!", "#ffd34a", 17);
  else if (game.texts.length < CFG.caps.texts - 8) popText(x + (Math.random() * 14 - 7), y - 4, Math.round(dmg), "#cfe8f5", 11);
}

export function updateTexts(dt: number): void {
  for (let i = game.texts.length - 1; i >= 0; i--) {
    const t = game.texts[i];
    t.life -= dt;
    t.y -= 36 * dt;
    if (t.life <= 0) game.texts.splice(i, 1);
  }
}

export function announce(text: string, color: string, size?: number): void {
  game.announces.push({ text, color, size: size || 40, life: 1.5, max: 1.5 });
  if (game.announces.length > 4) game.announces.shift();
}

export function updateAnnounces(dt: number): void {
  for (let i = game.announces.length - 1; i >= 0; i--) {
    game.announces[i].life -= dt;
    if (game.announces[i].life <= 0) game.announces.splice(i, 1);
  }
}

// Hit-stop: brief slow-motion for impact moments.
export function hitStop(t: number): void {
  game.freeze = Math.max(game.freeze, t);
}

// ── DOM toast notifications (achievements, unlocks, missions) ──────────────

export function toast(title: string, sub: string, icon = "★", gold = false): void {
  const wrap = document.getElementById("toasts");
  if (!wrap) return;
  const el = document.createElement("div");
  el.className = "toast" + (gold ? " gold" : "");
  el.innerHTML =
    '<div class="t-ico">' + icon + '</div><div><div class="t-title">' + title + '</div><div class="t-sub">' + sub + "</div></div>";
  wrap.appendChild(el);
  setTimeout(() => el.classList.add("on"), 16);
  setTimeout(() => {
    el.classList.remove("on");
    setTimeout(() => el.remove(), 400);
  }, 3400);
  if (wrap.children.length > 3) wrap.removeChild(wrap.children[0]);
}

export function unlockAch(id: string): void {
  if (meta.ach.indexOf(id) >= 0) return;
  const d = ACH_BY_ID[id];
  if (!d) return;
  meta.ach.push(id);
  meta.cores += d.reward;
  saveMeta();
  toast(d.name, d.desc + "  ·  +" + d.reward + " ◆", "★", true);
  sfx.unlock();
}

export function checkAch(): void {
  const run = game.run;
  if (run.kills >= 1) unlockAch("firstblood");
  if (run.maxStreak >= 25) unlockAch("streak25");
  if (run.maxStreak >= 50) unlockAch("streak50");
  if (run.multiKill >= 6) unlockAch("godlike");
  if (run.kills >= 500) unlockAch("kills500");
  if (run.kills >= 1500) unlockAch("kills1500");
  if (run.level >= 20) unlockAch("level20");
  if (run.sector >= 3) unlockAch("sector3");
  if (run.sector >= 5) unlockAch("sector5");
}
