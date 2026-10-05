// Melody + accompaniment for the styles other than the fado (accomp/harmony.js, accomp/patterns.js;
// results/acompanhamento.md): the implied harmony, the textures, the blues form.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { implyChords, bluesChords, chordPcs } from '../src/accomp/harmony.js';
import { styleAccompaniment, ACCOMP_PROFILES } from '../src/accomp/patterns.js';
import { compactToEvents } from '../src/core/score.js';
import { INSTRUMENTS } from '../src/core/instruments.js';
import { scoreModel, toLilyPond } from '../src/io/notation.js';

const G = { tonic: 7, mode: 'major' };
// a waltz tune of 8 bars of 3/4 in G: I I V7 V7 | I I V7 I
const WALTZ = compactToEvents([
  [67, 4], [71, 4], [74, 4], [74, 8], [71, 4], [69, 4], [72, 4], [74, 4], [72, 12],
  [71, 4], [74, 4], [79, 4], [78, 8], [74, 4], [72, 4], [69, 4], [66, 4], [67, 12],
]);
const lengthOf = (ev) => ev.at(-1).start + ev.at(-1).dur;

test('the implied harmony: the notes on the beats belong to their chords, tonic first and last, V7 before it', () => {
  const length = lengthOf(WALTZ);
  const chords = implyChords(WALTZ, { length, barLen: 12, beat: 4, key: G, vocab: 'dance', phraseLen: 48 });
  assert.equal(chords[0].name, 'G');
  assert.equal(chords.at(-1).name, 'G');
  assert.equal(chords.at(-2).name, 'D7');
  assert.equal(chords.at(-1).start + chords.at(-1).dur, length);
  const onBeat = WALTZ.filter((e) => e.pitch !== null && e.start % 4 === 0);
  const inChord = onBeat.filter((e) => chords.find((c) => c.start <= e.start && e.start < c.start + c.dur).pcs.includes(e.pitch % 12));
  assert.ok(inChord.length / onBeat.length >= 0.8, `${inChord.length}/${onBeat.length}`);
  assert.equal(chords[1].name, 'D7', 'the dominant under bars 3-4 (A, C, D)');
});

test('the waltz: oom-pah-pah, an introduction, the tonic chord held at the end', () => {
  const length = lengthOf(WALTZ);
  const acc = styleAccompaniment(WALTZ, { style: 'waltz', length, barLen: 12, beat: 4, meter: '3/4', key: G });
  assert.equal(acc.intro, 24, 'two bars');
  assert.equal(acc.total, 24 + length);
  assert.deepEqual(acc.partList, [{ id: 'piano', instrument: 'piano' }]);
  const piano = acc.parts.piano;
  // in each bar before the last: one bass note on 1, three-note chords on 2 and 3
  for (let bar = 0; bar < acc.total / 12 - 1; bar++) {
    const at = (t) => piano.filter((e) => e.start === bar * 12 + t);
    assert.equal(at(0).length, 1, `bar ${bar}: the bass`);
    assert.ok(at(0)[0].pitch <= 51);
    assert.equal(at(4).length, 3);
    assert.equal(at(8).length, 3);
  }
  const last = piano.filter((e) => e.start + e.dur === acc.total);
  assert.deepEqual([...new Set(last.map((e) => e.pitch % 12))].sort((a, b) => a - b), [2, 7, 11], 'G major held to the end');
  for (const e of piano) assert.ok(e.pitch >= 40 && e.pitch <= 64, `piano left hand ${e.pitch}`);
});

test('the polka and the march: oom-pah; the folk guitar: alternating bass; the children\'s song: block chords', () => {
  const tune = compactToEvents([[67, 2], [71, 2], [74, 2], [71, 2], [72, 4], [69, 4], [71, 2], [74, 2], [79, 4], [74, 2], [72, 2], [71, 2], [69, 2], [67, 8], [-1, 0]].filter((x) => x[1]));
  const length = lengthOf(tune);
  const polka = styleAccompaniment(tune, { style: 'polka', length, barLen: 8, beat: 4, meter: '2/4', key: G }).parts.piano;
  const beats = polka.filter((e) => e.start % 4 === 0 && e.start < length);
  const offs = polka.filter((e) => e.start % 4 === 2);
  assert.ok(beats.length >= 4 && beats.every((e) => e.pitch <= 51), 'a bass on every beat');
  assert.ok(offs.length >= 12 && offs.every((e) => e.pitch >= 52), 'a chord on every off-beat');
  const folk = styleAccompaniment(tune, { style: 'folk', length, barLen: 8, beat: 4, meter: '2/4', key: G });
  assert.equal(folk.partList[0].instrument, 'guitar');
  const bass = folk.parts.guitar.filter((e) => e.start % 4 === 0 && e.start < folk.total - 8).map((e) => e.pitch);
  assert.ok(bass.some((p, i) => i && p !== bass[i - 1]), 'the bass alternates');
  for (const e of folk.parts.guitar) assert.ok(e.pitch >= INSTRUMENTS.guitar.range[0] && e.pitch <= INSTRUMENTS.guitar.range[1]);
  const kids = styleAccompaniment(tune, { style: 'children', length, barLen: 8, beat: 4, meter: '2/4', key: G }).parts.piano;
  const blocks = new Map();
  for (const e of kids) blocks.set(e.start, (blocks.get(e.start) ?? 0) + 1);
  assert.ok([...blocks.values()].every((n) => n === 4), 'bass and triad together');
  assert.deepEqual(Object.keys(ACCOMP_PROFILES).sort(), ['blues', 'children', 'folk', 'march', 'polka', 'waltz']);
});

test('the blues: twelve bars, the quick change when the melody asks for it, the boogie-woogie bass, the score', () => {
  const C7 = { tonic: 0, mode: 'minor' };
  // a riff on the tonic, with an F (the 4th) held in the 2nd bar
  const riff = (b) => (b === 1 ? [[65, 8], [63, 4], [60, 4]] : [[60, 4], [63, 4], [65, 2], [67, 6]]);
  const ev = compactToEvents(Array.from({ length: 12 }, (_, b) => riff(b)).flat());
  const length = 12 * 16;
  const chords = bluesChords(ev, { length, barLen: 16, beat: 4, key: C7 });
  const at = (bar) => chords.find((c) => c.start <= bar * 16 && bar * 16 < c.start + c.dur).name;
  assert.deepEqual([0, 1, 2, 4, 5, 6, 8, 9, 10, 11].map(at), ['C7', 'F7', 'C7', 'F7', 'F7', 'C7', 'G7', 'F7', 'C7', 'C7']);
  assert.deepEqual(chordPcs({ root: 5, q: '7' }, 0).sort((a, b) => a - b), [0, 3, 5, 9], 'F7: F A C Eb');
  const acc = styleAccompaniment(ev, { style: 'blues', length, barLen: 16, beat: 4, meter: '4/4', key: C7 });
  assert.equal(acc.intro, 32);
  // the bass of the first bar of the voice: C E G A, and the chord on the 2nd and 4th beats
  const bar = acc.parts.piano.filter((e) => e.start >= 32 && e.start < 48);
  const lows = [0, 4, 8, 12].map((t) => Math.min(...bar.filter((e) => e.start === 32 + t).map((e) => e.pitch)) % 12);
  assert.deepEqual(lows, [0, 4, 7, 9]);
  assert.equal(bar.filter((e) => e.start === 36).length, 4, 'bass and chord on the 2nd beat');
  assert.equal(bar.filter((e) => e.start === 40).length, 1);
  // the score: the voice, the piano in the bass clef, the chord symbols
  const model = scoreModel({ voices: [{ events: ev.map((e) => ({ ...e, start: e.start + acc.intro })), instrument: 'alto', name: 'Voz' }, { events: acc.parts.piano, instrument: 'piano', name: 'Piano', dynamics: false }], total: acc.total, barLen: 16, meter: '4/4', key: C7, chords: acc.chords });
  assert.equal(model.staves[1].clef, 'bass');
  assert.match(toLilyPond(model), /acordes = \\chordmode \{[^}]*c[0-9.]*:7/);
});
