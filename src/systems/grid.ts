// Spatial hash grid for fast enemy proximity queries.

import { game } from "../core/state";
import type { Enemy } from "../types";

const CELL = 74;
let grid = new Map<string, Enemy[]>();

export function buildGrid(): void {
  grid.clear();
  for (const e of game.enemies) {
    if (e.dead) continue;
    const k = Math.floor(e.x / CELL) + "_" + Math.floor(e.y / CELL);
    let a = grid.get(k);
    if (!a) {
      a = [];
      grid.set(k, a);
    }
    a.push(e);
  }
}

export function queryCircle(x: number, y: number, r: number): Enemy[] {
  const out: Enemy[] = [];
  const a = Math.floor((x - r) / CELL);
  const b = Math.floor((x + r) / CELL);
  const c = Math.floor((y - r) / CELL);
  const d = Math.floor((y + r) / CELL);
  for (let cx = a; cx <= b; cx++)
    for (let cy = c; cy <= d; cy++) {
      const arr = grid.get(cx + "_" + cy);
      if (arr) for (let i = 0; i < arr.length; i++) out.push(arr[i]);
    }
  return out;
}
