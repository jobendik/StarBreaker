// Heads-up display, announcements, banners, joystick, and HUD buttons.

import { ctx, view } from "../core/canvas";
import { game } from "../core/state";
import { AudioM } from "../core/audio";
import { clamp, hexA } from "../utils/math";
import { roundRect } from "./draw";

export interface HudButton {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const btnPause: HudButton = { x: 0, y: 0, w: 42, h: 42 };
export const btnMute: HudButton = { x: 0, y: 0, w: 42, h: 42 };

export function drawAnnounces(): void {
  const { announces } = game;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < announces.length; i++) {
    const a = announces[i];
    const k = a.life / a.max;
    const al = clamp(k < 0.3 ? k / 0.3 : 1, 0, 1);
    const sc = 1 + (1 - k) * 0.22;
    const y = view.H * 0.3 + i * 40 - (1 - k) * 16;
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
  ctx.fillStyle = hexA("#ff5c8a", Math.min(1, a) * 0.95);
  ctx.fillText(run.banner, view.W / 2, view.safeTop + 118);
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

export function drawHUD(): void {
  const { run, player } = game;
  const W = view.W;
  const H = view.H;
  const top = view.safeTop;

  btnPause.x = 14;
  btnPause.y = top;
  roundRect(btnPause.x, btnPause.y, 42, 42, 9);
  ctx.fillStyle = "rgba(9,16,30,.7)";
  ctx.fill();
  ctx.strokeStyle = "rgba(70,224,255,.45)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#9af2ff";
  ctx.fillRect(btnPause.x + 14, top + 12, 5, 18);
  ctx.fillRect(btnPause.x + 23, top + 12, 5, 18);

  btnMute.x = W - 56;
  btnMute.y = top;
  roundRect(btnMute.x, btnMute.y, 42, 42, 9);
  ctx.fillStyle = "rgba(9,16,30,.7)";
  ctx.fill();
  ctx.strokeStyle = "rgba(70,224,255,.45)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
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

  const bx = 66;
  const bw = W - 66 - 66;
  const by = top + 13;
  const bh = 8;
  roundRect(bx, by, bw, bh, 4);
  ctx.fillStyle = "rgba(70,224,255,.12)";
  ctx.fill();
  const xr = clamp(run.xp / run.xpNeed, 0, 1);
  if (xr > 0) {
    roundRect(bx, by, bw * xr, bh, 4);
    const grd = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grd.addColorStop(0, "#46e0ff");
    grd.addColorStop(1, "#9af2ff");
    ctx.fillStyle = grd;
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(70,224,255,.3)";
  ctx.lineWidth = 1;
  roundRect(bx, by, bw, bh, 4);
  ctx.stroke();

  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.font = "600 14px Chakra Petch, monospace";
  ctx.fillStyle = "#cfeeff";
  const mm = String(Math.floor(run.time / 60));
  const ss = String(Math.floor(run.time % 60));
  ctx.fillText((mm.length < 2 ? "0" + mm : mm) + ":" + (ss.length < 2 ? "0" + ss : ss), W / 2, top + 34);
  ctx.font = "500 11px Chakra Petch, monospace";
  ctx.fillStyle = "#7fb0c6";
  ctx.fillText("LV " + run.level + "  \u00B7  " + run.kills + " KILLS", W / 2, top + 50);
  if (run.streak > 1) {
    const pulse = 1 + 0.08 * Math.sin(performance.now() * 0.012);
    ctx.font = "700 " + (13 * pulse).toFixed(1) + "px Chakra Petch, monospace";
    ctx.fillStyle = "#ffd34a";
    ctx.fillText("\u25B8 " + run.streak + " STREAK", W / 2, top + 68);
  }

  const hbw = Math.min(360, W - 60);
  const hbx = (W - hbw) / 2;
  const hby = H - 34;
  const hbh = 12;
  roundRect(hbx, hby, hbw, hbh, 6);
  ctx.fillStyle = "rgba(255,60,80,.18)";
  ctx.fill();
  const hr = clamp(player.hp / player.maxHP, 0, 1);
  if (hr > 0) {
    roundRect(hbx, hby, hbw * hr, hbh, 6);
    const hg = ctx.createLinearGradient(hbx, 0, hbx + hbw, 0);
    hg.addColorStop(0, "#ff4d6d");
    hg.addColorStop(1, "#7cfc8a");
    ctx.fillStyle = hg;
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 1;
  roundRect(hbx, hby, hbw, hbh, 6);
  ctx.stroke();
  ctx.font = "600 10px Chakra Petch, monospace";
  ctx.fillStyle = "#eafcff";
  ctx.fillText(Math.ceil(player.hp) + " / " + player.maxHP, W / 2, hby + hbh / 2 + 0.5);
  if (run.revivesLeft > 0) {
    ctx.fillStyle = "#ffcf4a";
    ctx.fillText(Array(run.revivesLeft + 1).join("\u25C6") + " REVIVE", W / 2, hby - 12);
  }
}
