// Study of the ORIGINAL algorithm (classic mode): which of its values bring its melodies close to
// real music, and three starting combinations ("presets") that do it as well as the algorithm
// allows. Four phases:
//   screen    screening design of experiments: Plackett-Burman (Sylvester Hadamard 32) with
//             fold-over, 64 runs x 3 seeds, 30 factors of the original (the 16 rule weights, the
//             two waves, range, balance, lapses, mutation, population, weight groups) + 1 dummy;
//   calibrate backwards, per style (songs, dances, chorales): the constants measured on real
//             melodies, then rule weights under which real melodies score above their neighbours
//             and above what the GA currently writes (iterated, like contrastive / inverse RL);
//   optimize  forward, from each calibrated preset: cross-entropy method over the 16 weights and
//             11 constants (14 iterations x 16 candidates x 3 seeds), confirmed with 12 new seeds;
//   local     local screening around each chosen preset (Plackett-Burman, 32 runs x 3 seeds):
//             which values still matter once the algorithm works;
//   optimize-musical, local-musical: the same with the musical operators of the page (beat
//             cells, scale steps), starting from the combination found for the original operators;
//   confirm   24 seeds: the original, the original with its lapses fixed, and each preset, with
//             the original (binary) operators and with the musical operators.
//   node tools/classic_study.mjs [all|screen|calibrate|optimize|local|optimize-musical|local-musical|confirm]
// Writes results/classic-study.json, results/classic-study.md and src/data/classic-presets.js.
import { Worker } from 'node:worker_threads';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import {
  realStyles, styleStats, measure, ORIGINAL, RULES, STYLES, fitnessFor, componentsOf, learnWeights, perturb,
} from './classic_lib.mjs';
import { createRng } from '../src/core/rng.js';
import { GENE_A4 } from '../src/core/score.js';

const here = new URL('.', import.meta.url).pathname;
const JSON_OUT = `${here}../results/classic-study.json`;
const phase = process.argv[2] || 'all';
const THREADS = Number(process.env.THREADS || 4);
const state = existsSync(JSON_OUT) ? JSON.parse(readFileSync(JSON_OUT, 'utf8')) : {};
const save = () => writeFileSync(JSON_OUT, JSON.stringify(state, null, 1));
const t0 = Date.now();
const log = (...a) => console.error(`[${((Date.now() - t0) / 1000).toFixed(0)} s]`, ...a);

export const RULE_LABELS = {
  rhythmicPatterns: 'Padrões rítmicos', selfHarm1: 'Auto-harmonização 1', selfHarm2: 'Auto-harmonização 2',
  aba: 'Repetição ABA (4 c.)', leitmotif: 'Leitmotiv (ritmo do 1.º c.)', wave1: 'Onda 1', wave2: 'Onda 2',
  range: 'Âmbito', scale: 'Escala', pauseProlongation: 'Pausas e prolongamentos', reduceRepetitions: 'Repetições excessivas',
  intervals: 'Intervalos', niceRepetitions: 'Repetições interessantes', ending: 'Terminação (nota longa)',
  balance: 'Equilíbrio notas/pausas', cadence: 'Fórmulas de final (corpus)',
};

// ------------------------------------------------------------------ worker pool
function makePool(n) {
  const workers = Array.from({ length: n }, () => new Worker(new URL('./classic_worker.mjs', import.meta.url)));
  const idle = [...workers];
  const queue = [];
  const pending = new Map();
  let nextId = 0;
  const pump = () => {
    while (idle.length && queue.length) {
      const w = idle.pop();
      const job = queue.shift();
      pending.set(job.id, { job, w });
      w.postMessage({ id: job.id, params: job.params, seed: job.seed, keep: job.keep });
    }
  };
  for (const w of workers) {
    w.on('message', (msg) => {
      const { job } = pending.get(msg.id);
      pending.delete(msg.id);
      idle.push(w);
      pump();
      job.resolve(msg);
    });
  }
  return {
    run: (params, seed, keep = 0) => new Promise((resolve) => {
      queue.push({ id: nextId++, params, seed, keep, resolve });
      pump();
    }),
    close: () => workers.forEach((w) => w.terminate()),
  };
}

const clone = (x) => JSON.parse(JSON.stringify(x));
const NUM = ['critic', 'typical', 'notesPerBeat', 'step', 'range', 'rests', 'repeated', 'endsOnTonic', 'cadenceLogP'];
function average(ms) {
  const out = {};
  for (const k of NUM) out[k] = ms.reduce((a, m) => a + m[k], 0) / ms.length;
  out.style = {};
  out.dist = {};
  for (const s of Object.keys(STYLES)) {
    out.style[s] = ms.reduce((a, m) => a + m.style[s], 0) / ms.length;
    out.dist[s] = ms.reduce((a, m) => a + m.dist[s], 0) / ms.length;
  }
  return out;
}
const sd = (xs) => {
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1));
};
async function runSeeds(pool, params, seeds, keep = 0) {
  const rs = await Promise.all(seeds.map((s) => pool.run(params, s, keep)));
  return { mean: average(rs.map((r) => r.metrics)), all: rs.map((r) => r.metrics), raw: rs };
}
/**
 * Objective for a style: as real as the critic says (0.4), as many descriptors as possible inside the
 * style's P10-P90 (0.3), and close to the style's medians (0.3; distance capped at 3 spreads).
 */
const objective = (m, style) => 0.4 * m.critic + 0.3 * m.style[style] + 0.3 * (1 - m.dist[style] / 3);

// ------------------------------------------------------------------ 1. screening DOE
function hadamard(n) {
  let H = [[1]];
  while (H.length < n) H = H.flatMap((r) => [r.concat(r), r.concat(r.map((x) => -x))]);
  return H;
}

const CADENCE_ON = 10;
const setWeight = (p, r, on) => {
  p.g1[r] = on ? (r === 'cadence' ? CADENCE_ON : ORIGINAL.g1[r]) : 0;
  p.g2[r] = on ? (r === 'cadence' ? CADENCE_ON : ORIGINAL.g2[r]) : 0;
};
// -1 = the original value (for rule weights: rule off), +1 = the alternative
export const FACTORS = [
  ...RULES.map((r) => ({ id: r, label: `Peso: ${RULE_LABELS[r]}`, low: '0', high: r === 'cadence' ? String(CADENCE_ON) : 'original', set: (p, x) => setWeight(p, r, x > 0) })),
  { id: 'rangeAttractor', label: 'Âmbito atrator (± meios-tons)', low: '15', high: '7', set: (p, x) => (p.rangeAttractor = x > 0 ? 7 : 15) },
  { id: 'balanceRange', label: 'Pausas + prolongamentos admitidos', low: '7–40 %', high: '55–80 %', set: (p, x) => ([p.balanceMin, p.balanceMax] = x > 0 ? [55, 80] : [7, 40]) },
  { id: 'w1amp', label: 'Onda 1: amplitude', low: '12', high: '3', set: (p, x) => (p.waves[0].amplitude = x > 0 ? 3 : 12) },
  { id: 'w1per', label: 'Onda 1: períodos por compasso', low: '0,5', high: '0,125', set: (p, x) => (p.waves[0].periodsPerBar = x > 0 ? 0.125 : 0.5) },
  { id: 'w1basin', label: 'Onda 1: bacia', low: '3', high: '5', set: (p, x) => (p.waves[0].threshold = x > 0 ? 5 : 3) },
  { id: 'w1mean', label: 'Onda 1: valor médio', low: 'Lá4', high: 'Si4', set: (p, x) => (p.waves[0].mean = x > 0 ? GENE_A4 + 2 : GENE_A4) },
  { id: 'w2amp', label: 'Onda 2: amplitude', low: '4', high: '2', set: (p, x) => (p.waves[1].amplitude = x > 0 ? 2 : 4) },
  { id: 'w2per', label: 'Onda 2: períodos por compasso', low: '2', high: '0,5', set: (p, x) => (p.waves[1].periodsPerBar = x > 0 ? 0.5 : 2) },
  { id: 'w2mean', label: 'Onda 2: valor médio', low: 'Ré4', high: 'Si4', set: (p, x) => (p.waves[1].mean = x > 0 ? GENE_A4 + 2 : GENE_A4 - 7) },
  { id: 'w2basin', label: 'Onda 2: bacia', low: '2', high: '4', set: (p, x) => (p.waves[1].threshold = x > 0 ? 4 : 2) },
  { id: 'fixLapses', label: 'Corrigir lapsos do original', low: 'não', high: 'sim', set: (p, x) => (p.fixLapses = x > 0) },
  { id: 'mutation', label: 'Mutação', low: '0,1', high: '0,3', set: (p, x) => (p.mutation = x > 0 ? 0.3 : 0.1) },
  { id: 'popSize', label: 'População', low: '60', high: '120', set: (p, x) => (p.popSize = x > 0 ? 120 : 60) },
  { id: 'phase1', label: 'Grupos de pesos', low: '1 → 2 (25 %)', high: 'só o grupo 2', set: (p, x) => (p.phase1Fraction = x > 0 ? 0 : 0.25) },
  { id: 'dummy', label: '(fator fictício: estima o ruído)', low: '–', high: '–', set: () => {} },
];
const RESPONSES = [
  ['critic', 'Crítico', (m) => m.critic],
  ['typical', 'Típicas /26', (m) => m.typical],
  ['song', 'Estilo canção', (m) => m.style.song],
  ['dance', 'Estilo dança', (m) => m.style.dance],
  ['chorale', 'Estilo coral', (m) => m.style.chorale],
  ['notesPerBeat', 'Notas por tempo', (m) => m.notesPerBeat],
  ['step', 'Graus conjuntos', (m) => m.step],
  ['range', 'Âmbito (meios-tons)', (m) => m.range],
  ['endsOnTonic', 'Acaba na tónica', (m) => m.endsOnTonic],
];

/** Lenth's pseudo standard error and margin of error for unreplicated factorial effects. */
function lenth(effects) {
  const a = effects.map(Math.abs).sort((x, y) => x - y);
  const med = (v) => v[Math.floor((v.length - 1) / 2)];
  const s0 = 1.5 * med(a);
  const pse = 1.5 * med(a.filter((x) => x < 2.5 * s0));
  const t = 2.2; // t(0.975, m/3 = 10)
  return { pse, me: t * pse };
}

async function screen(pool) {
  log('screening: 64 runs x 3 seeds');
  const H = hadamard(32);
  const base = H.map((r) => r.slice(1));
  const rows = base.concat(base.map((r) => r.map((x) => -x)));
  const runs = await Promise.all(rows.map(async (row, i) => {
    const p = clone(ORIGINAL);
    FACTORS.forEach((f, j) => f.set(p, row[j]));
    const r = await runSeeds(pool, p, [1, 2, 3].map((s) => 1000 * (i + 1) + s));
    return { row, mean: r.mean };
  }));
  const effects = {};
  for (const [id, , get] of RESPONSES) {
    const y = runs.map((r) => get(r.mean));
    const eff = FACTORS.map((f, j) => {
      const hi = runs.filter((r) => r.row[j] > 0).map((r, k) => get(r.mean));
      const lo = runs.filter((r) => r.row[j] < 0).map((r) => get(r.mean));
      return hi.reduce((a, b) => a + b, 0) / hi.length - lo.reduce((a, b) => a + b, 0) / lo.length;
    });
    const { pse, me } = lenth(eff);
    effects[id] = { effects: eff, pse, me, mean: y.reduce((a, b) => a + b, 0) / y.length };
  }
  state.screen = { factors: FACTORS.map(({ id, label, low, high }) => ({ id, label, low, high })), runs, effects };
  save();
  log('screening done');
}

// ------------------------------------------------------------------ 2. inverse calibration
const q = (v, p) => {
  const s = v.slice().sort((a, b) => a - b);
  return s[Math.floor(p * (s.length - 1))];
};
/** The constants of the original, measured on the real melodies of a style. */
function constantsOf(items) {
  const nonNote = [];
  const med = [];
  const resid = [];
  const amp = [];
  for (const x of items) {
    const notes = x.genes.filter((g) => g > 0 && g < 74);
    nonNote.push((100 * x.genes.filter((g) => g === 0 || g === 74).length) / x.genes.length);
    const m = q(notes, 0.5);
    med.push(m);
    for (const g of notes) resid.push(Math.abs(g - m));
    const bars = [];
    for (let b = 0; b < 8; b++) {
      const seg = [];
      let cur = null;
      for (let i = 0; i < 16; i++) {
        const g = x.genes[b * 16 + i];
        if (g > 0 && g < 74) cur = g;
        if (cur !== null && g !== 0) seg.push(cur);
      }
      if (seg.length) bars.push(seg.reduce((a, c) => a + c, 0) / seg.length);
    }
    amp.push((Math.max(...bars) - Math.min(...bars)) / 2);
  }
  const centre = Math.round(q(med, 0.5));
  const basin = Math.round(q(resid, 0.75));
  return {
    rangeAttractor: Math.round(q(resid, 0.9)) + 2,
    balanceMin: Math.round(q(nonNote, 0.1)),
    balanceMax: Math.round(q(nonNote, 0.9)),
    waves: [
      { threshold: basin, periodsPerBar: 0.125, amplitude: Math.round(q(amp, 0.5)), mean: centre, shift: 0 },
      { threshold: Math.max(2, basin - 1), periodsPerBar: 1, amplitude: 2, mean: centre, shift: 0 },
    ],
  };
}

const niceWeights = (raw) => {
  const max = Math.max(...Object.values(raw));
  return Object.fromEntries(RULES.map((r) => [r, max > 0 ? Number(((20 * raw[r]) / max).toPrecision(2)) : 0]));
};

async function calibrate(pool) {
  const R = realStyles();
  const rng = createRng(77);
  state.calibrate = {};
  for (const style of Object.keys(STYLES)) {
    const train = R[style].train;
    const consts = constantsOf(train);
    let p = { ...clone(ORIGINAL), ...consts, fixLapses: true, phase1Fraction: 0 };
    p.g1 = { ...ORIGINAL.g2, cadence: CADENCE_ON };
    p.g2 = { ...p.g1 };
    const posGenes = train.slice(0, 600).map((x) => x.genes);
    const negGenes = [];
    for (const x of train.slice(0, 300)) for (const k of [2, 6, 16, 48]) negGenes.push(perturb(x.genes, k, rng));
    const rounds = [];
    for (let round = 0; round < 6; round++) {
      const fit = fitnessFor(p);
      const L = learnWeights(posGenes.map((g) => componentsOf(fit, g)), negGenes.map((g) => componentsOf(fit, g)), RULES, { rng });
      const w = niceWeights(L.raw);
      p = { ...p, g1: w, g2: { ...w } };
      const r = await runSeeds(pool, p, Array.from({ length: 8 }, (_, s) => 50000 + 100 * round + s), 12);
      for (const x of r.raw) negGenes.push(x.best, ...x.population);
      rounds.push({ weights: w, pairAccuracy: L.pairAccuracy, ga: r.mean });
      log(`calibrate ${style} round ${round}: pairs ${L.pairAccuracy.toFixed(3)} critic ${r.mean.critic.toFixed(2)} style ${r.mean.style[style].toFixed(2)} npb ${r.mean.notesPerBeat.toFixed(2)} range ${r.mean.range.toFixed(1)}`);
    }
    // average of the last three rounds (the learner chases the GA; the average is steadier)
    const last = rounds.slice(-3).map((x) => x.weights);
    const avg = Object.fromEntries(RULES.map((r) => [r, last.reduce((a, w) => a + w[r], 0) / last.length]));
    const w = niceWeights(avg);
    const preset = { ...p, g1: w, g2: { ...w } };
    state.calibrate[style] = { constants: consts, rounds, preset };
    save();
  }
  log('calibration done');
}

// ------------------------------------------------------------------ 3. forward optimisation
// Cross-entropy method (a sequential stochastic design, robust to noisy responses): sample
// candidate parameter sets around the current mean, keep the best (elite), move the mean and
// shrink the spread towards them. Common seeds within an iteration reduce the noise of the
// comparison. Starts from the calibrated preset of each style.
const W1_PERIODS = [0.0625, 0.125, 0.25, 0.5];
const W2_PERIODS = [0.25, 0.5, 1, 2];
const CONSTS = [
  { id: 'rangeAttractor', label: 'Âmbito atrator (±)', lo: 3, hi: 16, get: (p) => p.rangeAttractor, set: (p, v) => (p.rangeAttractor = Math.round(v)) },
  { id: 'balanceMin', label: 'Pausas + prolongamentos: mínimo (%)', lo: 0, hi: 90, get: (p) => p.balanceMin, set: (p, v) => (p.balanceMin = Math.round(v)) },
  { id: 'balanceWidth', label: 'Pausas + prolongamentos: largura (%)', lo: 10, hi: 60, get: (p) => p.balanceMax - p.balanceMin, set: (p, v) => (p.balanceMax = Math.min(100, p.balanceMin + Math.round(v))) },
  { id: 'w1amp', label: 'Onda 1: amplitude', lo: 0, hi: 8, get: (p) => p.waves[0].amplitude, set: (p, v) => (p.waves[0].amplitude = Math.round(v)) },
  { id: 'w1basin', label: 'Onda 1: bacia', lo: 1, hi: 8, get: (p) => p.waves[0].threshold, set: (p, v) => (p.waves[0].threshold = Math.round(v)) },
  { id: 'w1per', label: 'Onda 1: períodos por compasso', lo: 0, hi: 3.999, get: (p) => Math.max(0, W1_PERIODS.indexOf(p.waves[0].periodsPerBar)), set: (p, v) => (p.waves[0].periodsPerBar = W1_PERIODS[Math.floor(v)]) },
  { id: 'w1mean', label: 'Onda 1: valor médio (desvio)', lo: -4, hi: 4, get: (p, c) => p.waves[0].mean - c, set: (p, v, c) => (p.waves[0].mean = c + Math.round(v)) },
  { id: 'w2amp', label: 'Onda 2: amplitude', lo: 0, hi: 4, get: (p) => p.waves[1].amplitude, set: (p, v) => (p.waves[1].amplitude = Math.round(v)) },
  { id: 'w2basin', label: 'Onda 2: bacia', lo: 1, hi: 6, get: (p) => p.waves[1].threshold, set: (p, v) => (p.waves[1].threshold = Math.round(v)) },
  { id: 'w2per', label: 'Onda 2: períodos por compasso', lo: 0, hi: 3.999, get: (p) => Math.max(0, W2_PERIODS.indexOf(p.waves[1].periodsPerBar)), set: (p, v) => (p.waves[1].periodsPerBar = W2_PERIODS[Math.floor(v)]) },
  { id: 'mutation', label: 'Mutação', lo: 0.05, hi: 0.5, get: (p) => p.mutation, set: (p, v) => (p.mutation = Number(v.toFixed(3))) },
];
// with the musical operators the page mutates 90 % of the children; search 0.3–1 there
const MUTATION_MUSICAL = { lo: 0.3, hi: 1 };
const musicalOps = (p) => ({ ...p, operators: 'musical', generations: 600, popSize: 80, mutation: p.operators === 'musical' ? p.mutation : 0.9 });

/** Typical size of each rule's score on real melodies: weights are searched as exp(theta) / size. */
function ruleSizes(p, items) {
  const fit = fitnessFor(p);
  const cs = items.slice(0, 300).map((x) => componentsOf(fit, x.genes));
  return Object.fromEntries(RULES.map((r) => {
    const v = cs.map((c) => c[r]);
    const m = v.reduce((a, b) => a + b, 0) / v.length;
    const s = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length);
    return [r, Math.max(1, s, 0.05 * Math.abs(m))];
  }));
}

function encode(p, sizes, centre) {
  const contrib = RULES.map((r) => (p.g2[r] ?? 0) * sizes[r]);
  const floor = 0.05 * Math.max(...contrib);
  return [
    ...contrib.map((c) => Math.log(Math.max(c, floor))),
    ...CONSTS.map((k) => (k.get(p, centre) - k.lo) / (k.hi - k.lo)),
  ];
}
function decode(x, base, sizes, centre) {
  const p = clone(base);
  const w = {};
  RULES.forEach((r, i) => (w[r] = Number((Math.exp(x[i]) / sizes[r]).toPrecision(3))));
  p.g1 = w;
  p.g2 = { ...w };
  CONSTS.forEach((k, j) => {
    const u = Math.min(1, Math.max(0, x[RULES.length + j]));
    k.set(p, k.lo + u * (k.hi - k.lo), centre);
  });
  return p;
}
/** Friendlier weights for the page: the largest is 20, two significant digits. */
function roundWeights(p) {
  const max = Math.max(...Object.values(p.g2));
  const w = Object.fromEntries(RULES.map((r) => [r, Number(((20 * p.g2[r]) / max).toPrecision(2))]));
  return { ...p, g1: w, g2: { ...w } };
}

async function optimize(pool, { musical = false } = {}) {
  const R = realStyles();
  const rng = createRng(musical ? 3031 : 2024);
  const key = musical ? 'optimizeMusical' : 'optimize';
  state[key] = {};
  const mut = CONSTS.find((k) => k.id === 'mutation');
  if (musical) Object.assign(mut, MUTATION_MUSICAL);
  const ITERS = Number(process.env.ITERS || (musical ? 12 : 14));
  const N = 16;
  const ELITE = 5;
  for (const style of Object.keys(STYLES)) {
    // the musical-operator search starts from the combination found for the original operators
    const base = musical ? musicalOps(state.optimize[style].preset) : state.calibrate[style].preset;
    const centre = state.calibrate[style].constants.waves[0].mean;
    const sizes = ruleSizes(base, R[style].train);
    let mu = encode(base, sizes, centre);
    let sigma = mu.map((_, i) => (i < RULES.length ? 1 : 0.25));
    const history = [];
    const evaluated = [];
    for (let it = 0; it < ITERS; it++) {
      const seeds = [1, 2, 3].map((s) => (musical ? 500000 : 200000) + 100 * it + s);
      const xs = [mu.slice()];
      while (xs.length < N) xs.push(mu.map((m, i) => m + sigma[i] * rng.gauss()));
      const scored = await Promise.all(xs.map(async (x) => {
        const p = decode(x, base, sizes, centre);
        const r = await runSeeds(pool, p, seeds);
        return { x, J: objective(r.mean, style), mean: r.mean };
      }));
      scored.sort((a, b) => b.J - a.J);
      evaluated.push(...scored.map((s) => ({ ...s, it })));
      const elite = scored.slice(0, ELITE);
      const m2 = mu.map((_, i) => elite.reduce((a, e) => a + e.x[i], 0) / ELITE);
      const s2 = mu.map((_, i) => Math.sqrt(elite.reduce((a, e) => a + (e.x[i] - m2[i]) ** 2, 0) / ELITE));
      mu = mu.map((m, i) => 0.3 * m + 0.7 * m2[i]);
      sigma = sigma.map((s, i) => Math.max(i < RULES.length ? 0.15 : 0.03, 0.3 * s + 0.7 * s2[i]));
      history.push({ it, bestJ: scored[0].J, meanJ: scored.reduce((a, s) => a + s.J, 0) / scored.length, muJ: scored.find((s) => s.x === xs[0])?.J ?? null, critic: scored[0].mean.critic, style: scored[0].mean.style[style] });
      log(`${key} ${style} it ${it}: best J ${scored[0].J.toFixed(3)} (critic ${scored[0].mean.critic.toFixed(2)}, style ${scored[0].mean.style[style].toFixed(2)}), mean J ${history.at(-1).meanJ.toFixed(3)}`);
    }
    // confirm: the final mean, the calibrated start, and the three best evaluated sets, 12 new seeds
    const top = evaluated.slice().sort((a, b) => b.J - a.J).slice(0, 3);
    const candidates = [
      { id: musical ? 'de partida' : 'calibrada', p: base },
      { id: 'média final', p: decode(mu, base, sizes, centre) },
      ...top.map((t, k) => ({ id: `melhor avaliada ${k + 1}`, p: decode(t.x, base, sizes, centre) })),
    ];
    const confirmed = [];
    for (const c of candidates) {
      const p = roundWeights(c.p);
      const r = await runSeeds(pool, p, Array.from({ length: 12 }, (_, s) => (musical ? 600000 : 300000) + s));
      confirmed.push({ id: c.id, mean: r.mean, J: objective(r.mean, style), sdJ: sd(r.all.map((m) => objective(m, style))), p });
      log(`${key} ${style} confirm ${c.id}: J ${objective(r.mean, style).toFixed(3)} critic ${r.mean.critic.toFixed(2)} style ${r.mean.style[style].toFixed(2)}`);
    }
    const chosen = confirmed.slice().sort((a, b) => b.J - a.J)[0];
    state[key][style] = { history, confirmed: confirmed.map(({ p, ...rest }) => rest), chosen: chosen.id, preset: chosen.p };
    save();
  }
  log(`${key} done`);
}

// ------------------------------------------------------------------ 3b. local screening
// Which values matter once the algorithm works? Plackett-Burman (32 runs, 3 seeds) around each
// chosen preset: every rule weight halved or doubled, every constant one step down or up.
const LOCAL = [
  ...RULES.map((r) => ({ id: r, label: `Peso: ${RULE_LABELS[r]}`, set: (p, x) => { p.g1[r] *= x > 0 ? 2 : 0.5; p.g2[r] *= x > 0 ? 2 : 0.5; } })),
  { id: 'rangeAttractor', label: 'Âmbito atrator ±2', set: (p, x) => (p.rangeAttractor = Math.max(2, p.rangeAttractor + 2 * x)) },
  { id: 'balance', label: 'Intervalo de pausas ±10 %', set: (p, x) => { p.balanceMin = Math.max(0, p.balanceMin + 10 * x); p.balanceMax = Math.min(100, p.balanceMax + 10 * x); } },
  { id: 'w1amp', label: 'Onda 1: amplitude ±2', set: (p, x) => (p.waves[0].amplitude = Math.max(0, p.waves[0].amplitude + 2 * x)) },
  { id: 'w1basin', label: 'Onda 1: bacia ±1', set: (p, x) => (p.waves[0].threshold = Math.max(1, p.waves[0].threshold + x)) },
  { id: 'w1mean', label: 'Onda 1: valor médio ±2', set: (p, x) => (p.waves[0].mean += 2 * x) },
  { id: 'w2amp', label: 'Onda 2: amplitude ±1', set: (p, x) => (p.waves[1].amplitude = Math.max(0, p.waves[1].amplitude + x)) },
  { id: 'w2basin', label: 'Onda 2: bacia ±1', set: (p, x) => (p.waves[1].threshold = Math.max(1, p.waves[1].threshold + x)) },
  { id: 'mutation', label: 'Mutação ×/÷ 1,5', set: (p, x) => (p.mutation = Number((p.mutation * (x > 0 ? 1.5 : 1 / 1.5)).toFixed(3))) },
  { id: 'popSize', label: 'População 45 / 80', set: (p, x) => (p.popSize = x > 0 ? 80 : 45) },
  { id: 'dummy1', label: '(fictício)', set: () => {} },
  { id: 'dummy2', label: '(fictício)', set: () => {} },
  { id: 'dummy3', label: '(fictício)', set: () => {} },
  { id: 'dummy4', label: '(fictício)', set: () => {} },
  { id: 'dummy5', label: '(fictício)', set: () => {} },
  { id: 'dummy6', label: '(fictício)', set: () => {} },
];

async function localScreen(pool, { musical = false } = {}) {
  const H = hadamard(32).map((r) => r.slice(1));
  const key = musical ? 'localMusical' : 'local';
  state[key] = {};
  for (const style of Object.keys(STYLES)) {
    const base = state[musical ? 'optimizeMusical' : 'optimize'][style].preset;
    const runs = await Promise.all(H.map(async (row, i) => {
      const p = clone(base);
      LOCAL.forEach((f, j) => f.set(p, row[j]));
      const r = await runSeeds(pool, p, [1, 2, 3].map((s) => (musical ? 700000 : 400000) + 10 * i + s));
      return { row, J: objective(r.mean, style), critic: r.mean.critic, style: r.mean.style[style] };
    }));
    const eff = (get) => LOCAL.map((_, j) => {
      const hi = runs.filter((r) => r.row[j] > 0).map(get);
      const lo = runs.filter((r) => r.row[j] < 0).map(get);
      return hi.reduce((a, b) => a + b, 0) / hi.length - lo.reduce((a, b) => a + b, 0) / lo.length;
    });
    const J = eff((r) => r.J);
    state[key][style] = { factors: LOCAL.map((f) => f.label), J, me: lenth(J).me, critic: eff((r) => r.critic), style: eff((r) => r.style), meanJ: runs.reduce((a, r) => a + r.J, 0) / runs.length };
    save();
    log(`${key} ${style} done`);
  }
}

// ------------------------------------------------------------------ 4. confirmation
async function confirm(pool) {
  const musical = (p) => ({ ...p, operators: 'musical', generations: 600, popSize: 80, mutation: 0.9 });
  const configs = [
    { id: 'original', label: 'Original (valores do programa de 2020)', p: ORIGINAL },
    { id: 'original-fixed', label: 'Original, com os lapsos corrigidos', p: { ...clone(ORIGINAL), fixLapses: true } },
    ...Object.keys(STYLES).map((s) => ({ id: s, label: `Combinação «${STYLES[s].label}»`, p: state.optimize[s].preset })),
    { id: 'original-musical', label: 'Original + operadores musicais', p: musical(ORIGINAL) },
    { id: 'original-fixed-musical', label: 'Original, lapsos corrigidos + operadores musicais', p: musical({ ...clone(ORIGINAL), fixLapses: true }) },
    ...(state.optimizeMusical ? Object.keys(STYLES).map((s) => ({ id: `${s}-musical`, label: `Combinação «${STYLES[s].label}» afinada para os operadores musicais`, p: state.optimizeMusical[s].preset })) : []),
  ];
  const seeds = Array.from({ length: 24 }, (_, s) => 123000 + s);
  const R = realStyles();
  const stats = Object.fromEntries(Object.entries(R).map(([k, v]) => [k, styleStats(v.train)]));
  state.real = Object.fromEntries(Object.keys(STYLES).map((s) => [s, average(R[s].test.map((x) => measure(x.genes, stats)))]));
  state.confirm = [];
  for (const c of configs) {
    const r = await runSeeds(pool, c.p, seeds);
    const sds = { critic: sd(r.all.map((m) => m.critic)), typical: sd(r.all.map((m) => m.typical)) };
    state.confirm.push({ id: c.id, label: c.label, mean: r.mean, sd: sds, example: r.raw[0].best });
    log(`confirm ${c.id}: critic ${r.mean.critic.toFixed(2)} typical ${r.mean.typical.toFixed(1)} song ${r.mean.style.song.toFixed(2)} dance ${r.mean.style.dance.toFixed(2)} chorale ${r.mean.style.chorale.toFixed(2)}`);
  }
  save();
}

// ------------------------------------------------------------------ outputs
function toUiPreset(id, p) {
  const waves = p.waves.map((w) => ({ periods: w.periodsPerBar, meanA4: w.mean - GENE_A4, amplitude: w.amplitude, basin: w.threshold, shift: w.shift }));
  return {
    id, label: STYLES[id].label, g1: p.g1, g2: p.g2, waves,
    balanceMin: p.balanceMin, balanceMax: p.balanceMax, rangeAttractor: p.rangeAttractor, fixLapses: p.fixLapses,
    phase1Fraction: p.phase1Fraction, ga: { generations: p.generations, popSize: p.popSize, mutation: p.mutation, operators: p.operators },
  };
}

function writeOutputs() {
  const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2).replace('.', ',') : '—');
  const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1).replace('.', ',') : '—');
  const pc = (x) => `${Math.round(100 * x)} %`;
  let md = '# Estudo do algoritmo original: combinações de partida\n\nGerado por `node tools/classic_study.mjs`. Algoritmo do modo clássico (regras do C#, operadores de bits, seleção de elite como no GeneticSharp), 8 compassos em Sol maior. Melodias reais: as 8 últimas barras das melodias em maior do corpus grande (sem as 480 do crítico), por estilo.\n\n';
  if (state.screen) {
    const S = state.screen;
    md += '## 1. Triagem: que valores do original contam? (desenho de experiências)\n\nPlackett–Burman de 32 ensaios (Hadamard de Sylvester) com reflexão (64 ensaios, resolução IV: os efeitos principais não se confundem com interações de 2 fatores), 3 sementes por ensaio, 30 fatores + 1 fictício. Nível −1 = valor do original (para os pesos: regra desligada), +1 = alternativa. Efeito = média com +1 − média com −1. **Negrito**: acima da margem de erro de Lenth (≈ 95 %).\n\n';
    const cols = ['critic', 'typical', 'song', 'dance', 'chorale', 'notesPerBeat', 'step', 'range'];
    md += `| Fator | −1 | +1 | ${cols.map((c) => RESPONSES.find((r) => r[0] === c)[1]).join(' | ')} |\n|---|---|---|${cols.map(() => '---').join('|')}|\n`;
    S.factors.forEach((f, j) => {
      md += `| ${f.label} | ${f.low} | ${f.high} | ${cols.map((c) => {
        const e = S.effects[c];
        const v = e.effects[j];
        const s = c === 'typical' || c === 'range' ? f1(v) : f2(v);
        return Math.abs(v) > e.me ? `**${s}**` : s;
      }).join(' | ')} |\n`;
    });
    md += `| *Margem de erro (Lenth)* | | | ${cols.map((c) => f2(S.effects[c].me)).join(' | ')} |\n\n`;
  }
  if (state.calibrate) {
    md += '## 2. Do fim para o início: calibração a partir da música real\n\nAs constantes vêm diretamente das melodias reais de cada estilo: âmbito atrator = P90 da distância das notas ao centro da melodia + 2; pausas e prolongamentos admitidos = P10–P90 da percentagem real; onda 1 = centro e meia-amplitude medianos do contorno, um ciclo em 8 compassos, bacia = P75 da distância ao centro. Os pesos das regras são aprendidos para que as melodias reais fiquem acima das suas vizinhas (as mesmas com 2–48 genes trocados, como faz a mutação de bits) e acima do que o AG escreve com os pesos atuais; 6 voltas, 8 sementes por volta, média das 3 últimas.\n\n';
    md += `| Regra | Original (grupo 2) | ${Object.keys(STYLES).map((s) => STYLES[s].label).join(' | ')} |\n|---|---|${Object.keys(STYLES).map(() => '---').join('|')}|\n`;
    for (const r of RULES) md += `| ${RULE_LABELS[r]} | ${ORIGINAL.g2[r] ?? 0} | ${Object.keys(STYLES).map((s) => state.calibrate[s].preset.g2[r]).join(' | ')} |\n`;
    md += '\n| Constante | Original | ' + Object.keys(STYLES).map((s) => STYLES[s].label).join(' | ') + ' |\n|---|---|' + Object.keys(STYLES).map(() => '---').join('|') + '|\n';
    const cRow = (label, get) => `| ${label} | ${get(ORIGINAL)} | ${Object.keys(STYLES).map((s) => get(state.calibrate[s].preset)).join(' | ')} |\n`;
    md += cRow('Âmbito atrator (±)', (p) => p.rangeAttractor);
    md += cRow('Pausas + prolongamentos (%)', (p) => `${p.balanceMin}–${p.balanceMax}`);
    md += cRow('Onda 1 (média, amplitude, períodos, bacia)', (p) => `${p.waves[0].mean - GENE_A4 >= 0 ? '+' : ''}${p.waves[0].mean - GENE_A4}, ${p.waves[0].amplitude}, ${p.waves[0].periodsPerBar}, ${p.waves[0].threshold}`);
    md += cRow('Onda 2 (média, amplitude, períodos, bacia)', (p) => `${p.waves[1].mean - GENE_A4 >= 0 ? '+' : ''}${p.waves[1].mean - GENE_A4}, ${p.waves[1].amplitude}, ${p.waves[1].periodsPerBar}, ${p.waves[1].threshold}`);
    md += '\nEvolução das voltas (8 sementes cada; crítico · estilo próprio · notas por tempo · âmbito):\n\n';
    for (const s of Object.keys(STYLES)) md += `- ${STYLES[s].label}: ${state.calibrate[s].rounds.map((r) => `${f2(r.ga.critic)} · ${pc(r.ga.style[s])} · ${f2(r.ga.notesPerBeat)} · ${f1(r.ga.range)}`).join(' → ')}\n`;
    md += '\n';
  }
  if (state.optimize) {
    md += '## 3. Do início para o fim: otimização a partir da calibração\n\nMétodo da entropia cruzada (um desenho sequencial: em cada iteração 16 combinações à volta da média atual, 3 sementes comuns, as 5 melhores definem a nova média e a nova dispersão) sobre os 16 pesos (em escala logarítmica) e 11 constantes (âmbito atrator, intervalo de pausas, as duas ondas, mutação). Objetivo J = 0,4 × crítico + 0,3 × tipicidade do estilo (parte das 26 características dentro do P10–P90 do estilo) + 0,3 × (1 − distância ao estilo / 3), sendo a distância a média de |x − mediana| / dispersão das 26 características, com teto 3 (sem a distância, a contagem sozinha deixava passar âmbitos de 5 oitavas). No fim, a combinação de partida, a média final e as 3 melhores avaliadas são confirmadas com 12 sementes novas; fica a melhor. Primeiro com os operadores de bits do original (14 iterações, a partir da calibração), depois com os operadores musicais da página (12 iterações, a partir do resultado anterior).\n\n';
    for (const [key, title] of [['optimize', 'Operadores de bits (o original)'], ['optimizeMusical', 'Operadores musicais']]) {
      if (!state[key]) continue;
      md += `**${title}**\n\n| Estilo | J por iteração (melhor da iteração) | De partida | Média final | Melhor avaliada | Escolhida |\n|---|---|---|---|---|---|\n`;
      for (const s of Object.keys(STYLES)) {
        const O = state[key][s];
        const J = (id) => {
          const c = O.confirmed.find((x) => x.id === id);
          return c ? `${f2(c.J)} ± ${f2(c.sdJ)} (crítico ${f2(c.mean.critic)}, estilo ${pc(c.mean.style[s])})` : '—';
        };
        md += `| ${STYLES[s].label} | ${O.history.map((h) => f2(h.bestJ)).join(' ')} | ${J(key === 'optimize' ? 'calibrada' : 'de partida')} | ${J('média final')} | ${J('melhor avaliada 1')} | ${O.chosen} |\n`;
      }
      md += '\n';
    }
    const variants = [['optimize', 'bits'], ['optimizeMusical', 'mus.']].filter(([k]) => state[k]);
    const cols = variants.flatMap(([k, tag]) => Object.keys(STYLES).map((s) => ({ label: `${STYLES[s].label} (${tag})`, p: state[k][s].preset })));
    md += `Valores escolhidos:\n\n| | Original | ${cols.map((c) => c.label).join(' | ')} |\n|---|---|${cols.map(() => '---').join('|')}|\n`;
    for (const r of RULES) md += `| Peso: ${RULE_LABELS[r]} | ${ORIGINAL.g2[r] ?? 0} | ${cols.map((c) => c.p.g2[r]).join(' | ')} |\n`;
    const cRow = (label, get) => `| ${label} | ${get(ORIGINAL)} | ${cols.map((c) => get(c.p)).join(' | ')} |\n`;
    md += cRow('Âmbito atrator (±)', (p) => p.rangeAttractor);
    md += cRow('Pausas + prolongamentos (%)', (p) => `${p.balanceMin}–${p.balanceMax}`);
    md += cRow('Onda 1 (média, amplitude, períodos, bacia)', (p) => `${p.waves[0].mean - GENE_A4 >= 0 ? '+' : ''}${p.waves[0].mean - GENE_A4}, ${p.waves[0].amplitude}, ${p.waves[0].periodsPerBar}, ${p.waves[0].threshold}`);
    md += cRow('Onda 2 (média, amplitude, períodos, bacia)', (p) => `${p.waves[1].mean - GENE_A4 >= 0 ? '+' : ''}${p.waves[1].mean - GENE_A4}, ${p.waves[1].amplitude}, ${p.waves[1].periodsPerBar}, ${p.waves[1].threshold}`);
    md += cRow('Mutação', (p) => String(p.mutation).replace('.', ','));
    md += cRow('Operadores · gerações · população', (p) => `${p.operators === 'musical' ? 'musicais' : 'bits'} · ${p.generations} · ${p.popSize}`);
    md += '\n';
  }
  if (state.local || state.localMusical) {
    md += '## 4. O que ainda conta, à volta de cada combinação (triagem local)\n\nPlackett–Burman de 32 ensaios × 3 sementes à volta de cada combinação escolhida: cada peso a metade ou ao dobro, cada constante um passo abaixo ou acima, 6 fatores fictícios. Efeito em J (+ = aumentar o valor ajuda). Só os efeitos acima da margem de erro de Lenth.\n\n';
    for (const [key, title] of [['local', 'bits'], ['localMusical', 'operadores musicais']]) {
      if (!state[key]) continue;
      for (const s of Object.keys(STYLES)) {
        const L = state[key][s];
        const sig = L.factors.map((f, j) => [f, L.J[j]]).filter(([f, e]) => Math.abs(e) > L.me && !f.includes('fictício')).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
        md += `- **${STYLES[s].label}, ${title}** (J médio ${f2(L.meanJ)}, margem ${f2(L.me)}): ${sig.length ? sig.map(([f, e]) => `${f} ${e > 0 ? '+' : ''}${f2(e)}`).join(' · ') : 'nenhum fator acima do ruído'}.\n`;
      }
    }
    md += '\n';
  }
  if (state.confirm) {
    md += '## 5. Confirmação (24 sementes)\n\nEstilo: parte das 26 características dentro do P10–P90 do estilo · distância ao estilo (0 = na mediana, 3 = teto).\n\n| Configuração | Crítico | Típicas /26 | Canção | Dança | Coral | Notas/tempo | Graus conjuntos | Âmbito | Acaba na tónica |\n|---|---|---|---|---|---|---|---|---|---|\n';
    for (const c of state.confirm) {
      const m = c.mean;
      const st = (s) => `${pc(m.style[s])} · ${f2(m.dist[s])}`;
      md += `| ${c.label} | ${f2(m.critic)} ± ${f2(c.sd.critic)} | ${f1(m.typical)} | ${st('song')} | ${st('dance')} | ${st('chorale')} | ${f2(m.notesPerBeat)} | ${f2(m.step)} | ${f1(m.range)} | ${pc(m.endsOnTonic)} |\n`;
    }
    const R = realStyles();
    for (const s of Object.keys(STYLES)) {
      const m = state.real[s];
      const st = (x) => `${pc(m.style[x])} · ${f2(m.dist[x])}`;
      md += `| *Reais: ${STYLES[s].label.toLowerCase()} (${R[s].test.length})* | *${f2(m.critic)}* | *${f1(m.typical)}* | *${st('song')}* | *${st('dance')}* | *${st('chorale')}* | *${f2(m.notesPerBeat)}* | *${f2(m.step)}* | *${f1(m.range)}* | *${pc(m.endsOnTonic)}* |\n`;
    }
    md += '\nMelodias reais: as de teste (1 em cada 5, não usadas na calibração). Estilo = parte das 26 características dentro do intervalo P10–P90 das melodias reais desse estilo.\n';
  }
  mkdirSync(`${here}../results`, { recursive: true });
  writeFileSync(`${here}../results/classic-study.md`, md);
  if (state.optimize) {
    // each style: the values for the musical operators (the page's default for these presets) and
    // for the original bit operators
    const presets = Object.keys(STYLES).map((s) => ({
      ...toUiPreset(s, (state.optimizeMusical ?? state.optimize)[s].preset),
      binary: toUiPreset(s, state.optimize[s].preset),
    }));
    writeFileSync(`${here}../src/data/classic-presets.js`, `// Generated by tools/classic_study.mjs (results/classic-study.md). Do not edit.
// Starting combinations for the original algorithm, calibrated on real songs, dances and chorales.
export default ${JSON.stringify(presets, null, 1)};
`);
  }
  console.log(md);
}

const pool = makePool(THREADS);
try {
  if (phase === 'all' || phase === 'screen') await screen(pool);
  if (phase === 'all' || phase === 'calibrate') await calibrate(pool);
  if (phase === 'all' || phase === 'optimize') await optimize(pool);
  if (phase === 'all' || phase === 'local') await localScreen(pool);
  if (phase === 'all' || phase === 'optimize-musical') await optimize(pool, { musical: true });
  if (phase === 'all' || phase === 'local-musical') await localScreen(pool, { musical: true });
  if (phase === 'all' || phase === 'confirm') await confirm(pool);
  writeOutputs();
} finally {
  pool.close();
}
