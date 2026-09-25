import { test } from 'node:test';
import assert from 'node:assert/strict';
import { melodyFeatures, lzComplexity } from '../src/eval/metrics.js';
import { loadCritic } from '../src/eval/critic.js';
import { nullMelody } from '../src/eval/nullmodels.js';
import criticData from '../src/data/critic-data.js';
import corpus from '../src/data/corpus-data.js';
import { REFERENCE_CANONS, referenceEvents } from '../src/data/references.js';
import { createRng } from '../src/core/rng.js';

test('stepwise scale: all intervals are steps', () => {
  const f = melodyFeatures([[60, 4], [62, 4], [64, 4], [65, 4], [67, 4], [69, 4], [71, 4], [72, 4]]);
  assert.equal(f.stepMovement, 1);
  assert.equal(f.repeatedPitch, 0);
});

test('Lempel-Ziv: a repeated pattern is simpler than a random sequence', () => {
  const rng = createRng(3);
  const rep = Array.from({ length: 64 }, (_, i) => 'abcd'[i % 4]);
  const rnd = Array.from({ length: 64 }, () => 'abcd'[rng.int(0, 3)]);
  assert.ok(lzComplexity(rep) < lzComplexity(rnd));
});

test('critic: cross-validated AUC is high and Telemann (not in the corpus) looks real', () => {
  assert.ok(criticData.cv.auc > 0.95);
  const critic = loadCritic(criticData);
  const tel = REFERENCE_CANONS.telemann;
  const first = [];
  let t = 0;
  for (const [p, d] of referenceEvents(tel)) {
    if (t >= 128) break;
    first.push([p, Math.min(d, 128 - t)]);
    t += d;
  }
  assert.ok(critic.evaluate(first, { barLen: 24 }).humanLike > 0.8);
  const rng = createRng(5);
  const noise = critic.evaluate(nullMelody('white-chromatic', rng, corpus), { barLen: 16 });
  assert.ok(noise.humanLike < 0.2);
});
