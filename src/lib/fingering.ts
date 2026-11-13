/**
 * Bansuri fingerings for a standard 6-hole flute, using the common
 * convention where Sa = top three holes closed.
 *
 * Holes are numbered 1–6 from the blowing end. 1 = closed, 0 = open,
 * 0.5 = half-holed. `breath` is a rough guide to air pressure.
 *
 * Every flute is a little different — use the tuner to check each note
 * and adjust by rolling the flute or shading holes.
 */
export type Hole = 0 | 0.5 | 1;

export interface Fingering {
  semis: number; // semitones from Sa (madhya Sa = 0)
  holes: [Hole, Hole, Hole, Hole, Hole, Hole];
  breath: 'soft' | 'medium' | 'strong';
  note?: string;
}

export const FINGERINGS: Fingering[] = [
  { semis: -5, holes: [1, 1, 1, 1, 1, 1], breath: 'soft' },
  { semis: -4, holes: [1, 1, 1, 1, 1, 0.5], breath: 'soft' },
  { semis: -3, holes: [1, 1, 1, 1, 1, 0], breath: 'soft' },
  { semis: -2, holes: [1, 1, 1, 1, 0.5, 0], breath: 'soft' },
  { semis: -1, holes: [1, 1, 1, 1, 0, 0], breath: 'soft' },
  { semis: 0, holes: [1, 1, 1, 0, 0, 0], breath: 'medium' },
  { semis: 1, holes: [1, 1, 0.5, 0, 0, 0], breath: 'medium' },
  { semis: 2, holes: [1, 1, 0, 0, 0, 0], breath: 'medium' },
  { semis: 3, holes: [1, 0.5, 0, 0, 0, 0], breath: 'medium' },
  { semis: 4, holes: [1, 0, 0, 0, 0, 0], breath: 'medium' },
  {
    semis: 5,
    holes: [0.5, 0, 0, 0, 0, 0],
    breath: 'medium',
    note: 'Half-hole the top hole. Some flutes prefer the cross-fingering ○●● ○○○ — check with the tuner.',
  },
  { semis: 6, holes: [0, 0, 0, 0, 0, 0], breath: 'medium' },
  { semis: 7, holes: [1, 1, 1, 1, 1, 1], breath: 'strong', note: 'Same fingering as mandra Pa — blow a little faster to jump an octave.' },
  { semis: 8, holes: [1, 1, 1, 1, 1, 0.5], breath: 'strong' },
  { semis: 9, holes: [1, 1, 1, 1, 1, 0], breath: 'strong' },
  { semis: 10, holes: [1, 1, 1, 1, 0.5, 0], breath: 'strong' },
  { semis: 11, holes: [1, 1, 1, 1, 0, 0], breath: 'strong' },
  { semis: 12, holes: [1, 1, 1, 0, 0, 0], breath: 'strong', note: 'Taar Sa: Sa fingering with faster, focused air.' },
];

export function fingeringFor(semis: number): Fingering | undefined {
  return FINGERINGS.find((f) => f.semis === semis);
}
