// Pointer (virtual joystick + dash button), keyboard, and focus handling.

import { canvas } from "../core/canvas";
import { game, PLAYING, PAUSED } from "../core/state";
import { audioInit, audioResume, AudioM, setMuted } from "../core/audio";
import { pauseGame, resumeGame } from "../ui/overlays";
import { tryDash } from "../game";
import { btnPause, btnMute, btnDash, HudButton } from "../render/hud";

function hitBtn(b: HudButton, x: number, y: number): boolean {
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

export function initInput(): void {
  const { joy } = game;
  game.isTouch = matchMedia("(pointer: coarse)").matches;

  canvas.addEventListener("pointerdown", (e) => {
    audioInit();
    audioResume();
    if (e.pointerType === "touch") game.isTouch = true;
    if (game.state !== PLAYING) return;
    const x = e.clientX;
    const y = e.clientY;
    if (hitBtn(btnPause, x, y)) {
      pauseGame();
      return;
    }
    if (hitBtn(btnMute, x, y)) {
      setMuted(!AudioM.muted);
      return;
    }
    if (game.isTouch && hitBtn(btnDash, x, y)) {
      tryDash();
      return;
    }
    joy.active = true;
    joy.id = e.pointerId;
    joy.ox = x;
    joy.oy = y;
    joy.dx = 0;
    joy.dy = 0;
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!joy.active || e.pointerId !== joy.id) return;
    let dx = e.clientX - joy.ox;
    let dy = e.clientY - joy.oy;
    const d = Math.hypot(dx, dy);
    if (d > joy.max) {
      dx = (dx / d) * joy.max;
      dy = (dy / d) * joy.max;
    }
    joy.dx = dx;
    joy.dy = dy;
  });

  function endJoy(e: PointerEvent): void {
    if (e.pointerId === joy.id) {
      joy.active = false;
      joy.id = null;
      joy.dx = 0;
      joy.dy = 0;
    }
  }
  canvas.addEventListener("pointerup", endJoy);
  canvas.addEventListener("pointercancel", endJoy);

  addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (!e.repeat) {
      if (k === "p" || k === "escape") {
        if (game.state === PLAYING) pauseGame();
        else if (game.state === PAUSED) resumeGame();
      }
      if (k === "m") setMuted(!AudioM.muted);
      if (k === " " || k === "shift") tryDash();
    }
    game.keys[k] = true;
    if (k === "arrowup" || k === "arrowdown" || k === "arrowleft" || k === "arrowright" || k === " ") e.preventDefault();
  });
  addEventListener("keyup", (e) => {
    game.keys[e.key.toLowerCase()] = false;
  });
  addEventListener("blur", () => {
    if (game.state === PLAYING) pauseGame();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && game.state === PLAYING) pauseGame();
  });
}
