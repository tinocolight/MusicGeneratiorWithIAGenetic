import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toEvents, fromEvents, REST, HOLD, midiToGene } from '../src/core/score.js';

test('holds extend notes and rests; a leading hold is a rest', () => {
  const g = [HOLD, midiToGene(69), HOLD, HOLD, REST, HOLD, midiToGene(71)];
  assert.deepEqual(toEvents(g), [
    { pitch: null, start: 0, dur: 1 },
    { pitch: 69, start: 1, dur: 3 },
    { pitch: null, start: 4, dur: 2 },
    { pitch: 71, start: 6, dur: 1 },
  ]);
});

test('events -> genome -> events round trip', () => {
  const ev = [{ pitch: 67, start: 0, dur: 4 }, { pitch: null, start: 4, dur: 2 }, { pitch: 72, start: 6, dur: 10 }];
  assert.deepEqual(toEvents(fromEvents(ev, 16)), ev);
});
