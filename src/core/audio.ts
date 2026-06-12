// Procedural audio: tones, noise bursts, and throttled sound effects.

interface AudioManager {
  ctx: AudioContext | null;
  master: GainNode | null;
  muted: boolean;
  last: Record<string, number>;
}

export const AudioM: AudioManager = {
  ctx: null,
  master: null,
  muted: false,
  last: {},
};

export function audioInit(): void {
  if (AudioM.ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    AudioM.ctx = new AC();
    AudioM.master = AudioM.ctx.createGain();
    AudioM.master.gain.value = AudioM.muted ? 0 : 0.5;
    AudioM.master.connect(AudioM.ctx.destination);
  } catch (e) {
    /* ignore */
  }
}

export function audioResume(): void {
  try {
    AudioM.ctx && AudioM.ctx.state === "suspended" && AudioM.ctx.resume();
  } catch (e) {
    /* ignore */
  }
}

function tone(
  freq: number,
  dur: number,
  type?: OscillatorType,
  vol?: number,
  slideTo?: number,
): void {
  if (!AudioM.ctx || AudioM.muted) return;
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

function noise(dur: number, vol?: number, freq?: number): void {
  if (!AudioM.ctx || AudioM.muted) return;
  const t = AudioM.ctx.currentTime;
  const n = Math.floor(AudioM.ctx.sampleRate * dur);
  const buf = AudioM.ctx.createBuffer(1, n, AudioM.ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const sN = AudioM.ctx.createBufferSource();
  sN.buffer = buf;
  const f = AudioM.ctx.createBiquadFilter();
  f.type = "lowpass";
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
    if (throttled("shoot", 55)) tone(660, 0.05, "square", 0.05, 420);
  },
  spread() {
    if (throttled("spread", 70)) tone(520, 0.06, "sawtooth", 0.05, 300);
  },
  missile() {
    if (throttled("missile", 90)) tone(220, 0.12, "sawtooth", 0.07, 90);
  },
  nova() {
    tone(140, 0.3, "sine", 0.12, 60);
    noise(0.25, 0.12, 500);
  },
  hit() {
    if (throttled("hit", 32)) noise(0.04, 0.05, 2600);
  },
  explode() {
    if (throttled("explode", 60)) {
      noise(0.28, 0.22, 900);
      tone(90, 0.25, "sine", 0.12, 40);
    }
  },
  pickup() {
    if (throttled("pickup", 26)) tone(880, 0.045, "triangle", 0.04, 1320);
  },
  hurt() {
    noise(0.18, 0.2, 500);
    tone(180, 0.18, "square", 0.12, 70);
  },
  levelup() {
    [523, 659, 784, 1046].forEach(function (f, i) {
      setTimeout(function () {
        tone(f, 0.16, "triangle", 0.13);
      }, i * 70);
    });
  },
  revive() {
    [392, 523, 659, 880].forEach(function (f, i) {
      setTimeout(function () {
        tone(f, 0.2, "sine", 0.14);
      }, i * 80);
    });
  },
  boss() {
    tone(70, 0.7, "sawtooth", 0.18, 55);
    noise(0.5, 0.14, 400);
  },
};
