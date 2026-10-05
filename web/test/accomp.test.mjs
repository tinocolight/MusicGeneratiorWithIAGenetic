// Melody + decoupled accompaniment (fado): the chords, the viola and the guitarra, the rubato, the
// score and the quick start.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harmonize, fadoAccompaniment, introBarsFor, chordPcs } from '../src/accomp/fado.js';
import { rubatoOf, timeline } from '../src/core/expression.js';
import { compactToEvents } from '../src/core/score.js';
import { scoreModel, toLilyPond, toBars, meterOf } from '../src/io/notation.js';
import { writeMidi, readMidi } from '../src/io/midi.js';
import { deriveQuickStart, ACCOMP_STYLES, styleForVoices, lengthFor } from '../src/ui/quickstart.js';
import { defaultConfig, applyEnsemble } from '../src/ui/config.js';
import { INSTRUMENTS } from '../src/core/instruments.js';

// the quatrain of test/fado.test.mjs, in G minor
const FADO = [
  [-1, 4], [70, 2], [70, 2], [70, 2], [72, 2], [70, 2], [69, 10], [-1, 8],
  [-1, 4], [67, 2], [67, 2], [69, 2], [70, 2], [69, 2], [67, 10], [-1, 8],
  [-1, 4], [74, 2], [74, 2], [77, 4], [75, 2], [74, 2], [72, 12], [-1, 6],
  [-1, 4], [72, 2], [70, 2], [69, 2], [67, 2], [69, 2], [67, 10], [-1, 6],
];
const ev = compactToEvents(FADO);
const length = ev.at(-1).start + ev.at(-1).dur;
const Gm = { tonic: 7, mode: 'minor' };

test('the chords follow the fado: tonic first and last, the held notes over their chords, slow changes', () => {
  const chords = harmonize(ev, { length, barLen: 16, beat: 4, key: Gm });
  assert.equal(chords[0].id, 'i');
  assert.equal(chords.at(-1).id, 'i', 'ends on the tonic');
  assert.equal(chords.at(-2).id, 'V7', 'after the dominant');
  // contiguous, covering the melody
  assert.equal(chords[0].start, 0);
  for (let i = 1; i < chords.length; i++) assert.equal(chords[i].start, chords[i - 1].start + chords[i - 1].dur);
  assert.equal(chords.at(-1).start + chords.at(-1).dur, length);
  // every held note at the end of a verse is a note of its chord (looked at in its middle: the
  // held note is often sung before its chord, as an anticipation)
  for (const [p, s, d] of [[69, 14, 10], [67, 46, 10], [72, 80, 12], [67, 112, 10]]) {
    const mid = s + Math.floor(d / 2);
    const c = chords.find((x) => x.start <= mid && mid < x.start + x.dur);
    assert.ok(c.pcs.includes(p % 12), `${p} at ${mid} over ${c.name}`);
  }
  // no more than one change per half bar, and most chords last a bar or more
  assert.ok(chords.filter((c) => c.dur >= 16).length >= chords.length / 2, chords.map((c) => c.name).join(' '));
  assert.deepEqual(chordPcs({ root: 7, q: '7' }, 7).sort((a, b) => a - b), [0, 2, 6, 9], 'D7 in G minor: D F# A C');
});

test('the accompaniment: an introduction, the viola on bass and chords, the guitarra in the breaths', () => {
  const acc = fadoAccompaniment(ev, { length, barLen: 16, beat: 4, meter: '4/4', key: Gm, kind: 'sad', seed: 3 });
  assert.equal(acc.intro, introBarsFor('4/4') * 16);
  assert.equal(acc.total, acc.intro + length);
  const { guitarra, viola } = acc.parts;
  // the introduction is the guitarra's alone (with the viola), loud, before the voice
  const intro = guitarra.filter((e) => e.start < acc.intro);
  assert.ok(intro.length >= 4);
  assert.ok(intro.every((e) => e.x.vel >= 0.7), 'the introduction is forte');
  // the viola: a bass on the downbeats, chords of three notes in the middle register
  const downbeats = viola.filter((e) => e.start % 16 === 0);
  assert.ok(downbeats.length >= 4 && downbeats.every((e) => e.pitch <= 52 || e.dur >= 8));
  const chords = new Map();
  for (const e of viola) chords.set(e.start, [...(chords.get(e.start) ?? []), e.pitch]);
  assert.ok([...chords.values()].filter((ps) => ps.length === 3).length >= 6, 'chords of three notes');
  // every viola note is in its instrument's range, every guitarra note in the guitarra's
  for (const e of viola) assert.ok(e.pitch >= INSTRUMENTS.violaFado.range[0] && e.pitch <= INSTRUMENTS.violaFado.range[1], `viola ${e.pitch}`);
  for (const e of guitarra) assert.ok(e.pitch >= INSTRUMENTS.guitarra.range[0] && e.pitch <= INSTRUMENTS.guitarra.range[1], `guitarra ${e.pitch}`);
  // an answer in the breath after the 1st verse (the voice rests from 24 to 36 in its own time)
  const answer = guitarra.filter((e) => e.start >= acc.intro + 24 && e.start < acc.intro + 36);
  assert.ok(answer.length >= 3, 'the guitarra answers in the breath');
  // under the held note of the 1st verse, the soft dedilho (an eighth and two sixteenths)
  const under = guitarra.filter((e) => e.start >= acc.intro + 18 && e.start < acc.intro + 24);
  assert.ok(under.length >= 3 && under.every((e) => e.x.vel < 0.45 && e.pitch !== 69), under.map((e) => `${e.pitch}/${e.dur}`).join(' '));
  // the same seed, the same accompaniment
  assert.deepEqual(fadoAccompaniment(ev, { length, barLen: 16, beat: 4, meter: '4/4', key: Gm, kind: 'sad', seed: 3 }).parts, acc.parts);
  // the happy fado in 2/4: bass and chord on every beat
  const happy = fadoAccompaniment(compactToEvents([[67, 4], [71, 4], [74, 8], [-1, 4], [72, 4], [71, 4], [69, 4], [67, 16], [-1, 16], [72, 8], [71, 8], [69, 8], [67, 24]]), { length: 128, barLen: 8, beat: 4, meter: '2/4', key: { tonic: 7, mode: 'major' }, kind: 'happy', seed: 1 });
  assert.equal(happy.intro, 32);
  const offbeats = happy.parts.viola.filter((e) => e.start % 4 === 2);
  assert.ok(offbeats.length > 20, 'a chord on the off-beat of every beat');
});

test('rubato: slower into the held notes, a fermata at the end, written as rit. and fermata', () => {
  const r = rubatoOf(ev, { total: length, beat: 4, kind: 'sad' });
  assert.equal(r.stretch.length, length);
  assert.equal(r.stretch[0], 1, 'in time at the start');
  assert.ok(r.stretch[14] > 1, 'the first held note stretches');
  assert.ok(r.stretch[115] >= 1.5, 'the fermata on the last note');
  assert.deepEqual(r.marks.fermata, [112]);
  assert.ok(r.marks.rit.includes(108));
  const times = timeline(r.stretch, 60);
  assert.ok(times.at(-1) > (length * 60) / 60 / 4, 'the piece lasts longer than in strict time');
  // the score and the LilyPond export carry them; the MIDI file gets the tempo changes
  const model = scoreModel({ voices: [{ events: ev, instrument: 'alto', name: 'Voz' }], total: length, barLen: 16, meter: '4/4', key: Gm, marks: r.marks });
  const ly = toLilyPond(model);
  assert.match(ly, /\\fermata/);
  assert.match(ly, /rit\./);
  const tempos = r.stretch.flatMap((f, i) => (i && f !== r.stretch[i - 1] ? [{ step: i, bpm: 72 / f }] : []));
  const bytes = writeMidi([{ events: ev, name: 'Voz', program: 52 }], { bpm: 72, tempos });
  assert.ok(bytes.length > writeMidi([{ events: ev, name: 'Voz', program: 52 }], { bpm: 72 }).length);
  assert.equal(readMidi(bytes).compact.filter(([p]) => p >= 0).length, ev.filter((e) => e.pitch !== null).length);
});

test('chords in the notation: notes sounding together are one item, written <...> in LilyPond', () => {
  const m = meterOf(16, '4/4');
  const bars = toBars([{ pitch: 43, start: 0, dur: 4 }, { pitch: 58, start: 4, dur: 4 }, { pitch: 62, start: 4, dur: 4 }, { pitch: 67, start: 4, dur: 4 }], 1, m);
  assert.deepEqual(bars[0].map((it) => it.pitches), [[43], [58, 62, 67], []]);
  const acc = fadoAccompaniment(ev, { length, barLen: 16, beat: 4, meter: '4/4', key: Gm, kind: 'sad', seed: 3 });
  const model = scoreModel({
    voices: [{ events: ev.map((e) => ({ ...e, start: e.start + acc.intro })), instrument: 'alto', name: 'Voz' }, { events: acc.parts.guitarra, instrument: 'guitarra', name: 'Guitarra', dynamics: false }, { events: acc.parts.viola, instrument: 'violaFado', name: 'Viola', dynamics: false }],
    total: acc.total, barLen: 16, meter: '4/4', key: Gm, chords: acc.chords,
  });
  assert.equal(model.staves[2].octave, -1, 'the viola is written an octave up');
  assert.equal(model.chords[0].step, 0);
  const ly = toLilyPond(model);
  assert.match(ly, /<[a-g][^>]* [a-g][^>]* [a-g][^>]*>4/, 'viola chords');
  assert.match(ly, /\\new ChordNames \\acordes/);
  assert.match(ly, /acordes = \\chordmode \{[^}]*g[0-9.]*:m[^}]*d[0-9.]*:7/, 'chord names: G minor and D7');
});

test('quick start: "melody + accompaniment" leaves only the styles that have one and counts the introduction', () => {
  assert.deepEqual(ACCOMP_STYLES, ['fado', 'fadoAlegre', 'folk', 'children', 'polka', 'march', 'waltz', 'blues']);
  assert.equal(styleForVoices('accomp', 'reel'), 'fado');
  assert.equal(styleForVoices('accomp', 'waltz'), 'waltz');
  const waltz = deriveQuickStart({ voices: 'accomp', style: 'waltz', seconds: 60, tempo: 'moderate' });
  assert.equal(waltz.style, 'waltz');
  assert.equal(waltz.meter, '3/4');
  assert.equal(waltz.config.accompaniment, true);
  assert.equal(styleForVoices('accomp', 'fadoAlegre'), 'fadoAlegre');
  assert.equal(styleForVoices('telemann', 'reel'), 'reel');
  const res = deriveQuickStart({ voices: 'accomp', style: 'jig', seconds: 60, tempo: 'moderate' });
  assert.equal(res.style, 'fado');
  assert.equal(res.config.accompaniment, true);
  assert.equal(res.config.voices[0].instrument, 'alto');
  assert.ok(['4/4', '2/4'].includes(res.meter));
  const plain = lengthFor({ seconds: 60, bpm: 72, meter: '4/4', voices: 'solo' });
  const withIntro = lengthFor({ seconds: 60, bpm: 72, meter: '4/4', voices: 'accomp' });
  assert.ok(withIntro.bars <= plain.bars, 'the introduction takes part of the time');
  // other voices switch the accompaniment off
  const c = defaultConfig();
  applyEnsemble(c, 'accomp');
  assert.equal(c.accompaniment, true);
  applyEnsemble(c, 'telemann');
  assert.equal(c.accompaniment, false);
});
