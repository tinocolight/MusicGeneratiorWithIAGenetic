import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultConfig, applyEnsemble, autoConfigure, buildFitness, BAR_OPTIONS } from '../src/ui/config.js';
import { createGA } from '../src/ga/ga.js';
import { createRng } from '../src/core/rng.js';
import { toEvents } from '../src/core/score.js';

test('pieces of 16, 32 and 64 bars', () => {
  for (const b of [16, 32, 64]) assert.ok(BAR_OPTIONS.includes(b));
  for (const [mode, bars] of [['field', 64], ['classic', 32]]) {
    const c = applyEnsemble(defaultConfig(), 'trio');
    c.mode = mode;
    c.bars = bars;
    const built = buildFitness(c);
    assert.equal(built.fit.length, bars * 16);
    const binary = mode === 'classic';
    const ga = createGA({ fitness: built.fit, rng: createRng(2), length: built.fit.length, env: built.env, generations: 3, popSize: 12, strategy: binary ? 'geneticsharp' : 'tournament', operators: binary ? 'binary' : 'musical', initMode: 'auto' });
    ga.step(Infinity);
    assert.equal(ga.best.decoded.length, bars * 16);
    assert.ok(Number.isFinite(ga.best.fitness));
    assert.ok(toEvents(ga.best.decoded).some((e) => e.start >= (bars - 1) * 16), 'the last bar is written too');
  }
});

test('auto-configuration picks a length of the menu that leaves room for the last entry', () => {
  const c = applyEnsemble(defaultConfig(), 'trio');
  c.voices[2].delayBars = 10;
  autoConfigure(c);
  assert.equal(c.bars, 32); // 2 x 10 + 4 = 24 -> 32 (before: capped at 16)
  const s = applyEnsemble(defaultConfig(), 'solo');
  autoConfigure(s);
  assert.equal(s.bars, 8);
});
