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

test('zip wrapper stores the MIDI bytes verbatim', async () => {
  const { makeZip, crc32 } = await import('../src/io/zip.js');
  const data = new Uint8Array([1, 2, 3, 250]);
  const zip = makeZip([{ name: 'a.mid', data }]);
  assert.equal(new DataView(zip.buffer).getUint32(0, true), 0x04034b50);
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
  const nameLen = new DataView(zip.buffer).getUint16(26, true);
  assert.deepEqual([...zip.slice(30 + nameLen, 30 + nameLen + 4)], [...data]);
});
