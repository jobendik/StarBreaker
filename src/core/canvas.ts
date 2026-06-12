// Canvas setup, viewport sizing, glow sprite cache, starfield, and nebulae.

import { TAU, rnd, hexA } from "../utils/math";

export const canvas = document.getElementById("c") as HTMLCanvasElement;
export const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

// Mutable viewport metrics, updated on resize.
export const view = {
  W: innerWidth,
  H: innerHeight,
  DPR: 1,
  safeTop: 12,
};

const probe = document.createElement("div");
probe.style.cssText =
  "position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);pointer-events:none;";
document.body.appendChild(probe);

export function resize(): void {
  view.W = innerWidth;
  view.H = innerHeight;
  view.DPR = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(view.W * view.DPR);
  canvas.height = Math.floor(view.H * view.DPR);
  canvas.style.width = view.W + "px";
  canvas.style.height = view.H + "px";
  ctx.setTransform(view.DPR, 0, 0, view.DPR, 0, 0);
  view.safeTop = Math.max(12, probe.offsetHeight + 10);
}

addEventListener("resize", resize);
resize();

const glowCache = new Map<string, HTMLCanvasElement>();

export function glow(color: string): HTMLCanvasElement {
  let g = glowCache.get(color);
  if (g) return g;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d") as CanvasRenderingContext2D;
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, hexA(color, 0.95));
  gr.addColorStop(0.35, hexA(color, 0.4));
  gr.addColorStop(1, hexA(color, 0));
  x.fillStyle = gr;
  x.fillRect(0, 0, 128, 128);
  glowCache.set(color, c);
  return c;
}

export function blit(color: string, x: number, y: number, r: number): void {
  ctx.drawImage(glow(color), x - r, y - r, r * 2, r * 2);
}

// Soft nebula sprite (less core-bright than glow, for background clouds).
const nebCache = new Map<string, HTMLCanvasElement>();

export function nebSprite(color: string): HTMLCanvasElement {
  let g = nebCache.get(color);
  if (g) return g;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d") as CanvasRenderingContext2D;
  const gr = x.createRadialGradient(128, 128, 10, 128, 128, 128);
  gr.addColorStop(0, hexA(color, 0.5));
  gr.addColorStop(0.5, hexA(color, 0.18));
  gr.addColorStop(1, hexA(color, 0));
  x.fillStyle = gr;
  x.fillRect(0, 0, 256, 256);
  nebCache.set(color, c);
  return c;
}

export interface Star {
  x: number;
  y: number;
  z: number;
  s: number;
  a: number;
  tw: number;
  ph: number;
}

export const stars: Star[] = [];
const STN = 170;
for (let i = 0; i < STN; i++) {
  stars.push({
    x: rnd(2000),
    y: rnd(2000),
    z: rnd(0.15, 0.62),
    s: rnd(0.6, 2.0),
    a: rnd(0.25, 0.85),
    tw: rnd(1, 3),
    ph: rnd(TAU),
  });
}

export interface NebBlob {
  x: number;
  y: number;
  z: number;
  r: number;
  c: number; // palette slot 0|1
  drift: number;
}

export const nebulae: NebBlob[] = [];
for (let i = 0; i < 7; i++) {
  nebulae.push({
    x: rnd(2400),
    y: rnd(2400),
    z: rnd(0.04, 0.12),
    r: rnd(260, 560),
    c: i % 2,
    drift: rnd(TAU),
  });
}
