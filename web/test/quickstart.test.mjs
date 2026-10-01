// The quick start: six questions -> a whole starting configuration, with the number of bars worked
// out from the length asked for.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveQuickStart, lengthFor, canonShape, tempoFor, tempoLabel, meterFor, QS_STEPS, defaultAnswers } from '../src/ui/quickstart.js';
import { buildFitness, activeVoices, BAR_OPTIONS } from '../src/ui/config.js';
import { METERS } from '../src/core/meter.js';
import { STYLES } from '../src/fitness/styles.js';

const lengthOf = (res, voices) => {
  const s = canonShape(voices);
  return ((res.bars * s.reps + s.extraBars) * METERS[res.meter].barLen * 15) / res.bpm;
};

test('no more than six questions, and the defaults make a canon (the heart of the project)', () => {
  assert.ok(QS_STEPS.length <= 6);
  const res = deriveQuickStart(defaultAnswers());
  assert.ok(activeVoices(res.config).length >= 2, 'the default answer is a canon');
  assert.equal(res.config.mode, 'field');
  const b = buildFitness(res.config);
  assert.equal(b.fit.length, res.bars * METERS[res.meter].barLen);
});

test('the number of bars comes from the length, the meter and the tempo', () => {
  // a solo waltz of one minute: 3/4 at the style's tempo, about 60 s
  const w = deriveQuickStart({ voices: 'solo', style: 'waltz', meter: '4/4', seconds: 60 });
  assert.equal(w.meter, '3/4', 'a waltz is in 3/4 whatever the meter answered');
  assert.ok(BAR_OPTIONS.includes(w.bars));
  assert.ok(Math.abs(w.seconds - 60) < 6, `${w.seconds}`);
  assert.ok(Math.abs(lengthOf(w, 'solo') - w.seconds) < 1e-6);
  // longer asked -> more bars; livelier -> more bars for the same time
  const short = deriveQuickStart({ voices: 'solo', meter: '4/4', seconds: 30 });
  const long = deriveQuickStart({ voices: 'solo', meter: '4/4', seconds: 120 });
  assert.ok(long.bars > short.bars);
  const slow = lengthFor({ seconds: 60, bpm: tempoFor('none', '4/4', 'slow'), meter: '4/4', voices: 'solo' });
  const lively = lengthFor({ seconds: 60, bpm: tempoFor('none', '4/4', 'lively'), meter: '4/4', voices: 'solo' });
  assert.ok(lively.bars >= slow.bars);
  // the tempo is only nudged, at most 20 %
  for (const r of [w, short, long]) assert.ok(r.bpm >= 40 && r.bpm <= 240);
});

test('canons count the later voices; a round is heard twice; a canon has room for its last entry', () => {
  assert.deepEqual(canonShape('telemann'), { n: 2, reps: 1, extraBars: 0, need: 6 });
  assert.equal(canonShape('trio').extraBars, 2);
  assert.equal(canonShape('round').reps, 2);
  const trio = deriveQuickStart({ voices: 'trio', seconds: 15 });
  assert.ok(trio.bars >= canonShape('trio').need, 'never too short for the last voice');
  const round = deriveQuickStart({ voices: 'round', style: 'jig', seconds: 45 });
  assert.equal(round.config.circular, true);
  assert.equal(round.meter, '6/8');
  assert.ok(Math.abs(round.seconds - 45) < 8, `${round.seconds}`);
});

test('style, mode, waves and key are applied', () => {
  const res = deriveQuickStart({ voices: 'fifth', style: 'fado', seconds: 90, tempo: 'slow', waves: 'three', scale: 4 });
  assert.equal(res.config.style, 'fado');
  assert.equal(res.config.major, STYLES.fado.mode !== 'minor');
  assert.ok(res.config.weights.heuristics > 0, 'the style rules count');
  assert.equal(res.config.waves.length, 3);
  assert.equal(res.config.scale, 4);
  assert.equal(deriveQuickStart({ waves: 'two' }).config.waves.length, 2);
  assert.equal(deriveQuickStart({ style: 'none', mode: 'minor' }).config.major, false);
  assert.equal(meterFor('jig', '3/4'), '6/8');
  assert.equal(tempoLabel(120, '6/8'), '♩. = 80');
  assert.equal(tempoLabel(96, '4/4'), '♩ = 96');
});
