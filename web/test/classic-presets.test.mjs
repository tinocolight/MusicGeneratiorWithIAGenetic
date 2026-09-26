import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultConfig, buildFitness, applyClassicPreset, CLASSIC_PRESETS } from '../src/ui/config.js';
import { CLASSIC_DEFAULTS } from '../src/fitness/classic.js';
import { createGA } from '../src/ga/ga.js';
import { createRng } from '../src/core/rng.js';

const RULES = Object.keys(CLASSIC_DEFAULTS.g1);

test('the original and at least three calibrated starting combinations, each with both kinds of operators', () => {
  assert.equal(CLASSIC_PRESETS[0].id, 'original');
  const styles = CLASSIC_PRESETS.slice(1);
  assert.ok(styles.length >= 3);
  for (const p of styles) {
    for (const v of [p, p.binary]) {
      assert.ok(v, `${p.id} has a variant for the bit operators`);
      for (const r of RULES) assert.ok(Number.isFinite(v.g2[r]) && v.g2[r] >= 0, `${p.id} ${r}`);
      for (const w of v.waves) for (const k of ['meanA4', 'amplitude', 'basin', 'shift']) assert.ok(Number.isInteger(w[k]), `${p.id} wave ${k} is an integer, as in the C# form`);
      assert.ok(v.balanceMin >= 0 && v.balanceMax <= 100 && v.balanceMin < v.balanceMax);
      assert.ok(v.rangeAttractor >= 1);
    }
    assert.equal(p.ga.operators, 'musical');
    assert.equal(p.binary.ga.operators, 'binary');
  }
});

test('applying a combination follows the chosen operators, and the page can run it', () => {
  const c = defaultConfig();
  c.mode = 'classic';
  c.ga.operators = 'binary';
  applyClassicPreset(c, 'song');
  const song = CLASSIC_PRESETS.find((p) => p.id === 'song');
  assert.deepEqual(c.classicG2, { ...CLASSIC_DEFAULTS.g2, ...song.binary.g2 });
  assert.equal(c.ga.operators, 'binary');
  assert.equal(c.classicFixLapses, true);
  applyClassicPreset(c, 'song', 'musical');
  assert.deepEqual(c.classicG2, { ...CLASSIC_DEFAULTS.g2, ...song.g2 });
  assert.equal(c.ga.operators, 'musical');
  assert.equal(c.classicRange, song.rangeAttractor);
  // the original values with the musical operators keep the original weights
  applyClassicPreset(c, 'original', 'musical');
  assert.deepEqual(c.classicG2, { ...CLASSIC_DEFAULTS.g2 });
  assert.equal(c.classicBalanceMin, 7);
  assert.equal(c.ga.operators, 'musical');
  // a short run with a calibrated combination
  applyClassicPreset(c, 'chorale', 'musical');
  const b = buildFitness(c);
  const ga = createGA({ fitness: b.fit, rng: createRng(3), length: b.fit.length, env: b.env, generations: 20, popSize: 20, mutationRate: c.ga.mutation, strategy: 'tournament', operators: 'musical', initMode: 'musical' });
  ga.step(Infinity);
  assert.ok(Number.isFinite(ga.best.fitness));
  assert.ok(b.fit.evaluate(ga.best.decoded).parts.cadence !== 0, 'the ending formulas are weighted');
});
