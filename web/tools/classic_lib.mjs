// Shared pieces of the classic-algorithm study (tools/classic_study.mjs):
//   * real melodies of three styles as 8-bar windows on the original's 16th grid, in G major;
//   * one run of the original GA (binary operators, as GeneticSharp) with a set of parameters;
//   * what we measure on the result: the critic, typicality against all real melodies and
//     against each style, and a few audible descriptors.
import { readFileSync } from 'node:fs';
import { fromEvents, compactToEvents, toEvents, eventsToCompact, STEPS_PER_BAR } from '../src/core/score.js';
import { createClassicFitness, CLASSIC_DEFAULTS } from '../src/fitness/classic.js';
import { cadenceModel, cadenceLogP, endingOfGenes } from '../src/fitness/cadence.js';
import cadenceData from '../src/data/cadence-data.js';
import { createGA } from '../src/ga/ga.js';
import { createRng } from '../src/core/rng.js';
import { loadCritic } from '../src/eval/critic.js';
import criticData from '../src/data/critic-data.js';

const here = new URL('.', import.meta.url).pathname;
export const critic = loadCritic(criticData);
export const FEATURES = criticData.features;
export const RULES = [...Object.keys(CLASSIC_DEFAULTS.g1)];
export const BARS = 8;
export const LEN = BARS * STEPS_PER_BAR;
export const TONIC = 7; // G major = scale 1 of the original
const cadence = cadenceModel(cadenceData);
const mod = (a, n) => ((a % n) + n) % n;

export const STYLES = {
  song: { label: 'Canção popular', sources: ['essen'] },
  dance: { label: 'Dança (reels, hornpipes)', sources: ['oneills', 'ryans', 'airds'] },
  chorale: { label: 'Coral', sources: ['bach-chorale'] },
};

// ------------------------------------------------------------------ real melodies

/** Drop the anacrusis and fill the last bar (as tools/reverse.mjs). 2/4 bars are paired into 4/4. */
function alignToBars(m) {
  let t = 0;
  const ev = [];
  for (const [p, d] of m.events) {
    const a = Math.max(t, m.pickup);
    const b = t + d;
    if (b > a) ev.push([p, b - a]);
    t = b;
  }
  while (ev.length && ev[ev.length - 1][0] < 0) ev.pop();
  const total = ev.reduce((a, e) => a + e[1], 0);
  const bars = Math.ceil(total / STEPS_PER_BAR);
  if (ev.length) ev[ev.length - 1][1] += bars * STEPS_PER_BAR - total;
  return { events: ev, bars };
}

/** The last 8 bars (so the window holds the real ending), transposed to G major. */
function window8(m) {
  const { events, bars } = alignToBars(m);
  if (bars < BARS || events.length < 12) return null;
  const skip = (bars - BARS) * STEPS_PER_BAR;
  let shift = mod(TONIC - m.tonic, 12);
  if (shift > 6) shift -= 12;
  const out = [];
  let t = 0;
  for (const [p, d] of events) {
    const a = Math.max(t, skip);
    const b = t + d;
    if (b > a) out.push([p < 0 ? -1 : p + shift, b - a]);
    t = b;
  }
  while (out.length && out[0][0] < 0) out.shift();
  const total = out.reduce((a, e) => a + e[1], 0);
  if (total < LEN) out.unshift([-1, LEN - total]);
  const genes = fromEvents(compactToEvents(out), LEN);
  if (genes.some((g) => g !== 0 && g !== 74 && (g < 1 || g > 73))) return null;
  return { compact: out, genes };
}

let realCache = null;
/** { style: { train: [...], test: [...] } } with { compact, genes, features } per melody (major only). */
export function realStyles() {
  if (realCache) return realCache;
  const corpus = JSON.parse(readFileSync(`${here}../data/corpus-large.json`, 'utf8')).melodies;
  realCache = {};
  for (const [id, s] of Object.entries(STYLES)) {
    const ms = corpus.filter((m) => s.sources.includes(m.source) && m.mode === 'major' && (m.barLen === 16 || m.barLen === 8));
    const items = [];
    for (const m of ms) {
      const w = window8(m);
      if (w) items.push({ ...w, features: critic.features(w.compact, { barLen: 16 }), title: m.title });
    }
    realCache[id] = { train: items.filter((_, i) => i % 5 !== 0), test: items.filter((_, i) => i % 5 === 0) };
  }
  return realCache;
}

/** Percentiles of the 26 descriptors of one style (train split). */
export function styleStats(items) {
  return FEATURES.map((f) => {
    const v = items.map((x) => x.features[f]).filter(Number.isFinite).sort((a, b) => a - b);
    const q = (p) => v[Math.floor(p * (v.length - 1))];
    return [q(0.1), q(0.5), q(0.9)];
  });
}

// ------------------------------------------------------------------ measuring a melody

export function measure(genes, stats) {
  const ev = toEvents(genes);
  const compact = eventsToCompact(ev);
  const c = critic.evaluate(compact, { barLen: 16 });
  // style typicality: share of the 26 descriptors inside the style's P10-P90; style distance:
  // mean of |x - median| / spread (spread = (P90 - P10) / 2.56, a standard deviation for normal
  // data), capped at 3, so that an extreme value always counts against (a count alone can be gamed)
  const style = {};
  const dist = {};
  for (const [id, st] of Object.entries(stats)) {
    let inside = 0;
    let d = 0;
    FEATURES.forEach((f, j) => {
      const x = c.features[f];
      if (x >= st[j][0] && x <= st[j][2]) inside++;
      const spread = Math.max(1e-6, (st[j][2] - st[j][0]) / 2.56);
      d += Number.isFinite(x) ? Math.min(3, Math.abs(x - st[j][1]) / spread) : 3;
    });
    style[id] = inside / FEATURES.length;
    dist[id] = d / FEATURES.length;
  }
  const e = endingOfGenes(genes, TONIC);
  const notes = ev.filter((x) => x.pitch !== null).length;
  return {
    critic: c.humanLike,
    typical: c.typicality * FEATURES.length,
    style,
    dist,
    notesPerBeat: notes / (BARS * 4),
    step: c.features.stepMovement,
    range: c.features.pitchRange,
    rests: c.features.restRatio,
    repeated: c.features.repeatedPitch,
    endsOnTonic: e ? (e.pcs[2] === 0 ? 1 : 0) : 0,
    cadenceLogP: e ? cadenceLogP(cadence, 'major', e.pcs, e.last, e.pos, e.dur, e.reg) : -30,
  };
}

// ------------------------------------------------------------------ one GA run

export const ORIGINAL = {
  g1: { ...CLASSIC_DEFAULTS.g1 }, g2: { ...CLASSIC_DEFAULTS.g2 },
  waves: CLASSIC_DEFAULTS.waves.map((w) => ({ ...w })),
  balanceMin: 7, balanceMax: 40, rangeAttractor: 15, fixLapses: false, phase1Fraction: 0.25,
  mutation: 0.1, popSize: 60, generations: 1500, operators: 'binary',
};

export function fitnessFor(p) {
  return createClassicFitness({
    scale: 1, major: true, bars: BARS, g1: p.g1, g2: p.g2, waves: p.waves,
    balanceMin: p.balanceMin, balanceMax: p.balanceMax, rangeAttractor: p.rangeAttractor,
    fixLapses: p.fixLapses, phase1Fraction: p.phase1Fraction, alwaysCadence: true,
  });
}

export function runClassic(p, seed, { keep = 0 } = {}) {
  const fit = fitnessFor(p);
  const musical = p.operators === 'musical';
  const key = { tonic: TONIC, mode: 'major', diatonic: [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1].map(Boolean) };
  const env = { key, waves: fit.waves, basin: 3, lowMidi: 48, highMidi: 96, length: fit.length, stepsPerBar: STEPS_PER_BAR };
  const ga = createGA({
    fitness: fit, rng: createRng(seed), length: fit.length, env,
    generations: p.generations, popSize: p.popSize, mutationRate: p.mutation,
    strategy: musical ? 'tournament' : 'geneticsharp', operators: musical ? 'musical' : 'binary',
    initMode: 'musical',
  });
  ga.step(Infinity);
  const out = { best: ga.best.decoded };
  if (keep) out.population = ga.population.slice(0, keep).map((x) => ga.decode(x.genes));
  return out;
}

/** Components of the classic fitness (group-2 view, no range annealing) for a gene sequence. */
export function componentsOf(fit, genes) {
  return fit.components(genes, Infinity);
}

// ------------------------------------------------------------------ inverse calibration

/**
 * Non-negative rule weights under which real melodies score above the negatives (pairwise
 * logistic loss on standardised rule scores, projected gradient). Returns raw weights per rule.
 */
export function learnWeights(pos, neg, rules, { pairs = 20000, l2 = 0.01, iters = 400, rng }) {
  const all = pos.concat(neg);
  const mean = rules.map((r) => all.reduce((a, x) => a + x[r], 0) / all.length);
  const sd = rules.map((r, k) => Math.sqrt(all.reduce((a, x) => a + (x[r] - mean[k]) ** 2, 0) / all.length) || 0);
  const D = [];
  for (let n = 0; n < pairs; n++) {
    const a = pos[rng.int(0, pos.length - 1)];
    const b = neg[rng.int(0, neg.length - 1)];
    D.push(rules.map((r, k) => (sd[k] > 1e-9 ? (a[r] - b[r]) / sd[k] : 0)));
  }
  let w = rules.map(() => 0.1);
  const lr = 0.5;
  for (let it = 0; it < iters; it++) {
    const g = rules.map(() => 0);
    for (const d of D) {
      let z = 0;
      for (let k = 0; k < d.length; k++) z += w[k] * d[k];
      const s = -1 / (1 + Math.exp(z)); // d/dz log(1 + e^-z)
      for (let k = 0; k < d.length; k++) g[k] += s * d[k];
    }
    w = w.map((wk, k) => Math.max(0, wk - lr * (g[k] / D.length + l2 * wk)));
  }
  let correct = 0;
  for (const d of D) correct += d.reduce((a, x, k) => a + w[k] * x, 0) > 0 ? 1 : 0;
  const raw = Object.fromEntries(rules.map((r, k) => [r, sd[k] > 1e-9 ? w[k] / sd[k] : 0]));
  return { raw, standardized: Object.fromEntries(rules.map((r, k) => [r, w[k]])), pairAccuracy: correct / D.length };
}

/** Local neighbours of a real melody, as the original's operators would produce them. */
export function perturb(genes, k, rng) {
  const g = genes.slice();
  for (let n = 0; n < k; n++) g[rng.int(0, g.length - 1)] = rng.int(0, 74);
  return g;
}
