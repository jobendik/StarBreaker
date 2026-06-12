// Entity drawing: detailed ship, distinct enemy silhouettes, gems, pickups.

import { ctx, blit } from "../core/canvas";
import { game } from "../core/state";
import { shipById } from "../config/definitions";
import { meta } from "../core/storage";
import { TAU, hexA, clamp, rnd } from "../utils/math";
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

function spikeBurst(x: number, y: number, r1: number, r2: number, n: number, rot: number): void {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i / (n * 2)) * TAU;
    const r = i % 2 === 0 ? r2 : r1;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

export function drawEnemy(e: Enemy, x: number, y: number): void {
  const { player } = game;
  const aimRot = Math.atan2(player.y - e.y, player.x - e.x);
  // Spawn-in: scale up + fade.
  const sc = e.spawnT > 0 ? clamp(1 - e.spawnT / 0.4, 0.2, 1) : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  if (e.spawnT > 0) ctx.globalAlpha = sc;

  const flash = e.flash > 0;
  const stroke = flash ? "#ffffff" : e.color;
  const fillA = e.boss ? 0.26 : 0.18;

  if (e.boss) {
    // Big armored core with rotating outer ring.
    poly(0, 0, e.r, e.sides, e.spin);
    ctx.fillStyle = hexA(e.color, fillA);
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = stroke;
    ctx.stroke();
    poly(0, 0, e.r * 0.62, e.sides, -e.spin * 1.4);
    ctx.lineWidth = 2;
    ctx.strokeStyle = hexA(e.color, 0.8);
    ctx.stroke();
    ctx.fillStyle = flash ? "#ffffff" : hexA("#ffffff", 0.85);
    ctx.beginPath();
    ctx.arc(0, 0, e.r * 0.18 * (1 + 0.1 * Math.sin(performance.now() * 0.006)), 0, TAU);
    ctx.fill();
  } else if (e.type === "drone") {
    // Arrowhead pointed at the player with a core dot.
    ctx.rotate(aimRot + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -e.r * 1.15);
    ctx.lineTo(e.r * 0.85, e.r * 0.85);
    ctx.lineTo(0, e.r * 0.35);
    ctx.lineTo(-e.r * 0.85, e.r * 0.85);
    ctx.closePath();
    ctx.fillStyle = hexA(e.color, fillA);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;
    ctx.stroke();
    ctx.fillStyle = stroke;
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, TAU);
    ctx.fill();
  } else if (e.type === "swarmer") {
    // Small spinning diamond.
    poly(0, 0, e.r, 4, e.spin);
    ctx.fillStyle = hexA(e.color, fillA);
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  } else if (e.type === "brute") {
    // Heavy hex with inner plating.
    poly(0, 0, e.r, 6, e.spin);
    ctx.fillStyle = hexA(e.color, 0.22);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = stroke;
    ctx.stroke();
    poly(0, 0, e.r * 0.55, 6, e.spin);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = hexA(e.color, 0.7);
    ctx.stroke();
  } else if (e.type === "splitter") {
    // Square with a cross seam — it's going to break apart.
    poly(0, 0, e.r, 4, e.spin);
    ctx.fillStyle = hexA(e.color, fillA);
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = stroke;
    ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = hexA(e.color, 0.7);
    ctx.beginPath();
    ctx.moveTo(-e.r * 0.7, 0);
    ctx.lineTo(e.r * 0.7, 0);
    ctx.moveTo(0, -e.r * 0.7);
    ctx.lineTo(0, e.r * 0.7);
    ctx.stroke();
  } else if (e.type === "weaver") {
    // Slim kite that visibly banks.
    ctx.rotate(aimRot + Math.PI / 2 + Math.sin(game.run.time * 4.2 + e.id * 1.7) * 0.5);
    ctx.beginPath();
    ctx.moveTo(0, -e.r * 1.3);
    ctx.lineTo(e.r * 0.6, 0);
    ctx.lineTo(0, e.r * 1.1);
    ctx.lineTo(-e.r * 0.6, 0);
    ctx.closePath();
    ctx.fillStyle = hexA(e.color, fillA);
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  } else if (e.type === "dasher") {
    // Spiked pentagon; glows hot while telegraphing.
    const hot = e.phase === 1;
    spikeBurst(0, 0, e.r * 0.62, e.r * (hot ? 1.25 : 1.05), 5, e.spin);
    ctx.fillStyle = hexA(e.color, hot ? 0.5 : fillA);
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = hot ? "#ffffff" : stroke;
    ctx.stroke();
  } else if (e.type === "spitter") {
    // Hex with an aimed barrel.
    poly(0, 0, e.r, 6, e.spin * 0.3);
    ctx.fillStyle = hexA(e.color, fillA);
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = stroke;
    ctx.stroke();
    ctx.rotate(aimRot);
    ctx.lineWidth = 3;
    ctx.strokeStyle = hexA(e.color, 0.9);
    ctx.beginPath();
    ctx.moveTo(e.r * 0.4, 0);
    ctx.lineTo(e.r * 1.25, 0);
    ctx.stroke();
  } else {
    // shard / fallback
    poly(0, 0, e.r, e.sides, e.spin);
    ctx.fillStyle = hexA(e.color, fillA);
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }

  if (flash && !e.boss) {
    ctx.globalAlpha = clamp(e.flash * 2, 0, 0.5) * sc;
    ctx.fillStyle = "#ffffff";
    poly(0, 0, e.r, e.sides, e.spin);
    ctx.fill();
  }
  ctx.restore();

  // Elite aura ring.
  if (e.elite) {
    const pulse = 1 + 0.08 * Math.sin(performance.now() * 0.008 + e.id);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = hexA("#ffcf4a", 0.65);
    ctx.beginPath();
    ctx.arc(x, y, (e.r + 7) * pulse, 0, TAU);
    ctx.stroke();
  }

  // Health bars for tougher units (bosses use the HUD bar).
  if (!e.boss && (e.elite || e.maxhp > 60)) {
    const w = e.r * 2;
    const h = 4;
    const hpx = x - e.r;
    const hpy = y - e.r - 10;
    ctx.fillStyle = "rgba(0,0,0,.5)";
    ctx.fillRect(hpx, hpy, w, h);
    ctx.fillStyle = e.elite ? "#ffcf4a" : e.color;
    ctx.fillRect(hpx, hpy, w * clamp(e.hp / e.maxhp, 0, 1), h);
  }
}

export function drawGem(x: number, y: number, r: number, value: number): void {
  const big = value >= 10;
  const mid = value >= 4;
  const col = big ? "#c77dff" : mid ? "#5bc9ff" : "#7cfc8a";
  const t = performance.now() * 0.004;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4 + Math.sin(t + x * 0.01) * 0.2);
  ctx.fillStyle = hexA(col, 0.25);
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.6;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.strokeRect(-r, -r, r * 2, r * 2);
  ctx.fillStyle = hexA("#ffffff", 0.8);
  ctx.fillRect(-r * 0.3, -r * 0.3, r * 0.6, r * 0.6);
  ctx.restore();
}

export function drawPickup(type: string, x: number, y: number, t: number): void {
  const bob = Math.sin(t * 3) * 3;
  const yy = y + bob;
  if (type === "heal") {
    blit("#7cfc8a", x, yy, 22);
    ctx.strokeStyle = "#7cfc8a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 7, yy);
    ctx.lineTo(x + 7, yy);
    ctx.moveTo(x, yy - 7);
    ctx.lineTo(x, yy + 7);
    ctx.stroke();
  } else if (type === "magnet") {
    blit("#5bc9ff", x, yy, 22);
    ctx.strokeStyle = "#5bc9ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, yy, 7, Math.PI * 0.15, Math.PI * 0.85, true);
    ctx.moveTo(x - 7 * Math.cos(Math.PI * 0.15), yy + 7 * Math.sin(Math.PI * 0.15));
    ctx.lineTo(x - 7 * Math.cos(Math.PI * 0.15), yy + 11);
    ctx.moveTo(x + 7 * Math.cos(Math.PI * 0.15), yy + 7 * Math.sin(Math.PI * 0.15));
    ctx.lineTo(x + 7 * Math.cos(Math.PI * 0.15), yy + 11);
    ctx.stroke();
  } else if (type === "bomb") {
    blit("#ffb24a", x, yy, 22);
    ctx.strokeStyle = "#ffb24a";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(x, yy + 1, 7, 0, TAU);
    ctx.moveTo(x + 4, yy - 5);
    ctx.lineTo(x + 8, yy - 9);
    ctx.stroke();
    ctx.fillStyle = "#ffe79a";
    ctx.beginPath();
    ctx.arc(x + 8.5, yy - 9.5, 1.8, 0, TAU);
    ctx.fill();
  } else if (type === "coin") {
    // Spinning core diamond.
    const sx = Math.abs(Math.cos(t * 4));
    blit("#ffcf4a", x, yy, 18);
    ctx.save();
    ctx.translate(x, yy);
    ctx.scale(0.4 + sx * 0.6, 1);
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6.5, 0);
    ctx.lineTo(0, 8);
    ctx.lineTo(-6.5, 0);
    ctx.closePath();
    ctx.fillStyle = "#ffd34a";
    ctx.fill();
    ctx.strokeStyle = "#fff0c0";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }
}

// The player ship: layered hull with per-ship color, animated engine flame,
// shield bubble when invulnerable.
export function drawShip(x: number, y: number): void {
  const { player } = game;
  const ship = shipById(meta.ship);
  const col = ship.color;
  const t = performance.now() * 0.001;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(player.angle + Math.PI / 2);

  // Engine flame (flickers; longer when moving/dashing).
  const thrust = player.dashT > 0 ? 2.2 : player.moving ? 1 : 0.45;
  const flameLen = (12 + Math.sin(t * 31) * 3 + rnd(0, 3)) * thrust;
  const fg = ctx.createLinearGradient(0, 10, 0, 10 + flameLen);
  fg.addColorStop(0, hexA("#9af2ff", 0.9));
  fg.addColorStop(0.45, hexA(col, 0.55));
  fg.addColorStop(1, hexA(col, 0));
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(-4.5, 10);
  ctx.lineTo(0, 10 + flameLen);
  ctx.lineTo(4.5, 10);
  ctx.closePath();
  ctx.fill();

  // Wings (darker steel).
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(14, 11);
  ctx.lineTo(9, 13);
  ctx.lineTo(0, 6);
  ctx.lineTo(-9, 13);
  ctx.lineTo(-14, 11);
  ctx.closePath();
  ctx.fillStyle = "rgba(16,32,52,.92)";
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = hexA(col, 0.85);
  ctx.stroke();

  // Main hull.
  const hg = ctx.createLinearGradient(0, -16, 0, 12);
  hg.addColorStop(0, "rgba(220,250,255,.95)");
  hg.addColorStop(0.35, hexA(col, 0.75));
  hg.addColorStop(1, "rgba(10,22,38,.95)");
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(6, 2);
  ctx.lineTo(4.5, 11);
  ctx.lineTo(-4.5, 11);
  ctx.lineTo(-6, 2);
  ctx.closePath();
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = player.invuln > 0 ? "#ffffff" : hexA(col, 0.95);
  ctx.stroke();

  // Cockpit.
  ctx.fillStyle = "#eafcff";
  ctx.beginPath();
  ctx.ellipse(0, -4, 2.4, 4, 0, 0, TAU);
  ctx.fill();

  ctx.restore();

  // Shield bubble during invulnerability.
  if (player.invuln > 0) {
    const a = clamp(player.invuln, 0, 1) * 0.55;
    const rr = player.radius + 9 + Math.sin(t * 12) * 1.5;
    ctx.lineWidth = 2;
    ctx.strokeStyle = hexA("#9af2ff", a);
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = hexA("#46e0ff", a * 0.16);
    ctx.fill();
  }
}

// Faded afterimages while dashing.
export function drawShipGhost(x: number, y: number, ang: number, alpha: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang + Math.PI / 2);
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(11, 12);
  ctx.lineTo(0, 6);
  ctx.lineTo(-11, 12);
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
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
