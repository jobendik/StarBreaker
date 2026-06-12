// Weapon, passive, evolution, meta-upgrade, ship, achievement and mission definitions.

import type { PassiveKey } from "../types";

export interface WeaponDef {
  name: string;
  icon: string;
  max: number;
  base: string;
  ups: string[];
  color: string;
  evoName: string;
  evoDesc: string;
  evoPassive: PassiveKey;
}

export const WDEF: Record<string, WeaponDef> = {
  pulse: {
    name: "Pulse Blaster",
    icon: "pulse",
    max: 7,
    base: "Auto-fires bolts at the nearest foe.",
    ups: ["", "+1 bolt", "+damage", "faster fire", "+1 bolt", "piercing shots", "+damage"],
    color: "#7df1ff",
    evoName: "HYPERION LANCE",
    evoDesc: "Bolts become piercing energy lances",
    evoPassive: "power",
  },
  spread: {
    name: "Scatter Laser",
    icon: "spread",
    max: 7,
    base: "Fires a spreading cone of bolts.",
    ups: ["", "+1 bolt", "+damage", "faster fire", "+1 bolt", "wider cone", "+damage"],
    color: "#8affc1",
    evoName: "SUPERNOVA ARRAY",
    evoDesc: "Massive arc of supercharged bolts",
    evoPassive: "haste",
  },
  orbital: {
    name: "Orbital Ring",
    icon: "orbital",
    max: 7,
    base: "Orbs circle you, shredding on contact.",
    ups: ["", "+1 orb", "wider orbit", "+damage", "+1 orb", "faster spin", "+1 orb"],
    color: "#9af2ff",
    evoName: "BLADE CYCLONE",
    evoDesc: "Orbs become massive shredding blades",
    evoPassive: "armor",
  },
  missile: {
    name: "Seeker Pods",
    icon: "missile",
    max: 7,
    base: "Homing missiles that blast on impact.",
    ups: ["", "+damage", "+1 missile", "bigger blast", "faster fire", "+1 missile", "+damage"],
    color: "#ffb24a",
    evoName: "CATACLYSM SWARM",
    evoDesc: "Twice the missiles, huge blasts",
    evoPassive: "magnet",
  },
  nova: {
    name: "Pulse Nova",
    icon: "nova",
    max: 7,
    base: "Releases an expanding shockwave.",
    ups: ["", "bigger wave", "+damage", "faster pulse", "bigger wave", "+damage", "faster pulse"],
    color: "#c08bff",
    evoName: "EVENT HORIZON",
    evoDesc: "Colossal wave that drags enemies in",
    evoPassive: "maxhp",
  },
  railgun: {
    name: "Rail Lance",
    icon: "railgun",
    max: 7,
    base: "Devastating beam that pierces everything.",
    ups: ["", "+damage", "faster charge", "+damage", "wider beam", "faster charge", "+damage"],
    color: "#ff9af2",
    evoName: "ANNIHILATOR",
    evoDesc: "Twin beams of total destruction",
    evoPassive: "crit",
  },
  tesla: {
    name: "Arc Coil",
    icon: "tesla",
    max: 7,
    base: "Lightning chains between nearby foes.",
    ups: ["", "+1 chain", "+damage", "faster zaps", "+1 chain", "+damage", "+1 chain"],
    color: "#aef0ff",
    evoName: "STORM CALLER",
    evoDesc: "Forked storm that chains far and wide",
    evoPassive: "greed",
  },
  glaive: {
    name: "Void Glaive",
    icon: "glaive",
    max: 7,
    base: "Boomerang blade that returns to you.",
    ups: ["", "+damage", "longer throw", "+1 glaive", "+damage", "longer throw", "+1 glaive"],
    color: "#d6ff7d",
    evoName: "TWIN REAVERS",
    evoDesc: "Huge twin blades carve the void",
    evoPassive: "speed",
  },
};

export interface PassiveDef {
  name: string;
  icon: string;
  max: number;
  desc: string;
}

export const PDEF: Record<string, PassiveDef> = {
  power: { name: "Overdrive", icon: "power", max: 6, desc: "+13% all damage" },
  haste: { name: "Coolant", icon: "haste", max: 6, desc: "+10% fire rate" },
  speed: { name: "Thrusters", icon: "speed", max: 6, desc: "+8% move speed" },
  maxhp: { name: "Plating", icon: "hp", max: 6, desc: "+25 max integrity" },
  magnet: { name: "Tractor Field", icon: "magnet", max: 6, desc: "+30% pickup range" },
  regen: { name: "Repair Bay", icon: "regen", max: 6, desc: "+0.6 integrity / s" },
  greed: { name: "Data Siphon", icon: "greed", max: 6, desc: "+15% XP gain" },
  armor: { name: "Deflectors", icon: "armor", max: 6, desc: "-10% damage taken" },
  crit: { name: "Targeting Array", icon: "crit", max: 6, desc: "+5% critical chance" },
};

export interface MetaDef {
  key: string;
  name: string;
  sub: string;
  max: number;
  base: number;
}

export const META_DEF: MetaDef[] = [
  { key: "hp", name: "Reinforced Hull", sub: "+20 starting integrity", max: 5, base: 40 },
  { key: "dmg", name: "Power Core", sub: "+6% starting damage", max: 5, base: 60 },
  { key: "spd", name: "Ion Drive", sub: "+4% move speed", max: 5, base: 60 },
  { key: "mag", name: "Magnetic Coils", sub: "+15% pickup range", max: 5, base: 40 },
  { key: "crit", name: "Targeting Suite", sub: "+2% critical chance", max: 5, base: 70 },
  { key: "dash", name: "Phase Capacitor", sub: "-8% dash cooldown", max: 5, base: 70 },
  { key: "core", name: "Salvage Rig", sub: "+10% cores earned", max: 5, base: 90 },
  { key: "rev", name: "Backup Reactor", sub: "+1 free revive", max: 1, base: 220 },
];

export interface ShipDef {
  id: string;
  name: string;
  role: string;
  desc: string;
  weapon: string;
  hp: number;
  speed: number;
  dmg: number;
  crit: number;
  dashCd: number;
  color: string;
  cost: number;
  unlock: { type: "start" | "sector" | "time" | "bosses"; v: number; label: string };
}

export const SHIPS: ShipDef[] = [
  {
    id: "vanguard",
    name: "VANGUARD",
    role: "Balanced fighter",
    desc: "Reliable all-rounder. Starts with the Pulse Blaster.",
    weapon: "pulse",
    hp: 0,
    speed: 1,
    dmg: 1,
    crit: 0,
    dashCd: 1,
    color: "#46e0ff",
    cost: 0,
    unlock: { type: "start", v: 0, label: "Standard issue" },
  },
  {
    id: "tempest",
    name: "TEMPEST",
    role: "Glass-cannon interceptor",
    desc: "+12% speed, fast dash, -15 hull. Starts with the Scatter Laser.",
    weapon: "spread",
    hp: -15,
    speed: 1.12,
    dmg: 1,
    crit: 0,
    dashCd: 0.8,
    color: "#8affc1",
    cost: 600,
    unlock: { type: "sector", v: 3, label: "Reach Sector 3" },
  },
  {
    id: "bastion",
    name: "BASTION",
    role: "Armored juggernaut",
    desc: "+40 hull, -8% speed. Starts with the Orbital Ring.",
    weapon: "orbital",
    hp: 40,
    speed: 0.92,
    dmg: 1,
    crit: 0,
    dashCd: 1.15,
    color: "#ffcf4a",
    cost: 900,
    unlock: { type: "time", v: 480, label: "Survive 8:00" },
  },
  {
    id: "reaper",
    name: "REAPER",
    role: "Critical striker",
    desc: "+15% damage, +10% crit, -20 hull. Starts with the Arc Coil.",
    weapon: "tesla",
    hp: -20,
    speed: 1.04,
    dmg: 1.15,
    crit: 0.1,
    dashCd: 1,
    color: "#ff5c8a",
    cost: 1200,
    unlock: { type: "bosses", v: 5, label: "Destroy 5 bosses (total)" },
  },
];

export function shipById(id: string): ShipDef {
  return SHIPS.find((s) => s.id === id) || SHIPS[0];
}

export interface AchDef {
  id: string;
  name: string;
  desc: string;
  reward: number;
}

export const ACH_DEF: AchDef[] = [
  { id: "firstblood", name: "FIRST BLOOD", desc: "Destroy your first enemy", reward: 10 },
  { id: "streak25", name: "RAMPAGE", desc: "Reach a 25 combo", reward: 20 },
  { id: "streak50", name: "UNSTOPPABLE", desc: "Reach a 50 combo", reward: 40 },
  { id: "godlike", name: "GODLIKE", desc: "Score a 6x multi-kill", reward: 25 },
  { id: "kills500", name: "SLAYER", desc: "500 kills in one run", reward: 30 },
  { id: "kills1500", name: "EXTERMINATOR", desc: "1500 kills in one run", reward: 60 },
  { id: "boss1", name: "SENTINEL SLAYER", desc: "Destroy a boss", reward: 15 },
  { id: "boss10", name: "BOSS HUNTER", desc: "Destroy 10 bosses (total)", reward: 40 },
  { id: "sector3", name: "DEEP SPACE", desc: "Reach Sector 3", reward: 25 },
  { id: "sector5", name: "VOID WALKER", desc: "Reach Sector 5", reward: 50 },
  { id: "evolve1", name: "ASCENSION", desc: "Evolve a weapon", reward: 30 },
  { id: "level20", name: "OVERCHARGED", desc: "Reach level 20 in one run", reward: 30 },
  { id: "dash100", name: "PHASE DANCER", desc: "Dash 100 times (total)", reward: 20 },
  { id: "titan", name: "TITANSBANE", desc: "Destroy the Void Titan", reward: 100 },
];

export const ACH_BY_ID: Record<string, AchDef> = {};
for (const a of ACH_DEF) ACH_BY_ID[a.id] = a;

export interface MissionDef {
  id: string;
  txt: string;
  stat: "kills" | "time" | "gems" | "elites" | "bosses" | "streak" | "level" | "dashes";
  target: number;
  reward: number;
}

export const MISSION_POOL: MissionDef[] = [
  { id: "m_kill250", txt: "Destroy 250 enemies in one run", stat: "kills", target: 250, reward: 40 },
  { id: "m_kill500", txt: "Destroy 500 enemies in one run", stat: "kills", target: 500, reward: 60 },
  { id: "m_time5", txt: "Survive 5:00 in one run", stat: "time", target: 300, reward: 40 },
  { id: "m_time8", txt: "Survive 8:00 in one run", stat: "time", target: 480, reward: 60 },
  { id: "m_gem150", txt: "Collect 150 XP shards in one run", stat: "gems", target: 150, reward: 40 },
  { id: "m_elite3", txt: "Defeat 3 elites in one run", stat: "elites", target: 3, reward: 40 },
  { id: "m_boss2", txt: "Destroy 2 bosses in one run", stat: "bosses", target: 2, reward: 50 },
  { id: "m_streak30", txt: "Reach a 30 combo", stat: "streak", target: 30, reward: 40 },
  { id: "m_level12", txt: "Reach level 12 in one run", stat: "level", target: 12, reward: 40 },
  { id: "m_dash20", txt: "Dash 20 times in one run", stat: "dashes", target: 20, reward: 30 },
];
