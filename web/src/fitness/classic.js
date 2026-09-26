// Rule-by-rule port of AlgorithmFitness.RankWithTresholds2 (GeneticMusic/AlgorithmFitness.cs).
//
// Differences with the C# code (all documented in web/README.md):
//  * the rules run sequentially: in C# every rule accumulated `result +=` inside
//    Parallel.For without synchronisation (lost updates => noisy, non-reproducible fitness);
//  * the two sine waves are always computed with the right length (in C# `onda1` is sized
//    with the static `lenghtSequence` *before* the constructor sets it, so on the first run
//    wave 1 is a flat line at gene 0);
//  * phase switching (weight group 1 -> group 2) uses the generation counter instead of the
//    wall clock, so runs are reproducible;
//  * with `strict: false` (default) two assignment typos are fixed:
//      `result = 2f`   (step interval, EvaluateInterestingIntervalsCore) -> `result += 2`
//      `result = +10f` (whole-beat figure, EvaluateInterestingRitmicPatterns) -> `result += 10`
//    `strict: true` keeps the literal (sequential) semantics, used by the parity test.
//  * with `fixLapses: true` five slips of the original are corrected (the page does this by
//    default; results/classic-study.md):
//      - range: notes beyond 3x the range get -8 as written, the branch was unreachable;
//      - pauses/prolongations: a prolongation of a prolongation gets +0.5 as written, the branch
//        was unreachable (it got +2, like the first prolongation of a note);
//      - balance: finite with no pauses or prolongations (the division by 0 gave -Infinity);
//      - interesting repetitions: notes only (`!= pause || == prolongation` also compared
//        prolongations; the authors fixed the same condition in the intervals rule);
//      - rhythmic patterns: the bonus for a figure at the start of the bar looked one 16th late;
//  * `cadence` (weight 0 in the original) completes the ending rule with the ways real melodies
//    end (src/fitness/cadence.js); `balanceMin`/`balanceMax` expose the hard-coded [7, 40] %.

import { REST as PAUSE, HOLD as PROL, GENE_A4, HIGHEST_NOTE_GENE, STEPS_PER_BAR } from '../core/score.js';
import { SCALE_TABLE } from '../core/theory.js';
import { classicSine } from '../core/waves.js';
import { MAJOR_TONICS } from '../core/theory.js';
import { cadenceModel, cadenceScore } from './cadence.js';
import cadenceData from '../data/cadence-data.js';

let cadence = null;
const cadenceModelOnce = () => (cadence ||= cadenceModel(cadenceData));

// Default values shown in the Windows Forms GUI (Form1.cs), i.e. what the authors used.
export const CLASSIC_DEFAULTS = {
  scale: 1, // G / Em
  major: true,
  bars: 8,
  phase1Fraction: 0.25, // firstGroupPercent = 25
  rangeAttractor: 15,
  balanceMin: 7,
  balanceMax: 40,
  rangeAnnealEvaluations: 600, // maxIteration = 300 * 200 * 0.01
  g1: {
    rhythmicPatterns: 10, selfHarm1: 1, selfHarm2: 4, aba: 0.5, leitmotif: 12, wave1: 3, wave2: 2,
    range: 42, scale: 12, pauseProlongation: 4.5, reduceRepetitions: 2, intervals: 12,
    niceRepetitions: 10, ending: 2, balance: 5, cadence: 0,
  },
  g2: {
    rhythmicPatterns: 7.02, selfHarm1: 2, selfHarm2: 4, aba: 0.5, leitmotif: 16, wave1: 3.1, wave2: 2.15,
    range: 42, scale: 16, pauseProlongation: 4, reduceRepetitions: 2, intervals: 14,
    niceRepetitions: 10.05, ending: 2, balance: 15, cadence: 0,
  },
  waves: [
    { threshold: 3, periodsPerBar: 0.5, amplitude: 12, mean: GENE_A4, shift: 0 },
    // amplitude 4: Form1's constructor copies the ConfigurationValues default over its own "5"
    { threshold: 2, periodsPerBar: 2, amplitude: 4, mean: GENE_A4 - 7, shift: 0 },
  ],
};

const isNote = (g) => g !== PAUSE && g !== PROL;

export function intervalsCore(i1, i2, major, harmonic, strict = false) {
  let result = 0;
  if (major) {
    if (i1 > -100 && (i1 === 3 || i1 === -4)) result += 3;
    if (i1 > -100 && i2 > -100 && ((i1 === 3 && i2 === 7) || (i1 === -4 && i2 === -7))) result += 5;
  } else {
    if (i1 > -100 && (i1 === -3 || i1 === 4)) result += 3;
    if (i1 > -100 && i2 > -100 && ((i1 === 4 && i2 === 7) || (i1 === -3 && i2 === -7))) result += 5;
  }
  const a = Math.abs(i1);
  if (a === 0) result -= 4.5;
  if (a === 1) result -= 1;
  if (a === 2) {
    if (harmonic) result -= 0.5;
    else if (strict) result = 2;
    else result += 2;
  }
  if (a === 5) result += harmonic ? 2 : 1;
  if (a === 6) result -= 0.3;
  if (a === 7) result += harmonic ? 1.5 : 0.5;
  if (a === 8) result -= 0.5;
  if (a === 9) result -= 0.5;
  if (a === 10) result += harmonic ? 1 : -1;
  if (a === 11) result -= 0.5;
  if (a === 12) result += 1;
  if (a > 12) result -= 1;
  return result;
}

export function evaluateRange(seq, attractorRange, evaluationCount, annealEvaluations, fixLapses = false) {
  let r = attractorRange;
  if (evaluationCount < annealEvaluations) r += 10; // C#: +10 - 10*(it/itMax) with integer division
  let result = 0;
  for (const s of seq) {
    if (s < GENE_A4 + r && s > GENE_A4 - r && isNote(s)) result += 2;
    else if (fixLapses && (s < GENE_A4 - 3 * r || s > GENE_A4 + 3 * r) && isNote(s)) {
      result -= 8; // the C# branch, unreachable after the 2x test
      if (s < 2) result -= 15;
    } else if ((s < GENE_A4 - 2 * r || s > GENE_A4 + 2 * r) && isNote(s)) {
      result -= 2;
      if (s < 2) result -= 15;
    } else if (!isNote(s)) result += 1; // (the C# "-8" branch in between is unreachable)
    else {
      result -= 1;
      if (s < 2) result -= 5;
    }
  }
  return result;
}

export function evaluateScale(seq, scaleNr) {
  const shiftInC = (GENE_A4 - 9) % 12;
  let result = 0;
  for (const s of seq) {
    if (s > shiftInC && s <= HIGHEST_NOTE_GENE && isNote(s)) {
      result += SCALE_TABLE[scaleNr][(s - shiftInC) % 12] ? 1 : -1.5;
    }
  }
  return result;
}

export function evaluatePauseAndProlongation(seq, fixLapses = false) {
  let result = 0;
  for (let i = 0; i < seq.length; i++) {
    const s = seq[i];
    const p = seq[i - 1];
    if (i > 2 && s === PAUSE && p !== PAUSE) result += 4;
    else if (i > 3 && s === PROL && p === PAUSE) result += 6.5;
    else if (fixLapses && i > 2 && s === PROL && p === PROL) result += 0.5; // unreachable in C#
    else if (i > 2 && s === PROL && p !== PAUSE) result += 2;
    else result -= 1; // ("prolongation of prolongation" branch in C# is unreachable)
  }
  if (seq[0] === PROL) result -= 10;
  return Math.min(result, 40);
}

export function evaluateExcessiveRepetitions(seq) {
  let result = 0;
  for (let i = 5; i < seq.length; i++) {
    const s = seq[i];
    if (!isNote(s)) continue;
    const [s1, s2, s3] = [seq[i - 1], seq[i - 2], seq[i - 3]];
    if (s === s1 && s !== s2) result -= 1.8;
    if (s === s1 && s === s2 && s !== s3) result -= 3;
    if (s === s1 && s === s2 && s === s3) result -= 6;
    if (s1 === PROL && s === s2 && s === s3) result -= 6;
  }
  return result;
}

export function evaluateInterestingRepetitions(seq, fixLapses = false) {
  let result = 0;
  for (let i = 5; i < seq.length; i++) {
    const s = seq[i];
    if (fixLapses ? !isNote(s) : s === PAUSE) continue; // C#: `!= pause || == prolongation`
    const [s1, s2, s3] = [seq[i - 1], seq[i - 2], seq[i - 3]];
    if (s !== s3 && s === s2 && s !== s1) result += 2;
    if (s !== s1 && s !== s2 && s === s3) result += 1;
  }
  return result;
}

export function evaluateIntervals(seq, major, strict) {
  let result = 0;
  for (let i = 5; i < seq.length; i++) {
    const s = seq[i];
    if (!isNote(s)) continue;
    let i1 = s - seq[i - 1];
    let i2 = s - seq[i - 2];
    if (!isNote(seq[i - 1])) i1 = -100;
    if (!isNote(seq[i - 2])) i2 = -100;
    result += intervalsCore(i1, i2, major, false, strict);
  }
  return result;
}

export function attractorWave(seq, threshold, wave) {
  let result = 0;
  for (let i = 0; i < seq.length; i++) {
    if (!isNote(seq[i])) continue;
    const d = Math.abs(seq[i] - wave[i]);
    if (d <= 0.5 * threshold) result += 2;
    if (d <= threshold) result += 1;
    else if (d <= 1.5 * threshold) result -= 4.1;
    else result -= 6.2;
  }
  return result;
}

export function scoreBalance(seq, minPct, maxPct, fixLapses = false) {
  let nonNotes = 0;
  for (const s of seq) if (!isNote(s)) nonNotes++;
  let pct = (100 * nonNotes) / seq.length;
  if (fixLapses) pct = Math.max(pct, 50 / seq.length); // half a gene: finite, and still the worst
  let result = (-(pct - minPct) * (pct - maxPct) * 16) / pct; // -Infinity when pct == 0 (as in C#)
  if (result > 1) result = Math.sqrt(result) / (maxPct - minPct);
  return result;
}

export function scoreMetricRepetitionsABA(seq, measureLen, precedence) {
  let result = 0;
  const lag = precedence * measureLen;
  for (let i = lag + 1; i < seq.length; i++) result += seq[i] === seq[i - lag] ? 1 : -4;
  return result;
}

export function scoreRhythmicRepetitions(seq, measureLen, precedence, spacing) {
  let result = 0;
  for (let i = 0; i < seq.length; i++) {
    const measureNumber = Math.floor(i / measureLen);
    const spacingTest = spacing <= 0 ? 0 : measureNumber % spacing;
    if (i < (precedence + 1) * measureLen || spacingTest !== 0) continue;
    const s = seq[i];
    const ref = seq[(i % measureLen) + precedence * measureLen];
    if (s === ref && s === PAUSE) result += 4;
    else if (s === ref && s === PROL) {
      result += 4;
      if (i % measureLen === 0) result -= 4;
    } else if (isNote(s) && isNote(ref)) result += 2;
    else result -= 2;
  }
  return result;
}

export function evaluateInterestingRhythmicPatterns(seq, measureLen, strict, fixLapses = false) {
  // the figure spans i-3..i; "at the start of the bar" is i-3 on the downbeat (C# tested i % 16 == 4)
  const barStart = fixLapses ? 3 : 4;
  let result = 0;
  for (let i = 0; i < seq.length; i++) {
    const s = seq[i];
    if (i > 8 && isNote(s)) {
      const [s1, s2, s3] = [seq[i - 1], seq[i - 2], seq[i - 3]];
      if (!isNote(s3)) continue;
      if (s2 === PROL) {
        if (s1 === PROL || s1 !== PAUSE) {
          result += 1; // 3+1 or 2+1+1
          if (i % measureLen === barStart) result += 5;
        }
      } else if (isNote(s2) && isNote(s1)) result += 0.5; // 1+1+1+1
    } else if (i % measureLen === 0 && s === PROL) result -= 5;
    else if (i > 4 && s === PROL && seq[i - 1] === PROL && seq[i - 2] === PROL && seq[i - 3] !== PROL) {
      if (strict) result = 10;
      else result += 10;
    }
  }
  return result;
}

export function scoreTermination(seq) {
  const n = seq.length;
  let result = 0;
  if (seq[n - 1] === PROL) {
    result += 0.1 * n;
    if (seq[n - 2] !== PROL) {
      result += 0.2 * n;
      if (seq[n - 3] !== PROL) result += 0.3 * n;
    }
  } else result = -0.3 * n;
  return result;
}

export function scoreSelfHarmonization(seq, measureLen, distance, major) {
  let d = distance;
  if (distance * measureLen > seq.length || distance < 1) d = 1;
  const lag = d * measureLen;
  let result = 0;
  for (let i = lag + 1; i < seq.length; i++) {
    if (!isNote(seq[i])) continue;
    result += intervalsCore(seq[i] - seq[i - lag], -101, major, true);
  }
  return result;
}

/**
 * Build the classic fitness. Returns { evaluate(genome, ctx) -> {score, parts}, waves }.
 * ctx = { generation, maxGenerations, evaluationCount }.
 */
export function createClassicFitness(options = {}) {
  const o = { ...CLASSIC_DEFAULTS, ...options };
  const g1 = { ...CLASSIC_DEFAULTS.g1, ...(options.g1 || {}) };
  const g2 = { ...CLASSIC_DEFAULTS.g2, ...(options.g2 || {}) };
  const waveSpecs = options.waves || CLASSIC_DEFAULTS.waves;
  const length = o.bars * STEPS_PER_BAR;
  const m = STEPS_PER_BAR;
  const waves = waveSpecs.map((w) => classicSine(length, m, w.periodsPerBar, w.amplitude, w.mean, w.shift));
  // emulate the first run of the C# program, where wave 1 is a flat line at gene 0
  if (o.firstRunBug) waves[0] = new Int32Array(length);
  const strict = !!o.strict;
  const fix = !strict && !!o.fixLapses;
  const tonic = o.major ? MAJOR_TONICS[o.scale] : (MAJOR_TONICS[o.scale] + 9) % 12;
  const mode = o.major ? 'major' : 'minor';
  // the original compares each bar with the bar 1 and 2 bars before; with a canon selected in
  // the page, these distances follow the entries of the 2nd and 3rd voices (the original's own
  // way of aiming at self-harmonisation, kept from the first generation)
  const selfHarm = o.selfHarmDistances ?? [1, 2];

  const needCadence = !strict && ((g1.cadence ?? 0) !== 0 || (g2.cadence ?? 0) !== 0 || o.alwaysCadence);
  function components(seq, evaluationCount) {
    return {
      rhythmicPatterns: evaluateInterestingRhythmicPatterns(seq, m, strict, fix),
      selfHarm1: scoreSelfHarmonization(seq, m, selfHarm[0], o.major),
      selfHarm2: scoreSelfHarmonization(seq, m, selfHarm[1], o.major),
      aba: scoreMetricRepetitionsABA(seq, m, 4),
      leitmotif: scoreRhythmicRepetitions(seq, m, 0, 1),
      wave1: attractorWave(seq, waveSpecs[0].threshold, waves[0]),
      wave2: waveSpecs[1] ? attractorWave(seq, waveSpecs[1].threshold, waves[1]) : 0,
      range: evaluateRange(seq, o.rangeAttractor, evaluationCount, o.rangeAnnealEvaluations, fix),
      scale: evaluateScale(seq, o.scale),
      pauseProlongation: evaluatePauseAndProlongation(seq, fix),
      reduceRepetitions: evaluateExcessiveRepetitions(seq),
      intervals: evaluateIntervals(seq, o.major, strict),
      niceRepetitions: evaluateInterestingRepetitions(seq, fix),
      ending: scoreTermination(seq),
      balance: scoreBalance(seq, o.balanceMin, o.balanceMax, fix),
      // not in the original (weight 0 there): computed only when weighted, it costs a little
      cadence: needCadence ? cadenceScore(seq, cadenceModelOnce(), tonic, mode) : 0,
    };
  }

  return {
    name: 'classic',
    length,
    waves: waves.map((w) => Float64Array.from(w, (g) => g + 32)), // MIDI, for display
    components,
    evaluate(seq, ctx = {}) {
      const phase1 = (ctx.generation ?? 0) < o.phase1Fraction * (ctx.maxGenerations ?? 1);
      const w = phase1 ? g1 : g2;
      const parts = components(seq, ctx.evaluationCount ?? Infinity);
      let score = 0;
      for (const k of Object.keys(parts)) score += (w[k] ?? 0) * parts[k];
      return { score, parts, phase: phase1 ? 1 : 2 };
    },
    phaseOf(ctx) {
      return (ctx.generation ?? 0) < o.phase1Fraction * (ctx.maxGenerations ?? 1) ? 1 : 2;
    },
  };
}
