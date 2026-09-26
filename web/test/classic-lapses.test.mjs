import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateRange, evaluatePauseAndProlongation, scoreBalance, evaluateInterestingRepetitions,
  evaluateInterestingRhythmicPatterns, evaluateIntervals, scoreSelfHarmonization, createClassicFitness,
} from '../src/fitness/classic.js';
import { cadenceModel, cadenceScore, endingOfGenes } from '../src/fitness/cadence.js';
import cadenceData from '../src/data/cadence-data.js';
import { REST, HOLD, GENE_A4 } from '../src/core/score.js';

const A4 = GENE_A4;
const bar = (...cells) => cells.flat();
// a quarter note: the note and three prolongations
const q = (g) => [g, HOLD, HOLD, HOLD];

test('range: notes beyond 3x the range get -8 (the C# branch was unreachable)', () => {
  const far = [A4 + 50];
  assert.equal(evaluateRange(far, 15, Infinity, 0, false), -2);
  assert.equal(evaluateRange(far, 15, Infinity, 0, true), -8);
});

test('pauses/prolongations: a prolongation of a prolongation gets +0.5 as written', () => {
  const seq = [A4, A4, A4, A4, A4, HOLD, HOLD, HOLD];
  // literal: every prolongation after a non-pause gets +2
  assert.equal(evaluatePauseAndProlongation(seq, false) - evaluatePauseAndProlongation(seq, true), 3 * 2 - (2 + 0.5 + 0.5));
});

test('balance: finite when there is no pause or prolongation', () => {
  const allNotes = new Array(128).fill(A4);
  assert.equal(scoreBalance(allNotes, 7, 40, false), -Infinity);
  const fixed = scoreBalance(allNotes, 7, 40, true);
  assert.ok(Number.isFinite(fixed) && fixed < scoreBalance([...allNotes.slice(1), REST], 7, 40, true));
});

test('interesting repetitions: prolongations are not compared as if they were notes', () => {
  // eighth notes a-b-a-b...: on the grid every prolongation "repeats" the one two steps before
  const seq = [];
  for (let i = 0; i < 16; i++) seq.push(i % 2 ? A4 + 2 : A4, HOLD);
  assert.ok(evaluateInterestingRepetitions(seq, false) > evaluateInterestingRepetitions(seq, true));
  assert.equal(evaluateInterestingRepetitions(seq, true), 0);
});

test('rhythmic patterns: the start-of-bar bonus is for a figure that starts on the downbeat', () => {
  // dotted eighth + sixteenth at the start of each bar (3+1), then rests
  const b = [A4, HOLD, HOLD, A4 + 2, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST, REST];
  const seq = bar(b, b, b);
  assert.ok(evaluateInterestingRhythmicPatterns(seq, 16, false, true) > evaluateInterestingRhythmicPatterns(seq, 16, false, false));
});

test('intervals: judged between consecutive notes, also when notes are longer than a 16th', () => {
  const seq = bar(q(A4), q(A4 + 2), q(A4 + 4), q(A4 + 5), q(A4 + 7), q(A4 + 5), q(A4 + 4), q(A4 + 2));
  // the C# never sees these intervals, and its "skip" marker (-100) costs every note after a
  // prolongation a point (|-100| > 12)
  assert.equal(evaluateIntervals(seq, true, false, false), -6);
  // between notes: steps of a tone +2, of a semitone -1, the rising third (major, 3 up) +3 ...
  assert.ok(evaluateIntervals(seq, true, false, true) > 0);
  // a rest breaks the line: nothing to judge
  const withRest = [A4, REST, REST, REST, REST, REST, A4 + 12, HOLD];
  assert.equal(evaluateIntervals(withRest, true, false, true), 0);
});

test('self-harmonisation: compares with the pitch sounding a bar before, not with the prolongation code', () => {
  const b1 = [A4, ...new Array(15).fill(HOLD)]; // a whole note
  const b2 = new Array(16).fill(A4 + 4); // a major third above, in 16ths
  const seq = bar(b1, b2);
  const literal = scoreSelfHarmonization(seq, 16, 1, true, false); // A4+4 vs 74 (the code)
  const fixed = scoreSelfHarmonization(seq, 16, 1, true, true); // A4+4 vs A4: a third
  assert.ok(fixed > literal, `${fixed} vs ${literal}`);
});

test('the literal port is unchanged unless the lapses are fixed', () => {
  const seq = bar(q(A4), q(A4 + 2), q(A4 + 4), q(A4 + 5), q(A4 + 7), q(A4 + 5), q(A4 + 4), q(A4 + 2));
  const a = createClassicFitness().components(seq, Infinity);
  const b = createClassicFitness({ fixLapses: false }).components(seq, Infinity);
  assert.deepEqual(a, b);
  assert.equal(a.cadence, 0); // not in the original
});

test('ending formulas: a real cadence scores above a random ending', () => {
  const model = cadenceModel(cadenceData);
  const G = 7 + 60 - 32; // G4 as a gene
  const body = bar(q(G + 4), q(G + 7), q(G + 9), q(G + 7), q(G + 5), q(G + 4), q(G + 2), q(G));
  // ... 3-2-1: B4 A4 then G4 as a half note on the downbeat (in G major: 3 = B, 2 = A, 1 = G)
  const good = bar(body, q(G + 7), q(G + 5), q(G + 4), q(G + 2), [G, ...new Array(15).fill(HOLD)]);
  const bad = bar(body, q(G + 7), q(G + 5), q(G + 4), q(G + 2), q(G + 2), q(G + 6), [G + 1, HOLD], new Array(6).fill(HOLD));
  const e = endingOfGenes(good, 7);
  assert.deepEqual(e.pcs, [4, 2, 0]);
  assert.equal(e.pos, 0);
  assert.ok(cadenceScore(good, model, 7, 'major') > cadenceScore(bad, model, 7, 'major') + 10);
});
