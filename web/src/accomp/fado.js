// Melody + decoupled accompaniment, for the fado styles (results/fado/harmonizacao.md). The genetic
// algorithm writes the melody first; then a Portuguese guitar and a viola (the steel-string
// classical guitar of fado) accompany it, as they follow a fadista:
//   * chords: dynamic programming (Viterbi) over the chords fados use, one per half bar in 4/4 or
//     per bar in 2/4. A chord is judged by how it fits the melody (the notes the melody leans on,
//     weighted by duration and beat; passing and neighbour notes off the beat are free, an
//     appoggiatura that resolves by step costs little), by the progressions of real fados
//     (harmonias.csv: i <-> V7, I7 -> iv -> V7, VII7 -> III -> VI -> V7; I-ii-V7, I7-IV, VI7-ii-V7),
//     by a slow harmonic rhythm (a chord per bar of 4/4 or two bars of 2/4; changes inside cost,
//     except near the end), and by the
//     plan of the verses (the held note of the 1st and 3rd verse over the dominant, of the 2nd
//     over the tonic, V7-i at the end);
//   * viola: bass and chord ("baixo e acorde"): in a slow 4/4 the bass on beats 1 and 3 (root,
//     then fifth) and the chord on 2 and 4; in 2/4 and in the happy fado bass and chord on every
//     beat; a bass passage by step into the next chord; the last chord held;
//   * guitarra: an introduction on the last verse of the melody, an octave up, with a "trinado"
//     on its long notes ("dar o tom"); an answer in each breath of the singer, a stepwise phrase
//     that ends next to the first note of the next verse ("remates"); a soft note of the chord
//     above the voice under its held notes; a closing arpeggio under the last note;
//   * dynamics: the answers louder than the notes under the voice, everything louder in the last
//     stanza (Sergl, F13) and in the happy fado.
// Pure: melody events (16ths, from 0) in; chords and parts out, in the piece's time, where the
// melody starts after the introduction.

const mod = (a, n) => ((a % n) + n) % n;

export const ACCOMP_PARTS = [
  { id: 'guitarra', instrument: 'guitarra' },
  { id: 'viola', instrument: 'violaFado' },
];

// chord qualities (semitones above the root)
const QUALITY = { M: [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7b5: [0, 3, 6, 10] };
// the chords of the fados (root in semitones above the tonic)
const CHORDS = {
  minor: [
    { id: 'i', root: 0, q: 'm' }, { id: 'V7', root: 7, q: '7' }, { id: 'iv', root: 5, q: 'm' },
    { id: 'I7', root: 0, q: '7' }, { id: 'VII7', root: 10, q: '7' }, { id: 'III', root: 3, q: 'M' },
    { id: 'VI', root: 8, q: 'M' }, { id: 'iiø7', root: 2, q: 'm7b5' },
  ],
  major: [
    { id: 'I', root: 0, q: 'M' }, { id: 'V7', root: 7, q: '7' }, { id: 'IV', root: 5, q: 'M' },
    { id: 'ii', root: 2, q: 'm' }, { id: 'I7', root: 0, q: '7' }, { id: 'VI7', root: 9, q: '7' },
    { id: 'II7', root: 2, q: '7' }, { id: 'vi', root: 9, q: 'm' }, { id: 'iii', root: 4, q: 'm' },
  ],
};
// how usual each change is in real fados (0..1); a change not listed costs
const MOVES = {
  minor: {
    i: { V7: 1, iv: 0.5, I7: 0.5, VI: 0.3, VII7: 0.3, III: 0.2 },
    V7: { i: 1, VI: 0.2 },
    I7: { iv: 1 },
    iv: { V7: 0.8, i: 0.5, iiø7: 0.4 },
    iiø7: { V7: 1 },
    VII7: { III: 1 },
    III: { VI: 0.6, iv: 0.3, V7: 0.3, VII7: 0.3 },
    VI: { V7: 0.8, iiø7: 0.4, iv: 0.3 },
  },
  major: {
    I: { V7: 1, IV: 0.6, ii: 0.4, I7: 0.4, vi: 0.3, iii: 0.2, VI7: 0.2 },
    V7: { I: 1, vi: 0.2 },
    IV: { V7: 0.7, I: 0.6, ii: 0.3 },
    ii: { V7: 1 },
    I7: { IV: 1 },
    VI7: { ii: 1 },
    II7: { V7: 1 },
    vi: { ii: 0.6, IV: 0.5, V7: 0.3, II7: 0.3 },
    iii: { VI7: 0.6, vi: 0.5 },
  },
};
const SCALE = { minor: [0, 2, 3, 5, 7, 8, 11], major: [0, 2, 4, 5, 7, 9, 11] };
const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const SUFFIX = { M: '', m: 'm', 7: '7', m7b5: 'ø7' };

// registers: the viola's bass and chords, the guitarra's lines
const BASS = [40, 52];
const CHORD_LOW = 53;
const GUITAR = [57, 86];

/** Bars of the introduction: one verse of the melody (two bars of 4/4, four of 2/4). */
export const introBarsFor = (meter) => (meter === '2/4' ? 4 : meter === '4/4' ? 2 : 0);

function rngOf(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

/** Notes {p, s, d} of a melody given as events. */
const notesOf = (events) => events.filter((e) => e.pitch !== null && e.pitch !== undefined).map((e) => ({ p: e.pitch, s: e.start, d: e.dur }));

/** The groups of notes between two breaths (rests of an eighth or more). */
function versesOf(notes) {
  const out = [];
  let cur = [];
  notes.forEach((n, i) => {
    if (i && n.s - (notes[i - 1].s + notes[i - 1].d) >= 2) {
      out.push(cur);
      cur = [];
    }
    cur.push(n);
  });
  if (cur.length) out.push(cur);
  return out;
}

/** Pitch classes of a chord (absolute). */
export const chordPcs = (c, tonic) => QUALITY[c.q].map((iv) => mod(tonic + c.root + iv, 12));

/**
 * Chords for a melody: [{start, dur, id, root (pitch class), q, name}] in the melody's time.
 * ctx {length, barLen, beat, key {tonic, mode}}
 */
export function harmonize(events, { length, barLen = 16, beat = 4, key = { tonic: 0, mode: 'minor' } }) {
  const mode = key.mode === 'minor' ? 'minor' : 'major';
  const tonic = key.tonic;
  const vocab = CHORDS[mode];
  const moves = MOVES[mode];
  const notes = notesOf(events);
  const slot = barLen === 16 ? 8 : barLen; // half a bar of 4/4, a whole bar of 2/4 (or of 3/4)
  const n = Math.max(1, Math.ceil(length / slot));
  const pcsOf = vocab.map((c) => new Set(chordPcs(c, tonic)));
  const isTonic = (c) => c.root === 0 && c.id !== 'I7';
  const isDom = (c) => c.root === 7;

  // fit of each chord to the melody in each slot, in [-1, 1]
  const fit = Array.from({ length: n }, () => new Array(vocab.length).fill(0));
  for (let k = 0; k < n; k++) {
    const a = k * slot;
    const b = a + slot;
    vocab.forEach((c, ci) => {
      let acc = 0;
      let wsum = 0;
      notes.forEach((nt, i) => {
        const o = Math.min(b, nt.s + nt.d) - Math.max(a, nt.s);
        if (o <= 0) return;
        const onBeat = nt.s >= a && (nt.s - a) % beat === 0;
        const w = o * (nt.s < a ? 1.2 : onBeat ? 1.5 : 0.8);
        wsum += w;
        if (pcsOf[ci].has(mod(nt.p, 12))) {
          acc += w;
          return;
        }
        const prev = notes[i - 1];
        const next = notes[i + 1];
        const stepIn = prev && Math.abs(nt.p - prev.p) <= 2 && prev.s + prev.d >= nt.s - 1;
        const stepOut = next && Math.abs(next.p - nt.p) <= 2 && nt.s + nt.d >= next.s - 1;
        const resolves = next && stepOut && pcsOf[ci].has(mod(next.p, 12));
        if (stepIn && stepOut && !onBeat) acc -= 0.1 * w; // passing or neighbour note
        else if (onBeat && resolves) acc -= 0.3 * w; // appoggiatura
        else if (stepOut && resolves) acc -= 0.4 * w;
        else acc -= w;
      });
      fit[k][ci] = wsum ? acc / wsum : 0;
    });
  }

  // the plan of the verses: where each verse's held note sits
  const plan = Array.from({ length: n }, () => new Array(vocab.length).fill(0));
  const verses = versesOf(notes);
  verses.forEach((v, j) => {
    const last = v[v.length - 1];
    const k = Math.min(n - 1, Math.floor(last.s / slot));
    const final = j === verses.length - 1;
    vocab.forEach((c, ci) => {
      if (final) plan[k][ci] += isTonic(c) ? 2 : -2;
      else if (j % 2 === 0) plan[k][ci] += isDom(c) ? 0.8 : ['VII7', 'iiø7', 'iv', 'II7', 'IV'].includes(c.id) ? 0.3 : isTonic(c) ? -0.4 : 0;
      else plan[k][ci] += isTonic(c) ? 0.8 : c.id === 'III' ? 0.2 : 0;
    });
  });
  // the piece ends V7 - i: the slot before the last leans to the dominant
  vocab.forEach((c, ci) => {
    plan[n - 1][ci] += isTonic(c) ? 1.5 : -1.5;
    if (n >= 2) plan[n - 2][ci] += isDom(c) ? 0.6 : 0;
    plan[0][ci] += isTonic(c) ? 1 : 0;
  });

  const move = (a, b) => {
    if (a === b) return 0.4;
    const w = moves[vocab[a].id]?.[vocab[b].id];
    return w ? 1.5 * w - 0.5 : -2;
  };
  // the harmonic rhythm: a chord lasts a bar of 4/4 or two of 2/4 (Vieira: two bars of 2/4);
  // changing in the middle of that costs, except near the end, where the cadence speeds it up
  const halfBar = (k) => (slot * k) % 16 !== 0;
  const nearEnd = (k) => (n - k) * slot <= 2 * barLen;

  // Viterbi
  let best = vocab.map((_, ci) => 2 * fit[0][ci] + plan[0][ci]);
  const back = [];
  for (let k = 1; k < n; k++) {
    const row = [];
    const nb = vocab.map((_, ci) => {
      let bv = -Infinity;
      let bi = 0;
      vocab.forEach((__, pi) => {
        let v = best[pi] + move(pi, ci);
        if (pi !== ci && halfBar(k)) v -= nearEnd(k) ? 0.1 : 1;
        if (v > bv) {
          bv = v;
          bi = pi;
        }
      });
      row.push(bi);
      return bv + 2 * fit[k][ci] + plan[k][ci];
    });
    back.push(row);
    best = nb;
  }
  let ci = best.indexOf(Math.max(...best));
  const seq = [ci];
  for (let k = n - 1; k > 0; k--) {
    ci = back[k - 1][ci];
    seq.unshift(ci);
  }
  const chords = [];
  seq.forEach((c, k) => {
    const start = k * slot;
    const dur = Math.min(slot, length - start);
    const last = chords[chords.length - 1];
    if (last && last.ci === c) last.dur += dur;
    else {
      const ch = vocab[c];
      const root = mod(tonic + ch.root, 12);
      chords.push({ ci: c, start, dur, id: ch.id, root, q: ch.q, pcs: chordPcs(ch, tonic), name: NAMES[root] + SUFFIX[ch.q] });
    }
  });
  return chords.map(({ ci: _, ...c }) => c);
}

// ------------------------------------------------------------------ parts

const inRange = (p, [lo, hi]) => {
  let q = p;
  while (q < lo) q += 12;
  while (q > hi) q -= 12;
  return q;
};
/** The pitch of pitch class `pc` nearest to `p`. */
const nearestPc = (pc, p) => {
  const d = mod(pc - p, 12);
  return d <= 6 ? p + d : p + d - 12;
};
/** The note `steps` scale steps away from `p` (in the key's scale; p is moved onto it first). */
function scaleStep(p, steps, tonic, mode) {
  const sc = SCALE[mode];
  const inScale = (q) => sc.includes(mod(q - tonic, 12));
  let q = p;
  while (!inScale(q)) q -= 1;
  const dir = Math.sign(steps);
  for (let k = 0; k < Math.abs(steps); k++) {
    q += dir;
    while (!inScale(q)) q += dir;
  }
  return q;
}

/** A closed chord for the viola from CHORD_LOW up: 3rd, 5th, 7th (or root) of the chord. */
function voicing(c) {
  const order = c.q === '7' || c.q === 'm7b5' ? [1, 2, 3] : [0, 1, 2];
  const pcs = order.map((i) => c.pcs[i]);
  const out = [];
  let floor = CHORD_LOW;
  for (const pc of pcs) {
    const p = floor + mod(pc - floor, 12);
    out.push(p);
    floor = p + 1;
  }
  return out;
}

const x = (vel) => ({ vel, shape: null, end: 1, accent: false, pain: false, vib: 0 });

/**
 * The accompaniment of a melody: {intro (16ths before the voice), chords (in the piece's time),
 * parts: {guitarra: events, viola: events}} — events {pitch, start, dur, x} in the piece's time.
 * ctx {length, barLen, beat, meter, key {tonic, mode}, kind: 'sad' | 'happy', seed}
 */
export function fadoAccompaniment(events, ctx) {
  const { length, barLen = 16, beat = 4, meter = barLen === 8 ? '2/4' : '4/4', key = { tonic: 0, mode: 'minor' }, kind = 'sad', seed = 1 } = ctx;
  const mode = key.mode === 'minor' ? 'minor' : 'major';
  const tonic = key.tonic;
  const rand = rngOf(seed * 7919 + 13);
  const melody = harmonize(events, { length, barLen, beat, key });
  const notes = notesOf(events);
  const verses = versesOf(notes);
  const loud = kind === 'happy' ? 0.06 : 0;
  const lastStanza = length - Math.min(length / 2, 8 * 16);

  // introduction: the last verse (as many bars as one verse) an octave up
  const introBars = length >= 4 * barLen ? introBarsFor(meter) : 0;
  const intro = introBars * barLen;
  const src = length - intro;
  const chords = [
    ...melody.filter((c) => c.start + c.dur > src).map((c) => ({ ...c, start: Math.max(0, c.start - src), dur: c.start + c.dur - Math.max(src, c.start) })),
    ...melody.map((c) => ({ ...c, start: c.start + intro })),
  ];
  const total = intro + length;
  const chordAt = (t) => chords.find((c) => c.start <= t && t < c.start + c.dur) ?? chords[chords.length - 1];

  const guitarra = [];
  if (intro) {
    const part = notes.filter((nt) => nt.s >= src);
    const hi = Math.max(...part.map((nt) => nt.p));
    const up = hi + 12 <= GUITAR[1] ? 12 : 0;
    for (const nt of part) {
      const p = nt.p + up;
      const s = nt.s - src;
      const d = Math.min(nt.d, intro - s);
      if (d <= 0) continue;
      if (d >= 2 * beat) {
        // the trinado: the note struck again quickly before it is held
        guitarra.push({ pitch: p, start: s, dur: 1, x: x(0.62 + loud) }, { pitch: p, start: s + 1, dur: 1, x: x(0.6 + loud) }, { pitch: p, start: s + 2, dur: d - 2, x: x(0.58 + loud) });
      } else guitarra.push({ pitch: p, start: s, dur: d, x: x(0.6 + loud) });
    }
  }

  // answers in the breaths, and a soft note above the voice under its held notes
  verses.forEach((v, j) => {
    const held = v[v.length - 1];
    const next = verses[j + 1]?.[0];
    if (held.d >= 2 * beat && next) {
      const c = chordAt(intro + held.s + beat);
      const target = held.p + 4;
      const pc = c.pcs.slice().sort((a, b) => Math.abs(nearestPc(a, target) - target) - Math.abs(nearestPc(b, target) - target)).find((q) => mod(q - held.p, 12) !== 0);
      const p = inRange(nearestPc(pc, target), GUITAR);
      if (p !== held.p) guitarra.push({ pitch: p, start: intro + held.s + beat, dur: held.d - beat, x: x(0.36 + loud) });
    }
    if (!next) return;
    const a = held.s + held.d;
    const gap = next.s - a;
    if (gap < beat) return;
    const count = Math.min(8, Math.floor(gap / 2));
    const target = inRange(next.p + 12, GUITAR);
    const dir = target > (GUITAR[0] + GUITAR[1]) / 2 || rand() < 0.5 ? 1 : -1;
    const loudness = (intro + a >= lastStanza + intro ? 0.08 : 0) + 0.62 + loud;
    const line = [];
    for (let i = 0; i < count; i++) line.push(scaleStep(target, -dir * (count - i), tonic, mode));
    // the first note on a note of the chord
    const c = chordAt(intro + a);
    line[0] = nearestPc(c.pcs.slice().sort((p, q) => Math.abs(nearestPc(p, line[0]) - line[0]) - Math.abs(nearestPc(q, line[0]) - line[0]))[0], line[0]);
    let t = intro + a;
    line.forEach((p, i) => {
      const q = inRange(p, GUITAR);
      if (i === 0 && count >= 4) {
        guitarra.push({ pitch: q, start: t, dur: 1, x: x(loudness) }, { pitch: q, start: t + 1, dur: 1, x: x(loudness - 0.04) });
      } else guitarra.push({ pitch: q, start: t, dur: 2, x: x(loudness - 0.02 * (i % 2)) });
      t += 2;
    });
  });
  // the close: under the last held note, the tonic chord falling to the tonic
  const lastNote = notes[notes.length - 1];
  if (lastNote && lastNote.d >= 2 * beat) {
    const c = chordAt(intro + lastNote.s);
    const arp = [c.pcs[2], c.pcs[1], c.pcs[0]];
    let p = inRange(lastNote.p + 12, GUITAR);
    let t = intro + lastNote.s + beat;
    const end = intro + lastNote.s + lastNote.d;
    arp.forEach((pc, i) => {
      if (t >= end) return;
      p = i ? p - mod(p - pc, 12) || p - 12 : nearestPc(pc, p);
      const d = i === arp.length - 1 ? end - t : Math.min(2, end - t);
      guitarra.push({ pitch: inRange(p, GUITAR), start: t, dur: d, x: x(0.48 + loud) });
      t += d;
    });
  }

  // viola: bass and chord
  const viola = [];
  const bassOf = (pc) => inRange(pc, BASS);
  const everyBeat = kind === 'happy' || barLen !== 16;
  for (const [ci, c] of chords.entries()) {
    const nextC = chords[ci + 1];
    const root = bassOf(c.root);
    const fifth = inRange(root + 7, BASS);
    let bassTurn = 0;
    const end = c.start + c.dur;
    const final = !nextC;
    for (let t = c.start; t < end; t += beat) {
      const pos = mod(t, barLen) / beat;
      const stanza = t >= lastStanza + intro ? 0.08 : 0;
      const lastBeat = nextC && t + beat === end;
      if (final && mod(t, barLen) === 0 && end - t <= barLen) {
        // the last chord: bass and chord together, held
        viola.push({ pitch: root, start: t, dur: end - t, x: x(0.56 + loud + stanza) });
        for (const p of voicing(c)) viola.push({ pitch: p, start: t, dur: end - t, x: x(0.46 + loud + stanza) });
        break;
      }
      const target = nextC ? bassOf(nextC.root) : root;
      const walk = lastBeat && Math.abs(target - (bassTurn % 2 ? fifth : root)) >= 3;
      if (walk && (everyBeat || pos % 2 === 1)) {
        // a bass passage: the two scale steps before the next root
        const dir = Math.sign(target - root) || 1;
        const w1 = scaleStep(target, -2 * dir, tonic, mode);
        const w2 = scaleStep(target, -dir, tonic, mode);
        viola.push({ pitch: inRange(w1, BASS), start: t, dur: beat / 2, x: x(0.5 + loud + stanza) }, { pitch: inRange(w2, BASS), start: t + beat / 2, dur: beat / 2, x: x(0.5 + loud + stanza) });
        continue;
      }
      if (everyBeat) {
        viola.push({ pitch: bassTurn++ % 2 ? fifth : root, start: t, dur: beat / 2, x: x(0.52 + loud + stanza) });
        for (const p of voicing(c)) viola.push({ pitch: p, start: t + beat / 2, dur: beat / 2, x: x(0.42 + loud + stanza) });
      } else if (pos % 2 === 0) {
        viola.push({ pitch: bassTurn++ % 2 ? fifth : root, start: t, dur: beat, x: x(0.52 + loud + stanza) });
      } else {
        for (const p of voicing(c)) viola.push({ pitch: p, start: t, dur: beat, x: x(0.42 + loud + stanza) });
      }
    }
  }
  const clip = (evs) => evs.filter((e) => e.dur > 0 && e.start < total).map((e) => ({ ...e, dur: Math.min(e.dur, total - e.start) })).sort((a, b) => a.start - b.start || a.pitch - b.pitch);
  return { intro, total, chords, melodyChords: melody, parts: { guitarra: clip(guitarra), viola: clip(viola) } };
}
