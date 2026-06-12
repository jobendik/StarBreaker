// DOM overlays: main menu (hangar/upgrades/missions/records tabs, daily cargo),
// level-up draft (with reroll/skip), pause (with settings), game-over, victory.

import { game, MENU, PLAYING, LEVELUP, PAUSED, DEAD } from "../core/state";
import { meta, saveMeta } from "../core/storage";
import { audioInit, audioResume, sfx, setMusicOn, setSfxOn, musicSetIntensity, musicPlay } from "../core/audio";
import { sdkReady, sdkStart, sdkStop, sdkHappy, sdkRewarded, sdkMidgame } from "../core/sdk";
import { WDEF, PDEF, META_DEF, MetaDef, SHIPS, ACH_DEF, WEAPON_SHOP, SKINS, skinById } from "../config/definitions";
import { ICONS } from "../config/icons";
import { fmtTime } from "../utils/math";
import { buildOffers, applyOffer } from "../systems/progression";
import {
  startRun,
  doRevive,
  finalizeRun,
  continueOverdrive,
  todaysMissions,
  ensureDaily,
  claimCargo,
  CARGO_REWARDS,
  cargoRewardForStreak,
} from "../systems/lifecycle";
import { toast } from "../systems/effects";
import type { CoreBreakdown, Offer, PassiveKey } from "../types";

function $(id: string): HTMLElement {
  return document.getElementById(id) as HTMLElement;
}

let lastBD: CoreBreakdown | null = null;
let curTab = "hangar";

export function hideAll(): void {
  ["menu", "levelup", "pause", "gameover", "victory"].forEach((i) => $(i).classList.remove("show"));
}

// ── Main menu ───────────────────────────────────────────────────────────────

export function showMenu(): void {
  game.state = MENU;
  musicSetIntensity(0.15);
  musicPlay("main_menu");
  hideAll();
  const daily = ensureDaily();
  $("m-cores").textContent = String(meta.cores);
  $("m-best").textContent = meta.best > 0 ? "BEST " + meta.best.toLocaleString() : "NO RUNS YET";
  const cargoBtn = $("m-cargo");
  cargoBtn.style.display = daily.cargoAvailable ? "flex" : "none";
  renderTab();
  $("menu").classList.add("show");
}

function setTab(t: string): void {
  curTab = t;
  document.querySelectorAll<HTMLElement>(".tab").forEach((el) => {
    el.classList.toggle("on", el.dataset.tab === t);
  });
  renderTab();
  sfx.click();
}

function renderTab(): void {
  ["hangar", "upgrades", "weapons", "skins", "missions", "records"].forEach((t) => {
    $("tab-" + t).style.display = t === curTab ? "block" : "none";
  });
  if (curTab === "hangar") renderHangar();
  else if (curTab === "upgrades") renderShop();
  else if (curTab === "weapons") renderWeapons();
  else if (curTab === "skins") renderSkins();
  else if (curTab === "missions") renderMissions();
  else renderRecords();
}

function statBars(label: string, v: number): string {
  let pips = "";
  for (let i = 0; i < 5; i++) pips += '<i class="' + (i < v ? "on" : "") + '"></i>';
  return '<div class="sbar"><span>' + label + '</span><div class="spips">' + pips + "</div></div>";
}

function renderHangar(): void {
  const wrap = $("tab-hangar");
  wrap.innerHTML = "";
  const row = document.createElement("div");
  row.className = "ships";
  for (const s of SHIPS) {
    const owned = meta.ships.indexOf(s.id) >= 0;
    const sel = meta.ship === s.id;
    const el = document.createElement("div");
    el.className = "ship" + (sel ? " sel" : "") + (owned ? "" : " locked");
    const spd = Math.round(s.speed * 3);
    const hp = s.hp >= 20 ? 5 : s.hp >= 0 ? 3 : 2;
    const dmg = s.dmg > 1 || s.crit > 0 ? 5 : 3;
    let action: string;
    if (sel) action = '<div class="shipstate sel">ACTIVE</div>';
    else if (owned) action = '<div class="shipstate">SELECT</div>';
    else
      action =
        '<div class="shipstate buy">◆ ' +
        s.cost +
        '</div><div class="unlockhint">or ' +
        s.unlock.label.toLowerCase() +
        "</div>";
    el.innerHTML =
      '<div class="shipicon" style="--sc:' +
      s.color +
      '">' +
      ICONS.ship +
      "</div>" +
      '<div class="shipname">' +
      s.name +
      "</div>" +
      '<div class="shiprole">' +
      s.role +
      "</div>" +
      '<div class="shipdesc">' +
      s.desc +
      "</div>" +
      statBars("HULL", hp) +
      statBars("SPD", spd) +
      statBars("PWR", dmg) +
      action;
    el.addEventListener("click", () => {
      if (owned) {
        meta.ship = s.id;
        saveMeta();
        sfx.click();
        renderHangar();
      } else if (meta.cores >= s.cost) {
        meta.cores -= s.cost;
        meta.ships.push(s.id);
        meta.ship = s.id;
        saveMeta();
        sfx.unlock();
        toast("SHIP PURCHASED", s.name + " is yours", "▲", true);
        $("m-cores").textContent = String(meta.cores);
        renderHangar();
      } else {
        sfx.click();
      }
    });
    row.appendChild(el);
  }
  wrap.appendChild(row);
}

function metaCost(d: MetaDef, lv: number): number {
  return d.base * (lv + 1);
}

function renderShop(): void {
  const wrap = $("tab-upgrades");
  wrap.innerHTML = "";
  META_DEF.forEach((d) => {
    const lv = (meta.up as unknown as Record<string, number>)[d.key] || 0;
    const maxed = lv >= d.max;
    const cost = metaCost(d, lv);
    const row = document.createElement("div");
    row.className = "shoprow";
    let pips = "";
    for (let i = 0; i < d.max; i++) pips += '<span class="pip' + (i < lv ? " on" : "") + '"></span>';
    row.innerHTML =
      '<div class="nm">' + d.name + "<small>" + d.sub + '</small><div class="pips">' + pips + "</div></div>";
    const btn = document.createElement("button");
    btn.className = "buy" + (maxed ? " max" : "");
    if (maxed) {
      btn.textContent = "MAX";
      btn.disabled = true;
    } else {
      btn.textContent = "◆ " + cost;
      btn.disabled = meta.cores < cost;
      btn.addEventListener("click", () => {
        if (meta.cores >= cost) {
          meta.cores -= cost;
          (meta.up as unknown as Record<string, number>)[d.key] = lv + 1;
          saveMeta();
          sfx.coin();
          renderShop();
          $("m-cores").textContent = String(meta.cores);
        }
      });
    }
    row.appendChild(btn);
    wrap.appendChild(row);
  });
}

function renderWeapons(): void {
  const wrap = $("tab-weapons");
  wrap.innerHTML = '<div class="dailyhead">WEAPONS<small>Unlocked weapons can appear in level-up drafts</small></div>';
  const owned = new Set(meta.weaponPool || []);
  for (const item of WEAPON_SHOP) {
    const d = WDEF[item.type];
    if (!d) continue;
    const inPool = owned.has(item.type);
    const row = document.createElement("div");
    row.className = "weaponrow" + (inPool ? " owned" : "");
    row.innerHTML =
      '<div class="weaponico" style="--wc:' +
      d.color +
      '">' +
      ICONS[d.icon] +
      "</div>" +
      '<div class="weaponcopy"><b>' +
      d.name +
      "</b><small>" +
      d.base +
      "</small></div>";
    const btn = document.createElement("button");
    btn.className = "buy" + (inPool ? " max" : "");
    if (inPool) {
      btn.textContent = "IN POOL";
      btn.disabled = true;
    } else {
      btn.textContent = "◆ " + item.cost;
      btn.disabled = meta.cores < item.cost;
      btn.addEventListener("click", () => {
        if (meta.cores < item.cost) return;
        meta.cores -= item.cost;
        if (meta.weaponPool.indexOf(item.type) < 0) meta.weaponPool.push(item.type);
        saveMeta();
        sfx.unlock();
        toast("WEAPON UNLOCKED", d.name + " added to the draft pool", "◆", true);
        $("m-cores").textContent = String(meta.cores);
        renderWeapons();
      });
    }
    row.appendChild(btn);
    wrap.appendChild(row);
  }
}

function renderSkins(): void {
  const wrap = $("tab-skins");
  const current = skinById(meta.skin);
  wrap.innerHTML =
    '<div class="dailyhead">SKINS<small>Active hull: ' +
    current.name +
    "</small></div>";
  const grid = document.createElement("div");
  grid.className = "skingrid";
  for (const s of SKINS) {
    const owned = meta.skins.indexOf(s.id) >= 0;
    const active = meta.skin === s.id;
    const el = document.createElement("div");
    el.className = "skin" + (active ? " sel" : "") + (owned ? "" : " locked");
    el.innerHTML =
      '<div class="skinpreview" style="--sc:' +
      s.color +
      ";--sa:" +
      s.accent +
      '">' +
      '<i class="shipshape ' +
      s.id +
      '"></i></div><div class="skinname">' +
      s.name +
      '</div><div class="shiprole">' +
      s.desc +
      "</div>";
    const action = document.createElement("div");
    action.className = "shipstate" + (!owned ? " buy" : active ? " sel" : "");
    action.textContent = active ? "ACTIVE" : owned ? "SELECT" : "◆ " + s.cost;
    el.appendChild(action);
    el.addEventListener("click", () => {
      if (owned) {
        meta.skin = s.id;
        saveMeta();
        sfx.click();
        renderSkins();
      } else if (meta.cores >= s.cost) {
        meta.cores -= s.cost;
        meta.skins.push(s.id);
        meta.skin = s.id;
        saveMeta();
        sfx.unlock();
        toast("SKIN UNLOCKED", s.name + " hull equipped", "▲", true);
        $("m-cores").textContent = String(meta.cores);
        renderSkins();
      } else {
        sfx.click();
      }
    });
    grid.appendChild(el);
  }
  wrap.appendChild(grid);
}

function renderMissions(): void {
  const wrap = $("tab-missions");
  const daily = ensureDaily();
  const claimable = daily.cargoAvailable;
  const nextReward = cargoRewardForStreak(meta.daily.streak);
  const activeDay = Math.min(meta.daily.streak + (claimable ? 1 : 0), CARGO_REWARDS.length);
  let bonus =
    '<div class="dailybonus"><div class="dailyhead">DAILY BONUS<small>Streak ' +
    meta.daily.streak +
    ' days</small></div><div class="bonusgrid">';
  for (let i = 0; i < CARGO_REWARDS.length; i++) {
    const day = i + 1;
    const claimed = day <= meta.daily.streak && !claimable;
    const active = day === activeDay && claimable;
    bonus +=
      '<div class="bonusday' +
      (claimed ? " claimed" : "") +
      (active ? " active" : "") +
      '"><span>DAY ' +
      day +
      "</span><b>◆ " +
      CARGO_REWARDS[i] +
      "</b></div>";
  }
  bonus +=
    '</div><button class="btn gold small" id="daily-claim"' +
    (claimable ? "" : " disabled") +
    ">" +
    (claimable ? "CLAIM ◆ " + nextReward : "CLAIMED TODAY") +
    "</button></div>";
  wrap.innerHTML =
    bonus +
    '<div class="dailyhead">DAILY MISSIONS<small>New objectives every day · streak ' +
    meta.daily.streak +
    "🔥</small></div>";
  const claimBtn = $("daily-claim") as HTMLButtonElement;
  claimBtn.addEventListener("click", () => {
    const amount = claimCargo();
    if (amount <= 0) return;
    $("m-cores").textContent = String(meta.cores);
    $("m-cargo").style.display = "none";
    toast("DAILY BONUS", "+" + amount + " ◆ claimed", "◆", true);
    sfx.unlock();
    renderMissions();
  });
  for (const m of todaysMissions()) {
    const done = meta.daily.done.indexOf(m.id) >= 0;
    const row = document.createElement("div");
    row.className = "mission" + (done ? " done" : "");
    row.innerHTML =
      '<div class="mtick">' +
      (done ? "✓" : "") +
      '</div><div class="mtxt">' +
      m.txt +
      '</div><div class="mreward">+' +
      m.reward +
      " ◆</div>";
    wrap.appendChild(row);
  }
  const hint = document.createElement("div");
  hint.className = "minihint";
  hint.textContent = "Complete missions in a single run · rewards collect automatically";
  wrap.appendChild(hint);
}

function renderRecords(): void {
  const wrap = $("tab-records");
  const s = meta.stats;
  wrap.innerHTML =
    '<div class="recstats">' +
    '<div class="rstat"><b>' +
    s.kills.toLocaleString() +
    "</b><span>Kills</span></div>" +
    '<div class="rstat"><b>' +
    s.runs +
    "</b><span>Runs</span></div>" +
    '<div class="rstat"><b>' +
    fmtTime(s.bestTime) +
    "</b><span>Best time</span></div>" +
    '<div class="rstat"><b>' +
    s.bosses +
    "</b><span>Bosses</span></div>" +
    "</div>" +
    '<div class="dailyhead">ACHIEVEMENTS<small>' +
    meta.ach.length +
    " / " +
    ACH_DEF.length +
    " unlocked</small></div>";
  const grid = document.createElement("div");
  grid.className = "achgrid";
  for (const a of ACH_DEF) {
    const got = meta.ach.indexOf(a.id) >= 0;
    const el = document.createElement("div");
    el.className = "ach" + (got ? " on" : "");
    el.innerHTML =
      '<div class="aname">' + (got ? "★ " : "☆ ") + a.name + '</div><div class="adesc">' + a.desc + '</div><div class="areward">+' + a.reward + " ◆</div>";
    grid.appendChild(el);
  }
  wrap.appendChild(grid);
}

// ── Pause ───────────────────────────────────────────────────────────────────

export function pauseGame(): void {
  if (game.state !== PLAYING) return;
  game.state = PAUSED;
  sdkStop();
  $("p-stat").textContent =
    "LV " + game.run.level + " · " + game.run.kills + " kills · sector " + game.run.sector;
  renderBuild($("p-build"), true);
  refreshToggles();
  $("pause").classList.add("show");
}

export function resumeGame(): void {
  if (game.state !== PAUSED) return;
  game.state = PLAYING;
  hideAll();
  game.last = performance.now();
  sdkStart();
}

function refreshToggles(): void {
  $("t-music").textContent = "MUSIC " + (meta.settings.music ? "ON" : "OFF");
  $("t-music").classList.toggle("off", !meta.settings.music);
  $("t-sfx").textContent = "SFX " + (meta.settings.sfx ? "ON" : "OFF");
  $("t-sfx").classList.toggle("off", !meta.settings.sfx);
  $("t-shake").textContent = "SHAKE " + (meta.settings.shake ? "ON" : "OFF");
  $("t-shake").classList.toggle("off", !meta.settings.shake);
  $("t-dmg").textContent = "DAMAGE № " + (meta.settings.dmgText ? "ON" : "OFF");
  $("t-dmg").classList.toggle("off", !meta.settings.dmgText);
}

// Current build summary (icons with level badges).
function renderBuild(el: HTMLElement, withPassives: boolean): void {
  const { player } = game;
  let html = "";
  for (const w of player.weapons) {
    const d = WDEF[w.type];
    html +=
      '<div class="bitem' +
      (w.evolved ? " evolved" : "") +
      '" title="' +
      d.name +
      '">' +
      ICONS[d.icon] +
      '<span class="blv">' +
      (w.evolved ? "EVO" : w.level) +
      "</span></div>";
  }
  if (withPassives) {
    for (const t in PDEF) {
      const lv = player.passt[t as PassiveKey];
      if (!lv) continue;
      html +=
        '<div class="bitem passive" title="' +
        PDEF[t].name +
        '">' +
        ICONS[PDEF[t].icon] +
        '<span class="blv">' +
        lv +
        "</span></div>";
    }
  }
  el.innerHTML = html;
}

// ── Level-up draft ──────────────────────────────────────────────────────────

export function openLevelUp(): void {
  game.state = LEVELUP;
  game.run.levelFlash = 0.6;
  sfx.levelup();
  sdkHappy();
  // Vacuum nearby gems so the board is clean when you return.
  for (const g of game.gems) {
    const d = Math.hypot(g.x - game.player.x, g.y - game.player.y);
    if (d < 320) g.mag = true;
  }
  const t = String(game.run.level);
  $("lv-title").textContent = "LEVEL " + (t.length < 2 ? "0" + t : t);
  renderBuild($("lv-build"), true);
  renderOffers();
  $("levelup").classList.add("show");
}

function renderOffers(): void {
  const offers = buildOffers();
  const wrap = $("lv-cards");
  wrap.innerHTML = "";
  offers.forEach((o, i) => {
    const c = makeCard(o);
    c.style.animationDelay = i * 0.07 + "s";
    wrap.appendChild(c);
  });
  const rr = $("lv-reroll") as HTMLButtonElement;
  rr.textContent = "⟳ REROLL (" + game.run.rerolls + ")";
  rr.disabled = game.run.rerolls <= 0;
}

function closeLevelUp(): void {
  game.run.pendingLevel--;
  if (game.run.pendingLevel > 0) {
    openLevelUp();
  } else {
    game.state = PLAYING;
    hideAll();
    game.last = performance.now();
  }
}

function chooseOffer(o: Offer): void {
  applyOffer(o);
  sfx.click();
  closeLevelUp();
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
  if (o.kind === "evo") {
    el.classList.add("evo");
    const d = WDEF[o.type!];
    badge = "⚡ EVOLUTION";
    name = d.evoName;
    desc = d.evoDesc;
    icon = ICONS[d.icon];
  } else if (o.kind === "wnew") {
    if (rar === "common") el.classList.add("new");
    const d = WDEF[o.type!];
    badge = rt + (n > 1 ? " · NEW LV" + Math.min(d.max, n) : " · NEW");
    name = d.name;
    desc = d.base;
    icon = ICONS[d.icon];
  } else if (o.kind === "wlvl") {
    const w = player.weapons.find((w) => w.type === o.type)!;
    const d = WDEF[o.type!];
    const to = Math.min(d.max, w.level + n);
    badge = rt + " · LV " + w.level + "→" + to;
    name = d.name;
    desc = d.ups[Math.min(w.level, d.max - 1)] || "Power up";
    if (to >= d.max) desc += " · evolves with " + PDEF[d.evoPassive].name;
    icon = ICONS[d.icon];
  } else if (o.kind === "plvl") {
    const d = PDEF[o.type!];
    const lv = player.passt[o.type as PassiveKey];
    const to = Math.min(d.max, lv + n);
    if (lv === 0 && rar === "common") el.classList.add("new");
    badge = rt + (lv === 0 ? " · NEW" : " · LV " + lv + "→" + to);
    name = d.name;
    desc = d.desc;
    icon = ICONS[d.icon];
  } else if (o.kind === "heal") {
    el.classList.add("new");
    badge = "RECOVER";
    name = "Repair Kit";
    desc = "Restore 35% integrity";
    icon = ICONS.heal;
  } else if (o.kind === "greed") {
    el.classList.add("new");
    badge = "SALVAGE";
    name = "Core Cache";
    desc = "+15 cores, instantly";
    icon = ICONS.coin;
  } else {
    el.classList.add("new");
    badge = "CLEAR";
    name = "Overload";
    desc = "Wipe nearby enemies";
    icon = ICONS.bomb;
  }
  el.innerHTML =
    '<div class="badge">' + badge + "</div>" + icon + '<div class="name">' + name + '</div><div class="desc">' + desc + "</div>";
  el.addEventListener("click", () => chooseOffer(o), { once: true });
  return el;
}

// ── Game over / victory ─────────────────────────────────────────────────────

function statGrid(): string {
  const { run } = game;
  return (
    '<div class="stat"><b>' +
    fmtTime(run.time) +
    "</b><span>Survived</span></div>" +
    '<div class="stat"><b>' +
    run.kills.toLocaleString() +
    "</b><span>Kills</span></div>" +
    '<div class="stat"><b>' +
    run.level +
    "</b><span>Level</span></div>" +
    '<div class="stat"><b>' +
    run.score.toLocaleString() +
    "</b><span>Score</span></div>"
  );
}

export function showGameOver(): void {
  const { run } = game;
  const canFree = run.revivesLeft > 0;
  const canAd = sdkReady && run.adRevivesLeft > 0;
  if (canFree || canAd) {
    $("go-title").textContent = "SECOND CHANCE";
    ($("go-title") as HTMLElement).style.color = "var(--gold)";
    $("go-sub").textContent = "Restore your ship and keep fighting";
    $("go-stats").innerHTML = statGrid();
    $("go-cores").innerHTML = "";
    $("go-cores").style.display = "none";
    const rb = $("go-revive");
    rb.style.display = "block";
    rb.textContent = canFree ? "▶ REVIVE  (" + run.revivesLeft + " FREE)" : "▶ WATCH AD — REVIVE";
    $("go-retry").style.display = "none";
    $("go-menu").textContent = "GIVE UP";
  } else {
    showFinal("RUN OVER", "The swarm overwhelmed you");
    return;
  }
  $("gameover").classList.add("show");
}

function showFinal(title: string, sub: string): void {
  const { run } = game;
  if (!run.finalized) lastBD = finalizeRun();
  const bd = lastBD || { scoreCores: 0, coins: 0, missions: [], total: 0, newBest: false };
  hideAll();
  $("go-title").textContent = title;
  ($("go-title") as HTMLElement).style.color = title === "VICTORY" ? "var(--gold)" : "var(--pink)";
  $("go-sub").textContent = bd.newBest ? "★ NEW BEST SCORE ★" : sub;
  $("go-stats").innerHTML = statGrid();
  let ch =
    '<div class="crow"><span>Combat salvage</span><b>+' +
    bd.scoreCores +
    " ◆</b></div>" +
    '<div class="crow"><span>Cores collected</span><b>+' +
    bd.coins +
    " ◆</b></div>";
  for (const m of bd.missions) ch += '<div class="crow mission-row"><span>✓ ' + m.name + "</span><b>+" + m.reward + " ◆</b></div>";
  ch += '<div class="crow total"><span>TOTAL EARNED</span><b>+' + bd.total + " ◆</b></div>";
  $("go-cores").innerHTML = ch;
  $("go-cores").style.display = "block";
  $("go-revive").style.display = "none";
  $("go-retry").style.display = "block";
  $("go-menu").textContent = "MAIN MENU";
  $("gameover").classList.add("show");
}

export function showVictory(): void {
  musicPlay("game_over");
  $("v-stats").innerHTML = statGrid();
  $("victory").classList.add("show");
}

// ── One-time wiring ─────────────────────────────────────────────────────────

export function initOverlays(): void {
  document.querySelectorAll<HTMLElement>(".tab").forEach((el) => {
    el.addEventListener("click", () => setTab(el.dataset.tab || "hangar"));
  });

  $("m-play").addEventListener("click", () => {
    audioInit();
    audioResume();
    sfx.click();
    startRun();
  });

  $("m-cargo").addEventListener("click", () => {
    audioInit();
    audioResume();
    const amount = claimCargo();
    if (amount > 0) {
      toast("DAILY CARGO", "+" + amount + " ◆ · streak " + meta.daily.streak + " days", "📦", true);
      sfx.unlock();
      $("m-cores").textContent = String(meta.cores);
      $("m-cargo").style.display = "none";
    }
  });

  $("go-revive").addEventListener("click", () => {
    audioInit();
    audioResume();
    if (game.run.revivesLeft > 0) {
      game.run.revivesLeft--;
      doRevive();
    } else {
      $("gameover").classList.remove("show");
      sdkRewarded((ok) => {
        if (ok) {
          game.run.adRevivesLeft--;
          doRevive();
        } else {
          showFinal("RUN OVER", "The swarm overwhelmed you");
        }
      });
    }
  });
  $("go-retry").addEventListener("click", () => {
    audioInit();
    audioResume();
    sfx.click();
    sdkMidgame(() => startRun(), game.run.time);
  });
  $("go-menu").addEventListener("click", () => {
    if (game.run.finalized) {
      sfx.click();
      showMenu();
    } else {
      // "Give up" from the revive offer → reveal earnings.
      showFinal("RUN OVER", "The swarm overwhelmed you");
    }
  });

  $("v-continue").addEventListener("click", () => {
    audioInit();
    audioResume();
    sfx.click();
    continueOverdrive();
  });
  $("v-finish").addEventListener("click", () => {
    sfx.click();
    showFinal("VICTORY", "The sector is cleared");
  });

  $("p-resume").addEventListener("click", resumeGame);
  $("p-restart").addEventListener("click", () => {
    finalizeRun();
    sfx.click();
    startRun();
  });
  $("p-quit").addEventListener("click", () => {
    finalizeRun();
    game.state = DEAD;
    sfx.click();
    showMenu();
  });
  $("t-music").addEventListener("click", () => {
    setMusicOn(!meta.settings.music);
    refreshToggles();
    sfx.click();
  });
  $("t-sfx").addEventListener("click", () => {
    setSfxOn(!meta.settings.sfx);
    refreshToggles();
    sfx.click();
  });
  $("t-shake").addEventListener("click", () => {
    meta.settings.shake = !meta.settings.shake;
    saveMeta();
    refreshToggles();
    sfx.click();
  });
  $("t-dmg").addEventListener("click", () => {
    meta.settings.dmgText = !meta.settings.dmgText;
    saveMeta();
    refreshToggles();
    sfx.click();
  });

  $("lv-reroll").addEventListener("click", () => {
    if (game.run.rerolls <= 0) return;
    game.run.rerolls--;
    sfx.click();
    renderOffers();
  });
  $("lv-skip").addEventListener("click", () => {
    sfx.click();
    closeLevelUp();
  });
}
