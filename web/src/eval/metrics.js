// Objective descriptors of a melody, used to *evaluate* the generated pieces (not to
// generate them). Sources:
//  * Towsey, Brown, Wright & Diederich (2001) — 21 melodic features used as GA fitness
//    (pitch variety, range, key centredness, non-scale notes, dissonant intervals, contour
//    direction/stability, step movement, leap returns, climax strength, densities,
//    rhythmic variety, repeated pitch/rhythm patterns);
//  * Manaris et al. (2005) — Zipf rank-frequency slopes, correlated with pleasantness;
//  * Voss & Clarke (1975) — 1/f spectral slope of the pitch fluctuation;
//  * Pearce (IDyOM) — information content of each note under a model learned from a corpus
//    (here a small interval / duration bigram model, see ngram.js);
//  * Schmidhuber (2009) / Berlyne (1971) — compressibility (Lempel-Ziv complexity):
//    interesting music is neither trivially compressible nor random;
//  * MusPy / Yang & Lerch (2020) — pitch-class entropy, used as distribution descriptors.

import { estimateKey } from '../core/theory.js';

/** @param compact [[midi|-1, dur16], ...]  @param info {barLen, pickup} */
export function melodyFeatures(compact, info = {}, model = null) {
  const barLen = info.barLen ?? 16;
  const pickup = info.pickup ?? 0;
  const events = [];
  let t = 0;
  for (const [p, d] of compact) {
    events.push({ pitch: p < 0 ? null : p, start: t, dur: d });
    t += d;
  }
  const total = t;
  const notes = events.filter((e) => e.pitch !== null);
  const n = notes.length;
  const pitches = notes.map((e) => e.pitch);
  const durs = notes.map((e) => e.dur);
  // same key-finding procedure (Krumhansl-Schmuckler) for real and generated melodies
  const key = estimateKey(pitches, durs);
  const pcOf = (p) => ((p % 12) + 12) % 12;

  const ivs = [];
  for (let i = 1; i < n; i++) ivs.push(pitches[i] - pitches[i - 1]);
  const absIvs = ivs.map(Math.abs);
  const nz = ivs.filter((d) => d !== 0);

  const f = {};
  f.pitchVariety = new Set(pitches).size / n;
  f.pitchRange = Math.max(...pitches) - Math.min(...pitches);
  let triad = 0;
  let nonScale = 0;
  let durTot = 0;
  for (const e of notes) {
    durTot += e.dur;
    if (key.anchoring[pcOf(e.pitch)] >= 3) triad += e.dur;
    if (!key.diatonic[pcOf(e.pitch)]) nonScale++;
  }
  f.keyCentred = triad / durTot;
  f.nonScale = nonScale / n;
  f.dissonantIntervals = absIvs.filter((a) => a === 6 || a === 10 || a === 11 || a > 12).length / Math.max(1, absIvs.length);
  f.contourDirection = nz.length ? nz.filter((d) => d > 0).length / nz.length : 0.5;
  let same = 0;
  for (let i = 1; i < nz.length; i++) if (Math.sign(nz[i]) === Math.sign(nz[i - 1])) same++;
  f.contourStability = nz.length > 1 ? same / (nz.length - 1) : 0;
  f.stepMovement = absIvs.filter((a) => a === 1 || a === 2).length / Math.max(1, absIvs.length);
  let leaps = 0;
  let returns = 0;
  for (let i = 0; i + 1 < ivs.length; i++) {
    if (Math.abs(ivs[i]) >= 5) {
      leaps++;
      if (Math.sign(ivs[i + 1]) === -Math.sign(ivs[i])) returns++;
    }
  }
  f.leapReturns = leaps ? returns / leaps : 1;
  const maxP = Math.max(...pitches);
  f.climaxStrength = 1 / pitches.filter((p) => p === maxP).length;
  f.repeatedPitch = absIvs.filter((a) => a === 0).length / Math.max(1, absIvs.length);
  f.meanAbsInterval = absIvs.reduce((a, b) => a + b, 0) / Math.max(1, absIvs.length);
  f.noteDensity = n / (total / 4);
  f.restRatio = events.filter((e) => e.pitch === null).reduce((a, e) => a + e.dur, 0) / total;
  f.rhythmicVariety = new Set(durs).size;
  let sync = 0;
  for (const e of notes) {
    const pos = (e.start - pickup + 4 * barLen) % 4;
    if (pos !== 0 && pos + e.dur > 4) sync++;
  }
  f.syncopation = sync / n;
  f.repeatedIntervalPatterns = repeatedNgrams(ivs, 3);
  f.repeatedRhythmPatterns = repeatedNgrams(durs, 3);
  const pcHist = new Array(12).fill(0);
  notes.forEach((e) => (pcHist[pcOf(e.pitch)] += e.dur));
  f.pcEntropy = entropy(pcHist);
  f.intervalEntropy = entropy(histogram(ivs.map((d) => Math.max(-13, Math.min(13, d)))));
  f.lzComplexity = lzComplexity(notes.map((e, i) => `${i ? e.pitch - notes[i - 1].pitch : 0}:${e.dur}`));
  f.zipfPitch = zipfSlope(histogram(pitches));
  f.zipfInterval = zipfSlope(histogram(ivs));
  f.spectralSlope = spectralSlope(events, total);
  if (model) {
    const ic = model.informationContent(compact);
    f.icPitch = ic.pitch;
    f.icRhythm = ic.rhythm;
  }
  return f;
}

function histogram(values) {
  const h = new Map();
  for (const v of values) h.set(v, (h.get(v) || 0) + 1);
  return [...h.values()];
}

export function entropy(counts) {
  const tot = counts.reduce((a, b) => a + b, 0);
  let h = 0;
  for (const c of counts) if (c > 0) h -= (c / tot) * Math.log2(c / tot);
  return h;
}

function repeatedNgrams(seq, k) {
  if (seq.length < k + 1) return 0;
  const counts = new Map();
  for (let i = 0; i + k <= seq.length; i++) {
    const key = seq.slice(i, i + k).join(',');
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let rep = 0;
  let tot = 0;
  for (const c of counts.values()) {
    tot += c;
    if (c > 1) rep += c;
  }
  return rep / tot;
}

/** Lempel-Ziv (1976) complexity, normalised by n / log_|A|(n). */
export function lzComplexity(tokens) {
  const n = tokens.length;
  if (n < 2) return 0;
  let c = 1;
  let i = 0;
  let k = 1;
  let l = 1;
  let kMax = 1;
  // Kaspar & Schuster algorithm
  while (true) {
    if (tokens[i + k - 1] === tokens[l + k - 1]) {
      k++;
      if (l + k > n) {
        c++;
        break;
      }
    } else {
      if (k > kMax) kMax = k;
      i++;
      if (i === l) {
        c++;
        l += kMax;
        if (l + 1 > n) break;
        i = 0;
        k = 1;
        kMax = 1;
      } else k = 1;
    }
  }
  const alphabet = Math.max(2, new Set(tokens).size);
  return c / (n / (Math.log(n) / Math.log(alphabet)));
}

/** Slope of log(frequency) vs log(rank) (Zipf: about -1). */
export function zipfSlope(counts) {
  const c = counts.slice().sort((a, b) => b - a);
  if (c.length < 3) return 0;
  const xs = c.map((_, i) => Math.log(i + 1));
  const ys = c.map((v) => Math.log(v));
  return linfit(xs, ys).slope;
}

/** log-log slope of the periodogram of the pitch series sampled every 16th (rests keep the last pitch). */
export function spectralSlope(events, total) {
  const series = new Float64Array(total);
  let last = null;
  let t = 0;
  for (const e of events) {
    if (e.pitch !== null) last = e.pitch;
    for (let k = 0; k < e.dur; k++) series[t++] = last ?? NaN;
  }
  const first = series.find((v) => !Number.isNaN(v));
  for (let i = 0; i < total; i++) if (Number.isNaN(series[i])) series[i] = first;
  const mean = series.reduce((a, b) => a + b, 0) / total;
  const xs = [];
  const ys = [];
  for (let k = 1; k <= Math.floor(total / 4); k++) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < total; i++) {
      const a = (2 * Math.PI * k * i) / total;
      re += (series[i] - mean) * Math.cos(a);
      im -= (series[i] - mean) * Math.sin(a);
    }
    const p = (re * re + im * im) / total;
    if (p > 0) {
      xs.push(Math.log(k));
      ys.push(Math.log(p));
    }
  }
  return xs.length > 3 ? linfit(xs, ys).slope : 0;
}

export function linfit(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den ? num / den : 0;
  return { slope, intercept: my - slope * mx };
}

export const FEATURE_LABELS = {
  pitchVariety: 'Variedade de alturas',
  pitchRange: 'Âmbito (semitons)',
  keyCentred: 'Centralidade tonal',
  nonScale: 'Notas fora da escala',
  dissonantIntervals: 'Intervalos dissonantes',
  contourDirection: 'Direção do contorno',
  contourStability: 'Estabilidade do contorno',
  stepMovement: 'Movimento por grau',
  leapReturns: 'Retorno após salto',
  climaxStrength: 'Força do clímax',
  repeatedPitch: 'Notas repetidas',
  meanAbsInterval: 'Intervalo médio',
  noteDensity: 'Notas por tempo',
  restRatio: 'Proporção de pausas',
  rhythmicVariety: 'Variedade rítmica',
  syncopation: 'Síncopa',
  repeatedIntervalPatterns: 'Padrões melódicos repetidos',
  repeatedRhythmPatterns: 'Padrões rítmicos repetidos',
  pcEntropy: 'Entropia de classes de altura',
  intervalEntropy: 'Entropia de intervalos',
  lzComplexity: 'Complexidade LZ',
  zipfPitch: 'Zipf (alturas)',
  zipfInterval: 'Zipf (intervalos)',
  spectralSlope: 'Declive espectral (1/f)',
  icPitch: 'Surpresa melódica (bits)',
  icRhythm: 'Surpresa rítmica (bits)',
};
