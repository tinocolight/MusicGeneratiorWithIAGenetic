import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REFERENCE_CANONS, referenceEvents, compactToLine } from '../src/data/references.js';
import { analyzeCanon, intervalQuality } from '../src/fitness/canon.js';

test('reference transcriptions have complete bars', () => {
  for (const ref of Object.values(REFERENCE_CANONS)) {
    ref.bars.forEach((bar, i) => assert.equal(bar.reduce((a, e) => a + e[1], 0), ref.barLen, `${ref.title} bar ${i + 1}`));
  }
});

test('the canon score peaks at the real entry delay of Telemann TWV 40:118 (1 bar)', () => {
  const ref = REFERENCE_CANONS.telemann;
  const line = compactToLine(referenceEvents(ref));
  const scores = [];
  for (let d = 2; d <= 3 * ref.barLen; d += 2) {
    scores.push([d, analyzeCanon(line, { delay: d, barLen: ref.barLen, end: ref.endStep - ref.barLen + d }).score]);
  }
  scores.sort((a, b) => b[1] - a[1]);
  assert.equal(scores[0][0], ref.barLen);
  assert.ok(scores[0][1] - scores[1][1] > 0.2, 'clear margin over the second best delay');
  const t = analyzeCanon(line, { delay: 24, barLen: 24, end: ref.endStep });
  assert.ok(t.strongConsonance > 0.8);
  assert.ok(t.parallelsPerBar < 0.1);
});

test('Frère Jacques works as a round at 2 bars', () => {
  const ref = REFERENCE_CANONS.frereJacques;
  const line = compactToLine(referenceEvents(ref));
  const best = [4, 8, 12, 16, 20, 24, 28, 32].map((d) => [d, analyzeCanon(line, { delay: d, circular: true }).score]).sort((a, b) => b[1] - a[1])[0];
  assert.equal(best[0], 32);
});

test('interval classes follow two-voice counterpoint', () => {
  assert.equal(intervalQuality(4).kind, 'imperfect');
  assert.equal(intervalQuality(-9).kind, 'imperfect');
  assert.equal(intervalQuality(7).kind, 'perfect');
  assert.equal(intervalQuality(5).kind, 'fourth');
  assert.equal(intervalQuality(6).kind, 'dissonant');
  assert.equal(intervalQuality(0).kind, 'unison');
});

test('Telemann Sonatas I, II and III: the canon score peaks at the real entry (delays on the beat)', () => {
  for (const key of ['telemann', 'telemann2', 'telemann3']) {
    const ref = REFERENCE_CANONS[key];
    const line = compactToLine(referenceEvents(ref));
    const trueD = ref.delayBars * ref.barLen;
    const beat = ref.barLen === 6 ? 2 : 4; // 3/8: eighths; otherwise quarters
    const scores = [];
    for (let d = beat; d <= 3 * Math.max(ref.barLen, trueD); d += beat) {
      scores.push([d, analyzeCanon(line, { delay: d, barLen: ref.barLen, end: ref.endStep - trueD + d }).score]);
    }
    scores.sort((a, b) => b[1] - a[1]);
    assert.equal(scores[0][0], trueD, `${ref.title}: best delay ${scores[0][0]}`);
  }
});
