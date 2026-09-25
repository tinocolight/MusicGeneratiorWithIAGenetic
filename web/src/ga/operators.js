// Variation operators.
//
// "binary" set  – emulates what the original program got from GeneticSharp:
//   FloatingPointChromosome = 8 bits per gene, UniformCrossover mixes *bits*, and
//   PartialShuffleMutation shuffles a random slice of the *bit string*. Decoded values
//   above 74 are clamped to 74 (prolongation), so bit-level variation is biased towards
//   long notes and rarely produces a small, musical change.
//
// "musical" set – musically meaningful operators from the GA-music literature:
//   Matic (2010): octave change, tone change, swap of consecutive notes;
//   Biles (1994, GenJam): transposition, inversion, retrograde and *sequence* of motifs;
//   plus rhythm split/merge, and an attractor-guided mutation that re-draws a pitch
//   inside the basin of the nearest attractor wave.

import { REST, HOLD, isNote, geneToMidi, midiToGene, clampGene } from '../core/score.js';
import { soundingLine } from '../core/analysis.js';
import { metricWeightFor, intervalQuality } from '../fitness/canon.js';

// ---------------------------------------------------------------- binary (classic)

export const decodeByte = (b) => (b > HOLD ? HOLD : b);

export function randomClassicGenome(length, rng) {
  // FloatingPointChromosome initialises each gene uniformly in [min, max] = [0, 74]
  return Array.from({ length }, () => rng.int(0, HOLD));
}

export function uniformBitCrossover(a, b, rng) {
  const c1 = new Array(a.length);
  const c2 = new Array(a.length);
  for (let i = 0; i < a.length; i++) {
    let x = 0;
    let y = 0;
    for (let bit = 7; bit >= 0; bit--) {
      const ba = (a[i] >> bit) & 1;
      const bb = (b[i] >> bit) & 1;
      if (rng.float() < 0.5) {
        x = (x << 1) | ba;
        y = (y << 1) | bb;
      } else {
        x = (x << 1) | bb;
        y = (y << 1) | ba;
      }
    }
    c1[i] = x;
    c2[i] = y;
  }
  return [c1, c2];
}

export function partialShuffleBits(genes, rng) {
  const bits = [];
  for (const g of genes) for (let bit = 7; bit >= 0; bit--) bits.push((g >> bit) & 1);
  let i = rng.int(0, bits.length - 1);
  let j = rng.int(0, bits.length - 2);
  if (j >= i) j++;
  if (i > j) [i, j] = [j, i];
  const slice = rng.shuffle(bits.slice(i, j + 1));
  for (let k = 0; k < slice.length; k++) bits[i + k] = slice[k];
  const out = new Array(genes.length);
  for (let g = 0; g < genes.length; g++) {
    let v = 0;
    for (let bit = 0; bit < 8; bit++) v = (v << 1) | bits[g * 8 + bit];
    out[g] = v;
  }
  return out;
}

// ---------------------------------------------------------------- musical

// One-beat rhythm cells (x = onset, - = hold, . = rest) used to build rhythmically
// plausible initial individuals ("random bounded" initialisation).
const BEAT_CELLS = [
  ['x---', 5], ['x-x-', 6], ['xxxx', 1.5], ['x-xx', 2], ['xx-x', 1], ['x--x', 1.5],
  ['----', 3], ['.-x-', 1], ['x-.-', 1], ['x.x.', 0.3],
];

/** Nearest diatonic pitch to a (fractional) MIDI value. */
export function snapToKey(midi, key) {
  const m = Math.round(midi);
  for (let d = 0; d <= 2; d++) {
    if (key.diatonic[(((m + d) % 12) + 12) % 12]) return m + d;
    if (key.diatonic[(((m - d) % 12) + 12) % 12]) return m - d;
  }
  return m;
}

/** Diatonic neighbour of `midi` in direction dir (+1/-1). */
export function scaleStep(midi, dir, key, steps = 1) {
  let m = midi;
  for (let s = 0; s < steps; s++) {
    m += dir;
    while (!key.diatonic[((m % 12) + 12) % 12]) m += dir;
  }
  return m;
}

function nearestWaveValue(env, i, midi) {
  let best = env.waves[0][i];
  for (const w of env.waves) if (Math.abs(w[i] - midi) < Math.abs(best - midi)) best = w[i];
  return best;
}

function samplePitch(env, i, rng) {
  const w = env.waves[rng.int(0, env.waves.length - 1)];
  const sigma = env.basin ?? 2.5;
  return clampMidi(env, snapToKey(w[i] + rng.gauss() * sigma, env.key));
}

const clampMidi = (env, m) => Math.max(env.lowMidi, Math.min(env.highMidi, m));
const setPitch = (genes, i, midi) => {
  genes[i] = clampGene(midiToGene(midi));
};

// ---------------------------------------------------------------- canon-aware choices

// How welcome an interval between two voices is, by kind and metric weight (strong/weak).
function consonanceFactor(iv, w) {
  const q = intervalQuality(iv).kind;
  if (q === 'imperfect') return 1;
  if (q === 'perfect') return 0.7;
  if (q === 'unison') return 0.35;
  if (q === 'fourth') return w >= 0.7 ? 0.25 : 0.6;
  return w >= 0.7 ? 0.03 : 0.3;
}

/**
 * Weight of candidate pitch c for melody index s: attraction of the waves x proximity to the
 * neighbours x consonance with every other voice that sounds when any voice plays index s,
 * x playability of c on every voice's instrument. `sounding[u]` is the pitch at index u (null =
 * silence or undecided); `onlyPast` restricts the constraints to indices before s.
 */
function candidateWeight(env, sounding, s, c, prev, next, onlyPast) {
  let w = 0.02;
  for (let k = 0; k < env.waves.length; k++) {
    const fn = env.basinFns ? env.basinFns[k] : (d, b) => Math.exp(-(d * d) / (2 * b * b));
    w = Math.max(w, fn(c - env.waves[k][s], env.basins ? env.basins[k] : env.basin ?? 3));
  }
  if (prev !== null) w *= Math.exp(-((c - prev) ** 2) / 18);
  if (next !== null) w *= Math.exp(-((c - next) ** 2) / 18);
  const canon = env.canon;
  if (!canon) return w;
  const n = sounding.length;
  for (const vi of canon.voices) {
    const pi = vi.map(c);
    if (vi.range && (pi < vi.range[0] || pi > vi.range[1])) w *= 0.05;
    const T = s + vi.delay;
    for (const vj of canon.voices) {
      if (vj === vi) continue;
      let u = T - vj.delay;
      if (canon.circular) u = ((u % n) + n) % n;
      if (u < 0 || u >= n || u === s || (onlyPast && u > s)) continue;
      const q = sounding[u];
      if (q === null || q === undefined) continue;
      w *= consonanceFactor(pi - vj.map(q), metricWeightFor(T, env.stepsPerBar));
    }
  }
  return w;
}

function diatonicRange(env) {
  const out = [];
  for (let m = env.lowMidi; m <= env.highMidi; m++) if (env.key.diatonic[((m % 12) + 12) % 12]) out.push(m);
  return out;
}

function sampleSharpened(rng, cands, weights) {
  return cands[rng.weighted(weights.map((x) => x * x))];
}

/**
 * Initial individual for a canon: the rhythm comes from beat cells, the pitches are chosen
 * left to right so that each new note already agrees with the voices sounding at that moment
 * — the canon is considered from the very first generation, not only by the fitness.
 */
export function randomCanonGenome(env, rng) {
  const template = randomMusicalGenome(env, rng); // rhythm (and a fallback pitch) template
  const genes = template.slice();
  const n = genes.length;
  const sounding = new Array(n).fill(null);
  const cands = diatonicRange(env);
  let prev = null;
  let cur = null;
  for (let s = 0; s < n; s++) {
    const g = genes[s];
    if (isNote(g)) {
      const weights = cands.map((c) => candidateWeight(env, sounding, s, c, prev, null, true));
      cur = sampleSharpened(rng, cands, weights);
      genes[s] = clampGene(midiToGene(cur));
      prev = cur;
    } else if (g === REST) cur = null;
    sounding[s] = cur;
  }
  return genes;
}

/**
 * Initial individual with no predefined patterns: every 16th is, with equal probability, a rest,
 * a prolongation or a chromatic note drawn uniformly from the instrument's range (no rhythmic
 * cells, no scale, no canon). Used to show the GA converging from noise.
 */
export function randomUniformGenome(env, rng) {
  const genes = Array.from({ length: env.length }, () => {
    const r = rng.int(0, 2);
    return r === 0 ? REST : r === 1 ? HOLD : clampGene(midiToGene(rng.int(env.lowMidi, env.highMidi)));
  });
  if (genes[0] === HOLD) genes[0] = REST;
  return genes;
}

export function randomMusicalGenome(env, rng) {
  const { length, stepsPerBar } = env;
  const genes = [];
  const weights = BEAT_CELLS.map((c) => c[1]);
  let last = null;
  while (genes.length < length) {
    const cell = BEAT_CELLS[rng.weighted(weights)][0];
    for (const ch of cell) {
      const i = genes.length;
      if (ch === 'x' || (ch === '-' && i === 0)) {
        let m = samplePitch(env, i, rng);
        if (last !== null && rng.chance(0.6)) m = clampMidi(env, scaleStep(last, rng.chance(0.5) ? 1 : -1, env.key, rng.int(1, 2)));
        genes.push(clampGene(midiToGene(m)));
        last = m;
      } else genes.push(ch === '-' ? HOLD : REST);
    }
  }
  genes.length = length;
  // end with a long note: last bar's final half is held
  const lastOnset = length - stepsPerBar / 2;
  if (!isNote(genes[lastOnset])) setPitch(genes, lastOnset, samplePitch(env, lastOnset, rng));
  for (let i = lastOnset + 1; i < length; i++) genes[i] = HOLD;
  return genes;
}

const noteIdx = (genes) => {
  const idx = [];
  for (let i = 0; i < genes.length; i++) if (isNote(genes[i])) idx.push(i);
  return idx;
};

export const MUSICAL_OPS = {
  /** tone change: move a note by one or two scale steps (Matic 2010) */
  step(g, env, rng) {
    const idx = noteIdx(g);
    if (!idx.length) return;
    const i = rng.pick(idx);
    setPitch(g, i, clampMidi(env, scaleStep(geneToMidi(g[i]), rng.chance(0.5) ? 1 : -1, env.key, rng.int(1, 2))));
  },
  /** octave change (Matic 2010) */
  octave(g, env, rng) {
    const idx = noteIdx(g);
    if (!idx.length) return;
    const i = rng.pick(idx);
    const m = geneToMidi(g[i]) + (rng.chance(0.5) ? 12 : -12);
    if (m >= env.lowMidi && m <= env.highMidi) setPitch(g, i, m);
  },
  /** swap the pitches of two consecutive notes (Matic 2010) */
  swap(g, env, rng) {
    const idx = noteIdx(g);
    if (idx.length < 2) return;
    const k = rng.int(0, idx.length - 2);
    [g[idx[k]], g[idx[k + 1]]] = [g[idx[k + 1]], g[idx[k]]];
  },
  /** attractor-guided: redraw a pitch inside the basin of the closest wave */
  attract(g, env, rng) {
    const idx = noteIdx(g);
    if (!idx.length) return;
    const i = rng.pick(idx);
    const target = nearestWaveValue(env, i, geneToMidi(g[i]));
    setPitch(g, i, clampMidi(env, snapToKey(target + rng.gauss() * (env.basin ?? 2.5) * 0.7, env.key)));
  },
  /** rhythm: split a held note in two */
  split(g, env, rng) {
    const holds = [];
    for (let i = 1; i < g.length; i++) if (g[i] === HOLD && isNote(prevNote(g, i))) holds.push(i);
    if (!holds.length) return;
    const i = rng.pick(holds);
    const p = geneToMidi(prevNote(g, i));
    setPitch(g, i, clampMidi(env, scaleStep(p, rng.chance(0.5) ? 1 : -1, env.key)));
  },
  /** rhythm: merge a note into the previous figure */
  merge(g, env, rng) {
    const idx = noteIdx(g).filter((i) => i > 0);
    if (!idx.length) return;
    g[rng.pick(idx)] = HOLD;
  },
  /** rhythm: turn a note into a rest or a rest into a note */
  rest(g, env, rng) {
    const i = rng.int(1, g.length - 1);
    if (isNote(g[i])) g[i] = REST;
    else if (g[i] === REST) setPitch(g, i, samplePitch(env, i, rng));
  },
  /** GenJam-style sequence: copy a bar (or half bar) elsewhere, transposed diatonically */
  sequence(g, env, rng) {
    const unit = rng.chance(0.7) ? env.stepsPerBar : env.stepsPerBar / 2;
    const n = g.length / unit;
    const from = rng.int(0, n - 1);
    let to = rng.int(0, n - 2);
    if (to >= from) to++;
    const shift = rng.pick([0, 0, 1, -1, 2, -2]);
    copySegment(g, from * unit, to * unit, unit, (m) => clampMidi(env, shift ? scaleStep(m, Math.sign(shift), env.key, Math.abs(shift)) : m));
  },
  /** GenJam-style inversion / retrograde of a half-bar (pitches only, rhythm kept) */
  invert(g, env, rng) {
    const unit = env.stepsPerBar / 2;
    const s = rng.int(0, g.length / unit - 1) * unit;
    const idx = noteIdx(g).filter((i) => i >= s && i < s + unit);
    if (idx.length < 2) return;
    const pitches = idx.map((i) => geneToMidi(g[i]));
    let out;
    if (rng.chance(0.5)) out = pitches.slice().reverse();
    else out = pitches.map((p) => clampMidi(env, snapToKey(2 * pitches[0] - p, env.key)));
    idx.forEach((i, k) => setPitch(g, i, out[k]));
  },
};

function prevNote(g, i) {
  for (let k = i - 1; k >= 0; k--) if (g[k] !== HOLD) return g[k];
  return REST;
}

function copySegment(g, from, to, len, mapPitch) {
  const src = g.slice(from, from + len);
  for (let k = 0; k < len; k++) {
    const v = src[k];
    g[to + k] = isNote(v) ? clampGene(midiToGene(mapPitch(geneToMidi(v)))) : v;
  }
  if (g[to] === HOLD && to > 0 && !isNote(prevNote(g, to))) g[to] = REST;
}

/** Canon-aware re-pitch: choose a note again, looking at every voice before and after it. */
function repitch(g, env, rng) {
  const idx = noteIdx(g);
  if (!idx.length) return;
  const k = rng.int(0, idx.length - 1);
  const s = idx[k];
  const sounding = soundingLine(g).pitch;
  const prev = k > 0 ? geneToMidi(g[idx[k - 1]]) : null;
  const next = k + 1 < idx.length ? geneToMidi(g[idx[k + 1]]) : null;
  const cands = diatonicRange(env);
  const weights = cands.map((c) => candidateWeight(env, sounding, s, c, prev, next, false));
  setPitch(g, s, sampleSharpened(rng, cands, weights));
}

export const MUSICAL_OP_WEIGHTS = {
  step: 5, octave: 0.5, swap: 1.5, attract: 3, split: 2, merge: 2, rest: 1, sequence: 1.5, invert: 0.7,
};

export function musicalMutate(genes, env, rng, strength = 1) {
  const names = Object.keys(MUSICAL_OP_WEIGHTS);
  const weights = names.map((n) => MUSICAL_OP_WEIGHTS[n]);
  if (env.canon) {
    names.push('repitch');
    weights.push(3);
  }
  const count = 1 + (rng.chance(0.4 * strength) ? 1 : 0) + (rng.chance(0.15 * strength) ? 1 : 0);
  for (let c = 0; c < count; c++) {
    const name = names[rng.weighted(weights)];
    (name === 'repitch' ? repitch : MUSICAL_OPS[name])(genes, env, rng);
  }
  if (genes[0] === HOLD) genes[0] = REST;
  return genes;
}

/** Two-point crossover with cut points on beat boundaries (keeps motifs intact). */
export function beatCrossover(a, b, rng, beat = 4) {
  const beats = a.length / beat;
  let x = rng.int(1, beats - 1);
  let y = rng.int(1, beats - 1);
  if (x > y) [x, y] = [y, x];
  const c = a.slice();
  for (let i = x * beat; i < y * beat; i++) c[i] = b[i];
  return c;
}
