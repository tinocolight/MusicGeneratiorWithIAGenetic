// Does the fado section change what the genetic algorithm writes? The same pieces (a single
// melody, 8 bars of 4/4, minor for the sad fado and major for the happy one) generated with no
// style, with the old "fado" (four generic rules) and with the fado styles of results/fado.md,
// several seeds each, measured with the verse features of heuristics.js.
//   node tools/fado_ga_study.mjs [seeds=6] [generations=400]
// Writes results/fado/ga.csv.

import { writeFileSync } from 'node:fs';
import { defaultConfig, buildFitness, applyStyle, cloneConfig } from '../src/ui/config.js';
import { createGA } from '../src/ga/ga.js';
import { createRng } from '../src/core/rng.js';
import { genesToLine } from '../src/ga/figures.js';
import { melodyFeatures, scoreRules } from '../src/fitness/heuristics.js';
import { resolveRules } from '../src/fitness/styles.js';

const here = new URL('.', import.meta.url).pathname;
const SEEDS = Number(process.argv[2] ?? 6);
const GENERATIONS = Number(process.argv[3] ?? 400);
const KEYS = ['verseFinal', 'verseNotes', 'restShare', 'syncBar', 'verseAnticip', 'verseEndStep', 'verseTonic', 'repeats', 'quickRuns', 'density', 'stepDown', 'range'];

// the four generic rules the fado style had before this study (src/fitness/styles.js, E32)
const OLD = [
  { id: 'finalLength', feature: 'finalLength', lo: 1.6, hi: 3, tol: 0.7, weight: 1.5 },
  { id: 'range', feature: 'range', lo: 10, hi: 17, tol: 5 },
  { id: 'steps', feature: 'steps', lo: 0.45, hi: 0.8, tol: 0.25 },
  { id: 'restShare', feature: 'restShare', lo: 0.02, hi: 0.15, tol: 0.25 },
];

const VARIANTS = [
  { label: 'sem estilo (menor)', style: 'none', major: false },
  { label: 'fado triste', style: 'fado', major: false },
  { label: 'sem estilo (maior)', style: 'none', major: true },
  { label: 'fado alegre', style: 'fadoAlegre', major: true },
];
const rows = [];
for (const v of VARIANTS) {
  const res = [];
  for (let s = 1; s <= SEEDS; s++) {
    const c = defaultConfig();
    c.major = v.major;
    c.scale = 1;
    if (v.style !== 'none') applyStyle(c, v.style);
    else c.form = 'AABB';
    c.meter = '4/4';
    c.bars = 8;
    c.phraseBars = 2;
    c.ga.seed = s;
    const b = buildFitness(cloneConfig(c));
    const ga = createGA({ fitness: b.fit, rng: createRng(s), length: b.fit.length, env: b.env, generations: GENERATIONS, popSize: 80, mutationRate: 0.9, strategy: 'tournament', operators: 'musical', initMode: c.ga.init });
    ga.step(Infinity);
    const f = melodyFeatures(genesToLine(ga.best.decoded), { meter: '4/4', key: b.key, phraseBars: 2, phraseStart: 0 });
    const fadoScore = scoreRules(f, resolveRules(v.major ? 'fadoAlegre' : 'fado', '4/4')).score;
    const oldScore = scoreRules(f, OLD).score;
    res.push({ ...Object.fromEntries(KEYS.map((k) => [k, f[k]])), fadoScore, oldScore });
  }
  const mean = (k) => { const a = res.map((r) => r[k]).filter(Number.isFinite); return a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN; };
  rows.push({ label: v.label, ...Object.fromEntries([...KEYS, 'fadoScore', 'oldScore'].map((k) => [k, mean(k)])) });
  console.error(v.label, rows.at(-1));
}
const f = (x) => (Number.isFinite(x) ? x.toFixed(3) : '');
writeFileSync(`${here}../results/fado/ga.csv`, `﻿${['variante', ...KEYS, 'regras_fado', 'regras_antigas'].join(',')}\r\n${rows.map((r) => [r.label, ...KEYS.map((k) => f(r[k])), f(r.fadoScore), f(r.oldScore)].join(',')).join('\r\n')}\r\n`);
