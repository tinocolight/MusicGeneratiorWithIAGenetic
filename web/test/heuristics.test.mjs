import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { melodyFeatures, ruleScore, scoreRules, notesOf } from '../src/fitness/heuristics.js';
import { GENERAL_RULES, STYLES, STYLE_IDS, STYLE_FAMILIES, resolveRules } from '../src/fitness/styles.js';
import { defaultConfig, buildFitness, applyStyle, activeStyle, ensureHeuristics, STYLE_WEIGHT } from '../src/ui/config.js';
import { createGA } from '../src/ga/ga.js';
import { createRng } from '../src/core/rng.js';
import { makeKey } from '../src/core/theory.js';
import { METERS } from '../src/core/meter.js';
import { compactToLine } from '../src/ga/figures.js';
import { has } from '../src/i18n/i18n.js';

const here = new URL('.', import.meta.url).pathname;
const C = makeKey(0, 'major');
// a line from [midi, 16ths] pairs (-1 = rest)
const lineOf = (pairs) => compactToLine(pairs);

test('features of a simple melody: a descending scale in quarter notes', () => {
  const f = melodyFeatures(lineOf([[72, 4], [71, 4], [69, 4], [67, 4], [65, 4], [64, 4], [62, 4], [60, 12]]), { meter: '4/4', key: C, phraseBars: 2 });
  assert.equal(f.notes, 8);
  assert.equal(f.steps, 1);
  assert.equal(f.leaps, 0);
  assert.equal(f.stepDown, 1);
  assert.equal(f.inertia, 1);
  assert.equal(f.range, 12);
  assert.equal(f.restShare, 0);
  assert.equal(f.firstOnset, 0);
  assert.equal(f.syncBar, 0);
  assert.equal(f.finalBeat, 3, 'the last note starts on the 4th beat of bar 2');
  assert.ok(f.finalLength > 1, 'the last note is longer than the others');
  assert.equal(f.figures.counts.get('x___'), 8, 'seven quarters and the first beat of the long note');
});

test('features: pickup, syncopation, leaps outside a chord and the three-quarter ending', () => {
  // a half-bar pickup (gavotte), then a syncopated eighth-quarter-eighth
  const f = melodyFeatures(lineOf([[-1, 8], [67, 4], [69, 4], [72, 2], [74, 4], [72, 2], [60, 4], [67, 4], [66, 4], [67, 4]]), { meter: '4/4', key: C });
  assert.equal(f.firstOnset, 8);
  assert.ok(f.syncBar > 0, 'the quarter on the off-beat crosses the beat');
  // C-E-G is a chord; C-F#-C is not (and F# is chromatic in C)
  const chord = melodyFeatures(lineOf([[60, 4], [64, 4], [67, 4], [72, 4], [71, 4], [72, 4]]), { meter: '4/4', key: C });
  assert.equal(chord.leapChain, 0);
  const notChord = melodyFeatures(lineOf([[60, 4], [65, 4], [71, 4], [76, 4], [74, 4], [72, 4]]), { meter: '4/4', key: C });
  assert.ok(notChord.leapChain > 0);
  // hornpipe ending: three quarter notes in the last bar of each 8-bar section
  const bar = [[67, 3], [69, 1], [71, 3], [72, 1], [74, 3], [72, 1], [71, 3], [69, 1]];
  const end = [[67, 4], [67, 4], [67, 4], [-1, 4]];
  const hp = melodyFeatures(lineOf([...Array(7).fill(bar).flat(), ...end]), { meter: '4/4', key: makeKey(7, 'major') });
  assert.equal(hp.threeQuarterEnd, 1);
  assert.ok(notesOf(lineOf(end)).length === 3);
});

test('a rule scores 1 inside its range and falls to -1 at tol beyond it', () => {
  const r = { lo: 0.4, hi: 0.8, tol: 0.2 };
  assert.equal(ruleScore(0.5, r), 1);
  assert.equal(ruleScore(0.8, r), 1);
  assert.ok(Math.abs(ruleScore(0.9, r)) < 1e-9);
  assert.equal(ruleScore(1.1, r), -1);
  assert.equal(ruleScore(undefined, r), null);
  assert.equal(ruleScore(8, { in: [8] }), 1);
  assert.equal(ruleScore(0, { in: [8] }), -1);
  const s = scoreRules({ a: 0.5, b: undefined }, [{ id: 'a', feature: 'a', lo: 0, hi: 1, tol: 1 }, { id: 'b', feature: 'b', lo: 0, hi: 1, tol: 1 }]);
  assert.equal(s.score, 1, 'undefined features are left out of the mean');
});

test('every style is well defined: meters, figures, sources in the CSV, names in both languages', () => {
  const csv = readFileSync(`${here}../results/estilos/literatura.csv`, 'utf8');
  const ids = new Set(csv.split(/\r?\n/).slice(1).map((l) => l.split(',')[0]).filter(Boolean));
  const features = new Set(Object.keys(melodyFeatures(lineOf([[60, 4], [62, 4], [64, 4], [65, 4], [67, 4], [64, 4], [62, 4], [60, 4], [67, 4], [60, 12]]), { meter: '4/4', key: C })));
  ['firstOnset', 'recovery', 'threeQuarterEnd', 'sequences', 'arch', 'dirChanges', 'inertia', 'stepDown', 'offbeatEnds'].forEach((k) => features.add(k));
  const rules = [...GENERAL_RULES, ...STYLE_IDS.flatMap((id) => STYLES[id].rules)];
  for (const r of rules) {
    for (const s of r.src) assert.ok(ids.has(s), `${r.id}: source ${s} is a row of literatura.csv`);
    if (r.figures) for (const c of r.figures) assert.match(c, /^[x_.]{4}$|^[x_.]{6}$/, `${r.id}: figure ${c}`);
    else assert.ok(features.has(r.feature), `${r.id}: feature ${r.feature}`);
    assert.ok(has(`rule.${r.id}`), `rule.${r.id} has a name`);
  }
  assert.ok(STYLE_IDS.length >= 30);
  for (const id of STYLE_IDS) {
    const s = STYLES[id];
    assert.ok(STYLE_FAMILIES.includes(s.family), id);
    for (const m of s.meters) assert.ok(METERS[m], `${id}: meter ${m}`);
    assert.ok(has(`style.${id}`) && has(`style.${id}.desc`), `${id} has a name and a description`);
    // at least one rule of the style applies in each of its meters
    for (const m of s.meters) assert.ok(resolveRules(id, m).some((r) => s.rules.some((x) => x.id === r.id)), `${id} in ${m}`);
  }
});

test('the general rules and the corpus styles take their ranges from real melodies', () => {
  const general = resolveRules(null, '4/4');
  assert.ok(general.filter((r) => r.calibrated).length >= 8);
  const jig = resolveRules('jig', '6/8');
  const three = jig.find((r) => r.id === 'fig:threeEighths');
  assert.ok(three.calibrated && three.lo > 0.4 && three.hi <= 1, 'three eighths per beat measured on real jigs');
  // a figure rule of the compound meters does not judge a simple meter
  assert.ok(!resolveRules('tarantella', '6/8').some((r) => r.figures && r.figures[0].length !== 6));
  for (const r of general) if (!r.in) assert.ok(r.lo <= r.hi && r.tol > 0, r.id);
});

test('real melodies satisfy the general rules better than the same notes shuffled', () => {
  const corpus = JSON.parse(readFileSync(`${here}../data/corpus.json`, 'utf8'));
  const melodies = (Array.isArray(corpus) ? corpus : corpus.melodies).filter((m) => m.barLen === 16).slice(0, 60);
  const rules = resolveRules(null, '4/4');
  const rng = createRng(5);
  let better = 0;
  for (const m of melodies) {
    const key = makeKey(m.tonic, m.mode);
    const line = compactToLine(m.events);
    const real = scoreRules(melodyFeatures(line, { meter: '4/4', key, phraseBars: 2 }), rules).score;
    const pitches = m.events.filter(([p]) => p >= 0).map(([p]) => p);
    const perm = rng.shuffle(pitches.slice());
    let k = 0;
    const shuffled = compactToLine(m.events.map(([p, d]) => [p >= 0 ? perm[k++] : p, d]));
    const nul = scoreRules(melodyFeatures(shuffled, { meter: '4/4', key, phraseBars: 2 }), rules).score;
    if (real > nul) better++;
  }
  assert.ok(better / melodies.length > 0.75, `real better in ${better}/${melodies.length}`);
});

test('choosing a style: its meter and settings, and a heuristics weight that never stays at 0', () => {
  const c = defaultConfig();
  assert.equal(c.style, 'none');
  assert.equal(c.weights.heuristics, 0);
  const res = applyStyle(c, 'jig');
  assert.equal(c.meter, '6/8');
  assert.ok(res.changed.includes('meter'));
  assert.equal(c.form, 'AABB');
  assert.equal(c.bars, 16);
  assert.equal(c.weights.heuristics, STYLE_WEIGHT.field);
  assert.equal(c.classicG1.heuristics, STYLE_WEIGHT.classic);
  c.weights.heuristics = 0;
  ensureHeuristics(c);
  assert.ok(c.weights.heuristics > 0);
  // the classic mode only writes 4/4: a style in 6/8 does not apply there
  c.mode = 'classic';
  assert.equal(activeStyle(c), null);
  applyStyle(c, 'reel');
  assert.equal(activeStyle(c), 'reel');
  assert.equal(c.meter, '6/8', 'the classic mode keeps the meter field as it was');
  const b = buildFitness(c);
  assert.equal(b.fit.style, 'reel');
  applyStyle(c, 'none');
  assert.equal(activeStyle(c), null);
});

test('with a style the genetic algorithm moves the melody towards it', () => {
  const run = (weight) => {
    const c = defaultConfig();
    applyStyle(c, 'jig');
    c.weights.heuristics = weight;
    c.ga.generations = 60;
    const b = buildFitness(c);
    const ga = createGA({ fitness: b.fit, rng: createRng(3), length: b.fit.length, env: b.env, generations: 60, popSize: 40, mutationRate: 0.9, strategy: 'tournament', operators: 'musical', initMode: 'blocks' });
    ga.step(Infinity);
    return b.fit.heuristics(ga.best.decoded).score;
  };
  const without = run(0);
  const withStyle = run(STYLE_WEIGHT.field);
  assert.ok(withStyle > without, `style score ${withStyle.toFixed(2)} > ${without.toFixed(2)}`);
  // the classic fitness sums the heuristics over the beats
  const c = defaultConfig();
  c.mode = 'classic';
  applyStyle(c, 'chorale');
  const b = buildFitness(c);
  const parts = b.fit.components(new Array(b.fit.length).fill(0).map((_, i) => (i % 4 === 0 ? 40 + (i % 7) : 74)));
  assert.ok(Number.isFinite(parts.heuristics) && parts.heuristics !== 0);
});
