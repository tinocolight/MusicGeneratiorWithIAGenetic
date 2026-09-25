import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGA } from '../src/ga/ga.js';
import { createRng } from '../src/core/rng.js';
import { createClassicFitness } from '../src/fitness/classic.js';
import { createAttractorFitness } from '../src/fitness/attractor.js';
import { createMapElites } from '../src/ga/mapelites.js';

test('same seed, same composition; fitness improves (attractor field)', () => {
  const run = (seed) => {
    const fit = createAttractorFitness({ seed });
    const ga = createGA({ fitness: fit, rng: createRng(seed), length: fit.length, env: fit.env, generations: 60, popSize: 40, strategy: 'tournament', operators: 'musical' });
    const first = ga.best.fitness;
    ga.step(60);
    return { genes: ga.best.decoded.join(','), first, last: ga.best.fitness };
  };
  const a = run(3);
  assert.equal(a.genes, run(3).genes);
  assert.notEqual(a.genes, run(4).genes);
  assert.ok(a.last > a.first);
});

test('classic GA with GeneticSharp-like operators improves', () => {
  const fit = createClassicFitness();
  const ga = createGA({ fitness: fit, rng: createRng(1), length: fit.length, generations: 200 });
  ga.step(40);
  const early = ga.best.fitness;
  ga.step(160);
  assert.ok(ga.best.fitness > early);
  assert.ok(ga.best.decoded.every((g) => g >= 0 && g <= 74));
});

test('MAP-Elites fills many cells with different melodies', () => {
  const fit = createAttractorFitness();
  const me = createMapElites({ fitness: fit, env: fit.env, rng: createRng(2) });
  me.step(3000);
  assert.ok(me.coverage() > 0.3, `coverage ${me.coverage()}`);
  const distinct = new Set(me.cells.filter(Boolean).map((c) => c.genes.join(',')));
  assert.equal(distinct.size, me.cells.filter(Boolean).length);
});
