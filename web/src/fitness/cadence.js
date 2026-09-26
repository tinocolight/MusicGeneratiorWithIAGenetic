// Ending formulas learned from real melodies (tools/build_cadences.mjs): how the last three notes
// move to the end (degrees of the key and the last step) and where and how long the last note is.
// The original program only asked for a long last note; this completes its "Score termination".

import { REST, HOLD } from '../core/score.js';

const ALPHA = 0.5;
const mod12 = (x) => ((x % 12) + 12) % 12;
const smooth = (row, n) => {
  const r = row ?? new Array(n).fill(0);
  const s = r.reduce((a, b) => a + b, 0) + ALPHA * n;
  return r.map((v) => (v + ALPHA) / s);
};

/** Raw counts -> smoothed probabilities (the same model the tool uses for its reference values). */
export function cadenceModel(counts) {
  const mode = (t) => ({
    n: t.n,
    p1: smooth(t.p1, 12),
    p2: t.p2.map((r) => smooth(r, 12)),
    p3: Array.from({ length: 144 }, (_, k) => smooth(t.p3[k], 12)),
    pint: t.pint.map((r) => smooth(r, 25)),
  });
  return { major: mode(counts.major), minor: mode(counts.minor), pos: smooth(counts.pos, 16), dur: smooth(counts.dur, 17), ref: counts.ref };
}

/** log P(ending): pcs = [antepenultimate, penultimate, last] relative to the tonic. */
export function cadenceLogP(model, mode, pcs, last, pos, dur) {
  const t = model[mode === 'minor' ? 'minor' : 'major'];
  const [x, y, z] = pcs;
  const move = Math.max(-12, Math.min(12, last));
  return Math.log(t.p1[z]) + Math.log(t.p2[z][y]) + Math.log(t.p3[z * 12 + y][x]) + Math.log(t.pint[z][move + 12]) +
    Math.log(model.pos[pos % 16]) + Math.log(model.dur[Math.min(16, dur)]);
}

/** The last three notes of a gene sequence (16th grid, MIDI = gene + 32). */
export function endingOfGenes(seq, tonic) {
  const notes = [];
  for (let i = 0; i < seq.length; i++) {
    const g = seq[i];
    if (g === REST || g === HOLD) continue;
    let d = 1;
    while (i + d < seq.length && seq[i + d] === HOLD) d++;
    notes.push({ midi: g + 32, on: i, d });
  }
  if (notes.length < 3) return null;
  const [a, b, c] = notes.slice(-3);
  return { pcs: [a, b, c].map((n) => mod12(n.midi - tonic)), last: c.midi - b.midi, pos: c.on % 16, dur: c.d };
}

/**
 * Score of the ending, on the scale of the other classic rules: (log P - median of real endings)
 * per bar, capped at the 90th percentile of real endings so that the GA does not chase one formula.
 */
export function cadenceScore(seq, model, tonic, mode) {
  const bars = seq.length / 16;
  const e = endingOfGenes(seq, tonic);
  if (!e) return (model.ref.p10 - model.ref.p50 - 10) * bars;
  const lp = Math.min(model.ref.p90, cadenceLogP(model, mode, e.pcs, e.last, e.pos, e.dur));
  return (lp - model.ref.p50) * bars;
}
