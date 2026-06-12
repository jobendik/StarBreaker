// Heads-up display: XP/level, timer, score, combo, HP, dash, weapon chips,
// boss health bar, announcements, banners, joystick, and onboarding hints.

import { ctx, view } from "../core/canvas";
import { game } from "../core/state";
import { AudioM } from "../core/audio";
import { WDEF } from "../config/definitions";
import { clamp, hexA, fmtTime } from "../utils/math";
import { roundRect } from "./draw";
import type { Weapon } from "../types";

export interface HudButton {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const btnPause: HudButton = { x: 0, y: 0, w: 42, h: 42 };
export const btnMute: HudButton = { x: 0, y: 0, w: 42, h: 42 };
export const btnDash: HudButton = { x: 0, y: 0, w: 76, h: 76 };

export function drawAnnounces(): void {
  const { announces } = game;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < announces.length; i++) {
    const a = announces[i];
    const k = a.life / a.max;
    const al = clamp(k < 0.3 ? k / 0.3 : 1, 0, 1);
    const sc = 1 + (1 - k) * 0.22;
    const y = view.H * 0.3 + i * 42 - (1 - k) * 16;
    ctx.save();
    ctx.translate(view.W / 2, y);
    ctx.scale(sc, sc);
    ctx.font = "700 " + a.size + "px Chakra Petch, monospace";
    ctx.lineWidth = 4;
    ctx.strokeStyle = hexA("#04060d", al * 0.8);
    ctx.strokeText(a.text, 0, 0);
    ctx.fillStyle = hexA(a.color, al);
    ctx.fillText(a.text, 0, 0);
    ctx.restore();
  }
}

export function drawBanner(): void {
  const run = game.run;
  const a = clamp(run.bannerT, 0, 1);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 20px Chakra Petch, monospace";
  ctx.fillStyle = hexA(run.bannerColor || "#ff5c8a", Math.min(1, a) * 0.95);
  ctx.fillText(run.banner, view.W / 2, view.safeTop + 124);
}

export function drawJoystick(): void {
  const { joy } = game;
  const ox = joy.ox;
  const oy = joy.oy;
  ctx.strokeStyle = "rgba(70,224,255,.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ox, oy, joy.max, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(70,224,255,.22)";
  ctx.beginPath();
  ctx.arc(ox + joy.dx, oy + joy.dy, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(154,242,255,.7)";
  ctx.beginPath();
  ctx.arc(ox + joy.dx, oy + joy.dy, 22, 0, Math.PI * 2);
  ctx.stroke();
}

function iconButton(b: HudButton): void {
  roundRect(b.x, b.y, b.w, b.h, 9);
  ctx.fillStyle = "rgba(9,16,30,.7)";
  ctx.fill();
  ctx.strokeStyle = "rgba(70,224,255,.45)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// Tiny canvas glyphs for weapon inventory chips.
function weaponGlyph(type: string, x: number, y: number, col: string): void {
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  if (type === "pulse") {
    ctx.moveTo(x - 5, y - 5);
    ctx.lineTo(x + 1, y);
    ctx.lineTo(x - 5, y + 5);
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x + 6, y);
    ctx.lineTo(x, y + 5);
  } else if (type === "spread") {
    ctx.moveTo(x, y + 6);
    ctx.lineTo(x - 5, y - 6);
    ctx.moveTo(x, y + 6);
    ctx.lineTo(x + 5, y - 6);
    ctx.moveTo(x, y + 6);
    ctx.lineTo(x, y - 4);
  } else if (type === "orbital") {
    ctx.arc(x, y, 6, 0, TAU_);
    ctx.moveTo(x + 2, y);
    ctx.arc(x, y, 2, 0, TAU_);
  } else if (type === "missile") {
    ctx.moveTo(x - 5, y + 5);
    ctx.lineTo(x + 5, y - 5);
    ctx.moveTo(x + 1, y - 6);
    ctx.lineTo(x + 6, y - 1);
    ctx.moveTo(x - 6, y + 3);
    ctx.lineTo(x - 3, y + 6);
  } else if (type === "nova") {
    ctx.arc(x, y, 2.4, 0, TAU_);
    ctx.moveTo(x + 6, y);
    ctx.arc(x, y, 6, 0, TAU_);
  } else if (type === "railgun") {
    ctx.moveTo(x - 7, y);
    ctx.lineTo(x + 7, y);
    ctx.moveTo(x - 5, y - 4);
    ctx.lineTo(x + 4, y - 4);
    ctx.moveTo(x - 5, y + 4);
    ctx.lineTo(x + 4, y + 4);
  } else if (type === "tesla") {
    ctx.moveTo(x + 2, y - 7);
    ctx.lineTo(x - 3, y + 1);
    ctx.lineTo(x + 1, y + 1);
    ctx.lineTo(x - 2, y + 7);
    ctx.lineTo(x + 4, y - 1);
    ctx.lineTo(x, y - 1);
    ctx.closePath();
  } else if (type === "glaive") {
    ctx.arc(x, y, 6, 0.4, Math.PI * 1.5);
    ctx.moveTo(x + 6, y - 1);
    ctx.lineTo(x + 3, y - 5);
  }
  ctx.stroke();
}
const TAU_ = Math.PI * 2;

function drawWeaponChips(): void {
  const { player } = game;
  const y0 = view.H - 34 - 26;
  let x = 14;
  for (const w of player.weapons as Weapon[]) {
    const d = WDEF[w.type];
    const col = w.evolved ? "#ffd34a" : d.color;
    roundRect(x, y0 - 28, 30, 30, 7);
    ctx.fillStyle = "rgba(9,16,30,.66)";
    ctx.fill();
    ctx.lineWidth = w.evolved ? 1.8 : 1.2;
    ctx.strokeStyle = w.evolved ? "#ffd34a" : hexA(d.color, 0.55);
    ctx.stroke();
    weaponGlyph(w.type, x + 15, y0 - 13, col);
    // Level pips under the chip.
    const pw = 30 / d.max;
    for (let i = 0; i < w.level; i++) {
      ctx.fillStyle = w.evolved ? "#ffd34a" : hexA(d.color, 0.9);
      ctx.fillRect(x + i * pw + 0.5, y0 + 4, pw - 1.5, 2.5);
    }
    x += 36;
  }
}

function drawBossBar(top: number): void {
  let boss = null;
  for (const e of game.enemies) {
    if (e.boss && !e.dead) {
      boss = e;
      break;
    }
  }
  if (!boss) return;
  const W = view.W;
  const bw = Math.min(380, W - 100);
  const bx = (W - bw) / 2;
  const by = top + 58;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 12px Chakra Petch, monospace";
  ctx.fillStyle = hexA(boss.color, 0.95);
  ctx.fillText(boss.name || "BOSS", W / 2, by - 8);
  roundRect(bx, by, bw, 9, 4.5);
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fill();
  const r = clamp(boss.hp / boss.maxhp, 0, 1);
  if (r > 0) {
    roundRect(bx, by, bw * r, 9, 4.5);
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    g.addColorStop(0, boss.color);
    g.addColorStop(1, "#ffffff");
    ctx.fillStyle = g;
    ctx.fill();
  }
  ctx.lineWidth = 1;
  ctx.strokeStyle = hexA(boss.color, 0.6);
  roundRect(bx, by, bw, 9, 4.5);
  ctx.stroke();
}

export function drawHUD(): void {
  const { run, player } = game;
  const W = view.W;
  const H = view.H;
  const top = view.safeTop;

  // Pause button.
  btnPause.x = 14;
  btnPause.y = top;
  iconButton(btnPause);
  ctx.fillStyle = "#9af2ff";
  ctx.fillRect(btnPause.x + 14, top + 12, 5, 18);
  ctx.fillRect(btnPause.x + 23, top + 12, 5, 18);

  // Mute button.
  btnMute.x = W - 56;
  btnMute.y = top;
  iconButton(btnMute);
  ctx.fillStyle = "#9af2ff";
  ctx.beginPath();
  ctx.moveTo(btnMute.x + 12, top + 17);
  ctx.lineTo(btnMute.x + 18, top + 17);
  ctx.lineTo(btnMute.x + 24, top + 11);
  ctx.lineTo(btnMute.x + 24, top + 31);
  ctx.lineTo(btnMute.x + 18, top + 25);
  ctx.lineTo(btnMute.x + 12, top + 25);
  ctx.closePath();
  ctx.fill();
  if (AudioM.muted) {
    ctx.strokeStyle = "#ff5c8a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(btnMute.x + 10, top + 10);
    ctx.lineTo(btnMute.x + 32, top + 32);
    ctx.stroke();
  } else {
    ctx.strokeStyle = "#9af2ff";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(btnMute.x + 27, top + 21, 5, -0.8, 0.8);
    ctx.stroke();
  }

  // XP bar with level badge.
  const bx = 66;
  const bw = W - 66 - 66;
  const by = top + 6;
  const bh = 9;
  roundRect(bx, by, bw, bh, 4.5);
  ctx.fillStyle = "rgba(70,224,255,.12)";
  ctx.fill();
  const xr = clamp(run.xp / run.xpNeed, 0, 1);
  if (xr > 0) {
    roundRect(bx, by, bw * xr, bh, 4.5);
    const grd = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grd.addColorStop(0, "#46e0ff");
    grd.addColorStop(1, "#9af2ff");
    ctx.fillStyle = grd;
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(70,224,255,.3)";
  ctx.lineWidth = 1;
  roundRect(bx, by, bw, bh, 4.5);
  ctx.stroke();
  // Level badge.
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = "700 11px Chakra Petch, monospace";
  ctx.fillStyle = "#9af2ff";
  ctx.fillText("LV " + run.level, bx, by + bh + 12);
  // Sector tag (right-aligned under the bar).
  ctx.textAlign = "right";
  ctx.fillStyle = "#7fb0c6";
  ctx.fillText("SECTOR " + run.sector + (run.overdrive ? " · OVERDRIVE" : ""), bx + bw, by + bh + 12);

  // Timer + score (center).
  ctx.textAlign = "center";
  ctx.font = "700 20px Chakra Petch, monospace";
  ctx.fillStyle = "#eafcff";
  ctx.fillText(fmtTime(run.time), W / 2, top + 34);
  ctx.font = "600 11px Chakra Petch, monospace";
  ctx.fillStyle = "#7fb0c6";
  ctx.fillText(run.score.toLocaleString() + " PTS  ·  " + run.kills + " KILLS", W / 2, top + 50);

  // Combo (heats up with streak).
  if (run.streak > 1) {
    const heat = clamp(run.streak / 50, 0, 1);
    const comboCol = heat > 0.66 ? "#ff5b3a" : heat > 0.33 ? "#ffae3a" : "#ffd34a";
    const pulse = 1 + (0.06 + heat * 0.07) * Math.sin(performance.now() * (0.012 + heat * 0.008));
    ctx.font = "700 " + ((13 + heat * 5) * pulse).toFixed(1) + "px Chakra Petch, monospace";
    ctx.fillStyle = comboCol;
    ctx.fillText("▸ " + run.streak + " COMBO", W / 2, top + 68);
    // Combo decay tick.
    const left = clamp(1 - (run.time - run.lastKillTime) / 2, 0, 1);
    if (left < 1) {
      ctx.fillStyle = hexA(comboCol, 0.6);
      ctx.fillRect(W / 2 - 26, top + 77, 52 * left, 2);
    }
  }

  drawBossBar(top);

  // Coins collected (top-left under pause).
  ctx.textAlign = "left";
  ctx.font = "700 13px Chakra Petch, monospace";
  ctx.fillStyle = "#ffcf4a";
  ctx.fillText("◆ " + run.coins, 16, top + 58);

  // HP bar (bottom-center).
  const hbw = Math.min(360, W - 60);
  const hbx = (W - hbw) / 2;
  const hby = H - 34;
  const hbh = 13;
  roundRect(hbx, hby, hbw, hbh, 6.5);
  ctx.fillStyle = "rgba(255,60,80,.18)";
  ctx.fill();
  const hr = clamp(player.hp / player.maxHP, 0, 1);
  if (hr > 0) {
    roundRect(hbx, hby, hbw * hr, hbh, 6.5);
    const hg = ctx.createLinearGradient(hbx, 0, hbx + hbw, 0);
    hg.addColorStop(0, "#ff4d6d");
    hg.addColorStop(1, "#7cfc8a");
    ctx.fillStyle = hg;
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 1;
  roundRect(hbx, hby, hbw, hbh, 6.5);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.font = "600 10px Chakra Petch, monospace";
  ctx.fillStyle = "#eafcff";
  ctx.fillText(Math.ceil(player.hp) + " / " + player.maxHP, W / 2, hby + hbh / 2 + 0.5);
  if (run.revivesLeft > 0) {
    ctx.fillStyle = "#ffcf4a";
    ctx.fillText(Array(run.revivesLeft + 1).join("◆") + " REVIVE", W / 2, hby - 10);
  }

  drawWeaponChips();

  // Dash button (touch) or key hint (desktop).
  if (game.isTouch) {
    const r = 34;
    const cx = W - 24 - r;
    const cy = H - 26 - r;
    btnDash.x = cx - r - 8;
    btnDash.y = cy - r - 8;
    btnDash.w = r * 2 + 16;
    btnDash.h = r * 2 + 16;
    const ready = player.dashCd <= 0;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU_);
    ctx.fillStyle = ready ? "rgba(70,224,255,.22)" : "rgba(9,16,30,.6)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = ready ? "rgba(154,242,255,.9)" : "rgba(154,242,255,.3)";
    ctx.stroke();
    if (!ready) {
      const k = 1 - player.dashCd / player.dashCdMax;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 3, -Math.PI / 2, -Math.PI / 2 + TAU_ * k);
      ctx.strokeStyle = "rgba(154,242,255,.85)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    // Lightning glyph.
    ctx.strokeStyle = ready ? "#eafcff" : "rgba(234,252,255,.4)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy - 12);
    ctx.lineTo(cx - 5, cy + 2);
    ctx.lineTo(cx + 1, cy + 2);
    ctx.lineTo(cx - 4, cy + 12);
    ctx.stroke();
  } else if (run.time < 24 && game.hintT <= 0) {
    ctx.textAlign = "center";
    ctx.font = "600 11px Chakra Petch, monospace";
    ctx.fillStyle = hexA("#7fb0c6", clamp(24 - run.time, 0, 1) * 0.9);
    ctx.fillText("SHIFT / SPACE — DASH", W / 2, hby + 30);
  }

  // First-run onboarding hints.
  if (game.hintT > 0) {
    const a = clamp(game.hintT, 0, 1);
    ctx.textAlign = "center";
    ctx.font = "700 15px Chakra Petch, monospace";
    ctx.fillStyle = hexA("#eafcff", a * 0.95);
    const msg1 = game.isTouch ? "DRAG ANYWHERE TO FLY" : "WASD / ARROWS — FLY";
    const msg2 = game.isTouch ? "TAP ⚡ TO DASH" : "SHIFT or SPACE — DASH";
    ctx.fillText(msg1, W / 2, H * 0.62);
    ctx.font = "600 13px Chakra Petch, monospace";
    ctx.fillStyle = hexA("#9af2ff", a * 0.9);
    ctx.fillText(msg2, W / 2, H * 0.62 + 24);
    ctx.fillText("WEAPONS FIRE ON THEIR OWN — SURVIVE", W / 2, H * 0.62 + 46);
  }

  // Low integrity warning vignette.
  if (player.hp / player.maxHP < 0.3 && game.state === 1) {
    const k = 0.5 + 0.5 * Math.sin(performance.now() * 0.008);
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
    vg.addColorStop(0, "rgba(255,30,60,0)");
    vg.addColorStop(1, "rgba(255,30,60," + (0.09 + k * 0.09) + ")");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }
}
