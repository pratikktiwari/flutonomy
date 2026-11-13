/**
 * Synthesised instruments. Everything is generated in the browser — no
 * samples to download — so the app works offline and in any key.
 */
import { audio, bus, noiseBuffer } from './engine';

// ---------------------------------------------------------------------------
// Metronome click
// ---------------------------------------------------------------------------

export type ClickLevel = 'accent' | 'beat' | 'sub';

export function click(time: number, level: ClickLevel, out = bus('metronome')) {
  const c = audio();
  const freq = level === 'accent' ? 1760 : level === 'beat' ? 1180 : 880;
  const peak = level === 'accent' ? 0.9 : level === 'beat' ? 0.55 : 0.25;
  const osc = c.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, time);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(peak, time + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
  osc.connect(g).connect(out);
  osc.start(time);
  osc.stop(time + 0.08);
}

// ---------------------------------------------------------------------------
// Flute-like tone for playing swaras
// ---------------------------------------------------------------------------

/**
 * A soft, breathy bansuri-ish voice: a sine fundamental with a little
 * second/third harmonic, band-passed breath noise and delayed vibrato.
 */
export function fluteNote(
  freq: number,
  time: number,
  duration: number,
  { gain = 0.5, out = bus('swara') }: { gain?: number; out?: AudioNode } = {},
) {
  const c = audio();
  const end = time + duration;
  const attack = Math.min(0.07, duration * 0.3);
  const release = Math.min(0.12, duration * 0.4);

  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, time);
  env.gain.exponentialRampToValueAtTime(gain, time + attack);
  env.gain.setValueAtTime(gain, Math.max(time + attack, end - release));
  env.gain.exponentialRampToValueAtTime(0.0001, end);

  const tone = c.createGain();
  tone.connect(env);

  // Vibrato fades in after ~0.35s, like a player settling on a note
  const vib = c.createOscillator();
  vib.frequency.value = 5.2;
  const vibDepth = c.createGain();
  vibDepth.gain.setValueAtTime(0, time);
  vibDepth.gain.linearRampToValueAtTime(0, time + 0.35);
  vibDepth.gain.linearRampToValueAtTime(freq * 0.006, time + 0.8);
  vib.connect(vibDepth);

  const partials: [number, number][] = [
    [1, 1],
    [2, 0.18],
    [3, 0.06],
  ];
  const oscs: OscillatorNode[] = [];
  for (const [mult, amp] of partials) {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq * mult;
    vibDepth.connect(o.frequency);
    const g = c.createGain();
    g.gain.value = amp;
    o.connect(g).connect(tone);
    oscs.push(o);
  }

  // Breath
  const noise = c.createBufferSource();
  noise.buffer = noiseBuffer();
  noise.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq * 2;
  bp.Q.value = 1.4;
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.0001, time);
  ng.gain.exponentialRampToValueAtTime(0.09, time + 0.03);
  ng.gain.exponentialRampToValueAtTime(0.025, time + 0.25);
  noise.connect(bp).connect(ng).connect(env);

  env.connect(out);
  for (const o of [...oscs, vib]) {
    o.start(time);
    o.stop(end + 0.05);
  }
  noise.start(time, Math.random() * 0.5);
  noise.stop(end + 0.05);
}

// ---------------------------------------------------------------------------
// Tabla
// ---------------------------------------------------------------------------

/**
 * Tabla strokes. The dayan (right drum) is tuned to Sa; the bayan (left,
 * bass drum) gives the "ge" boom with its characteristic pitch glide.
 */
function dayan(time: number, saHz: number, decay: number, amp: number, out: AudioNode, bright = 1) {
  const c = audio();
  // Tabla dayan has nearly harmonic modes — that's why it has a clear pitch
  const modes: [number, number][] = [
    [1, 1],
    [2, 0.5 * bright],
    [3, 0.32 * bright],
    [4, 0.18 * bright],
    [5, 0.1 * bright],
  ];
  for (const [m, a] of modes) {
    const o = c.createOscillator();
    o.frequency.value = saHz * m;
    const g = c.createGain();
    const d = decay / (1 + (m - 1) * 0.6);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(amp * a, time + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, time + d);
    o.connect(g).connect(out);
    o.start(time);
    o.stop(time + d + 0.02);
  }
  // finger strike transient
  const n = c.createBufferSource();
  n.buffer = noiseBuffer();
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 2500;
  const ng = c.createGain();
  ng.gain.setValueAtTime(amp * 0.35, time);
  ng.gain.exponentialRampToValueAtTime(0.0001, time + 0.02);
  n.connect(hp).connect(ng).connect(out);
  n.start(time, Math.random() * 0.8);
  n.stop(time + 0.03);
}

function bayanGe(time: number, amp: number, out: AudioNode) {
  const c = audio();
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(95, time);
  o.frequency.exponentialRampToValueAtTime(130, time + 0.06); // the "gumki" lift
  o.frequency.exponentialRampToValueAtTime(88, time + 0.6);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(amp, time + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.7);
  o.connect(g).connect(out);
  o.start(time);
  o.stop(time + 0.75);
}

function bayanKe(time: number, amp: number, out: AudioNode) {
  const c = audio();
  const n = c.createBufferSource();
  n.buffer = noiseBuffer();
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 420;
  const g = c.createGain();
  g.gain.setValueAtTime(amp, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);
  n.connect(lp).connect(g).connect(out);
  n.start(time, Math.random() * 0.8);
  n.stop(time + 0.08);
}

/** Play a single bol (or compound like "dha", "dhin", "tirakita" part). */
export function tablaStroke(bol: string, time: number, saHz: number, accent = 1) {
  const out = bus('tabla');
  const b = bol.toLowerCase().replace(/[^a-z]/g, '');
  // Keep the dayan in a realistic register regardless of the flute's Sa
  let tuned = saHz;
  while (tuned > 420) tuned /= 2;
  while (tuned < 210) tuned *= 2;
  const a = 0.55 * accent;

  switch (b) {
    case 'dha':
      dayan(time, tuned, 0.55, a, out);
      bayanGe(time, a * 0.9, out);
      break;
    case 'dhin':
    case 'dhi':
      dayan(time, tuned, 0.3, a * 0.85, out, 0.6);
      bayanGe(time, a * 0.9, out);
      break;
    case 'na':
    case 'ta':
      dayan(time, tuned, 0.5, a, out);
      break;
    case 'tin':
    case 'ti':
      dayan(time, tuned, 0.22, a * 0.8, out, 0.5);
      break;
    case 'tu':
      dayan(time, tuned, 0.7, a * 0.9, out, 0.25);
      break;
    case 'ge':
    case 'ghe':
      bayanGe(time, a, out);
      break;
    case 'ke':
    case 'ka':
    case 'kat':
    case 'ki':
      bayanKe(time, a * 0.9, out);
      break;
    case 're':
    case 'ra':
    case 'te':
    case 'tit':
      dayan(time, tuned, 0.08, a * 0.6, out, 0.4);
      break;
    default:
      break; // "-" or unknown = rest
  }
}

// ---------------------------------------------------------------------------
// Tanpura
// ---------------------------------------------------------------------------

const tanpuraCache = new Map<string, AudioBuffer>();

/**
 * Render one tanpura string pluck into an AudioBuffer.
 *
 * Additive synthesis with ~40 harmonics. The tanpura's famous buzzing
 * shimmer ("jawari") comes from a bridge that keeps re-exciting high
 * overtones; we imitate it with a resonance (formant) that sweeps down
 * through the harmonic series over the life of the note, plus slow
 * per-harmonic beating.
 */
export function tanpuraBuffer(freq: number, seconds = 5.5): AudioBuffer {
  const c = audio();
  const key = `${freq.toFixed(3)}@${c.sampleRate}`;
  const cached = tanpuraCache.get(key);
  if (cached) return cached;

  const sr = c.sampleRate;
  const len = Math.floor(sr * seconds);
  const buf = c.createBuffer(2, len, sr);
  const L = buf.getChannelData(0);
  const R = buf.getChannelData(1);
  const maxH = Math.min(48, Math.floor(9000 / freq));

  // Pre-compute per-harmonic params
  const H = Array.from({ length: maxH }, (_, i) => {
    const k = i + 1;
    return {
      k,
      w: (2 * Math.PI * freq * k * (1 + 0.00012 * k * k)) / sr, // slight stiffness
      base: 1 / Math.pow(k, 0.85),
      phase: Math.random() * Math.PI * 2,
      beat: 0.15 + Math.random() * 0.6, // Hz
      pan: Math.random() * 0.6 - 0.3,
    };
  });

  const block = 64; // update amplitudes every 64 samples (cheap & smooth enough)
  const amps = new Float32Array(maxH);
  for (let s0 = 0; s0 < len; s0 += block) {
    const t = s0 / sr;
    const env = (1 - Math.exp(-t / 0.004)) * Math.exp(-t / 2.6);
    // formant centre sweeps from ~3.2 kHz down to ~700 Hz
    const fc = 700 + 2500 * Math.exp(-t / 1.1);
    const logFc = Math.log2(fc);
    for (let i = 0; i < maxH; i++) {
      const h = H[i];
      const d = Math.log2(freq * h.k) - logFc;
      const formant = 1 + 3.2 * Math.exp(-(d * d) / 0.18);
      const shimmer = 0.75 + 0.25 * Math.cos(2 * Math.PI * h.beat * t + h.phase);
      amps[i] = env * h.base * formant * shimmer;
    }
    const end = Math.min(len, s0 + block);
    for (let s = s0; s < end; s++) {
      let l = 0;
      let r = 0;
      for (let i = 0; i < maxH; i++) {
        const h = H[i];
        const v = Math.sin(h.w * s + h.phase) * amps[i];
        l += v * (0.5 - h.pan);
        r += v * (0.5 + h.pan);
      }
      L[s] = l;
      R[s] = r;
    }
  }
  // normalise
  let peak = 0;
  for (let s = 0; s < len; s++) peak = Math.max(peak, Math.abs(L[s]), Math.abs(R[s]));
  const norm = 0.6 / (peak || 1);
  for (let s = 0; s < len; s++) {
    L[s] *= norm;
    R[s] *= norm;
  }
  // short fade-out at the very end to avoid clicks
  const fade = Math.floor(sr * 0.05);
  for (let s = len - fade; s < len; s++) {
    const f = (len - s) / fade;
    L[s] *= f;
    R[s] *= f;
  }
  tanpuraCache.set(key, buf);
  return buf;
}

export function pluck(buffer: AudioBuffer, time: number, gain = 0.7, out = bus('tanpura')) {
  const c = audio();
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(g).connect(out);
  src.start(time);
  return src;
}
