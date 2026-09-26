// Building blocks learned from real melodies (tools/build_blocks.mjs -> src/data/blocks-data.js).
//
// A block is one beat (four 16ths): its rhythm cell ('x' onset, '-' held, '.' rest) and the
// contour inside the beat in scale steps (e.g. "x-x-|+1": two eighths, the second a step up).
// Blocks are transposable: the same block works in any key and register.
// The model keeps
//   * which block tends to follow which, by position in the bar (strong / middle / weak beat),
//   * the interval into each block from the previous note, given the scale degree and the beat
//     (tonal tendencies: the leading tone rises, the 4th falls, leaps on strong beats...),
//   * association rules: "if block A is in a melody, block B is there with probability p"
//     (lift = how much more often than by chance), mined from whole melodies,
//   * how the melodies of the corpus begin (first degree, first blocks).
// It is used three ways: to write initial individuals, as a mutation that rewrites one beat,
// and as a fitness rule ("idiom") that asks for the melody to be as idiomatic as a typical
// real melody (not more: the most probable blocks alone make every melody sound the same).

import { REST, HOLD, isNote, geneToMidi, midiToGene, clampGene } from '../core/score.js';

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const MINOR_H = [0, 2, 3, 5, 7, 8, 11]; // generation in minor uses the leading tone
const mod = (a, n) => ((a % n) + n) % n;

/** Diatonic position of a MIDI pitch in a key (chromatic notes fall to the degree below). */
export function dposOf(midi, key) {
  const steps = key.mode === 'minor' ? MINOR : MAJOR;
  const rel = midi - 60 - key.tonic;
  const oct = Math.floor(rel / 12);
  const s = mod(rel, 12);
  let d = 0;
  for (let i = 0; i < 7; i++) if (steps[i] <= s) d = i;
  return oct * 7 + d;
}

export function midiOf(dpos, key) {
  const steps = key.mode === 'minor' ? MINOR_H : MAJOR;
  return 60 + key.tonic + 12 * Math.floor(dpos / 7) + steps[mod(dpos, 7)];
}

export const strengthOf = (beatInBar, beatsPerBar) => (beatInBar === 0 ? 's' : beatsPerBar === 4 && beatInBar === 2 ? 'm' : 'w');
const clip = (x, a) => Math.max(-a, Math.min(a, x));
const sign = (x) => (x >= 0 ? `+${x}` : `${x}`);

/**
 * Beats of a melody given as a sounding line.
 * @param pitch (MIDI|null)[] per 16th, onset boolean[] per 16th
 * @returns [{cell, contour, id, entry, prevDeg, pos, dpos: [...]}]
 */
export function lineToBeats(pitch, onset, { barLen = 16, pickup = 0, key }) {
  const beatsPerBar = barLen / 4;
  const beats = [];
  let prevD = null;
  let t0 = mod(pickup, 4);
  for (let t = t0; t + 4 <= pitch.length; t += 4) {
    let cell = '';
    const ds = [];
    for (let k = 0; k < 4; k++) {
      const s = t + k;
      if (pitch[s] === null || pitch[s] === undefined) cell += '.';
      else if (onset[s]) {
        cell += 'x';
        ds.push(dposOf(pitch[s], key));
      } else cell += '-';
    }
    const contour = ds.slice(1).map((d, i) => sign(clip(d - ds[i], 5))).join('');
    const beatInBar = mod(Math.round((t - pickup) / 4), beatsPerBar);
    beats.push({
      cell,
      contour,
      id: `${cell}|${contour}`,
      entry: ds.length && prevD !== null ? clip(ds[0] - prevD, 9) : null,
      prevDeg: prevD === null ? -1 : mod(prevD, 7),
      pos: strengthOf(beatInBar, beatsPerBar),
      dpos: ds,
    });
    if (ds.length) prevD = ds[ds.length - 1];
  }
  return beats;
}

export function genesToLine(genes) {
  const pitch = [];
  const onset = [];
  let cur = null;
  for (const g of genes) {
    if (g === REST) cur = null;
    else if (g !== HOLD) cur = geneToMidi(g);
    pitch.push(cur);
    onset.push(isNote(g));
  }
  return { pitch, onset };
}

export function compactToLine(events) {
  const pitch = [];
  const onset = [];
  for (const [p, d] of events) for (let k = 0; k < d; k++) {
    pitch.push(p < 0 ? null : p);
    onset.push(p >= 0 && k === 0);
  }
  return { pitch, onset };
}

// ------------------------------------------------------------------ model (runtime)

/** Wraps the learned tables with lookups, smoothing and scores. */
export function createBlockModel(data) {
  const vocab = new Set(data.blocks.map((b) => b[0]));
  const classOf = (id, cell) => (vocab.has(id) ? id : `?|${cell}`);
  const uni = {};
  for (const [pos, list] of Object.entries(data.uni)) {
    const tot = list.reduce((a, [, c]) => a + c, 0);
    uni[pos] = new Map(list.map(([id, c]) => [id, c / tot]));
  }
  const trans = {};
  for (const [pos, rows] of Object.entries(data.trans)) {
    trans[pos] = new Map(Object.entries(rows).map(([prev, list]) => {
      const tot = list.reduce((a, [, c]) => a + c, 0) + (data.transOther?.[pos]?.[prev] ?? 0);
      return [prev, { tot, next: new Map(list.map(([id, c]) => [id, c / tot])) }];
    }));
  }
  const assoc = new Map(Object.entries(data.assoc).map(([a, list]) => [a, new Map(list.map(([b, lift]) => [b, lift]))]));
  const entry = {};
  for (const [k, row] of Object.entries(data.entry)) {
    const tot = Object.values(row).reduce((a, b) => a + b, 0);
    entry[k] = { tot, p: row };
  }
  const floor = 1e-4;

  /** P(block | previous block, position): interpolated with the position's unigram. */
  function pBlock(prev, id, pos) {
    const u = uni[pos]?.get(id) ?? 0;
    const row = trans[pos]?.get(prev);
    const t = row?.next.get(id) ?? 0;
    const lam = row ? row.tot / (row.tot + 20) : 0;
    return Math.max(floor, lam * t + (1 - lam) * u);
  }
  /** P(interval into the block | degree of the previous note, position). */
  function pEntry(prevDeg, pos, iv) {
    const row = entry[`${prevDeg}${pos}`];
    if (!row) return 0.05;
    return ((row.p[iv] ?? 0) + 0.2) / (row.tot + 0.2 * 19);
  }
  const lift = (a, b) => assoc.get(a)?.get(b) ?? 1;

  /** Mean log-probability per beat (blocks and entries), and association coherence. */
  const degTot = Object.values(data.firstDeg).reduce((a, b) => a + b, 0);
  function score(beats, key = null) {
    let lp = 0;
    let n = 0;
    // how the melody begins counts like one more beat
    const first = beats.find((b) => b.dpos.length);
    if (first) {
      lp += Math.log(((data.firstDeg[((first.dpos[0] % 7) + 7) % 7] ?? 0) + 1) / (degTot + 7));
      n++;
    }
    let prev = '^';
    const used = [];
    for (const b of beats) {
      const id = classOf(b.id, b.cell);
      lp += Math.log(pBlock(prev, id, b.pos));
      if (b.entry !== null) lp += Math.log(pEntry(b.prevDeg, b.pos, b.entry));
      n++;
      prev = id;
      if (!used.includes(id)) used.push(id);
    }
    let coh = 0;
    let pairs = 0;
    for (let i = 0; i < used.length; i++) for (let j = 0; j < used.length; j++) {
      if (i === j) continue;
      const l = assoc.get(used[i])?.get(used[j]);
      if (l !== undefined) coh += Math.log(l);
      pairs++;
    }
    return { logp: n ? lp / n : -20, coherence: pairs ? coh / pairs : 0 };
  }

  /** Fitness part in [-1, 1]: 0 at the corpus P10, 1 from the corpus median up (no reward beyond). */
  function idiomPart(genes, key) {
    const line = genesToLine(genes);
    const beats = lineToBeats(line.pitch, line.onset, { barLen: 16, key });
    const s = score(beats);
    const st = data.stats;
    const a = Math.max(-1, Math.min(1, (s.logp - st.logp.p10) / (st.logp.p50 - st.logp.p10)));
    const b = Math.max(-1, Math.min(1, (s.coherence - st.coherence.p10) / Math.max(1e-6, st.coherence.p50 - st.coherence.p10)));
    return 0.75 * a + 0.25 * b;
  }

  return { data, vocab, classOf, pBlock, pEntry, lift, score, idiomPart, assoc };
}

// ------------------------------------------------------------------ writing with blocks

const cellOfId = (id) => id.split('|')[0];
const contourOfId = (id) => {
  const c = id.split('|')[1] ?? '';
  return c.match(/[+-]\d+/g)?.map(Number) ?? [];
};

function sampleWeighted(rng, items, weights) {
  let tot = 0;
  for (const w of weights) tot += w;
  let r = rng.float() * tot;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Candidate blocks after `prev` at `pos`, weighted by the transition probabilities and by the
 * association rules with the blocks already used ("if A is here, B is likely").
 */
function nextBlock(model, prev, pos, used, rng, gamma = 0.5) {
  const cands = new Map();
  const row = model.data.trans[pos]?.[prev];
  for (const [id] of row ?? []) cands.set(id, 0);
  for (const [id] of model.data.uni[pos] ?? []) cands.set(id, 0);
  const ids = [...cands.keys()];
  const w = ids.map((id) => {
    let p = model.pBlock(prev, id, pos);
    let boost = 1;
    for (const a of used) boost *= model.lift(a, id);
    return p * Math.min(4, Math.max(0.25, boost)) ** gamma;
  });
  return sampleWeighted(rng, ids, w);
}

/** Pitch of the first note of a block: entry-interval model x attraction of the waves x range. */
function entryPitch(model, env, prevD, pos, step, rng) {
  const key = env.key;
  const cands = [];
  const w = [];
  for (let iv = -7; iv <= 7; iv++) {
    const d = prevD + iv;
    const m = midiOf(d, key);
    if (m < env.lowMidi || m > env.highMidi) continue;
    let att = 0;
    for (const wave of env.waves) att = Math.max(att, Math.exp(-((m - wave[step]) ** 2) / (2 * (env.basin ?? 3) ** 2)));
    cands.push(d);
    w.push(model.pEntry(mod(prevD, 7), pos, iv) * (0.15 + att));
  }
  return cands.length ? sampleWeighted(rng, cands, w) : prevD;
}

function startDegree(model, env, rng) {
  const key = env.key;
  const degs = Object.keys(model.data.firstDeg).map(Number);
  const deg = sampleWeighted(rng, degs, degs.map((d) => model.data.firstDeg[d]));
  // the octave closest to the first wave value
  const target = env.waves[0][0];
  let best = deg;
  for (let o = -3; o <= 3; o++) {
    const d = o * 7 + deg;
    if (Math.abs(midiOf(d, key) - target) < Math.abs(midiOf(best, key) - target)) best = d;
  }
  return best;
}

/** Writes beats [from, to) of `genes` with blocks, continuing from what is before `from`. */
function writeBeats(model, env, genes, from, to, rng, used) {
  const bpb = env.stepsPerBar / 4;
  const line = genesToLine(genes);
  let prevD = null;
  for (let s = from * 4 - 1; s >= 0; s--) if (line.pitch[s] !== null && line.onset[s]) {
    prevD = dposOf(line.pitch[s], env.key);
    break;
  }
  const before = from > 0 ? lineToBeats(line.pitch.slice(0, from * 4), line.onset.slice(0, from * 4), { barLen: env.stepsPerBar, key: env.key }) : [];
  let prev = before.length ? model.classOf(before[before.length - 1].id, before[before.length - 1].cell) : '^';
  let sounding = from > 0 && line.pitch[from * 4 - 1] !== null;
  for (let b = from; b < to; b++) {
    const pos = strengthOf(b % bpb, bpb);
    let id = nextBlock(model, prev, pos, used, rng);
    let cell = cellOfId(id);
    if (id.startsWith('?|')) id = cell + '|'; // rhythm class only: contour chosen freely below
    const contour = contourOfId(id);
    let k = 0;
    let d = prevD;
    for (let i = 0; i < 4; i++) {
      const s = b * 4 + i;
      const ch = cell[i];
      if (ch === 'x') {
        if (k === 0) d = prevD === null ? startDegree(model, env, rng) : entryPitch(model, env, prevD, pos, s, rng);
        else d += contour[k - 1] ?? (rng.chance(0.5) ? 1 : -1);
        let m = midiOf(d, env.key);
        while (m > env.highMidi) (d -= 7), (m = midiOf(d, env.key));
        while (m < env.lowMidi) (d += 7), (m = midiOf(d, env.key));
        genes[s] = clampGene(midiToGene(m));
        prevD = d;
        sounding = true;
        k++;
      } else if (ch === '-') genes[s] = sounding ? HOLD : REST;
      else {
        genes[s] = REST;
        sounding = false;
      }
    }
    if (!used.includes(prev) && prev !== '^') used.push(prev);
    prev = model.classOf(id, cell);
  }
  if (genes[0] === HOLD) genes[0] = REST;
  return genes;
}

/** A whole initial individual written with the corpus blocks. */
export function blockGenome(model, env, rng) {
  const genes = new Array(env.length).fill(REST);
  return writeBeats(model, env, genes, 0, env.length / 4, rng, []);
}

/** Mutation: rewrite one or two beats with blocks that fit what comes before (and the rest of the piece). */
export function blockMutate(model, genes, env, rng) {
  const beats = env.length / 4;
  const from = rng.int(0, beats - 1);
  const to = Math.min(beats, from + (rng.chance(0.3) ? 2 : 1));
  const line = genesToLine(genes);
  const used = [...new Set(lineToBeats(line.pitch, line.onset, { barLen: env.stepsPerBar, key: env.key }).map((b) => model.classOf(b.id, b.cell)))];
  const next = to * 4 < genes.length ? genes[to * 4] : null;
  writeBeats(model, env, genes, from, to, rng, used);
  // a held note after the rewritten beats needs a note to hold
  if (next === HOLD && to * 4 < genes.length && !isNote(genes[to * 4 - 1]) && genes[to * 4 - 1] !== HOLD) genes[to * 4] = REST;
  return genes;
}

// ------------------------------------------------------------------ readable names

const DUR = { 1: 'sc', 2: '♪', 3: '♪.', 4: '♩' };
export function rhythmText(cell) {
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

/** "♪ ♪ · sobe 1" */
export function describeBlock(id) {
  const [cell, contour] = id.split('|');
  if (id.startsWith('?')) return `${rhythmText(contour)} (outro contorno)`;
  const steps = contour ? contour.match(/[+-]\d+/g) : null;
  const c = steps ? ` · ${steps.map((x) => (Number(x) === 0 ? 'repete' : `${Number(x) > 0 ? 'sobe' : 'desce'} ${Math.abs(Number(x))}`)).join(', ')}` : '';
  return `${rhythmText(cell)}${c}`;
}
