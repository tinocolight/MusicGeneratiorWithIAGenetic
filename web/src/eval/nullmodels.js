// Null models of "melody" used as negative examples for the critic and as baselines.
// They reproduce the classic comparison of Voss & Clarke (1975): white (independent),
// brown (random walk) and 1/f ("pink") pitch sequences, plus shuffled real melodies
// (same notes, destroyed order) that test the sequential structure only.

import { makeKey } from '../core/theory.js';

const STEPS = 128;

function diatonicPitches(key, lo, hi) {
  const out = [];
  for (let m = lo; m <= hi; m++) if (key.diatonic[((m % 12) + 12) % 12]) out.push(m);
  return out;
}

function corpusDurations(corpus) {
  const d = [];
  for (const m of corpus) for (const [p, dur] of m.events) if (p >= 0 && dur <= 16) d.push(dur);
  return d;
}

function fill(rng, nextPitch, durSampler, restProb = 0.06) {
  const ev = [];
  let t = 0;
  while (t < STEPS) {
    const d = Math.min(durSampler(), STEPS - t);
    if (t > 0 && rng.chance(restProb)) ev.push([-1, d]);
    else ev.push([nextPitch(), d]);
    t += d;
  }
  return ev;
}

export function nullMelody(type, rng, corpus) {
  const key = makeKey(rng.int(0, 11), rng.chance(0.5) ? 'major' : 'minor');
  const center = rng.int(64, 74);
  const scale = diatonicPitches(key, center - 12, center + 12);
  const durs = corpusDurations(corpus);
  const corpusDur = () => rng.pick(durs);
  const anyDur = () => rng.pick([1, 2, 3, 4, 6, 8]);
  switch (type) {
    case 'white-chromatic':
      return fill(rng, () => rng.int(center - 12, center + 12), anyDur, 0.1);
    case 'white-diatonic':
      return fill(rng, () => rng.pick(scale), corpusDur);
    case 'brown': {
      let idx = Math.floor(scale.length / 2);
      return fill(rng, () => {
        idx = Math.max(0, Math.min(scale.length - 1, idx + rng.pick([-2, -1, -1, 0, 1, 1, 2])));
        return scale[idx];
      }, corpusDur);
    }
    case 'pink': {
      const rows = new Array(5).fill(0).map(() => rng.float());
      let k = 0;
      return fill(rng, () => {
        for (let r = 0; r < rows.length; r++) if (k % (1 << r) === 0) rows[r] = rng.float();
        k++;
        const v = rows.reduce((a, b) => a + b, 0) / rows.length;
        return scale[Math.min(scale.length - 1, Math.floor(v * scale.length))];
      }, corpusDur);
    }
    case 'shuffled-pitch': {
      const m = rng.pick(corpus).events;
      const ps = rng.shuffle(m.filter(([p]) => p >= 0).map(([p]) => p));
      let i = 0;
      return m.map(([p, d]) => (p < 0 ? [p, d] : [ps[i++], d]));
    }
    case 'shuffled-rhythm': {
      const m = rng.pick(corpus).events;
      const ds = rng.shuffle(m.map(([, d]) => d));
      return m.map(([p], i) => [p, ds[i]]);
    }
    default:
      throw new Error(type);
  }
}

export const NULL_TYPES = ['white-chromatic', 'white-diatonic', 'brown', 'pink', 'shuffled-pitch', 'shuffled-rhythm'];
