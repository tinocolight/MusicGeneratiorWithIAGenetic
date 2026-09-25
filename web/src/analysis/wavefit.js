// Wave analyser: the attractor-wave model of the original report, *inverted*.
// Given a melody, which attractor waves best explain it?
//
//  * segmentation into K parts: equal parts snapped to bar lines, or phrase boundaries found
//    with the Local Boundary Detection Model (Cambouropoulos 2001: boundary strength grows with
//    changes in pitch interval, inter-onset interval and rests);
//  * per segment, M sinusoidal waves  w_m(t) = mean_m + A_m sin(2*pi*f_m*t/bar + phase_m)
//    are fitted with a k-means-like procedure (every note belongs to the nearest wave, each wave
//    is refitted by least squares over a grid of frequencies, model order chosen by BIC);
//    the result lists, for each wave, its frequency (cycles per bar), mean value (MIDI, name, Hz),
//    amplitude and the share of notes it attracts; R^2 tells how much of the melody the waves
//    explain — one factor among several, as discussed in the report;
//  * the periodogram of the pitch contour (Voss & Clarke 1975 style) with a permutation test
//    (pitches shuffled inside the segment) marks which oscillations are significant.

import { midiName } from '../core/score.js';

export const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

export const FREQ_GRID = [1 / 16, 1 / 12, 1 / 8, 1 / 6, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4, 1, 4 / 3, 3 / 2, 2, 3, 4];

/** Notes with onset time and duration (in 16ths) from compact events. */
export function notesOf(compact) {
  const out = [];
  let t = 0;
  for (const [p, d] of compact) {
    if (p >= 0) out.push({ t, p, d });
    t += d;
  }
  return { notes: out, total: t };
}

// ------------------------------------------------------------------ segmentation

export function equalSegments(total, K, barLen) {
  const cuts = [0];
  for (let i = 1; i < K; i++) {
    let c = Math.round((i * total) / K / barLen) * barLen;
    c = Math.max(cuts[cuts.length - 1] + barLen, Math.min(total - barLen, c));
    cuts.push(c);
  }
  cuts.push(total);
  return cuts.slice(0, -1).map((s, i) => [s, cuts[i + 1]]).filter(([a, b]) => b > a);
}

/** LBDM boundary strength after each note (Cambouropoulos 2001), normalised to [0, 1]. */
export function boundaryStrengths(notes, total) {
  const n = notes.length;
  const pitchIv = [];
  const ioi = [];
  const rest = [];
  for (let i = 0; i < n; i++) {
    const next = notes[i + 1];
    pitchIv.push(next ? Math.abs(next.p - notes[i].p) : 0);
    ioi.push(next ? next.t - notes[i].t : total - notes[i].t);
    rest.push(next ? Math.max(0, next.t - (notes[i].t + notes[i].d)) : 0);
  }
  const change = (x, y) => (x + y === 0 ? 0 : Math.abs(x - y) / (x + y));
  const profile = (v) => {
    const s = v.map((x, i) => x * ((i > 0 ? change(v[i - 1], x) : 0) + (i + 1 < n ? change(x, v[i + 1]) : 0)));
    const m = Math.max(...s) || 1;
    return s.map((x) => x / m);
  };
  const a = profile(pitchIv);
  const b = profile(ioi);
  const c = profile(rest);
  return notes.map((_, i) => 0.25 * a[i] + 0.5 * b[i] + 0.25 * c[i]);
}

/** K segments with cuts at the strongest phrase boundaries near the equal division points. */
export function phraseSegments(compact, K, barLen) {
  const { notes, total } = notesOf(compact);
  const eq = equalSegments(total, K, barLen);
  if (K <= 1 || notes.length < 4) return eq;
  const strength = boundaryStrengths(notes, total);
  const cuts = [0];
  for (let i = 1; i < eq.length; i++) {
    const target = eq[i][0];
    const window = Math.max(barLen, Math.round(total / K / 3));
    let best = target;
    let bestS = -1;
    notes.forEach((nt, k) => {
      const cut = notes[k + 1] ? notes[k + 1].t : total; // boundary after note k
      if (Math.abs(cut - target) <= window && cut - cuts[cuts.length - 1] >= barLen && total - cut >= barLen) {
        const s = strength[k] - 0.15 * Math.abs(cut - target) / window;
        if (s > bestS) {
          bestS = s;
          best = cut;
        }
      }
    });
    cuts.push(best);
  }
  cuts.push(total);
  return cuts.slice(0, -1).map((s, i) => [s, cuts[i + 1]]).filter(([a, b]) => b > a);
}

// ------------------------------------------------------------------ wave fitting

/** Weighted least squares of p ~ mu + a sin(wt) + b cos(wt) (or constant when f = 0). */
function fitSine(samples, f, barLen) {
  let sw = 0;
  const S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const r = [0, 0, 0];
  for (const s of samples) {
    const ang = (2 * Math.PI * f * s.t) / barLen;
    const x = [1, Math.sin(ang), Math.cos(ang)];
    for (let i = 0; i < 3; i++) {
      r[i] += s.w * x[i] * s.p;
      for (let j = 0; j < 3; j++) S[i][j] += s.w * x[i] * x[j];
    }
    sw += s.w;
  }
  let coef;
  if (f === 0 || samples.length < 4) coef = [r[0] / S[0][0], 0, 0];
  else coef = solve3(S, r) ?? [r[0] / S[0][0], 0, 0];
  let sse = 0;
  for (const s of samples) {
    const ang = (2 * Math.PI * f * s.t) / barLen;
    const e = s.p - (coef[0] + coef[1] * Math.sin(ang) + coef[2] * Math.cos(ang));
    sse += s.w * e * e;
  }
  return { f, mean: coef[0], a: coef[1], b: coef[2], sse, sw };
}

function solve3(A, y) {
  const M = A.map((row, i) => [...row, y[i]]);
  for (let c = 0; c < 3; c++) {
    let piv = c;
    for (let r = c + 1; r < 3; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < 1e-9) return null;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = 0; r < 3; r++) {
      if (r === c) continue;
      const k = M[r][c] / M[c][c];
      for (let j = c; j < 4; j++) M[r][j] -= k * M[c][j];
    }
  }
  return [M[0][3] / M[0][0], M[1][3] / M[1][1], M[2][3] / M[2][2]];
}

const waveAt = (w, t, barLen) => w.mean + w.a * Math.sin((2 * Math.PI * w.f * t) / barLen) + w.b * Math.cos((2 * Math.PI * w.f * t) / barLen);

/**
 * Fit M waves to note samples {t, p, w} with EM (a mixture of sinusoidal regressions).
 * Each wave m has a Gaussian basin of width sigma_m: a note at distance d is attracted with
 * weight  pi_m * exp(-d^2 / 2 sigma_m^2) / sigma_m, so nearby notes influence a wave much more
 * than distant ones (soft assignment) and every wave gets its own estimated basin width.
 * Frequencies are limited by the segment length (at least one full period must fit) and by the
 * note density (Nyquist on the onsets).
 */
export function fitWaves(samples, M, barLen, segLen) {
  const notesPerBar = samples.length / Math.max(1, segLen / barLen);
  const grid = [0, ...FREQ_GRID.filter((f) => f >= barLen / segLen - 1e-9 && f <= Math.max(0.25, notesPerBar / 4))];
  const ps = samples.map((s) => s.p).sort((a, b) => a - b);
  const spread = Math.max(1, (ps[ps.length - 1] - ps[0]) / (2 * M));
  let waves = Array.from({ length: M }, (_, m) => ({ f: 0, mean: ps[Math.floor(((m + 0.5) / M) * ps.length)], a: 0, b: 0, sigma: spread, pi: 1 / M }));
  let resp = samples.map(() => new Array(M).fill(1 / M));
  let prevLL = -Infinity;
  for (let iter = 0; iter < 40; iter++) {
    // E-step: responsibilities from the Gaussian basins
    let ll = 0;
    resp = samples.map((s) => {
      const r = waves.map((w) => {
        const d = s.p - waveAt(w, s.t, barLen);
        return (w.pi / w.sigma) * Math.exp(-(d * d) / (2 * w.sigma * w.sigma));
      });
      const z = r.reduce((a, b) => a + b, 0) || 1e-12;
      ll += s.w * Math.log(z);
      return r.map((v) => v / z);
    });
    // M-step: weighted least squares per wave over the frequency grid (BIC per wave)
    waves = waves.map((w, m) => {
      const mine = samples.map((s, i) => ({ t: s.t, p: s.p, w: s.w * resp[i][m] }));
      const n = mine.reduce((a, s) => a + s.w, 0);
      if (n < 1.5) return { ...w, pi: n / samples.length };
      let best = null;
      for (const f of grid) {
        const fit = fitSine(mine, f, barLen);
        const k = f === 0 ? 1 : 3;
        const bic = n * Math.log(fit.sse / n + 1e-6) + k * Math.log(n);
        if (!best || bic < best.bic) best = { ...fit, bic };
      }
      const sigma = Math.max(0.5, Math.sqrt(best.sse / n));
      return { f: best.f, mean: best.mean, a: best.a, b: best.b, sigma, pi: n / samples.reduce((a, s) => a + s.w, 0) };
    });
    if (Math.abs(ll - prevLL) < 1e-4) break;
    prevLL = ll;
  }
  const assign = resp.map((r) => r.indexOf(Math.max(...r)));
  const counts = waves.map((_, m) => assign.filter((a) => a === m).length);
  let sse = 0;
  let sst = 0;
  const wsum = samples.reduce((a, s) => a + s.w, 0);
  const mu = samples.reduce((a, s) => a + s.w * s.p, 0) / wsum;
  samples.forEach((s, i) => {
    const e = s.p - waveAt(waves[assign[i]], s.t, barLen);
    sse += s.w * e * e;
    sst += s.w * (s.p - mu) ** 2;
  });
  const n = samples.length;
  const params = waves.reduce((a, w) => a + (w.f === 0 ? 2 : 4), 0) + M - 1;
  return {
    waves: waves.map((w, m) => describeWave(w, counts[m] / n, samples.filter((_, i) => assign[i] === m), barLen)),
    assign,
    r2: sst ? 1 - sse / sst : 0,
    logLikelihood: prevLL,
    bic: -2 * prevLL + params * Math.log(n),
  };
}

function describeWave(w, share, mine, barLen) {
  const amplitude = Math.hypot(w.a, w.b);
  let rmse = 0;
  for (const s of mine) rmse += (s.p - waveAt(w, s.t, barLen)) ** 2;
  rmse = mine.length ? Math.sqrt(rmse / mine.length) : 0;
  return {
    freq: w.f, // cycles per bar
    periodBars: w.f ? 1 / w.f : Infinity,
    mean: w.mean,
    meanName: midiName(Math.round(w.mean)),
    meanHz: hz(w.mean),
    amplitude,
    phase: Math.atan2(w.b, w.a),
    a: w.a,
    b: w.b,
    share,
    basin: w.sigma ?? rmse, // estimated basin width (semitones, 1 sd of the attracted notes)
    rmse,
  };
}

// ------------------------------------------------------------------ spectrum

/** Pitch contour sampled per 16th (rests keep the previous pitch), mean removed. */
export function contour(compact, start = 0, end = null) {
  const series = [];
  let last = null;
  for (const [p, d] of compact) {
    if (p >= 0) last = p;
    for (let k = 0; k < d; k++) series.push(last);
  }
  const first = series.find((v) => v !== null) ?? 60;
  const s = series.map((v) => v ?? first).slice(start, end ?? series.length);
  return s;
}

export function periodogram(series, barLen) {
  const n = series.length;
  const mean = series.reduce((a, b) => a + b, 0) / n;
  const out = [];
  for (let k = 1; k <= Math.floor(n / 4); k++) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < n; i++) {
      const ang = (2 * Math.PI * k * i) / n;
      re += (series[i] - mean) * Math.cos(ang);
      im -= (series[i] - mean) * Math.sin(ang);
    }
    // amplitude of the sinusoid (semitones) at k cycles per segment
    out.push({ k, freq: (k * barLen) / n, amplitude: (2 * Math.hypot(re, im)) / n });
  }
  return out;
}

/** Permutation threshold: 95th percentile of the max amplitude in shuffled contours. */
function significanceThreshold(compactSeg, barLen, rng, trials = 60) {
  const maxes = [];
  const notes = compactSeg.filter(([p]) => p >= 0).map(([p]) => p);
  for (let t = 0; t < trials; t++) {
    const shuffled = rng.shuffle(notes.slice());
    let i = 0;
    const perm = compactSeg.map(([p, d]) => (p >= 0 ? [shuffled[i++], d] : [p, d]));
    const spec = periodogram(contour(perm), barLen);
    maxes.push(Math.max(...spec.map((s) => s.amplitude)));
  }
  maxes.sort((a, b) => a - b);
  return maxes[Math.floor(0.95 * (maxes.length - 1))];
}

/** Cut compact events to [start, end). */
export function sliceCompact(compact, start, end) {
  const out = [];
  let t = 0;
  for (const [p, d] of compact) {
    const a = Math.max(t, start);
    const b = Math.min(t + d, end);
    if (b > a) out.push([p, b - a]);
    t += d;
  }
  return out;
}

/**
 * Full analysis. options: {segments K, mode 'equal'|'phrase', waves M (0 = auto 1..3), barLen, rng}
 */
export function analyzePiece(compact, { segments = 2, mode = 'phrase', waves = 0, barLen = 16, rng = null } = {}) {
  const { total } = notesOf(compact);
  const segs = mode === 'phrase' ? phraseSegments(compact, segments, barLen) : equalSegments(total, segments, barLen);
  return {
    total,
    barLen,
    segments: segs.map(([start, end]) => {
      const part = sliceCompact(compact, start, end);
      const { notes } = notesOf(part);
      const samples = notes.map((nt) => ({ t: nt.t, p: nt.p, w: Math.sqrt(nt.d) }));
      let fit = null;
      if (samples.length >= 4) {
        const candidates = waves ? [waves] : [1, 2, 3];
        for (const M of candidates) {
          if (samples.length < 4 * M) continue;
          const f = fitWaves(samples, M, barLen, end - start);
          if (!fit || f.bic < fit.bic - 2) fit = { ...f, M };
        }
      }
      const spec = periodogram(contour(part), barLen);
      const threshold = rng ? significanceThreshold(part, barLen, rng) : null;
      const pitches = notes.map((n) => n.p);
      const lo = Math.min(...pitches);
      const hi = Math.max(...pitches);
      const byFreq = fit ? fit.waves.slice().sort((a, b) => a.freq - b.freq) : [];
      const sig = threshold ? spec.filter((s) => s.amplitude > threshold) : spec;
      return {
        start,
        end,
        notes: notes.length,
        fit,
        lowestWave: byFreq[0] ?? null,
        highestWaves: byFreq.length > 1 ? byFreq.slice(1).reverse() : [],
        spectrum: spec,
        threshold,
        significant: sig,
        lowestPeak: sig.length ? sig.reduce((a, b) => (b.freq < a.freq ? b : a)) : null,
        strongestPeak: sig.length ? sig.reduce((a, b) => (b.amplitude > a.amplitude ? b : a)) : null,
        register: {
          lowest: lo,
          lowestHz: hz(lo),
          highest: hi,
          highestHz: hz(hi),
          mean: pitches.reduce((a, b) => a + b, 0) / Math.max(1, pitches.length),
          // mean of the lower / upper quartile of the notes (the "low" and "high" register)
          lowMean: quartileMean(pitches, 'low'),
          highMean: quartileMean(pitches, 'high'),
        },
      };
    }),
  };
}

function quartileMean(ps, which) {
  if (!ps.length) return null;
  const s = ps.slice().sort((a, b) => a - b);
  const q = Math.max(1, Math.round(s.length / 4));
  const part = which === 'low' ? s.slice(0, q) : s.slice(-q);
  return part.reduce((a, b) => a + b, 0) / part.length;
}

/** Convert a fitted wave to an editor wave {type, freq, mean, amplitude, basin, shape, phase}. */
export function waveToSpec(w, stepsPerBar = 16) {
  return {
    type: w.freq ? 'sine' : 'flat',
    freq: w.freq || 0.25,
    mean: w.mean,
    amplitude: w.freq ? w.amplitude : 0,
    basin: Math.max(1.5, Math.min(5, w.basin || 3)),
    shape: 'gaussian',
    // value = mean + A sin(2*pi*f*t/bar + phi)  ->  shift of phi*bar/(2*pi*f) steps
    phase: w.freq ? (w.phase * stepsPerBar) / (2 * Math.PI * w.freq) : 0,
  };
}
