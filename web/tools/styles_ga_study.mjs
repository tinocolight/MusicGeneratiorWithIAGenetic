// Do the composition heuristics steer the genetic algorithm towards each style? For every style
// (and for the general rules alone), melodies generated with the style's settings (meter, phrase,
// form, length) with the heuristics at 0 and at the weight a style starts with, several seeds each,
// compared on:
//   * the style's score (heuristics.js: mean of the rules in [-1, 1]) and the share of its rules
//     inside their range;
//   * the critic (trained on real melodies) and how many of its 26 features are typical.
//   node tools/styles_ga_study.mjs [seeds=4] [generations=400] [styles=all]
// Writes results/estilos/ga.csv and results/estilos-ga.md.

import { writeFileSync } from 'node:fs';
import { defaultConfig, buildFitness, applyStyle, adaptToVoices, STYLE_WEIGHT } from '../src/ui/config.js';
import { STYLE_IDS, STYLES } from '../src/fitness/styles.js';
import { createGA } from '../src/ga/ga.js';
import { createRng } from '../src/core/rng.js';
import { toEvents, eventsToCompact } from '../src/core/score.js';
import { meterOf } from '../src/core/meter.js';
import { loadCritic } from '../src/eval/critic.js';
import criticData from '../src/data/critic-data.js';

const here = new URL('.', import.meta.url).pathname;
const SEEDS = Number(process.argv[2] ?? 4);
const GENERATIONS = Number(process.argv[3] ?? 400);
const ONLY = process.argv[4] ? process.argv[4].split(',') : null;
const critic = loadCritic(criticData);
const log = (...a) => console.error(...a);

function run(style, weight, seed) {
  const c = defaultConfig();
  applyStyle(c, style);
  c.weights.heuristics = weight;
  c.ga.seed = seed;
  c.ga.generations = GENERATIONS;
  adaptToVoices(c);
  const b = buildFitness(c);
  const ga = createGA({ fitness: b.fit, rng: createRng(seed), length: b.fit.length, env: b.env, generations: GENERATIONS, popSize: 80, mutationRate: 0.9, strategy: 'tournament', operators: 'musical', initMode: c.ga.init });
  ga.step(Infinity);
  const genes = ga.best.decoded;
  const h = b.fit.heuristics(genes);
  const judged = h.rules.filter((r) => r.s !== null);
  const meter = meterOf(c.meter);
  const compact = eventsToCompact(toEvents(genes));
  let t = 0;
  const first = [];
  for (const [p, d] of compact) if (t < 128) (first.push([p, Math.min(d, 128 - t)]), (t += d));
  const cr = critic.evaluate(first, { barLen: meter.barLen, beat: meter.beat });
  return { score: h.score, inRange: judged.filter((r) => r.s === 1).length / Math.max(1, judged.length), critic: cr.humanLike, typical: cr.typicality * criticData.features.length, meter: meter.id, bars: c.bars, rules: h.rules };
}

const styles = ['none', ...STYLE_IDS].filter((s) => !ONLY || ONLY.includes(s));
const rows = [];
const t0 = Date.now();
for (const style of styles) {
  const res = { 0: [], [STYLE_WEIGHT.field]: [] };
  for (const w of [0, STYLE_WEIGHT.field]) for (let s = 1; s <= SEEDS; s++) res[w].push(run(style, w, s));
  const mean = (arr, k) => arr.reduce((a, r) => a + r[k], 0) / arr.length;
  // rules that most often stay outside their range with the heuristics on
  const misses = new Map();
  for (const r of res[STYLE_WEIGHT.field]) for (const x of r.rules) if (x.s !== null && x.s < 1) misses.set(x.id, (misses.get(x.id) || 0) + 1);
  const row = {
    style, meter: res[0][0].meter, bars: res[0][0].bars,
    score0: mean(res[0], 'score'), score1: mean(res[STYLE_WEIGHT.field], 'score'),
    in0: mean(res[0], 'inRange'), in1: mean(res[STYLE_WEIGHT.field], 'inRange'),
    critic0: mean(res[0], 'critic'), critic1: mean(res[STYLE_WEIGHT.field], 'critic'),
    typ0: mean(res[0], 'typical'), typ1: mean(res[STYLE_WEIGHT.field], 'typical'),
    misses: [...misses].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, n]) => `${id} (${n}/${SEEDS})`).join('; '),
  };
  rows.push(row);
  log(`${style} ${row.meter}: score ${row.score0.toFixed(2)} -> ${row.score1.toFixed(2)}, rules in range ${(100 * row.in0).toFixed(0)} % -> ${(100 * row.in1).toFixed(0)} %, critic ${row.critic0.toFixed(2)} -> ${row.critic1.toFixed(2)} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}

const f = (x, d = 2) => x.toFixed(d).replace('.', ',');
const csv = ['estilo,compasso,compassos,pontuacao_sem,pontuacao_com,regras_no_intervalo_sem,regras_no_intervalo_com,critico_sem,critico_com,tipicas_sem,tipicas_com,regras_mais_falhadas_com'];
for (const r of rows) csv.push([r.style, r.meter, r.bars, r.score0.toFixed(4), r.score1.toFixed(4), r.in0.toFixed(4), r.in1.toFixed(4), r.critic0.toFixed(4), r.critic1.toFixed(4), r.typ0.toFixed(2), r.typ1.toFixed(2), `"${r.misses}"`].join(','));
writeFileSync(`${here}../results/estilos/ga.csv`, `﻿${csv.join('\r\n')}\r\n`);

let md = `# Heurísticas de composição no algoritmo genético\n\nGerado por \`node tools/styles_ga_study.mjs ${SEEDS} ${GENERATIONS}\`: ${SEEDS} sementes por estilo, ${GENERATIONS} gerações, população 80, pesos por omissão com «não maximizar», população inicial dos blocos do corpus; com as definições que cada estilo sugere (compasso, frase, forma, compassos) e o peso das heurísticas a 0 («sem») ou a ${STYLE_WEIGHT.field}, o valor que um estilo recebe quando é escolhido («com»). Tabela também em \`results/estilos/ga.csv\`.\n\n`;
md += '| Estilo | Compasso | Pontuação do estilo: sem → com | Regras no intervalo: sem → com | Crítico: sem → com | Típicas /26: sem → com | Regras que mais falham (com) |\n|---|---|---|---|---|---|---|\n';
for (const r of rows) md += `| ${r.style === 'none' ? 'nenhum (só regras gerais)' : r.style} | ${r.meter} | ${f(r.score0)} → ${f(r.score1)} | ${Math.round(100 * r.in0)} % → ${Math.round(100 * r.in1)} % | ${f(r.critic0)} → ${f(r.critic1)} | ${f(r.typ0, 1)} → ${f(r.typ1, 1)} | ${r.misses || '—'} |\n`;
const avg = (k) => rows.reduce((a, r) => a + r[k], 0) / rows.length;
md += `\nMédia dos ${rows.length} casos: pontuação ${f(avg('score0'))} → ${f(avg('score1'))}, regras no intervalo ${Math.round(100 * avg('in0'))} % → ${Math.round(100 * avg('in1'))} %, crítico ${f(avg('critic0'))} → ${f(avg('critic1'))}, típicas ${f(avg('typ0'), 1)} → ${f(avg('typ1'), 1)}.\n`;
writeFileSync(`${here}../results/estilos-ga.md`, md);
log(`done in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
