// "Reverse" analysis: instead of generating music from the rules, feed finished, real music to
// the rules and see how each rule scores it (as the original report did in §5.1 with a few
// classical openings, here with ~300 whole melodies and three Telemann canons).
//
//   * real melodies vs null models (white / brown noise, the same melody shuffled) and vs the
//     GA's own outputs: a rule that gives real music a *low* score, or that the GA pushes far
//     beyond anything real music does, is suspicious;
//   * retrograde: the same melodies read from the end to the beginning; rules whose score
//     changes carry a direction of time (cadences, arches, resolutions);
//   * weights learned from real music: a logistic regression on the rule scores separating real
//     melodies from the null models gives data-driven weights for the new fitness.
//
//   node tools/reverse.mjs   (needs data/corpus-full.json: python3 tools/extract_corpus.py --full)
// Writes results/reverse.json, results/reverse.md and src/data/learned-weights.js.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRng } from '../src/core/rng.js';
import { fromEvents, compactToEvents, toEvents, eventsToCompact, STEPS_PER_BAR } from '../src/core/score.js';
import { MAJOR_TONICS, makeKey } from '../src/core/theory.js';
import { createClassicFitness } from '../src/fitness/classic.js';
import { createAttractorFitness, DEFAULT_WEIGHTS } from '../src/fitness/attractor.js';
import { resolvePreset } from '../src/fitness/presets.js';
import { createGA } from '../src/ga/ga.js';
import { loadCritic, trainLogistic, predict, auc } from '../src/eval/critic.js';
import criticData from '../src/data/critic-data.js';
import { REFERENCE_CANONS, referenceEvents } from '../src/data/references.js';

const here = new URL('.', import.meta.url).pathname;
const critic = loadCritic(criticData);
const full = JSON.parse(readFileSync(`${here}../data/corpus-full.json`, 'utf8')).melodies;
const rng = createRng(2027);

// ------------------------------------------------------------------ real melodies on the 4/4 grid

function alignToBars(m) {
  // drop the anacrusis, then extend the last note so the melody fills whole bars
  let t = 0;
  const ev = [];
  for (const [p, d] of m.events) {
    const a = Math.max(t, m.pickup);
    const b = t + d;
    if (b > a) ev.push([p, b - a]);
    t = b;
  }
  const total = ev.reduce((a, e) => a + e[1], 0);
  const bars = Math.ceil(total / STEPS_PER_BAR);
  if (total % STEPS_PER_BAR) ev[ev.length - 1][1] += bars * STEPS_PER_BAR - total;
  while (ev.length && ev[ev.length - 1][0] < 0) ev.pop(); // trailing rest -> hold the last note
  const tot2 = ev.reduce((a, e) => a + e[1], 0);
  if (tot2 < bars * STEPS_PER_BAR) ev[ev.length - 1][1] += bars * STEPS_PER_BAR - tot2;
  return { events: ev, bars };
}

const scaleIndexOf = (tonic, mode) => MAJOR_TONICS.indexOf(mode === 'major' ? tonic : (tonic + 3) % 12);

const real = full
  .filter((m) => m.barLen === 16)
  .map((m) => ({ ...m, ...alignToBars(m) }))
  .filter((m) => m.bars >= 4 && m.bars <= 16 && m.events.length >= 12);

// ------------------------------------------------------------------ comparison material

function retrograde(events) {
  return events.slice().reverse();
}

function shuffledPitches(events) {
  const ps = rng.shuffle(events.filter(([p]) => p >= 0).map(([p]) => p));
  let i = 0;
  return events.map(([p, d]) => (p < 0 ? [p, d] : [ps[i++], d]));
}

function noiseLike(events, tonic, mode, kind) {
  const key = makeKey(tonic, mode);
  const ps = events.filter(([p]) => p >= 0).map(([p]) => p);
  const lo = Math.min(...ps);
  const hi = Math.max(...ps);
  const scale = [];
  for (let m = lo; m <= hi; m++) if (key.diatonic[m % 12]) scale.push(m);
  let idx = Math.floor(scale.length / 2);
  return events.map(([p, d]) => {
    if (p < 0) return [p, d];
    if (kind === 'white') return [rng.pick(scale), d];
    idx = Math.max(0, Math.min(scale.length - 1, idx + rng.pick([-2, -1, -1, 0, 1, 1, 2])));
    return [scale[idx], d];
  });
}

// ------------------------------------------------------------------ scoring

const fitnessCache = new Map();
function fitnessFor(kind, tonic, mode, bars) {
  const k = `${kind}|${tonic}|${mode}|${bars}`;
  if (!fitnessCache.has(k)) {
    fitnessCache.set(k, kind === 'classic'
      ? createClassicFitness({ scale: scaleIndexOf(tonic, mode), major: mode === 'major', bars })
      : createAttractorFitness({ tonic, mode, bars, waves: resolvePreset('arch', tonic), seed: 1, voices: [{ instrument: 'piano' }] }));
  }
  return fitnessCache.get(k);
}

function score(events, tonic, mode, bars) {
  const genes = fromEvents(compactToEvents(events), bars * STEPS_PER_BAR);
  const classic = fitnessFor('classic', tonic, mode, bars);
  const field = fitnessFor('field', tonic, mode, bars);
  const c = classic.evaluate(genes, { generation: 1, maxGenerations: 1, evaluationCount: 1e9 }); // group-2 weights
  const f = field.evaluate(genes);
  const first8 = [];
  let t = 0;
  for (const [p, d] of events) {
    if (t >= 128) break;
    first8.push([p, Math.min(d, 128 - t)]);
    t += d;
  }
  return {
    classicPerBar: c.score / bars,
    classic: Object.fromEntries(Object.entries(c.parts).map(([k, v]) => [k, v / bars])),
    field: f.score,
    fieldParts: f.parts,
    critic: critic.evaluate(first8, { barLen: 16 }).humanLike,
  };
}

const groups = { real: [], retro: [], shuffled: [], brown: [], white: [] };
for (const m of real) {
  groups.real.push(score(m.events, m.tonic, m.mode, m.bars));
  groups.retro.push(score(retrograde(m.events), m.tonic, m.mode, m.bars));
  groups.shuffled.push(score(shuffledPitches(m.events), m.tonic, m.mode, m.bars));
  groups.brown.push(score(noiseLike(m.events, m.tonic, m.mode, 'brown'), m.tonic, m.mode, m.bars));
  groups.white.push(score(noiseLike(m.events, m.tonic, m.mode, 'white'), m.tonic, m.mode, m.bars));
}

// GA outputs (8 bars, G major), scored the same way
groups.gaClassic = [];
groups.gaField = [];
for (let seed = 1; seed <= 6; seed++) {
  const cf = createClassicFitness();
  const ga = createGA({ fitness: cf, rng: createRng(seed), length: cf.length, generations: 1500 });
  ga.step(Infinity);
  groups.gaClassic.push(score(eventsToCompact(toEvents(ga.best.decoded)), 7, 'major', 8));
  const ff = fitnessFor('field', 7, 'major', 8);
  const gb = createGA({ fitness: ff, rng: createRng(seed), length: ff.length, env: ff.env, generations: 600, popSize: 80, strategy: 'tournament', operators: 'musical' });
  gb.step(Infinity);
  groups.gaField.push(score(eventsToCompact(toEvents(gb.best.decoded)), 7, 'major', 8));
}

// Telemann Sonata III (4/4) as a two-violin canon, whole piece
const t3 = REFERENCE_CANONS.telemann3;
const t3events = referenceEvents(t3);
const t3bars = Math.ceil(t3events.reduce((a, e) => a + e[1], 0) / 16);
const t3fit = createAttractorFitness({ tonic: 2, mode: 'major', bars: t3bars, waves: resolvePreset('arch', 2), seed: 1,
  voices: [{ instrument: 'violin' }, { instrument: 'violin', delayBars: 1, interval: 'unison' }] });
const t3res = t3fit.evaluate(fromEvents(compactToEvents(t3events), t3bars * 16));

// ------------------------------------------------------------------ statistics

const FIELD_KEYS = Object.keys(DEFAULT_WEIGHTS).filter((k) => k !== 'canon');
const CLASSIC_KEYS = Object.keys(groups.real[0].classic);
const get = (row, sys, k) => (sys === 'field' ? row.fieldParts[k] : row.classic[k]);
const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const sd = (v) => {
  const m = mean(v);
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, v.length - 1));
};
const cohen = (a, b) => (mean(a) - mean(b)) / (Math.sqrt((sd(a) ** 2 + sd(b) ** 2) / 2) || 1);

function table(sys, keys) {
  return keys.map((k) => {
    const col = (g) => groups[g].map((r) => get(r, sys, k)).filter(Number.isFinite);
    const r = col('real');
    const paired = groups.real.map((row, i) => get(row, sys, k) - get(groups.retro[i], sys, k)).filter(Number.isFinite);
    return {
      rule: k,
      real: mean(r),
      realSd: sd(r),
      retro: mean(col('retro')),
      shuffled: mean(col('shuffled')),
      brown: mean(col('brown')),
      white: mean(col('white')),
      gaClassic: mean(col('gaClassic')),
      gaField: mean(col('gaField')),
      dVsWhite: cohen(r, col('white')),
      dVsShuffled: cohen(r, col('shuffled')),
      forwardWins: paired.filter((x) => x > 1e-9).length / paired.length,
      backwardWins: paired.filter((x) => x < -1e-9).length / paired.length,
    };
  });
}

const fieldTable = table('field', FIELD_KEYS);
const classicTable = table('classic', CLASSIC_KEYS);

// learned weights: real (1) vs null models (0), standardised rule scores
function learn(sys, keys) {
  const rows = [];
  const ys = [];
  for (const g of ['real', 'shuffled', 'brown', 'white']) {
    for (const r of groups[g]) {
      rows.push(keys.map((k) => get(r, sys, k)));
      ys.push(g === 'real' ? 1 : 0);
    }
  }
  const mu = keys.map((_, j) => mean(rows.map((r) => r[j])));
  const sg = keys.map((_, j) => sd(rows.map((r) => r[j])) || 1);
  const X = rows.map((r) => r.map((v, j) => (Number.isFinite(v) ? (v - mu[j]) / sg[j] : 0)));
  // 5-fold CV AUC
  const idx = rng.shuffle([...X.keys()]);
  const scores = new Array(X.length);
  for (let f = 0; f < 5; f++) {
    const test = new Set(idx.filter((_, i) => i % 5 === f));
    const tr = [...X.keys()].filter((i) => !test.has(i));
    const m = trainLogistic(tr.map((i) => X[i]), tr.map((i) => ys[i]), { iters: 1500 });
    for (const i of test) scores[i] = predict(m, X[i]);
  }
  const model = trainLogistic(X, ys, { iters: 2000 });
  // back to raw rule units: w_raw = w_std / sd
  const raw = model.w.map((w, j) => w / sg[j]);
  return { keys, weightsStd: model.w, weightsRaw: raw, cvAuc: auc(scores, ys) };
}

const learnedField = learn('field', FIELD_KEYS);
const learnedClassic = learn('classic', CLASSIC_KEYS);

// weights for the page. The null models keep the rhythm and the key of the real melody, so the
// rhythm, form and key rules cannot be learned here: they keep their default weights. The other
// rules get the positive learned weights, rescaled to the total of their default weights.
const NOT_LEARNABLE = new Set(['rhythm', 'form', 'key']);
const learnable = FIELD_KEYS.filter((k) => !NOT_LEARNABLE.has(k));
const posRaw = Object.fromEntries(learnable.map((k) => [k, Math.max(0, learnedField.weightsRaw[FIELD_KEYS.indexOf(k)])]));
const totalDefault = learnable.reduce((a, k) => a + DEFAULT_WEIGHTS[k], 0);
const totalPos = Object.values(posRaw).reduce((a, b) => a + b, 0) || 1;
const learnedWeights = Object.fromEntries(FIELD_KEYS.map((k) => [k, NOT_LEARNABLE.has(k) ? DEFAULT_WEIGHTS[k] : +((posRaw[k] / totalPos) * totalDefault).toFixed(2)]));

// how the total fitness ranks real music against GA outputs and noise
const frac = (a, b, key) => {
  let w = 0;
  let n = 0;
  for (const x of groups[a]) for (const y of groups[b]) {
    n++;
    if (x[key] > y[key]) w++;
  }
  return w / n;
};

const results = {
  n: real.length,
  barsRange: [Math.min(...real.map((m) => m.bars)), Math.max(...real.map((m) => m.bars))],
  totals: Object.fromEntries(Object.entries(groups).map(([g, rows]) => [g, {
    classicPerBar: mean(rows.map((r) => r.classicPerBar).filter(Number.isFinite)),
    field: mean(rows.map((r) => r.field)),
    critic: mean(rows.map((r) => r.critic)),
  }])),
  realBeats: {
    classic: { white: frac('real', 'white', 'classicPerBar'), shuffled: frac('real', 'shuffled', 'classicPerBar'), gaClassic: frac('real', 'gaClassic', 'classicPerBar') },
    field: { white: frac('real', 'white', 'field'), shuffled: frac('real', 'shuffled', 'field'), gaField: frac('real', 'gaField', 'field'), retro: frac('real', 'retro', 'field') },
  },
  fieldTable,
  classicTable,
  learnedField,
  learnedClassic,
  learnedWeights,
  telemann3: { score: t3res.score, parts: t3res.parts },
};
mkdirSync(`${here}../results`, { recursive: true });
writeFileSync(`${here}../results/reverse.json`, JSON.stringify(results, null, 1));
writeFileSync(`${here}../src/data/learned-weights.js`, `// generated by tools/reverse.mjs: rule weights learned from real melodies (see results/reverse.md)\nexport const LEARNED_WEIGHTS = ${JSON.stringify(learnedWeights)};\n`);

// ------------------------------------------------------------------ report
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '—');
const pct = (x) => `${Math.round(x * 100)} %`;
let md = `# Análise inversa: a música real passada pelas regras\n\nGerado por \`node tools/reverse.mjs\`. ${results.n} melodias reais completas em 4/4 (${results.barsRange[0]}–${results.barsRange[1]} compassos, alinhadas no 1.º tempo forte, finais verdadeiros), comparadas com as mesmas melodias lidas de trás para a frente (retrógrado), com as notas baralhadas, com ruído castanho e branco na mesma tonalidade e âmbito, e com 6 saídas do AG em cada modo.\n\n`;
md += `## Totais\n\n| Grupo | Clássico (por compasso) | Campo de atratores | Crítico |\n|---|---|---|---|\n`;
const names = { real: 'Melodias reais', retro: 'Reais em retrógrado', shuffled: 'Reais baralhadas', brown: 'Ruído castanho', white: 'Ruído branco', gaClassic: 'AG clássico', gaField: 'AG campo de atratores' };
for (const [g, t] of Object.entries(results.totals)) md += `| ${names[g]} | ${f2(t.classicPerBar)} | ${f2(t.field)} | ${f2(t.critic)} |\n`;
md += `\nA aptidão clássica dá à música real mais pontos do que ao ruído branco em ${pct(results.realBeats.classic.white)} dos pares e mais do que às próprias saídas do AG clássico em ${pct(results.realBeats.classic.gaClassic)}. A aptidão nova dá à música real mais do que ao ruído branco em ${pct(results.realBeats.field.white)}, mais do que à melodia baralhada em ${pct(results.realBeats.field.shuffled)}, mais do que ao retrógrado em ${pct(results.realBeats.field.retro)} e mais do que às saídas do AG em ${pct(results.realBeats.field.gaField)}.\n`;
const ruleRows = (rows, labelFn) => rows.map((r) => `| ${labelFn(r.rule)} | ${f2(r.real)} ± ${f2(r.realSd)} | ${f2(r.retro)} | ${f2(r.shuffled)} | ${f2(r.white)} | ${f2(r.gaClassic)} | ${f2(r.gaField)} | ${f2(r.dVsWhite)} | ${pct(r.forwardWins)} / ${pct(r.backwardWins)} |`).join('\n');
md += `\n## Regras do campo de atratores\n\n| Regra | Reais | Retrógrado | Baralhadas | Ruído branco | AG clássico | AG campo | d (real vs branco) | direto > retrógrado / < |\n|---|---|---|---|---|---|---|---|---|\n${ruleRows(fieldTable, (k) => k)}\n`;
md += `\n## Regras do C# original (por compasso)\n\n| Regra | Reais | Retrógrado | Baralhadas | Ruído branco | AG clássico | AG campo | d (real vs branco) | direto > retrógrado / < |\n|---|---|---|---|---|---|---|---|---|\n${ruleRows(classicTable, (k) => k)}\n`;
const lw = (L) => L.keys.map((k, j) => `${k} ${L.weightsStd[j] >= 0 ? '+' : ''}${L.weightsStd[j].toFixed(2)}`).join(' · ');
md += `\n## Pesos aprendidos (real vs modelos nulos, regressão logística)\n\n- Regras novas: AUC ${f2(learnedField.cvAuc)} (5-fold). Pesos padronizados: ${lw(learnedField)}.\n- Regras originais: AUC ${f2(learnedClassic.cvAuc)}. Pesos padronizados: ${lw(learnedClassic)}.\n- Preset «Pesos aprendidos do corpus» (ritmo, forma e tonalidade ficam com os pesos por omissão, porque os modelos nulos conservam o ritmo e a tonalidade da melodia real; as outras regras recebem os pesos positivos aprendidos, com a mesma soma que os por omissão): ${Object.entries(learnedWeights).map(([k, v]) => `${k} ${v}`).join(', ')}.\n`;
md += `\n## Telemann, Sonata III (Spirituoso), como cânone a 2 violinos\n\nAptidão ${f2(t3res.score)}; ${Object.entries(t3res.parts).map(([k, v]) => `${k} ${f2(v)}`).join(', ')}.\n`;
writeFileSync(`${here}../results/reverse.md`, md);
console.log(md);
