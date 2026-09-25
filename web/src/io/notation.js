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

// ------------------------------------------------------------------ meter

/** Meter of a bar of `barLen` 16ths: time signature, beat length and beaming unit. */
export function meterOf(barLen) {
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
};

export function clefFor(instrumentId, pitches) {
  if (CLEF_BY_INSTRUMENT[instrumentId]) return { octave: 0, ...CLEF_BY_INSTRUMENT[instrumentId] };
  const s = pitches.slice().sort((a, b) => a - b);
  const median = s.length ? s[Math.floor(s.length / 2)] : 67;
  return { clef: median < 57 ? 'bass' : 'treble', octave: 0 };
}

// ------------------------------------------------------------------ bars

/**
 * Events with absolute starts (16ths) -> bars of items {pitch|null, dur, tie, rest, full, start}.
 * `tie` ties the item to the next one (a note split at a beat or bar line).
 */
export function toBars(events, nBars, m) {
  const total = nBars * m.barLen;
  const pitchAt = new Array(total).fill(null);
  const onset = new Array(total).fill(false);
  for (const e of events) {
    if (e.pitch === null || e.pitch === undefined) continue;
    for (let s = e.start; s < Math.min(total, e.start + e.dur); s++) pitchAt[s] = e.pitch;
    if (e.start < total) onset[e.start] = true;
  }
  const bars = [];
  for (let b = 0; b < nBars; b++) {
    const items = [];
    const s0 = b * m.barLen;
    let s = s0;
    while (s < s0 + m.barLen) {
      const p = pitchAt[s];
      let e = s + 1;
      while (e < s0 + m.barLen && pitchAt[e] === p && !(p !== null && onset[e])) e++;
      const continues = p !== null && e === s0 + m.barLen && e < total && pitchAt[e] === p && !onset[e];
      const parts = splitValues(s - s0, e - s, m);
      let pos = s - s0;
      parts.forEach((d, i) => {
        items.push({ pitch: p, dur: d, rest: p === null, start: pos, tie: p !== null && (i < parts.length - 1 || continues) });
        pos += d;
      });
      s = e;
    }
    if (items.length && items.every((it) => it.rest)) bars.push([{ pitch: null, dur: m.barLen, rest: true, full: true, start: 0, tie: false }]);
    else bars.push(items);
  }
  return bars;
}

/**
 * Score model of a piece: one staff per voice.
 * @param voices [{events (absolute starts, sounding pitches), instrument, name}]
 */
export function scoreModel({ voices, total, barLen, key, title = '', subtitle = '', bpm = 84 }) {
  const m = meterOf(barLen);
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
    staves: voices.map((v) => {
      const pitches = v.events.filter((e) => e.pitch !== null).map((e) => e.pitch);
      return { name: v.name, instrument: v.instrument, ...clefFor(v.instrument, pitches), bars: toBars(v.events, nBars, m) };
    }),
  };
}

// ------------------------------------------------------------------ LilyPond

const LILY_MIDI = {
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
  const barDur = LILY_DURATION[m.barLen] ?? `${m.num}*${m.den}`;
  const tempo = tempoMark(m, model.bpm);
  const lines = [];
  lines.push('\\version "2.24.0"', '');
  lines.push('\\header {');
  if (model.title) lines.push(`  title = ${lilyString(model.title)}`);
  if (model.subtitle) lines.push(`  subtitle = ${lilyString(model.subtitle)}`);
  lines.push('  composer = "Ondas Atratoras (algoritmo genético)"', '  tagline = ##f', '}', '');
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
    for (const bar of st.bars) {
      if (bar.length === 1 && bar[0].full) {
        restRun++;
        continue;
      }
      flushRests();
      bars.push(bar.map((it) => (it.rest ? `r${LILY_DURATION[it.dur]}` : `${lilyPitch(spell(it.pitch, model.spelling))}${LILY_DURATION[it.dur]}${it.tie ? '~' : ''}`)).join(' '));
    }
    flushRests();
    lines.push(`${id} = {`, `  \\global \\clef ${lilyString(clef)}`);
    bars.forEach((b) => lines.push(`  ${b} |`));
    lines.push('  \\bar "|."', '}', '');
  });
  lines.push('\\score {');
  lines.push(model.staves.length > 1 ? '  \\new StaffGroup <<' : '  <<');
  model.staves.forEach((st, i) => {
    lines.push(`    \\new Staff \\with { instrumentName = ${lilyString(st.name)} midiInstrument = ${lilyString(LILY_MIDI[st.instrument] ?? 'violin')} } \\${names[i]}`);
  });
  lines.push('  >>', '  \\layout { }', '  \\midi { }', '}', '');
  return lines.join('\n');
}
