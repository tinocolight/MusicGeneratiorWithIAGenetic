// Meters other than 4/4: the beat of simple and compound meters, the fitness, the GA, the score,
// the LilyPond and MIDI exports.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { METERS, meterOf, metricWeight, phraseBarsFor, meterFromSignature } from '../src/core/meter.js';
import { metricWeightFor } from '../src/fitness/canon.js';
import { createAttractorFitness } from '../src/fitness/attractor.js';
import { resolvePreset } from '../src/fitness/presets.js';
import { createGA } from '../src/ga/ga.js';
import { createRng } from '../src/core/rng.js';
import { toEvents } from '../src/core/score.js';
import { defaultConfig, buildFitness, autoConfigure, describe } from '../src/ui/config.js';
import { scoreModel, toLilyPond } from '../src/io/notation.js';
import { writeMidi, readMidi } from '../src/io/midi.js';

test('simple meters beat in quarters, compound meters in dotted quarters', () => {
  assert.deepEqual(['2/4', '3/4', '4/4', '3/8', '6/8', '9/8', '12/8'].map((id) => [METERS[id].barLen, METERS[id].beat]), [[8, 4], [12, 4], [16, 4], [6, 6], [12, 6], [18, 6], [24, 6]]);
  // 3/4 and 6/8 have the same bar length but not the same strong beats
  assert.equal(metricWeight(4, '3/4'), 0.7);
  assert.equal(metricWeight(4, '6/8'), 0.4);
  assert.equal(metricWeight(6, '6/8'), 0.8);
  assert.equal(metricWeight(6, '3/4'), 0.4);
  // 4/4 is unchanged
  for (let s = 0; s < 16; s++) assert.equal(metricWeight(s, '4/4'), metricWeightFor(s, 16));
  assert.equal(meterOf(12).id, '6/8');
  assert.equal(meterOf(12, '3/4').id, '3/4');
  assert.equal(meterFromSignature(2, 2).id, '4/4');
  assert.deepEqual(['4/4', '3/4', '6/8', '3/8'].map(phraseBarsFor), [2, 4, 4, 8]);
});

test('the fitness and the GA write whole bars of the chosen meter', () => {
  for (const meter of ['3/4', '6/8', '2/4', '9/8']) {
    const m = METERS[meter];
    const fit = createAttractorFitness({ bars: 8, meter, tonic: 7, mode: 'major', waves: resolvePreset('arch', 7) });
    assert.equal(fit.length, 8 * m.barLen);
    assert.equal(fit.env.beat, m.beat);
    const ga = createGA({ fitness: fit, rng: createRng(5), length: fit.length, env: fit.env, generations: 15, popSize: 20, strategy: 'tournament', operators: 'musical', initMode: 'musical' });
    ga.step(Infinity);
    assert.equal(ga.best.decoded.length, fit.length);
    assert.ok(Number.isFinite(ga.best.fitness));
    // the last note is long: it starts on the last downbeat (or the middle of a 4-beat bar)
    const evs = toEvents(ga.best.decoded).filter((e) => e.pitch !== null);
    assert.ok(evs.length > 8);
  }
});

test('a compound meter rewards its own figures', () => {
  const fit = createAttractorFitness({ bars: 2, meter: '6/8', tonic: 7, mode: 'major', waves: resolvePreset('arch', 7) });
  const three = [];
  // 6/8: quarter + eighth, three eighths | quarter + eighth, dotted quarter
  const bars = [[4, 2], [2, 2, 2], [4, 2], [6]];
  let p = 67;
  for (const beat of bars) for (const d of beat) {
    three.push(p - 32);
    for (let k = 1; k < d; k++) three.push(74);
    p += 2;
  }
  const inSix = fit.evaluate(three).parts.rhythm;
  const fit34 = createAttractorFitness({ bars: 2, meter: '3/4', tonic: 7, mode: 'major', waves: resolvePreset('arch', 7) });
  const inThree = fit34.evaluate(three).parts.rhythm;
  assert.ok(inSix > inThree, `6/8 ${inSix} vs 3/4 ${inThree}`);
});

test('the configuration carries the meter; the classic mode stays in 4/4', () => {
  const c = defaultConfig();
  assert.equal(c.meter, '4/4');
  c.meter = '6/8';
  autoConfigure(c);
  assert.equal(c.phraseBars, 4);
  assert.equal(c.bars, 16); // about 32 beats
  assert.match(describe(c), /6\/8/);
  const b = buildFitness(c);
  assert.equal(b.fit.length, 16 * 12);
  c.mode = 'classic';
  const classic = buildFitness(c);
  assert.equal(classic.env.meter.id, '4/4');
});

test('score, LilyPond and MIDI say 3/4 or 6/8, not the bar length', () => {
  const events = [{ pitch: 67, start: 0, dur: 4 }, { pitch: 69, start: 4, dur: 4 }, { pitch: 71, start: 8, dur: 4 }, { pitch: 72, start: 12, dur: 12 }];
  const key = { tonic: 7, mode: 'major', diatonic: [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1].map(Boolean) };
  const three = scoreModel({ voices: [{ events, instrument: 'violin', name: 'V' }], total: 24, barLen: 12, meter: '3/4', key });
  assert.deepEqual([three.meter.num, three.meter.den, three.meter.beat], [3, 4, 4]);
  assert.match(toLilyPond(three), /\\time 3\/4/);
  const six = scoreModel({ voices: [{ events, instrument: 'violin', name: 'V' }], total: 24, barLen: 12, meter: '6/8', key });
  assert.match(toLilyPond(six), /\\time 6\/8/);
  const bytes = writeMidi([{ events, name: 'V', program: 40 }], { bpm: 90, numerator: 6, denominator: 8 });
  const back = readMidi(bytes);
  assert.deepEqual([back.numerator, back.denominator, back.barLen], [6, 8, 12]);
});
