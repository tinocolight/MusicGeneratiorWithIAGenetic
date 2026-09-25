import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzePiece, fitWaves, phraseSegments, boundaryStrengths, notesOf, hz } from '../src/analysis/wavefit.js';
import { createRng } from '../src/core/rng.js';

// A synthetic "compound melody": notes alternate between a slow high wave and a fast low wave.
function synthetic() {
  const compact = [];
  for (let i = 0; i < 64; i++) {
    const t = i * 2;
    const p = i % 2 === 0
      ? 76 + 4 * Math.sin((2 * Math.PI * 0.25 * t) / 16)
      : 64 + 3 * Math.sin((2 * Math.PI * 1 * t) / 16);
    compact.push([Math.round(p), 2]);
  }
  return compact;
}

test('EM recovers the frequency and mean value of two known waves', () => {
  const { notes } = notesOf(synthetic());
  const fit = fitWaves(notes.map((n) => ({ t: n.t, p: n.p, w: 1 })), 2, 16, 128);
  const [low, high] = fit.waves.slice().sort((a, b) => a.mean - b.mean);
  assert.equal(high.freq, 0.25);
  assert.equal(low.freq, 1);
  assert.ok(Math.abs(high.mean - 76) < 0.6 && Math.abs(low.mean - 64) < 0.6);
  assert.ok(fit.r2 > 0.9);
  assert.ok(Math.abs(high.share - 0.5) < 0.1);
});

test('analysis in K parts reports lowest / highest frequency waves and registers in Hz', () => {
  const res = analyzePiece(synthetic(), { segments: 2, mode: 'equal', barLen: 16, rng: createRng(1) });
  assert.equal(res.segments.length, 2);
  for (const s of res.segments) {
    assert.ok(s.lowestWave.freq <= s.highestWaves[0].freq);
    assert.ok(s.register.lowestHz < s.register.highestHz);
  }
  assert.equal(Math.round(hz(69)), 440);
});

test('LBDM places the phrase boundary at the long note followed by a rest', () => {
  const compact = [[60, 2], [62, 2], [64, 2], [65, 2], [67, 12], [-1, 4], [67, 2], [65, 2], [64, 2], [62, 2], [60, 8]];
  const { notes, total } = notesOf(compact);
  const s = boundaryStrengths(notes, total);
  assert.equal(s.indexOf(Math.max(...s)), 4);
  const segs = phraseSegments(compact, 2, 8);
  assert.equal(segs[1][0], 24);
});
