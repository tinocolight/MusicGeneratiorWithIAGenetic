// The fado section (results/fado.md): verse features, the two fado styles and their changes to the
// fitness, the dynamics (playback, MIDI, score and LilyPond).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { melodyFeatures, scoreRules } from '../src/fitness/heuristics.js';
import { STYLES, resolveRules, styleTraits } from '../src/fitness/styles.js';
import { createAttractorFitness } from '../src/fitness/attractor.js';
import { resolvePreset } from '../src/fitness/presets.js';
import { makeKey } from '../src/core/theory.js';
import { compactToLine } from '../src/ga/figures.js';
import { fromEvents, compactToEvents } from '../src/core/score.js';
import { expressionOf, dynamicMarks, dynamicLetter } from '../src/core/expression.js';
import { scoreModel, toLilyPond } from '../src/io/notation.js';
import { writeMidi, readMidi } from '../src/io/midi.js';

const Gm = makeKey(7, 'minor');
// a fado-like quatrain in G minor, 4/4: each verse starts after the downbeat, recites on a
// repeated note, reaches its held note by a falling step and breathes; the apex (E flat) is in the
// 3rd verse; the odd verses stay suspended (on A and C), the 2nd and the last end on the tonic
const FADO = [
  [-1, 4], [70, 2], [70, 2], [70, 2], [72, 2], [70, 2], [69, 10], [-1, 8],
  [-1, 4], [67, 2], [67, 2], [69, 2], [70, 2], [69, 2], [67, 10], [-1, 8],
  [-1, 4], [74, 2], [74, 2], [77, 4], [75, 2], [74, 2], [72, 12], [-1, 6],
  [-1, 4], [72, 2], [70, 2], [69, 2], [67, 2], [69, 2], [67, 10], [-1, 8],
];
// the same notes without breaths, verse endings or recitation: a plain line of eighths and quarters
const PLAIN = [[67, 4], [69, 2], [70, 2], [72, 4], [74, 4], [72, 2], [70, 2], [69, 4], [67, 4], [69, 4], [70, 2], [72, 2], [74, 4], [75, 4], [74, 2], [72, 2], [70, 4], [69, 4], [70, 4], [72, 4], [70, 2], [69, 2], [67, 4], [69, 4], [67, 16]];

test('verse features: breaths, the held note, the sigh, the tonic kept for the end', () => {
  const f = melodyFeatures(compactToLine(FADO), { meter: '4/4', key: Gm, phraseBars: 2 });
  assert.equal(f.verseNotes, 6);
  assert.ok(f.verseFinal > 3, `held note ${f.verseFinal}`);
  assert.equal(f.verseEndStep, 1, 'every verse ends with a falling step');
  assert.equal(f.verseTonic, 1 / 3, 'one inner verse (the 2nd) ends on the tonic');
  assert.ok(f.restShare > 0.2);
  assert.equal(f.quickRuns, 0);
  const plain = melodyFeatures(compactToLine(PLAIN), { meter: '4/4', key: Gm, phraseBars: 2 });
  assert.equal(plain.verseNotes, undefined, 'one long line, no verses');
});

test('runs of sixteenths: counted, and whether they lead into a held note', () => {
  const run = [[67, 4], [69, 1], [70, 1], [72, 1], [70, 1], [69, 8], [67, 4], [69, 4], [70, 8]];
  const f = melodyFeatures(compactToLine(run), { meter: '4/4', key: Gm });
  assert.equal(f.quickRunMax, 4);
  assert.equal(f.runsIntoLong, 1);
  assert.ok(f.quickRuns > 0);
});

test('the fado styles: sad in minor, happy in major, in their own family, and they prefer a fado', () => {
  assert.equal(STYLES.fado.mode, 'minor');
  assert.equal(STYLES.fadoAlegre.mode, 'major');
  assert.equal(STYLES.fado.family, 'fado');
  for (const id of ['fado', 'fadoAlegre']) {
    assert.deepEqual(STYLES[id].meters.slice().sort(), ['2/4', '4/4']);
    assert.ok(['sad', 'happy'].includes(styleTraits(id).expression));
  }
  assert.deepEqual(styleTraits('reel'), {});
  const score = (m, style) => scoreRules(melodyFeatures(compactToLine(m), { meter: '4/4', key: Gm, phraseBars: 2 }), resolveRules(style, '4/4')).score;
  assert.ok(score(FADO, 'fado') > score(PLAIN, 'fado') + 0.1, 'the fado rules prefer the fado');
  // the general rules see it the other way round: the held notes and the syncopations cost there
  assert.ok(score(PLAIN, null) > score(FADO, null), 'the general rules prefer the plain line');
});

test('a fado style changes the fitness: breaths, alternating verse endings, held notes sung early', () => {
  const opts = { bars: 8, meter: '4/4', tonic: 7, mode: 'minor', waves: resolvePreset('arch', 7), form: 'AABB', phraseBars: 2 };
  const fado = createAttractorFitness({ ...opts, style: 'fado' });
  const none = createAttractorFitness(opts);
  assert.equal(fado.traits.cadence, 'alternate');
  const genes = fromEvents(compactToEvents(FADO), fado.length);
  const a = fado.evaluate(genes).parts;
  const b = none.evaluate(genes).parts;
  assert.ok(a.rhythm > b.rhythm, `breaths fit the fado's rest target (${a.rhythm} vs ${b.rhythm})`);
  assert.ok(a.cadence > b.cadence, `suspended odd verses and the final tonic (${a.cadence} vs ${b.cadence})`);
});

test('dynamics: each verse falls, its held note fades, the apex swells, the last stanza is louder', () => {
  const ev = compactToEvents(FADO);
  const x = expressionOf(ev, { kind: 'sad', barLen: 16, beat: 4, key: { tonic: 7, mode: 'minor' } });
  const notes = ev.map((e, i) => ({ e, x: x[i] })).filter((n) => n.e.pitch !== null);
  assert.equal(x[0], null, 'rests have no dynamics');
  const held = notes.filter((n) => n.x.shape === 'fade');
  assert.equal(held.length, 4, 'the held note of every verse fades');
  assert.ok(held.every((n) => n.x.end < 0.5 && n.x.vib > 0.2));
  const apex = notes.find((n) => n.x.shape === 'swell');
  assert.equal(apex.e.pitch, 77);
  assert.ok(apex.x.vel >= 0.9);
  // the first note of a verse is louder than the one before its held note
  assert.ok(notes[0].x.vel > notes[4].x.vel);
  const happy = expressionOf(ev, { kind: 'happy', barLen: 16, beat: 4, key: { tonic: 7, mode: 'major' } });
  const mean = (arr) => arr.filter(Boolean).reduce((s, v) => s + v.vel, 0) / arr.filter(Boolean).length;
  assert.ok(mean(happy) > mean(x), 'the happy fado is sung louder');
  assert.deepEqual(['pp', 'p', 'mp', 'mf', 'f', 'ff'], [0.3, 0.45, 0.6, 0.7, 0.85, 0.95].map(dynamicLetter));
});

test('the dynamics reach the MIDI file, the score model and the LilyPond export', () => {
  const ev = compactToEvents(FADO);
  const x = expressionOf(ev, { kind: 'sad', barLen: 16, beat: 4, key: { tonic: 7, mode: 'minor' } });
  const withX = ev.flatMap((e, i) => (e.pitch === null ? [] : [{ ...e, x: x[i] }]));
  const marks = dynamicMarks(withX);
  assert.ok(marks.some((m) => m.type === 'text'));
  assert.equal(marks.filter((m) => m.type === 'dim').length, 4);
  assert.equal(marks.filter((m) => m.type === 'cresc').length, 1);
  const total = ev.at(-1).start + ev.at(-1).dur;
  const model = scoreModel({ voices: [{ events: withX, instrument: 'alto', name: 'Voz' }], total, barLen: 16, meter: '4/4', key: { tonic: 7, mode: 'minor' } });
  assert.deepEqual(model.staves[0].dynamics, marks);
  const ly = toLilyPond(model);
  assert.match(ly, /\\m[fp]/);
  assert.equal((ly.match(/\\>/g) ?? []).length, 4);
  assert.equal((ly.match(/\\</g) ?? []).length, 1);
  assert.ok((ly.match(/\\!/g) ?? []).length >= 4, 'every hairpin is closed');
  const back = readMidi(writeMidi([{ events: withX, name: 'Voz', program: 52 }], { bpm: 72 }));
  const vels = back.tracks[0].notes.map((n) => n.velocity);
  assert.ok(new Set(vels).size > 5, 'velocities follow the dynamics');
  assert.equal(back.compact.filter(([p]) => p >= 0).length, withX.length, 'the expression controller does not disturb the notes');
  // without dynamics, nothing changes
  const plain = scoreModel({ voices: [{ events: ev.filter((e) => e.pitch !== null), instrument: 'alto', name: 'Voz' }], total, barLen: 16, meter: '4/4', key: { tonic: 7, mode: 'minor' } });
  assert.deepEqual(plain.staves[0].dynamics, []);
  assert.doesNotMatch(toLilyPond(plain), /\\[<>!]|\\m[fp]/);
});

test('the blues and the pop borrow the fado\'s traits: breaths, notes sung early (results/estilos-tracos.md)', () => {
  assert.deepEqual(styleTraits('blues'), { restTarget: [0.12, 0.45], anticipation: true, recitation: true });
  assert.deepEqual(styleTraits('pop'), { restTarget: [0.06, 0.3], anticipation: true });
  // a blues call and response: a phrase on a repeated note, a breath, the answer
  const BLUES = [
    [67, 4], [67, 2], [70, 2], [67, 4], [-1, 4], [65, 2], [67, 6], [-1, 8],
    [67, 4], [67, 2], [70, 2], [72, 4], [-1, 4], [70, 2], [67, 6], [-1, 8],
    [74, 4], [72, 2], [70, 2], [67, 8], [-1, 8], [65, 2], [67, 6], [-1, 8],
  ];
  const opts = { bars: 12, meter: '4/4', tonic: 7, mode: 'minor', waves: resolvePreset('arch', 7), form: 'AAB', phraseBars: 4 };
  const blues = createAttractorFitness({ ...opts, style: 'blues' });
  const none = createAttractorFitness(opts);
  const genes = fromEvents(compactToEvents(BLUES), blues.length);
  assert.ok(blues.evaluate(genes).parts.rhythm > none.evaluate(genes).parts.rhythm, 'the breaths fit the blues\' rest target');
});
