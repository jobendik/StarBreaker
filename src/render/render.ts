// Main render pass: background, trails, entities, projectiles, effects, HUD.

import { ctx, view, blit } from "../core/canvas";
import { game, MENU, PLAYING } from "../core/state";
import { TAU, rnd, clamp, hexA } from "../utils/math";
import { meta } from "../core/storage";
import { renderBackground } from "./background";
import { drawEnemy, drawGem, drawPickup, drawShip, drawShipGhost } from "./draw";
import { drawHUD, drawAnnounces, drawBanner, drawJoystick } from "./hud";

export function render(): void {
  const { cam, shake, player, run, joy } = game;
  const W = view.W;
  const H = view.H;
  const shakeOn = meta.settings.shake;
  const camX = cam.x + (shakeOn && shake.mag ? rnd(-shake.mag, shake.mag) : 0);
  const camY = cam.y + (shakeOn && shake.mag ? rnd(-shake.mag, shake.mag) : 0);
  const time = performance.now() / 1000;

  renderBackground(camX, camY, time);

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

  // Ship motion trail / dash ghosts.
  for (const tp of player.trail) {
    const k = tp.life / tp.max;
    if (tp.dash) drawShipGhost(sX(tp.x), sY(tp.y), tp.ang, k * 0.5, "#9af2ff");
  }

  // ── Glow pass (additive) ──────────────────────────────────────────────────
  ctx.globalCompositeOperation = "lighter";
  for (const tp of player.trail) {
    const k = tp.life / tp.max;
    blit("#46e0ff", sX(tp.x), sY(tp.y), 14 * k + 4);
  }
  for (const g of game.gems) blit(g.value >= 10 ? "#c77dff" : g.value >= 4 ? "#5bc9ff" : "#7cfc8a", sX(g.x), sY(g.y), g.r * 2.4);
  for (const e of game.enemies) blit(e.color, sX(e.x), sY(e.y), e.r * (e.boss ? 2.0 : 1.7));
  for (const w of player.weapons) {
    if (w.type === "orbital" && w._orbs)
      for (const o of w._orbs) blit(w.evolved ? "#ffd34a" : "#9af2ff", sX(o.x), sY(o.y), w.evolved ? 26 : 16);
  }
  for (const gl of game.glaives) blit(gl.evolved ? "#eaffc0" : "#d6ff7d", sX(gl.x), sY(gl.y), gl.r * 1.8);
  for (const m of game.missiles) blit("#ffb24a", sX(m.x), sY(m.y), 12);
  for (const b of game.bullets) blit(b.color, sX(b.x), sY(b.y), b.r * 2.6);
  for (const eb of game.ebullets) blit(eb.color, sX(eb.x), sY(eb.y), eb.r * 2.6);
  for (const p of game.particles) {
    const k = p.life / p.max;
    blit(p.color, sX(p.x), sY(p.y), p.size * (0.6 + k));
  }
  // Railgun beams.
  for (const bm of game.beams) {
    const k = bm.life / bm.max;
    const x1 = sX(bm.x);
    const y1 = sY(bm.y);
    const x2 = sX(bm.x + Math.cos(bm.ang) * bm.len);
    const y2 = sY(bm.y + Math.sin(bm.ang) * bm.len);
    ctx.strokeStyle = hexA(bm.color, k * 0.85);
    ctx.lineCap = "round";
    ctx.lineWidth = bm.w * k;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = hexA("#ffffff", k * 0.9);
    ctx.lineWidth = Math.max(1.5, bm.w * k * 0.35);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  // Tesla arcs.
  for (const a of game.arcs) {
    const k = a.life / a.max;
    ctx.strokeStyle = hexA(a.color, k * 0.9);
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < a.pts.length; i++) {
      const p = a.pts[i];
      if (i) ctx.lineTo(sX(p.x), sY(p.y));
      else ctx.moveTo(sX(p.x), sY(p.y));
    }
    ctx.stroke();
  }
  // Expanding rings (deaths, explosions).
  for (const r of game.rings) {
    const k = r.life / r.max;
    ctx.strokeStyle = hexA(r.color, k * 0.8);
    ctx.lineWidth = r.lw * (0.5 + k);
    ctx.beginPath();
    ctx.arc(sX(r.x), sY(r.y), r.r, 0, TAU);
    ctx.stroke();
  }
  // Novas.
  for (const nv of game.novas) {
    const al = clamp(1 - nv.t / nv.dur, 0, 1);
    ctx.strokeStyle = hexA(nv.pull ? "#e3c2ff" : "#9af2ff", al * 0.85);
    ctx.lineWidth = 4 + al * 6;
    ctx.beginPath();
    ctx.arc(sX(nv.x), sY(nv.y), nv.r, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = hexA(nv.pull ? "#b14bff" : "#46e0ff", al * 0.4);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sX(nv.x), sY(nv.y), nv.r * 0.8, 0, TAU);
    ctx.stroke();
  }
  blit("#46e0ff", sX(player.x), sY(player.y), 26);
  ctx.globalCompositeOperation = "source-over";

  // ── Shape pass ────────────────────────────────────────────────────────────
  for (const e of game.enemies) drawEnemy(e, sX(e.x), sY(e.y));
  for (const g of game.gems) drawGem(sX(g.x), sY(g.y), g.r, g.value);
  ctx.fillStyle = "#ffffff";
  for (const b of game.bullets) {
    ctx.beginPath();
    ctx.arc(sX(b.x), sY(b.y), b.r * 0.6, 0, TAU);
    ctx.fill();
  }
  for (const eb of game.ebullets) {
    ctx.fillStyle = "#ffd7e8";
    ctx.beginPath();
    ctx.arc(sX(eb.x), sY(eb.y), eb.r * 0.55, 0, TAU);
    ctx.fill();
  }
  for (const w of player.weapons) {
    if (w.type === "orbital" && w._orbs)
      for (const o of w._orbs) {
        const orbR = w.evolved ? 10 : 6;
        ctx.fillStyle = w.evolved ? "#ffe9a8" : "#cdf6ff";
        if (w.evolved) {
          // Blade: spinning sliver.
          ctx.save();
          ctx.translate(sX(o.x), sY(o.y));
          ctx.rotate((w.ang || 0) * 3);
          ctx.beginPath();
          ctx.moveTo(0, -13);
          ctx.lineTo(5, 0);
          ctx.lineTo(0, 13);
          ctx.lineTo(-5, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(sX(o.x), sY(o.y), orbR, 0, TAU);
          ctx.fill();
        }
      }
  }
  // Glaive blades.
  for (const gl of game.glaives) {
    ctx.save();
    ctx.translate(sX(gl.x), sY(gl.y));
    ctx.rotate(gl.spin);
    ctx.strokeStyle = gl.evolved ? "#eaffc0" : "#d6ff7d";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, gl.r * 0.8, 0.3, Math.PI * 1.25);
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, gl.r * 0.8, Math.PI + 0.3, TAU + Math.PI * 0.25);
    ctx.stroke();
    ctx.restore();
  }
  for (const p of game.pickups) drawPickup(p.type, sX(p.x), sY(p.y), p.t);
  drawShip(sX(player.x), sY(player.y));

  // Floating texts.
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const t of game.texts) {
    const a = clamp(t.life / t.max, 0, 1);
    ctx.font = "700 " + (t.size || 14) + "px Chakra Petch, monospace";
    ctx.fillStyle = hexA(t.color, a);
    ctx.fillText(t.txt, sX(t.x), sY(t.y));
  }

  // Vignette.
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // Full-screen flashes (only while the sim is live — they freeze mid-fade
  // otherwise and would tint paused/level-up screens).
  if (game.state === PLAYING) {
    if (player.hurtFlash > 0) {
      ctx.fillStyle = hexA("#ff2d4f", player.hurtFlash * 0.4);
      ctx.fillRect(0, 0, W, H);
    }
    if (run.reviveFlash > 0) {
      ctx.fillStyle = hexA("#9af2ff", run.reviveFlash * 0.5);
      ctx.fillRect(0, 0, W, H);
    }
    if (run.levelFlash > 0) {
      ctx.fillStyle = hexA("#9af2ff", run.levelFlash * 0.25);
      ctx.fillRect(0, 0, W, H);
    }
    if (game.flash.t > 0) {
      ctx.fillStyle = hexA(game.flash.color, (game.flash.t / game.flash.max) * 0.4);
      ctx.fillRect(0, 0, W, H);
    }
  }

  drawAnnounces();
  drawHUD();
  if (joy.active) drawJoystick();
  if (run.bannerT > 0) drawBanner();
}
