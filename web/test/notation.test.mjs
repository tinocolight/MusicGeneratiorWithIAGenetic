import { test } from 'node:test';
import assert from 'node:assert/strict';
import { meterOf, splitValues, spellingFor, spell, lilyPitch, keyNames, toBars, scoreModel, toLilyPond } from '../src/io/notation.js';
import { makeKey } from '../src/core/theory.js';

const name = (midi, key) => lilyPitch(spell(midi, spellingFor(key)));

test('pitch spelling follows the key', () => {
  const G = makeKey(7, 'major');
  assert.equal(name(66, G), "fis'"); // F#4
  assert.equal(name(67, G), "g'");
  assert.equal(name(65, G), "f'"); // chromatic F natural, not E#
  const F = makeKey(5, 'major');
  assert.equal(name(70, F), "bes'");
  assert.equal(name(63, F), "es'"); // E flat (Dutch "es")
  const Dm = makeKey(2, 'minor');
  assert.equal(name(61, Dm), "cis'"); // raised 7th in D minor
  assert.equal(name(71, Dm), "b'"); // raised 6th
  const Am = makeKey(9, 'minor');
  assert.equal(name(68, Am), "gis'");
  assert.equal(name(48, makeKey(0, 'major')), 'c');
  assert.equal(name(36, makeKey(0, 'major')), 'c,');
  assert.equal(keyNames(spellingFor(makeKey(3, 'major'))).lily, 'es \\major');
  assert.equal(keyNames(spellingFor(makeKey(6, 'minor'))).vex, 'F#m');
});

test('values are split at beats and bar lines, as a musician would write them', () => {
  const m44 = meterOf(16);
  assert.deepEqual(splitValues(0, 6, m44), [6]); // dotted quarter on the beat
  assert.deepEqual(splitValues(4, 8, m44), [4, 4]); // not across the middle of the bar
  assert.deepEqual(splitValues(0, 12, m44), [12]); // dotted half from the downbeat
  assert.deepEqual(splitValues(2, 3, m44), [2, 1]); // not across a beat
  assert.deepEqual(splitValues(0, 16, m44), [16]);
  const m68 = meterOf(12);
  assert.deepEqual(splitValues(0, 12, m68), [12]);
  assert.deepEqual(splitValues(4, 4, m68), [2, 2]); // across the dotted-quarter beat
  assert.deepEqual(splitValues(0, 6, m68), [6]);
});

test('bars add up, notes are tied across bar lines and empty bars become whole-bar rests', () => {
  const m = meterOf(16);
  // a note from the last beat of bar 1 to the 2nd beat of bar 2, then silence
  const bars = toBars([{ pitch: 67, start: 12, dur: 8 }], 3, m);
  bars.forEach((bar) => assert.equal(bar.reduce((a, it) => a + (it.full ? 16 : it.dur), 0), 16));
  const n1 = bars[0].at(-1);
  assert.equal(n1.pitch, 67);
  assert.equal(n1.tie, true);
  assert.equal(bars[1][0].pitch, 67);
  assert.equal(bars[1][0].tie, false);
  assert.ok(bars[2][0].full);
});

test('LilyPond export: key, meter, bar checks, delayed entries and ties', () => {
  const lead = [{ pitch: 67, start: 0, dur: 4 }, { pitch: 69, start: 4, dur: 4 }, { pitch: 71, start: 8, dur: 12 }, { pitch: 67, start: 20, dur: 12 }];
  const follower = lead.map((e) => ({ ...e, start: e.start + 16 }));
  const model = scoreModel({
    voices: [{ events: lead, instrument: 'violin', name: 'Violino 1' }, { events: follower, instrument: 'cello', name: 'Violoncelo' }],
    total: 48, barLen: 16, key: makeKey(7, 'major'), title: 'Teste', bpm: 84,
  });
  const ly = toLilyPond(model);
  assert.match(ly, /\\key g \\major \\time 4\/4 \\tempo 4 = 84/);
  assert.match(ly, /g'4 a'4 b'2~ \|/);
  assert.match(ly, /\\clef "bass"/);
  assert.match(ly, /vozII = \{\n {2}\\global \\clef "bass"\n {2}R1 \|/);
  assert.match(ly, /instrumentName = "Violoncelo" midiInstrument = "cello"/);
  assert.equal((ly.match(/\|\n/g) || []).length, 6); // 3 bars per voice
});
