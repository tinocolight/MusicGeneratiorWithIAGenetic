// A tiny IDyOM-like expectation model (Pearce 2005; Pearce & Wiggins 2012): interpolated
// bigram models of melodic interval and of note duration, learned from the reference corpus.
// Information content IC = -log2 P(note | previous note) measures how surprising each note
// is for a listener enculturated in that corpus.

const IV_MIN = -12;
const IV_MAX = 12;
const NIV = IV_MAX - IV_MIN + 1;
const DUR_BINS = [1, 2, 3, 4, 6, 8, 12, 16];
const ND = DUR_BINS.length + 1;

const ivSym = (d) => Math.max(IV_MIN, Math.min(IV_MAX, d)) - IV_MIN;
const durSym = (d) => {
  const i = DUR_BINS.indexOf(d);
  return i < 0 ? DUR_BINS.length : i;
};

function sequences(compact) {
  const notes = compact.filter(([p]) => p >= 0);
  const iv = [];
  for (let i = 1; i < notes.length; i++) iv.push(ivSym(notes[i][0] - notes[i - 1][0]));
  return { iv, dur: notes.map(([, d]) => durSym(d)) };
}

function emptyTables(n) {
  return { uni: new Array(n).fill(0), bi: Array.from({ length: n }, () => new Array(n).fill(0)), ctx: new Array(n).fill(0) };
}

function addSeq(tab, seq) {
  for (let i = 0; i < seq.length; i++) {
    tab.uni[seq[i]]++;
    if (i > 0) {
      tab.bi[seq[i - 1]][seq[i]]++;
      tab.ctx[seq[i - 1]]++;
    }
  }
}

export function trainModel(melodies) {
  const iv = emptyTables(NIV);
  const dur = emptyTables(ND);
  for (const m of melodies) {
    const s = sequences(m);
    addSeq(iv, s.iv);
    addSeq(dur, s.dur);
  }
  return { iv, dur };
}

function prob(tab, prev, sym, n) {
  const uniTot = tab.uni.reduce((a, b) => a + b, 0);
  const pu = (tab.uni[sym] + 0.5) / (uniTot + 0.5 * n);
  if (prev === null) return pu;
  const c = tab.ctx[prev];
  const pb = (tab.bi[prev][sym] + 0.5) / (c + 0.5 * n);
  const lambda = c / (c + 20);
  return lambda * pb + (1 - lambda) * pu;
}

function meanIC(tab, seq, n) {
  if (!seq.length) return 0;
  let s = 0;
  for (let i = 0; i < seq.length; i++) s -= Math.log2(prob(tab, i ? seq[i - 1] : null, seq[i], n));
  return s / seq.length;
}

/** Wrap trained tables into a model with informationContent(compact). */
export function makeModel(tables) {
  return {
    tables,
    informationContent(compact) {
      const s = sequences(compact);
      return { pitch: meanIC(tables.iv, s.iv, NIV), rhythm: meanIC(tables.dur, s.dur, ND) };
    },
  };
}
