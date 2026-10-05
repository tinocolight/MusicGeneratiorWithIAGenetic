// The harmony a melody implies, for any style (results/acompanhamento.md): the chords that fit it,
// chosen by dynamic programming (Viterbi) over a vocabulary of chords, as a hidden Markov model
// harmonises a melody (Yeh et al. 2021; results/fado/harmonizacao.md, section 1):
//   * the fit of a chord to the melody in each slot: the notes the melody leans on (long notes,
//     notes on the beat) are notes of the chord; passing and neighbour notes off the beat are free,
//     an appoggiatura that resolves by step costs little;
//   * the usual progressions, after Piston's table of usual root progressions (Harmony, 1941):
//     I goes to IV or V, sometimes vi, less often ii or iii; ii to V; iii to vi; IV to V, sometimes
//     I or ii; V to I, sometimes vi; vi to ii or V; a secondary dominant to its chord;
//   * a slow harmonic rhythm (a chord per bar, or per half bar of 4/4 at a cost), faster at the
//     cadence;
//   * the cadences: phrases that end alternately on the dominant (half cadence) and on the tonic,
//     the piece that ends V–I.
// The fado (src/accomp/fado.js) uses the same machinery with its own chords, progressions and plan;
// the blues has its twelve-bar form instead (bluesChords).

export const mod = (a, n) => ((a % n) + n) % n;

// chord qualities (semitones above the root)
export const QUALITY = { M: [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7b5: [0, 3, 6, 10], dim7: [0, 3, 6, 9] };
export const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
export const SUFFIX = { M: '', m: 'm', 7: '7', m7b5: 'ø7', dim7: '°7' };
export const SCALE = { minor: [0, 2, 3, 5, 7, 8, 11], major: [0, 2, 4, 5, 7, 9, 11] };

/** Pitch classes of a chord {root (above the tonic), q} in a key with this tonic. */
export const chordPcs = (c, tonic) => QUALITY[c.q].map((iv) => mod(tonic + c.root + iv, 12));

/** Notes {p, s, d} of a melody given as events. */
export const notesOf = (events) => events.filter((e) => e.pitch !== null && e.pitch !== undefined).map((e) => ({ p: e.pitch, s: e.start, d: e.dur }));

/** The groups of notes between two breaths (rests of `breath` 16ths or more). */
export function phrasesOfNotes(notes, breath = 2) {
  const out = [];
  let cur = [];
  notes.forEach((n, i) => {
    if (i && n.s - (notes[i - 1].s + notes[i - 1].d) >= breath) {
      out.push(cur);
      cur = [];
    }
    cur.push(n);
  });
  if (cur.length) out.push(cur);
  return out;
}

/** How well each chord fits the melody in each slot, in [-1, 1]: fit[slot][chord]. */
export function chordFit(notes, { n, slot, beat, pcsOf }) {
  const fit = Array.from({ length: n }, () => new Array(pcsOf.length).fill(0));
  for (let k = 0; k < n; k++) {
    const a = k * slot;
    const b = a + slot;
    pcsOf.forEach((pcs, ci) => {
      let acc = 0;
      let wsum = 0;
      notes.forEach((nt, i) => {
        const o = Math.min(b, nt.s + nt.d) - Math.max(a, nt.s);
        if (o <= 0) return;
        const onBeat = nt.s >= a && (nt.s - a) % beat === 0;
        const w = o * (nt.s < a ? 1.2 : onBeat ? 1.5 : 0.8);
        wsum += w;
        if (pcs.has(mod(nt.p, 12))) {
          acc += w;
          return;
        }
        const prev = notes[i - 1];
        const next = notes[i + 1];
        const stepIn = prev && Math.abs(nt.p - prev.p) <= 2 && prev.s + prev.d >= nt.s - 1;
        const stepOut = next && Math.abs(next.p - nt.p) <= 2 && nt.s + nt.d >= next.s - 1;
        const resolves = next && stepOut && pcs.has(mod(next.p, 12));
        if (stepIn && stepOut && !onBeat) acc -= 0.1 * w; // passing or neighbour note
        else if (onBeat && resolves) acc -= 0.3 * w; // appoggiatura
        else if (stepOut && resolves) acc -= 0.4 * w;
        else acc -= w;
      });
      fit[k][ci] = wsum ? acc / wsum : 0;
    });
  }
  return fit;
}

/**
 * The best chord sequence (Viterbi) and the chords it makes, merged where a chord goes on:
 * [{start, dur, id, root (pitch class), q, pcs, name}].
 * @param o {length, slot, tonic, vocab [{id, root, q}], moves {id: {id: 0..1}}, fit, plan (bonus per
 *   slot and chord), changeCost(k) (cost of a change at slot k)}
 */
export function viterbiChords({ length, slot, tonic, vocab, moves, fit, plan, changeCost = () => 0 }) {
  const n = fit.length;
  const move = (a, b) => {
    if (a === b) return 0.4;
    const w = moves[vocab[a].id]?.[vocab[b].id];
    return w ? 1.5 * w - 0.5 : -2;
  };
  let best = vocab.map((_, ci) => 2 * fit[0][ci] + plan[0][ci]);
  const back = [];
  for (let k = 1; k < n; k++) {
    const row = [];
    const cost = changeCost(k);
    const nb = vocab.map((_, ci) => {
      let bv = -Infinity;
      let bi = 0;
      vocab.forEach((__, pi) => {
        let v = best[pi] + move(pi, ci);
        if (pi !== ci) v -= cost;
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
  return chordsOfSequence(seq.map((c) => vocab[c]), slot, length, tonic);
}

/** Chords from one chord per slot, merged where the same chord goes on. */
export function chordsOfSequence(seq, slot, length, tonic) {
  const chords = [];
  seq.forEach((ch, k) => {
    const start = k * slot;
    if (start >= length) return;
    const dur = Math.min(slot, length - start);
    const last = chords[chords.length - 1];
    if (last && last.id === ch.id) last.dur += dur;
    else {
      const root = mod(tonic + ch.root, 12);
      chords.push({ start, dur, id: ch.id, root, q: ch.q, pcs: chordPcs(ch, tonic), name: NAMES[root] + SUFFIX[ch.q] });
    }
  });
  return chords;
}

// ------------------------------------------------------------------ the general vocabularies

const C = (id, root, q) => ({ id, root, q });
// simple: the three primary chords and the relative (children's songs, the first harmonies)
// folk: + the natural-minor VII and III of folk tunes; dance: + the secondary dominants of the
// dances and songs of the 19th century (V/V, V/IV, V/ii) and the diminished seventh
export const VOCABS = {
  simple: {
    major: [C('I', 0, 'M'), C('IV', 5, 'M'), C('V7', 7, '7'), C('ii', 2, 'm'), C('vi', 9, 'm')],
    minor: [C('i', 0, 'm'), C('iv', 5, 'm'), C('V7', 7, '7'), C('VI', 8, 'M'), C('III', 3, 'M')],
  },
  folk: {
    major: [C('I', 0, 'M'), C('IV', 5, 'M'), C('V7', 7, '7'), C('ii', 2, 'm'), C('vi', 9, 'm'), C('iii', 4, 'm'), C('bVII', 10, 'M')],
    minor: [C('i', 0, 'm'), C('iv', 5, 'm'), C('V7', 7, '7'), C('VI', 8, 'M'), C('III', 3, 'M'), C('VII', 10, 'M'), C('v', 7, 'm')],
  },
  dance: {
    major: [C('I', 0, 'M'), C('IV', 5, 'M'), C('V7', 7, '7'), C('ii', 2, 'm'), C('vi', 9, 'm'), C('II7', 2, '7'), C('I7', 0, '7'), C('VI7', 9, '7'), C('vii°7', 11, 'dim7')],
    minor: [C('i', 0, 'm'), C('iv', 5, 'm'), C('V7', 7, '7'), C('VI', 8, 'M'), C('III', 3, 'M'), C('iiø7', 2, 'm7b5'), C('I7', 0, '7'), C('VII7', 10, '7'), C('vii°7', 11, 'dim7')],
  },
};
// Piston's table: 1 "is followed by", 0.5 "sometimes", 0.2 "less often"; the secondary dominants
// go to their chord
export const MOVES = {
  major: {
    I: { IV: 1, V7: 1, vi: 0.5, ii: 0.2, iii: 0.2, I7: 0.4, II7: 0.2, VI7: 0.2, bVII: 0.3, 'vii°7': 0.2 },
    ii: { V7: 1, IV: 0.5, vi: 0.5, I: 0.2, iii: 0.2 },
    iii: { vi: 1, IV: 0.5, I: 0.2, ii: 0.2, V7: 0.2, VI7: 0.4 },
    IV: { V7: 1, I: 0.5, ii: 0.5, iii: 0.2, vi: 0.2, II7: 0.3, 'vii°7': 0.3 },
    V7: { I: 1, IV: 0.3, vi: 0.5, ii: 0.2, iii: 0.2 },
    vi: { ii: 1, V7: 1, iii: 0.5, IV: 0.5, I: 0.2, II7: 0.4 },
    II7: { V7: 1 },
    I7: { IV: 1 },
    VI7: { ii: 1 },
    'vii°7': { I: 1 },
    bVII: { I: 0.8, IV: 0.6 },
  },
  minor: {
    i: { iv: 1, V7: 1, VI: 0.5, III: 0.2, iiø7: 0.2, VII: 0.4, VII7: 0.3, I7: 0.3, v: 0.4, 'vii°7': 0.2 },
    iiø7: { V7: 1, iv: 0.5 },
    III: { VI: 1, iv: 0.5, VII: 0.4, i: 0.2 },
    iv: { V7: 1, i: 0.5, iiø7: 0.5, VII: 0.4, v: 0.3, 'vii°7': 0.3 },
    V7: { i: 1, VI: 0.5, iv: 0.3 },
    v: { i: 0.6, VI: 0.6, iv: 0.5 },
    VI: { V7: 1, iiø7: 0.6, iv: 0.6, III: 0.5, VII: 0.4 },
    VII: { III: 1, i: 0.5, VI: 0.3 },
    VII7: { III: 1 },
    I7: { iv: 1 },
    'vii°7': { i: 1 },
  },
};

/**
 * The slot of the harmonic rhythm in a meter: a bar, or half a bar of 4/4 and 12/8 (a change in its
 * middle costs, except in the cadence).
 */
export const slotOf = (barLen) => (barLen === 16 || barLen === 24 ? barLen / 2 : barLen);

/**
 * The chords a melody implies, in its own time: [{start, dur, id, root, q, pcs, name}].
 * ctx {length, barLen, beat, key {tonic, mode}, vocab ('simple' | 'folk' | 'dance'),
 *   phraseLen (16ths: the phrase grid, where the melody does not rest), cadences (alternate half
 *   and full cadences at the phrase ends)}
 */
export function implyChords(events, { length, barLen = 16, beat = 4, key = { tonic: 0, mode: 'major' }, vocab = 'dance', phraseLen = null, cadences = true }) {
  const mode = key.mode === 'minor' ? 'minor' : 'major';
  const tonic = key.tonic;
  const words = (VOCABS[vocab] ?? VOCABS.dance)[mode];
  const notes = notesOf(events);
  const slot = slotOf(barLen);
  const n = Math.max(1, Math.ceil(length / slot));
  const pcsOf = words.map((c) => new Set(chordPcs(c, tonic)));
  const fit = chordFit(notes, { n, slot, beat, pcsOf });
  const isTonic = (c) => c.root === 0 && c.q !== '7';
  const isDom = (c) => c.root === 7;
  const plan = Array.from({ length: n }, () => new Array(words.length).fill(0));
  if (cadences && notes.length) {
    // the phrase ends: by rests of a beat, or on the phrase grid
    const grid = phraseLen ?? 2 * barLen;
    const ends = [];
    phrasesOfNotes(notes, beat).forEach((ph) => {
      for (let i = 0; i < ph.length - 1; i++) if (Math.floor(ph[i + 1].s / grid) > Math.floor(ph[i].s / grid) && ph[i].d >= beat) ends.push(ph[i]);
      ends.push(ph[ph.length - 1]);
    });
    ends.slice(0, -1).forEach((nt, j) => {
      const k = Math.min(n - 1, Math.floor(nt.s / slot));
      words.forEach((c, ci) => {
        plan[k][ci] += j % 2 === 0 ? (isDom(c) ? 0.6 : 0) : isTonic(c) ? 0.6 : 0;
      });
    });
  }
  // the piece starts on the tonic and ends V–I
  words.forEach((c, ci) => {
    plan[0][ci] += isTonic(c) ? 1 : 0;
    plan[n - 1][ci] += isTonic(c) ? 2 : -2;
    if (n >= 2) plan[n - 2][ci] += isDom(c) ? 0.6 : 0;
  });
  const half = slot < barLen;
  const nearEnd = (k) => (n - k) * slot <= 2 * barLen;
  const changeCost = (k) => (half && (k * slot) % barLen !== 0 ? (nearEnd(k) ? 0.1 : 1) : 0);
  return viterbiChords({ length, slot, tonic, vocab: words, moves: MOVES[mode], fit, plan, changeCost });
}

// ------------------------------------------------------------------ the blues

/**
 * The twelve-bar blues under a melody of 4/4: I7 I7 I7 I7 | IV7 IV7 I7 I7 | V7 IV7 I7 V7, repeated,
 * with the "quick change" (IV7 in the 2nd bar) when the melody fits it better, and the last bar on
 * the tonic (Twelve-bar blues; the V7 of the 12th bar is the turnaround to the next chorus).
 */
export function bluesChords(events, { length, barLen = 16, beat = 4, key = { tonic: 0, mode: 'minor' } }) {
  const tonic = key.tonic;
  const I7 = C('I7', 0, '7');
  const IV7 = C('IV7', 5, '7');
  const V7 = C('V7', 7, '7');
  const FORM = [I7, I7, I7, I7, IV7, IV7, I7, I7, V7, IV7, I7, V7];
  const bars = Math.max(1, Math.ceil(length / barLen));
  const notes = notesOf(events);
  const fitOf = (c, b) => chordFit(notes.filter((nt) => nt.s < (b + 1) * barLen && nt.s + nt.d > b * barLen), { n: b + 1, slot: barLen, beat, pcsOf: [new Set(chordPcs(c, tonic))] })[b][0];
  const seq = [];
  for (let b = 0; b < bars; b++) {
    let c = FORM[b % 12];
    if (b % 12 === 1 && fitOf(IV7, b) > fitOf(I7, b) + 0.1) c = IV7;
    if (b === bars - 1) c = I7;
    seq.push(c);
  }
  return chordsOfSequence(seq, barLen, length, tonic);
}
