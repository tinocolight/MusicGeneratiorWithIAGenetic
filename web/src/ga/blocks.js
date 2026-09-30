// Building blocks learned from real melodies, one model per meter (tools/build_meters.mjs ->
// src/data/blocks-data.js; every table is also in results/meters/*.csv and the choices are
// explained in results/meters.md).
//
// A melody is read beat by beat (figures.js): rhythmic figure, contour inside the beat, entry
// interval, direction of the last interval, beat of the bar. For each meter the model keeps
//   * P(figure | previous figures, beat of the bar): a variable-order Markov model (context.js).
//     How many previous figures count (one, two - the "two-step tree" -, up to a bar or more)
//     was chosen per meter by cross-validation on melodies left out of the counts;
//   * P(entry interval | degree of the last note, direction of the last interval - up or down,
//     by step or by leap, or repeated -, beat of the bar);
//   * P(contour inside the beat | figure, direction of the entry);
//   * association rules between the figures of the same melody (lift) and the first degree.
// It is used three ways: to write initial individuals, as a mutation that rewrites one or two
// beats, and as the "idiom" rule of the fitness, which asks a melody to be as idiomatic as a
// typical real melody of that meter (not more: the most probable figures alone make every
// melody sound the same).

import { REST, HOLD, isNote, midiToGene, clampGene } from '../core/score.js';
import { meterOf, beatClass } from '../core/meter.js';
import { lineToBeats, genesToLine, dposOf, midiOf, dirClass, dir3, contourSteps as stepsOf } from './figures.js';
import { countsFromJSON, probOf, distOf } from './context.js';

export { dposOf, midiOf, lineToBeats, genesToLine, compactToLine, figureName, figureWords, figureSyllables, contourWords } from './figures.js';

const mod = (a, n) => ((a % n) + n) % n;
const START = -1;
const UNKNOWN = -2;
export const MAX_ORDER = 8;

/** The features every table is keyed by, for beat i of a tokenised melody. */
export function beatContext(beats, i, figIndex, posOf = (b) => b.pos) {
  const b = beats[i];
  const f = {
    pos: posOf(b),
    cls: b.cls,
    d5: b.dirIn,
    d3: dir3(b.dirIn),
    deg: b.prevDeg,
    ed: b.entryDir,
    fig: figIndex(b.cell),
  };
  for (let k = 1; k <= MAX_ORDER; k++) f[`f${k}`] = i - k >= 0 ? figIndex(beats[i - k].cell) : START;
  return f;
}

// ------------------------------------------------------------------ model of one meter

function meterModel(d, meter) {
  const figs = d.figs;
  const figIdx = new Map(figs.map((c, i) => [c, i]));
  const figIndex = (cell) => figIdx.get(cell) ?? UNKNOWN;
  const rhythm = countsFromJSON(d.rhythm);
  const entry = countsFromJSON(d.entry);
  const contour = countsFromJSON(d.contour);
  const entryValues = d.entry.values; // intervals in scale steps
  const contourValues = d.contour.values; // "+1-1"...
  const contourIdx = new Map(contourValues.map((c, i) => [c, i]));
  const onsets = figs.map((c) => [...c].filter((x) => x === 'x').length);
  const contourLen = contourValues.map((c) => stepsOf(c).length);
  const assoc = new Map(Object.entries(d.assoc ?? {}).map(([a, list]) => [Number(a), new Map(list.map(([b, lift]) => [b, lift]))]));
  const degTot = Object.values(d.firstDeg).reduce((a, b) => a + b, 0);
  // meters without data of their own borrow a model (12/8 reads as two bars of 6/8)
  const posOf = (b) => b.pos % d.beats;
  const ctxOf = (beats, i) => beatContext(beats, i, figIndex, posOf);

  const pFigure = (f, fi) => probOf(rhythm, f, fi, figs.length, d.rhythm.beta);
  const pEntry = (f, iv) => {
    const k = entryValues.indexOf(iv);
    return probOf(entry, f, k < 0 ? entryValues.length : k, entryValues.length, d.entry.beta);
  };
  const pContour = (f, c) => probOf(contour, f, contourIdx.get(c) ?? contourValues.length, contourValues.length, d.contour.beta);

  /** Mean log-probability per beat (figure, entry and contour), and association coherence. */
  function score(beats) {
    let lp = 0;
    let n = 0;
    const first = beats.find((b) => b.dpos.length);
    if (first) {
      lp += Math.log(((d.firstDeg[mod(first.dpos[0], 7)] ?? 0) + 1) / (degTot + 7));
      n++;
    }
    const used = new Set();
    for (let i = 0; i < beats.length; i++) {
      const f = ctxOf(beats, i);
      lp += Math.log(pFigure(f, f.fig));
      if (beats[i].entry !== null) lp += Math.log(pEntry(f, beats[i].entry));
      if (beats[i].dpos.length >= 2) lp += Math.log(pContour(f, beats[i].contour));
      n++;
      if (f.fig >= 0) used.add(f.fig);
    }
    let coh = 0;
    let pairs = 0;
    const u = [...used];
    for (let i = 0; i < u.length; i++) for (let j = 0; j < u.length; j++) {
      if (i === j) continue;
      const l = assoc.get(u[i])?.get(u[j]);
      if (l !== undefined) coh += Math.log(l);
      pairs++;
    }
    return { logp: n ? lp / n : -20, coherence: pairs ? coh / pairs : 0 };
  }

  const tokenise = (genes, key) => {
    const line = genesToLine(genes);
    return lineToBeats(line.pitch, line.onset, { meter, key });
  };

  /** Fitness part in [-1, 1]: 0 at the P10 of real melodies of this meter, 1 from their median up. */
  function idiomPart(genes, key) {
    const s = score(tokenise(genes, key));
    const st = d.stats;
    const a = Math.max(-1, Math.min(1, (s.logp - st.logp.p10) / (st.logp.p50 - st.logp.p10)));
    const b = Math.max(-1, Math.min(1, (s.coherence - st.coherence.p10) / Math.max(1e-6, st.coherence.p50 - st.coherence.p10)));
    return 0.75 * a + 0.25 * b;
  }

  // ---- summaries for the page (the full tables are in results/meters/*.csv)
  const levelOf = (cm, names) => cm.levels.findIndex((l) => l.join('|') === names.join('|'));
  /** Figures by how often they start a beat: [[figure, share], ...]. */
  function topFigures(k = 10) {
    const i = levelOf(rhythm, ['pos']);
    const tot = new Map();
    let all = 0;
    for (const r of rhythm.rows[i].values()) for (const [y, c] of r.c) {
      tot.set(y, (tot.get(y) || 0) + c);
      all += c;
    }
    return [...tot].sort((a, b) => b[1] - a[1]).slice(0, k).map(([y, c]) => [figs[y], c / all]);
  }
  /** The most likely figures after figure `fi` when the next beat is `pos` (first-order counts). */
  function nextFigures(fi, pos, k = 3) {
    const i = levelOf(rhythm, ['f1', 'pos']);
    const r = i >= 0 ? rhythm.rows[i].get(`${fi}|${pos}`) : null;
    if (!r) return [];
    return [...r.c].sort((a, b) => b[1] - a[1]).slice(0, k).map(([y, c]) => [figs[y], c / r.n]);
  }
  /** After each direction of the last interval: how often the next entry goes up, repeats, goes down. */
  function entryByDirection() {
    const i = levelOf(entry, ['deg', 'd5', 'pos']);
    const out = {};
    if (i < 0) return out;
    for (const [key, r] of entry.rows[i]) {
      const d5 = key.split('|')[1];
      const o = (out[d5] ||= { up: 0, same: 0, down: 0, n: 0 });
      for (const [y, c] of r.c) {
        const iv = entryValues[y];
        if (iv > 0) o.up += c;
        else if (iv < 0) o.down += c;
        else o.same += c;
        o.n += c;
      }
    }
    return out;
  }

  return {
    meter, data: d, figs, figIndex, ctxOf, tokenise, score, idiomPart, pFigure, pEntry, pContour,
    rhythm, entry, contour, entryValues, contourValues, onsets, contourLen, assoc, degTot,
    topFigures, nextFigures, entryByDirection,
  };
}

/** The models of every meter (data from tools/build_meters.mjs), built on first use. */
export function createBlockModel(data) {
  const cache = new Map();
  return {
    data,
    forMeter(m) {
      const meter = meterOf(m);
      if (!cache.has(meter.id)) {
        const d = data.meters[meter.id] ?? data.meters[data.borrow?.[meter.id]];
        cache.set(meter.id, d ? meterModel(d, meter) : null);
      }
      return cache.get(meter.id);
    },
  };
}

// ------------------------------------------------------------------ writing with blocks

function sampleIndex(rng, weights) {
  let tot = 0;
  for (const w of weights) tot += w;
  let r = rng.float() * tot;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

/** Next figure: the model's distribution, nudged by the association rules with the figures used. */
function nextFigure(M, f, used, rng, gamma = 0.5) {
  const p = distOf(M.rhythm, f, M.figs.length, M.data.rhythm.beta);
  if (used.size) {
    for (let y = 0; y < p.length; y++) {
      if (p[y] < 1e-6) continue;
      let boost = 1;
      for (const a of used) boost *= M.assoc.get(a)?.get(y) ?? 1;
      p[y] *= Math.min(4, Math.max(0.25, boost)) ** gamma;
    }
  }
  return sampleIndex(rng, p);
}

/** Entry interval: the model x attraction of the waves at that step x the range. */
function entryDegree(M, env, f, prevD, step, rng) {
  const p = distOf(M.entry, f, M.entryValues.length, M.data.entry.beta);
  const cands = [];
  const w = [];
  M.entryValues.forEach((iv, k) => {
    const dd = prevD + iv;
    const m = midiOf(dd, env.key);
    if (m < env.lowMidi || m > env.highMidi) return;
    let att = 0;
    for (const wave of env.waves) att = Math.max(att, Math.exp(-((m - wave[step]) ** 2) / (2 * (env.basin ?? 3) ** 2)));
    cands.push(dd);
    w.push(p[k] * (0.15 + att));
  });
  return cands.length ? cands[sampleIndex(rng, w)] : prevD;
}

/** Contour inside the beat for a figure with `n` notes after the first. */
function contourSteps(M, f, n, rng) {
  if (n <= 0) return [];
  const p = distOf(M.contour, f, M.contourValues.length, M.data.contour.beta);
  for (let k = 0; k < p.length; k++) if (M.contourLen[k] !== n) p[k] = 0;
  if (p.some((x) => x > 0)) return stepsOf(M.contourValues[sampleIndex(rng, p)]);
  return Array.from({ length: n }, () => (rng.chance(0.5) ? 1 : -1));
}

function startDegree(M, env, rng) {
  const degs = Object.keys(M.data.firstDeg).map(Number);
  const deg = degs[sampleIndex(rng, degs.map((x) => M.data.firstDeg[x]))];
  const target = env.waves[0][0];
  let best = deg;
  for (let o = -3; o <= 3; o++) {
    const dd = o * 7 + deg;
    if (Math.abs(midiOf(dd, env.key) - target) < Math.abs(midiOf(best, env.key) - target)) best = dd;
  }
  return best;
}

/** Writes beats [from, to) of `genes` with the model, continuing from what is before `from`. */
function writeBeats(M, env, genes, from, to, rng, used) {
  const meter = meterOf(env.meter ?? env.stepsPerBar);
  const B = meter.beat;
  const line = genesToLine(genes);
  const before = lineToBeats(line.pitch.slice(0, from * B), line.onset.slice(0, from * B), { meter, key: env.key });
  const hist = before.map((b) => M.figIndex(b.cell));
  // the last two notes before `from`
  const notes = [];
  for (let s = from * B - 1; s >= 0 && notes.length < 2; s--) if (line.onset[s] && line.pitch[s] !== null) notes.unshift({ midi: line.pitch[s], d: dposOf(line.pitch[s], env.key) });
  let sounding = from > 0 && line.pitch[from * B - 1] !== null;
  for (let b = from; b < to; b++) {
    const last = notes[notes.length - 1] ?? null;
    const pen = notes.length >= 2 ? notes[notes.length - 2] : null;
    const d5 = dirClass(last && pen ? last.midi - pen.midi : null);
    const pos = b % meter.beats;
    const f = { pos: pos % M.data.beats, cls: beatClass(pos, meter), d5, d3: dir3(d5), deg: last ? mod(last.d, 7) : -1 };
    for (let k = 1; k <= MAX_ORDER; k++) f[`f${k}`] = hist.length - k >= 0 ? hist[hist.length - k] : START;
    const fi = nextFigure(M, f, used, rng);
    const cell = M.figs[fi];
    f.fig = fi;
    let k = 0;
    let dd = last ? last.d : null;
    let steps = [];
    for (let i = 0; i < B; i++) {
      const s = b * B + i;
      const ch = cell[i];
      if (ch === 'x') {
        if (k === 0) {
          dd = last ? entryDegree(M, env, f, last.d, s, rng) : startDegree(M, env, rng);
          const ed = dirClass(last ? midiOf(dd, env.key) - last.midi : null);
          steps = contourSteps(M, { ...f, fig: fi, ed }, M.onsets[fi] - 1, rng);
        } else dd += steps[k - 1] ?? (rng.chance(0.5) ? 1 : -1);
        let m = midiOf(dd, env.key);
        while (m > env.highMidi) (dd -= 7), (m = midiOf(dd, env.key));
        while (m < env.lowMidi) (dd += 7), (m = midiOf(dd, env.key));
        genes[s] = clampGene(midiToGene(m));
        notes.push({ midi: m, d: dd });
        if (notes.length > 2) notes.shift();
        sounding = true;
        k++;
      } else if (ch === '_') genes[s] = sounding ? HOLD : REST;
      else {
        genes[s] = REST;
        sounding = false;
      }
    }
    hist.push(fi);
    used.add(fi);
  }
  if (genes[0] === HOLD) genes[0] = REST;
  return genes;
}

/** A whole initial individual written with the corpus blocks of the meter. */
export function blockGenome(M, env, rng) {
  const genes = new Array(env.length).fill(REST);
  const B = meterOf(env.meter ?? env.stepsPerBar).beat;
  return writeBeats(M, env, genes, 0, Math.floor(env.length / B), rng, new Set());
}

/** Mutation: rewrite one or two beats with blocks that fit what comes before (and the rest of the piece). */
export function blockMutate(M, genes, env, rng) {
  const meter = meterOf(env.meter ?? env.stepsPerBar);
  const B = meter.beat;
  const beats = Math.floor(env.length / B);
  const from = rng.int(0, beats - 1);
  const to = Math.min(beats, from + (rng.chance(0.3) ? 2 : 1));
  const line = genesToLine(genes);
  const used = new Set(lineToBeats(line.pitch, line.onset, { meter, key: env.key }).map((b) => M.figIndex(b.cell)).filter((x) => x >= 0));
  const next = to * B < genes.length ? genes[to * B] : null;
  writeBeats(M, env, genes, from, to, rng, used);
  // a held note after the rewritten beats needs a note to hold
  if (next === HOLD && to * B < genes.length && !isNote(genes[to * B - 1]) && genes[to * B - 1] !== HOLD) genes[to * B] = REST;
  return genes;
}
