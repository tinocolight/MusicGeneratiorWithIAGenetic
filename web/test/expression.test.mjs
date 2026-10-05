// Dynamics and rubato of the styles other than the fado (core/expression.js, results/expressao.md):
// the profiles, the phrase arch, high-loud, the terraced echo, the metric accents, the final
// ritardando against the performances measured, and the marks in the score.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { expressionOf, dynamicMarks, rubatoOf, timeline, ritardTempo, EXPRESSION_PROFILES } from '../src/core/expression.js';
import { STYLES, STYLE_IDS, expressionProfile } from '../src/fitness/styles.js';
import { compactToEvents } from '../src/core/score.js';
import { scoreModel, toLilyPond } from '../src/io/notation.js';

// 9 bars of 4/4 in C: a 2-bar phrase, its exact repeat, a phrase rising to the apex, the cadence
const A = [[60, 4], [62, 4], [64, 4], [65, 4], [67, 8], [65, 4], [64, 4]];
const B = [[64, 2], [65, 2], [67, 4], [69, 4], [72, 4], [71, 8], [67, 8]];
const C = [[69, 4], [67, 4], [65, 4], [64, 4], [62, 8], [59, 4], [62, 4], [60, 16]];
const ev = compactToEvents([...A, ...A, ...B, ...C]);
const total = ev.at(-1).start + ev.at(-1).dur;
const C_MAJOR = { tonic: 0, mode: 'major' };
const ctx = (kind) => ({ kind, barLen: 16, beat: 4, key: C_MAJOR, phraseLen: 32 });
const withX = (kind) => {
  const x = expressionOf(ev, ctx(kind));
  return ev.map((e, i) => ({ ...e, x: x[i] })).filter((e) => e.x);
};

test('every style is played with a profile: its family\'s, its own, the fado\'s; none: the general one', () => {
  for (const id of STYLE_IDS) assert.ok(EXPRESSION_PROFILES.includes(expressionProfile(id)), id);
  assert.equal(expressionProfile('fado'), 'sad');
  assert.equal(expressionProfile('fadoAlegre'), 'happy');
  assert.equal(expressionProfile('folk'), 'song');
  assert.equal(expressionProfile('lullaby'), 'lullaby');
  assert.equal(expressionProfile('reel'), 'dance');
  assert.equal(expressionProfile('mazurka'), 'mazurka');
  assert.equal(expressionProfile('gavotte'), 'baroque');
  assert.equal(expressionProfile('chorale'), 'chorale');
  assert.equal(expressionProfile('classical'), 'classical');
  assert.equal(expressionProfile('pop'), 'popular');
  assert.equal(expressionProfile('blues'), 'blues');
  assert.equal(expressionProfile(null), 'general');
  assert.equal(expressionProfile('none'), 'general');
  // the fado keeps its own marks: only its styles have an `expression`
  assert.deepEqual(STYLE_IDS.filter((id) => STYLES[id].expression), ['fado', 'fadoAlegre']);
});

test('classical: each phrase rises to its apex and falls after it, higher notes are louder, hairpins written', () => {
  const notes = withX('classical');
  const ph1 = notes.filter((e) => e.x.phrase === 0);
  const vel = ph1.map((e) => e.x.vel);
  const k = vel.indexOf(Math.max(...vel));
  assert.equal(ph1[k].pitch, 67, 'the loudest note of the phrase is its apex');
  for (let i = 1; i <= k; i++) assert.ok(vel[i] > vel[i - 1], 'crescendo to the apex');
  for (let i = k + 1; i < vel.length; i++) assert.ok(vel[i] < vel[i - 1], 'diminuendo after it');
  // high-loud over the piece: pitch and velocity correlate (r ≈ 0.4 in the performances)
  const ps = notes.map((e) => e.pitch);
  const vs = notes.map((e) => e.x.vel);
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const [mp, mv] = [mean(ps), mean(vs)];
  const r = ps.reduce((s, p, i) => s + (p - mp) * (vs[i] - mv), 0) / Math.sqrt(ps.reduce((s, p) => s + (p - mp) ** 2, 0) * vs.reduce((s, v) => s + (v - mv) ** 2, 0));
  assert.ok(r > 0.4, `r = ${r.toFixed(2)}`);
  // the apex of the piece (72, held) is the loudest and swells
  const apex = notes.find((e) => e.pitch === 72);
  assert.equal(apex.x.shape, 'swell');
  assert.equal(Math.max(...vs), apex.x.vel);
  const marks = dynamicMarks(notes);
  assert.ok(marks.some((m) => m.type === 'cresc' && m.step === 0 && m.end === 16), 'crescendo from the start to the apex of the 1st phrase');
  assert.ok(marks.some((m) => m.type === 'dim' && m.step === 16 && m.end === 32), 'diminuendo from it to the end of the phrase');
  assert.ok(marks.some((m) => m.type === 'text' && m.text === 'f' && m.step === 76), 'forte on the apex');
});

test('baroque: terraced, the exact repeat of a phrase is its echo (piano), no hairpins, no metric accents', () => {
  const notes = withX('baroque');
  const level = (j) => notes.find((e) => e.x.phrase === j).x.level;
  assert.ok(level(0) - level(1) >= 0.25, 'the repeat is softer');
  assert.equal(level(2), level(0), 'the next new phrase is forte again');
  const marks = dynamicMarks(notes);
  assert.deepEqual(marks.filter((m) => m.type === 'text').map((m) => `${m.text}@${m.step}`), ['f@0', 'p@32', 'f@64']);
  assert.ok(!marks.some((m) => m.type === 'cresc' || m.type === 'dim'));
  assert.ok(notes.every((e) => !e.x.accent));
});

test('the dances accent their beats: the downbeat, the mazurka\'s 2nd beat; jazz the off-beat eighths', () => {
  const avg = (notes, f) => {
    const sel = notes.filter(f);
    return sel.reduce((s, e) => s + e.x.vel, 0) / sel.length;
  };
  const dance = withX('dance');
  assert.ok(avg(dance, (e) => e.start % 16 === 0) - avg(dance, (e) => e.start % 4 !== 0 || e.start % 8 === 4) > 0.05);
  assert.ok(!dynamicMarks(dance).some((m) => m.type !== 'text'), 'the accents of the dance are not written');
  const waltz = expressionOf(compactToEvents([[67, 4], [71, 4], [74, 4], [72, 4], [71, 4], [69, 4], [67, 12]]), { ...ctx('waltz'), barLen: 12 });
  assert.ok(waltz[0].vel > waltz[1].vel && waltz[3].vel > waltz[4].vel);
  const mazurka = expressionOf(compactToEvents([[67, 4], [71, 4], [74, 4], [72, 4], [71, 4], [69, 4], [67, 12]]), { ...ctx('mazurka'), barLen: 12 });
  assert.ok(mazurka[1].vel > mazurka[0].vel && mazurka[4].vel > mazurka[3].vel, 'the 2nd beat');
  const jazz = expressionOf(compactToEvents([[60, 2], [62, 2], [64, 2], [65, 2], [67, 4], [65, 2], [64, 2]]), ctx('jazz'));
  assert.ok(jazz[1].accent && jazz[3].accent && !jazz[0].accent && !jazz[2].accent, 'the off-beat eighths');
});

test('lullaby softer and fading out; blues leans on its blue notes; pop keeps time', () => {
  const lull = withX('lullaby');
  assert.ok(Math.max(...lull.map((e) => e.x.vel)) < 0.6);
  assert.ok(lull.at(-1).x.level < lull[0].x.level, 'softer at the end');
  const blues = expressionOf(compactToEvents([[60, 4], [63, 4], [65, 4], [66, 4], [67, 4], [70, 4], [67, 8]]), { ...ctx('blues'), key: { tonic: 0, mode: 'minor' } });
  assert.ok(blues[1].pain && blues[3].pain && blues[5].pain, 'E♭, G♭ and B♭ on the beat');
  assert.ok(!blues[0].pain && !blues[2].pain);
  assert.ok(blues.some((x) => x.vib === 0.25), 'the wide vibrato of the blues singer');
  const pop = rubatoOf(withX('popular'), { total, beat: 4, barLen: 16, kind: 'popular' });
  assert.ok(pop.stretch.every((f) => f === 1), 'pop: no rubato');
  assert.deepEqual(pop.marks, { rit: [], fermata: [], last: false });
});

test('the final ritardando matches the performances measured (ASAP): the last beat and the last bar', () => {
  assert.equal(ritardTempo(0, 0.4, 2), 1);
  assert.ok(Math.abs(ritardTempo(1, 0.4, 2) - 0.4) < 1e-9);
  // the tempo of each beat in the last bar before the last note, as tools/expression_study.py
  // measures it in the performances (score time over performance time)
  const measured = {};
  for (const line of readFileSync(new URL('../results/expressao/asap.csv', import.meta.url), 'utf8').trim().split('\n').slice(1)) {
    const [group, measure, , , p50] = line.split(',');
    measured[`${group}.${measure}`] = Number(p50);
  }
  for (const [kind, group] of [['baroque', 'baroque'], ['classical', 'classical']]) {
    const notes = withX(kind);
    const r = rubatoOf(notes, { total, beat: 4, barLen: 16, kind });
    const lastOnset = notes.at(-1).start;
    const beats = [0, 1, 2, 3].map((b) => 4 / r.stretch.slice(lastOnset - 16 + 4 * b, lastOnset - 12 + 4 * b).reduce((s, f) => s + f, 0));
    const bar = beats.reduce((s, x) => s + x, 0) / 4;
    assert.ok(Math.abs(beats[3] - measured[`${group}.last_beat_v`]) < 0.03, `${kind} last beat ${beats[3].toFixed(3)} vs ${measured[`${group}.last_beat_v`]}`);
    assert.ok(Math.abs(bar - measured[`${group}.last_bar_v`]) < 0.03, `${kind} last bar ${bar.toFixed(3)} vs ${measured[`${group}.last_bar_v`]}`);
    assert.equal(r.stretch[0], 1, 'in time at the start');
    assert.deepEqual(r.marks.rit, [lastOnset - 16]);
  }
  // the baroque has no phrase rubato (+0.6 % in the performances), the classical a little (+2.5 %)
  const bar = rubatoOf(withX('baroque'), { total, beat: 4, barLen: 16, kind: 'baroque' });
  assert.ok(bar.stretch.slice(0, 112).every((f) => f === 1));
  const cla = rubatoOf(withX('classical'), { total, beat: 4, barLen: 16, kind: 'classical' });
  assert.ok(cla.stretch[24] > 1 && cla.stretch[24] < 1.05, 'the end of the 1st phrase broadened');
  assert.ok(timeline(cla.stretch, 60).at(-1) > timeline(new Array(total).fill(1), 60).at(-1));
});

test('several voices: only the end is slowed; the fermata goes on the last note of every staff', () => {
  const lead = withX('song');
  const follower = lead.map((e) => ({ ...e, start: e.start + 32 })).filter((e) => e.start < total);
  const r = rubatoOf(lead, { total, beat: 4, barLen: 16, kind: 'song', all: [...lead, ...follower], phrases: false });
  const lastOnset = Math.max(...[...lead, ...follower].map((e) => e.start));
  assert.ok(r.stretch.slice(0, lastOnset - 16).every((f) => f === 1), 'no phrase rubato with two voices');
  assert.ok(r.stretch[lastOnset - 1] > 1.5 && r.stretch[lastOnset] === 1.8);
  assert.equal(r.marks.last, true);
  const model = scoreModel({ voices: [{ events: lead, instrument: 'soprano', name: 'S' }, { events: follower, instrument: 'alto', name: 'A' }], total, barLen: 16, meter: '4/4', key: C_MAJOR, marks: r.marks });
  assert.deepEqual(model.staves.map((st) => st.fermata), [[128], [Math.max(...follower.map((e) => e.start))]]);
  const ly = toLilyPond(model);
  assert.equal(ly.match(/\\fermata/g).length, 2);
  assert.match(ly, /rit\./);
  assert.match(ly, /\\</, 'the arch hairpins');
  // the chorale holds every phrase end (a fermata, where one breathes)
  const ch = rubatoOf(withX('chorale'), { total, beat: 4, barLen: 16, kind: 'chorale' });
  assert.deepEqual(ch.marks.fermata, [28, 60, 88]);
  assert.ok(ch.stretch[28] >= 1.3);
});
