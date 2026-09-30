// What the genetic algorithm learns from real music, BY METER, written as plain tables that can
// be audited and changed. From data/corpus-meters.json (tools/extract_meter_corpus.py):
//   results/meters/*.csv       one row per fact: figures, transitions, the two-step tree,
//                              contours, entries, associations, the model comparison...
//   results/meters/README.md   what every file and column means
//   results/meters.md          the report (what was found, what the algorithm now uses)
//   src/data/blocks-data.js    the model the app uses, built from the same counts
// then `python3 tools/export_xlsx.py` gathers the CSV files in results/meters/analise-compassos.xlsx.
//
//   node tools/build_meters.mjs              (a few minutes: cross-validation of every model)
//
// Every melody is read beat by beat (src/ga/figures.js). The models are compared by 5-fold
// cross-validation by melody (fold = id mod 5): counts from four fifths of the melodies, bits
// per beat (-log2 P) on the fifth left out; the lower, the better the model predicts music it
// has not seen.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { METERS } from '../src/core/meter.js';
import { lineToBeats, compactToLine, figureName, figureWords, figureSyllables, contourWords, dir3, DIR_NAMES } from '../src/ga/figures.js';
import { createCounts, addCount, probOf, countsToJSON } from '../src/ga/context.js';
import { beatContext, createBlockModel, MAX_ORDER } from '../src/ga/blocks.js';
import { createAttractorFitness } from '../src/fitness/attractor.js';
import { resolvePreset } from '../src/fitness/presets.js';
import { fromEvents, compactToEvents } from '../src/core/score.js';

const here = new URL('.', import.meta.url).pathname;
const OUT = `${here}../results/meters`;
mkdirSync(OUT, { recursive: true });
const corpusFile = JSON.parse(readFileSync(`${here}../data/corpus-meters.json`, 'utf8'));
const mod = (a, n) => ((a % n) + n) % n;
const inc = (m, k, n = 1) => m.set(k, (m.get(k) || 0) + n);
const log = (...a) => console.error(...a);
const f4 = (x) => (Number.isFinite(x) ? +x.toFixed(4) : '');

// 2/2 (reels) is written on the 16th grid exactly like 4/4, with the same quarter-note figures
const GROUP = { '2/2': '4/4' };
const ORDER = ['2/4', '3/4', '4/4', '3/8', '6/8', '9/8', '12/8'];
const FAMILY = (id) => (METERS[id].compound ? 'composto' : 'simples');
const MIN_CV = 100; // meters with fewer melodies borrow a model (12/8 reads as two bars of 6/8)
const BORROW = { '12/8': '6/8' };

// ------------------------------------------------------------------ corpus, beat by beat

const items = [];
for (const m of corpusFile.melodies) {
  const orig = `${m.num}/${m.den}`;
  const id = GROUP[orig] ?? orig;
  if (!METERS[id]) continue;
  const line = compactToLine(m.events);
  const beats = lineToBeats(line.pitch, line.onset, { meter: id, pickup: m.pickup, key: { tonic: m.tonic, mode: m.mode } });
  if (beats.length < 8) continue;
  items.push({ m, id, orig, beats, fold: m.id % 5 });
}
const byMeter = Object.fromEntries(ORDER.map((id) => [id, items.filter((x) => x.id === id)]));
for (const id of ORDER) log(`${id}: ${byMeter[id].length} melodies, ${byMeter[id].reduce((a, x) => a + x.beats.length, 0)} beats`);

// ------------------------------------------------------------------ CSV

const csvCell = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const tables = {};
function writeCsv(name, header, rows) {
  tables[name] = { header, rows: rows.length };
  const body = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  writeFileSync(`${OUT}/${name}.csv`, `﻿${body}\r\n`);
  log(`  ${name}.csv: ${rows.length} rows`);
}

// ------------------------------------------------------------------ cross-validation of the models

const identity = (c) => c;
const featsOf = (beats, i) => beatContext(beats, i, identity);
const TARGETS = {
  rhythm: (b) => b.cell,
  entry: (b) => b.entry,
  contour: (b) => (b.dpos.length >= 2 ? b.contour : null),
};

/** Bits per event of a context chain, 5-fold by melody. */
function crossValidate(list, levels, beta, target) {
  let bits = 0;
  let n = 0;
  const folds = [];
  for (let fold = 0; fold < 5; fold++) {
    const cm = createCounts(levels);
    const vocab = new Set();
    for (const it of list) if (it.fold !== fold) it.beats.forEach((b, i) => {
      const y = target(b);
      if (y === null) return;
      vocab.add(y);
      addCount(cm, featsOf(it.beats, i), y);
    });
    let fb = 0;
    let fn = 0;
    for (const it of list) if (it.fold === fold) it.beats.forEach((b, i) => {
      let y = target(b);
      if (y === null) return;
      if (!vocab.has(y)) y = '<nova>';
      fb -= Math.log2(probOf(cm, featsOf(it.beats, i), y, vocab.size, beta));
      fn++;
    });
    bits += fb;
    n += fn;
    folds.push(fb / fn);
  }
  const mean = bits / n;
  return { bits: mean, sd: Math.sqrt(folds.reduce((a, x) => a + (x - mean) ** 2, 0) / (folds.length - 1)), n };
}

const figChain = (order, extra = []) => {
  const out = [];
  for (let o = order; o >= 1; o--) out.push([...Array.from({ length: o }, (_, j) => `f${o - j}`), ...extra, 'pos']);
  return out;
};
// candidate models: name, description, levels (most specific first), smoothing values tried
const CANDIDATES = {
  rhythm: [
    { name: 'R0', what: 'só o tempo do compasso', levels: [['pos']], betas: [0] },
    ...Array.from({ length: MAX_ORDER }, (_, k) => ({
      name: `R${k + 1}`,
      what: k === 0 ? 'figura anterior (1.ª ordem)' : k === 1 ? 'duas figuras anteriores (árvore de 2 passos)' : `${k + 1} figuras anteriores`,
      levels: [...figChain(k + 1), ['pos']],
      betas: [0, 16, 64, 128],
    })),
    { name: 'R1+dir3', what: 'figura anterior + direção da última nota (sobe/desce/repete)', levels: [['f1', 'd3', 'pos'], ...figChain(1), ['pos']], betas: [0, 64] },
    { name: 'R1+dir5', what: 'figura anterior + direção (grau/salto)', levels: [['f1', 'd5', 'pos'], ...figChain(1), ['pos']], betas: [0, 64] },
    { name: 'R2+dir3', what: 'duas figuras + direção (sobe/desce/repete)', levels: [['f2', 'f1', 'd3', 'pos'], ...figChain(2), ['pos']], betas: [0, 64] },
    { name: 'R2+dir5', what: 'duas figuras + direção (grau/salto)', levels: [['f2', 'f1', 'd5', 'pos'], ...figChain(2), ['pos']], betas: [0, 64] },
    { name: 'R4+dir5', what: 'quatro figuras + direção (grau/salto)', levels: [['f4', 'f3', 'f2', 'f1', 'd5', 'pos'], ...figChain(4), ['pos']], betas: [0, 64] },
    { name: `R${MAX_ORDER}+dir5`, what: `${MAX_ORDER} figuras + direção (grau/salto)`, levels: [[...Array.from({ length: MAX_ORDER }, (_, j) => `f${MAX_ORDER - j}`), 'd5', 'pos'], ...figChain(MAX_ORDER), ['pos']], betas: [64] },
  ],
  entry: [
    { name: 'E0', what: 'só o tempo do compasso', levels: [['pos']], betas: [0] },
    { name: 'E1', what: 'grau da última nota (algoritmo anterior)', levels: [['deg', 'pos'], ['pos']], betas: [0, 4, 16] },
    { name: 'E1+dir3', what: 'grau + direção do último intervalo (sobe/desce/repete)', levels: [['deg', 'd3', 'pos'], ['deg', 'pos'], ['pos']], betas: [0, 4, 16, 64] },
    { name: 'E1+dir5', what: 'grau + direção (grau/salto)', levels: [['deg', 'd5', 'pos'], ['deg', 'pos'], ['pos']], betas: [0, 4, 16, 64] },
    { name: 'E1+dir5+fig', what: 'grau + direção (grau/salto) + figura do tempo', levels: [['deg', 'd5', 'fig', 'pos'], ['deg', 'd5', 'pos'], ['deg', 'pos'], ['pos']], betas: [0, 4, 16, 64] },
  ],
  contour: [
    { name: 'C0', what: 'só a figura', levels: [['fig']], betas: [0, 4] },
    { name: 'C1', what: 'figura + direção da entrada', levels: [['fig', 'ed'], ['fig']], betas: [0, 4, 16, 64] },
    { name: 'C1+pos', what: 'figura + direção da entrada + tempo do compasso', levels: [['fig', 'ed', 'pos'], ['fig', 'ed'], ['fig']], betas: [0, 4, 16, 64] },
  ],
};

const study = {};
const selected = {};
for (const id of ORDER) {
  const list = byMeter[id];
  if (list.length < MIN_CV) continue;
  study[id] = {};
  selected[id] = {};
  for (const [part, cands] of Object.entries(CANDIDATES)) {
    study[id][part] = [];
    for (const c of cands) {
      let best = null;
      for (const beta of c.betas) {
        const r = crossValidate(list, c.levels, beta, TARGETS[part]);
        if (!best || r.bits < best.bits) best = { ...r, beta };
      }
      study[id][part].push({ name: c.name, what: c.what, levels: c.levels, ...best });
    }
    // the chosen model: the simplest one (the candidates are listed from simple to rich) within
    // 0.01 bits of the best: a richer context has to earn its place
    const all = study[id][part];
    const best = all.reduce((a, b) => (b.bits < a.bits ? b : a));
    const pick = all.find((r) => r.bits <= best.bits + 0.01);
    selected[id][part] = pick;
    log(`${id} ${part}: ${study[id][part].map((r) => `${r.name} ${r.bits.toFixed(3)}(b${r.beta})`).join('  ')}  -> ${pick.name}`);
  }
}

// meter-blind reading (the program before: every beat 4 sixteenths, meters of the same bar length
// pooled) against the meter-aware models, in bits per bar of rhythm
const blindItems = items.map((it) => {
  const line = compactToLine(it.m.events);
  const blind = { id: 'blind', barLen: it.m.barLen, beat: 4, beats: it.m.barLen / 4, compound: false };
  const beats = lineToBeats(line.pitch, line.onset, { meter: blind, pickup: it.m.pickup, key: { tonic: it.m.tonic, mode: it.m.mode } });
  return { ...it, beats: beats.map((b) => ({ ...b, pos: `${it.m.barLen}:${b.cls}` })) };
});
function perBar(list, levels, beta, pooled) {
  const res = {};
  for (let fold = 0; fold < 5; fold++) {
    const groups = pooled ? { all: list } : Object.groupBy(list, (x) => x.id);
    for (const g of Object.values(groups)) {
      const cm = createCounts(levels);
      const vocab = new Set();
      for (const it of g) if (it.fold !== fold) it.beats.forEach((b, i) => {
        vocab.add(b.cell);
        addCount(cm, featsOf(it.beats, i), b.cell);
      });
      for (const it of g) if (it.fold === fold) it.beats.forEach((b, i) => {
        const y = vocab.has(b.cell) ? b.cell : '<nova>';
        const r = (res[it.id] ||= { bits: 0, steps: 0 });
        r.bits -= Math.log2(probOf(cm, featsOf(it.beats, i), y, vocab.size, beta));
        r.steps += b.cell.length;
      });
    }
  }
  return res;
}
const cvIds = Object.keys(study);
const cvItems = items.filter((x) => cvIds.includes(x.id));
const blindCv = blindItems.filter((x) => cvIds.includes(x.id));
const segmentation = {
  blind1: perBar(blindCv, [...figChain(1), ['pos']], 0, true),
  blind2: perBar(blindCv, [...figChain(2), ['pos']], 64, true),
  aware1: perBar(cvItems, [...figChain(1), ['pos']], 0, false),
  aware2: perBar(cvItems, [...figChain(2), ['pos']], 64, false),
};
const awareBest = {};
for (const id of cvIds) {
  const s = selected[id].rhythm;
  awareBest[id] = perBar(byMeter[id], s.levels, s.beta, false)[id];
}

// ------------------------------------------------------------------ the model of each meter (as the app uses it)

const ENTRY_VALUES = Array.from({ length: 19 }, (_, k) => k - 9);
// the app carries the tables in the page: contexts of up to one bar of 4/4 (4 figures), and the
// rows seen fewer times than this left out (except the two most general levels). The cost of both
// cuts, in bits, is in modelo_da_app.csv next to the best model of the study.
const APP_MAX_ORDER = 4;
const MIN_ROW = { rhythm: 16, entry: 32, contour: 32 };
const orderOf = (name) => Number((name.match(/^R(\d+)/) ?? [0, 0])[1]);
function appChoice(id) {
  const sel = selected[id];
  if (orderOf(sel.rhythm.name) <= APP_MAX_ORDER) return sel;
  const rows = study[id].rhythm.filter((r) => orderOf(r.name) <= APP_MAX_ORDER && orderOf(r.name) > 0);
  const best = rows.reduce((a, b) => (b.bits < a.bits ? b : a));
  return { ...sel, rhythm: rows.find((r) => r.bits <= best.bits + 0.01) };
}

function trainMeterData(list, sel, meter) {
  const figCount = new Map();
  const conCount = new Map();
  for (const it of list) for (const b of it.beats) {
    inc(figCount, b.cell);
    if (b.dpos.length >= 2) inc(conCount, b.contour);
  }
  const figs = [...figCount].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([c]) => c);
  const figIdx = new Map(figs.map((c, i) => [c, i]));
  const figIndex = (c) => figIdx.get(c) ?? -2;
  const contours = [...conCount].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([c]) => c);
  const conIdx = new Map(contours.map((c, i) => [c, i]));
  const R = createCounts(sel.rhythm.levels);
  const E = createCounts(sel.entry.levels);
  const C = createCounts(sel.contour.levels);
  const firstDeg = {};
  const sets = [];
  for (const it of list) {
    const first = it.beats.find((b) => b.dpos.length);
    if (first) firstDeg[mod(first.dpos[0], 7)] = (firstDeg[mod(first.dpos[0], 7)] || 0) + 1;
    const set = new Set();
    it.beats.forEach((b, i) => {
      const f = beatContext(it.beats, i, figIndex);
      addCount(R, f, f.fig);
      if (b.entry !== null) addCount(E, f, b.entry + 9);
      if (b.dpos.length >= 2) addCount(C, f, conIdx.get(b.contour));
      set.add(f.fig);
    });
    sets.push(set);
  }
  return {
    meter: meter.id,
    beats: meter.beats,
    melodies: list.length,
    figs,
    rhythm: { ...countsToJSON(R, MIN_ROW.rhythm), beta: sel.rhythm.beta, model: sel.rhythm.name },
    entry: { ...countsToJSON(E, MIN_ROW.entry), beta: sel.entry.beta, model: sel.entry.name, values: ENTRY_VALUES },
    contour: { ...countsToJSON(C, MIN_ROW.contour), beta: sel.contour.beta, model: sel.contour.name, values: contours },
    firstDeg,
    assoc: associations(sets, figs.length).kept,
    stats: { logp: { p10: -3, p50: -2, p90: -1 }, coherence: { p10: 0, p50: 0.1, p90: 0.2 } },
  };
}

/** Pairs of figures in the same melody: P(B | A) and lift = P(B | A) / P(B). */
function associations(sets, V) {
  const N = sets.length;
  const has = new Map();
  const pair = new Map();
  for (const s of sets) {
    const arr = [...s].filter((x) => x >= 0 && x < V);
    for (const a of arr) inc(has, a);
    for (const a of arr) for (const b of arr) if (a !== b) inc(pair, `${a}\t${b}`);
  }
  const rules = [];
  for (const [k, nab] of pair) {
    const [a, b] = k.split('\t').map(Number);
    const na = has.get(a);
    const nb = has.get(b);
    rules.push({ a, b, nab, na, nb, conf: nab / na, lift: nab / na / (nb / N) });
  }
  const kept = {};
  const byA = Object.groupBy(rules, (r) => r.a);
  for (const [a, list] of Object.entries(byA)) {
    const pos = list.filter((r) => r.nab >= 12 && r.lift >= 1.4).sort((x, y) => y.lift * Math.log(y.nab) - x.lift * Math.log(x.nab)).slice(0, 8);
    const neg = list.filter((r) => (r.na * r.nb) / N >= 12 && r.lift <= 0.6).sort((x, y) => x.lift - y.lift).slice(0, 4);
    if (pos.length + neg.length) kept[a] = [...pos, ...neg].map((r) => [r.b, +r.lift.toFixed(2)]);
  }
  return { rules, kept, has, N };
}

// out-of-fold scores of real melodies: they set what "as idiomatic as a real melody" means, and
// they are the bits per beat of the very model the app runs (pruned tables included)
const q = (arr, p) => arr.slice().sort((a, b) => a - b)[Math.floor(p * (arr.length - 1))];
const appModel = {};
const data = { source: 'data/corpus-meters.json', meters: {}, borrow: BORROW };
const appSel = Object.fromEntries(cvIds.map((id) => [id, appChoice(id)]));
for (const id of cvIds) {
  const meter = METERS[id];
  const list = byMeter[id];
  const lps = [];
  const cohs = [];
  const bits = { rhythm: 0, entry: 0, contour: 0, beats: 0, entries: 0, contours: 0 };
  for (let fold = 0; fold < 5; fold++) {
    const d = trainMeterData(list.filter((x) => x.fold !== fold), appSel[id], meter);
    const M = createBlockModel({ meters: { [id]: d } }).forMeter(id);
    for (const it of list) if (it.fold === fold) {
      const s = M.score(it.beats);
      lps.push(s.logp);
      cohs.push(s.coherence);
      it.beats.forEach((b, i) => {
        const f = M.ctxOf(it.beats, i);
        bits.rhythm -= Math.log2(M.pFigure(f, f.fig));
        bits.beats++;
        if (b.entry !== null) {
          bits.entry -= Math.log2(M.pEntry(f, b.entry));
          bits.entries++;
        }
        if (b.dpos.length >= 2) {
          bits.contour -= Math.log2(M.pContour(f, b.contour));
          bits.contours++;
        }
      });
    }
  }
  appModel[id] = { rhythm: bits.rhythm / bits.beats, entry: bits.entry / bits.entries, contour: bits.contour / bits.contours };
  const d = trainMeterData(list, appSel[id], meter);
  d.stats = {
    logp: { p10: +q(lps, 0.1).toFixed(4), p50: +q(lps, 0.5).toFixed(4), p90: +q(lps, 0.9).toFixed(4) },
    coherence: { p10: +q(cohs, 0.1).toFixed(4), p50: +q(cohs, 0.5).toFixed(4), p90: +q(cohs, 0.9).toFixed(4) },
  };
  data.meters[id] = d;
  log(`${id}: app model ${JSON.stringify(appModel[id])}, ${(JSON.stringify(d).length / 1024).toFixed(0)} KB`);
}

// "do not maximise": the typical (P75) value of each fitness rule in real melodies of each meter
const RULES = ['key', 'proximity', 'regression', 'forces', 'metric', 'cadence', 'tension', 'variety'];
data.caps = {};
data.ruleStats = {};
for (const id of ORDER) {
  const meter = METERS[id];
  const vals = Object.fromEntries(RULES.map((r) => [r, []]));
  const fits = new Map();
  let scored = 0;
  for (const it of byMeter[id]) {
    const m = it.m;
    let ev = compactToEvents(m.events).map((e) => ({ ...e, start: e.start - (m.pickup || 0) })).filter((e) => e.start >= 0);
    const end = ev.length ? Math.max(...ev.map((e) => e.start + e.dur)) : 0;
    const bars = Math.min(32, Math.floor(end / meter.barLen));
    if (bars < 4) continue;
    const genes = fromEvents(ev, bars * meter.barLen);
    const k = `${bars}|${m.tonic}|${m.mode}`;
    if (!fits.has(k)) fits.set(k, createAttractorFitness({ bars, meter: id, tonic: m.tonic, mode: m.mode, waves: resolvePreset('arch', m.tonic), seed: 1, voices: [{ instrument: 'piano' }], form: 'none' }));
    const res = fits.get(k).evaluate(genes);
    for (const r of RULES) if (Number.isFinite(res.parts[r])) vals[r].push(res.parts[r]);
    if (++scored >= 1200) break;
  }
  if (scored < 30) continue;
  data.caps[id] = Object.fromEntries(RULES.map((r) => [r, +q(vals[r], 0.75).toFixed(3)]));
  data.ruleStats[id] = Object.fromEntries(RULES.map((r) => [r, { p25: +q(vals[r], 0.25).toFixed(3), p50: +q(vals[r], 0.5).toFixed(3), p75: +q(vals[r], 0.75).toFixed(3), n: vals[r].length }]));
}

writeFileSync(`${here}../src/data/blocks-data.js`, `// generated by tools/build_meters.mjs from data/corpus-meters.json (tables: results/meters/*.csv)\nexport default ${JSON.stringify(data)};\n`);
log(`blocks-data.js: ${(JSON.stringify(data).length / 1024).toFixed(0)} KB`);

// ------------------------------------------------------------------ tables for auditing

log('tables:');
const pct = (x) => f4(x);
const SOURCES = { essen: 'Essen Folksong Collection', oneills: "O'Neill's Music of Ireland (1850)", ryans: "Ryan's Mammoth Collection (1883)", airds: "Aird's Airs", 'bach-chorale': 'J. S. Bach, corais (soprano)' };

// corpus
writeCsv('corpus', ['id', 'fonte', 'titulo', 'compasso_original', 'compasso', 'familia', 'anacrusa_16', 'compassos', 'tempos', 'notas', 'tonica_pc', 'modo', 'dobra_cv'],
  items.map((it) => [it.m.id, SOURCES[it.m.source] ?? it.m.source, it.m.title, it.orig, it.id, FAMILY(it.id), it.m.pickup, +(it.m.events.reduce((a, [, d]) => a + d, 0) / METERS[it.id].barLen).toFixed(2), it.beats.length, it.m.events.filter(([p]) => p >= 0).length, it.m.tonic, it.m.mode === 'major' ? 'maior' : 'menor', it.fold]));
const rej = [];
for (const [meter, reasons] of Object.entries(corpusFile.rejected)) for (const [why, n] of Object.entries(reasons)) rej.push([meter, why, n]);
rej.sort((a, b) => b[2] - a[2]);
writeCsv('corpus_excluidas', ['compasso', 'motivo', 'melodias'], rej);

// figures
const figStats = {};
for (const id of ORDER) {
  const cnt = new Map();
  const mel = new Map();
  const byPos = new Map();
  let total = 0;
  for (const it of byMeter[id]) {
    const seen = new Set();
    for (const b of it.beats) {
      inc(cnt, b.cell);
      inc(byPos, `${b.pos}\t${b.cell}`);
      seen.add(b.cell);
      total++;
    }
    for (const c of seen) inc(mel, c);
  }
  figStats[id] = { cnt, mel, byPos, total, N: byMeter[id].length };
}

// figures of the rhythm textbooks (compiled from the sources in results/meters.md)
const LITERATURE = [
  ['simples', 'x___', 'uma semínima no tempo'],
  ['simples', 'x_x_', 'duas colcheias: a divisão do tempo em dois'],
  ['simples', 'xxxx', 'quatro semicolcheias: a subdivisão em quatro'],
  ['simples', 'x_xx', 'colcheia e duas semicolcheias'],
  ['simples', 'xxx_', 'duas semicolcheias e colcheia'],
  ['simples', 'x__x', 'colcheia pontuada e semicolcheia (ritmo pontuado)'],
  ['simples', 'xx__', 'semicolcheia e colcheia pontuada («scotch snap»)'],
  ['simples', 'xx_x', 'semicolcheia, colcheia, semicolcheia (síncopa dentro do tempo)'],
  ['simples', '..x_', 'pausa de colcheia e colcheia (contratempo)'],
  ['simples', '____', 'continuação de uma nota longa (mínima, semibreve)'],
  ['composto', 'x_____', 'uma semínima pontuada no tempo'],
  ['composto', 'x_x_x_', 'três colcheias: a divisão do tempo em três'],
  ['composto', 'x___x_', 'semínima e colcheia (longa-breve)'],
  ['composto', 'x_x___', 'colcheia e semínima (breve-longa)'],
  ['composto', 'x__xx_', 'colcheia pontuada, semicolcheia e colcheia (ritmo de siciliana)'],
  ['composto', 'xxx_x_', 'duas semicolcheias e duas colcheias'],
  ['composto', 'x_xxx_', 'colcheia, duas semicolcheias e colcheia'],
  ['composto', 'x_x_xx', 'duas colcheias e duas semicolcheias'],
  ['composto', 'xxxxxx', 'seis semicolcheias: a subdivisão em seis'],
  ['composto', 'x__x__', 'duas colcheias pontuadas (duína, emprestada do compasso simples)'],
  ['composto', '..x_x_', 'pausa de colcheia e duas colcheias'],
  ['composto', '______', 'continuação de uma nota longa'],
];
const litSet = new Set(LITERATURE.map((l) => l[1]));
const rankOf = (id, cell) => [...figStats[id].cnt].sort((a, b) => b[1] - a[1]).findIndex(([c]) => c === cell) + 1;

const figRows = [];
for (const id of ORDER) {
  const st = figStats[id];
  [...st.cnt].sort((a, b) => b[1] - a[1]).forEach(([cell, c], k) => {
    figRows.push([id, FAMILY(id), k + 1, `${cell}`, figureName(cell), figureWords(cell), figureSyllables(cell), c, pct(c / st.total), st.mel.get(cell), pct(st.mel.get(cell) / st.N), litSet.has(cell) ? 'sim' : 'não']);
  });
}
writeCsv('figuras', ['compasso', 'familia', 'posicao_no_ranking', 'figura_codigo', 'figura', 'figura_por_extenso', 'silabas_takadimi', 'tempos', 'fracao_dos_tempos', 'melodias', 'fracao_das_melodias', 'nas_listas_de_manual'], figRows);

const posRows = [];
for (const id of ORDER) {
  const st = figStats[id];
  const perPos = new Map();
  for (const [k, c] of st.byPos) inc(perPos, Number(k.split('\t')[0]), c);
  const list = [...st.byPos].map(([k, c]) => { const [pos, cell] = k.split('\t'); return [Number(pos), cell, c]; }).sort((a, b) => a[0] - b[0] || b[2] - a[2]);
  for (const [pos, cell, c] of list) posRows.push([id, pos + 1, `${cell}`, figureName(cell), figureSyllables(cell), c, pct(c / perPos.get(pos))]);
}
writeCsv('figuras_por_tempo', ['compasso', 'tempo_do_compasso', 'figura_codigo', 'figura', 'silabas_takadimi', 'ocorrencias', 'P_figura_dado_tempo'], posRows);

const litRows = LITERATURE.map(([fam, cell, what]) => {
  const ids = ORDER.filter((id) => FAMILY(id) === fam && figStats[id].total);
  return [fam, `${cell}`, figureName(cell), what, figureSyllables(cell), ...ids.flatMap((id) => [pct((figStats[id].cnt.get(cell) ?? 0) / figStats[id].total), rankOf(id, cell) || ''])];
});
writeCsv('literatura_simples', ['familia', 'figura_codigo', 'figura', 'descricao', 'silabas_takadimi', 'fracao_2/4', 'ranking_2/4', 'fracao_3/4', 'ranking_3/4', 'fracao_4/4', 'ranking_4/4'], litRows.filter((r) => r[0] === 'simples'));
writeCsv('literatura_composto', ['familia', 'figura_codigo', 'figura', 'descricao', 'silabas_takadimi', 'fracao_3/8', 'ranking_3/8', 'fracao_6/8', 'ranking_6/8', 'fracao_9/8', 'ranking_9/8', 'fracao_12/8', 'ranking_12/8'], litRows.filter((r) => r[0] === 'composto'));

// first-order transitions, with and without the direction of the last note (the simple rule)
const transRows = [];
const treeRows = [];
for (const id of ORDER) {
  const list = byMeter[id];
  const ctxDir = new Map(); // pos|f0|d3 -> Map(next -> n)
  const ctx = new Map(); // pos|f0 -> Map(next -> n)
  const uni = new Map(); // pos -> Map(next -> n)
  const tree = new Map(); // pos|f0|d3 -> Map(next1\tnext2 -> n)
  const plain1 = new Map(); // pos|f -> Map(next -> n) for the chained first-order estimate
  for (const it of list) {
    const B = it.beats;
    for (let i = 1; i < B.length; i++) {
      const f0 = B[i - 1].cell;
      const y = B[i].cell;
      const d = dir3(B[i].dirIn);
      const kd = `${B[i].pos}\t${f0}\t${d}`;
      const k = `${B[i].pos}\t${f0}`;
      if (!ctxDir.has(kd)) ctxDir.set(kd, new Map());
      inc(ctxDir.get(kd), y);
      if (!ctx.has(k)) ctx.set(k, new Map());
      inc(ctx.get(k), y);
      if (!uni.has(B[i].pos)) uni.set(B[i].pos, new Map());
      inc(uni.get(B[i].pos), y);
      if (i + 1 < B.length) {
        if (!tree.has(kd)) tree.set(kd, new Map());
        inc(tree.get(kd), `${y}\t${B[i + 1].cell}`);
      }
    }
  }
  for (const [k, m] of ctx) plain1.set(k, m);
  const tot = (m) => [...m.values()].reduce((a, b) => a + b, 0);
  for (const [kd, m] of ctxDir) {
    const n = tot(m);
    if (n < 10) continue;
    const [pos, f0, d] = kd.split('\t');
    const base = ctx.get(`${pos}\t${f0}`);
    const nb = tot(base);
    const u = uni.get(Number(pos));
    const nu = tot(u);
    for (const [y, c] of [...m].sort((a, b) => b[1] - a[1])) {
      if (c < 2) continue;
      const pNo = (base.get(y) ?? 0) / nb;
      const pU = (u.get(y) ?? 0) / nu;
      transRows.push([id, Number(pos) + 1, `${f0}`, figureName(f0), d, DIR_NAMES[d], `${y}`, figureName(y), c, n, pct(c / n), pct(pNo), pct(c / n - pNo), pct(pU ? c / n / pU : NaN)]);
    }
  }
  // the two-step tree: after (figure, direction), the most likely pairs of next figures
  const beatsPerBar = METERS[id].beats;
  for (const [kd, m] of tree) {
    const n = tot(m);
    if (n < 30) continue;
    const [pos, f0, d] = kd.split('\t');
    const first = new Map();
    for (const [pairKey, c] of m) inc(first, pairKey.split('\t')[0], c);
    const top = [...m].sort((a, b) => b[1] - a[1]).slice(0, 10);
    top.forEach(([pairKey, c], rank) => {
      const [y1, y2] = pairKey.split('\t');
      const p1 = first.get(y1) / n;
      const p2 = c / first.get(y1);
      // the same pair predicted step by step by a first-order chain (no memory of f0 at the 2nd step)
      const a = plain1.get(`${pos}\t${f0}`);
      const b = plain1.get(`${(Number(pos) + 1) % beatsPerBar}\t${y1}`);
      const chained = a && b ? ((a.get(y1) ?? 0) / tot(a)) * ((b.get(y2) ?? 0) / tot(b)) : NaN;
      treeRows.push([id, Number(pos) + 1, `${f0}`, figureName(f0), d, DIR_NAMES[d], n, rank + 1, `${y1}`, figureName(y1), pct(p1), `${y2}`, figureName(y2), pct(p2), c, pct(c / n), pct(chained), pct(c / n / chained)]);
    });
  }
}
writeCsv('transicoes_1_passo', ['compasso', 'tempo_seguinte', 'figura_atual_codigo', 'figura_atual', 'direcao', 'direcao_por_extenso', 'figura_seguinte_codigo', 'figura_seguinte', 'ocorrencias', 'ocorrencias_do_contexto', 'P_seguinte_dado_figura_e_direcao', 'P_seguinte_dado_figura_sem_direcao', 'efeito_da_direcao', 'lift_face_ao_tempo'], transRows);
writeCsv('arvore_2_passos', ['compasso', 'tempo_seguinte', 'figura_atual_codigo', 'figura_atual', 'direcao', 'direcao_por_extenso', 'ocorrencias_do_contexto', 'ordem', 'passo1_codigo', 'passo1', 'P_passo1', 'passo2_codigo', 'passo2', 'P_passo2_dado_passo1', 'ocorrencias_do_par', 'P_par_arvore', 'P_par_cadeia_1a_ordem', 'razao_arvore_sobre_cadeia'], treeRows);

// entries and contours
const entryRows = [];
const contourRows = [];
const DEG = ['1', '2', '3', '4', '5', '6', '7'];
for (const id of ORDER) {
  const E = new Map();
  const C = new Map();
  for (const it of byMeter[id]) for (const b of it.beats) {
    if (b.entry !== null && b.prevDeg >= 0) {
      const k = `${b.pos}\t${b.prevDeg}\t${b.dirIn}`;
      if (!E.has(k)) E.set(k, new Map());
      inc(E.get(k), b.entry);
    }
    if (b.dpos.length >= 2) {
      const k = `${b.cell}\t${b.entryDir}`;
      if (!C.has(k)) C.set(k, new Map());
      inc(C.get(k), b.contour);
    }
  }
  for (const [k, m] of E) {
    const n = [...m.values()].reduce((a, b) => a + b, 0);
    if (n < 20) continue;
    const [pos, deg, d] = k.split('\t');
    for (const [iv, c] of [...m].sort((a, b) => b[1] - a[1])) if (c >= 2) entryRows.push([id, Number(pos) + 1, DEG[deg], d, DIR_NAMES[d], iv, iv === 0 ? 'repete' : `${iv > 0 ? 'sobe' : 'desce'} ${Math.abs(iv)}`, c, n, pct(c / n)]);
  }
  for (const [k, m] of C) {
    const n = [...m.values()].reduce((a, b) => a + b, 0);
    if (n < 10) continue;
    const [cell, d] = k.split('\t');
    for (const [con, c] of [...m].sort((a, b) => b[1] - a[1])) if (c >= 2) contourRows.push([id, `${cell}`, figureName(cell), d, DIR_NAMES[d], `${con}`, contourWords(con), c, n, pct(c / n)]);
  }
}
writeCsv('entradas', ['compasso', 'tempo', 'grau_da_ultima_nota', 'direcao_anterior', 'direcao_anterior_por_extenso', 'intervalo_de_entrada_graus', 'intervalo_por_extenso', 'ocorrencias', 'ocorrencias_do_contexto', 'P_intervalo_dado_contexto'], entryRows);
writeCsv('contornos', ['compasso', 'figura_codigo', 'figura', 'direcao_de_entrada', 'direcao_de_entrada_por_extenso', 'contorno_codigo', 'contorno', 'ocorrencias', 'ocorrencias_da_figura', 'P_contorno_dado_figura_e_entrada'], contourRows);

// associations between figures in the same melody
const assocRows = [];
for (const id of ORDER) {
  const st = figStats[id];
  const figs = [...st.cnt].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const idx = new Map(figs.map((c, i) => [c, i]));
  const sets = byMeter[id].map((it) => new Set(it.beats.map((b) => idx.get(b.cell))));
  const { rules, N } = associations(sets, figs.length);
  for (const r of rules) {
    const expected = (r.na * r.nb) / N;
    if (!((r.nab >= 20 && r.lift >= 1.5) || (expected >= 20 && r.lift <= 0.5))) continue;
    assocRows.push([id, `${figs[r.a]}`, figureName(figs[r.a]), `${figs[r.b]}`, figureName(figs[r.b]), r.na, r.nb, r.nab, N, pct(r.conf), pct(r.lift)]);
  }
}
assocRows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : b[10] - a[10]));
writeCsv('associacoes', ['compasso', 'figura_A_codigo', 'figura_A', 'figura_B_codigo', 'figura_B', 'melodias_com_A', 'melodias_com_B', 'melodias_com_ambas', 'melodias', 'P_B_dado_A', 'lift'], assocRows);

// the model comparison
const modelRows = [];
for (const id of cvIds) for (const [part, rows] of Object.entries(study[id])) {
  const refName = { rhythm: 'R1', entry: 'E1', contour: 'C0' }[part];
  const base = rows.find((r) => r.name === refName);
  for (const r of rows) modelRows.push([id, { rhythm: 'ritmo (figura seguinte)', entry: 'melodia (intervalo de entrada)', contour: 'melodia (contorno no tempo)' }[part], r.name, r.what, r.levels.map((l) => l.join('+')).join(' > '), r.beta, f4(r.bits), f4(r.sd), f4(2 ** r.bits), refName, f4(r.bits - base.bits), r.n, selected[id][part].name === r.name ? 'sim' : '', appSel[id][part].name === r.name ? 'sim' : '']);
}
writeCsv('modelos', ['compasso', 'o_que_se_preve', 'modelo', 'contexto', 'cadeia_de_contextos', 'beta', 'bits_por_evento', 'desvio_entre_dobras', 'perplexidade', 'modelo_de_referencia', 'diferenca_para_referencia', 'eventos_avaliados', 'melhor_na_validacao', 'usado_na_app'], modelRows);
const segRows = cvIds.map((id) => {
  const per = (r) => (r[id].bits / r[id].steps) * METERS[id].barLen;
  const best = (awareBest[id].bits / awareBest[id].steps) * METERS[id].barLen;
  return [id, f4(per(segmentation.blind1)), f4(per(segmentation.blind2)), f4(per(segmentation.aware1)), f4(per(segmentation.aware2)), f4(best), f4(2 ** (per(segmentation.blind2) - per(segmentation.aware2))), f4(2 ** (per(segmentation.blind1) - best))];
});
writeCsv('segmentacao', ['compasso', 'bits_por_compasso_sem_segmentar_1a_ordem', 'bits_por_compasso_sem_segmentar_2a_ordem', 'bits_por_compasso_por_compasso_1a_ordem', 'bits_por_compasso_por_compasso_2a_ordem', 'bits_por_compasso_modelo_escolhido', 'vezes_so_por_segmentar', 'vezes_segmentar_e_modelo_escolhido'], segRows);
writeCsv('modelo_da_app', ['compasso', 'ritmo', 'beta_ritmo', 'melodia_entrada', 'beta_entrada', 'melodia_contorno', 'beta_contorno', 'bits_ritmo_por_tempo', 'bits_ritmo_melhor_modelo', 'bits_ritmo_1a_ordem', 'bits_entrada', 'bits_entrada_melhor_modelo', 'bits_entrada_algoritmo_anterior', 'bits_contorno', 'bits_contorno_melhor_modelo', 'logp_P10', 'logp_P50', 'tamanho_KB'],
  cvIds.map((id) => {
    const a = appSel[id];
    const g = (part, name) => study[id][part].find((r) => r.name === name).bits;
    return [id, a.rhythm.name, a.rhythm.beta, a.entry.name, a.entry.beta, a.contour.name, a.contour.beta, f4(appModel[id].rhythm), f4(selected[id].rhythm.bits), f4(g('rhythm', 'R1')), f4(appModel[id].entry), f4(selected[id].entry.bits), f4(g('entry', 'E1')), f4(appModel[id].contour), f4(selected[id].contour.bits), data.meters[id].stats.logp.p10, data.meters[id].stats.logp.p50, +(JSON.stringify(data.meters[id]).length / 1024).toFixed(1)];
  }));

const brief = (sel) => Object.fromEntries(cvIds.map((id) => [id, Object.fromEntries(Object.entries(sel[id]).map(([k, v]) => [k, { name: v.name, beta: v.beta, bits: v.bits }]))]));
writeFileSync(`${OUT}/study.json`, JSON.stringify({ study, selected: brief(selected), app: brief(appSel), appModel, segmentation: segRows, tables }, null, 1));

// ------------------------------------------------------------------ the report
const topFigs = (id, k) => [...figStats[id].cnt].sort((a, b) => b[1] - a[1]).slice(0, k);
const get = (id, part, name) => study[id][part].find((r) => r.name === name);
const share = (id, cell) => (figStats[id].cnt.get(cell) ?? 0) / figStats[id].total;
const pc = (x, d = 1) => `${(100 * x).toFixed(d).replace('.', ',')} %`;
const nb = (x, d = 3) => x.toFixed(d).replace('.', ',');
const big = cvIds.filter((id) => byMeter[id].length >= 1000);
// how the next entry moves after each direction of the last interval (all contexts of the meter)
const afterDir = {};
for (const id of cvIds) {
  const o = {};
  for (const it of byMeter[id]) for (const b of it.beats) {
    if (b.entry === null || b.dirIn === '0') continue;
    const r = (o[b.dirIn] ||= { up: 0, down: 0, same: 0, n: 0 });
    const d = b.entryDir;
    if (d[0] === 's') r.up++;
    else if (d[0] === 'd') r.down++;
    else r.same++;
    r.n++;
  }
  afterDir[id] = o;
}
// the two-step tree: the pair whose probability departs most from a first-order chain
const strongTree = treeRows.filter((r) => r[14] >= 40 && Number.isFinite(r[17])).sort((a, b) => Math.abs(Math.log(b[17])) - Math.abs(Math.log(a[17])))[0];

let md = `# Figuras rítmicas e blocos melódicos por compasso

Gerado por \`node tools/build_meters.mjs\` a partir de \`data/corpus-meters.json\` (\`python3 tools/extract_meter_corpus.py\`). Todas as tabelas estão em \`results/meters/\`: um CSV por tabela e um só livro de Excel, \`analise-compassos.xlsx\` (\`python3 tools/export_xlsx.py\`), com fórmulas nas colunas derivadas e um comentário a explicar cada coluna; o dicionário das colunas está em \`results/meters/README.md\`. Correr os três comandos outra vez dá os mesmos números.

## 1. Porquê separar os compassos

Num compasso simples o tempo é uma semínima e divide-se em duas colcheias; num composto o tempo é uma semínima com ponto e divide-se em três. 3/4 e 6/8 têm o mesmo comprimento (12 semicolcheias), mas o primeiro tem três tempos de duas colcheias e o segundo dois tempos de três. O programa lia todas as melodias em tempos de semínima e juntava as de 2/4, 3/4 e 4/4 (as de 6/8 nem entravam). Lido compasso a compasso, o ritmo real fica muito mais previsível para o modelo — o que quer dizer que as figuras aprendidas são as certas para cada compasso:

| Compasso | como antes (1.ª ordem) | sem segmentar, 2.ª ordem | por compasso, 2.ª ordem | por compasso, modelo escolhido | x vezes mais provável só por segmentar | x vezes, segmentar e modelo escolhido |
|---|---|---|---|---|---|---|
${segRows.map((r) => `| ${r[0]} | ${nb(r[1], 2)} | ${nb(r[2], 2)} | ${nb(r[4], 2)} | ${nb(r[5], 2)} | ${nb(r[6], 2)} | ${nb(r[7], 2)} |`).join('\n')}

(Bits por compasso: -log2 da probabilidade que o modelo dá ao ritmo de um compasso de uma melodia que não viu, em validação cruzada de 5 dobras por melodia; 1 bit a menos = duas vezes mais provável.) Só por separar os compassos, com o mesmo modelo, o ritmo real de um compasso fica em média ${nb(segRows.find((r) => r[0] === '3/4')[6], 1)} vezes mais provável em 3/4 e ${nb(segRows.find((r) => r[0] === '6/8')[6], 1)} vezes em 6/8 — precisamente os dois compassos que o programa confundia (12 semicolcheias). Em 2/4 e 4/4 a separação quase não muda nada (já eram lidos em tempos de semínima); aí o ganho vem da memória mais longa (secção 5).

## 2. O corpus

| Compasso | Família | Melodias | Tempos | Fontes principais |
|---|---|---|---|---|
${ORDER.map((id) => {
    const src = Object.entries(Object.groupBy(byMeter[id], (x) => x.m.source)).sort((a, b) => b[1].length - a[1].length).slice(0, 3).map(([k, v]) => `${SOURCES[k] ?? k} ${v.length}`).join(', ');
    return `| ${id}${id === '4/4' ? ' (e 2/2)' : ''} | ${FAMILY(id)} | ${byMeter[id].length} | ${figStats[id].total} | ${src} |`;
  }).join('\n')}

Ficaram de fora as melodias que mudam de compasso e as que têm tercinas ou fusas, que a grelha de semicolcheias do programa não escreve (por exemplo ${corpusFile.rejected['2/2']?.['off the 16th grid (triplets, 32nds)'] ?? 0} reels e hornpipes em 2/2), e as 480 do crítico, que continua a ser um juiz independente (\`corpus_excluidas.csv\`). 12/8 tem só ${byMeter['12/8'].length} melodias: a app usa para ele o modelo de 6/8 (um compasso de 12/8 lê-se como dois de 6/8).

## 3. As figuras mais comuns de cada compasso

Uma figura é o ritmo de um tempo; as sílabas são as de Takadimi (Hoffman, Pelto & White 1996), uma por posição no tempo. As seis mais comuns (percentagem dos tempos):

${ORDER.filter((x) => byMeter[x].length >= 20).map((id) => `- **${id}**: ${topFigs(id, 6).map(([c, n]) => `${figureName(c)} *${figureSyllables(c)}* ${pc(n / figStats[id].total)}`).join(' · ')}`).join('\n')}

As figuras que os manuais de ritmo apresentam primeiro são também as que mais aparecem na música real, mas com pesos muito diferentes de compasso para compasso (\`literatura_simples.csv\`, \`literatura_composto.csv\`):

- em 6/8 as três colcheias (*ta ki da*) ocupam ${pc(share('6/8', 'x_x_x_'))} dos tempos e a semínima com colcheia (*ta da*) ${pc(share('6/8', 'x___x_'))}; o inverso, colcheia e semínima (*ta ki*), só ${pc(share('6/8', 'x_x___'), 2)}; o ritmo pontuado da siciliana (*ta di da*) ${pc(share('6/8', 'x__xx_'), 2)};
- em 3/4 a semínima (*ta*) domina (${pc(share('3/4', 'x___'))}), e o tempo ligado de uma mínima ou mínima com ponto (continuação) vale ${pc(share('3/4', '____'))};
- em 2/4 as colcheias (*ta di*) valem ${pc(share('2/4', 'x_x_'))} e as semicolcheias (*ta ka di mi*) ${pc(share('2/4', 'xxxx'))}; em 4/4 as colcheias valem ${pc(share('4/4', 'x_x_'))}.

## 4. A regra simples: a figura e a direção da última nota

A pergunta: «se esta figura acaba com a última nota a subir em relação à penúltima, a figura seguinte tem uma certa probabilidade; se desce, outra». Mediu-se quanto a direção da última nota (sobe/desce/repete, ou com grau/salto) melhora a previsão de duas coisas, em bits por evento (menos é melhor):

| Compasso | ritmo: figura anterior | + direção (sobe/desce/repete) | + direção (grau/salto) | melodia: grau da última nota | + direção (sobe/desce/repete) | + direção (grau/salto) |
|---|---|---|---|---|---|---|
${cvIds.map((id) => `| ${id} | ${nb(get(id, 'rhythm', 'R1').bits)} | ${nb(get(id, 'rhythm', 'R1+dir3').bits)} | ${nb(get(id, 'rhythm', 'R1+dir5').bits)} | ${nb(get(id, 'entry', 'E1').bits)} | ${nb(get(id, 'entry', 'E1+dir3').bits)} | ${nb(get(id, 'entry', 'E1+dir5').bits)} |`).join('\n')}

- **Para o ritmo, a direção quase não conta**: no máximo ${nb(Math.max(...cvIds.map((id) => get(id, 'rhythm', 'R1').bits - get(id, 'rhythm', 'R1+dir5').bits)), 3)} bits por tempo (nos compostos, nada). A figura seguinte depende das figuras anteriores e do lugar no compasso, não de a melodia estar a subir ou a descer.
- **Para a melodia, a direção conta muito**: com grau/salto, o intervalo seguinte fica ${nb(Math.min(...cvIds.map((id) => get(id, 'entry', 'E1').bits - get(id, 'entry', 'E1+dir5').bits)), 2)}–${nb(Math.max(...cvIds.map((id) => get(id, 'entry', 'E1').bits - get(id, 'entry', 'E1+dir5').bits)), 2)} bits mais previsível. É o que a teoria descreve como regresso depois de um salto (*gap-fill*; von Hippel & Huron 2000) e continuação do movimento por grau: em 4/4, depois de um salto a subir a nota seguinte desce em ${pc(afterDir['4/4'].ss.down / afterDir['4/4'].ss.n)} dos casos; depois de subir por grau, desce em ${pc(afterDir['4/4'].sg.down / afterDir['4/4'].sg.n)} e continua a subir em ${pc(afterDir['4/4'].sg.up / afterDir['4/4'].sg.n)}. Em 6/8: ${pc(afterDir['6/8'].ss.down / afterDir['6/8'].ss.n)} e ${pc(afterDir['6/8'].sg.up / afterDir['6/8'].sg.n)} (\`entradas.csv\`).

Por isso a regra ficou onde ajuda: a direção da última nota (com grau/salto) entra no modelo dos intervalos, não no do ritmo.

## 5. Um passo, uma árvore de dois passos, ou mais?

A árvore de dois passos («se esta figura, com esta direção, então estas duas figuras seguintes têm esta probabilidade, depois estas...») é um modelo de 2.ª ordem: a segunda figura depende das duas anteriores e não só da última. Comparou-se o contexto do ritmo com 0 a ${MAX_ORDER} figuras anteriores, sempre misturado com os contextos mais curtos (modelo de ordem variável):

| Compasso | só o tempo | 1 figura | 2 figuras (árvore de 2 passos) | 4 figuras | ${MAX_ORDER} figuras | melhor |
|---|---|---|---|---|---|---|
${cvIds.map((id) => `| ${id} | ${nb(get(id, 'rhythm', 'R0').bits)} | ${nb(get(id, 'rhythm', 'R1').bits)} | ${nb(get(id, 'rhythm', 'R2').bits)} | ${nb(get(id, 'rhythm', 'R4').bits)} | ${nb(get(id, 'rhythm', `R${MAX_ORDER}`).bits)} | ${selected[id].rhythm.name} (β = ${selected[id].rhythm.beta}) |`).join('\n')}

- Passar de uma para duas figuras (a árvore de dois passos) ajuda em todos os compassos com muitas melodias: ${big.map((id) => `${id} ${nb(get(id, 'rhythm', 'R1').bits - get(id, 'rhythm', 'R2').bits, 2)}`).join(', ')} bits por tempo.
- Continua a ajudar até cerca de um compasso inteiro de memória (3 figuras em 3/4, 4 em 4/4, 4 em 6/8), e ainda um pouco até dois compassos: as melodias reais repetem padrões rítmicos de compasso para compasso. Uma cadeia de 1.ª ordem não vê isso.
- Uma árvore mais funda só compensa com suavização: um contexto visto poucas vezes não pode decidir sozinho. Aqui cada contexto é misturado com os mais curtos na proporção das vezes que foi visto (Witten–Bell, o método de escape C do PPM) e com uma pseudo-contagem β escolhida por validação cruzada; sem β, as árvores fundas pioram nos compassos com poucas melodias (\`modelos.csv\`).
${strongTree ? `- Onde a árvore mais se afasta de uma cadeia de 1.ª ordem (\`arvore_2_passos.csv\`): em ${strongTree[0]}, depois de ${strongTree[3]} (${strongTree[5]}), o par ${strongTree[9]} → ${strongTree[12]} acontece ${pc(strongTree[15])} das vezes, e uma cadeia de 1.ª ordem daria ${pc(strongTree[16])} (${nb(strongTree[17], 1)} vezes).` : ''}

Conclusão: sim, vale a pena estender a relação em árvore, e mais do que dois passos, desde que cada nível seja misturado com os mais curtos. A direção da nota fica para a melodia (secção 4).

## 6. O que o algoritmo usa agora

Para cada compasso, a app guarda (\`src/data/blocks-data.js\`): a figura dada as figuras anteriores e o tempo do compasso; o intervalo de entrada dado o grau da última nota, a direção do último intervalo (com grau/salto), a figura e o tempo; o contorno dentro do tempo dado a figura e a direção de entrada; as associações entre figuras da mesma melodia; o primeiro grau. Para caber na página, o ritmo usa no máximo 4 figuras anteriores e deixa de fora os contextos vistos menos de ${MIN_ROW.rhythm} vezes; o custo destes cortes está na tabela (bits por evento em validação cruzada, com as tabelas tal como vão para o navegador):

| Compasso | ritmo (app) | bits | melhor do estudo | 1.ª ordem (antes) | entrada (app) | bits | antes (só o grau) | contorno | bits | tamanho |
|---|---|---|---|---|---|---|---|---|---|---|
${cvIds.map((id) => `| ${id} | ${appSel[id].rhythm.name} | ${nb(appModel[id].rhythm)} | ${nb(selected[id].rhythm.bits)} | ${nb(get(id, 'rhythm', 'R1').bits)} | ${appSel[id].entry.name} | ${nb(appModel[id].entry)} | ${nb(get(id, 'entry', 'E1').bits)} | ${appSel[id].contour.name} | ${nb(appModel[id].contour)} | ${(JSON.stringify(data.meters[id]).length / 1024).toFixed(0)} KB |`).join('\n')}

O modelo escreve os indivíduos iniciais («Blocos do corpus»), reescreve um ou dois tempos numa mutação e é a regra «Idioma do corpus» do fitness, que pede a uma melodia que seja tão idiomática como uma melodia real típica daquele compasso (entre o P10 e a mediana das melodias reais, medidas fora da amostra), e não mais. Os limites das outras regras («não maximizar») também passaram a ser os das melodias reais de cada compasso.

## 7. Como auditar e melhorar

- Cada número de uma probabilidade está na sua linha com a contagem e a contagem do contexto; no Excel, as probabilidades e frações são fórmulas.
- Para mudar o que o modelo pode usar (outro contexto, outra suavização), acrescente um candidato em \`CANDIDATES\` em \`tools/build_meters.mjs\` e corra \`node tools/build_meters.mjs\` e \`python3 tools/export_xlsx.py\`: a validação cruzada diz se é melhor, e o mais simples a menos de 0,01 bits do melhor é o escolhido.
- Para outro corpus ou outros compassos, altere \`tools/extract_meter_corpus.py\` (ou forneça outro \`data/corpus-meters.json\` com o mesmo formato).
- Limites conhecidos: melodias com tercinas ficaram de fora; as tonalidades são estimadas pelo music21; o grau de uma nota cromática é o grau abaixo; 12/8 e 9/8 têm poucas melodias.

## 8. Como se faz isto sem um modelo de linguagem

Tudo isto são contagens e probabilidades condicionais, a família de modelos estatísticos que se usa em música há décadas:

- **Cadeias de Markov / n-gramas**: a probabilidade do próximo acontecimento dado o anterior (1.ª ordem) ou os n anteriores. É a «relação probabilística simples».
- **Modelos de ordem variável**: em vez de fixar n, misturam todos os contextos, do mais longo que já foi visto ao mais curto. PPM, *Prediction by Partial Matching* (Cleary & Witten 1984), árvores de sufixos probabilísticas (Ron, Singer & Tishby 1996) e CTW, *Context Tree Weighting*. Begleiter, El-Yaniv & Yona (2004) compararam-nos em música e texto; PPM está entre os melhores. É a «árvore» da pergunta, com qualquer profundidade.
- **Suavização**: um contexto visto poucas vezes não pode dar probabilidade 0 ao que nunca viu. Pearce & Wiggins (2004) compararam os métodos em melodias; a mistura interpolada com o escape C (Witten–Bell) é das melhores, e é a que se usa aqui.
- **Pontos de vista múltiplos** (Conklin & Witten 1995): prever cada aspeto (ritmo, intervalo, contorno...) com o seu próprio modelo, ligando-os quando um ajuda o outro. É o que faz o IDyOM de Pearce (2005), um modelo de expectativa musical que junta um modelo de longo prazo, treinado num corpus, com um de curto prazo, que aprende a peça que está a ouvir.
- **Avaliação por entropia cruzada** em melodias deixadas de fora: o melhor modelo é o que dá mais probabilidade à música real que não viu (Temperley 2010 comparou assim seis modelos de ritmo no mesmo corpus de Essen).
- **Cuidado com o plágio**: cadeias de ordem alta tendem a copiar trechos do corpus maiores do que a própria ordem (Papadopoulos, Roy & Pachet 2014). Aqui o contexto do ritmo fica limitado a um compasso de 4/4, a melodia usa só o último intervalo, e o algoritmo genético mistura estas probabilidades com as outras regras; o modelo propõe, não copia.

### Referências

- Begleiter, R., El-Yaniv, R. & Yona, G. (2004). On prediction using variable order Markov models. *Journal of Artificial Intelligence Research* 22, 385–421. https://arxiv.org/abs/1107.0051
- Cleary, J. G. & Witten, I. H. (1984). Data compression using adaptive coding and partial string matching. *IEEE Transactions on Communications* 32(4), 396–402.
- Conklin, D. & Witten, I. H. (1995). Multiple viewpoint systems for music prediction. *Journal of New Music Research* 24(1), 51–73. https://www.ehu.eus/cs-ikerbasque/conklin/papers/jnmr95.pdf
- Dubnov, S., Assayag, G., Lartillot, O. & Bejerano, G. (2003). Using machine-learning methods for musical style modeling. *IEEE Computer* 36(10), 73–80.
- Hoffman, R., Pelto, W. & White, J. W. (1996). Takadimi: a beat-oriented system of rhythm pedagogy. *Journal of Music Theory Pedagogy* 10, 7–30.
- Pachet, F. (2003). The Continuator: musical interaction with style. *Journal of New Music Research* 32(3), 333–341.
- Papadopoulos, A., Roy, P. & Pachet, F. (2014). Avoiding plagiarism in Markov sequence generation. *AAAI 2014*. https://ojs.aaai.org/index.php/AAAI/article/view/9126
- Pearce, M. T. (2005). *The construction and evaluation of statistical models of melodic structure in music perception and composition* (tese de doutoramento, City University London) — IDyOM.
- Pearce, M. T. & Wiggins, G. A. (2004). Improved methods for statistical modelling of monophonic music. *Journal of New Music Research* 33(4), 367–385.
- Ron, D., Singer, Y. & Tishby, N. (1996). The power of amnesia: learning probabilistic automata with variable memory length. *Machine Learning* 25, 117–149.
- Temperley, D. (2010). Modeling common-practice rhythm. *Music Perception* 27(5), 355–376.
- von Hippel, P. & Huron, D. (2000). Why do skips precede reversals? The effect of tessitura on melodic structure. *Music Perception* 18(1), 59–85.
- Open Music Theory — compassos simples e compostos: https://viva.pressbooks.pub/openmusictheory/chapter/simple-meter-and-time-signatures/ e https://viva.pressbooks.pub/openmusictheory/chapter/compound-meters-and-time-signatures/
`;
writeFileSync(`${here}../results/meters.md`, md);
log('done');
