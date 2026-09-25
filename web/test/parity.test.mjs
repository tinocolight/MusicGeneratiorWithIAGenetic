// The JavaScript port of the classic rules must equal the ORIGINAL C# rules.
// Fixture produced by tools/parity-csharp (dotnet run -- test/fixtures/parity-genomes.json ...),
// which compiles GeneticMusic/AlgorithmFitness.cs unchanged plus a "sequential twin" of it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createClassicFitness } from '../src/fitness/classic.js';
import { classicSine } from '../src/core/waves.js';

const dir = new URL('./fixtures/', import.meta.url);
const genomes = JSON.parse(readFileSync(new URL('parity-genomes.json', dir)));
const cs = JSON.parse(readFileSync(new URL('parity-csharp-output.json', dir)));

test('every rule equals the sequential C# rule on 53 genomes', () => {
  const fit = createClassicFitness({ strict: true });
  let compared = 0;
  genomes.forEach((g, i) => {
    const js = fit.components(g, 1);
    for (const [rule, value] of Object.entries(cs.sequential[i])) {
      assert.ok(Math.abs(js[rule] - value) <= 1e-3 * Math.max(1, Math.abs(value)), `genome ${i} rule ${rule}: js ${js[rule]} vs c# ${value}`);
      compared++;
    }
  });
  assert.equal(compared, 53 * 15);
});

test('the original parallel rules are not deterministic (data race in Parallel.For)', () => {
  let varying = 0;
  for (const row of cs.results) for (const vals of Object.values(row)) if (new Set(vals.map((v) => v.toFixed(3))).size > 1) varying++;
  assert.ok(varying > 100, `only ${varying} rule evaluations varied`);
});

test('first run of the original: wave 1 is flat at 0, wave 2 is right', () => {
  assert.ok(cs.firstRunWave1.every((v) => v === 0));
  const w1 = classicSine(128, 16, 0.5, 12, 37, 0);
  const w2 = classicSine(128, 16, 2, 4, 30, 0);
  assert.deepEqual(cs.wave1, Array.from(w1));
  assert.deepEqual(cs.wave2, Array.from(w2));
  assert.deepEqual(cs.firstRunWave2, Array.from(w2));
});
