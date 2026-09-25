import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chaoticVariation, divergencePoint } from '../src/variation/dabby.js';
import corpus from '../src/data/corpus-data.js';
import { compactToEvents } from '../src/core/score.js';

const theme = compactToEvents(corpus[5].events);

test('a tiny perturbation reproduces the theme; a larger one departs from it', () => {
  const same = chaoticVariation(theme, { divergence: 1e-4 });
  assert.deepEqual(same, theme);
  const v = chaoticVariation(theme, { divergence: 0.3 });
  assert.ok(divergencePoint(theme, v) < theme.filter((e) => e.pitch !== null).length);
});

test('pitch mode keeps the rhythm and only reuses pitches of the theme', () => {
  const v = chaoticVariation(theme, { divergence: 0.2, mode: 'pitch' });
  assert.deepEqual(v.map((e) => [e.start, e.dur]), theme.map((e) => [e.start, e.dur]));
  const pitches = new Set(theme.map((e) => e.pitch));
  assert.ok(v.every((e) => pitches.has(e.pitch)));
});

test('full mode fills exactly the length of the theme', () => {
  const v = chaoticVariation(theme, { divergence: 0.2, mode: 'full' });
  assert.equal(v.reduce((a, e) => a + e.dur, 0), theme.reduce((a, e) => a + e.dur, 0));
});
