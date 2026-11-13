/**
 * Play a list of swaras in time, with a callback for highlighting.
 * Shared by the Alankar trainer, Raag cards and lesson examples.
 */
import { Scheduler, audio, registerStopper } from './audio/engine';
import { fluteNote, click } from './audio/voices';
import { saHz } from './settings';
import { swaraHz, type ParsedNote } from './swara';

export interface SequenceOptions {
  bpm: () => number;
  loop?: () => boolean;
  /** soft click on every beat */
  pulse?: () => boolean;
  onNote?: (index: number) => void;
  onEnd?: () => void;
}

export function playSequence(notes: ParsedNote[], opts: SequenceOptions) {
  // Expand into one step per beat: [noteIndex, isOnset]
  const steps: { index: number; onset: boolean }[] = [];
  notes.forEach((n, i) => {
    for (let b = 0; b < n.beats; b++) steps.push({ index: i, onset: b === 0 });
  });
  if (!steps.length) return { stop() {} };

  let ended = false;
  const sched = new Scheduler({
    stepDuration: () => 60 / opts.bpm(),
    onSchedule: ({ step, time, duration }) => {
      const loop = opts.loop?.() ?? false;
      if (!loop && step >= steps.length) return;
      const s = steps[step % steps.length];
      const n = notes[s.index];
      if (opts.pulse?.()) click(time, step % steps.length === 0 ? 'accent' : 'sub');
      if (s.onset && n.semis != null) {
        fluteNote(swaraHz(saHz(), n.semis), time, duration * n.beats * 0.95);
      }
    },
    onVisual: ({ step }) => {
      const loop = opts.loop?.() ?? false;
      if (!loop && step >= steps.length) {
        if (!ended) {
          ended = true;
          handle.stop();
          opts.onEnd?.();
        }
        return;
      }
      const s = steps[step % steps.length];
      if (s.onset) opts.onNote?.(s.index);
    },
  });

  const unregister = registerStopper(() => handle.stop());
  const handle = {
    stop() {
      sched.stop();
      unregister();
    },
  };
  audio();
  sched.start();
  return handle;
}

/** Build alankar (practice pattern) note lists from a scale. */
export function alankar(scale: string[], pattern: string): string[][] {
  const up = [...scale, "S'"];
  const down = [...up].reverse();
  const groups = (arr: string[], k: number) => {
    const g: string[][] = [];
    for (let i = 0; i + k <= arr.length; i++) g.push(arr.slice(i, i + k));
    return g;
  };
  switch (pattern) {
    case 'aaroh-avroh':
      return [up, down.slice(1)];
    case 'pairs':
      return [...groups(up, 2), ...groups(down, 2)];
    case 'threes':
      return [...groups(up, 3), ...groups(down, 3)];
    case 'fours':
      return [...groups(up, 4), ...groups(down, 4)];
    case 'zigzag': {
      // S G R m G P …  (skip one, step back)
      const g: string[][] = [];
      for (let i = 0; i + 2 < up.length; i++) g.push([up[i], up[i + 2]]);
      for (let i = 0; i + 2 < down.length; i++) g.push([down[i], down[i + 2]]);
      return g;
    }
    default:
      return [up];
  }
}
