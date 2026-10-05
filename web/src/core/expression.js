// Dynamics of a sung line for the playback and the MIDI file, for the fado styles only
// (styleTraits(style).expression in fitness/styles.js; results/fado.md, "Dinâmica").
//
// Part of the fado's tension is in the notes themselves (the apex, the held note left suspended,
// the 6th leaning on the 5th, the note sung early), and the fitness already asks for them. The
// other part only exists in the voice: the verse that starts strong and dies away ("nasceu um
// dia"), the accent of pain on one word ("o vento mal bulia"), the apex held and swelling ("o céu
// o maaar prolongava"), the last stanza sung louder (Sergl; literatura.csv F13). Without dynamics
// a synthesiser plays all of them at one level, so they are added here, from the melody alone:
//   * a verse is the group of notes between two breaths (rests of an eighth or more);
//   * each verse starts above the base level and falls towards its end (decrescendo), and its
//     higher notes are louder;
//   * the held note that ends a verse fades ("fade"); the highest note of the piece, if held,
//     swells ("swell") and is the loudest;
//   * a note of pain is accented: one reached by a leap upwards, or a tense degree on a beat (the
//     ♭6 and ♭2 of minor, the raised 4th, the leading tone);
//   * the last stanza (the last eight bars of 4/4, or quarter of the piece) is louder;
//   * long notes have the narrow vibrato measured in fado singers (about 0.3 semitone, 5.6 Hz;
//     Mendes et al. 2013, F12).
// The happy fado is louder overall and less tapered, with an accent on the downbeats (it invites
// dancing) and lighter fades; sadness is sung softer than joy (Scherer et al. 2017, F15).
//
// expressionOf(events, ctx) -> one entry per event (null for rests):
//   {vel (0..1, the MIDI velocity / 127), shape: 'fade' | 'swell' | null, end (level at the end
//    of the note, relative to vel), accent (bool), pain (accented as a note of pain or the apex:
//    the accents written in the score), vib (vibrato depth in semitones)}
// dynamicMarks(events) turns them into the marks of the score (pp…ff, hairpins, accents).

const PROFILES = {
  sad: { base: 0.56, start: 0.14, decline: 0.16, height: 0.14, fadeTo: 0.35, accent: 0.15, climax: 0.95, lastStanza: 0.08, downbeat: 0, vib: 0.3 },
  happy: { base: 0.7, start: 0.06, decline: 0.06, height: 0.1, fadeTo: 0.6, accent: 0.1, climax: 0.95, lastStanza: 0.06, downbeat: 0.08, vib: 0.2 },
};

const mod = (a, n) => ((a % n) + n) % n;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/**
 * @param events [{pitch | null, start, dur}] (16ths)
 * @param ctx {kind: 'sad' | 'happy', barLen, beat (16ths), key {tonic, mode}}
 */
export function expressionOf(events, { kind = 'sad', barLen = 16, beat = 4, key = { tonic: 0, mode: 'minor' } } = {}) {
  const P = PROFILES[kind] ?? PROFILES.sad;
  const out = events.map(() => null);
  const idx = events.map((e, i) => (e.pitch === null ? -1 : i)).filter((i) => i >= 0);
  if (!idx.length) return out;
  // verses: groups of notes between rests of an eighth (2 sixteenths) or more
  const verses = [];
  let cur = [];
  for (let k = 0; k < idx.length; k++) {
    const i = idx[k];
    if (k && events[i].start - (events[idx[k - 1]].start + events[idx[k - 1]].dur) >= 2) {
      verses.push(cur);
      cur = [];
    }
    cur.push(i);
  }
  verses.push(cur);
  const end = events.at(-1).start + events.at(-1).dur;
  const lastStanza = end - Math.max(2 * barLen, Math.min(8 * 16, end / 4));
  const top = Math.max(...idx.map((i) => events[i].pitch));
  const climax = idx.find((i) => events[i].pitch === top && events[i].dur >= beat) ?? idx.find((i) => events[i].pitch === top);
  const minor = key.mode === 'minor';
  // degrees that hurt: ♭2, raised 4th, ♭6 (minor) and the leading tone, on a beat
  const tense = new Set(minor ? [1, 6, 8, 11] : [1, 6, 10, 11]);

  for (const v of verses) {
    const ps = v.map((i) => events[i].pitch);
    const lo = Math.min(...ps);
    const hi = Math.max(...ps);
    v.forEach((i, k) => {
      const e = events[i];
      const pos = v.length > 1 ? k / (v.length - 1) : 0;
      let vel = P.base + P.start - (P.start + P.decline) * pos;
      if (hi > lo) vel += P.height * ((e.pitch - lo) / (hi - lo) - 0.5);
      let accent = false;
      let pain = false;
      const prev = k ? events[v[k - 1]].pitch : null;
      const onBeat = mod(e.start, beat) === 0;
      if ((prev !== null && e.pitch - prev >= 5) || (onBeat && tense.has(mod(e.pitch - key.tonic, 12)))) {
        vel += P.accent;
        accent = true;
        pain = true;
      }
      if (P.downbeat && mod(e.start, barLen) === 0) {
        vel += P.downbeat;
        accent = true;
      }
      if (e.start >= lastStanza) vel += P.lastStanza;
      let shape = null;
      let endLevel = 1;
      const held = e.dur >= 2 * beat || (k === v.length - 1 && e.dur >= beat);
      if (i === climax && e.dur >= beat) {
        vel = Math.max(vel, P.climax);
        shape = 'swell';
        endLevel = 1.15;
        accent = true;
        pain = true;
      } else if (k === v.length - 1 && held) {
        // the held note starts where the voice still carries it, then dies away
        vel = Math.max(vel, P.base - 0.04);
        shape = 'fade';
        endLevel = P.fadeTo;
      }
      out[i] = { vel: clamp(vel, 0.2, 1), shape, end: endLevel, accent, pain, vib: e.dur >= beat ? P.vib : 0 };
    });
  }
  return out;
}

/** MIDI velocity (1..127) of an expression entry, or the default. */
export const velocityOf = (x, fallback = 88) => (x ? clamp(Math.round(x.vel * 127), 1, 127) : fallback);

// the written dynamic of a level (the inverse of the levels above, roughly as players read them)
const LETTERS = [[0.4, 'pp'], [0.52, 'p'], [0.63, 'mp'], [0.76, 'mf'], [0.9, 'f'], [Infinity, 'ff']];
export const dynamicLetter = (vel) => LETTERS.find(([lim]) => vel < lim)[1];

/**
 * Marks of the score from notes that carry dynamics (events {pitch, start, dur, x}, absolute
 * starts): a dynamic letter where a verse starts at a new level and on the apex, a crescendo over
 * the apex that swells, a diminuendo over each held note that fades, and an accent on the notes
 * of pain. [{type: 'text', step, text} | {type: 'cresc' | 'dim', step, end} | {type: 'accent', step}]
 */
export function dynamicMarks(events) {
  const notes = events.filter((e) => e.pitch !== null && e.pitch !== undefined && e.x).sort((a, b) => a.start - b.start);
  const marks = [];
  let last = null;
  let prevEnd = -Infinity;
  for (const e of notes) {
    const verseStart = e.start - prevEnd >= 2;
    prevEnd = e.start + e.dur;
    const letter = dynamicLetter(e.x.vel);
    if ((verseStart || e.x.shape === 'swell') && letter !== last) {
      marks.push({ type: 'text', step: e.start, text: letter });
      last = letter;
    }
    if (e.x.shape === 'swell') marks.push({ type: 'cresc', step: e.start, end: e.start + Math.max(1, Math.round(e.dur * 0.75)) });
    else if (e.x.shape === 'fade') marks.push({ type: 'dim', step: e.start, end: e.start + e.dur });
    if (e.x.pain) marks.push({ type: 'accent', step: e.start });
  }
  return marks;
}

// ------------------------------------------------------------------ rubato

// how much the time stretches (1 = in time): into the held note of a verse, on it, on the held note
// that ends a stanza, and on the last note of the piece (a fermata)
const RUBATO = {
  sad: { into: 1.12, held: 1.1, stanza: 1.25, last: 1.6 },
  happy: { into: 1.05, held: 1.04, stanza: 1.12, last: 1.35 },
};

/**
 * Rubato of a sung line (fado): every 16th of the piece stretched by how much the singer holds back
 * there. In the scores of fado (results/fado/partituras.md) the phrase slows into its held note
 * (rit., rallent.), the note is held, the stanza and the piece end on a fermata, and the music goes
 * on a tempo; the guitars keep with the voice. Returns {stretch (one factor per 16th), marks:
 * {rit: [steps], fermata: [steps]}} for the score.
 * events: the melody in the piece's time; total: the piece's length (16ths).
 */
export function rubatoOf(events, { total, beat = 4, kind = 'sad' }) {
  const P = RUBATO[kind] ?? RUBATO.sad;
  const stretch = new Array(total).fill(1);
  const notes = events.filter((e) => e.pitch !== null && e.pitch !== undefined).sort((a, b) => a.start - b.start);
  const verses = [];
  let cur = [];
  notes.forEach((e, i) => {
    if (i && e.start - (notes[i - 1].start + notes[i - 1].dur) >= 2) {
      verses.push(cur);
      cur = [];
    }
    cur.push(e);
  });
  if (cur.length) verses.push(cur);
  const marks = { rit: [], fermata: [] };
  verses.forEach((v, j) => {
    const held = v[v.length - 1];
    const final = j === verses.length - 1;
    if (held.dur < beat && !final) return;
    const stanzaEnd = j % 4 === 3;
    const from = Math.max(0, held.start - beat);
    for (let t = from; t < held.start; t++) stretch[t] *= 1 + (P.into - 1) * ((t - from + 1) / (held.start - from));
    const f = final ? P.last : stanzaEnd ? P.stanza : P.held;
    for (let t = held.start; t < Math.min(total, held.start + held.dur); t++) stretch[t] *= f;
    if (final || stanzaEnd) marks.rit.push(from);
    if (final) marks.fermata.push(held.start);
  });
  return { stretch, marks };
}

/** Seconds from the start to each 16th (length total + 1), for a tempo and a stretch. */
export function timeline(stretch, bpm) {
  const step = 60 / bpm / 4;
  const out = [0];
  for (let i = 0; i < stretch.length; i++) out.push(out[i] + step * stretch[i]);
  return out;
}
