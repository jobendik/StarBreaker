// Low-level entity drawing primitives.

import { ctx } from "../core/canvas";
import { game } from "../core/state";
import { TAU, hexA, clamp } from "../utils/math";
import type { Enemy } from "../types";

export function poly(x: number, y: number, r: number, sides: number, rot: number): void {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rot + (i / sides) * TAU;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

export function drawEnemy(e: Enemy, x: number, y: number): void {
  const { player } = game;
  const rot = e.type === "drone" ? Math.atan2(player.y - e.y, player.x - e.x) + Math.PI / 2 : e.spin;
  poly(x, y, e.r, e.sides, rot);
  ctx.fillStyle = hexA(e.color, 0.18);
  ctx.fill();
  ctx.lineWidth = e.boss ? 3 : 2;
  ctx.strokeStyle = e.flash > 0 ? "#ffffff" : e.color;
  ctx.stroke();
  if (e.flash > 0) {
    ctx.fillStyle = hexA("#ffffff", e.flash * 2);
    ctx.fill();
  }
  if (e.boss || e.maxhp > 40) {
    const w = e.r * 2;
    const h = 4;
    const hpx = x - e.r;
    const hpy = y - e.r - 9;
    ctx.fillStyle = "rgba(0,0,0,.5)";
    ctx.fillRect(hpx, hpy, w, h);
    ctx.fillStyle = e.color;
    ctx.fillRect(hpx, hpy, w * clamp(e.hp / e.maxhp, 0, 1), h);
  }
}

export function drawGem(x: number, y: number, r: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = "#0a1f12";
  ctx.strokeStyle = "#7cfc8a";
  ctx.lineWidth = 1.6;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.strokeRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

export function drawHeal(x: number, y: number): void {
  ctx.strokeStyle = "#7cfc8a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 7, y);
  ctx.lineTo(x + 7, y);
  ctx.moveTo(x, y - 7);
  ctx.lineTo(x, y + 7);
  ctx.stroke();
}

export function drawShip(x: number, y: number): void {
  const { player } = game;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(player.angle + Math.PI / 2);
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(11, 12);
  ctx.lineTo(0, 6);
  ctx.lineTo(-11, 12);
  ctx.closePath();
  ctx.fillStyle = "rgba(70,224,255,.30)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = player.invuln > 0 ? "#eafcff" : "#9af2ff";
  ctx.stroke();
  ctx.fillStyle = "#eafcff";
  ctx.beginPath();
  ctx.arc(0, -2, 2.6, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function roundRect(x: number, y: number, w: number, h: number, r: number): void {
  r = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
