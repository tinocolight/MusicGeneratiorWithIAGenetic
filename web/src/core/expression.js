// Dynamics and rubato of a melody for the playback, the MIDI file and the score: every style of the
// field mode has a way of being played (a profile), the classic mode has none.
//
// The fado (sad and happy) has its own model, the first one made (results/fado.md, "Dinâmica"):
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
// The other styles (results/expressao.md) follow the rules of the KTH performance model
// (Friberg, Bresin & Sundberg 2006, X01) with numbers measured in about 1000 piano performances
// aligned with their scores (the ASAP dataset; tools/expression_study.py, X04):
//   * phrases: groups of notes between breaths, or the phrase grid where the melody does not rest;
//   * phrase arch (X01, Todd 1992 X03): a crescendo to the phrase's highest note and a diminuendo
//     after it, and over the whole piece a rise towards its apex (the loudest stretch of a piece
//     comes at about 0.6 of it in the performances);
//   * high-loud (X01): the higher notes are louder (pitch and velocity correlate at r ≈ 0.4 in
//     the performances, in every period);
//   * terraced dynamics in the baroque (X05): no hairpins; a phrase that repeats an earlier one
//     exactly is its echo, piano;
//   * metric accents only where the style has them: the dances (+0.45 standard deviations on the
//     downbeat against the off-beats in the performed dances; none in Bach nor in the classical
//     sonatas), the 2nd beat of the mazurka (E26) and of the sarabande (E13), the off-beat
//     eighths of jazz (X06), the syncopations of popular music;
//   * the blue notes of the blues (♭3, ♭5, ♭7) leaned on, like the notes of pain of the fado;
//   * the lullaby is soft and grows softer (X07), the chorale breathes at every phrase end.
//
// expressionOf(events, ctx) -> one entry per event (null for rests):
//   {vel (0..1, the MIDI velocity / 127), shape: 'fade' | 'swell' | null, end (level at the end
//    of the note, relative to vel), accent (bool), pain (accented as a note of pain or the apex:
//    the accents written in the score), vib (vibrato depth in semitones; 0: the instrument's own)}
//   and, for the profiles other than the fado: level (the phrase's level, for the written
//   dynamic), phrase (its index), first (the phrase's first note), arch (the phrase is shaped
//   with hairpins), peak (the note where the arch turns)
// dynamicMarks(events) turns them into the marks of the score (pp…ff, hairpins, accents).

const PROFILES = {
  sad: { base: 0.56, start: 0.14, decline: 0.16, height: 0.14, fadeTo: 0.35, accent: 0.15, climax: 0.95, lastStanza: 0.08, downbeat: 0, vib: 0.3 },
  happy: { base: 0.7, start: 0.06, decline: 0.06, height: 0.1, fadeTo: 0.6, accent: 0.1, climax: 0.95, lastStanza: 0.06, downbeat: 0.08, vib: 0.2 },
};

// Profiles of the other styles (results/expressao.md, where every number comes from).
//   base           the level of a phrase (0..1, as the MIDI velocity / 127)
//   arch, pieceArch the phrase arch (crescendo to the phrase's apex, diminuendo after) and the
//                  rise of the whole piece towards its apex; hairpins are written from 0.08
//   start, decline the verse that starts above the base and falls (the blues' call, like fado)
//   height         high-loud: from the phrase's lowest to its highest note
//   leap           accent on a note reached by a leap up of a 4th or more (not written)
//   pain           accent on a tense degree on a beat (written): the blue notes of the blues
//   climax         level of the piece's apex when it is held (it swells), 0: no swell
//   fadeTo         level at the end of the held note that ends a phrase (1: no fade)
//   lastStanza     added in the last stanza (negative: softer, the lullaby falling asleep)
//   downbeat, mid, beat2, offbeat, sync   metric accents: the bar's first beat, its middle (4/4,
//                  6/8, 12/8), the 2nd beat, the off-beat eighth, a note held across the beat
//   echo           the drop of a phrase that repeats an earlier one (terraced dynamics)
//   breath         the rest that separates two phrases ('beat' or 16ths)
//   vib            vibrato depth of the long notes (semitones; 0: the instrument's own)
// and of the rubato (rubatoOf):
//   into, held     the slowing into the last note of a phrase and its lengthening (one voice)
//   fermatas       the hold of a phrase's last note (chorale), written as a fermata
//   final          the final ritardando {bars, w, q}: v(x) = (1 + (w^q - 1) x)^(1/q) over the
//                  last bars before the last note (Friberg & Sundberg 1999, X02)
//   last, fermata  the stretch of the last note, and whether a fermata is written on it
//   ritMark        whether "rit." is written where the final ritardando starts
const GENERAL = {
  base: 0.66, phrase: 'arch', arch: 0.1, pieceArch: 0.06, start: 0, decline: 0, height: 0.12, leap: 0.05, pain: 0, climax: 0.88,
  fadeTo: 0.8, lastStanza: 0, downbeat: 0, mid: 0, beat2: 0, offbeat: 0, sync: 0, echo: 0, breath: 2, vib: 0,
  into: 1.03, held: 1.03, fermatas: 0, final: { bars: 1, w: 0.5, q: 2 }, last: 1.5, fermata: false, ritMark: true,
};
const DANCE = {
  ...GENERAL, base: 0.72, phrase: 'flat', arch: 0.03, pieceArch: 0, height: 0.08, leap: 0, climax: 0, fadeTo: 1,
  downbeat: 0.07, mid: 0.03, breath: 'beat', into: 1, held: 1, final: { bars: 0.5, w: 0.8, q: 1 }, last: 1.15, ritMark: false,
};
const BAROQUE = {
  ...GENERAL, base: 0.8, phrase: 'terrace', arch: 0.02, pieceArch: 0, height: 0.1, leap: 0, climax: 0, fadeTo: 1, echo: 0.3,
  breath: 'beat', into: 1, held: 1, final: { bars: 1, w: 0.35, q: 2 }, last: 2, fermata: true,
};
const POPULAR = {
  ...GENERAL, base: 0.72, phrase: 'flat', arch: 0.04, pieceArch: 0, height: 0.08, leap: 0, climax: 0, fadeTo: 0.85, sync: 0.08,
  breath: 'beat', into: 1, held: 1, final: null, last: 1, ritMark: false,
};
const SHAPED = {
  general: GENERAL,
  song: { ...GENERAL, base: 0.64, arch: 0.12, leap: 0.04, fadeTo: 0.75, into: 1.04, held: 1.05, last: 1.8, fermata: true },
  children: { ...GENERAL, base: 0.7, arch: 0.06, pieceArch: 0.03, height: 0.1, leap: 0, climax: 0, fadeTo: 0.9, downbeat: 0.05, into: 1, held: 1.02, final: { bars: 0.5, w: 0.75, q: 1 }, last: 1.3, ritMark: false },
  lullaby: { ...GENERAL, base: 0.46, arch: 0.06, pieceArch: 0, height: 0.06, leap: 0, climax: 0, fadeTo: 0.6, lastStanza: -0.08, into: 1.05, held: 1.06, final: { bars: 2, w: 0.4, q: 2 }, last: 2, fermata: true },
  chorale: { ...GENERAL, arch: 0.06, pieceArch: 0.04, height: 0.08, leap: 0, climax: 0, fadeTo: 0.85, into: 1.03, held: 1, fermatas: 1.3, final: { bars: 1, w: 0.45, q: 2 }, last: 2, fermata: true },
  dance: DANCE,
  waltz: { ...DANCE, downbeat: 0.1, mid: 0 },
  mazurka: { ...DANCE, downbeat: 0.03, mid: 0, beat2: 0.08 },
  baroque: BAROQUE,
  sarabande: { ...BAROQUE, beat2: 0.07 },
  classical: { ...GENERAL, arch: 0.12, height: 0.1, fadeTo: 0.85, into: 1.02, held: 1.03, final: { bars: 1, w: 0.62, q: 1 } },
  popular: POPULAR,
  jazz: { ...POPULAR, offbeat: 0.06 },
  blues: { ...GENERAL, base: 0.68, arch: 0.04, pieceArch: 0, start: 0.08, decline: 0.12, height: 0.1, leap: 0, pain: 0.08, climax: 0.9, fadeTo: 0.6, sync: 0.05, vib: 0.25, into: 1.03, held: 1.04, final: { bars: 1, w: 0.5, q: 2 }, last: 1.8, fermata: true },
};

/** The profiles a style can name (styles.js, expressionProfile). */
export const EXPRESSION_PROFILES = ['sad', 'happy', ...Object.keys(SHAPED)];
const isFado = (kind) => kind === 'sad' || kind === 'happy';

const mod = (a, n) => ((a % n) + n) % n;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/**
 * @param events [{pitch | null, start, dur}] (16ths)
 * @param ctx {kind: a profile ('sad' | 'happy' | 'song' | 'baroque'... EXPRESSION_PROFILES), barLen,
 *   beat (16ths), key {tonic, mode}, phraseLen (16ths: the phrase grid where the melody does not
 *   rest; default two bars)}
 */
export function expressionOf(events, { kind = 'sad', barLen = 16, beat = 4, key = { tonic: 0, mode: 'minor' }, phraseLen = null } = {}) {
  if (SHAPED[kind]) return shapedExpression(events, { P: SHAPED[kind], barLen, beat, key, phraseLen: phraseLen ?? 2 * barLen });
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

/**
 * Phrases of a melody (indices of its notes): cut at every rest of `breath` 16ths or more, and on
 * the phrase grid where the melody goes on without resting (at a multiple of phraseLen, once the
 * phrase has lasted half of it).
 */
function phrasesOf(events, idx, breath, phraseLen) {
  const out = [];
  let cur = [];
  let byGrid = false;
  for (const i of idx) {
    const e = events[i];
    if (cur.length) {
      const prev = events[cur[cur.length - 1]];
      const s0 = events[cur[0]].start;
      const line = Math.floor(e.start / phraseLen) * phraseLen;
      const rest = e.start - (prev.start + prev.dur) >= breath;
      if (rest || (line > prev.start && line - s0 >= phraseLen / 2)) {
        out.push(cur);
        cur = [];
        byGrid = !rest;
      }
    }
    cur.push(i);
  }
  // a last note cut off by the grid alone ends the phrase before it
  if (cur.length === 1 && byGrid && out.length) out[out.length - 1].push(cur[0]);
  else if (cur.length) out.push(cur);
  return out;
}

// rising to 1 at the turn (x = pk) and falling after it: the shape of the phrase arch (0..1)
const archAt = (x, pk) => (x <= pk ? Math.sin((Math.PI / 2) * (x / pk)) : Math.cos((Math.PI / 2) * ((x - pk) / (1 - pk))));

function shapedExpression(events, { P, barLen, beat, key, phraseLen }) {
  const out = events.map(() => null);
  const idx = events.map((e, i) => (e.pitch === null ? -1 : i)).filter((i) => i >= 0);
  if (!idx.length) return out;
  const breath = P.breath === 'beat' ? beat : P.breath;
  const phrases = phrasesOf(events, idx, breath, phraseLen);
  const first = events[idx[0]].start;
  const end = events[idx.at(-1)].start + events[idx.at(-1)].dur;
  const span = Math.max(1, end - first);
  const lastStanza = end - Math.max(2 * barLen, Math.min(8 * 16, end / 4));
  const top = Math.max(...idx.map((i) => events[i].pitch));
  const apex = idx.find((i) => events[i].pitch === top && events[i].dur >= beat) ?? idx.find((i) => events[i].pitch === top);
  // the piece rises towards its apex (kept between half and four fifths of the way)
  const piecePk = clamp((events[apex].start - first) / span, 0.5, 0.8);
  const blue = new Set([3, 6, 10]);
  const mid = barLen / beat === 4 ? barLen / 2 : null; // the 3rd beat of 4/4, the 3rd of 12/8
  const written = P.arch >= 0.08;
  const seen = new Set();
  phrases.forEach((ph, j) => {
    const s0 = events[ph[0]].start;
    const last = events[ph.at(-1)];
    const e0 = last.start + last.dur;
    const len = Math.max(1, e0 - s0);
    // terraced: the exact repeat of an earlier phrase (of a bar and four notes or more) is its echo
    const sig = ph.map((i) => `${events[i].pitch}:${events[i].dur}:${events[i].start - s0}`).join(' ');
    const echo = P.echo && ph.length >= 4 && len >= barLen && seen.has(sig);
    seen.add(sig);
    const ps = ph.map((i) => events[i].pitch);
    const lo = Math.min(...ps);
    const hi = Math.max(...ps);
    const peakIdx = ph[ps.indexOf(hi)];
    const pk = clamp((events[peakIdx].start - s0) / len, 0.3, 0.75);
    let level = P.base - (echo ? P.echo : 0);
    if (P.pieceArch) level += P.pieceArch * (archAt(clamp((s0 + len / 2 - first) / span, 0, 1), piecePk) - 0.5);
    if (s0 + len / 2 >= lastStanza) level += P.lastStanza; // a phrase mostly in the last stanza
    ph.forEach((i, k) => {
      const e = events[i];
      const x = (e.start - s0) / len;
      let vel = level;
      if (P.arch) vel += P.arch * (archAt(x, pk) - 0.5);
      if (P.decline || P.start) vel += P.start - (P.start + P.decline) * (ph.length > 1 ? k / (ph.length - 1) : 0);
      if (hi > lo) vel += P.height * ((e.pitch - lo) / (hi - lo) - 0.5);
      let accent = false;
      let pain = false;
      const pos = mod(e.start, barLen);
      const onBeat = mod(e.start, beat) === 0;
      const accentBy = (amount) => {
        if (!amount) return;
        vel += amount;
        accent = true;
      };
      if (pos === 0) accentBy(P.downbeat);
      else if (mid !== null && pos === mid) accentBy(P.mid);
      if (pos === beat) accentBy(P.beat2);
      if (P.offbeat && mod(e.start, beat) === beat / 2) accentBy(P.offbeat);
      if (P.sync && !onBeat && Math.floor((e.start + e.dur - 1) / beat) > Math.floor(e.start / beat)) accentBy(P.sync);
      const prev = k ? events[ph[k - 1]].pitch : null;
      if (P.leap && prev !== null && e.pitch - prev >= 5) accentBy(P.leap);
      if (P.pain && onBeat && blue.has(mod(e.pitch - key.tonic, 12))) {
        accentBy(P.pain);
        pain = true;
      }
      let shape = null;
      let endLevel = 1;
      const held = e.dur >= 2 * beat || (k === ph.length - 1 && e.dur >= beat);
      if (P.climax && i === apex && e.dur >= beat) {
        vel = Math.max(vel, P.climax);
        shape = 'swell';
        endLevel = 1.12;
        accent = true;
        pain = !!P.pain;
      } else if (P.fadeTo < 1 && k === ph.length - 1 && held) {
        vel = Math.max(vel, level - 0.04);
        shape = 'fade';
        endLevel = P.fadeTo;
      }
      out[i] = {
        vel: clamp(vel, 0.2, 1), shape, end: endLevel, accent, pain, vib: e.dur >= beat ? P.vib : 0,
        level: clamp(level, 0.2, 1), phrase: j, first: k === 0, arch: written, peak: i === peakIdx,
      };
    });
  });
  return out;
}

/** MIDI velocity (1..127) of an expression entry, or the default. */
export const velocityOf = (x, fallback = 88) => (x ? clamp(Math.round(x.vel * 127), 1, 127) : fallback);

// the written dynamic of a level (the inverse of the levels above, roughly as players read them)
const LETTERS = [[0.4, 'pp'], [0.52, 'p'], [0.63, 'mp'], [0.76, 'mf'], [0.9, 'f'], [Infinity, 'ff']];
export const dynamicLetter = (vel) => LETTERS.find(([lim]) => vel < lim)[1];

/**
 * Marks of the score from notes that carry dynamics (events {pitch, start, dur, x}, absolute
 * starts): a dynamic letter where a phrase starts at a new level and on the apex, a crescendo over
 * the apex that swells, a diminuendo over each held note that fades, and an accent on the notes
 * of pain. A phrase shaped as an arch (x.arch) gets a crescendo to its turning note and a
 * diminuendo from it instead of the hairpins of single notes.
 * [{type: 'text', step, text} | {type: 'cresc' | 'dim', step, end} | {type: 'accent', step}]
 */
export function dynamicMarks(events) {
  const notes = events.filter((e) => e.pitch !== null && e.pitch !== undefined && e.x).sort((a, b) => a.start - b.start);
  const marks = [];
  let last = null;
  let prevEnd = -Infinity;
  let phrase = [];
  // the arch's hairpins, each over two notes and half a 4/4 bar (8 16ths) or more
  const archOf = (ph) => {
    if (ph.length < 4 || !ph[0].x.arch) return;
    const k = Math.max(0, ph.findIndex((e) => e.x.peak));
    const peak = ph[k];
    const tail = ph.at(-1);
    if (k >= 2 && peak.start - ph[0].start >= 8) marks.push({ type: 'cresc', step: ph[0].start, end: peak.start });
    if (ph.length - 1 - k >= 2 && tail.start + tail.dur - peak.start >= 8) marks.push({ type: 'dim', step: peak.start, end: tail.start + tail.dur });
  };
  for (const e of notes) {
    const verseStart = e.x.first ?? e.start - prevEnd >= 2;
    prevEnd = e.start + e.dur;
    if (verseStart) {
      archOf(phrase);
      phrase = [];
    }
    phrase.push(e);
    const letter = dynamicLetter(e.x.shape === 'swell' ? e.x.vel : e.x.level ?? e.x.vel);
    if ((verseStart || e.x.shape === 'swell') && letter !== last) {
      marks.push({ type: 'text', step: e.start, text: letter });
      last = letter;
    }
    if (!e.x.arch) {
      if (e.x.shape === 'swell') marks.push({ type: 'cresc', step: e.start, end: e.start + Math.max(1, Math.round(e.dur * 0.75)) });
      else if (e.x.shape === 'fade' && e.x.end <= 0.75) marks.push({ type: 'dim', step: e.start, end: e.start + e.dur });
    }
    if (e.x.pain) marks.push({ type: 'accent', step: e.start });
  }
  archOf(phrase);
  return marks.sort((a, b) => a.step - b.step);
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
 * The other profiles (shapedRubato): kind, barLen, all (the notes of every voice: the final
 * ritardando slows into the last one), phrases (false with several voices: they breathe at
 * different places, so only the end is slowed).
 */
export function rubatoOf(events, { total, beat = 4, kind = 'sad', barLen = 16, all = null, phrases = true }) {
  if (SHAPED[kind]) return shapedRubato(events, { total, beat, barLen, P: SHAPED[kind], all, phrases });
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

/** Tempo of the final ritardando at x (0..1) of its length (Friberg & Sundberg 1999). */
export const ritardTempo = (x, w, q) => (1 + (w ** q - 1) * x) ** (1 / q);

/**
 * Rubato of the other profiles: the phrase ends slowed and lengthened a little (one voice only),
 * the chorale's phrase ends held, the final ritardando over the last bar(s) before the last note
 * and the last note held. marks.last: a fermata on the last note of every staff.
 */
function shapedRubato(events, { total, beat, barLen, P, all, phrases }) {
  const stretch = new Array(total).fill(1);
  const marks = { rit: [], fermata: [], last: false };
  const pitched = (e) => e.pitch !== null && e.pitch !== undefined;
  const notes = events.filter(pitched).sort((a, b) => a.start - b.start);
  const every = (all ?? events).filter(pitched);
  if (!every.length) return { stretch, marks };
  const lastOnset = Math.max(...every.map((e) => e.start));
  if (phrases && notes.length) {
    const groups = [];
    let cur = [];
    notes.forEach((e, i) => {
      const brk = e.x ? e.x.first : i && e.start - (notes[i - 1].start + notes[i - 1].dur) >= 2;
      if (brk && cur.length) {
        groups.push(cur);
        cur = [];
      }
      cur.push(e);
    });
    if (cur.length) groups.push(cur);
    for (const g of groups) {
      const end = g[g.length - 1];
      if (end.start >= lastOnset - barLen * (P.final?.bars ?? 0)) continue; // the final ritardando takes over
      const from = Math.max(0, end.start - beat);
      if (P.into > 1) for (let t = from; t < end.start; t++) stretch[t] *= 1 + (P.into - 1) * ((t - from + 1) / (end.start - from));
      let f = end.dur >= beat / 2 ? P.held : 1;
      if (P.fermatas && end.dur >= beat) {
        f *= P.fermatas;
        marks.fermata.push(end.start);
      }
      for (let t = end.start; t < Math.min(total, end.start + end.dur); t++) stretch[t] *= f;
    }
  }
  if (P.final) {
    const r0 = Math.max(0, lastOnset - Math.round(P.final.bars * barLen));
    for (let t = r0; t < lastOnset; t++) stretch[t] *= 1 / ritardTempo((t - r0 + 0.5) / (lastOnset - r0), P.final.w, P.final.q);
    if (P.ritMark && lastOnset > r0) marks.rit.push(r0);
  }
  for (let t = lastOnset; t < total; t++) stretch[t] *= P.last;
  marks.last = !!P.fermata;
  return { stretch, marks };
}

/** Seconds from the start to each 16th (length total + 1), for a tempo and a stretch. */
export function timeline(stretch, bpm) {
  const step = 60 / bpm / 4;
  const out = [0];
  for (let i = 0; i < stretch.length; i++) out.push(out[i] + step * stretch[i]);
  return out;
}
