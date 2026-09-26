// Study of the ORIGINAL algorithm (classic mode): which of its values bring its melodies close to
// real music, and three starting combinations ("presets") that do it as well as the algorithm
// allows. Four phases:
//   screen    screening design of experiments: Plackett-Burman (Sylvester Hadamard 32) with
//             fold-over, 64 runs x 3 seeds, 30 factors of the original (the 16 rule weights, the
//             two waves, range, balance, lapses, mutation, population, weight groups) + 1 dummy;
//   calibrate backwards, per style (songs, dances, chorales): the constants measured on real
//             melodies, then rule weights under which real melodies score above their neighbours
//             and above what the GA currently writes (iterated, like contrastive / inverse RL);
//   refine    response surface around each calibrated preset (Latin hypercube, 48 points x 3
//             seeds, quadratic model), confirmed with 12 new seeds;
//   confirm   24 seeds: the original, the original with its lapses fixed, and each preset, with
//             the original (binary) operators and with the musical operators.
//   node tools/classic_study.mjs [all|screen|calibrate|refine|confirm]
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
  for (const s of Object.keys(STYLES)) out.style[s] = ms.reduce((a, m) => a + m.style[s], 0) / ms.length;
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
/** Objective for a style: as real as the critic says, and as typical of the style. */
const objective = (m, style) => 0.5 * m.critic + 0.5 * m.style[style];

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

// ------------------------------------------------------------------ 3. response surface
const PERIODS = [0.0625, 0.125, 0.25, 0.5];
const RSM = [
  { id: 'rangeAttractor', label: 'Âmbito atrator', map: (x, c) => Math.round(c.rangeAttractor + 0.5 + 3.5 * x) },
  { id: 'w1amp', label: 'Onda 1: amplitude', map: (x) => Math.round(4 + 3 * x) },
  { id: 'w1basin', label: 'Onda 1: bacia', map: (x) => Math.round(4.5 + 2.5 * x) },
  { id: 'w1per', label: 'Onda 1: períodos/compasso', map: (x) => PERIODS[Math.min(3, Math.floor((x + 1) * 2))] },
  { id: 'balShift', label: 'Desvio do intervalo de pausas (%)', map: (x) => Math.round(15 * x) },
  { id: 'mutation', label: 'Mutação', map: (x) => Number((0.225 + 0.175 * x).toFixed(3)) },
  { id: 'w2amp', label: 'Onda 2: amplitude', map: (x) => Math.round(2 + 2 * x) },
];
function applyRsm(base, xs) {
  const p = clone(base);
  const v = Object.fromEntries(RSM.map((f, j) => [f.id, f.map(xs[j], base)]));
  p.rangeAttractor = Math.max(3, v.rangeAttractor);
  p.waves[0].amplitude = v.w1amp;
  p.waves[0].threshold = v.w1basin;
  p.waves[0].periodsPerBar = v.w1per;
  p.balanceMin = Math.max(0, Math.min(95, base.balanceMin + v.balShift));
  p.balanceMax = Math.max(p.balanceMin + 5, Math.min(99, base.balanceMax + v.balShift));
  p.mutation = v.mutation;
  p.waves[1].amplitude = v.w2amp;
  return { p, values: v };
}
function lhs(n, k, rng) {
  const cols = Array.from({ length: k }, () => rng.shuffle(Array.from({ length: n }, (_, i) => i)));
  return Array.from({ length: n }, (_, i) => cols.map((c) => -1 + (2 * (c[i] + rng.float())) / n));
}
/** Least squares with a small ridge: y ~ b0 + sum b_j x_j + sum c_j x_j^2. */
function fitQuadratic(X, y) {
  const phi = (x) => [1, ...x, ...x.map((v) => v * v)];
  const A = X.map(phi);
  const m = A[0].length;
  const AtA = Array.from({ length: m }, () => new Array(m).fill(0));
  const Aty = new Array(m).fill(0);
  A.forEach((row, i) => {
    for (let a = 0; a < m; a++) {
      Aty[a] += row[a] * y[i];
      for (let b = 0; b < m; b++) AtA[a][b] += row[a] * row[b];
    }
  });
  for (let a = 1; a < m; a++) AtA[a][a] += 1e-3 * X.length;
  // Gauss-Jordan
  const M = AtA.map((r, i) => [...r, Aty[i]]);
  for (let c = 0; c < m; c++) {
    let piv = c;
    for (let r = c + 1; r < m; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = 0; r < m; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= m; k++) M[r][k] -= f * M[c][k];
    }
  }
  const beta = M.map((r, i) => r[m] / r[i]);
  const pred = (x) => phi(x).reduce((a, v, i) => a + v * beta[i], 0);
  const mean = y.reduce((a, b) => a + b, 0) / y.length;
  const ssTot = y.reduce((a, b) => a + (b - mean) ** 2, 0);
  const ssRes = X.reduce((a, x, i) => a + (y[i] - pred(x)) ** 2, 0);
  return { beta, pred, r2: 1 - ssRes / ssTot };
}

async function refine(pool) {
  const rng = createRng(4242);
  state.refine = {};
  for (const style of Object.keys(STYLES)) {
    const base = state.calibrate[style].preset;
    const X = lhs(48, RSM.length, rng);
    const pts = await Promise.all(X.map(async (xs, i) => {
      const { p, values } = applyRsm(base, xs);
      const r = await runSeeds(pool, p, [1, 2, 3].map((s) => 70000 + 10 * i + s));
      return { xs, values, mean: r.mean, J: objective(r.mean, style) };
    }));
    const model = fitQuadratic(pts.map((x) => x.xs), pts.map((x) => x.J));
    let bestX = null;
    let bestPred = -Infinity;
    for (let n = 0; n < 20000; n++) {
      const xs = RSM.map(() => -1 + 2 * rng.float());
      const v = model.pred(xs);
      if (v > bestPred) [bestPred, bestX] = [v, xs];
    }
    const observed = pts.slice().sort((a, b) => b.J - a.J)[0];
    const candidates = [
      { id: 'calibrated', p: base },
      { id: 'model optimum', p: applyRsm(base, bestX).p, predicted: bestPred },
      { id: 'best observed', p: applyRsm(base, observed.xs).p },
    ];
    const confirmed = [];
    for (const c of candidates) {
      const r = await runSeeds(pool, c.p, Array.from({ length: 12 }, (_, s) => 90000 + s));
      confirmed.push({ id: c.id, predicted: c.predicted ?? null, mean: r.mean, J: objective(r.mean, style), sdJ: sd(r.all.map((m) => objective(m, style))), p: c.p });
      log(`refine ${style} ${c.id}: J ${objective(r.mean, style).toFixed(3)} critic ${r.mean.critic.toFixed(2)} style ${r.mean.style[style].toFixed(2)}`);
    }
    const chosen = confirmed.slice().sort((a, b) => b.J - a.J)[0];
    const slopes = Object.fromEntries(RSM.map((f, j) => [f.id, { linear: model.beta[1 + j], quadratic: model.beta[1 + RSM.length + j] }]));
    state.refine[style] = { r2: model.r2, slopes, points: pts.map(({ values, J, mean }) => ({ values, J, critic: mean.critic, style: mean.style[style] })), confirmed: confirmed.map(({ p, ...rest }) => rest), chosen: chosen.id, preset: chosen.p };
    save();
  }
  log('refine done');
}

// ------------------------------------------------------------------ 4. confirmation
async function confirm(pool) {
  const musical = (p) => ({ ...p, operators: 'musical', generations: 600, popSize: 80, mutation: 0.9 });
  const configs = [
    { id: 'original', label: 'Original (valores do programa de 2020)', p: ORIGINAL },
    { id: 'original-fixed', label: 'Original, com os lapsos corrigidos', p: { ...clone(ORIGINAL), fixLapses: true } },
    ...Object.keys(STYLES).map((s) => ({ id: s, label: `Combinação «${STYLES[s].label}»`, p: state.refine[s].preset })),
    { id: 'original-musical', label: 'Original + operadores musicais', p: musical(ORIGINAL) },
    ...Object.keys(STYLES).map((s) => ({ id: `${s}-musical`, label: `«${STYLES[s].label}» + operadores musicais`, p: musical(state.refine[s].preset) })),
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
    phase1Fraction: p.phase1Fraction, ga: { generations: p.generations, popSize: p.popSize, mutation: p.mutation, operators: 'binary' },
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
  if (state.refine) {
    md += '## 3. Superfície de resposta à volta de cada combinação\n\nHipercubo latino de 48 pontos × 3 sementes em 7 fatores (âmbito atrator, amplitude, bacia e período da onda 1, desvio do intervalo de pausas, mutação, amplitude da onda 2); modelo quadrático; objetivo J = ½ crítico + ½ tipicidade do estilo. O ótimo do modelo, o melhor ponto observado e a combinação calibrada são confirmados com 12 sementes novas; fica o melhor.\n\n';
    md += '| Estilo | R² do modelo | Calibrada | Ótimo do modelo | Melhor observado | Escolhida |\n|---|---|---|---|---|---|\n';
    for (const s of Object.keys(STYLES)) {
      const R = state.refine[s];
      const J = (id) => {
        const c = R.confirmed.find((x) => x.id === id);
        return `${f2(c.J)} ± ${f2(c.sdJ)}`;
      };
      md += `| ${STYLES[s].label} | ${f2(R.r2)} | ${J('calibrated')} | ${J('model optimum')} | ${J('best observed')} | ${R.chosen} |\n`;
    }
    md += '\n';
  }
  if (state.confirm) {
    md += '## 4. Confirmação (24 sementes)\n\n| Configuração | Crítico | Típicas /26 | Canção | Dança | Coral | Notas/tempo | Graus conjuntos | Âmbito | Acaba na tónica |\n|---|---|---|---|---|---|---|---|---|---|\n';
    for (const c of state.confirm) {
      const m = c.mean;
      md += `| ${c.label} | ${f2(m.critic)} ± ${f2(c.sd.critic)} | ${f1(m.typical)} | ${pc(m.style.song)} | ${pc(m.style.dance)} | ${pc(m.style.chorale)} | ${f2(m.notesPerBeat)} | ${f2(m.step)} | ${f1(m.range)} | ${pc(m.endsOnTonic)} |\n`;
    }
    const R = realStyles();
    for (const s of Object.keys(STYLES)) {
      const m = state.real[s];
      md += `| *Reais: ${STYLES[s].label.toLowerCase()} (${R[s].test.length})* | *${f2(m.critic)}* | *${f1(m.typical)}* | *${pc(m.style.song)}* | *${pc(m.style.dance)}* | *${pc(m.style.chorale)}* | *${f2(m.notesPerBeat)}* | *${f2(m.step)}* | *${f1(m.range)}* | *${pc(m.endsOnTonic)}* |\n`;
    }
    md += '\nMelodias reais: as de teste (1 em cada 5, não usadas na calibração). Estilo = parte das 26 características dentro do intervalo P10–P90 das melodias reais desse estilo.\n';
  }
  mkdirSync(`${here}../results`, { recursive: true });
  writeFileSync(`${here}../results/classic-study.md`, md);
  if (state.refine) {
    const presets = Object.keys(STYLES).map((s) => toUiPreset(s, state.refine[s].preset));
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
  if (phase === 'all' || phase === 'refine') await refine(pool);
  if (phase === 'all' || phase === 'confirm') await confirm(pool);
  writeOutputs();
} finally {
  pool.close();
}
