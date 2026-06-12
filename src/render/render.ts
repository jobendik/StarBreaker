// Main render pass: world, entities, effects, and HUD compositing.

import { ctx, view, stars, blit } from "../core/canvas";
import { game, MENU } from "../core/state";
import { TAU, rnd, clamp, hexA } from "../utils/math";
import { drawEnemy, drawGem, drawHeal, drawShip } from "./draw";
import { drawHUD, drawAnnounces, drawBanner, drawJoystick } from "./hud";

export function render(): void {
  const { cam, shake, player, run, joy } = game;
  const W = view.W;
  const H = view.H;
  const camX = cam.x + (shake.mag ? rnd(-shake.mag, shake.mag) : 0);
  const camY = cam.y + (shake.mag ? rnd(-shake.mag, shake.mag) : 0);
  const time = performance.now() / 1000;
  ctx.fillStyle = "#05070f";
  ctx.fillRect(0, 0, W, H);
  for (const s of stars) {
    const sx = (((s.x - camX * s.z) % W) + W) % W;
    const sy = (((s.y - camY * s.z) % H) + H) % H;
    const a = s.a * (0.6 + 0.4 * Math.sin(time * s.tw + s.ph));
    ctx.fillStyle = hexA("#bfe9ff", a);
    ctx.fillRect(sx, sy, s.s, s.s);
  }
  const S2 = 64;
  const ox = -(((camX % S2) + S2) % S2);
  const oy = -(((camY % S2) + S2) % S2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(70,224,255,0.045)";
  ctx.beginPath();
  for (let x = ox; x < W; x += S2) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = oy; y < H; y += S2) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(70,224,255,0.10)";
  ctx.beginPath();
  const bigx = -((((camX % (S2 * 4)) + S2 * 4) % (S2 * 4)));
  const bigy = -((((camY % (S2 * 4)) + S2 * 4) % (S2 * 4)));
  for (let x = bigx; x < W; x += S2 * 4) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = bigy; y < H; y += S2 * 4) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();

  if (game.state === MENU) {
    const vg0 = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg0.addColorStop(0, "rgba(0,0,0,0)");
    vg0.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = vg0;
    ctx.fillRect(0, 0, W, H);
    return;
  }

  const sX = (x: number): number => x - camX;
  const sY = (y: number): number => y - camY;

  ctx.globalCompositeOperation = "lighter";
  for (const g of game.gems) blit("#7cfc8a", sX(g.x), sY(g.y), g.r * 2.4);
  for (const p of game.pickups) blit("#7cfc8a", sX(p.x), sY(p.y), 20);
  for (const e of game.enemies) blit(e.color, sX(e.x), sY(e.y), e.r * (e.boss ? 2.0 : 1.7));
  for (const w of player.weapons) {
    if (w.type === "orbital" && w._orbs) for (const o of w._orbs) blit("#9af2ff", sX(o.x), sY(o.y), 16);
  }
  for (const nv of game.novas) {
    const al = clamp(1 - nv.t / nv.dur, 0, 1);
    ctx.strokeStyle = hexA("#9af2ff", al * 0.8);
    ctx.lineWidth = 4 + al * 6;
    ctx.beginPath();
    ctx.arc(sX(nv.x), sY(nv.y), nv.r, 0, TAU);
    ctx.stroke();
  }
  for (const m of game.missiles) blit("#ffb24a", sX(m.x), sY(m.y), 12);
  for (const b of game.bullets) blit(b.color, sX(b.x), sY(b.y), b.r * 2.6);
  for (const p of game.particles) {
    const k = p.life / p.max;
    blit(p.color, sX(p.x), sY(p.y), p.size * (0.6 + k));
  }
  blit("#46e0ff", sX(player.x), sY(player.y), 26);
  ctx.globalCompositeOperation = "source-over";

  for (const e of game.enemies) drawEnemy(e, sX(e.x), sY(e.y));
  for (const g of game.gems) drawGem(sX(g.x), sY(g.y), g.r);
  ctx.fillStyle = "#ffffff";
  for (const b of game.bullets) {
    ctx.beginPath();
    ctx.arc(sX(b.x), sY(b.y), b.r * 0.6, 0, TAU);
    ctx.fill();
  }
  for (const w of player.weapons) {
    if (w.type === "orbital" && w._orbs)
      for (const o of w._orbs) {
        ctx.fillStyle = "#cdf6ff";
        ctx.beginPath();
        ctx.arc(sX(o.x), sY(o.y), 6, 0, TAU);
        ctx.fill();
      }
  }
  for (const p of game.pickups) drawHeal(sX(p.x), sY(p.y));
  drawShip(sX(player.x), sY(player.y));

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const t of game.texts) {
    const a = clamp(t.life / t.max, 0, 1);
    ctx.font = "700 14px Chakra Petch, monospace";
    ctx.fillStyle = hexA(t.color, a);
    ctx.fillText(t.txt, sX(t.x), sY(t.y));
  }

  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  if (player.hurtFlash > 0) {
    ctx.fillStyle = hexA("#ff2d4f", player.hurtFlash * 0.4);
    ctx.fillRect(0, 0, W, H);
  }
  if (run.reviveFlash > 0) {
    ctx.fillStyle = hexA("#9af2ff", run.reviveFlash * 0.5);
    ctx.fillRect(0, 0, W, H);
  }

  drawAnnounces();
  drawHUD();
  if (joy.active) drawJoystick();
  if (run.bannerT > 0) drawBanner();
}
