// Shared low-level analysis of a genome (sounding pitch per step, onsets, phrases).

import { REST, HOLD, geneToMidi } from './score.js';

/** Sounding MIDI pitch at each step (null = silence) and onset flags. */
export function soundingLine(genes) {
  const n = genes.length;
  const pitch = new Array(n).fill(null);
  const onset = new Array(n).fill(false);
  let cur = null;
  for (let i = 0; i < n; i++) {
    const g = genes[i];
    if (g === REST) cur = null;
    else if (g !== HOLD) {
      cur = geneToMidi(g);
      onset[i] = true;
    } else if (i === 0) cur = null;
    pitch[i] = cur;
  }
  return { pitch, onset };
}

/** Metric weight of a 16th-note position in 4/4 (bar, half bar, beat, 8th, 16th). */
export function metricWeight(step, stepsPerBar = 16) {
  const p = step % stepsPerBar;
  if (p === 0) return 1;
  if (p === stepsPerBar / 2) return 0.85;
  if (p % 4 === 0) return 0.7;
  if (p % 2 === 0) return 0.4;
  return 0.2;
}

/** Moving average with a centred window. */
export function smooth(values, radius) {
  const out = new Float64Array(values.length);
  for (let i = 0; i < values.length; i++) {
    let s = 0;
    let c = 0;
    for (let k = Math.max(0, i - radius); k <= Math.min(values.length - 1, i + radius); k++) {
      s += values[k];
      c++;
    }
    out[i] = s / c;
  }
  return out;
}

export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
