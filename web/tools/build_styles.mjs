// Composition heuristics by style (src/fitness/styles.js), calibrated and checked on real melodies
// (data/corpus-meters.json):
//   src/data/style-calibration.js   P10 / P50 / P90 of every rule in every meter: all the melodies
//                                   (general rules) and the melodies of each style the corpus has
//   results/estilos/calibracao.csv  the same numbers, as a table
//   results/estilos/validacao.csv   (1) real melodies against the same melodies with their notes
//                                   shuffled, (2) recognition of the styles the corpus has, both with
//                                   5-fold cross-validation (ranges measured without the fold judged)
//
//   node tools/build_styles.mjs
//
// Styles in the corpus, by collection, title and meter: folk = Essen songs; chorale = sopranos of
// Bach's chorales; reel, jig (6/8), slip jig (every 9/8 dance tune), hornpipe, strathspey, march
// (and "quick step") = the dance collections (O'Neill, Ryan's Mammoth, Aird's Airs). Reels and
// hornpipes that Ryan's and O'Neill write in 2/4 with sixteenths are read in 4/4 with eighths
// (durations doubled): the same music, as the other collections write it.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { compactToLine } from '../src/ga/figures.js';
import { melodyFeatures, ruleValue, scoreRules } from '../src/fitness/heuristics.js';
import { GENERAL_RULES, STYLES, STYLE_IDS, resolveRules } from '../src/fitness/styles.js';
import { makeKey } from '../src/core/theory.js';
import { METERS, phraseBarsFor } from '../src/core/meter.js';
import { createRng } from '../src/core/rng.js';

const here = new URL('.', import.meta.url).pathname;
const OUT = `${here}../results/estilos`;
mkdirSync(OUT, { recursive: true });
const log = (...a) => console.error(...a);
const corpus = JSON.parse(readFileSync(`${here}../data/corpus-meters.json`, 'utf8'));
const DANCE = new Set(['oneills', 'ryans', 'airds']);
const MIN_N = 25; // fewer melodies than this: no range from the corpus
const ORDER = ['2/4', '3/4', '4/4', '3/8', '6/8', '9/8', '12/8'];

// ------------------------------------------------------------------ the corpus, by style

function groupsOf(m, meter) {
  const t = (m.title || '').toLowerCase();
  const g = [];
  if (m.source === 'essen') g.push('folk');
  if (m.source === 'bach-chorale') g.push('chorale');
  if (DANCE.has(m.source)) {
    if (t.includes('reel') && !t.includes('strathspey') && meter === '4/4') g.push('reel');
    if (t.includes('hornpipe') && meter === '4/4') g.push('hornpipe');
    if (t.includes('strathspey') && meter === '4/4') g.push('strathspey');
    if (t.includes('jig') && meter === '6/8') g.push('jig');
    if (meter === '9/8') g.push('slipJig');
    if (/march|quick ?step/.test(t)) g.push('march');
  }
  return g;
}

function densityOf(m) {
  const notes = m.events.filter(([p]) => p >= 0).length;
  const len = m.events.reduce((a, [, d]) => a + d, 0);
  return notes / (len / 4);
}

const items = [];
for (const m of corpus.melodies) {
  let meter = `${m.num}/${m.den}`;
  if (meter === '2/2') meter = '4/4';
  let events = m.events;
  let pickup = m.pickup || 0;
  const t = (m.title || '').toLowerCase();
  // 2/4 reels and hornpipes in sixteenths = 4/4 in eighths
  if (meter === '2/4' && DANCE.has(m.source) && /reel|hornpipe/.test(t) && !t.includes('strathspey') && densityOf(m) >= 3) {
    events = events.map(([p, d]) => [p, 2 * d]);
    pickup *= 2;
    meter = '4/4';
  }
  if (!METERS[meter]) continue;
  const bar = METERS[meter].barLen;
  const pad = pickup ? (bar - (pickup % bar)) % bar : 0;
  const l = compactToLine(events);
  const line = { pitch: [...new Array(pad).fill(null), ...l.pitch], onset: [...new Array(pad).fill(false), ...l.onset] };
  const key = makeKey(m.tonic, m.mode);
  const ctx = { meter, key, phraseBars: phraseBarsFor(meter), phraseStart: pad };
  const f = melodyFeatures(line, ctx);
  if ((f.notes ?? 0) < 8) continue;
  items.push({ m, meter, line, ctx, key, f, fold: m.id % 5, groups: groupsOf(m, meter) });
}
log(`${items.length} melodies`);

// every rule that can be calibrated, by id (general rules, and the rules of the styles with a group)
const RULES = new Map();
for (const r of GENERAL_RULES) RULES.set(r.id, r);
for (const id of STYLE_IDS) for (const r of STYLES[id].rules) if (!RULES.has(r.id)) RULES.set(r.id, r);
const figOk = (r, meter) => !r.figures || r.figures.every((c) => c.length === METERS[meter].beat);

const quant = (xs, p) => xs[Math.min(xs.length - 1, Math.floor(p * (xs.length - 1)))];
const r4 = (x) => +x.toFixed(4);

/** Calibration table from a set of melodies: {general: {meter: {rule: [p10, p50, p90]}}, styles: {...}, n}. */
function calibrate(set) {
  const cal = { general: {}, styles: {}, n: { general: {}, styles: {} } };
  const add = (table, nTable, key, meter, xs) => {
    const row = {};
    for (const [id, r] of RULES) {
      if (!figOk(r, meter)) continue;
      const v = xs.map((x) => ruleValue(x.f, r)).filter(Number.isFinite).sort((a, b) => a - b);
      if (v.length >= MIN_N) row[id] = [r4(quant(v, 0.1)), r4(quant(v, 0.5)), r4(quant(v, 0.9))];
    }
    if (key === null) {
      table[meter] = row;
      nTable[meter] = xs.length;
    } else {
      (table[key] ||= {})[meter] = row;
      (nTable[key] ||= {})[meter] = xs.length;
    }
  };
  for (const meter of ORDER) {
    const xs = set.filter((x) => x.meter === meter);
    if (xs.length >= MIN_N) add(cal.general, cal.n.general, null, meter, xs);
  }
  const groups = [...new Set(set.flatMap((x) => x.groups))];
  for (const g of groups) {
    for (const meter of ORDER) {
      const xs = set.filter((x) => x.meter === meter && x.groups.includes(g));
      if (xs.length >= MIN_N) add(cal.styles, cal.n.styles, g, meter, xs);
    }
  }
  return cal;
}

// ------------------------------------------------------------------ calibration with every melody

const full = calibrate(items);
writeFileSync(`${here}../src/data/style-calibration.js`, `// Generated by tools/build_styles.mjs — do not edit by hand.
// P10 / P50 / P90 of every heuristic rule measured on the real melodies of data/corpus-meters.json:
// "general" = all the melodies of each meter; "styles" = the melodies of each style the corpus has.
export default ${JSON.stringify(full)};
`);

const csvCell = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
function writeCsv(name, header, rows) {
  const body = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  writeFileSync(`${OUT}/${name}.csv`, `﻿${body}\r\n`);
  log(`  ${name}.csv: ${rows.length} rows`);
}

const calRows = [];
for (const [meter, row] of Object.entries(full.general)) {
  for (const [id, q] of Object.entries(row)) calRows.push(['geral', meter, full.n.general[meter], id, RULES.get(id).feature ?? `figuras ${RULES.get(id).figures.join(' ')}${RULES.get(id).at !== undefined ? ` no tempo ${RULES.get(id).at + 1}` : ''}`, ...q]);
}
for (const [g, byMeter] of Object.entries(full.styles)) {
  for (const [meter, row] of Object.entries(byMeter)) {
    for (const [id, q] of Object.entries(row)) calRows.push([g, meter, full.n.styles[g][meter], id, RULES.get(id).feature ?? `figuras ${RULES.get(id).figures.join(' ')}${RULES.get(id).at !== undefined ? ` no tempo ${RULES.get(id).at + 1}` : ''}`, ...q]);
  }
}
writeCsv('calibracao', ['grupo', 'compasso', 'melodias', 'regra', 'medida', 'p10', 'p50', 'p90'], calRows);

// every rule as the app uses it: by style and meter, with its target and where the target comes from
const measureOf = (r) => r.feature ?? `figuras ${r.figures.join(' ')}${r.at !== undefined ? ` no tempo ${r.at + 1}` : ''}`;
const fmt = (x) => (Number.isFinite(x) ? +x.toFixed(4) : '');
const ruleRows = [];
for (const style of ['none', ...STYLE_IDS]) {
  const meters = style === 'none' ? ORDER : STYLES[style].meters;
  const own = new Set(style === 'none' ? [] : STYLES[style].rules.map((r) => r.id));
  for (const meter of meters) {
    for (const r of resolveRules(style, meter)) {
      const target = r.in ? r.in.join(' ou ') : `${fmt(r.lo)}–${fmt(r.hi)}`;
      const origin = r.calibrated ? (own.has(r.id) || STYLES[style]?.group ? `corpus (${STYLES[style]?.group ?? 'todas as melodias do compasso'})` : 'corpus (todas as melodias do compasso)') : 'literatura';
      ruleRows.push([style === 'none' ? 'nenhum (regras gerais)' : style, meter, r.id, own.has(r.id) ? 'do estilo' : 'geral', measureOf(r), target, r.in ? '' : fmt(r.tol), origin, r.weight ?? 1, r.src.join(' ')]);
    }
  }
}
writeCsv('regras', ['estilo', 'compasso', 'regra', 'tipo', 'medida', 'alvo', 'tolerancia', 'origem_do_alvo', 'peso', 'fontes'], ruleRows);

// ------------------------------------------------------------------ validation (5-fold cross-validation)

const folds = [0, 1, 2, 3, 4].map((k) => calibrate(items.filter((x) => x.fold !== k)));
const ruleCache = new Map();
const rulesFor = (style, meter, k) => {
  const key = `${style}|${meter}|${k}`;
  if (!ruleCache.has(key)) ruleCache.set(key, resolveRules(style, meter, folds[k]));
  return ruleCache.get(key);
};

// (1) real melodies against the same rhythm with the notes shuffled
const rng = createRng(2024);
function shuffled(x) {
  const pitches = [];
  for (let t = 0; t < x.line.pitch.length; t++) if (x.line.onset[t]) pitches.push(x.line.pitch[t]);
  const perm = rng.shuffle(pitches.slice());
  const pitch = x.line.pitch.slice();
  let k = -1;
  for (let t = 0; t < pitch.length; t++) {
    if (x.line.onset[t]) k++;
    if (pitch[t] !== null) pitch[t] = perm[k];
  }
  return { pitch, onset: x.line.onset };
}
const validation = [];
let better = 0;
let ties = 0;
let sumReal = 0;
let sumNull = 0;
const perRule = new Map();
for (const x of items) {
  const rules = rulesFor('none', x.meter, x.fold);
  const real = scoreRules(x.f, rules);
  const fNull = melodyFeatures(shuffled(x), x.ctx);
  const nul = scoreRules(fNull, rules);
  sumReal += real.score;
  sumNull += nul.score;
  if (real.score > nul.score + 1e-9) better++;
  else if (Math.abs(real.score - nul.score) <= 1e-9) ties++;
  real.rules.forEach((r, i) => {
    const s = perRule.get(r.id) ?? { real: 0, nul: 0, n: 0 };
    if (r.s !== null && nul.rules[i].s !== null) {
      s.real += r.s === 1 ? 1 : 0;
      s.nul += nul.rules[i].s === 1 ? 1 : 0;
      s.n++;
    }
    perRule.set(r.id, s);
  });
}
const nItems = items.length;
validation.push(['reais_vs_baralhadas', 'todas', 'pontuação média (reais)', r4(sumReal / nItems)]);
validation.push(['reais_vs_baralhadas', 'todas', 'pontuação média (notas baralhadas)', r4(sumNull / nItems)]);
validation.push(['reais_vs_baralhadas', 'todas', 'pares em que a real pontua mais', r4((better + ties / 2) / nItems)]);
for (const [id, s] of perRule) {
  validation.push(['regra_cumprida', id, 'reais', r4(s.real / Math.max(1, s.n))]);
  validation.push(['regra_cumprida', id, 'baralhadas', r4(s.nul / Math.max(1, s.n))]);
}
log(`real ${(sumReal / nItems).toFixed(3)} vs shuffled ${(sumNull / nItems).toFixed(3)}; real better in ${(100 * (better + ties / 2) / nItems).toFixed(1)} % of pairs`);

// (2) recognition: among the styles of the melody's meter, does its own style score highest?
const CORPUS_STYLES = STYLE_IDS.filter((id) => STYLES[id].group);
const recog = new Map();
const confusion = new Map();
for (const x of items) {
  const own = x.groups.find((g) => CORPUS_STYLES.includes(g) && STYLES[g].meters.includes(x.meter));
  if (!own) continue;
  const candidates = STYLE_IDS.filter((id) => STYLES[id].meters.includes(x.meter));
  const scores = candidates.map((id) => [id, scoreRules(x.f, rulesFor(id, x.meter, x.fold)).score]);
  const top = Math.max(...scores.map(([, s]) => s));
  // styles that tie at the top share the credit
  const tied = scores.filter(([, s]) => s >= top - 1e-9).map(([id]) => id);
  const ownScore = scores.find(([id]) => id === own)[1];
  const others = scores.filter(([id]) => id !== own).reduce((a, [, s]) => a + s, 0);
  const key = `${own}|${x.meter}`;
  const r = recog.get(key) ?? { n: 0, top: 0, own: 0, others: 0, candidates: candidates.length };
  r.n++;
  if (tied.includes(own)) r.top += 1 / tied.length;
  r.own += ownScore;
  r.others += others / Math.max(1, candidates.length - 1);
  recog.set(key, r);
  for (const id of tied) {
    if (id === own) continue;
    const ck = `${own}|${x.meter}|${id}`;
    confusion.set(ck, (confusion.get(ck) || 0) + 1 / tied.length);
  }
}
for (const [key, r] of [...recog].sort()) {
  const [style, meter] = key.split('|');
  validation.push(['reconhecimento', `${style} ${meter}`, `melodias (estilos concorrentes: ${r.candidates})`, r.n]);
  validation.push(['reconhecimento', `${style} ${meter}`, 'o próprio estilo pontua mais alto', r4(r.top / r.n)]);
  validation.push(['reconhecimento', `${style} ${meter}`, 'o mesmo, ao acaso', r4(1 / r.candidates)]);
  validation.push(['reconhecimento', `${style} ${meter}`, 'pontuação média no próprio estilo', r4(r.own / r.n)]);
  validation.push(['reconhecimento', `${style} ${meter}`, 'pontuação média nos outros estilos', r4(r.others / r.n)]);
  const confused = [...confusion].filter(([k]) => k.startsWith(`${key}|`) && !k.endsWith(`|${style}`)).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (confused.length) validation.push(['reconhecimento', `${style} ${meter}`, 'confundido sobretudo com', confused.map(([k, n]) => `${k.split('|')[2]} (${Math.round(n)})`).join('; ')]);
  log(`${style} ${meter}: ${r.n} melodies, own style best in ${(100 * r.top / r.n).toFixed(0)} % (${r.candidates} styles), own ${(r.own / r.n).toFixed(2)} vs others ${(r.others / r.n).toFixed(2)}`);
}
writeCsv('validacao', ['teste', 'grupo', 'medida', 'valor'], validation);
