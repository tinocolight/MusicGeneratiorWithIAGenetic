// "Attractor field" fitness — the attractor-wave idea of the original work, generalised and
// grounded in the music-cognition literature. Every component is an average in ~[-1, 1]
// (per note, per interval, per phrase...), never a raw sum: in the original rules each
// note could only lose points while rests were neutral or rewarded, which made silence a
// "safe harbour" for the GA. Rests are now judged by an explicit rest-density target.
//
// Components (weights editable in the UI):
//  key        tonal fit: Krumhansl-Kessler key profile, out-of-key notes penalised
//  attractor  soft Gaussian basins around one or more attractor waves (a note may fall in
//             ANY basin = the "basins of attraction" of Fig. 1 in the report; the original
//             summed per-wave penalties, forcing each note to be near all waves at once);
//             a coverage term asks every wave to attract part of the notes (compound melody /
//             implied polyphony, as in the Bach cello suite of Fig. 2)
//  proximity  pitch proximity, Gaussian on the interval (Temperley 2008)
//  regression post-skip reversal = regression towards the mean (von Hippel & Huron 2000)
//  forces     melodic magnetism: unstable tones resolve to the most attracting neighbour,
//             attraction = (s2/s1)/n^2 (Lerdahl 2001; Larson 2012)
//  metric     tonal-metric hierarchy: stable tones on strong beats (Lerdahl & Jackendoff 1983;
//             Prince & Schmuckler 2014)
//  cadence    phrase endings on long, stable notes, final tonic reached by step
//  rhythm     note values aligned with the beat, 0.75-2 notes per beat, rests <= 8 % of the time
//  form       phrase-level form (A A' B A'' ...): same-letter units similar but not
//             identical (variation, transposition-invariant => melodic sequences),
//             different letters contrasting
//  tension    smoothed tension (tonal instability + pitch height + onset density) follows a
//             target arch profile (Farbood 2012; Herremans & Chew 2017, MorpheuS)
//  variety    anti-monotony: repeated notes, pitch variety, single climax (Towsey et al. 2001)
//  canon      counterpoint of the melody against itself delayed by x bars (see canon.js)

import { toEvents, STEPS_PER_BAR } from '../core/score.js';
import { makeKey, melodicAttraction, pearson } from '../core/theory.js';
import { makeWave, archWave } from '../core/waves.js';
import { soundingLine, smooth, clamp } from '../core/analysis.js';
import { analyzeCanon } from './canon.js';
import { createRng } from '../core/rng.js';

export const FORMS = {
  none: null,
  "AA'BA'": ['A', 'A', 'B', 'A'],
  "ABA'C": ['A', 'B', 'A', 'C'],
  'ABAB': ['A', 'B', 'A', 'B'],
  'AABA': ['A', 'A', 'B', 'A'],
};

// Influence of an attractor on a note at distance d (semitones) for a basin of width s.
// The original used a step function (bands at T/2, T and 1.5 T); here the pull decays
// continuously with the distance, so neighbouring notes are attracted more strongly.
export const BASIN_SHAPES = {
  gaussian: (d, s) => Math.exp(-(d * d) / (2 * s * s)),
  // "gravitational": heavy-tailed 1/(1 + (d/s)^2), cf. Lerdahl's attraction ~ 1/n^2
  gravity: (d, s) => 1 / (1 + (d / s) ** 2),
  // the C# AttractorWave bands, rescaled to [0, 1] (threshold T = s)
  step: (d, s) => {
    const a = Math.abs(d);
    return a <= 0.5 * s ? 1 : a <= s ? 0.75 : a <= 1.5 * s ? 0.2 : 0;
  },
};

export const DEFAULT_WEIGHTS = {
  key: 3, attractor: 3, proximity: 2, regression: 1, forces: 1.5, metric: 2, cadence: 2.5,
  rhythm: 3, form: 2, tension: 1, variety: 2, canon: 0,
};

export const FIELD_DEFAULTS = {
  bars: 8,
  tonic: 7, // G major, the original default scale
  mode: 'major',
  lowMidi: 55, // G3 .. E6: violin / flute range
  highMidi: 88,
  phraseBars: 2,
  form: "AA'BA'",
  restTarget: [0, 0.08],
  basinShape: 'gaussian',
  waves: [
    { type: 'arch', phraseBars: 2, amplitude: 7, mean: 74, basin: 3 },
    { type: 'rossler', periodsPerBar: 0.35, amplitude: 5, mean: 67, basin: 3 },
  ],
  canon: { delayBars: 1, transpose: 0, circular: false },
  weights: DEFAULT_WEIGHTS,
  seed: 1,
};

export function createAttractorFitness(options = {}) {
  const o = { ...FIELD_DEFAULTS, ...options };
  const weights = { ...DEFAULT_WEIGHTS, ...(options.weights || {}) };
  const canon = { ...FIELD_DEFAULTS.canon, ...(options.canon || {}) };
  const bpb = STEPS_PER_BAR;
  const length = o.bars * bpb;
  const key = makeKey(o.tonic, o.mode);
  const waveRng = createRng(o.seed ?? 1);
  const waves = o.waves.map((w) => makeWave(w, length, bpb, waveRng));
  const basins = o.waves.map((w) => w.basin ?? 3);
  const basinValue = BASIN_SHAPES[o.basinShape] ?? BASIN_SHAPES.gaussian;
  const phraseLen = o.phraseBars * bpb;
  const nPhrases = Math.max(1, Math.round(o.bars / o.phraseBars));
  const form = FORMS[o.form] ?? null;
  const formUnit = form ? length / form.length : 0;

  // target tension: an arch per phrase, scaled by a global arch that peaks at ~62% of the piece
  const phraseArch = archWave(length, bpb, { phraseBars: o.phraseBars, amplitude: 1, mean: 0.5, peakAt: 0.62, descent: 0.3 });
  const globalArch = archWave(length, bpb, { phraseBars: o.bars, amplitude: 1, mean: 0.5, peakAt: 0.62, descent: 0.2 });
  const tensionTarget = phraseArch.map((v, i) => 0.6 * v + 0.4 * globalArch[i]);

  const minProf = Math.min(...key.profile.filter((_, pc) => key.diatonic[pc]));
  const maxProf = Math.max(...key.profile);

  function components(genes) {
    const events = toEvents(genes);
    const notes = events.filter((e) => e.pitch !== null);
    const parts = {};
    if (notes.length < 6) {
      for (const k of Object.keys(DEFAULT_WEIGHTS)) parts[k] = -1;
      return { parts, events, notes };
    }
    const line = soundingLine(genes);

    // key ---------------------------------------------------------------
    let acc = 0;
    let wsum = 0;
    for (const nt of notes) {
      const pc = ((nt.pitch % 12) + 12) % 12;
      const v = key.diatonic[pc] ? 0.3 + 0.7 * (key.profile[pc] - minProf) / (maxProf - minProf) : -1;
      acc += v * nt.dur;
      wsum += nt.dur;
    }
    parts.key = acc / wsum;

    // attractor basins --------------------------------------------------
    acc = 0;
    let cnt = 0;
    let outOfRange = 0;
    const assign = new Array(waves.length).fill(0);
    for (const nt of notes) {
      let bestV = 0;
      let bestK = 0;
      for (let t = nt.start; t < nt.start + nt.dur; t++) {
        let v = 0;
        let kk = 0;
        for (let k = 0; k < waves.length; k++) {
          const b = basinValue(nt.pitch - waves[k][t], basins[k]);
          if (b > v) {
            v = b;
            kk = k;
          }
        }
        acc += v;
        cnt++;
        if (t === nt.start) {
          bestV = v;
          bestK = kk;
        }
      }
      if (bestV > 0.3) assign[bestK]++;
      if (nt.pitch < o.lowMidi || nt.pitch > o.highMidi) outOfRange++;
    }
    let coverage = 1;
    if (waves.length > 1) {
      const tot = assign.reduce((a, b) => a + b, 0) || 1;
      let h = 0;
      for (const a of assign) if (a) h -= (a / tot) * Math.log(a / tot);
      coverage = h / Math.log(waves.length);
    }
    parts.attractor = 2 * (acc / cnt) - 1 + 0.4 * (coverage - 1) - 2 * (outOfRange / notes.length);

    // melodic intervals (within phrases: a rest of >= 1 beat separates groups)
    const pairs = [];
    for (let i = 1; i < events.length; i++) {
      const a = events[i - 1];
      const b = events[i];
      if (b.pitch === null) continue;
      if (a.pitch !== null) pairs.push([a, b]);
      else if (a.dur < 4 && i >= 2 && events[i - 2].pitch !== null) pairs.push([events[i - 2], b]);
    }
    const ivs = pairs.map(([a, b]) => b.pitch - a.pitch);

    // proximity (Temperley: proximity profile variance ~7.2 semitones^2)
    acc = 0;
    for (const d of ivs) acc += Math.exp(-(d * d) / (2 * 7.2));
    parts.proximity = ivs.length ? 2 * (acc / ivs.length) - 1 : -1;

    // post-skip reversal / regression to the attractor --------------------
    let good = 0;
    let bad = 0;
    for (let i = 0; i + 1 < ivs.length; i++) {
      if (Math.abs(ivs[i]) >= 5) {
        const next = ivs[i + 1];
        if (Math.sign(next) === -Math.sign(ivs[i]) && Math.abs(next) <= 4) good++;
        else bad++;
      }
    }
    parts.regression = (good - 1.5 * bad) / Math.max(4, good + bad);

    // melodic forces: magnetism of unstable tones --------------------------
    acc = 0;
    cnt = 0;
    for (const [a, b] of pairs) {
      const pa = ((a.pitch % 12) + 12) % 12;
      if (key.anchoring[pa] >= 3) continue; // stable tone: no pull
      let best = 0;
      for (const q of [a.pitch - 2, a.pitch - 1, a.pitch + 1, a.pitch + 2]) {
        if (!key.diatonic[((q % 12) + 12) % 12] && key.anchoring[((q % 12) + 12) % 12] < 3) continue;
        best = Math.max(best, melodicAttraction(a.pitch, q, key));
      }
      const got = melodicAttraction(a.pitch, b.pitch, key);
      acc += best ? clamp(got / best, 0, 1) : 0;
      cnt++;
    }
    parts.forces = cnt ? 2 * (acc / cnt) - 1 : 0;

    // tonal-metric hierarchy ------------------------------------------------
    acc = 0;
    wsum = 0;
    for (const nt of notes) {
      const pos = nt.start % bpb;
      const pc = ((nt.pitch % 12) + 12) % 12;
      const stab = key.anchoring[pc] >= 3 ? 1 : key.diatonic[pc] ? -0.2 : -1;
      if (pos % 4 === 0) {
        const w = pos === 0 ? 2 : pos === 8 ? 1.5 : 1;
        acc += w * stab;
        wsum += w;
      }
      if (pos % 2 === 1 && nt.dur >= 3) {
        acc -= 0.5; // long note on a weak 16th: syncopation
        wsum += 0.5;
      }
    }
    parts.metric = wsum ? acc / wsum : 0;

    // cadences --------------------------------------------------------------
    acc = 0;
    for (let ph = 0; ph < nPhrases; ph++) {
      const end = Math.min(length, (ph + 1) * phraseLen);
      const inPhrase = notes.filter((nt) => nt.start >= ph * phraseLen && nt.start < end);
      if (!inPhrase.length) {
        acc -= 1;
        continue;
      }
      const last = inPhrase[inPhrase.length - 1];
      const pc = ((last.pitch % 12) + 12) % 12;
      const isFinal = ph === nPhrases - 1;
      const isHalf = ph === Math.floor(nPhrases / 2) - 1;
      let s = 0;
      // the last note must reach the phrase end (possibly followed by a short breath rest)
      const reach = last.start + last.dur;
      s += last.dur >= 8 ? 1 : last.dur >= 4 ? 0.6 : -0.5;
      s += reach >= end - 4 ? 0.3 : -0.5;
      if (isFinal) s += pc === key.tonic ? 1.2 : key.anchoring[pc] >= 3 ? 0.2 : -1;
      else if (isHalf) s += key.anchoring[pc] === 4 || pc === (key.tonic + 7) % 12 ? 1 : key.anchoring[pc] >= 3 ? 0.6 : -0.6;
      else s += key.anchoring[pc] >= 3 ? 0.8 : -0.6;
      const prev = inPhrase[inPhrase.length - 2];
      if (prev) {
        const d = last.pitch - prev.pitch;
        if (Math.abs(d) <= 2 && d !== 0) s += isFinal && d < 0 ? 0.5 : 0.3;
        else if (isFinal && Math.abs(d) === 5) s += 0.2; // 5-1 motion
      }
      acc += s / 3;
    }
    parts.cadence = acc / nPhrases;

    // rhythm ------------------------------------------------------------------
    acc = 0;
    const allowed = new Set([1, 2, 3, 4, 6, 8, 12, 16]);
    for (let i = 0; i < notes.length; i++) {
      const nt = notes[i];
      const pos = nt.start % 16;
      const align = nt.dur >= 4 ? (nt.dur === 6 || nt.dur === 12 ? 4 : 4) : nt.dur >= 2 ? 2 : 1;
      let s = pos % align === 0 ? 1 : pos % 2 === 0 ? 0 : -1;
      if (!allowed.has(nt.dur)) s -= 0.7;
      if (nt.dur === 1) {
        // 16ths come in groups: a lone 16th between longer values sounds like an error
        const prevShort = i > 0 && notes[i - 1].dur <= 2 && notes[i - 1].start + notes[i - 1].dur === nt.start;
        const nextShort = i + 1 < notes.length && notes[i + 1].dur <= 2 && notes[i + 1].start === nt.start + 1;
        if (!prevShort && !nextShort) s -= 1;
      }
      acc += s;
    }
    let rhythm = acc / notes.length;
    const restSteps = genes.length - line.pitch.filter((p) => p !== null).length;
    const restRatio = restSteps / genes.length;
    const [rLo, rHi] = o.restTarget;
    if (restRatio > rHi) rhythm -= 4 * (restRatio - rHi);
    if (restRatio < rLo) rhythm -= 2 * (rLo - restRatio);
    const density = notes.length / (length / 4); // notes per beat
    if (density > 2) rhythm -= 0.6 * (density - 2);
    if (density < 0.75) rhythm -= 1.5 * (0.75 - density);
    parts.rhythm = rhythm;

    // form ----------------------------------------------------------------------
    if (form) {
      acc = 0;
      cnt = 0;
      for (let a = 0; a < form.length; a++) {
        for (let b = a + 1; b < form.length; b++) {
          const sim = segmentSimilarity(genes, line, a * formUnit, b * formUnit, formUnit);
          let s;
          if (form[a] === form[b]) {
            s = sim.total >= 0.7 ? 1 : sim.total / 0.7 * 2 - 1;
            if (sim.exact > 0.97) s -= 0.4; // a literal copy: prefer a variation (A')
          } else s = sim.total <= 0.55 ? 1 : 1 - 2 * (sim.total - 0.55) / 0.45;
          acc += s;
          cnt++;
        }
      }
      parts.form = acc / cnt;
    } else parts.form = 0;

    // tension -------------------------------------------------------------------
    const tension = new Float64Array(length);
    const lowW = Math.min(...waves.map((w) => Math.min(...w))) - 3;
    const highW = Math.max(...waves.map((w) => Math.max(...w))) + 3;
    for (let t = 0; t < length; t++) {
      const p = line.pitch[t];
      if (p === null) {
        tension[t] = 0.1;
        continue;
      }
      const inst = 1 - (key.anchoring[((p % 12) + 12) % 12] - 1) / 4;
      const height = clamp((p - lowW) / (highW - lowW), 0, 1);
      let on = 0;
      for (let k = Math.max(0, t - 3); k <= t; k++) if (line.onset[k]) on++;
      tension[t] = 0.45 * inst + 0.35 * height + 0.2 * (on / 4);
    }
    parts.tension = pearson(smooth(tension, 4), tensionTarget);

    // variety ---------------------------------------------------------------------
    let v = 0;
    let run = 1;
    let repeats = 0;
    for (let i = 1; i < notes.length; i++) {
      if (notes[i].pitch === notes[i - 1].pitch) {
        run++;
        if (run >= 3) repeats++;
      } else run = 1;
    }
    v -= 3 * (repeats / notes.length);
    const distinct = new Set(notes.map((n) => n.pitch)).size;
    v += distinct >= 6 ? 0.5 : (distinct - 6) * 0.25;
    const maxP = Math.max(...notes.map((n) => n.pitch));
    const climaxCount = notes.filter((n) => n.pitch === maxP).length;
    v += climaxCount <= 2 ? 0.4 : -0.1 * (climaxCount - 2);
    const range = maxP - Math.min(...notes.map((n) => n.pitch));
    v += range >= 7 && range <= 19 ? 0.3 : -0.3;
    const durKinds = new Set(notes.map((n) => n.dur)).size;
    v += durKinds >= 3 ? 0.3 : -0.3;
    parts.variety = clamp(v, -1.5, 1.5);

    // canon -----------------------------------------------------------------------
    if (weights.canon) {
      const c = analyzeCanon(line, { delay: canon.delayBars * bpb, transpose: canon.transpose, circular: canon.circular, barLen: bpb });
      parts.canon = c.score;
    } else parts.canon = 0;

    return { parts, events, notes };
  }

  return {
    name: 'attractor',
    length,
    key,
    waves,
    basins,
    options: o,
    weights,
    canon,
    env: { key, waves, basin: Math.min(...basins), lowMidi: o.lowMidi, highMidi: o.highMidi, length, stepsPerBar: bpb },
    components: (genes) => components(genes).parts,
    evaluate(genes) {
      const { parts } = components(genes);
      let score = 0;
      for (const k of Object.keys(parts)) score += (weights[k] ?? 0) * parts[k];
      return { score, parts };
    },
  };
}

/**
 * Similarity of two segments of equal length (0..1):
 *   rhythm   – same category (onset / hold / rest) at each step
 *   contour  – transposition-invariant: intervals between successive common onsets
 *   exact    – identical pitches at common onsets (to tell a variation from a copy)
 */
export function segmentSimilarity(genes, line, a, b, len) {
  let same = 0;
  const cat = (i) => (line.onset[i] ? 2 : line.pitch[i] === null ? 0 : 1);
  const common = [];
  for (let k = 0; k < len; k++) {
    if (cat(a + k) === cat(b + k)) same++;
    if (line.onset[a + k] && line.onset[b + k]) common.push(k);
  }
  const rhythm = same / len;
  let contour = 0;
  let exact = 0;
  if (common.length >= 2) {
    for (let j = 1; j < common.length; j++) {
      const d1 = line.pitch[a + common[j]] - line.pitch[a + common[j - 1]];
      const d2 = line.pitch[b + common[j]] - line.pitch[b + common[j - 1]];
      contour += Math.exp(-((d1 - d2) ** 2) / 2);
    }
    contour /= common.length - 1;
  }
  for (const k of common) if (line.pitch[a + k] === line.pitch[b + k]) exact++;
  exact = common.length ? (exact / common.length) * rhythm : 0;
  return { rhythm, contour, exact, total: 0.5 * rhythm + 0.5 * contour };
}
