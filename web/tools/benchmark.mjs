// Benchmark: compares the original rules with the literature-based extensions, using the
// independent evaluation (critic, corpus percentiles, canon analysis, wave analyser).
//   node tools/benchmark.mjs [seeds=6]
// Writes results/benchmark.json and results/benchmark.md.

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createRng } from '../src/core/rng.js';
import { toEvents, eventsToCompact, STEPS_PER_BAR } from '../src/core/score.js';
import { soundingLine } from '../src/core/analysis.js';
import { createGA } from '../src/ga/ga.js';
import { createMapElites } from '../src/ga/mapelites.js';
import { createClassicFitness, CLASSIC_DEFAULTS } from '../src/fitness/classic.js';
import { createAttractorFitness, DEFAULT_WEIGHTS } from '../src/fitness/attractor.js';
import { resolvePreset } from '../src/fitness/presets.js';
import { analyzeCanon } from '../src/fitness/canon.js';
import { loadCritic } from '../src/eval/critic.js';
import { nullMelody } from '../src/eval/nullmodels.js';
import { analyzePiece, fitWaves, notesOf } from '../src/analysis/wavefit.js';
import criticData from '../src/data/critic-data.js';
import corpus from '../src/data/corpus-data.js';

const here = new URL('.', import.meta.url).pathname;
const SEEDS = Number(process.argv[2] || 6);
const critic = loadCritic(criticData);
const G_TONIC = 7;

const zeroWaves = { wave1: 0, wave2: 0 };
const CONFIGS = [
  { id: 'classic', label: 'Clássico (regras e operadores originais)', kind: 'classic', opts: {} },
  { id: 'classic-firstrun', label: 'Clássico, 1.ª execução (onda 1 = 0)', kind: 'classic', opts: { firstRunBug: true } },
  { id: 'classic-nowaves', label: 'Clássico sem ondas', kind: 'classic', opts: { g1: { ...CLASSIC_DEFAULTS.g1, ...zeroWaves }, g2: { ...CLASSIC_DEFAULTS.g2, ...zeroWaves } } },
  { id: 'classic-musicalops', label: 'Clássico + operadores musicais', kind: 'classic', ops: 'musical', opts: {} },
  { id: 'field-sines', label: 'Campo: 2 senos do original', kind: 'field', preset: 'original' },
  { id: 'field-arch', label: 'Campo: arco de frase', kind: 'field', preset: 'arch' },
  { id: 'field-noattr', label: 'Campo: arco, sem bacias (ablação)', kind: 'field', preset: 'arch', weights: { attractor: 0 } },
  { id: 'field-pink', label: 'Campo: 1/f', kind: 'field', preset: 'pink' },
  { id: 'field-rossler', label: 'Campo: Rössler', kind: 'field', preset: 'rossler' },
  { id: 'field-lorenz', label: 'Campo: Lorenz', kind: 'field', preset: 'lorenz' },
  { id: 'field-compound', label: 'Campo: melodia composta', kind: 'field', preset: 'compound' },
  { id: 'canon', label: 'Cânone (2.ª voz a 1 compasso)', kind: 'field', preset: 'canon', canon: true },
];

function runConfig(cfg, seed) {
  if (cfg.kind === 'classic') {
    const fit = createClassicFitness(cfg.opts);
    const musical = cfg.ops === 'musical';
    const key = { tonic: 7, mode: 'major', diatonic: [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1].map(Boolean) };
    const env = { key, waves: fit.waves, basin: 3, lowMidi: 48, highMidi: 96, length: fit.length, stepsPerBar: STEPS_PER_BAR };
    const ga = createGA({
      fitness: fit, rng: createRng(seed), length: fit.length, env,
      generations: musical ? 600 : 1500, popSize: musical ? 80 : 60,
      strategy: musical ? 'tournament' : 'geneticsharp', operators: musical ? 'musical' : 'binary',
    });
    ga.step(Infinity);
    return { genes: ga.best.decoded, evaluations: ga.evaluations, diversity: ga.history.at(-1).diversity };
  }
  const waves = resolvePreset(cfg.preset, G_TONIC).map((w) => (cfg.canon ? { ...w, periodsPerBar: 0.5 } : w));
  const fit = createAttractorFitness({
    tonic: G_TONIC, mode: 'major', waves, seed,
    form: cfg.canon ? 'none' : "AA'BA'",
    weights: { ...DEFAULT_WEIGHTS, ...(cfg.canon ? { canon: 6, form: 0 } : {}), ...(cfg.weights || {}) },
    canon: { delayBars: 1 },
  });
  const ga = createGA({ fitness: fit, rng: createRng(seed), length: fit.length, env: fit.env, generations: 600, popSize: 80, strategy: 'tournament', operators: 'musical' });
  ga.step(Infinity);
  return { genes: ga.best.decoded, evaluations: ga.evaluations, diversity: ga.history.at(-1).diversity };
}

function measureCompact(compact, barLen, line) {
  const ev = critic.evaluate(compact, { barLen });
  const c = analyzeCanon(line, { delay: barLen, barLen });
  const wf = analyzePiece(compact, { segments: 1, barLen }).segments[0].fit;
  const f = ev.features;
  return {
    critic: ev.humanLike,
    typical: ev.typicality * criticData.features.length,
    rest: f.restRatio,
    density: f.noteDensity,
    step: f.stepMovement,
    range: f.pitchRange,
    ic: f.icPitch,
    lz: f.lzComplexity,
    canonStrong: c.strongConsonance,
    canonParallels: c.parallelsPerBar,
    canonScore: c.score,
    waveR2: wf ? wf.r2 : 0,
  };
}

function lineFromCompact(compact) {
  const pitch = [];
  const onset = [];
  for (const [p, d] of compact) for (let k = 0; k < d; k++) {
    pitch.push(p < 0 ? null : p);
    onset.push(p >= 0 && k === 0);
  }
  return { pitch, onset };
}

const summarize = (rows) => {
  const keys = Object.keys(rows[0]);
  const out = {};
  for (const k of keys) {
    const v = rows.map((r) => r[k]).filter(Number.isFinite);
    const m = v.reduce((a, b) => a + b, 0) / v.length;
    const sd = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, v.length - 1));
    out[k] = { mean: m, sd };
  }
  return out;
};

const results = { seeds: SEEDS, configs: [], reference: {}, waveStudy: {}, mapElites: {}, originalCsharp: null };
const t0 = Date.now();

// ---- reference rows: real melodies and null models
{
  const rows = corpus.map((m) => measureCompact(m.events, m.barLen, lineFromCompact(m.events)));
  results.reference.corpus = { label: 'Melodias reais (corpus, n=480)', ...summarize(rows) };
  const rng = createRng(77);
  for (const t of ['white-diatonic', 'brown', 'pink']) {
    const r = Array.from({ length: 60 }, () => {
      const c = nullMelody(t, rng, corpus);
      return measureCompact(c, 16, lineFromCompact(c));
    });
    results.reference[t] = { label: `Nulo: ${t}`, ...summarize(r) };
  }
}

// ---- generated pieces
for (const cfg of CONFIGS) {
  const rows = [];
  const examples = [];
  let evals = 0;
  let div = 0;
  for (let s = 1; s <= SEEDS; s++) {
    const { genes, evaluations, diversity } = runConfig(cfg, s);
    evals += evaluations;
    div += diversity;
    const compact = eventsToCompact(toEvents(genes));
    rows.push(measureCompact(compact, 16, soundingLine(genes)));
    if (s <= 2) examples.push(genes);
  }
  results.configs.push({ id: cfg.id, label: cfg.label, evaluations: evals / SEEDS, finalDiversity: div / SEEDS, ...summarize(rows), examples });
  console.error(`${cfg.id} done (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}

// ---- original C# program (if tools/parity-csharp was run with "run")
const origFile = new URL('../test/fixtures/original-ga-runs.json', import.meta.url);
if (existsSync(origFile)) {
  const runs = JSON.parse(readFileSync(origFile, 'utf8'));
  const rows = runs.map((r) => {
    const genes = r.genes.map((g) => Math.round(g));
    return { run: r.run, generations: r.generations, ...measureCompact(eventsToCompact(toEvents(genes)), 16, soundingLine(genes)) };
  });
  results.originalCsharp = rows;
}

// ---- MAP-Elites: diversity of good melodies
{
  const fit = createAttractorFitness({ tonic: G_TONIC, mode: 'major', waves: resolvePreset('arch', G_TONIC), seed: 1 });
  const me = createMapElites({ fitness: fit, env: fit.env, rng: createRng(3) });
  me.step(47000);
  const elites = me.cells.filter(Boolean);
  const rows = elites.map((c) => measureCompact(eventsToCompact(toEvents(c.genes)), 16, soundingLine(c.genes)));
  const good = rows.filter((r) => r.critic >= 0.7).length;
  results.mapElites = { evaluations: me.evaluations, cells: elites.length, coverage: me.coverage(), humanLikeCells: good, ...summarize(rows) };
}

// ---- wave study: do real melodies contain attractor waves more than shuffled ones?
{
  const rng = createRng(11);
  const study = { real: [], shuffled: [], brown: [] };
  const sig = { real: 0, shuffled: 0, brown: 0 };
  const lowFreq = [];
  for (const m of corpus) {
    const variants = {
      real: m.events,
      shuffled: (() => {
        const ps = rng.shuffle(m.events.filter(([p]) => p >= 0).map(([p]) => p));
        let i = 0;
        return m.events.map(([p, d]) => (p < 0 ? [p, d] : [ps[i++], d]));
      })(),
      brown: nullMelody('brown', rng, corpus),
    };
    for (const [k, compact] of Object.entries(variants)) {
      const barLen = k === 'brown' ? 16 : m.barLen;
      const { notes, total } = notesOf(compact);
      const samples = notes.map((n) => ({ t: n.t, p: n.p, w: Math.sqrt(n.d) }));
      const one = fitWaves(samples, 1, barLen, total);
      study[k].push(one.r2);
      const a = analyzePiece(compact, { segments: 1, barLen, rng: createRng(5) }).segments[0];
      if (a.significant.length) sig[k]++;
      if (k === 'real' && a.lowestWave) lowFreq.push({ freq: a.lowestWave.freq, meanOffset: a.lowestWave.mean - a.register.mean, amp: a.lowestWave.amplitude, m: a.fit.M });
    }
  }
  const med = (v) => v.slice().sort((a, b) => a - b)[Math.floor(v.length / 2)];
  const q = (v, p) => v.slice().sort((a, b) => a - b)[Math.floor(p * (v.length - 1))];
  let wins = 0;
  study.real.forEach((r, i) => (wins += r > study.shuffled[i] ? 1 : 0));
  const hist = {};
  for (const w of lowFreq) hist[w.freq.toFixed(3)] = (hist[w.freq.toFixed(3)] || 0) + 1;
  results.waveStudy = {
    n: corpus.length,
    oneWaveR2: { real: [q(study.real, 0.25), med(study.real), q(study.real, 0.75)], shuffled: [q(study.shuffled, 0.25), med(study.shuffled), q(study.shuffled, 0.75)], brown: [q(study.brown, 0.25), med(study.brown), q(study.brown, 0.75)] },
    realBeatsShuffled: wins / corpus.length,
    significantShare: { real: sig.real / corpus.length, shuffled: sig.shuffled / corpus.length, brown: sig.brown / corpus.length },
    lowestWaveFreqHistogram: hist,
    lowestWaveAmplitudeMedian: med(lowFreq.map((w) => w.amp)),
    wavesChosenByBIC: lowFreq.reduce((a, w) => ((a[w.m] = (a[w.m] || 0) + 1), a), {}),
  };
}

mkdirSync(`${here}../results`, { recursive: true });
writeFileSync(`${here}../results/benchmark.json`, JSON.stringify(results, null, 1));

// ---- markdown report
const f2 = (x) => (x === undefined ? '—' : x.toFixed(2));
const pct = (x) => `${Math.round(x * 100)} %`;
const cell = (s, k, fmt = f2) => `${fmt(s[k].mean)} ± ${fmt(s[k].sd)}`;
let md = `# Benchmark (${SEEDS} sementes por configuração)\n\nGerado por \`node tools/benchmark.mjs\`. Peças de 8 compassos em Sol maior; ~47–67 mil avaliações por execução. Média ± desvio-padrão entre sementes.\n\n`;
md += '| Configuração | Crítico (real?) | Típicas /26 | Pausas | Notas/tempo | Grau conjunto | Surpresa (bits) | Cânone 1 c.: consonância forte | 5.as/8.as paral./c. | R² 1 onda |\n|---|---|---|---|---|---|---|---|---|---|\n';
const row = (label, s) => `| ${label} | ${cell(s, 'critic')} | ${cell(s, 'typical', (x) => x.toFixed(1))} | ${cell(s, 'rest', pct)} | ${cell(s, 'density')} | ${cell(s, 'step')} | ${cell(s, 'ic')} | ${cell(s, 'canonStrong', pct)} | ${cell(s, 'canonParallels')} | ${cell(s, 'waveR2')} |\n`;
for (const [, r] of Object.entries(results.reference)) md += row(`*${r.label}*`, r);
for (const c of results.configs) md += row(c.label, c);
if (results.originalCsharp) {
  md += '\n## Programa C# original (GeneticSharp 2.6, 40 s por execução)\n\n| Execução | Gerações | Crítico | Pausas | Notas/tempo | Cânone 1 c. |\n|---|---|---|---|---|---|\n';
  for (const r of results.originalCsharp) md += `| ${r.run}${r.run === 1 ? ' (onda 1 = 0)' : ''} | ${r.generations} | ${f2(r.critic)} | ${pct(r.rest)} | ${f2(r.density)} | ${pct(r.canonStrong)} |\n`;
}
const me = results.mapElites;
md += `\n## MAP-Elites\n\n${me.evaluations} avaliações · ${me.cells} células preenchidas (${pct(me.coverage)}) · ${me.humanLikeCells} com crítico ≥ 0,7 · crítico médio ${cell(me, 'critic')} · notas/tempo ${cell(me, 'density')} · âmbito ${cell(me, 'range', (x) => x.toFixed(1))}\n`;
const ws = results.waveStudy;
md += `\n## Estudo das ondas no corpus (n = ${ws.n})\n\nR² de uma única onda sinusoidal ajustada à melodia (quartis 25/50/75 %):\n\n| Melodias | Q1 | Mediana | Q3 |\n|---|---|---|---|\n`;
for (const k of ['real', 'shuffled', 'brown']) md += `| ${{ real: 'Reais', shuffled: 'Reais baralhadas', brown: 'Ruído castanho' }[k]} | ${ws.oneWaveR2[k].map(f2).join(' | ')} |\n`;
md += `\nA melodia real tem R² maior do que a sua versão baralhada em ${pct(ws.realBeatsShuffled)} dos casos. Oscilação do contorno significativa (permutação, p < 0,05): reais ${pct(ws.significantShare.real)}, baralhadas ${pct(ws.significantShare.shuffled)}, castanho ${pct(ws.significantShare.brown)}.\n\nFrequência da onda mais lenta escolhida (ciclos por compasso → nº de melodias): ${Object.entries(ws.lowestWaveFreqHistogram).sort((a, b) => a[0] - b[0]).map(([f, n]) => `${f} → ${n}`).join(', ')}. Amplitude mediana ±${f2(ws.lowestWaveAmplitudeMedian)} semitons. Nº de ondas escolhido pelo BIC: ${JSON.stringify(ws.wavesChosenByBIC)}.\n`;
writeFileSync(`${here}../results/benchmark.md`, md);
console.log(md);
