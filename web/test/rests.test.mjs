// Regression test for the "rests are a safe harbour" problem of the original rules
// (pointed out by the author): replacing notes by rests must not raise the new fitness,
// while it does raise the classic one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGA } from '../src/ga/ga.js';
import { createRng } from '../src/core/rng.js';
import { createAttractorFitness, BASIN_SHAPES, DEFAULT_WEIGHTS } from '../src/fitness/attractor.js';
import { createClassicFitness, CLASSIC_DEFAULTS } from '../src/fitness/classic.js';
import { REST, isNote } from '../src/core/score.js';

function withRests(genes, rng, share) {
  const g = genes.slice();
  for (let i = 1; i < g.length; i++) if (isNote(g[i]) && rng.chance(share)) g[i] = REST;
  return g;
}

test('attractor field: turning notes into rests lowers the score', () => {
  const fit = createAttractorFitness({ seed: 1 });
  const ga = createGA({ fitness: fit, rng: createRng(1), length: fit.length, env: fit.env, generations: 150, popSize: 60, strategy: 'tournament', operators: 'musical' });
  ga.step(150);
  const base = fit.evaluate(ga.best.decoded).score;
  const rng = createRng(9);
  for (let k = 0; k < 10; k++) assert.ok(fit.evaluate(withRests(ga.best.decoded, rng, 0.3)).score < base);
});

// Share of 16th steps that start a note, and share of steps inside rests.
function texture(genes) {
  let rest = 0;
  let cur = null;
  let onsets = 0;
  for (const x of genes) {
    if (x === REST) cur = 'r';
    else if (isNote(x)) {
      cur = 'n';
      onsets++;
    }
    if (cur === 'r') rest++;
  }
  return { onsets: onsets / genes.length, rest: rest / genes.length };
}

test('classic rules: enforcing the waves makes the GA stop attacking notes (holds and rests are never penalised)', () => {
  const run = (k) => {
    const scale = (g) => ({ ...g, wave1: g.wave1 * k, wave2: g.wave2 * k });
    const fit = createClassicFitness({ g1: scale(CLASSIC_DEFAULTS.g1), g2: scale(CLASSIC_DEFAULTS.g2) });
    const ga = createGA({ fitness: fit, rng: createRng(2), length: fit.length, generations: 800 });
    ga.step(800);
    return texture(ga.best.decoded);
  };
  const normal = run(1);
  const enforced = run(20);
  assert.ok(enforced.onsets < 0.6 * normal.onsets, `onsets ${normal.onsets} -> ${enforced.onsets}`);
});

test('attractor field: enforcing the basins does not empty the melody', () => {
  const fit = createAttractorFitness({ seed: 2, weights: { ...DEFAULT_WEIGHTS, attractor: 30 } });
  const ga = createGA({ fitness: fit, rng: createRng(2), length: fit.length, env: fit.env, generations: 200, popSize: 60, strategy: 'tournament', operators: 'musical' });
  ga.step(200);
  const t = texture(ga.best.decoded);
  assert.ok(t.rest <= 0.12, `rest share ${t.rest}`);
  assert.ok(t.onsets * 4 >= 0.7, `notes per beat ${t.onsets * 4}`);
});

test('basin influence decreases with distance', () => {
  for (const f of Object.values(BASIN_SHAPES)) {
    let prev = Infinity;
    for (let d = 0; d <= 10; d += 0.5) {
      const v = f(d, 3);
      assert.ok(v <= prev + 1e-12);
      prev = v;
    }
  }
});
