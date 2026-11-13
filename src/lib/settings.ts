/**
 * App-wide practice settings (the tonic "Sa", reference pitch, volume).
 * Persisted in localStorage and broadcast with a window event so every
 * tool on the page — tanpura, tabla, tuner, swara player — stays in the
 * same key.
 */
import { westernHz, WESTERN_NOTES, type WesternNote } from './swara';

export interface Settings {
  saNote: WesternNote;
  saOctave: number;
  a4: number;
  volume: number; // 0..1 master volume
}

const KEY = 'flutonomy:settings:v1';
const EVENT = 'flutonomy:settings';

const DEFAULTS: Settings = {
  saNote: 'C',
  saOctave: 4,
  a4: 440,
  volume: 0.8,
};

let current: Settings | null = null;

function load(): Settings {
  if (current) return current;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    current = { ...DEFAULTS, ...parsed };
    if (!WESTERN_NOTES.includes(current!.saNote)) current!.saNote = DEFAULTS.saNote;
  } catch {
    current = { ...DEFAULTS };
  }
  return current!;
}

export function getSettings(): Settings {
  return load();
}

export function setSettings(patch: Partial<Settings>) {
  current = { ...load(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* storage may be unavailable (private mode) — keep in memory */
  }
  window.dispatchEvent(new CustomEvent<Settings>(EVENT, { detail: current }));
}

export function onSettings(fn: (s: Settings) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<Settings>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

/** Frequency of Sa in Hz for the current settings. */
export function saHz(s: Settings = load()): number {
  return westernHz(s.saNote, s.saOctave, s.a4);
}

export function saLabel(s: Settings = load()): string {
  return `${s.saNote}${s.saOctave}`;
}

/** Small helper for tiny per-tool preferences (bpm, taal choice, …). */
export function usePref<T>(name: string, fallback: T) {
  const key = `flutonomy:pref:${name}`;
  return {
    get(): T {
      try {
        const v = localStorage.getItem(key);
        return v == null ? fallback : (JSON.parse(v) as T);
      } catch {
        return fallback;
      }
    },
    set(v: T) {
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {
        /* ignore */
      }
    },
  };
}
