import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dposOf, midiOf, lineToBeats, compactToLine, createBlockModel, blockGenome, blockMutate, genesToLine } from '../src/ga/blocks.js';
import blocksData from '../src/data/blocks-data.js';
import { makeKey } from '../src/core/theory.js';
import { createRng } from '../src/core/rng.js';
import { REST, HOLD, isNote, geneToMidi } from '../src/core/score.js';
import { createAttractorFitness, ruleCapsFor, getBlockModel } from '../src/fitness/attractor.js';
import { resolvePreset } from '../src/fitness/presets.js';
import { defaultConfig, buildFitness } from '../src/ui/config.js';

const G = makeKey(7, 'major');
const models = createBlockModel(blocksData);
const mod = (a, n) => ((a % n) + n) % n;

test('a beat is a figure, a contour in scale steps and an entry; the same in any key', () => {
  // G4 quarter | A4 B4 eighths | C5 dotted quarter (tied into the 4th beat) | D5 eighth
  const line = compactToLine([[67, 4], [69, 2], [71, 2], [72, 6], [74, 2]]);
  const beats = lineToBeats(line.pitch, line.onset, { meter: '4/4', key: G });
  assert.deepEqual(beats.map((b) => [b.cell, b.contour]), [['x___', ''], ['x_x_', 's1'], ['x___', ''], ['__x_', '']]);
  assert.equal(beats[1].entry, 1); // G -> A: one step up
  assert.deepEqual(beats.map((b) => b.pos), [0, 1, 2, 3]);
  assert.equal(beats[2].dirIn, 'sg'); // A -> B: up by step
  for (const m of [67, 69, 71, 72, 74, 76, 78, 79]) assert.equal(midiOf(dposOf(m, G), G), m);
  const C = makeKey(0, 'major');
  const up = compactToLine([[72, 4], [74, 2], [76, 2], [77, 6], [79, 2]]);
  assert.deepEqual(lineToBeats(up.pitch, up.onset, { meter: '4/4', key: C }).map((b) => b.cell + b.contour), beats.map((b) => b.cell + b.contour));
});

test('in 6/8 a beat is three eighths, and the anacrusis falls on the second beat', () => {
  // D4 eighth (anacrusis) | G4 quarter A4 eighth | B4 C5 D5 eighths | E5 dotted half
  const line = compactToLine([[62, 2], [67, 4], [69, 2], [71, 2], [72, 2], [74, 2], [76, 12]]);
  const beats = lineToBeats(line.pitch, line.onset, { meter: '6/8', pickup: 2, key: G });
  assert.deepEqual(beats.map((b) => b.cell), ['....x_', 'x___x_', 'x_x_x_', 'x_____', '______']);
  assert.deepEqual(beats.map((b) => b.pos), [1, 0, 1, 0, 1]);
  assert.equal(beats[2].contour, 's1s1');
  // the same notes read as 3/4 give other figures: the meter matters
  const asThree = lineToBeats(line.pitch, line.onset, { meter: '3/4', pickup: 2, key: G });
  assert.notDeepEqual(asThree.map((b) => b.cell), beats.map((b) => b.cell));
});

test('real melodies are more idiomatic than the same melodies with their notes shuffled', () => {
  const corpus = JSON.parse(readFileSync(new URL('../data/corpus.json', import.meta.url))).melodies.slice(0, 120);
  const rng = createRng(4);
  let wins = 0;
  let n = 0;
  for (const m of corpus) {
    const meter = { 8: '2/4', 12: '3/4', 16: '4/4' }[m.barLen];
    if (!meter) continue;
    const M = models.forMeter(meter);
    const key = { tonic: m.tonic, mode: m.mode };
    const real = compactToLine(m.events);
    const ps = rng.shuffle(m.events.filter(([p]) => p >= 0).map(([p]) => p));
    let i = 0;
    const shuf = compactToLine(m.events.map(([p, d]) => (p < 0 ? [p, d] : [ps[i++], d])));
    const a = M.score(lineToBeats(real.pitch, real.onset, { meter, pickup: m.pickup, key }));
    const b = M.score(lineToBeats(shuf.pitch, shuf.onset, { meter, pickup: m.pickup, key }));
    if (a.logp > b.logp) wins++;
    n++;
  }
  // these 480 melodies were not used to learn the blocks
  assert.ok(wins / n > 0.9, `real wins ${wins}/${n}`);
});

test('every meter has a model; 12/8 reads as two bars of 6/8', () => {
  for (const id of ['2/4', '3/4', '4/4', '3/8', '6/8', '9/8', '12/8']) assert.ok(models.forMeter(id), id);
  assert.equal(models.forMeter('12/8').data.meter, '6/8');
  assert.equal(models.forMeter('6/8').figs[0].length, 6);
  assert.equal(models.forMeter('3/4').figs[0].length, 4);
});

test('melodies written with blocks start like real ones and are valid genomes, in every meter', () => {
  for (const meter of ['4/4', '3/4', '6/8', '3/8']) {
    const cfg = defaultConfig();
    cfg.meter = meter;
    const b = buildFitness(cfg);
    assert.ok(b.env.blocks, 'the default single melody uses the corpus blocks');
    assert.equal(b.env.meter.id, meter);
    const rng = createRng(9);
    const firsts = {};
    const beat = b.env.meter.beat;
    for (let k = 0; k < 120; k++) {
      const g = blockGenome(b.env.blocks, b.env, rng);
      assert.equal(g.length, b.fit.length);
      assert.notEqual(g[0], HOLD);
      for (let i = 1; i < g.length; i++) if (g[i] === HOLD) assert.ok(g[i - 1] !== REST, `${meter}: hold after a rest at ${i}`);
      const first = geneToMidi(g.find(isNote));
      const deg = mod(dposOf(first, b.key), 7);
      firsts[deg] = (firsts[deg] || 0) + 1;
      // every beat is a figure the model knows
      const line = genesToLine(g);
      for (const bt of lineToBeats(line.pitch, line.onset, { meter, key: b.key })) assert.equal(bt.cell.length, beat);
    }
    // real melodies start mostly on the 5th, the tonic or the 3rd
    const main = (firsts[4] ?? 0) + (firsts[0] ?? 0) + (firsts[2] ?? 0);
    assert.ok(main > 0.7 * 120, `${meter} ${JSON.stringify(firsts)}`);
    const g = blockGenome(b.env.blocks, b.env, rng);
    for (let k = 0; k < 100; k++) {
      blockMutate(b.env.blocks, g, b.env, rng);
      assert.equal(g.length, b.fit.length);
      for (let i = 1; i < g.length; i++) if (g[i] === HOLD) assert.ok(g[i - 1] !== REST);
    }
  }
});

test('generated 6/8 moves in threes: the figures of real 6/8, not the quarter-note cells of 4/4', () => {
  const cfg = defaultConfig();
  cfg.meter = '6/8';
  const b = buildFitness(cfg);
  const rng = createRng(3);
  const count = new Map();
  let total = 0;
  for (let k = 0; k < 60; k++) {
    const g = blockGenome(b.env.blocks, b.env, rng);
    const line = genesToLine(g);
    for (const bt of lineToBeats(line.pitch, line.onset, { meter: '6/8', key: b.key })) {
      count.set(bt.cell, (count.get(bt.cell) || 0) + 1);
      total++;
    }
  }
  // three eighths, quarter + eighth and the dotted quarter carry most of real 6/8
  const main = ['x_x_x_', 'x___x_', 'x_____'].reduce((a, c) => a + (count.get(c) ?? 0), 0);
  assert.ok(main / total > 0.5, `${main}/${total}`);
});

test('"do not maximise": rules count only up to their typical value in real music of the meter', () => {
  for (const meter of ['4/4', '6/8']) {
    const caps = ruleCapsFor(meter);
    const fit = createAttractorFitness({ bars: 8, meter, tonic: 7, mode: 'major', waves: resolvePreset('arch', 7), caps: true, weights: { idiom: 1.5 } });
    const rng = createRng(2);
    for (let k = 0; k < 15; k++) {
      const res = fit.evaluate(blockGenome(getBlockModel(meter), fit.env, rng));
      for (const [rule, cap] of Object.entries(caps)) assert.ok(res.parts[rule] <= cap + 1e-12, `${meter} ${rule} ${res.parts[rule]} > ${cap}`);
      assert.ok(res.parts.idiom <= 1 && res.parts.idiom >= -1);
    }
    assert.ok(caps.regression < 0.5 && caps.forces < 0.5, 'real music is far from the maximum of these rules');
  }
});
