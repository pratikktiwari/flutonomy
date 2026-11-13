/**
 * Shared Web Audio engine.
 *
 * - One AudioContext for the whole page, created lazily on the first user
 *   gesture (browsers block audio until then).
 * - A master bus (gain -> gentle compressor -> destination) so the tanpura,
 *   tabla and metronome can play together without clipping.
 * - A look-ahead Scheduler: audio events are queued slightly ahead of time
 *   on the audio clock (sample-accurate), while UI callbacks are fired from
 *   requestAnimationFrame at the moment each event is actually heard.
 */
import { getSettings, onSettings } from '../settings';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const buses = new Map<string, GainNode>();

export function audio(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new AC({ latencyHint: 'interactive' });
    master = ctx.createGain();
    master.gain.value = getSettings().volume;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    master.connect(comp).connect(ctx.destination);
    onSettings((s) => master && master.gain.setTargetAtTime(s.volume, ctx!.currentTime, 0.05));
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** A named sub-mix (e.g. "tanpura", "tabla") with its own volume. */
export function bus(name: string, initial = 1): GainNode {
  const c = audio();
  let g = buses.get(name);
  if (!g) {
    g = c.createGain();
    g.gain.value = initial;
    g.connect(master!);
    buses.set(name, g);
  }
  return g;
}

export function setBusVolume(name: string, v: number) {
  const g = bus(name);
  g.gain.setTargetAtTime(v, audio().currentTime, 0.04);
}

let noiseBuf: AudioBuffer | null = null;
/** 1 second of white noise, reused by percussive voices. */
export function noiseBuffer(): AudioBuffer {
  const c = audio();
  if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

export interface Tick {
  /** running step counter since start */
  step: number;
  /** audio-clock time this step sounds at */
  time: number;
  /** seconds this step lasts */
  duration: number;
}

export interface SchedulerOptions {
  /** seconds per step — read every step so tempo changes apply live */
  stepDuration: () => number;
  /** queue audio for a step (called ahead of time) */
  onSchedule: (tick: Tick) => void;
  /** update visuals for a step (called when the step is heard) */
  onVisual?: (tick: Tick) => void;
}

export class Scheduler {
  private opts: SchedulerOptions;
  private timer: number | null = null;
  private raf: number | null = null;
  private nextTime = 0;
  private step = 0;
  private queue: Tick[] = [];
  private readonly lookahead = 0.12; // seconds
  private readonly interval = 25; // ms
  running = false;

  constructor(opts: SchedulerOptions) {
    this.opts = opts;
  }

  start(startStep = 0) {
    if (this.running) return;
    const c = audio();
    this.running = true;
    this.step = startStep;
    this.nextTime = c.currentTime + 0.06;
    this.queue = [];
    this.timer = window.setInterval(() => this.pump(), this.interval);
    this.pump();
    const draw = () => {
      const now = c.currentTime;
      while (this.queue.length && this.queue[0].time <= now) {
        const t = this.queue.shift()!;
        this.opts.onVisual?.(t);
      }
      if (this.running) this.raf = requestAnimationFrame(draw);
    };
    this.raf = requestAnimationFrame(draw);
  }

  stop() {
    this.running = false;
    if (this.timer != null) clearInterval(this.timer);
    if (this.raf != null) cancelAnimationFrame(this.raf);
    this.timer = this.raf = null;
    this.queue = [];
  }

  private pump() {
    const c = audio();
    while (this.nextTime < c.currentTime + this.lookahead) {
      const duration = this.opts.stepDuration();
      const tick: Tick = { step: this.step, time: this.nextTime, duration };
      this.opts.onSchedule(tick);
      this.queue.push(tick);
      this.nextTime += duration;
      this.step++;
    }
  }
}

/** Only one transport-style tool should drive the page at a time unless
 *  the user explicitly layers them (practice room). This tiny registry lets
 *  tools stop each other when the "solo" behaviour is wanted. */
const stoppers = new Set<() => void>();
export function registerStopper(fn: () => void) {
  stoppers.add(fn);
  return () => stoppers.delete(fn);
}
export function stopAll() {
  stoppers.forEach((fn) => fn());
}
