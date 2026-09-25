import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REFERENCE_CANONS, referenceEvents, compactToLine } from '../src/data/references.js';
import { analyzeCanon, analyzeEnsemble, intervalMap, INTERVALS } from '../src/fitness/canon.js';
import { INSTRUMENTS, ENSEMBLES } from '../src/core/instruments.js';
import { makeKey } from '../src/core/theory.js';
import { makeWave } from '../src/core/waves.js';
import { createRng } from '../src/core/rng.js';
import { randomCanonGenome, randomMusicalGenome } from '../src/ga/operators.js';
import { WAVE_PRESETS } from '../src/fitness/presets.js';
import {
  defaultConfig, cloneConfig, applyEnsemble, activeVoices, voiceSpecs, playableRange, autoWaves,
  autoConfigure, presetWaves, buildFitness, surprise,
} from '../src/ui/config.js';

test('instruments and ensembles are consistent', () => {
  for (const [id, v] of Object.entries(INSTRUMENTS)) {
    assert.ok(v.range[0] < v.range[1] - 12, `${id} has at least an octave`);
    assert.ok(v.program >= 0 && v.program < 128, `${id} GM program`);
  }
  for (const [id, e] of Object.entries(ENSEMBLES)) {
    for (const v of e.voices) {
      assert.ok(INSTRUMENTS[v.instrument], `${id}: ${v.instrument}`);
      if (v.interval) assert.ok(INTERVALS[v.interval], `${id}: ${v.interval}`);
    }
  }
});

test('diatonic fifth below stays in the key; chromatic notes move a perfect fifth', () => {
  const f = intervalMap('fifthDown', makeKey(0, 'major'));
  assert.deepEqual([67, 71, 65, 72].map(f), [60, 64, 59, 65]); // G->C, B->E, F->B (dim.), C->F
  assert.equal(f(66), 59); // F# is not in C major
  const up = intervalMap('octaveUp', makeKey(0, 'major'));
  assert.equal(up(60), 72);
});

test('a two-voice ensemble is the same as the two-voice canon analysis', () => {
  const line = compactToLine(referenceEvents(REFERENCE_CANONS.frereJacques));
  const c = analyzeCanon(line, { delay: 32, circular: true });
  const e = analyzeEnsemble(line, [{ delay: 0 }, { delay: 32 }], { circular: true });
  assert.ok(Math.abs(c.score - e.score) < 1e-12);
  assert.equal(e.pairs.length, 1);
});

test('Frère Jacques: the real entries (every 2 bars) beat irregular ones, with more voices forming triads', () => {
  const line = compactToLine(referenceEvents(REFERENCE_CANONS.frereJacques));
  const real = analyzeEnsemble(line, [0, 32, 64, 96].map((delay) => ({ delay })), { circular: true });
  const odd = analyzeEnsemble(line, [0, 20, 44].map((delay) => ({ delay })), { circular: true });
  assert.ok(real.score > odd.score + 0.2);
  assert.ok(real.strongConsonance > 0.8);
  assert.ok(real.triadRatio >= 0.5);
});

test('notes outside an instrument range are counted and penalised', () => {
  const line = { pitch: new Array(64).fill(80), onset: Array.from({ length: 64 }, (_, i) => i % 4 === 0) };
  const inside = analyzeEnsemble(line, [{ delay: 0, range: [55, 93] }, { delay: 16, range: [55, 93] }]);
  const outside = analyzeEnsemble(line, [{ delay: 0, range: [55, 93] }, { delay: 16, range: [36, 76] }]);
  assert.equal(inside.outOfRange, 0);
  assert.ok(outside.outOfRange > 0.4);
  assert.ok(Math.abs(inside.score - outside.score - 3 * outside.outOfRange) < 1e-9);
});

test('the canon is considered from generation 0: canon-aware individuals already agree', () => {
  for (const ens of ['telemann', 'trio']) {
    const cfg = applyEnsemble(defaultConfig(), ens);
    cfg.form = 'none';
    const b = buildFitness(cfg);
    assert.ok(b.env.canon, `${ens}: env carries the voices`);
    const rng = createRng(3);
    let aware = 0;
    let blind = 0;
    for (let i = 0; i < 20; i++) {
      aware += b.fit.evaluate(randomCanonGenome(b.env, rng)).parts.canon;
      blind += b.fit.evaluate(randomMusicalGenome(b.env, rng)).parts.canon;
    }
    assert.ok(aware / 20 > blind / 20 + 0.3, `${ens}: ${aware / 20} vs ${blind / 20}`);
  }
});

test('wave editor: sine phase is a time shift, arch spans mean ± amplitude', () => {
  const w0 = makeWave({ type: 'sine', freq: 1, mean: 60, amplitude: 5, phase: 0 }, 64, 16, createRng(1));
  const w4 = makeWave({ type: 'sine', freq: 1, mean: 60, amplitude: 5, phase: 4 }, 64, 16, createRng(1));
  for (let t = 0; t < 60; t++) assert.ok(Math.abs(w4[t] - w0[t + 4]) < 1e-9);
  assert.ok(Math.abs(Math.max(...w0) - 65) < 1e-9 && Math.abs(Math.min(...w0) - 55) < 1e-9);
  for (const a of [2, 4, 6]) {
    const arch = makeWave({ type: 'arch', freq: 0.5, mean: 70, amplitude: a }, 128, 16, createRng(1));
    assert.ok(Math.max(...arch) <= 70 + a + 0.1 && Math.max(...arch) >= 70 + a - 0.2, `arch ${a} max`);
    assert.ok(Math.min(...arch) >= 70 - a - 0.1, `arch ${a} min`);
  }
});

test('auto-configured and preset waves fit the register of every ensemble', () => {
  for (const ens of Object.keys(ENSEMBLES)) {
    const cfg = applyEnsemble(defaultConfig(), ens);
    const [lo, hi] = playableRange(cfg);
    for (const w of autoWaves(cfg)) {
      assert.ok(w.mean - w.amplitude >= lo && w.mean + w.amplitude <= hi, `${ens}: auto wave inside ${lo}-${hi}`);
    }
    for (const name of Object.keys(WAVE_PRESETS)) {
      const waves = presetWaves(cfg, name);
      const avg = waves.reduce((a, w) => a + w.mean, 0) / waves.length;
      assert.ok(avg >= lo && avg <= hi, `${ens}/${name}: centre ${avg} inside ${lo}-${hi}`);
    }
  }
});

test('configuration: voices, JSON round trip and every ensemble/mode builds a fitness', () => {
  const cfg = applyEnsemble(defaultConfig(), 'trio');
  assert.equal(activeVoices(cfg).length, 3);
  assert.deepEqual(voiceSpecs(cfg).map((v) => v.delay), [0, 32, 64]);
  autoConfigure(cfg);
  assert.equal(cfg.form, 'none');
  assert.ok(cfg.bars >= 12, 'room for the last entry');
  const copy = cloneConfig(JSON.parse(JSON.stringify(cfg)));
  const a = buildFitness(cfg);
  const b = buildFitness(copy);
  const genes = randomMusicalGenome(a.env, createRng(5));
  assert.equal(a.fit.evaluate(genes).score, b.fit.evaluate(genes).score);
  for (const ens of Object.keys(ENSEMBLES)) {
    for (const mode of ['field', 'classic']) {
      const c = applyEnsemble(defaultConfig(), ens);
      c.mode = mode;
      const built = buildFitness(c);
      assert.equal(built.fit.length, c.bars * 16);
      assert.ok(Number.isFinite(built.fit.evaluate(genes.slice(0, built.fit.length)).score));
    }
  }
  const rng = createRng(11);
  for (let i = 0; i < 10; i++) {
    const s = surprise(defaultConfig(), rng);
    assert.ok(Number.isFinite(buildFitness(s).fit.evaluate(randomMusicalGenome(buildFitness(s).env, rng)).score));
  }
});
