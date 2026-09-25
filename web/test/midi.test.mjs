import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeMidi, readMidi } from '../src/io/midi.js';
import { eventsToCompact } from '../src/core/score.js';

test('two-track canon MIDI can be read back', () => {
  const events = [{ pitch: 67, start: 0, dur: 4 }, { pitch: 71, start: 4, dur: 2 }, { pitch: null, start: 6, dur: 2 }, { pitch: 74, start: 8, dur: 8 }];
  const bytes = writeMidi([{ events, name: 'Violino 1' }, { events, offset: 16, name: 'Violino 2' }], { bpm: 100 });
  assert.equal(String.fromCharCode(...bytes.slice(0, 4)), 'MThd');
  const one = readMidi(bytes, { track: 1 });
  assert.deepEqual(one.compact, eventsToCompact(events));
  assert.deepEqual(one.tracks.map((t) => t.name), ['Violino 1', 'Violino 2']);
  assert.equal(one.barLen, 16);
});
