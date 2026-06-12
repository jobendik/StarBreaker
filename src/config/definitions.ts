// Weapon, passive, and meta-upgrade definitions.

export interface WeaponDef {
  name: string;
  icon: string;
  max: number;
  base: string;
  ups: string[];
}

export const WDEF: Record<string, WeaponDef> = {
  pulse: {
    name: "Pulse Blaster",
    icon: "pulse",
    max: 7,
    base: "Auto-fires bolts at the nearest foe.",
    ups: ["", "+1 bolt", "+damage", "faster fire", "+1 bolt", "piercing shots", "+damage"],
  },
  orbital: {
    name: "Orbital Ring",
    icon: "orbital",
    max: 7,
    base: "Orbs circle you, shredding on contact.",
    ups: ["", "+1 orb", "wider orbit", "+damage", "+1 orb", "faster spin", "+1 orb"],
  },
  spread: {
    name: "Scatter Laser",
    icon: "spread",
    max: 7,
    base: "Fires a spreading cone of bolts.",
    ups: ["", "+1 bolt", "+damage", "faster fire", "+1 bolt", "wider cone", "+damage"],
  },
  missile: {
    name: "Seeker Pods",
    icon: "missile",
    max: 7,
    base: "Homing missiles that blast on impact.",
    ups: ["", "+damage", "+1 missile", "bigger blast", "faster fire", "+1 missile", "+damage"],
  },
  nova: {
    name: "Pulse Nova",
    icon: "nova",
    max: 7,
    base: "Releases an expanding shockwave.",
    ups: ["", "bigger wave", "+damage", "faster pulse", "bigger wave", "+damage", "faster pulse"],
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
  crit: { name: "Targeting Array", icon: "power", max: 6, desc: "+5% critical chance" },
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
  { key: "rev", name: "Backup Reactor", sub: "+1 free revive", max: 1, base: 220 },
];

export const ACH: Record<string, string> = {
  firstblood: "FIRST BLOOD",
  streak10: "10 STREAK",
  streak25: "25 STREAK",
  streak50: "50 STREAK",
  godlike: "GODLIKE",
  slayer: "500 KILLS",
  sentinel: "SENTINEL SLAYER",
};
