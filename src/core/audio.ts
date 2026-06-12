// Procedural audio: tones, noise bursts, throttled SFX, and a step-sequenced
// music engine whose intensity follows the action.

import { meta, saveMeta } from "./storage";

interface AudioManager {
  ctx: AudioContext | null;
  master: GainNode | null;
  musicGain: GainNode | null;
  muted: boolean;
  last: Record<string, number>;
}

export const AudioM: AudioManager = {
  ctx: null,
  master: null,
  musicGain: null,
  muted: false,
  last: {},
};

export function audioInit(): void {
  if (AudioM.ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    AudioM.ctx = new AC();
    AudioM.master = AudioM.ctx.createGain();
    AudioM.muted = meta.settings.muted;
    AudioM.master.gain.value = AudioM.muted ? 0 : 0.5;
    AudioM.master.connect(AudioM.ctx.destination);
    AudioM.musicGain = AudioM.ctx.createGain();
    AudioM.musicGain.gain.value = meta.settings.music ? 0.3 : 0;
    AudioM.musicGain.connect(AudioM.master);
    startMusic();
  } catch (e) {
    /* ignore */
  }
}

export function audioResume(): void {
  try {
    if (AudioM.ctx && AudioM.ctx.state === "suspended") AudioM.ctx.resume();
  } catch (e) {
    /* ignore */
  }
}

export function setMuted(m: boolean): void {
  AudioM.muted = m;
  meta.settings.muted = m;
  saveMeta();
  if (AudioM.master) AudioM.master.gain.value = m ? 0 : 0.5;
}

export function setMusicOn(on: boolean): void {
  meta.settings.music = on;
  saveMeta();
  if (AudioM.musicGain && AudioM.ctx)
    AudioM.musicGain.gain.linearRampToValueAtTime(on ? 0.3 : 0, AudioM.ctx.currentTime + 0.3);
}

export function setSfxOn(on: boolean): void {
  meta.settings.sfx = on;
  saveMeta();
}

function tone(freq: number, dur: number, type?: OscillatorType, vol?: number, slideTo?: number): void {
  if (!AudioM.ctx || AudioM.muted || !meta.settings.sfx) return;
  const t = AudioM.ctx.currentTime;
  const o = AudioM.ctx.createOscillator();
  const g = AudioM.ctx.createGain();
  o.type = type || "square";
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(AudioM.master!);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur: number, vol?: number, freq?: number, type?: BiquadFilterType): void {
  if (!AudioM.ctx || AudioM.muted || !meta.settings.sfx) return;
  const t = AudioM.ctx.currentTime;
  const n = Math.floor(AudioM.ctx.sampleRate * dur);
  const buf = AudioM.ctx.createBuffer(1, n, AudioM.ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const sN = AudioM.ctx.createBufferSource();
  sN.buffer = buf;
  const f = AudioM.ctx.createBiquadFilter();
  f.type = type || "lowpass";
  f.frequency.value = freq || 1200;
  const g = AudioM.ctx.createGain();
  g.gain.value = vol || 0.3;
  sN.connect(f);
  f.connect(g);
  g.connect(AudioM.master!);
  sN.start(t);
}

function throttled(key: string, ms: number): boolean {
  const t = performance.now();
  if ((AudioM.last[key] || 0) + ms > t) return false;
  AudioM.last[key] = t;
  return true;
}

export const sfx = {
  shoot() {
    if (throttled("shoot", 55)) tone(660, 0.05, "square", 0.04, 420);
  },
  spread() {
    if (throttled("spread", 70)) tone(520, 0.06, "sawtooth", 0.04, 300);
  },
  missile() {
    if (throttled("missile", 90)) tone(220, 0.12, "sawtooth", 0.06, 90);
  },
  nova() {
    tone(140, 0.3, "sine", 0.11, 60);
    noise(0.25, 0.1, 500);
  },
  rail() {
    if (throttled("rail", 120)) {
      tone(1200, 0.14, "sawtooth", 0.08, 180);
      noise(0.12, 0.1, 3000, "highpass");
    }
  },
  tesla() {
    if (throttled("tesla", 90)) {
      noise(0.08, 0.1, 2400, "highpass");
      tone(900, 0.06, "square", 0.04, 1400);
    }
  },
  glaive() {
    if (throttled("glaive", 110)) tone(340, 0.1, "triangle", 0.06, 520);
  },
  hit() {
    if (throttled("hit", 32)) noise(0.04, 0.045, 2600);
  },
  explode() {
    if (throttled("explode", 60)) {
      noise(0.28, 0.2, 900);
      tone(90, 0.25, "sine", 0.11, 40);
    }
  },
  bigExplode() {
    noise(0.5, 0.3, 700);
    tone(60, 0.55, "sine", 0.2, 28);
  },
  pickup() {
    if (throttled("pickup", 26)) tone(880, 0.045, "triangle", 0.035, 1320);
  },
  coin() {
    if (throttled("coin", 60)) {
      tone(988, 0.07, "triangle", 0.08);
      setTimeout(() => tone(1319, 0.12, "triangle", 0.08), 60);
    }
  },
  hurt() {
    noise(0.18, 0.18, 500);
    tone(180, 0.18, "square", 0.11, 70);
  },
  heart() {
    tone(58, 0.1, "sine", 0.16, 40);
  },
  dash() {
    if (throttled("dash", 150)) noise(0.16, 0.12, 1800, "bandpass");
  },
  levelup() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.16, "triangle", 0.12), i * 70));
  },
  evolve() {
    [392, 523, 659, 784, 1046, 1319].forEach((f, i) => setTimeout(() => tone(f, 0.22, "sawtooth", 0.07), i * 70));
    noise(0.6, 0.08, 1200);
  },
  revive() {
    [392, 523, 659, 880].forEach((f, i) => setTimeout(() => tone(f, 0.2, "sine", 0.13), i * 80));
  },
  boss() {
    tone(70, 0.7, "sawtooth", 0.16, 55);
    noise(0.5, 0.13, 400);
  },
  combo() {
    if (throttled("combo", 200)) tone(740, 0.09, "triangle", 0.07, 988);
  },
  mission() {
    [659, 880, 1109].forEach((f, i) => setTimeout(() => tone(f, 0.15, "triangle", 0.1), i * 90));
  },
  unlock() {
    [523, 784, 1046, 1568].forEach((f, i) => setTimeout(() => tone(f, 0.18, "triangle", 0.1), i * 80));
  },
  click() {
    tone(520, 0.04, "triangle", 0.05, 700);
  },
  gameover() {
    [392, 311, 233, 196].forEach((f, i) => setTimeout(() => tone(f, 0.32, "sawtooth", 0.07), i * 160));
  },
  victory() {
    [523, 659, 784, 1046, 784, 1046, 1319].forEach((f, i) => setTimeout(() => tone(f, 0.25, "triangle", 0.12), i * 110));
  },
};

// ── Music engine ────────────────────────────────────────────────────────────
// 64-step sequencer: kick / bass / hats / arp / pad. Intensity (0..1) opens
// extra layers; boss mode shifts the bass root for tension.

let musicTimer: ReturnType<typeof setInterval> | null = null;
let nextStep = 0;
let step = 0;
let intensity = 0.2;
let targetIntensity = 0.2;
let bossMode = false;

const STEP = 60 / 112 / 4; // 112 BPM, 16th notes
const BASS = [55, 55, 65.41, 49]; // A1 A1 C2 G1 (per bar)
const BASS_BOSS = [58.27, 58.27, 69.3, 51.91]; // Bb1 ... tension
const ARP = [220, 261.63, 329.63, 392, 440, 523.25];

export function musicSetIntensity(v: number): void {
  targetIntensity = Math.max(0, Math.min(1, v));
}

export function musicSetBoss(b: boolean): void {
  bossMode = b;
}

function mtone(
  freq: number,
  t: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  filterFreq?: number,
): void {
  const c = AudioM.ctx!;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  if (filterFreq) {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = filterFreq;
    g.connect(f);
    f.connect(AudioM.musicGain!);
  } else {
    g.connect(AudioM.musicGain!);
  }
  o.start(t);
  o.stop(t + dur + 0.03);
}

function mnoise(t: number, dur: number, vol: number, freq: number): void {
  const c = AudioM.ctx!;
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource();
  s.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = vol;
  s.connect(f);
  f.connect(g);
  g.connect(AudioM.musicGain!);
  s.start(t);
}

function playStep(s: number, t: number): void {
  const bar = Math.floor(s / 16) % 4;
  const st = s % 16;
  const roots = bossMode ? BASS_BOSS : BASS;
  const root = roots[bar];
  const cutoff = 280 + intensity * 1400;
  // Kick on quarters; extra off-beat kick at high intensity.
  if (st % 4 === 0) mtone(120, t, 0.13, "sine", 0.5, 200);
  if (bossMode && st % 8 === 6) mtone(110, t, 0.1, "sine", 0.35, 200);
  // Bass groove.
  if (st === 0 || st === 3 || st === 6 || st === 10 || st === 12) {
    const f = st === 6 ? root * 1.5 : root;
    mtone(f, t, 0.26, "sawtooth", 0.26, cutoff);
  }
  // Hats.
  if (intensity > 0.22 && st % 2 === 1) mnoise(t, 0.04, 0.035 + intensity * 0.05, 5200);
  // Arp opens up with intensity.
  if (intensity > 0.45 && st % 2 === 0) {
    const idx = (s * 7 + bar * 3) % ARP.length;
    mtone(ARP[idx] * (bossMode ? 1.06 : 1), t, 0.12, "triangle", 0.06 + intensity * 0.05, 2200);
  }
  // Pad swell at bar starts.
  if (st === 0 && bar % 2 === 0) {
    mtone(root * 2, t, 1.9, "sawtooth", 0.05, 700);
    mtone(root * 3, t, 1.9, "sawtooth", 0.04, 700);
  }
}

function startMusic(): void {
  if (musicTimer || !AudioM.ctx) return;
  nextStep = AudioM.ctx.currentTime + 0.1;
  musicTimer = setInterval(() => {
    if (!AudioM.ctx || AudioM.ctx.state !== "running") return;
    intensity += (targetIntensity - intensity) * 0.08;
    while (nextStep < AudioM.ctx.currentTime + 0.18) {
      playStep(step, nextStep);
      nextStep += STEP;
      step = (step + 1) % 64;
    }
  }, 60);
}
