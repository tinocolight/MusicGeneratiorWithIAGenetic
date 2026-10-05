// Composition heuristics ("Heurísticas de composição"): rules of melody writing taken from the
// literature (results/estilos/literatura.csv), general and by style (styles.js).
//
// Every rule measures ONE feature of the melody (melodyFeatures below) and compares it with a
// target range: 1 inside the range, falling linearly to -1 at `tol` beyond it (or a set of allowed
// values). The ranges are as wide as real music allows — where the corpus has melodies of the
// style, they are its P10–P90 (tools/build_styles.mjs) — so nothing is maximised: a melody inside
// every range scores 1. The component is the weighted mean of the rules, in [-1, 1].

import { meterOf } from '../core/meter.js';
import { dposOf } from '../ga/figures.js';

const mod = (a, n) => ((a % n) + n) % n;

/** Notes of a sounding line ({pitch, onset} per 16th): {p, s, d} = pitch, start, duration. */
export function notesOf(line) {
  const notes = [];
  let cur = null;
  for (let t = 0; t < line.pitch.length; t++) {
    const p = line.pitch[t];
    if (p === null || p === undefined) cur = null;
    else if (line.onset[t] || !cur) {
      cur = { p, s: t, d: 1 };
      notes.push(cur);
    } else cur.d++;
  }
  return notes;
}

// The diatonic triads of a key (pitch classes relative to the tonic): the chords a leap may outline.
function triadsOf(key) {
  const scale = key.mode === 'minor' ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const out = scale.map((_, i) => [scale[i], scale[(i + 2) % 7], scale[(i + 4) % 7]]);
  if (key.mode === 'minor') out.push([7, 11, 2]); // V with the raised leading tone
  return out;
}

const PENTATONIC = { major: [0, 2, 4, 7, 9], minor: [0, 3, 5, 7, 10] };

/**
 * Features of a melody given as a sounding line, on the grid of its meter.
 * ctx = {meter, key {tonic, mode, diatonic}, phraseBars, phraseStart (16ths: where the first phrase
 * window starts, i.e. the first downbeat minus the pickup), sectionBars}
 * Values that need more material than the melody has (e.g. no leaps to recover) are undefined.
 */
export function melodyFeatures(line, ctx) {
  const m = meterOf(ctx.meter);
  const bar = m.barLen;
  const beat = m.beat;
  const key = ctx.key;
  const L = line.pitch.length;
  const notes = notesOf(line);
  const f = { notes: notes.length };
  if (notes.length < 4) return f;
  const first = notes[0].s;
  const span = Math.max(1, L - first);
  const pc = (p) => mod(p - key.tonic, 12);

  // ---------------------------------------------------------------- rhythm and rests
  let rest = 0;
  for (let t = first; t < L; t++) if (line.pitch[t] === null || line.pitch[t] === undefined) rest++;
  f.restShare = rest / span;
  f.density = notes.length / (span / beat);
  f.firstOnset = first % bar;
  const bars = span / bar;
  let sync = 0;
  let long = 0;
  let longOn = 0;
  for (const n of notes) {
    const nextBeat = (Math.floor(n.s / beat) + 1) * beat;
    if (n.s % beat !== 0 && n.s + n.d > nextBeat) sync++;
    if (n.d >= beat) {
      long++;
      if (n.s % beat === 0) longOn++;
    }
  }
  f.syncBar = sync / bars;
  f.longOnBeat = long >= 2 ? longOn / long : undefined;

  // ---------------------------------------------------------------- intervals (a rest of a beat breaks the line)
  const iv = [];
  for (let i = 1; i < notes.length; i++) {
    const a = notes[i - 1];
    const b = notes[i];
    iv.push(b.s - (a.s + a.d) >= beat ? null : b.p - a.p);
  }
  const triads = triadsOf(key);
  const inOneTriad = (...ps) => triads.some((tr) => ps.every((p) => tr.includes(pc(p))));
  let nI = 0;
  let steps = 0;
  let down = 0;
  let reps = 0;
  let leaps = 0;
  let big = 0;
  let maxLeap = 0;
  let dis = 0;
  let arp = 0;
  let sumAbs = 0;
  for (let i = 0; i < iv.length; i++) {
    const d = iv[i];
    if (d === null) continue;
    nI++;
    const a = Math.abs(d);
    sumAbs += a;
    if (a === 0) reps++;
    else if (a <= 2) {
      steps++;
      if (d < 0) down++;
    }
    if (a >= 5) leaps++;
    if (a >= 8) big++;
    if (a > maxLeap) maxLeap = a;
    if (a === 6 || a === 10 || a === 11 || a > 12) dis++;
    if (a >= 3 && a <= 9 && inOneTriad(notes[i].p, notes[i + 1].p)) arp++;
  }
  if (nI >= 3) {
    f.steps = steps / nI;
    f.repeats = reps / nI;
    f.leaps = leaps / nI;
    f.bigLeaps = big / nI;
    f.maxLeap = maxLeap;
    f.meanInterval = sumAbs / nI;
    f.dissonant = dis / nI;
    f.arpeggio = arp / nI;
  }
  f.stepDown = steps >= 4 ? down / steps : undefined;

  let stepPairs = 0;
  let same = 0;
  let leapsSeen = 0;
  let recovered = 0;
  let pairs = 0;
  let badChain = 0;
  let moving = 0;
  let turns = 0;
  for (let i = 0; i + 1 < iv.length; i++) {
    const d1 = iv[i];
    const d2 = iv[i + 1];
    if (d1 === null || d2 === null) continue;
    pairs++;
    const a1 = Math.abs(d1);
    const a2 = Math.abs(d2);
    if (a1 >= 1 && a1 <= 2 && a2 >= 1 && a2 <= 2) {
      stepPairs++;
      if (Math.sign(d1) === Math.sign(d2)) same++;
    }
    if (a1 >= 5) {
      leapsSeen++;
      if (Math.sign(d2) === -Math.sign(d1) && a2 >= 1 && a2 <= 2) recovered++;
    }
    // two leaps in the same direction are fine only if the three notes outline one chord
    if (a1 >= 3 && a2 >= 3 && Math.sign(d1) === Math.sign(d2) && !inOneTriad(notes[i].p, notes[i + 1].p, notes[i + 2].p)) badChain++;
    if (d1 !== 0 && d2 !== 0) {
      moving++;
      if (Math.sign(d1) !== Math.sign(d2)) turns++;
    }
  }
  f.inertia = stepPairs >= 4 ? same / stepPairs : undefined;
  f.recovery = leapsSeen >= 2 ? recovered / leapsSeen : undefined;
  f.leapChain = pairs >= 3 ? badChain / pairs : undefined;
  f.dirChanges = moving >= 4 ? turns / moving : undefined;

  // ---------------------------------------------------------------- scale
  const penta = PENTATONIC[key.mode === 'minor' ? 'minor' : 'major'];
  let dur = 0;
  let inPenta = 0;
  let chrom = 0;
  let blue = 0;
  let hi = -Infinity;
  let lo = Infinity;
  for (const n of notes) {
    const r = pc(n.p);
    dur += n.d;
    if (penta.includes(r)) inPenta += n.d;
    if (key.diatonic && !key.diatonic[mod(n.p, 12)]) chrom++;
    if (key.mode !== 'minor' && (r === 3 || r === 10)) blue++;
    if (n.p > hi) hi = n.p;
    if (n.p < lo) lo = n.p;
  }
  f.pentatonic = inPenta / dur;
  f.chromatic = chrom / notes.length;
  f.blue = blue / notes.length;
  f.range = hi - lo;
  const tops = notes.filter((n) => n.p === hi);
  f.climaxCount = tops.length;
  f.climaxPos = (tops[0].s - first) / span;

  // ---------------------------------------------------------------- phrases (fixed windows, as in the fitness)
  const W = Math.max(1, ctx.phraseBars ?? 2) * bar;
  const start0 = ctx.phraseStart ?? 0;
  let phr = 0;
  let convex = 0;
  let nConv = 0;
  let endLow = 0;
  let descent = 0;
  let lenRatio = 0;
  let offEnds = 0;
  let k = 0;
  const firstWin = Math.floor((first - start0) / W);
  for (let w = Math.min(0, firstWin); start0 + w * W < L; w++) {
    const ws = start0 + w * W;
    const we = ws + W;
    const ns = [];
    while (k < notes.length && notes[k].s < we) {
      if (notes[k].s >= ws) ns.push(notes[k]);
      k++;
    }
    if (ns.length < 2) continue;
    phr++;
    const last = ns[ns.length - 1];
    const mean = ns.reduce((a, n) => a + n.p, 0) / ns.length;
    if (last.p < mean) endLow++;
    if (last.p < ns[0].p) descent++;
    const meanDur = ns.reduce((a, n) => a + n.d, 0) / ns.length;
    lenRatio += Math.min(4, last.d / meanDur);
    if (last.s % beat !== 0) offEnds++;
    if (ns.length >= 3) {
      nConv++;
      const mid = ns.slice(1, -1).reduce((a, n) => a + n.p, 0) / (ns.length - 2);
      if (mid > ns[0].p && mid > last.p) convex++;
    }
  }
  if (phr) {
    f.endLow = endLow / phr;
    f.phraseDescent = descent / phr;
    f.finalLength = lenRatio / phr;
    f.offbeatEnds = offEnds / phr;
  }
  f.arch = nConv ? convex / nConv : undefined;

  // ---------------------------------------------------------------- beats and bars
  // figure of each beat ('x' onset, '_' continuation, '.' silence), from the first full beat with sound
  const figures = new Map();
  let nBeats = 0;
  const figuresAt = Array.from({ length: m.beats }, () => new Map());
  const beatsAt = new Array(m.beats).fill(0);
  const cellAt = (t, len) => {
    let c = '';
    for (let s = t; s < t + len; s++) c += line.pitch[s] === null || line.pitch[s] === undefined ? '.' : line.onset[s] ? 'x' : '_';
    return c;
  };
  const beat0 = Math.floor(first / beat) * beat;
  for (let t = beat0; t + beat <= L; t += beat) {
    const c = cellAt(t, beat);
    figures.set(c, (figures.get(c) || 0) + 1);
    nBeats++;
    const pos = mod(Math.floor(t / beat), m.beats);
    figuresAt[pos].set(c, (figuresAt[pos].get(c) || 0) + 1);
    beatsAt[pos]++;
  }
  f.figures = { counts: figures, total: nBeats, at: figuresAt, totalAt: beatsAt };

  // bars: rhythm repetition (motifs), sequences, long notes on given beats
  const bar0 = Math.floor(first / bar) * bar;
  const seen = new Set();
  let nBars = 0;
  let repeated = 0;
  let downLong = 0;
  let beat2Long = 0;
  let prev = null;
  let seqPairs = 0;
  let seqs = 0;
  let ni = 0;
  for (let b = bar0; b + bar <= L; b += bar) {
    const rh = cellAt(b, bar);
    const inBar = [];
    while (ni < notes.length && notes[ni].s < b + bar) {
      if (notes[ni].s >= b) inBar.push(notes[ni]);
      ni++;
    }
    if (!inBar.length) {
      prev = null;
      continue;
    }
    nBars++;
    if (nBars > 1 && seen.has(rh)) repeated++;
    seen.add(rh);
    const down0 = inBar.find((n) => n.s === b);
    if (down0 && down0.d >= 2 * beat) downLong++;
    if (inBar.some((n) => n.s === b + beat && n.d >= 1.5 * beat)) beat2Long++;
    const shape = inBar.length >= 2 ? inBar.slice(1).map((n, i) => dposOf(n.p, key) - dposOf(inBar[i].p, key)).join(',') : null;
    const cur = { rh, shape, d0: dposOf(inBar[0].p, key) };
    if (prev && prev.shape !== null && cur.shape !== null) {
      seqPairs++;
      if (prev.rh === cur.rh && prev.shape === cur.shape && prev.d0 !== cur.d0) seqs++;
    }
    prev = cur;
  }
  if (nBars >= 2) {
    f.motifs = repeated / (nBars - 1);
    f.downbeatLong = downLong / nBars;
    f.beat2Long = beat2Long / nBars;
  }
  f.sequences = seqPairs >= 2 ? seqs / seqPairs : undefined;

  // the last bar of each section (8 bars by default) with three quarter-note beats (hornpipe ending)
  if (m.beats === 4 && !m.compound) {
    const sb = (ctx.sectionBars ?? 8) * bar;
    let ends = 0;
    let three = 0;
    for (let e = start0 + sb; e <= L + bar / 2; e += sb) {
      // the bar that holds the end of the section (the next part's pickup may follow in it)
      const lb = Math.floor((Math.min(e, L) - 1) / bar) * bar;
      if (lb < bar0) continue;
      ends++;
      if ([0, 1, 2].every((q) => cellAt(lb + q * beat, beat) === 'x___')) three++;
    }
    f.threeQuarterEnd = ends ? three / ends : undefined;
  }

  // the beat of the bar where the melody's last note starts (0 = downbeat)
  f.finalBeat = Math.floor(mod(notes[notes.length - 1].s, bar) / beat);

  Object.assign(f, verseFeatures(notes, { beat, bar, pc }));
  return f;
}

/**
 * Verses: the groups of notes between two breaths (rests of an eighth or more), as a singer
 * phrases a poem (results/fado.md). Measured whatever the style; the fado rules use them.
 *   verseNotes     notes per verse (a verse of 7 syllables: about 7 to 12 notes)
 *   verseFinal     how much longer the last note of a verse is than the others (the held note)
 *   verseEndStep   share of verses that reach their last note by a falling step (the "sigh")
 *   verseTonic     share of the verses before the last one that end on the tonic (the rest is
 *                  kept for the end of the stanza; the other verses stay suspended)
 *   verseAnticip   share of verses whose held note starts off the beat (sung "early")
 *   quickRuns      runs of three or more 16ths in a row that move (two changes of pitch or more:
 *                  16ths on one repeated note are recitation, as in the refrains of the fado
 *                  scores, results/fado/partituras.md), per bar; quickRunMax the longest
 *   runsIntoLong   share of those runs that lead straight into a note of two beats or more
 */
function verseFeatures(notes, { beat, bar, pc }) {
  const f = { verseNotes: undefined, verseFinal: undefined, verseEndStep: undefined, verseAnticip: undefined, verseTonic: undefined };
  const verses = [];
  let cur = [];
  for (let i = 0; i < notes.length; i++) {
    if (i && notes[i].s - (notes[i - 1].s + notes[i - 1].d) >= 2) {
      if (cur.length >= 3) verses.push(cur);
      cur = [];
    }
    cur.push(notes[i]);
  }
  if (cur.length >= 3) verses.push(cur);
  if (verses.length >= 2) {
    let nNotes = 0;
    let ratio = 0;
    let fall = 0;
    let early = 0;
    for (const v of verses) {
      const last = v[v.length - 1];
      const before = v[v.length - 2];
      nNotes += v.length;
      ratio += Math.min(8, last.d / (v.slice(0, -1).reduce((a, n) => a + n.d, 0) / (v.length - 1)));
      const d = last.p - before.p;
      if (d < 0 && d >= -2) fall++;
      if (last.s % beat !== 0 && last.d >= beat) early++;
    }
    f.verseNotes = nNotes / verses.length;
    f.verseFinal = ratio / verses.length;
    f.verseEndStep = fall / verses.length;
    f.verseAnticip = early / verses.length;
    if (verses.length >= 3) {
      const inner = verses.slice(0, -1);
      f.verseTonic = inner.filter((v) => pc(v[v.length - 1].p) === 0).length / inner.length;
    }
  }
  // runs of 16ths (fast notes): rare in fado, and then mostly an ornament into a held note
  const span = notes[notes.length - 1].s + notes[notes.length - 1].d - notes[0].s;
  const runs = [];
  let run = 0;
  let moves = 0;
  for (let i = 0; i <= notes.length; i++) {
    const n = notes[i];
    const quick = n && n.d === 1 && (run === 0 || notes[i - 1].s + notes[i - 1].d === n.s);
    if (quick) {
      if (run > 0 && n.p !== notes[i - 1].p) moves++;
      run++;
    } else {
      if (run >= 3 && moves >= 2) runs.push({ len: run, next: n });
      run = n && n.d === 1 ? 1 : 0;
      moves = 0;
    }
  }
  f.quickRuns = runs.length / Math.max(1, span / bar);
  f.quickRunMax = runs.reduce((a, r) => Math.max(a, r.len), 0);
  f.runsIntoLong = runs.length ? runs.filter((r) => r.next && r.next.d >= 2 * beat).length / runs.length : undefined;
  return f;
}

/** Share of the beats (optionally only those at one position of the bar) with one of the figures. */
export function figureShare(f, codes, pos = null) {
  if (!f.figures) return undefined;
  const counts = pos === null ? f.figures.counts : f.figures.at[pos];
  const total = pos === null ? f.figures.total : f.figures.totalAt[pos];
  if (!total || !counts) return undefined;
  let n = 0;
  for (const c of codes) n += counts.get(c) || 0;
  return n / total;
}

/** Value of a rule's feature (plain feature, or a share of figures). */
export function ruleValue(f, r) {
  if (r.figures) return figureShare(f, r.figures, r.at ?? null);
  return f[r.feature];
}

/** 1 inside [lo, hi] (or in the allowed set), falling linearly to -1 at `tol` beyond; null if undefined. */
export function ruleScore(v, r) {
  if (v === undefined || v === null || Number.isNaN(v)) return null;
  if (r.in) return r.in.includes(v) ? 1 : -1;
  const d = v < r.lo ? r.lo - v : v > r.hi ? v - r.hi : 0;
  if (d === 0) return 1;
  return Math.max(-1, 1 - (2 * d) / (r.tol || 1));
}

/**
 * Evaluate a list of resolved rules on a melody: {score in [-1, 1], rules: [{id, value, s, w}]}.
 * Rules whose feature is undefined for this melody are left out of the mean.
 */
export function scoreRules(f, rules) {
  let acc = 0;
  let wsum = 0;
  const out = [];
  for (const r of rules) {
    const v = ruleValue(f, r);
    const s = ruleScore(v, r);
    out.push({ id: r.id, value: v, s, w: r.weight ?? 1 });
    if (s === null) continue;
    acc += (r.weight ?? 1) * s;
    wsum += r.weight ?? 1;
  }
  return { score: wsum ? acc / wsum : 0, rules: out };
}
