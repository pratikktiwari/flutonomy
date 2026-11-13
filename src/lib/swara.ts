/**
 * Swaras (notes) of Hindustani music, relative to the tonic Sa.
 *
 * ASCII sargam notation used across the app (Bhatkhande-style):
 *   S r R g G m M P d D n N
 *   lowercase r g d n = komal (flat), m = shuddh Ma, M = tivra (sharp) Ma
 *   prefix "." = mandra saptak (lower octave)   e.g. .N  .D  .P
 *   suffix "'" = taar saptak (upper octave)    e.g. S'  R'
 *   "-" = hold the previous note for one more beat, "," = rest
 */

export interface Swara {
  id: string; // ASCII symbol
  name: string; // romanised name
  short: string; // display short form
  hindi: string; // Devanagari
  semis: number; // semitones above Sa
  variant: 'shuddh' | 'komal' | 'tivra' | 'achal';
}

export const SWARAS: Swara[] = [
  { id: 'S', name: 'Sa', short: 'Sa', hindi: 'सा', semis: 0, variant: 'achal' },
  { id: 'r', name: 'Komal Re', short: 're', hindi: 'रे॒', semis: 1, variant: 'komal' },
  { id: 'R', name: 'Re', short: 'Re', hindi: 'रे', semis: 2, variant: 'shuddh' },
  { id: 'g', name: 'Komal Ga', short: 'ga', hindi: 'ग॒', semis: 3, variant: 'komal' },
  { id: 'G', name: 'Ga', short: 'Ga', hindi: 'ग', semis: 4, variant: 'shuddh' },
  { id: 'm', name: 'Ma', short: 'Ma', hindi: 'म', semis: 5, variant: 'shuddh' },
  { id: 'M', name: 'Tivra Ma', short: 'Ma♯', hindi: 'म॑', semis: 6, variant: 'tivra' },
  { id: 'P', name: 'Pa', short: 'Pa', hindi: 'प', semis: 7, variant: 'achal' },
  { id: 'd', name: 'Komal Dha', short: 'dha', hindi: 'ध॒', semis: 8, variant: 'komal' },
  { id: 'D', name: 'Dha', short: 'Dha', hindi: 'ध', semis: 9, variant: 'shuddh' },
  { id: 'n', name: 'Komal Ni', short: 'ni', hindi: 'नि॒', semis: 10, variant: 'komal' },
  { id: 'N', name: 'Ni', short: 'Ni', hindi: 'नि', semis: 11, variant: 'shuddh' },
];

export const SWARA_BY_ID: Record<string, Swara> = Object.fromEntries(SWARAS.map((s) => [s.id, s]));

export const WESTERN_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type WesternNote = (typeof WESTERN_NOTES)[number];

/** Frequency of a western note, A4 = 440 by default. */
export function westernHz(note: WesternNote, octave: number, a4 = 440): number {
  const midi = WESTERN_NOTES.indexOf(note) + (octave + 1) * 12;
  return a4 * Math.pow(2, (midi - 69) / 12);
}

/** Frequency of a note `semis` semitones above Sa (equal temperament). */
export function swaraHz(saHz: number, semis: number): number {
  return saHz * Math.pow(2, semis / 12);
}

/**
 * Just-intonation ratios (used by the tanpura so Pa and Ma sit perfectly
 * in tune with Sa, the way a real tanpura is tuned by ear).
 */
export const JUST_RATIOS: Record<number, number> = {
  0: 1,
  1: 16 / 15,
  2: 9 / 8,
  3: 6 / 5,
  4: 5 / 4,
  5: 4 / 3,
  6: 45 / 32,
  7: 3 / 2,
  8: 8 / 5,
  9: 5 / 3,
  10: 9 / 5,
  11: 15 / 8,
};

export interface ParsedNote {
  /** semitones from Sa, including octave (e.g. .N = -1, S' = 12) */
  semis: number | null; // null = rest
  swara: Swara | null;
  octave: -1 | 0 | 1;
  /** how many beats this note lasts (1 + number of following "-") */
  beats: number;
  token: string;
}

/** Parse a sargam string such as "S R G m | P - D N S'" into notes. */
export function parseSargam(input: string): ParsedNote[] {
  const tokens = input
    .replace(/\|/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const out: ParsedNote[] = [];
  for (const raw of tokens) {
    if (raw === '-') {
      const last = out[out.length - 1];
      if (last) last.beats += 1;
      continue;
    }
    if (raw === ',') {
      out.push({ semis: null, swara: null, octave: 0, beats: 1, token: raw });
      continue;
    }
    let t = raw;
    let octave: -1 | 0 | 1 = 0;
    if (t.startsWith('.')) {
      octave = -1;
      t = t.slice(1);
    }
    if (t.endsWith('.')) {
      octave = -1;
      t = t.slice(0, -1);
    }
    if (t.endsWith("'") || t.endsWith('’')) {
      octave = 1;
      t = t.slice(0, -1);
    }
    const swara = SWARA_BY_ID[t];
    if (!swara) continue;
    out.push({ semis: swara.semis + octave * 12, swara, octave, beats: 1, token: raw });
  }
  return out;
}

/** Label for a semitone offset from Sa, e.g. -1 -> ".Ni", 12 -> "Sa'" */
export function labelForSemis(semis: number, style: 'short' | 'hindi' = 'short'): string {
  const octave = Math.floor(semis / 12);
  const pc = ((semis % 12) + 12) % 12;
  const s = SWARAS[pc];
  const base = style === 'hindi' ? s.hindi : s.short;
  if (octave < 0) return '.' + base;
  if (octave > 0) return base + "'";
  return base;
}

/** Scales (thaats / raag note sets) used by the alankar generator. */
export const SCALES: Record<string, { label: string; notes: string[] }> = {
  bilawal: { label: 'Bilawal (all shuddh)', notes: ['S', 'R', 'G', 'm', 'P', 'D', 'N'] },
  yaman: { label: 'Yaman (tivra Ma)', notes: ['S', 'R', 'G', 'M', 'P', 'D', 'N'] },
  bhupali: { label: 'Bhupali (pentatonic)', notes: ['S', 'R', 'G', 'P', 'D'] },
  kafi: { label: 'Kafi (komal ga, ni)', notes: ['S', 'R', 'g', 'm', 'P', 'D', 'n'] },
  bhairav: { label: 'Bhairav (komal re, dha)', notes: ['S', 'r', 'G', 'm', 'P', 'd', 'N'] },
  khamaj: { label: 'Khamaj (komal ni)', notes: ['S', 'R', 'G', 'm', 'P', 'D', 'n'] },
};
