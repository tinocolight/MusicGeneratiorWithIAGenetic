import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dposOf, midiOf, lineToBeats, compactToLine, createBlockModel, blockGenome, blockMutate, genesToLine } from '../src/ga/blocks.js';
import blocksData from '../src/data/blocks-data.js';
import { makeKey } from '../src/core/theory.js';
import { createRng } from '../src/core/rng.js';
import { REST, HOLD, isNote, geneToMidi } from '../src/core/score.js';
import { createAttractorFitness, RULE_CAPS } from '../src/fitness/attractor.js';
import { resolvePreset } from '../src/fitness/presets.js';
import { defaultConfig, buildFitness } from '../src/ui/config.js';

const G = makeKey(7, 'major');
const model = createBlockModel(blocksData);
const mod = (a, n) => ((a % n) + n) % n;

test('blocks are beats: rhythm cell and contour in scale steps, transposable', () => {
  // G4 quarter | A4 B4 eighths | C5 dotted quarter (tied into the 4th beat) | D5 eighth
  const line = compactToLine([[67, 4], [69, 2], [71, 2], [72, 6], [74, 2]]);
  const beats = lineToBeats(line.pitch, line.onset, { barLen: 16, key: G });
  assert.deepEqual(beats.map((b) => b.id), ['x---|', 'x-x-|+1', 'x---|', '--x-|']);
  assert.equal(beats[1].entry, 1); // G -> A: one step up
  assert.equal(beats[0].pos, 's');
  assert.equal(beats[2].pos, 'm');
  for (const m of [67, 69, 71, 72, 74, 76, 78, 79]) assert.equal(midiOf(dposOf(m, G), G), m);
  // the same melody a fourth higher (C major) gives the same blocks
  const C = makeKey(0, 'major');
  const up = compactToLine([[72, 4], [74, 2], [76, 2], [77, 6], [79, 2]]);
  assert.deepEqual(lineToBeats(up.pitch, up.onset, { barLen: 16, key: C }).map((b) => b.id), beats.map((b) => b.id));
});

test('real melodies are more idiomatic than the same melodies with their notes shuffled', () => {
  const corpus = JSON.parse(readFileSync(new URL('../data/corpus.json', import.meta.url))).melodies.filter((m) => m.barLen === 16).slice(0, 80);
  const rng = createRng(4);
  let wins = 0;
  for (const m of corpus) {
    const key = { tonic: m.tonic, mode: m.mode };
    const real = compactToLine(m.events);
    const ps = rng.shuffle(m.events.filter(([p]) => p >= 0).map(([p]) => p));
    let i = 0;
    const shuf = compactToLine(m.events.map(([p, d]) => (p < 0 ? [p, d] : [ps[i++], d])));
    const a = model.score(lineToBeats(real.pitch, real.onset, { barLen: 16, pickup: m.pickup, key }));
    const b = model.score(lineToBeats(shuf.pitch, shuf.onset, { barLen: 16, pickup: m.pickup, key }));
    if (a.logp > b.logp) wins++;
  }
  // these 480 melodies were not used to learn the blocks
  assert.ok(wins / corpus.length > 0.85, `real wins ${wins}/${corpus.length}`);
});

test('melodies written with blocks start like real ones and are valid genomes', () => {
  const cfg = defaultConfig();
  const b = buildFitness(cfg);
  assert.ok(b.env.blocks, 'the default single melody uses the corpus blocks');
  const rng = createRng(9);
  const firsts = {};
  for (let k = 0; k < 300; k++) {
    const g = blockGenome(b.env.blocks, b.env, rng);
    assert.equal(g.length, b.fit.length);
    assert.notEqual(g[0], HOLD);
    for (let i = 1; i < g.length; i++) if (g[i] === HOLD) assert.ok(g[i - 1] !== REST, `hold after a rest at ${i}`);
    const first = geneToMidi(g.find(isNote));
    const deg = mod(dposOf(first, b.key), 7);
    firsts[deg] = (firsts[deg] || 0) + 1;
  }
  // corpus: 5th 49 %, tonic 28 %, 3rd 13 %
  assert.ok(firsts[4] > firsts[0] && firsts[0] > (firsts[2] ?? 0) * 0.8, JSON.stringify(firsts));
  // the block mutation keeps the genome valid
  const g = blockGenome(b.env.blocks, b.env, rng);
  for (let k = 0; k < 200; k++) {
    blockMutate(b.env.blocks, g, b.env, rng);
    assert.equal(g.length, b.fit.length);
    for (let i = 1; i < g.length; i++) if (g[i] === HOLD) assert.ok(g[i - 1] !== REST);
  }
  const line = genesToLine(g);
  assert.equal(line.pitch.length, b.fit.length);
});

test('"do not maximise": rules count only up to their typical value in real music', () => {
  const fit = createAttractorFitness({ bars: 8, tonic: 7, mode: 'major', waves: resolvePreset('arch', 7), caps: true, weights: { idiom: 1.5 } });
  const b = buildFitness(defaultConfig());
  const rng = createRng(2);
  for (let k = 0; k < 20; k++) {
    const res = fit.evaluate(blockGenome(model, b.env, rng));
    for (const [rule, cap] of Object.entries(RULE_CAPS)) assert.ok(res.parts[rule] <= cap + 1e-12, `${rule} ${res.parts[rule]} > ${cap}`);
    assert.ok(res.parts.idiom <= 1 && res.parts.idiom >= -1);
  }
  assert.ok(RULE_CAPS.regression < 0.5 && RULE_CAPS.forces < 0.5, 'real music is far from the maximum of these rules');
});
