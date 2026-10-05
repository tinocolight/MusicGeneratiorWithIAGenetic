// What makes a fado melody a fado melody: the real fados of data/fado-corpus.json
// (tools/fado_corpus.py) measured on their own grid (24 ticks per quarter: triplets and 32nds
// exact), next to the melodies of the corpus in the same meters (data/corpus-meters.json), and
// judged by the rules the program already has (heuristics.js, general rules of styles.js).
//   node tools/fado_study.mjs
// Writes results/fado/melodias.csv, frases.csv, comparacao.csv, regras-atuais.csv, cantado.csv.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { melodyFeatures } from '../src/fitness/heuristics.js';
import { resolveRules } from '../src/fitness/styles.js';
import { ruleValue, ruleScore } from '../src/fitness/heuristics.js';
import { makeKey } from '../src/core/theory.js';
import { compactToLine } from '../src/ga/figures.js';

const here = new URL('.', import.meta.url).pathname;
const out = `${here}../results/fado`;
if (!existsSync(`${here}../data/fado-corpus.json`)) {
  console.error('data/fado-corpus.json is missing: run tools/fado_corpus.py first (see its header)');
  process.exit(1);
}
mkdirSync(out, { recursive: true });
const fado = JSON.parse(readFileSync(`${here}../data/fado-corpus.json`, 'utf8'));
const corpus = JSON.parse(readFileSync(`${here}../data/corpus-meters.json`, 'utf8')).melodies;
const TPQ = 24;
const mod = (a, n) => ((a % n) + n) % n;
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const sum = (a) => a.reduce((x, y) => x + y, 0);
const SCALE = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const DEG = ['1', '♭2', '2', '♭3', '3', '4', '♯4', '5', '♭6', '6', '♭7', '7'];

/** Notes {p, s, d} (ticks from the first note) and rests, from [[midi | -1, ticks]]. */
function notesOf(events) {
  let t = 0;
  const notes = [];
  const rests = [];
  for (const [p, d] of events) {
    if (p >= 0) notes.push({ p, s: t, d });
    else rests.push({ s: t, d });
    t += d;
  }
  return { notes, rests, total: t };
}

/**
 * Measures of one melody on its own grid. m = {events, tpq, barTicks, pickup, tonic, mode,
 * keyChanges}. Positions are relative to the bar: the first note sits `pickup` ticks before a
 * downbeat (0 = on the downbeat).
 */
function measure(m) {
  const { notes, rests, total } = notesOf(m.events);
  const beat = TPQ * (m.den === 8 ? 1.5 : 1) * (m.den === 2 ? 1 : 1); // a quarter (dotted in compound meters)
  const bar = m.barTicks;
  const off = mod(-m.pickup, bar); // bar position of tick 0
  const pos = (t) => mod(t + off, bar);
  const modeAt = (t) => {
    let mode = m.mode;
    for (const [k, md] of m.keyChanges ?? []) if (t >= k) mode = md;
    return mode;
  };
  const f = { notes: notes.length, bars: total / bar };
  const durs = notes.map((n) => n.d / TPQ); // in quarters
  const share = (pred) => notes.filter(pred).length / notes.length;
  f.fast = share((n) => n.d < 6); // shorter than a 16th: 32nds, triplet 16ths
  f.sixteenth = share((n) => n.d >= 6 && n.d < 8);
  f.tripletEighth = share((n) => n.d === 8);
  f.quick = share((n) => n.d < 12); // anything shorter than an eighth
  f.eighth = share((n) => n.d >= 12 && n.d < 24);
  f.quarter = share((n) => n.d >= 24 && n.d < 48);
  f.long = share((n) => n.d >= 48); // half note or longer
  f.meanDur = mean(durs);
  f.density = notes.length / ((total - (notes[0]?.s ?? 0)) / beat);
  f.restShare = sum(rests.map((r) => r.d)) / total;
  f.tripletShare = share((n) => n.d % 8 === 0 && n.d % 12 !== 0 && n.d % 6 !== 0);
  // runs of quick notes (each shorter than an eighth): the "voltinhas" and runs of the singer
  const runs = [];
  let run = 0;
  for (let i = 0; i <= notes.length; i++) {
    const n = notes[i];
    const contiguous = n && (i === 0 || notes[i - 1].s + notes[i - 1].d === n.s);
    if (n && n.d < 12 && contiguous) run++;
    else {
      if (run >= 3) runs.push({ len: run, end: i - 1 });
      run = n && n.d < 12 ? 1 : 0;
    }
  }
  f.quickRunsPerBar = runs.length / f.bars;
  f.quickRunMax = runs.length ? Math.max(...runs.map((r) => r.len)) : 0;
  // a run that leads straight into a long note: an ornament before the held note
  f.runIntoLong = runs.length ? runs.filter((r) => notes[r.end + 1] && notes[r.end + 1].d >= 2 * beat).length / runs.length : undefined;
  // syncopation: starts off the beat and lasts past the next beat
  let sync = 0;
  let longs = 0;
  let longOff = 0;
  for (const n of notes) {
    const p = pos(n.s);
    const nextBeat = (Math.floor(p / beat) + 1) * beat;
    if (p % beat !== 0 && p + n.d > nextBeat) sync++;
    if (n.d >= 2 * beat) {
      longs++;
      if (p % beat !== 0) longOff++;
    }
  }
  f.syncPerBar = sync / f.bars;
  f.longAnticipated = longs ? longOff / longs : undefined; // held notes that start before their beat
  // intervals (a rest of a beat or more breaks the line)
  let steps = 0;
  let reps = 0;
  let leaps = 0;
  let down = 0;
  let nI = 0;
  let leapBack = 0;
  let leapsSeen = 0;
  let maxLeap = 0;
  for (let i = 1; i < notes.length; i++) {
    const gap = notes[i].s - (notes[i - 1].s + notes[i - 1].d);
    if (gap >= beat) continue;
    const d = notes[i].p - notes[i - 1].p;
    const a = Math.abs(d);
    nI++;
    if (a === 0) reps++;
    else if (a <= 2) {
      steps++;
      if (d < 0) down++;
    } else if (a >= 5) leaps++;
    maxLeap = Math.max(maxLeap, a);
    if (a >= 5 && i + 1 < notes.length) {
      leapsSeen++;
      const d2 = notes[i + 1].p - notes[i].p;
      if (Math.sign(d2) === -Math.sign(d) && Math.abs(d2) <= 2) leapBack++;
    }
  }
  f.repeats = reps / nI;
  f.steps = steps / nI;
  f.thirds = (nI - reps - steps - leaps) / nI;
  f.leaps = leaps / nI;
  f.stepDown = steps ? down / steps : undefined;
  f.leapRecovered = leapsSeen ? leapBack / leapsSeen : undefined;
  f.maxLeap = maxLeap;
  const ps = notes.map((n) => n.p);
  f.range = Math.max(...ps) - Math.min(...ps);
  // chromatic notes (outside the scale of the mode; the raised 7th of minor counted apart)
  let chrom = 0;
  let lead = 0;
  for (const n of notes) {
    const r = mod(n.p - m.tonic, 12);
    const md = modeAt(n.s);
    if (md === 'minor' && r === 11) lead++;
    else if (!SCALE[md].includes(r)) chrom++;
  }
  f.chromatic = chrom / notes.length;
  f.leadingTone = lead / notes.length;

  // phrases: notes between rests of an eighth or more (the breath between two verses)
  const phrases = [];
  let cur = [];
  for (let i = 0; i < notes.length; i++) {
    if (i && notes[i].s - (notes[i - 1].s + notes[i - 1].d) >= TPQ / 2) {
      phrases.push(cur);
      cur = [];
    }
    cur.push(notes[i]);
  }
  if (cur.length) phrases.push(cur);
  const ph = phrases.filter((p) => p.length >= 3).map((p, k) => {
    const last = p[p.length - 1];
    const first = p[0];
    const md = modeAt(last.s);
    const top = Math.max(...p.map((n) => n.p));
    const counts = new Map();
    for (const n of p) counts.set(n.p, (counts.get(n.p) || 0) + 1);
    const recite = Math.max(...counts.values()) / p.length;
    const longest = Math.max(...p.map((n) => n.d));
    const restAfter = phrases.indexOf(p) + 1 < phrases.length ? phrases[phrases.indexOf(p) + 1][0].s - (last.s + last.d) : 0;
    return {
      k,
      notes: p.length,
      beats: (last.s + last.d - first.s) / beat,
      startPos: pos(first.s) / beat, // beat of the bar where the verse starts (0 = downbeat)
      startsOffDownbeat: pos(first.s) !== 0,
      lastDur: last.d / beat,
      lastIsLongest: last.d === longest,
      lastRatio: last.d / mean(p.slice(0, -1).map((n) => n.d)),
      lastPos: pos(last.s) / beat,
      lastAnticipated: pos(last.s) % beat !== 0,
      lastDegree: DEG[mod(last.p - m.tonic, 12)],
      lastStable: [0, 3, 4, 7].includes(mod(last.p - m.tonic, 12)) || (md === 'minor' && mod(last.p - m.tonic, 12) === 3),
      intoLast: last.p - p[p.length - 2].p,
      contour: last.p - first.p,
      topAt: (p.findIndex((n) => n.p === top) + 0.5) / p.length,
      top,
      ambitus: top - Math.min(...p.map((n) => n.p)),
      recite,
      restAfter: restAfter / beat,
    };
  });
  f.phrases = ph.length;
  f.phraseNotes = mean(ph.map((p) => p.notes));
  f.phraseBeats = mean(ph.map((p) => p.beats));
  f.phraseStartsOff = mean(ph.map((p) => (p.startsOffDownbeat ? 1 : 0)));
  f.phraseLastLongest = mean(ph.map((p) => (p.lastIsLongest ? 1 : 0)));
  f.phraseLastRatio = mean(ph.map((p) => Math.min(8, p.lastRatio)));
  f.phraseLastAnticipated = mean(ph.map((p) => (p.lastAnticipated ? 1 : 0)));
  f.phraseRecite = mean(ph.map((p) => p.recite));
  f.phraseFalls = mean(ph.map((p) => (p.contour < 0 ? 1 : 0)));
  f.phraseTopAt = mean(ph.map((p) => p.topAt));
  f.phraseLastStepDown = mean(ph.map((p) => (p.intoLast < 0 && p.intoLast >= -2 ? 1 : 0)));
  f.phraseRestAfter = mean(ph.filter((p) => p.restAfter > 0).map((p) => p.restAfter));
  // stanza: groups of four verses; which verse holds the highest note
  const quads = [];
  for (let i = 0; i + 4 <= ph.length; i += 4) quads.push(ph.slice(i, i + 4));
  f.climaxVerse = quads.map((q) => q.reduce((b, p, i) => (p.top > q[b].top ? i : b), 0) + 1);
  return { f, ph };
}

/** The same measures for a corpus melody ([[midi | -1, 16ths]]). */
const fromCorpus = (m) => ({ events: m.events.map(([p, d]) => [p, d * 6]), den: m.den, barTicks: m.barLen * 6, pickup: m.pickup * 6, tonic: m.tonic, mode: m.mode, keyChanges: [] });

const rowsMel = [];
const rowsPh = [];
const results = fado.melodies.map((m) => {
  const r = measure(m);
  rowsMel.push({ title: m.title, kind: m.kind, meter: m.meter, mode: m.mode, ...r.f });
  for (const p of r.ph) rowsPh.push({ title: m.title, ...p });
  return { m, ...r };
});

// the corpus in the meters of fado: 2/4 and 4/4 (2/2 counted as 4/4)
const groupOf = (m) => { const id = `${m.num}/${m.den}`; return id === '2/2' ? '4/4' : id; };
const ref = { '2/4': [], '4/4': [] };
for (const m of corpus) {
  const g = groupOf(m);
  if (!ref[g]) continue;
  try {
    ref[g].push({ ...measure(fromCorpus(m)).f, mode: m.mode });
  } catch { /* too short */ }
}
const KEYS = ['density', 'meanDur', 'quick', 'fast', 'tripletEighth', 'eighth', 'quarter', 'long', 'restShare', 'quickRunsPerBar', 'quickRunMax', 'runIntoLong', 'syncPerBar', 'longAnticipated', 'repeats', 'steps', 'thirds', 'leaps', 'stepDown', 'leapRecovered', 'maxLeap', 'range', 'chromatic', 'leadingTone', 'phraseNotes', 'phraseBeats', 'phraseStartsOff', 'phraseLastLongest', 'phraseLastRatio', 'phraseLastAnticipated', 'phraseRecite', 'phraseFalls', 'phraseTopAt', 'phraseLastStepDown', 'phraseRestAfter'];
const quant = (a, q) => {
  const s = a.filter((x) => Number.isFinite(x)).sort((x, y) => x - y);
  if (!s.length) return NaN;
  const i = (s.length - 1) * q;
  return s[Math.floor(i)] + (s[Math.ceil(i)] - s[Math.floor(i)]) * (i - Math.floor(i));
};
const fadoLead = rowsMel.filter((r) => r.kind === 'lead sheet');
const cmp = KEYS.map((k) => {
  const fv = fadoLead.map((r) => r[k]).filter(Number.isFinite);
  const all = [...ref['2/4'], ...ref['4/4']].map((r) => r[k]);
  const p10 = quant(all, 0.1);
  const p50 = quant(all, 0.5);
  const p90 = quant(all, 0.9);
  // where the fado values fall among the corpus melodies (percentile of their median)
  const fm = quant(fv, 0.5);
  const below = all.filter((x) => Number.isFinite(x) && x < fm).length / all.filter(Number.isFinite).length;
  return { k, fadoMin: Math.min(...fv), fadoMed: fm, fadoMax: Math.max(...fv), p10, p50, p90, pct: below };
});

// the rules of the program (general rules + the current "fado" style) on the fados, on the 16th grid
function toSixteenths(m) {
  // round every onset to the nearest 16th (triplets and 32nds cannot be written on this grid)
  let t = 0;
  const on = [];
  for (const [p, d] of m.events) {
    on.push([p, Math.round(t / 6)]);
    t += d;
  }
  const end = Math.round(t / 6);
  const ev = [];
  for (let i = 0; i < on.length; i++) {
    const d = (i + 1 < on.length ? on[i + 1][1] : end) - on[i][1];
    if (d <= 0) continue; // two notes in one 16th: keep the later one
    ev.push([on[i][0], d]);
  }
  return ev;
}
const ruleRows = [];
for (const { m } of results.filter((r) => r.m.kind === 'lead sheet')) {
  const meter = m.meter === '2/2' ? '4/4' : m.meter;
  const ev = toSixteenths(m);
  const line = compactToLine(ev);
  const barLen = m.barTicks / 6;
  const pickup = m.pickup / 6;
  const lead = mod(barLen - pickup, barLen);
  const padded = { pitch: [...new Array(lead).fill(null), ...line.pitch], onset: [...new Array(lead).fill(false), ...line.onset] };
  const key = makeKey(m.tonic, m.mode);
  const f = melodyFeatures(padded, { meter, key, phraseBars: 2, phraseStart: 0 });
  for (const style of ['none', 'fado']) {
    for (const r of resolveRules(style, meter)) {
      const v = ruleValue(f, r);
      ruleRows.push({ title: m.title, style, rule: r.id, value: v, lo: r.in ? r.in.join(' ') : r.lo, hi: r.in ? '' : r.hi, score: ruleScore(v, r) });
    }
  }
}

// written melody against the singer's version (Coimbra)
const written = results.find((r) => r.m.title.startsWith('Coimbra (')).f;
const sung = results.find((r) => r.m.title.startsWith('Coimbra,')).f;
const SUNG_KEYS = ['notes', 'bars', 'density', 'quick', 'eighth', 'quarter', 'long', 'syncPerBar', 'longAnticipated', 'repeats', 'steps', 'phraseNotes', 'phraseStartsOff', 'phraseLastAnticipated', 'phraseRecite', 'restShare'];

// ------------------------------------------------------------------ CSV
const num = (x, d = 4) => (typeof x === 'number' ? (Number.isFinite(x) ? x.toFixed(d) : '') : x === undefined || x === null ? '' : `"${String(x).replace(/"/g, '""')}"`);
const csv = (rows, cols) => `﻿${[cols.join(','), ...rows.map((r) => cols.map((c) => (Array.isArray(r[c]) ? `"${r[c].join(' ')}"` : num(r[c]))).join(','))].join('\r\n')}\r\n`;
writeFileSync(`${out}/melodias.csv`, csv(rowsMel, ['title', 'kind', 'meter', 'mode', 'notes', 'bars', ...KEYS, 'phrases', 'climaxVerse']));
writeFileSync(`${out}/frases.csv`, csv(rowsPh, ['title', 'k', 'notes', 'beats', 'startPos', 'startsOffDownbeat', 'lastDur', 'lastIsLongest', 'lastRatio', 'lastPos', 'lastAnticipated', 'lastDegree', 'lastStable', 'intoLast', 'contour', 'topAt', 'top', 'ambitus', 'recite', 'restAfter']));
writeFileSync(`${out}/comparacao.csv`, csv(cmp, ['k', 'fadoMin', 'fadoMed', 'fadoMax', 'p10', 'p50', 'p90', 'pct']));
writeFileSync(`${out}/regras-atuais.csv`, csv(ruleRows, ['title', 'style', 'rule', 'value', 'lo', 'hi', 'score']));
writeFileSync(`${out}/cantado.csv`, csv(SUNG_KEYS.map((k) => ({ k, written: written[k], sung: sung[k] })), ['k', 'written', 'sung']));

// ------------------------------------------------------------------ console summary
const fx = (x) => (Number.isFinite(x) ? x.toFixed(2) : '—');
console.log(`corpus: ${ref['2/4'].length} melodies in 2/4, ${ref['4/4'].length} in 4/4\n`);
console.log('feature'.padEnd(22), 'fado min/med/max'.padEnd(22), 'corpus P10/P50/P90'.padEnd(22), 'fado median at corpus percentile');
for (const c of cmp) console.log(c.k.padEnd(22), `${fx(c.fadoMin)} ${fx(c.fadoMed)} ${fx(c.fadoMax)}`.padEnd(22), `${fx(c.p10)} ${fx(c.p50)} ${fx(c.p90)}`.padEnd(22), `${Math.round(c.pct * 100)}`);
console.log('\nclimax verse per quatrain:', rowsMel.map((r) => `${r.title}: ${r.climaxVerse.join(' ')}`).join(' | '));
console.log('\nphrase ends (degree):', rowsMel.map((r) => `${r.title}: ${rowsPh.filter((p) => p.title === r.title).map((p) => p.lastDegree).join(' ')}`).join('\n'));
console.log('\nwritten vs sung (Coimbra):');
for (const k of SUNG_KEYS) console.log(k.padEnd(22), fx(written[k]), fx(sung[k]));
console.log('\nrules of the program that fail on real fados (score < 1):');
for (const r of ruleRows.filter((x) => x.score !== null && x.score < 1)) console.log(`${r.title} [${r.style}] ${r.rule} = ${fx(r.value)} (range ${r.lo}–${r.hi}) score ${fx(r.score)}`);
