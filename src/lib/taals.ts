/**
 * Taal (rhythm cycle) definitions.
 *
 * Each matra (beat) holds one or more bols; multiple bols in a matra are
 * spread evenly across it (e.g. "Dha Ge" = two half-beats).
 *
 * `marks` uses the Bhatkhande convention for each vibhag (section):
 *   "X" = sam (first beat, clap), "0" = khali (wave of the hand),
 *   "2", "3", "4" = taali (claps).
 */
export interface Taal {
  id: string;
  name: string;
  hindi: string;
  matras: number;
  vibhags: number[];
  marks: string[];
  theka: string[][];
  feel: string;
  defaultBpm: number;
}

const t = (s: string) => s.split('|').map((m) => m.trim().split(/\s+/));

export const TAALS: Taal[] = [
  {
    id: 'teentaal',
    name: 'Teentaal',
    hindi: 'तीनताल',
    matras: 16,
    vibhags: [4, 4, 4, 4],
    marks: ['X', '2', '0', '3'],
    theka: t('Dha|Dhin|Dhin|Dha|Dha|Dhin|Dhin|Dha|Dha|Tin|Tin|Ta|Ta|Dhin|Dhin|Dha'),
    feel: 'The most common taal in Hindustani music — 16 beats in four even sections.',
    defaultBpm: 80,
  },
  {
    id: 'keherwa',
    name: 'Keherwa',
    hindi: 'कहरवा',
    matras: 8,
    vibhags: [4, 4],
    marks: ['X', '0'],
    theka: t('Dha|Ge|Na|Ti|Na|Ka|Dhi|Na'),
    feel: 'A light, swinging 8-beat cycle used for bhajans, folk and film songs.',
    defaultBpm: 100,
  },
  {
    id: 'dadra',
    name: 'Dadra',
    hindi: 'दादरा',
    matras: 6,
    vibhags: [3, 3],
    marks: ['X', '0'],
    theka: t('Dha|Dhi|Na|Dha|Ti|Na'),
    feel: 'A lilting 6-beat cycle — think of a waltz with an Indian accent.',
    defaultBpm: 110,
  },
  {
    id: 'rupak',
    name: 'Rupak',
    hindi: 'रूपक',
    matras: 7,
    vibhags: [3, 2, 2],
    marks: ['X0', '1', '2'],
    theka: t('Tin|Tin|Na|Dhi|Na|Dhi|Na'),
    feel: '7 beats (3+2+2). Unusually, the sam falls on a khali (open) beat.',
    defaultBpm: 90,
  },
  {
    id: 'jhaptaal',
    name: 'Jhaptaal',
    hindi: 'झपताल',
    matras: 10,
    vibhags: [2, 3, 2, 3],
    marks: ['X', '2', '0', '3'],
    theka: t('Dhi|Na|Dhi|Dhi|Na|Ti|Na|Dhi|Dhi|Na'),
    feel: '10 beats in an asymmetric 2+3+2+3 pattern.',
    defaultBpm: 90,
  },
  {
    id: 'ektaal',
    name: 'Ektaal',
    hindi: 'एकताल',
    matras: 12,
    vibhags: [2, 2, 2, 2, 2, 2],
    marks: ['X', '0', '2', '0', '3', '4'],
    theka: t('Dhin|Dhin|Dha Ge|Ti Ra Ki Ta|Tu|Na|Kat|Ta|Dha Ge|Ti Ra Ki Ta|Dhin|Na'),
    feel: '12 beats, often used for slow (vilambit) khayal.',
    defaultBpm: 70,
  },
];

export const TAAL_BY_ID = Object.fromEntries(TAALS.map((x) => [x.id, x]));

/** Per-matra info: which vibhag, whether it's the first beat of a vibhag, the mark. */
export function matraInfo(taal: Taal) {
  const out: { vibhag: number; first: boolean; mark: string | null }[] = [];
  taal.vibhags.forEach((len, v) => {
    for (let i = 0; i < len; i++) out.push({ vibhag: v, first: i === 0, mark: i === 0 ? taal.marks[v] : null });
  });
  return out;
}

export const LAYAS = [
  { id: 'vilambit', label: 'Vilambit', range: [30, 60] as const, hint: 'slow' },
  { id: 'madhya', label: 'Madhya', range: [60, 140] as const, hint: 'medium' },
  { id: 'drut', label: 'Drut', range: [140, 320] as const, hint: 'fast' },
];

export function layaFor(bpm: number) {
  return LAYAS.find((l) => bpm < l.range[1]) ?? LAYAS[LAYAS.length - 1];
}
