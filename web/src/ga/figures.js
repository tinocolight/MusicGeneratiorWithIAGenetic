// Rhythmic figures and melodic blocks of a melody, beat by beat, in any meter (core/meter.js).
//
// A beat of a simple meter is 4 sixteenths, a beat of a compound meter is 6 (three eighths).
// Each beat is described by
//   * its rhythmic FIGURE: one character per 16th, 'x' a note starts, '_' the note goes on,
//     '.' silence; "x_x_" = two eighths in 2/4, "x___x_" = quarter + eighth in 6/8;
//   * its CONTOUR: the steps of the scale between the notes that start inside the beat
//     ("s1d1": up one degree, then down one; "r" repeated);
//   * the ENTRY: the step of the scale from the last note before the beat to its first note;
//   * the DIRECTION of the last melodic interval before the beat (between the last two notes,
//     in semitones): up or down by step (1-2 semitones) or by leap (3 or more), or repeated —
//     'sg', 'ss', 'dg', 'ds', 'r' ('0' when there is no interval yet);
//   * its place in the bar (beat 1, 2, ...).
// These are the tables of the analysis (tools/build_meters.mjs, results/meters/) and of the
// model that writes and judges melodies in the genetic algorithm (blocks.js).

import { REST, HOLD, isNote, geneToMidi } from '../core/score.js';
import { meterOf, beatClass } from '../core/meter.js';
import { t } from '../i18n/i18n.js';

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const MINOR_H = [0, 2, 3, 5, 7, 8, 11]; // generation in minor uses the leading tone
const mod = (a, n) => ((a % n) + n) % n;
const clip = (x, a) => Math.max(-a, Math.min(a, x));
// codes safe in a spreadsheet (a cell starting with + - = is read as a formula)
const stepCode = (x) => (x > 0 ? `s${x}` : x < 0 ? `d${-x}` : 'r');
/** "s1d1" -> [1, -1] */
export const contourSteps = (code) => [...(code ?? '').matchAll(/([sdr])(\d*)/g)].map(([, k, n]) => (k === 'r' ? 0 : k === 's' ? Number(n) : -Number(n)));

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

/** Class of a melodic interval in semitones: 'sg' up by step, 'ss' up by leap, 'r' repeated... */
export function dirClass(semitones) {
  if (semitones === null || semitones === undefined) return '0';
  if (semitones === 0) return 'r';
  return `${semitones > 0 ? 's' : 'd'}${Math.abs(semitones) <= 2 ? 'g' : 's'}`;
}
/** The same with three values only (up, down, repeated): the "simple" rule of the analysis. */
export const dir3 = (d5) => (d5 === '0' || d5 === 'r' ? d5 : d5[0]);

export const DIR_NAMES = {
  '0': '—', r: 'repete', sg: 'sobe por grau', ss: 'sobe por salto', dg: 'desce por grau', ds: 'desce por salto',
  s: 'sobe', d: 'desce',
};

/**
 * Beats of a melody given as a sounding line (MIDI or null per 16th, onset flags).
 * @param opts {meter, pickup (16ths before the first downbeat), key}
 */
export function lineToBeats(pitch, onset, { meter, pickup = 0, key }) {
  const m = meterOf(meter);
  const B = m.beat;
  // pad the start with silence so that the first beat starts at step 0
  const pad = mod(-pickup, B);
  const P = pad ? [...new Array(pad).fill(null), ...pitch] : pitch;
  const O = pad ? [...new Array(pad).fill(false), ...onset] : onset;
  const pk = pickup + pad;
  const beats = [];
  const notes = []; // [{midi, d}] of the onsets so far
  for (let t = 0; t + B <= P.length; t += B) {
    let cell = '';
    const ds = [];
    const before = notes.length;
    for (let k = 0; k < B; k++) {
      const s = t + k;
      if (P[s] === null || P[s] === undefined) cell += '.';
      else if (O[s]) {
        cell += 'x';
        const d = dposOf(P[s], key);
        ds.push(d);
        notes.push({ midi: P[s], d });
      } else cell += '_';
    }
    const last = before ? notes[before - 1] : null;
    const pen = before >= 2 ? notes[before - 2] : null;
    const pos = mod(Math.round((t - pk) / B), m.beats);
    beats.push({
      cell,
      contour: ds.slice(1).map((d, i) => stepCode(clip(d - ds[i], 5))).join(''),
      entry: ds.length && last ? clip(ds[0] - last.d, 9) : null,
      prevDeg: last ? mod(last.d, 7) : -1,
      // direction of the last interval before this beat, and up to its end
      dirIn: dirClass(last && pen ? last.midi - pen.midi : null),
      dirOut: dirClass(notes.length >= 2 ? notes[notes.length - 1].midi - notes[notes.length - 2].midi : null),
      entryDir: dirClass(ds.length && last ? notes[before].midi - last.midi : null),
      pos,
      cls: beatClass(pos, m),
      dpos: ds,
      t: t - pad,
    });
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

// ------------------------------------------------------------------ readable names

// symbols of the values; the sixteenth has no symbol here and uses an abbreviation from the texts
const VALUE_SYMBOL = { 2: '♪', 3: '♪.', 4: '♩', 6: '♩.' };
const valueName = (len) => VALUE_SYMBOL[len] ?? (len === 1 ? t('fig.sixteenth') : len === 5 ? `♩~${t('fig.sixteenth')}` : String(len));
const WORD = { 1: 'semicolcheia', 2: 'colcheia', 3: 'colcheia pontuada', 4: 'semínima', 5: 'semínima ligada a semicolcheia', 6: 'semínima pontuada' };
// Takadimi (Hoffman, Pelto & White 1996): one syllable per position inside the beat
const SYLLABLES = { 4: ['ta', 'ka', 'di', 'mi'], 6: ['ta', 'va', 'ki', 'di', 'da', 'ma'] };

function runs(cell) {
  const out = [];
  let i = 0;
  while (i < cell.length) {
    const ch = cell[i];
    let j = i + 1;
    if (ch === '.') while (j < cell.length && cell[j] === '.') j++;
    else while (j < cell.length && cell[j] === '_') j++;
    out.push({ kind: ch === '.' ? 'rest' : ch === 'x' ? 'note' : 'tie', start: i, len: j - i });
    i = j;
  }
  return out;
}

/** "♪ ♪", "♩ ♪", "pausa ♪ · ♪", "(lig.) ♪ ♪"... (words in the current language) */
export function figureName(cell) {
  return runs(cell).map((r) => (r.kind === 'rest' ? `${t('fig.rest')} ${valueName(r.len)}` : r.kind === 'tie' ? `(${t('fig.tie')}) ${valueName(r.len)}` : valueName(r.len))).join(' ');
}

/** "colcheia + colcheia", "semínima + colcheia"... */
export function figureWords(cell) {
  return runs(cell).map((r) => (r.kind === 'rest' ? `pausa de ${WORD[r.len] ?? r.len}` : r.kind === 'tie' ? `continuação (${WORD[r.len] ?? r.len})` : WORD[r.len] ?? String(r.len))).join(' + ');
}

/** Takadimi syllables of the onsets: "ta di", "ta ki da", "(pausa) di", "(lig.) di mi". */
export function figureSyllables(cell) {
  const syl = SYLLABLES[cell.length];
  if (!syl) return '';
  const head = cell[0] === '.' ? `(${t('fig.rest')}) ` : cell[0] === '_' ? `(${t('fig.tie')}) ` : '';
  const on = [...cell].map((c, i) => (c === 'x' ? syl[i] : null)).filter(Boolean);
  return (head + (on.length ? on.join(' ') : head ? '' : '—')).trim();
}

/** "sobe 1, desce 1" for a contour "s1d1". */
export function contourWords(contour) {
  const steps = contourSteps(contour);
  if (!steps.length) return '—';
  return steps.map((x) => (x === 0 ? 'repete' : `${x > 0 ? 'sobe' : 'desce'} ${Math.abs(x)}`)).join(', ');
}
