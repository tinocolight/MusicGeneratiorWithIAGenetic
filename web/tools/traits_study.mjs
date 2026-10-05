// Do the fitness traits made for the fado (styles.js: restTarget, anticipation, recitation) help the
// other styles whose rules fight the core fitness? The core fitness asks for few rests (0–8 %) and
// notes on the beat; the blues asks for 15–45 % of rests and syncopations, the pop for 8–30 % of
// rests. For each style and each set of traits, melodies generated as in styles_ga_study.mjs (the
// style's settings, the heuristics at the weight a style gets), several seeds, compared on the
// style's score, its rules inside their range, the rules that miss, and the critic.
//   node tools/traits_study.mjs [seeds=8] [generations=400]
// Writes results/estilos/tracos.csv and results/estilos-tracos.md.

import { writeFileSync } from 'node:fs';
import { defaultConfig, buildFitness, applyStyle, adaptToVoices, STYLE_WEIGHT } from '../src/ui/config.js';
import { STYLES } from '../src/fitness/styles.js';
import { createGA } from '../src/ga/ga.js';
import { createRng } from '../src/core/rng.js';
import { toEvents, eventsToCompact } from '../src/core/score.js';
import { meterOf } from '../src/core/meter.js';
import { loadCritic } from '../src/eval/critic.js';
import criticData from '../src/data/critic-data.js';

const here = new URL('.', import.meta.url).pathname;
const SEEDS = Number(process.argv[2] ?? 8);
const GENERATIONS = Number(process.argv[3] ?? 400);
const critic = loadCritic(criticData);
const TRAIT_KEYS = ['restTarget', 'anticipation', 'recitation'];

// the traits read from each style's own rules, as for the fado: the rests of restShare, and the
// syncopation (anticipation) and repeated notes (recitation) the style allows
const VARIANTS = {
  blues: [
    ['nenhum', {}],
    ['pausas', { restTarget: [0.12, 0.45] }],
    ['pausas + antecipação', { restTarget: [0.12, 0.45], anticipation: true }],
    ['pausas + antecipação + recitação', { restTarget: [0.12, 0.45], anticipation: true, recitation: true }],
  ],
  pop: [
    ['nenhum', {}],
    ['pausas', { restTarget: [0.06, 0.3] }],
    ['pausas + antecipação', { restTarget: [0.06, 0.3], anticipation: true }],
  ],
};

function run(style, seed) {
  const c = defaultConfig();
  applyStyle(c, style);
  c.weights.heuristics = STYLE_WEIGHT.field;
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
  const events = toEvents(genes);
  const compact = eventsToCompact(events);
  let t = 0;
  const first = [];
  for (const [p, d] of compact) if (t < 128) (first.push([p, Math.min(d, 128 - t)]), (t += d));
  const cr = critic.evaluate(first, { barLen: meter.barLen, beat: meter.beat });
  // the critic learnt its melodies from folk songs, where syncopation is rare (P90 0.03 per note)
  // and weighs it against them (-0.59); the same critic with the syncopation at the corpus mean
  const z = criticData.features.map((f) => cr.perFeature[f].z);
  z[criticData.features.indexOf('syncopation')] = 0;
  const noSync = 1 / (1 + Math.exp(-(criticData.logistic.b + z.reduce((a, x, j) => a + criticData.logistic.w[j] * x, 0))));
  const total = events.reduce((a, e) => a + e.dur, 0);
  const rests = events.filter((e) => e.pitch === null).reduce((a, e) => a + e.dur, 0) / total;
  return {
    score: h.score, inRange: judged.filter((r) => r.s === 1).length / judged.length, critic: cr.humanLike, noSync,
    typical: cr.typicality * criticData.features.length, rests, misses: judged.filter((r) => r.s < 1).map((r) => r.id),
    value: (id) => h.rules.find((r) => r.id === id)?.value,
  };
}

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const rows = [];
const t0 = Date.now();
for (const [style, variants] of Object.entries(VARIANTS)) {
  const saved = Object.fromEntries(TRAIT_KEYS.map((k) => [k, STYLES[style][k]]));
  for (const [name, traits] of variants) {
    for (const k of TRAIT_KEYS) delete STYLES[style][k];
    Object.assign(STYLES[style], traits);
    const res = [];
    for (let s = 1; s <= SEEDS; s++) res.push(run(style, s));
    const misses = {};
    for (const r of res) for (const m of r.misses) misses[m] = (misses[m] || 0) + 1;
    const row = {
      style, variant: name, score: mean(res.map((r) => r.score)), inRange: mean(res.map((r) => r.inRange)),
      critic: mean(res.map((r) => r.critic)), noSync: mean(res.map((r) => r.noSync)), typical: mean(res.map((r) => r.typical)), rests: mean(res.map((r) => r.rests)),
      sync: mean(res.map((r) => r.value('syncBar') ?? 0)),
      misses: Object.entries(misses).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}/${SEEDS}`).join('; '),
    };
    rows.push(row);
    console.error(`${style} ${name}: score ${row.score.toFixed(3)}, in range ${(100 * row.inRange).toFixed(0)} %, critic ${row.critic.toFixed(2)} (without syncopation ${row.noSync.toFixed(2)}), typical ${row.typical.toFixed(1)}, rests ${(100 * row.rests).toFixed(0)} %, sync/bar ${row.sync.toFixed(2)}; misses ${row.misses} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  for (const k of TRAIT_KEYS) delete STYLES[style][k];
  for (const [k, v] of Object.entries(saved)) if (v !== undefined) STYLES[style][k] = v;
}

const csv = ['estilo,tracos,pontuacao,regras_no_intervalo,critico,critico_sem_sincopa,tipicas,pausas,sincopas_por_compasso,regras_que_falham'];
for (const r of rows) csv.push([r.style, `"${r.variant}"`, r.score.toFixed(4), r.inRange.toFixed(4), r.critic.toFixed(4), r.noSync.toFixed(4), r.typical.toFixed(2), r.rests.toFixed(4), r.sync.toFixed(3), `"${r.misses}"`].join(','));
writeFileSync(`${here}../results/estilos/tracos.csv`, `﻿${csv.join('\r\n')}\r\n`);
const f = (x, d = 2) => x.toFixed(d).replace('.', ',');
let md = `# Os traços de aptidão do fado no blues e no pop\n\nGerado por \`node tools/traits_study.mjs ${SEEDS} ${GENERATIONS}\`: ${SEEDS} sementes por variante, ${GENERATIONS} gerações, população 80, com as definições de cada estilo e o peso das heurísticas de um estilo escolhido. Tabela também em \`results/estilos/tracos.csv\`. O crítico aprendeu as suas melodias em canções folk, onde a síncopa é rara, e pesa-a contra elas; a coluna «sem a síncopa» é o mesmo crítico com a síncopa na média do corpus.\n\n`;
md += '| Estilo | Traços | Pontuação do estilo | Regras no intervalo | Pausas | Síncopas por compasso | Crítico | Crítico sem a síncopa | Regras que falham |\n|---|---|---|---|---|---|---|---|---|\n';
for (const r of rows) md += `| ${r.style} | ${r.variant} | ${f(r.score, 3)} | ${Math.round(100 * r.inRange)} % | ${Math.round(100 * r.rests)} % | ${f(r.sync)} | ${f(r.critic)} | ${f(r.noSync)} | ${r.misses || '—'} |\n`;
writeFileSync(`${here}../results/estilos-tracos.md`, md);
console.error(`done in ${((Date.now() - t0) / 1000).toFixed(0)} s (${SEEDS} seeds, ${GENERATIONS} generations)`);
