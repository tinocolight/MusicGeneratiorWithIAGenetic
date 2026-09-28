// Does the per-meter model make better melodies in the genetic algorithm? For a few meters,
// melodies generated from the generic rhythm cells ("padrões musicais") and from the corpus
// blocks of that meter ("blocos do corpus"), several seeds each, compared on:
//   * the critic (trained on real melodies; its features use the beat of the meter);
//   * how far their rhythmic figures are from those of real melodies of the meter (total
//     variation distance between the two distributions of figures: 0 = the same, 1 = disjoint);
//   * the longest run of beats (figure, contour and entry) copied from one real melody of the
//     meter, next to what real melodies share with each other: the model must propose, not copy.
//   node tools/meters_ga_study.mjs [seeds=8] [generations=400]
// Writes results/meters/ga.csv and results/meters-ga.md.

import { readFileSync, writeFileSync } from 'node:fs';
import { METERS } from '../src/core/meter.js';
import { defaultConfig, buildFitness } from '../src/ui/config.js';
import { createGA } from '../src/ga/ga.js';
import { createRng } from '../src/core/rng.js';
import { toEvents, eventsToCompact } from '../src/core/score.js';
import { lineToBeats, compactToLine, genesToLine, figureName } from '../src/ga/figures.js';
import { loadCritic } from '../src/eval/critic.js';
import criticData from '../src/data/critic-data.js';

const here = new URL('.', import.meta.url).pathname;
const SEEDS = Number(process.argv[2] ?? 8);
const GENERATIONS = Number(process.argv[3] ?? 400);
const METER_IDS = ['4/4', '3/4', '6/8'];
const critic = loadCritic(criticData);
const corpus = JSON.parse(readFileSync(`${here}../data/corpus-meters.json`, 'utf8')).melodies;
const groupOf = (m) => { const id = `${m.num}/${m.den}`; return id === '2/2' ? '4/4' : id; };
const tokenOf = (b) => `${b.cell}|${b.contour}|${b.entry ?? ''}`;

// real melodies of each meter: figure distribution, and their beats as token ids indexed by
// pairs of consecutive beats (to find the longest run a melody shares with the corpus)
const tokenIds = new Map();
const tokId = (b) => {
  const k = tokenOf(b);
  if (!tokenIds.has(k)) tokenIds.set(k, tokenIds.size);
  return tokenIds.get(k);
};
const real = {};
for (const id of METER_IDS) {
  const list = corpus.filter((m) => groupOf(m) === id).map((m) => {
    const l = compactToLine(m.events);
    const beats = lineToBeats(l.pitch, l.onset, { meter: id, pickup: m.pickup, key: { tonic: m.tonic, mode: m.mode } });
    return { id: m.id, beats, seq: beats.map(tokId) };
  });
  const figs = new Map();
  let total = 0;
  const pairs = new Map();
  list.forEach((it, mi) => {
    for (const b of it.beats) {
      figs.set(b.cell, (figs.get(b.cell) || 0) + 1);
      total++;
    }
    for (let i = 0; i + 1 < it.seq.length; i++) {
      const k = it.seq[i] * 100003 + it.seq[i + 1];
      if (!pairs.has(k)) pairs.set(k, []);
      pairs.get(k).push(mi, i);
    }
  });
  real[id] = { list, figs, total, pairs };
}

/** Longest run of beats that some other melody of the corpus (not `self`) also has. */
function longestCopy(beats, meterId, self = null) {
  const seq = beats.map(tokId);
  const { list, pairs } = real[meterId];
  let best = 0;
  for (let i = 0; i + 1 < seq.length; i++) {
    const occ = pairs.get(seq[i] * 100003 + seq[i + 1]);
    if (!occ) continue;
    for (let o = 0; o < occ.length; o += 2) {
      const other = list[occ[o]];
      if (other.id === self) continue;
      const p = occ[o + 1];
      let L = 2;
      while (i + L < seq.length && p + L < other.seq.length && seq[i + L] === other.seq[p + L]) L++;
      if (L > best) best = L;
    }
  }
  return best;
}

function tv(counts, total, ref) {
  const keys = new Set([...counts.keys(), ...ref.figs.keys()]);
  let d = 0;
  for (const k of keys) d += Math.abs((counts.get(k) ?? 0) / total - (ref.figs.get(k) ?? 0) / ref.total);
  return d / 2;
}

const rows = [];
const VARIANTS = [
  { init: 'musical', idiom: 0, label: 'padrões musicais' },
  { init: 'blocks', idiom: 0, label: 'blocos do corpus' },
  { init: 'blocks', idiom: 0.75, label: 'blocos + idioma 0,75' },
  { init: 'blocks', idiom: 1.5, label: 'blocos + idioma 1,5' },
];
for (const id of METER_IDS) {
  const meter = METERS[id];
  for (const { init, idiom, label } of VARIANTS) {
    const res = [];
    for (let s = 1; s <= SEEDS; s++) {
      const cfg = defaultConfig();
      cfg.meter = id;
      cfg.bars = Math.ceil(32 / meter.beats);
      cfg.phraseBars = meter.beats >= 4 ? 2 : 4;
      cfg.ga.init = init;
      cfg.ga.seed = s;
      cfg.weights = { ...cfg.weights, idiom };
      const b = buildFitness(cfg);
      const ga = createGA({ fitness: b.fit, rng: createRng(s), length: b.fit.length, env: b.env, generations: GENERATIONS, popSize: 80, mutationRate: 0.9, strategy: 'tournament', operators: 'musical', initMode: init });
      ga.step(Infinity);
      const genes = ga.best.decoded;
      const line = genesToLine(genes);
      const beats = lineToBeats(line.pitch, line.onset, { meter: id, key: b.key });
      const counts = new Map();
      for (const bt of beats) counts.set(bt.cell, (counts.get(bt.cell) || 0) + 1);
      const compact = eventsToCompact(toEvents(genes));
      let t = 0;
      const first = [];
      for (const [p, d] of compact) if (t < 128) (first.push([p, Math.min(d, 128 - t)]), (t += d));
      const c = critic.evaluate(first, { barLen: meter.barLen, beat: meter.beat });
      res.push({ critic: c.humanLike, typical: c.typicality * criticData.features.length, tv: tv(counts, beats.length, real[id]), copy: longestCopy(beats, id), top: [...counts].sort((a, x) => x[1] - a[1]).slice(0, 3).map(([k]) => figureName(k)).join(', ') });
    }
    const mean = (k) => res.reduce((a, r) => a + r[k], 0) / res.length;
    const sd = (k) => Math.sqrt(res.reduce((a, r) => a + (r[k] - mean(k)) ** 2, 0) / Math.max(1, res.length - 1));
    rows.push({ id, init, label, critic: mean('critic'), criticSd: sd('critic'), typical: mean('typical'), tv: mean('tv'), tvSd: sd('tv'), copy: mean('copy'), copyMax: Math.max(...res.map((r) => r.copy)), top: res[0].top });
    console.error(id, label, rows.at(-1));
  }
}
// what real melodies share with the others of the corpus (a sample)
const realCopy = {};
for (const id of METER_IDS) {
  const sample = real[id].list.filter((_, i) => i % 25 === 0).slice(0, 60);
  const cs = sample.map((it) => longestCopy(it.beats.slice(0, Math.ceil(32 / METERS[id].beats) * METERS[id].beats), id, it.id));
  realCopy[id] = { mean: cs.reduce((a, b) => a + b, 0) / cs.length, sorted: cs.sort((a, b) => a - b) };
}

const f = (x, d = 2) => x.toFixed(d).replace('.', ',');
const csv = ['compasso,populacao_inicial,critico,critico_desvio,caracteristicas_tipicas_de_26,distancia_das_figuras_reais,distancia_desvio,maior_trecho_copiado_media,maior_trecho_copiado_max,trecho_partilhado_entre_melodias_reais_media,figuras_mais_usadas_semente_1'];
for (const r of rows) csv.push([r.id, r.label, r.critic.toFixed(4), r.criticSd.toFixed(4), r.typical.toFixed(2), r.tv.toFixed(4), r.tvSd.toFixed(4), r.copy.toFixed(2), r.copyMax, realCopy[r.id].mean.toFixed(2), `"${r.top}"`].join(','));
writeFileSync(`${here}../results/meters/ga.csv`, `﻿${csv.join('\r\n')}\r\n`);
let md = `# Os blocos por compasso no algoritmo genético\n\nGerado por \`node tools/meters_ga_study.mjs ${SEEDS} ${GENERATIONS}\`: ${SEEDS} sementes por variante, ${GENERATIONS} gerações, população 80, uma melodia de cerca de 32 tempos (8 compassos de 4/4, 11 de 3/4, 16 de 6/8), pesos por omissão com «não maximizar». Tabela também em \`results/meters/ga.csv\`.\n\n`;
md += '| Compasso | População inicial | Crítico | Típicas /26 | Distância às figuras reais | Maior trecho copiado (tempos): média / máx. | Entre melodias reais |\n|---|---|---|---|---|---|---|\n';
for (const r of rows) md += `| ${r.id} | ${r.label} | ${f(r.critic)} ± ${f(r.criticSd)} | ${f(r.typical, 1)} | ${f(r.tv)} ± ${f(r.tvSd)} | ${f(r.copy, 1)} / ${r.copyMax} | ${f(realCopy[r.id].mean, 1)} |\n`;
md += `\n- **Distância às figuras reais**: metade da soma das diferenças entre a frequência de cada figura na melodia gerada e nas melodias reais do mesmo compasso (0 = o mesmo vocabulário rítmico, na mesma proporção).\n- **Maior trecho copiado**: o maior número de tempos seguidos (figura, contorno e intervalo de entrada iguais) que a melodia partilha com alguma melodia real do corpus; na última coluna, o mesmo para melodias reais comparadas com as outras (as fórmulas comuns que qualquer melodia partilha).\n- O crítico foi treinado com melodias em compassos simples; em 6/8 usa o tempo de semínima com ponto nas suas características, mas deve ler-se com cautela.\n`;
writeFileSync(`${here}../results/meters-ga.md`, md);
console.log(md);
