// The score as a PDF: a valid vector PDF, one staff per voice or the canon on one line with entry
// marks. VexFlow runs in Node with a minimal DOM stub (it draws through our PDF context).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createPdf, winAnsi, textWidth, parseColor } from '../src/io/pdf.js';
import { scoreModel, canonLineModel, toLilyPond } from '../src/io/notation.js';

globalThis.window = globalThis;
globalThis.document ??= { createElementNS: () => ({ setAttribute() {}, appendChild() {}, style: {} }), createElement: () => ({ getContext: () => null, style: {} }) };
globalThis.navigator ??= { userAgent: 'node' };
createRequire(import.meta.url)('../vendor/vexflow-gonville.js');
const { scorePdf } = await import('../src/ui/score.js');

const G = { tonic: 7, mode: 'major', diatonic: [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1].map(Boolean) };
// 8 bars in G: quarters and eighths
const melody = [];
let t = 0;
const pitches = [67, 69, 71, 72, 74, 72, 71, 69, 67, 71, 74, 79, 78, 76, 74, 72, 71, 69, 67, 66, 67, 71, 69, 67];
pitches.forEach((p, i) => {
  const d = i % 3 === 2 ? 8 : 4;
  melody.push({ pitch: p, start: t, dur: d });
  t += d;
});
const length = 8 * 16;
while (t < length) {
  melody.push({ pitch: 67, start: t, dur: Math.min(16, length - t) });
  t += 16;
}
const shift = (evs, delay, semis = 0) => evs.map((e) => ({ ...e, start: e.start + delay, pitch: e.pitch + semis }));

const text = (bytes) => Buffer.from(bytes).toString('latin1');

test('WinAnsi text and standard font metrics', () => {
  assert.deepEqual(winAnsi('Canção à 5.ª – ok'), [...'Canção à 5.ª '].map((c) => c.charCodeAt(0)).concat([0x96, 0x20, 0x6f, 0x6b]));
  assert.equal(textWidth('A', 'Helvetica', 1000), 667);
  assert.equal(textWidth('a', 'Times-Roman', 10), 4.44);
  assert.deepEqual(parseColor('#fff'), [1, 1, 1]);
  assert.equal(parseColor('none'), null);
});

test('a minimal document is a well-formed PDF', () => {
  const doc = createPdf({ title: 'Teste' });
  const ctx = doc.addPage();
  ctx.setFont('Georgia', 12);
  ctx.fillText('Olá (partitura)', 50, 50);
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.quadraticCurveTo(20, 0, 30, 10);
  ctx.arc(40, 40, 5, 0, Math.PI * 2);
  ctx.fill();
  const s = text(doc.toBytes());
  assert.ok(s.startsWith('%PDF-1.4'));
  assert.ok(s.trimEnd().endsWith('%%EOF'));
  assert.match(s, /\/BaseFont \/Times-Roman \/Encoding \/WinAnsiEncoding/);
  assert.match(s, /\(Ol\xe1 \\\(partitura\\\)\) Tj/);
  // the cross-reference offsets point at the objects
  const xref = Number(s.match(/startxref\n(\d+)/)[1]);
  assert.equal(s.slice(xref, xref + 4), 'xref');
  const offsets = [...s.slice(xref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
  offsets.forEach((o, i) => assert.equal(s.slice(o, o + `${i + 1} 0 obj`.length), `${i + 1} 0 obj`));
});

test('the full score: one staff per voice, on A4 pages', () => {
  const model = scoreModel({
    voices: [
      { events: melody, instrument: 'violin', name: 'Violino 1' },
      { events: shift(melody, 16), instrument: 'violin', name: 'Violino 2' },
      { events: shift(melody, 32, -12), instrument: 'cello', name: 'Violoncelo' },
    ],
    total: length + 32, barLen: 16, key: G, title: 'Cânone a três', subtitle: 'teste', bpm: 84,
  });
  const { bytes, pages } = scorePdf(model);
  const s = text(bytes);
  assert.equal(pages, 1);
  assert.equal((s.match(/\/Type \/Page /g) || []).length, 1);
  assert.match(s, /\(C\xe2none a tr\xeas\) Tj/);
  assert.match(s, /\(Violoncelo\) Tj/);
  // music glyphs are vector paths
  assert.ok((s.match(/ c\n/g) || []).length > 500, 'curves of noteheads, clefs and ties');
});

test('the canon on one line: the melody once, a numbered mark where each voice comes in', () => {
  const model = canonLineModel({
    lead: { events: melody, instrument: 'violin', name: 'Violino 1' },
    entries: [{ step: 0, name: 'Violino 1' }, { step: 16, name: 'Violino 2' }, { step: 32, name: 'Violoncelo', intervalLabel: '8.ª abaixo' }],
    length, barLen: 16, key: G, title: 'Cânone a três', bpm: 84,
  });
  assert.equal(model.staves.length, 1);
  assert.equal(model.nBars, 8);
  assert.deepEqual(model.entries.map((e) => [e.step, e.number]), [[0, 1], [16, 2], [32, 3]]);
  assert.match(model.legend[3].text, /Violoncelo — entra quando a 1\.ª voz está no c\. 3, 8\.ª abaixo/);
  assert.match(model.legend.at(-1).text, /10 compassos ao todo/);
  const s = text(scorePdf(model).bytes);
  for (const k of ['1', '2', '3']) assert.match(s, new RegExp(`\\(${k}\\) Tj`), `mark ${k}`);
  // the same marks in LilyPond, and a round gets repeat signs
  const ly = toLilyPond(model);
  assert.equal((ly.match(/\\mark \\markup \\box/g) || []).length, 3);
  assert.match(ly, /\\bar "\|\."/);
  const round = canonLineModel({ lead: { events: melody, instrument: 'soprano', name: 'Soprano' }, entries: [{ step: 0, name: 'Voz 1' }, { step: 32, name: 'Voz 2' }], length, barLen: 16, key: G, circular: true });
  const rly = toLilyPond(round);
  assert.match(rly, /\\bar "\.\|:"/);
  assert.match(rly, /\\bar ":\|\."/);
  assert.match(round.legend[0].text, /^Ronda a 2 vozes/);
});

test('long pieces go on several pages', () => {
  const long = [];
  for (let r = 0; r < 8; r++) long.push(...shift(melody, r * length));
  const model = scoreModel({ voices: [{ events: long, instrument: 'violin', name: 'Violino' }, { events: shift(long, 16), instrument: 'violin', name: 'Violino 2' }], total: 8 * length + 16, barLen: 16, key: G, title: 'Longa' });
  const { bytes, pages } = scorePdf(model);
  assert.ok(pages >= 2, `${pages} pages`);
  assert.match(text(bytes), new RegExp(`\\(1 / ${pages}\\) Tj`));
});
