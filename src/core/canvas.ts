// Canvas setup, viewport sizing, glow sprite cache, and starfield.

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
const STN = 150;
for (let i = 0; i < STN; i++) {
  stars.push({
    x: rnd(2000),
    y: rnd(2000),
    z: rnd(0.18, 0.6),
    s: rnd(0.6, 1.8),
    a: rnd(0.25, 0.8),
    tw: rnd(1, 3),
    ph: rnd(TAU),
  });
}
