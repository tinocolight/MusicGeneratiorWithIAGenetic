import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGA } from '../src/ga/ga.js';
import { createRng } from '../src/core/rng.js';
import { REST, HOLD, isNote, geneToMidi } from '../src/core/score.js';
import { defaultConfig, buildFitness } from '../src/ui/config.js';

const makeGA = (cfg, extra = {}) => {
  const b = buildFitness(cfg);
  return createGA({
    fitness: b.fit, rng: createRng(cfg.ga.seed), length: b.fit.length, env: b.env,
    generations: 20, popSize: 40, mutationRate: 0.9, strategy: 'tournament', operators: 'musical', ...extra,
  });
};
const key = (pop) => pop.map((ind) => ind.genes.join(',')).sort();

test('nothing carries over between runs: the initial population depends only on the seed', () => {
  const a = defaultConfig();
  const b = defaultConfig();
  b.weights = { ...b.weights, attractor: 9, variety: 0 }; // other settings, same seed
  assert.deepEqual(key(makeGA(a).population), key(makeGA(b).population));
  const c = defaultConfig();
  c.ga.seed = 8;
  assert.notDeepEqual(key(makeGA(a).population), key(makeGA(c).population));
});

test('random initial population has no predefined patterns', () => {
  const cfg = defaultConfig();
  const ga = makeGA(cfg, { initMode: 'random' });
  const genes = ga.population.flatMap((ind) => ind.genes);
  const share = (f) => genes.filter(f).length / genes.length;
  // a third each of rests, prolongations and notes (musical cells have far fewer rests)
  assert.ok(Math.abs(share((g) => g === REST) - 1 / 3) < 0.05);
  assert.ok(Math.abs(share((g) => g === HOLD) - 1 / 3) < 0.05);
  // chromatic: a good share of the notes are outside G major
  const notes = genes.filter(isNote).map(geneToMidi);
  const outOfKey = notes.filter((m) => [1, 3, 5, 8, 10].includes(((m % 12) + 12) % 12)).length / notes.length;
  assert.ok(outOfKey > 0.3, `out of key ${outOfKey}`);
  // noise scores far below a musical start
  const musical = makeGA(cfg, { initMode: 'musical' });
  assert.ok(ga.best.fitness < musical.best.fitness - 5);
});

test('continuing: the previous final population becomes the initial population', () => {
  const cfg = defaultConfig();
  const first = makeGA(cfg);
  first.step(20);
  const final = first.population.map((ind) => ind.genes.slice());
  const cont = makeGA({ ...cfg, ga: { ...cfg.ga, seed: 99 } }, { initialPopulation: final });
  assert.deepEqual(key(cont.population), key(first.population));
  assert.ok(cont.best.fitness >= first.best.fitness - 1e-9);
  // genomes of another length are ignored (e.g. the number of bars changed)
  const other = makeGA(cfg, { initialPopulation: [new Array(64).fill(REST)] });
  assert.equal(other.population[0].genes.length, 128);
});

test('the history starts at generation 0', () => {
  const ga = makeGA(defaultConfig(), { initMode: 'random' });
  ga.step(10);
  assert.equal(ga.history[0].generation, 0);
  assert.ok(ga.history.at(-1).best > ga.history[0].best);
});
