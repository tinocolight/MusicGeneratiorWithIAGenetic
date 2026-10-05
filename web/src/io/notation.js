// From the 16th-note grid to common notation: meter, pitch spelling in the key, notes split
// into readable values at beats and bar lines (tied where needed), clefs per instrument, and
// a LilyPond (.ly) writer. Pure functions: the in-page score (ui/score.js) and the LilyPond
// export share this model.

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const mod12 = (x) => ((x % 12) + 12) % 12;
const norm = (a) => (a > 6 ? a - 12 : a < -6 ? a + 12 : a);

// tonic names used by the page (SCALE_LABELS: C, G, D, A, E, B, F#, Db, Ab, Eb, Bb, F)
const MAJOR_TONIC = { 0: 'C', 1: 'Db', 2: 'D', 3: 'Eb', 4: 'E', 5: 'F', 6: 'F#', 7: 'G', 8: 'Ab', 9: 'A', 10: 'Bb', 11: 'B' };
const MINOR_TONIC = { 0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 5: 'F', 6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 10: 'Bb', 11: 'B' };

import { METERS } from '../core/meter.js';
import { dynamicMarks } from '../core/expression.js';
import { t } from '../i18n/i18n.js';

// ------------------------------------------------------------------ meter

/**
 * Meter of a bar of `barLen` 16ths: time signature, beat length and beaming unit. With `id`
 * ('3/4', '6/8'...) that meter: a bar of 12 sixteenths is 6/8 unless it is said to be 3/4.
 */
export function meterOf(barLen, id = null) {
  const known = id && METERS[id];
  if (known) return { num: known.num, den: known.den, beat: known.beat, compound: known.compound, barLen: known.barLen };
  switch (barLen) {
    case 6: return { num: 3, den: 8, beat: 6, compound: true, barLen };
    case 8: return { num: 2, den: 4, beat: 4, compound: false, barLen };
    case 12: return { num: 6, den: 8, beat: 6, compound: true, barLen };
    case 24: return { num: 6, den: 4, beat: 12, compound: true, barLen };
    case 16: return { num: 4, den: 4, beat: 4, compound: false, barLen };
    default: return { num: barLen / 4, den: 4, beat: 4, compound: false, barLen };
  }
}

// note values in 16ths, longest first
const DURATIONS = [24, 16, 12, 8, 6, 4, 3, 2, 1];
export const VEX_DURATION = { 1: '16', 2: '8', 3: '8d', 4: 'q', 6: 'qd', 8: 'h', 12: 'hd', 16: 'w', 24: 'wd' };
export const LILY_DURATION = { 1: '16', 2: '8', 3: '8.', 4: '4', 6: '4.', 8: '2', 12: '2.', 16: '1', 24: '1.' };

/**
 * Can a value of `d` 16ths start at position `p` of the bar and stay readable?
 * Values shorter than the beat stay inside it; longer ones start on a beat. In 4/4 a note does
 * not cross the middle of the bar unless it starts the bar (dotted half, whole).
 */
function fits(p, d, m) {
  if (p + d > m.barLen) return false;
  const B = m.beat;
  if (d < B) return Math.floor(p / B) === Math.floor((p + d - 1) / B);
  if (p % B !== 0) return false;
  if (m.compound) return d % B === 0;
  if (m.barLen === 16 && p < 8 && p + d > 8) return p === 0 && d >= 12;
  return true;
}

/** Split `len` 16ths starting at bar position `p` into readable values. */
export function splitValues(p, len, m) {
  const out = [];
  while (len > 0) {
    const d = DURATIONS.find((x) => x <= len && fits(p, x, m)) ?? 1;
    out.push(d);
    p += d;
    len -= d;
  }
  return out;
}

// ------------------------------------------------------------------ pitch spelling

/** Spelling of the 12 pitch classes in a key: pc -> {letter, alter}. */
export function spellingFor(key) {
  const tonic = mod12(key?.tonic ?? 0);
  const minor = key?.mode === 'minor';
  const name = (minor ? MINOR_TONIC : MAJOR_TONIC)[tonic];
  const start = LETTERS.indexOf(name[0]);
  const steps = minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const table = new Array(12).fill(null);
  const signature = {};
  steps.forEach((s, i) => {
    const letter = LETTERS[(start + i) % 7];
    const pc = mod12(tonic + s);
    const alter = norm(pc - NATURAL[letter]);
    table[pc] = { letter, alter };
    signature[letter] = alter;
  });
  if (minor) {
    // raised 6th and 7th degrees (melodic / harmonic minor)
    for (const i of [5, 6]) {
      const letter = LETTERS[(start + i) % 7];
      const pc = mod12(tonic + steps[i] + 1);
      if (!table[pc]) table[pc] = { letter, alter: signature[letter] + 1 };
    }
  }
  const flats = Object.values(signature).some((a) => a < 0);
  for (let pc = 0; pc < 12; pc++) {
    if (table[pc]) continue;
    const cands = LETTERS.map((letter) => ({ letter, alter: norm(pc - NATURAL[letter]) })).filter((c) => Math.abs(c.alter) <= 1);
    // a natural sign first, then sharps in sharp keys and flats in flat keys
    cands.sort((a, b) => Math.abs(a.alter) - Math.abs(b.alter) || (flats ? a.alter - b.alter : b.alter - a.alter));
    table[pc] = cands[0];
  }
  return { table, signature, tonicName: name, minor, flats };
}

/** MIDI -> {letter, alter, octave} (scientific octave: C4 = 60). */
export function spell(midi, spelling) {
  const { letter, alter } = spelling.table[mod12(midi)];
  return { letter, alter, octave: Math.floor((midi - alter) / 12) - 1 };
}

export function vexKey(sp, octaveShift = 0) {
  const acc = { 2: '##', 1: '#', 0: '', '-1': 'b', '-2': 'bb' }[sp.alter];
  return `${sp.letter.toLowerCase()}${acc}/${sp.octave + octaveShift}`;
}

export function lilyPitch(sp) {
  const base = sp.letter.toLowerCase();
  let acc = { 2: 'isis', 1: 'is', 0: '', '-1': 'es', '-2': 'eses' }[sp.alter];
  if (sp.alter < 0 && (base === 'e' || base === 'a')) acc = acc.slice(1); // es, as (Dutch names)
  const n = sp.octave - 3;
  return base + acc + (n > 0 ? "'".repeat(n) : ','.repeat(-n));
}

/** Key signature names: VexFlow ("F#m", "Bb") and LilyPond ("fis \\minor"). */
export function keyNames(spelling) {
  const t = spelling.tonicName;
  const sp = { letter: t[0], alter: t[1] === '#' ? 1 : t[1] === 'b' ? -1 : 0, octave: 3 };
  return { vex: t + (spelling.minor ? 'm' : ''), lily: `${lilyPitch(sp)} \\${spelling.minor ? 'minor' : 'major'}` };
}

// ------------------------------------------------------------------ clefs

// sounding pitch is written an octave higher for the tenor voice and the double bass
const CLEF_BY_INSTRUMENT = {
  viola: { clef: 'alto' },
  cello: { clef: 'bass' },
  bassoon: { clef: 'bass' },
  bassVoice: { clef: 'bass' },
  bass: { clef: 'bass', octave: -1 },
  tenor: { clef: 'treble', octave: -1 },
  // the guitar is written an octave higher than it sounds (the "8" under the treble clef)
  violaFado: { clef: 'treble', octave: -1 },
  guitar: { clef: 'treble', octave: -1 },
  guitarra: { clef: 'treble' },
};

export function clefFor(instrumentId, pitches) {
  if (CLEF_BY_INSTRUMENT[instrumentId]) return { octave: 0, ...CLEF_BY_INSTRUMENT[instrumentId] };
  const s = pitches.slice().sort((a, b) => a - b);
  const median = s.length ? s[Math.floor(s.length / 2)] : 67;
  return { clef: median < 57 ? 'bass' : 'treble', octave: 0 };
}

// ------------------------------------------------------------------ bars

/**
 * Events with absolute starts (16ths) -> bars of items {pitch|null, pitches, dur, tie, rest, full,
 * start}. `tie` ties the item to the next one (a note split at a beat or bar line). Notes that
 * sound together make a chord: `pitches` holds them all, low to high, `pitch` the lowest.
 */
export function toBars(events, nBars, m) {
  const total = nBars * m.barLen;
  const sounding = Array.from({ length: total }, () => []);
  const onset = new Array(total).fill(false);
  for (const e of events) {
    if (e.pitch === null || e.pitch === undefined) continue;
    for (let s = e.start; s < Math.min(total, e.start + e.dur); s++) if (!sounding[s].includes(e.pitch)) sounding[s].push(e.pitch);
    if (e.start < total) onset[e.start] = true;
  }
  const keyAt = sounding.map((ps) => (ps.length ? ps.sort((a, b) => a - b).join(',') : null));
  const bars = [];
  for (let b = 0; b < nBars; b++) {
    const items = [];
    const s0 = b * m.barLen;
    let s = s0;
    while (s < s0 + m.barLen) {
      const k = keyAt[s];
      let e = s + 1;
      while (e < s0 + m.barLen && keyAt[e] === k && !(k !== null && onset[e])) e++;
      const continues = k !== null && e === s0 + m.barLen && e < total && keyAt[e] === k && !onset[e];
      const parts = splitValues(s - s0, e - s, m);
      const pitches = k === null ? [] : sounding[s].slice();
      let pos = s - s0;
      parts.forEach((d, i) => {
        items.push({ pitch: k === null ? null : pitches[0], pitches, dur: d, rest: k === null, start: pos, tie: k !== null && (i < parts.length - 1 || continues) });
        pos += d;
      });
      s = e;
    }
    if (items.length && items.every((it) => it.rest)) bars.push([{ pitch: null, pitches: [], dur: m.barLen, rest: true, full: true, start: 0, tie: false }]);
    else bars.push(items);
  }
  return bars;
}

/**
 * Score model of a piece: one staff per voice.
 * @param voices [{events (absolute starts, sounding pitches), instrument, name, dynamics (false: no
 *   dynamic marks for this staff, as for an accompaniment), clef (to force one: the piano's left
 *   hand of an accompaniment is in the bass clef)}]
 * @param chords [{start, dur, name, root, q}] chord symbols over the first staff (accompaniment)
 * @param marks {rit: [steps], fermata: [steps], last} the rubato (core/expression.js): "rit." and
 *   fermatas over the first staff, and with `last` a fermata on the last note of every staff
 *   that carries dynamics
 */
export function scoreModel({ voices, total, barLen, meter = null, key, title = '', subtitle = '', bpm = 84, chords = null, marks = null }) {
  const m = meterOf(barLen, meter);
  const spelling = spellingFor(key);
  const nBars = Math.max(1, Math.ceil(total / barLen));
  return {
    meter: m,
    spelling,
    keyNames: keyNames(spelling),
    nBars,
    title,
    subtitle,
    bpm,
    marks: marks ? { rit: marks.rit ?? [], fermata: marks.fermata ?? [], last: !!marks.last } : null,
    chords: chords ? chords.filter((c) => c.start < nBars * m.barLen).map((c) => ({ step: c.start, dur: c.dur, name: c.name, root: c.root, q: c.q })) : null,
    staves: voices.map((v, i) => {
      const pitches = v.events.filter((e) => e.pitch !== null).map((e) => e.pitch);
      // dynamics, when the notes carry them (the fado styles; core/expression.js)
      const dynamics = v.dynamics !== false && v.events.some((e) => e.x) ? dynamicMarks(v.events.filter((e) => e.start < nBars * m.barLen)) : [];
      // fermatas: the first staff's, and the last note of every staff with dynamics
      const notes = v.events.filter((e) => e.pitch !== null && e.start < nBars * m.barLen);
      const fermata = [...(i === 0 ? marks?.fermata ?? [] : [])];
      if (marks?.last && v.dynamics !== false && notes.length) fermata.push(Math.max(...notes.map((e) => e.start)));
      const clef = v.clef ? { clef: v.clef, octave: 0 } : clefFor(v.instrument, pitches);
      return { name: v.name, instrument: v.instrument, ...clef, bars: toBars(v.events, nBars, m), dynamics, fermata };
    }),
  };
}

/**
 * The canon on one line, as rounds are printed: the melody once, a numbered mark where each voice
 * comes in (when the first voice reaches mark k, voice k starts from the beginning), a legend
 * with each voice's instrument, entry and interval, and repeat signs for a round.
 * @param lead {events, instrument, name}
 * @param entries [{step, name, intervalLabel}] one per voice, the first at step 0
 */
export function canonLineModel({ lead, entries, length, barLen, meter = null, key, title = '', subtitle = '', bpm = 84, circular = false }) {
  // no instrument name on the staff: every voice reads it (the legend says who comes in where)
  const model = scoreModel({ voices: [{ ...lead, name: '' }], total: length, barLen, meter, key, title, subtitle, bpm });
  const m = model.meter;
  const where = (step) => {
    const bar = 1 + Math.floor(step / m.barLen);
    const off = step % m.barLen;
    return off === 0 ? t('score.where.bar', { bar }) : t('score.where.beat', { bar, beat: 1 + Math.floor(off / (m.barLen / m.num)) });
  };
  const n = entries.length;
  model.entries = entries.map((e, i) => ({ step: e.step, number: i + 1, short: e.name }));
  model.repeat = !!circular && n > 1;
  const lastEnd = length + Math.max(...entries.map((e) => e.step));
  const endBar = Math.ceil(lastEnd / m.barLen);
  model.legend = [
    { text: t(model.repeat ? 'score.legend.round' : 'score.legend.canon', { n }) },
    ...entries.map((e, i) => ({
      mark: i + 1,
      text: i === 0 ? t('score.legend.lead', { name: e.name }) : t('score.legend.entry', { name: e.name, where: where(e.step), interval: e.intervalLabel ? `, ${e.intervalLabel}` : '' }),
    })),
    { text: model.repeat ? t('score.legend.repeatEnd') : t('score.legend.end', { bars: endBar }) },
  ];
  return model;
}

// ------------------------------------------------------------------ LilyPond

const LILY_MIDI = {
  guitarra: 'acoustic guitar (steel)', violaFado: 'acoustic guitar (nylon)', guitar: 'acoustic guitar (nylon)',
  violin: 'violin', viola: 'viola', cello: 'cello', bass: 'contrabass', flute: 'flute', recorder: 'recorder',
  oboe: 'oboe', clarinet: 'clarinet', bassoon: 'bassoon', horn: 'french horn', trumpet: 'trumpet',
  harpsichord: 'harpsichord', piano: 'acoustic grand', organ: 'church organ',
  soprano: 'choir aahs', alto: 'choir aahs', tenor: 'choir aahs', bassVoice: 'choir aahs',
};
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const lilyString = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** Tempo mark on the beat of the meter (quarter-note BPM in, e.g. "4. = 56" in 6/8). */
export function tempoMark(m, bpm) {
  return { unit: m.beat, value: Math.round((bpm * 4) / m.beat) };
}

export function toLilyPond(model) {
  const m = model.meter;
  // a whole bar as one duration: 1 (4/4), 2. (3/4, 6/8), or eighths times n (8*9 in 9/8)
  const barDur = LILY_DURATION[m.barLen] ?? `${m.den}*${m.num}`;
  const tempo = tempoMark(m, model.bpm);
  const lines = [];
  lines.push('\\version "2.24.0"', '');
  lines.push('\\header {');
  if (model.title) lines.push(`  title = ${lilyString(model.title)}`);
  if (model.subtitle) lines.push(`  subtitle = ${lilyString(model.subtitle)}`);
  lines.push('  composer = "Ondas Atratoras (algoritmo genético)"', '  tagline = ##f', '}', '');
  if (model.legend?.length) {
    // the voices of the one-line canon, under the title
    lines.push('\\markup \\column {');
    for (const l of model.legend) lines.push(`  \\line { ${l.mark ? `\\box ${lilyString(l.mark)} ` : ''}${lilyString(l.text)} }`);
    lines.push('}', '');
  }
  lines.push(`global = { \\key ${model.keyNames.lily} \\time ${m.num}/${m.den} \\tempo ${LILY_DURATION[tempo.unit]} = ${tempo.value} }`, '');
  const names = [];
  model.staves.forEach((st, i) => {
    const id = `voz${ROMAN[i] ?? i + 1}`;
    names.push(id);
    const clef = st.clef + (st.octave < 0 ? '_8' : '');
    const bars = [];
    let restRun = 0;
    const flushRests = () => {
      if (restRun) bars.push(`R${barDur}${restRun > 1 ? `*${restRun}` : ''}`);
      restRun = 0;
    };
    const marks = i === 0 ? model.entries ?? [] : [];
    // dynamics (fado): what to write after the item that starts at a step; a hairpin ends (\!)
    // on the first item at or after its end
    const dyn = new Map();
    const post = (step, txt) => dyn.set(step, [...(dyn.get(step) ?? []), txt]);
    const starts = st.bars.flatMap((bar, b) => bar.map((it) => b * m.barLen + it.start));
    for (const st0 of new Set(st.fermata ?? [])) post(st0, '\\fermata');
    if (i === 0 && model.marks) for (const st0 of model.marks.rit) post(st0, '^\\markup { \\italic "rit." }');
    for (const d of st.dynamics ?? []) {
      if (d.type === 'accent') post(d.step, '->');
      else if (d.type === 'text') post(d.step, `\\${d.text}`);
      else {
        post(d.step, d.type === 'cresc' ? '\\<' : '\\>');
        const stop = starts.find((x) => x >= d.end);
        if (stop !== undefined) post(stop, '\\!');
      }
    }
    const order = (a) => (a === '\\!' ? 0 : a === '->' || a === '\\fermata' ? 1 : a.startsWith('^') ? 4 : a.startsWith('\\') && !/[<>]$/.test(a) ? 2 : 3);
    const postOf = (step) => (dyn.get(step) ?? []).slice().sort((a, b) => order(a) - order(b)).join('');
    st.bars.forEach((bar, b) => {
      const here = marks.filter((e) => Math.floor(e.step / m.barLen) === b);
      if (bar.length === 1 && bar[0].full && !here.length && !dyn.has(b * m.barLen)) {
        restRun++;
        return;
      }
      flushRests();
      const done = new Set();
      const tokens = [];
      for (const it of bar) {
        for (const e of here) {
          if (!done.has(e) && e.step - b * m.barLen <= it.start + (it.full ? m.barLen : it.dur) - 1) {
            tokens.push(`\\mark \\markup \\box ${lilyString(e.number)}`);
            done.add(e);
          }
        }
        const after = postOf(b * m.barLen + it.start);
        if (it.full) tokens.push(`R${barDur}${after}`);
        else if (it.rest) tokens.push(`r${LILY_DURATION[it.dur]}${after}`);
        else {
          const ps = it.pitches?.length ? it.pitches : [it.pitch];
          const head = ps.length > 1 ? `<${ps.map((p) => lilyPitch(spell(p, model.spelling))).join(' ')}>` : lilyPitch(spell(ps[0], model.spelling));
          tokens.push(`${head}${LILY_DURATION[it.dur]}${it.tie ? '~' : ''}${after}`);
        }
      }
      bars.push(tokens.join(' '));
    });
    flushRests();
    lines.push(`${id} = {`, `  \\global \\clef ${lilyString(clef)}`);
    if (model.repeat) lines.push('  \\bar ".|:"');
    bars.forEach((b) => lines.push(`  ${b} |`));
    lines.push(model.repeat ? '  \\bar ":|."' : '  \\bar "|."', '}', '');
  });
  // chord symbols over the music (the accompaniment's harmony), as a lead sheet prints them
  let chordNames = null;
  if (model.chords?.length) {
    const LILY_Q = { M: '', m: ':m', 7: ':7', m7b5: ':m7.5-' };
    const tokens = [];
    let at = 0;
    for (const c of model.chords) {
      if (c.step > at) for (const d of splitValues(at % m.barLen, c.step - at, m)) tokens.push(`s${LILY_DURATION[d]}`);
      const name = lilyPitch({ ...spell(60 + c.root, model.spelling), octave: 3 });
      splitValues(c.step % m.barLen, c.dur, m).forEach((d, i) => tokens.push(i ? `s${LILY_DURATION[d]}` : `${name}${LILY_DURATION[d]}${LILY_Q[c.q] ?? ''}`));
      at = c.step + c.dur;
    }
    chordNames = `acordes = \\chordmode { ${tokens.join(' ')} }`;
    lines.push(chordNames, '');
  }
  lines.push('\\score {');
  // the chord names go over the staff group, in a simultaneous block of their own
  if (chordNames) lines.push('  <<', '  \\new ChordNames \\acordes');
  lines.push(model.staves.length > 1 ? '  \\new StaffGroup <<' : '  <<');
  model.staves.forEach((st, i) => {
    lines.push(`    \\new Staff \\with { instrumentName = ${lilyString(st.name)} midiInstrument = ${lilyString(LILY_MIDI[st.instrument] ?? 'violin')} } \\${names[i]}`);
  });
  lines.push('  >>');
  if (chordNames) lines.push('  >>');
  lines.push('  \\layout { }', '  \\midi { }', '}', '');
  return lines.join('\n');
}
