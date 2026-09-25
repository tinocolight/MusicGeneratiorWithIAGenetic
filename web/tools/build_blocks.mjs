// Learns the building-block model from the large corpus (tools/extract_large_corpus.py):
//   blocks (beat cells + contour), transitions by metric position, entry intervals by degree,
//   association rules between blocks in the same melody, how melodies begin, the typical
//   (P75) value of each fitness rule in real music, and a readable report.
//   node tools/build_blocks.mjs
// Writes src/data/blocks-data.js, results/blocks.json and results/blocks.md.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { lineToBeats, compactToLine, createBlockModel, dposOf } from '../src/ga/blocks.js';
import { createAttractorFitness } from '../src/fitness/attractor.js';
import { resolvePreset } from '../src/fitness/presets.js';
import { fromEvents, compactToEvents } from '../src/core/score.js';

const here = new URL('.', import.meta.url).pathname;
const src = existsSync(`${here}../data/corpus-large.json`) ? 'corpus-large.json' : 'corpus-full.json';
const melodies = JSON.parse(readFileSync(`${here}../data/${src}`, 'utf8')).melodies.filter((m) => [8, 12, 16].includes(m.barLen));
const mod = (a, n) => ((a % n) + n) % n;
const MIN_BLOCK = 8;

// ---------------------------------------------------------------- tokenise
function beatsOf(m) {
  const key = { tonic: m.tonic, mode: m.mode };
  const pad = mod(-(m.pickup || 0), 4);
  const line = compactToLine(m.events);
  const pitch = [...new Array(pad).fill(null), ...line.pitch];
  const onset = [...new Array(pad).fill(false), ...line.onset];
  return lineToBeats(pitch, onset, { barLen: m.barLen, pickup: (m.pickup || 0) + pad, key });
}
const all = melodies.map((m) => ({ m, beats: beatsOf(m) })).filter((x) => x.beats.length >= 8);
console.error(`${all.length} melodies from ${src}`);

const blockCount = new Map();
for (const { beats } of all) for (const b of beats) blockCount.set(b.id, (blockCount.get(b.id) || 0) + 1);
const vocab = new Set([...blockCount].filter(([, c]) => c >= MIN_BLOCK).map(([id]) => id));
const cls = (b) => (vocab.has(b.id) ? b.id : `?|${b.cell}`);

// ---------------------------------------------------------------- counts
const inc = (obj, k, n = 1) => (obj[k] = (obj[k] || 0) + n);
const trans = {};
const uni = {};
const entry = {};
const firstDeg = {};
const classCount = {};
const melodyHas = new Map();
let totalBeats = 0;
for (const { m, beats } of all) {
  let prev = '^';
  const set = new Set();
  const key = { tonic: m.tonic, mode: m.mode };
  const first = m.events.find(([p]) => p >= 0);
  inc(firstDeg, mod(dposOf(first[0], key), 7));
  for (const b of beats) {
    const c = cls(b);
    trans[b.pos] ||= {};
    trans[b.pos][prev] ||= {};
    inc(trans[b.pos][prev], c);
    uni[b.pos] ||= {};
    inc(uni[b.pos], c);
    inc(classCount, c);
    if (b.entry !== null) {
      entry[`${b.prevDeg}${b.pos}`] ||= {};
      inc(entry[`${b.prevDeg}${b.pos}`], b.entry);
    }
    set.add(c);
    prev = c;
    totalBeats++;
  }
  for (const c of set) melodyHas.set(c, (melodyHas.get(c) || 0) + 1);
  all.find((x) => x.m === m).set = set;
}

// association rules: pairs of blocks in the same melody
const N = all.length;
const pair = new Map();
for (const { set } of all) {
  const arr = [...set];
  for (let i = 0; i < arr.length; i++) for (let j = 0; j < arr.length; j++) {
    if (i === j) continue;
    const k = `${arr[i]}\t${arr[j]}`;
    pair.set(k, (pair.get(k) || 0) + 1);
  }
}
const rules = [];
for (const [k, nab] of pair) {
  const [a, b] = k.split('\t');
  const na = melodyHas.get(a);
  const nb = melodyHas.get(b);
  const conf = nab / na;
  const lift = conf / (nb / N);
  rules.push({ a, b, nab, na, nb, conf, lift });
}
const assoc = {};
const byA = new Map();
for (const r of rules) {
  if (!byA.has(r.a)) byA.set(r.a, []);
  byA.get(r.a).push(r);
}
for (const [a, list] of byA) {
  const pos = list.filter((r) => r.nab >= 12 && r.lift >= 1.4).sort((x, y) => y.lift * Math.log(y.nab) - x.lift * Math.log(x.nab)).slice(0, 8);
  const neg = list.filter((r) => (r.na * r.nb) / N >= 12 && r.lift <= 0.6).sort((x, y) => x.lift - y.lift).slice(0, 4);
  const keep = [...pos, ...neg];
  if (keep.length) assoc[a] = keep.map((r) => [r.b, +r.lift.toFixed(2)]);
}

// sparse tables for the browser
const topK = (obj, k) => Object.entries(obj).sort((x, y) => y[1] - x[1]).slice(0, k);
const data = {
  source: src,
  melodies: N,
  beats: totalBeats,
  blocks: topK(classCount, 100000),
  uni: Object.fromEntries(Object.entries(uni).map(([pos, o]) => [pos, topK(o, 160)])),
  trans: {},
  transOther: {},
  entry,
  firstDeg,
  assoc,
};
for (const [pos, rows] of Object.entries(trans)) {
  data.trans[pos] = {};
  data.transOther[pos] = {};
  for (const [prev, o] of Object.entries(rows)) {
    const tot = Object.values(o).reduce((a, b) => a + b, 0);
    if (tot < 5) continue;
    const list = topK(o, 24);
    data.trans[pos][prev] = list;
    data.transOther[pos][prev] = tot - list.reduce((a, [, c]) => a + c, 0);
  }
}

// ---------------------------------------------------------------- stats of real melodies under the model
const q = (arr, p) => arr.slice().sort((a, b) => a - b)[Math.floor(p * (arr.length - 1))];
data.stats = { logp: { p10: 0, p50: 1 }, coherence: { p10: 0, p50: 1 } };
const model = createBlockModel(data);
const lps = [];
const cohs = [];
for (const { beats } of all) {
  const s = model.score(beats);
  lps.push(s.logp);
  cohs.push(s.coherence);
}
data.stats = {
  logp: { p10: q(lps, 0.1), p50: q(lps, 0.5), p90: q(lps, 0.9) },
  coherence: { p10: q(cohs, 0.1), p50: q(cohs, 0.5), p90: q(cohs, 0.9) },
};

// ---------------------------------------------------------------- typical values of the fitness rules
const RULES = ['key', 'proximity', 'regression', 'forces', 'metric', 'cadence', 'tension', 'variety'];
const ruleVals = Object.fromEntries(RULES.map((r) => [r, []]));
const fits = new Map();
let scored = 0;
for (const { m } of all) {
  if (m.barLen !== 16) continue;
  // align to the first downbeat, keep whole bars, at most 16 bars
  let ev = compactToEvents(m.events);
  const shift = m.pickup ? m.barLen - m.pickup : 0;
  ev = ev.map((e) => ({ ...e, start: e.start - (m.pickup || 0) })).filter((e) => e.start >= 0);
  void shift;
  const end = ev.length ? Math.max(...ev.map((e) => e.start + e.dur)) : 0;
  const bars = Math.min(16, Math.max(4, Math.floor(end / 16)));
  if (bars < 4) continue;
  const genes = fromEvents(ev, bars * 16);
  const k = `${bars}|${m.tonic}|${m.mode}`;
  if (!fits.has(k)) fits.set(k, createAttractorFitness({ bars, tonic: m.tonic, mode: m.mode, waves: resolvePreset('arch', m.tonic), seed: 1, voices: [{ instrument: 'piano' }], form: 'none' }));
  const res = fits.get(k).evaluate(genes);
  for (const r of RULES) if (Number.isFinite(res.parts[r])) ruleVals[r].push(res.parts[r]);
  if (++scored >= 1500) break;
}
data.caps = Object.fromEntries(RULES.map((r) => [r, +q(ruleVals[r], 0.75).toFixed(3)]));
data.ruleStats = Object.fromEntries(RULES.map((r) => [r, { p25: +q(ruleVals[r], 0.25).toFixed(3), p50: +q(ruleVals[r], 0.5).toFixed(3), p75: +q(ruleVals[r], 0.75).toFixed(3) }]));

mkdirSync(`${here}../src/data`, { recursive: true });
writeFileSync(`${here}../src/data/blocks-data.js`, `// generated by tools/build_blocks.mjs from data/${src}\nexport default ${JSON.stringify(data)};\n`);

// ---------------------------------------------------------------- readable report
const DUR = { 1: '𝅘𝅥𝅯', 2: '♪', 3: '♪.', 4: '♩' };
function rhythmText(cell) {
  const out = [];
  let i = 0;
  while (i < 4) {
    const ch = cell[i];
    let j = i + 1;
    if (ch === 'x' || (ch === '-' && i === 0)) while (j < 4 && cell[j] === '-') j++;
    else if (ch === '.') while (j < 4 && cell[j] === '.') j++;
    const d = j - i;
    if (ch === '.') out.push(`pausa ${DUR[d] ?? d}`);
    else if (ch === '-') out.push(`(ligada) ${DUR[d] ?? d}`);
    else out.push(DUR[d] ?? String(d));
    i = j;
  }
  return out.join(' ');
}
function blockText(id) {
  const [cell, contour] = id.split('|');
  if (id.startsWith('?')) return `outro contorno com ritmo ${rhythmText(contour)}`;
  const c = contour ? ` · ${contour.match(/[+-]\d+/g).map((x) => (Number(x) === 0 ? 'repete' : `${x > 0 ? 'sobe' : 'desce'} ${Math.abs(x)}`)).join(', ')}` : '';
  return `${rhythmText(cell)}${c}`;
}
const pct = (x) => `${(x * 100).toFixed(1)} %`;
const bySource = {};
for (const { m } of all) bySource[m.source] = (bySource[m.source] || 0) + 1;
const DEG = ['1 (tónica)', '2', '3 (mediante)', '4', '5 (dominante)', '6', '7'];
let md = `# Blocos de construção aprendidos com melodias reais\n\nGerado por \`node tools/build_blocks.mjs\` a partir de \`data/${src}\`: ${N} melodias (${Object.entries(bySource).map(([k, v]) => `${k} ${v}`).join(', ')}), ${totalBeats} tempos. As 480 melodias do crítico ficaram de fora. Um bloco é um tempo (4 semicolcheias): ritmo e contorno em graus da escala; ${vocab.size} blocos aparecem pelo menos ${MIN_BLOCK} vezes e cobrem ${pct(all.reduce((a, x) => a + x.beats.filter((b) => vocab.has(b.id)).length, 0) / totalBeats)} dos tempos.\n\n`;
md += '## Blocos mais frequentes\n\n| Bloco | Tempos | Melodias que o têm |\n|---|---|---|\n';
for (const [id, c] of topK(classCount, 20)) md += `| ${blockText(id)} | ${pct(c / totalBeats)} | ${pct(melodyHas.get(id) / N)} |\n`;
md += `\n## Como começam as melodias reais\n\nPrimeira nota: ${topK(firstDeg, 7).map(([d, c]) => `grau ${DEG[d]} ${pct(c / N)}`).join(' · ')}.\n\nPrimeiro tempo (a seguir ao início ou à anacrusa):\n\n| Bloco | Melodias |\n|---|---|\n`;
const starts = {};
for (const { beats } of all) inc(starts, cls(beats[0]));
for (const [id, c] of topK(starts, 12)) md += `| ${blockText(id)} | ${pct(c / N)} |\n`;
md += '\n## Regras de associação (na mesma melodia)\n\n«Se o bloco A aparece, o bloco B aparece com probabilidade p». *Lift* = quantas vezes mais do que se B aparecesse ao acaso (1 = independentes).\n\n| Se aparece | então aparece | p | lift | melodias com ambos |\n|---|---|---|---|---|\n';
const shown = rules.filter((r) => r.nab >= 25 && r.lift >= 2 && !r.a.startsWith('?') && !r.b.startsWith('?')).sort((x, y) => y.lift * Math.log(y.nab) - x.lift * Math.log(x.nab));
const seenPairs = new Set();
let count = 0;
for (const r of shown) {
  const k = [r.a, r.b].sort().join('\t');
  if (seenPairs.has(k)) continue;
  seenPairs.add(k);
  md += `| ${blockText(r.a)} | ${blockText(r.b)} | ${pct(r.conf)} | ${r.lift.toFixed(1)} | ${r.nab} |\n`;
  if (++count >= 20) break;
}
md += '\nAssociações negativas (raramente juntos):\n\n| Bloco A | Bloco B | lift |\n|---|---|---|\n';
count = 0;
for (const r of rules.filter((x) => (x.na * x.nb) / N >= 40 && x.lift <= 0.5 && !x.a.startsWith('?') && !x.b.startsWith('?')).sort((x, y) => x.lift - y.lift)) {
  const k = [r.a, r.b].sort().join('\t');
  if (seenPairs.has(k)) continue;
  seenPairs.add(k);
  md += `| ${blockText(r.a)} | ${blockText(r.b)} | ${r.lift.toFixed(2)} |\n`;
  if (++count >= 10) break;
}
md += `\n## Valor típico das regras na música real (P25 / P50 / P75)\n\nO AG passa a ser recompensado só até ao P75 de cada regra («não maximizar»):\n\n| Regra | P25 | P50 | P75 |\n|---|---|---|---|\n`;
for (const r of RULES) md += `| ${r} | ${data.ruleStats[r].p25} | ${data.ruleStats[r].p50} | ${data.ruleStats[r].p75} |\n`;
md += `\nLog-probabilidade média por tempo nas melodias reais: P10 ${data.stats.logp.p10.toFixed(2)}, mediana ${data.stats.logp.p50.toFixed(2)}, P90 ${data.stats.logp.p90.toFixed(2)}.\n`;
mkdirSync(`${here}../results`, { recursive: true });
writeFileSync(`${here}../results/blocks.md`, md);
writeFileSync(`${here}../results/blocks.json`, JSON.stringify({ melodies: N, beats: totalBeats, bySource, vocab: vocab.size, firstDeg, starts: topK(starts, 30), caps: data.caps, ruleStats: data.ruleStats, stats: data.stats }, null, 1));
console.error(`vocab ${vocab.size}, rules kept ${Object.keys(assoc).length}, data ${(JSON.stringify(data).length / 1024).toFixed(0)} KB`);
console.log(md);
