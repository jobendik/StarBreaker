// DOM overlays: menu, level-up, pause, game-over, and the meta shop.

import { game, MENU, PLAYING, LEVELUP, PAUSED, DEAD } from "../core/state";
import { meta, saveMeta } from "../core/storage";
import { AudioM, audioInit, audioResume } from "../core/audio";
import { sfx } from "../core/audio";
import { sdkReady, sdkStart, sdkStop, sdkHappy, sdkRewarded } from "../core/sdk";
import { WDEF, PDEF, META_DEF, MetaDef } from "../config/definitions";
import { ICONS } from "../config/icons";
import { buildOffers, applyOffer } from "../systems/progression";
import { startRun, doRevive, finalizeRun, score } from "../systems/lifecycle";
import type { Offer } from "../types";

function $(id: string): HTMLElement {
  return document.getElementById(id) as HTMLElement;
}

export function hideAll(): void {
  ["menu", "levelup", "pause", "gameover"].forEach((i) => $(i).classList.remove("show"));
}

export function showMenu(): void {
  game.state = MENU;
  hideAll();
  renderShop();
  $("m-cores").textContent = String(meta.cores);
  $("m-best").textContent = "Best " + meta.best + "  \u00B7  " + meta.ach.length + "/7 \u2605";
  $("menu").classList.add("show");
}

export function toggleMute(): void {
  AudioM.muted = !AudioM.muted;
  if (AudioM.master) AudioM.master.gain.value = AudioM.muted ? 0 : 0.5;
}

export function pauseGame(): void {
  if (game.state !== PLAYING) return;
  game.state = PAUSED;
  sdkStop();
  $("p-stat").textContent = "LV " + game.run.level + " \u00B7 " + game.run.kills + " kills";
  $("pause").classList.add("show");
}

export function resumeGame(): void {
  if (game.state !== PAUSED) return;
  game.state = PLAYING;
  hideAll();
  game.last = performance.now();
  sdkStart();
}

export function openLevelUp(): void {
  game.state = LEVELUP;
  sfx.levelup();
  sdkHappy();
  const t = String(game.run.level);
  $("lv-title").textContent = "LEVEL " + (t.length < 2 ? "0" + t : t);
  const offers = buildOffers();
  const wrap = $("lv-cards");
  wrap.innerHTML = "";
  offers.forEach((o) => wrap.appendChild(makeCard(o)));
  $("levelup").classList.add("show");
}

function chooseOffer(o: Offer): void {
  applyOffer(o);
  game.run.pendingLevel--;
  if (game.run.pendingLevel > 0) {
    openLevelUp();
  } else {
    game.state = PLAYING;
    hideAll();
    game.last = performance.now();
  }
}

function makeCard(o: Offer): HTMLDivElement {
  const { player } = game;
  const el = document.createElement("div");
  el.className = "card";
  const rar = o.rarity || "common";
  const n = o.lvls || 1;
  const rt = rar.toUpperCase();
  if (rar === "epic") el.classList.add("epic");
  else if (rar === "legendary") el.classList.add("legendary");
  let badge: string;
  let name: string;
  let desc: string;
  let icon: string;
  if (o.kind === "wnew") {
    if (rar === "common") el.classList.add("new");
    const d = WDEF[o.type!];
    badge = rt + (n > 1 ? " \u00B7 NEW LV" + Math.min(d.max, n) : " \u00B7 NEW");
    name = d.name;
    desc = d.base;
    icon = ICONS[d.icon];
  } else if (o.kind === "wlvl") {
    const w = player.weapons.find((w) => w.type === o.type)!;
    const d = WDEF[o.type!];
    const to = Math.min(d.max, w.level + n);
    badge = rt + " \u00B7 LV " + w.level + "\u2192" + to;
    name = d.name;
    desc = d.ups[Math.min(w.level, d.max - 1)] || "Power up";
    icon = ICONS[d.icon];
  } else if (o.kind === "plvl") {
    const d = PDEF[o.type!];
    const lv = player.passt[o.type as keyof typeof player.passt];
    const to = Math.min(d.max, lv + n);
    if (lv === 0 && rar === "common") el.classList.add("new");
    badge = rt + (lv === 0 ? " \u00B7 NEW" : " \u00B7 LV " + lv + "\u2192" + to);
    name = d.name;
    desc = d.desc;
    icon = ICONS[d.icon];
  } else if (o.kind === "heal") {
    el.classList.add("new");
    badge = "Recover";
    name = "Repair Kit";
    desc = "Restore 35% integrity";
    icon = ICONS.regen;
  } else {
    el.classList.add("new");
    badge = "Clear";
    name = "Overload";
    desc = "Wipe nearby enemies";
    icon = ICONS.nova;
  }
  el.innerHTML =
    '<div class="badge">' + badge + "</div>" + icon + '<div class="name">' + name + '</div><div class="desc">' + desc + "</div>";
  el.addEventListener("click", () => chooseOffer(o), { once: true });
  return el;
}

export function showGameOver(): void {
  const { run } = game;
  const canRevive = run.revivesLeft > 0 || sdkReady;
  $("go-title").textContent = canRevive ? "SECOND CHANCE" : "RUN OVER";
  $("go-sub").textContent = canRevive ? "Restore your ship and keep fighting" : "The swarm overwhelmed you";
  const mm = String(Math.floor(run.time / 60));
  const ss = String(Math.floor(run.time % 60));
  const tm = (mm.length < 2 ? "0" + mm : mm) + ":" + (ss.length < 2 ? "0" + ss : ss);
  $("go-stats").innerHTML =
    '<div class="stat"><b>' +
    tm +
    "</b><span>Survived</span></div>" +
    '<div class="stat"><b>' +
    run.kills +
    "</b><span>Kills</span></div>" +
    '<div class="stat"><b>' +
    run.level +
    "</b><span>Level</span></div>" +
    '<div class="stat"><b>' +
    score() +
    "</b><span>Score</span></div>";
  const rb = $("go-revive");
  if (canRevive) {
    rb.style.display = "block";
    rb.textContent = run.revivesLeft > 0 ? "\u25B6 Revive  (" + run.revivesLeft + " free)" : "\u25B6 Watch Ad \u2014 Revive";
  } else rb.style.display = "none";
  $("go-menu").textContent = canRevive ? "End Run" : "Main Menu";
  $("gameover").classList.add("show");
}

function metaCost(d: MetaDef, lv: number): number {
  return d.base * (lv + 1);
}

export function renderShop(): void {
  const wrap = $("shop");
  wrap.innerHTML = "";
  META_DEF.forEach((d) => {
    const lv = (meta.up as unknown as Record<string, number>)[d.key] || 0;
    const maxed = lv >= d.max;
    const cost = metaCost(d, lv);
    const row = document.createElement("div");
    row.className = "shoprow";
    let pips = "";
    for (let i = 0; i < d.max; i++) pips += '<span class="pip' + (i < lv ? " on" : "") + '"></span>';
    row.innerHTML = '<div class="nm">' + d.name + "<small>" + d.sub + '</small><div class="pips">' + pips + "</div></div>";
    const btn = document.createElement("button");
    btn.className = "buy" + (maxed ? " max" : "");
    if (maxed) {
      btn.textContent = "MAX";
      btn.disabled = true;
    } else {
      btn.textContent = "\u25C6 " + cost;
      btn.disabled = meta.cores < cost;
      btn.addEventListener("click", () => {
        if (meta.cores >= cost) {
          meta.cores -= cost;
          (meta.up as unknown as Record<string, number>)[d.key] = lv + 1;
          saveMeta();
          renderShop();
          $("m-cores").textContent = String(meta.cores);
        }
      });
    }
    row.appendChild(btn);
    wrap.appendChild(row);
  });
}

// Wire up the static overlay buttons. Called once during boot.
export function initOverlays(): void {
  $("go-revive").addEventListener("click", () => {
    if (game.run.revivesLeft > 0) {
      game.run.revivesLeft--;
      doRevive();
    } else {
      $("gameover").classList.remove("show");
      sdkRewarded(() => {
        doRevive();
      });
    }
  });
  $("go-menu").addEventListener("click", () => {
    finalizeRun();
    showMenu();
  });
  $("p-resume").addEventListener("click", resumeGame);
  $("p-quit").addEventListener("click", () => {
    finalizeRun();
    game.state = DEAD;
    showMenu();
  });
  $("m-play").addEventListener("click", () => {
    audioInit();
    audioResume();
    startRun();
  });
}
