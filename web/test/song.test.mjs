import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeQr, byteSegment, numericSegment, alphanumericSegment, dataCodewords, capacity } from '../src/io/qr.js';
import {
  bytesToDigits, digitsToBytes, songText, parseSongText, configDiff, mergeConfig, genesToText, textToGenes,
  midiLink, midiFromLink, packMidi, unpackMidi,
} from '../src/io/song.js';
import { writeMidi, readMidi } from '../src/io/midi.js';
import { createPdf, readPdfAttachments } from '../src/io/pdf.js';
import { defaultConfig, applyEnsemble } from '../src/ui/config.js';
import { EXAMPLES } from '../src/data/examples.js';
import { toEvents } from '../src/core/score.js';

// ------------------------------------------------------------------ a small QR reader for the tests
// (no error correction: it reads the symbol back as written, which checks the format bits, the
// masking, the zigzag placement, the block interleaving and the segments)

const MASKS = [
  (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];
const BLOCKS = { L: [1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25] };

function readQr(qr) {
  const n = qr.size;
  const ver = (n - 17) / 4;
  // format bits around the top-left finder
  let f = 0;
  for (let i = 0; i <= 5; i++) f |= (qr.get(8, i) ? 1 : 0) << i;
  f |= (qr.get(8, 7) ? 1 : 0) << 6;
  f |= (qr.get(8, 8) ? 1 : 0) << 7;
  f |= (qr.get(7, 8) ? 1 : 0) << 8;
  for (let i = 9; i < 15; i++) f |= (qr.get(14 - i, 8) ? 1 : 0) << i;
  f ^= 0x5412;
  const ecl = { 1: 'L', 0: 'M', 3: 'Q', 2: 'H' }[f >>> 13];
  const mask = (f >>> 10) & 7;
  // function modules, as the encoder places them
  const fn = Array.from({ length: n }, () => new Array(n).fill(false));
  const mark = (x, y) => x >= 0 && y >= 0 && x < n && y < n && (fn[y][x] = true);
  for (let i = 0; i < n; i++) mark(6, i), mark(i, 6);
  for (const [cx, cy] of [[3, 3], [n - 4, 3], [3, n - 4]]) for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) mark(cx + dx, cy + dy);
  if (ver > 1) {
    const k = Math.floor(ver / 7) + 2;
    const step = Math.floor((ver * 8 + k * 3 + 5) / (k * 4 - 4)) * 2;
    const pos = [6];
    for (let p = n - 7; pos.length < k; p -= step) pos.splice(1, 0, p);
    pos.forEach((a, i) => pos.forEach((b, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === k - 1) || (i === k - 1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) mark(a + dx, b + dy);
    }));
  }
  for (let i = 0; i < 9; i++) mark(8, i), mark(i, 8);
  for (let i = 0; i < 8; i++) mark(n - 1 - i, 8), mark(8, n - 1 - i);
  if (ver >= 7) for (let i = 0; i < 18; i++) mark(n - 11 + (i % 3), Math.floor(i / 3)), mark(Math.floor(i / 3), n - 11 + (i % 3));
  // zigzag
  const bits = [];
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < n; v++) for (let j = 0; j < 2; j++) {
      const x = right - j;
      const y = ((right + 1) & 2) === 0 ? n - 1 - v : v;
      if (!fn[y][x]) bits.push(qr.get(x, y) !== MASKS[mask](x, y) ? 1 : 0);
    }
  }
  const words = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) words.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  // de-interleave the data codewords (level L only in these tests)
  assert.equal(ecl, 'L');
  const nb = BLOCKS.L[ver - 1];
  const total = dataCodewords(ver, 'L');
  const short = Math.floor(total / nb);
  const nLong = total % nb;
  const lens = Array.from({ length: nb }, (_, i) => short + (i >= nb - nLong ? 1 : 0));
  const blocks = lens.map(() => []);
  let k = 0;
  for (let i = 0; i <= short; i++) lens.forEach((len, b) => i < len && blocks[b].push(words[k++]));
  const data = blocks.flat();
  // segments
  const dbits = data.flatMap((w) => [7, 6, 5, 4, 3, 2, 1, 0].map((s) => (w >>> s) & 1));
  let p = 0;
  const take = (m) => {
    let v = 0;
    for (let i = 0; i < m; i++) v = (v << 1) | dbits[p++];
    return v;
  };
  let out = '';
  const cb = (mode) => ({ 1: [10, 12, 14], 2: [9, 11, 13], 4: [8, 16, 16] }[mode][ver <= 9 ? 0 : ver <= 26 ? 1 : 2]);
  for (;;) {
    if (p + 4 > dbits.length) break;
    const mode = take(4);
    if (mode === 0) break;
    const count = take(cb(mode));
    if (mode === 4) out += new TextDecoder().decode(new Uint8Array(Array.from({ length: count }, () => take(8))));
    else if (mode === 1) for (let i = 0; i < count; i += 3) out += String(take(Math.min(3, count - i) * 3 + 1)).padStart(Math.min(3, count - i), '0');
    else if (mode === 2) {
      const A = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
      for (let i = 0; i < count; i += 2) {
        if (i + 1 < count) {
          const v = take(11);
          out += A[Math.floor(v / 45)] + A[v % 45];
        } else out += A[take(6)];
      }
    }
  }
  return { text: out, ecl, mask, version: ver };
}

test('QR codes read back: byte, numeric and alphanumeric segments, small and large versions', () => {
  const url = 'https://example.org/ondas/#M';
  for (const len of [0, 1, 2, 3, 10, 200, 1000, 3000, 7000]) {
    const digits = Array.from({ length: len }, (_, i) => String((i * 7 + 3) % 10)).join('');
    const qr = encodeQr([byteSegment(url), numericSegment(digits)], { ecl: 'L', boost: false });
    assert.equal(qr.size, qr.version * 4 + 17);
    const back = readQr(qr);
    assert.equal(back.text, url + digits, `${len} digits, version ${qr.version}`);
    assert.equal(back.mask, qr.mask);
  }
  for (let m = 0; m < 8; m++) assert.equal(readQr(encodeQr([alphanumericSegment('ONDAS ATRATORAS 2026')], { mask: m, boost: false })).text, 'ONDAS ATRATORAS 2026');
  // the largest symbol holds 7089 digits alone (one more does not fit); after an (empty) byte
  // segment its 20 header bits leave 7083
  assert.equal(encodeQr([numericSegment('1'.repeat(7089))], { ecl: 'L' }).version, 40);
  assert.throws(() => encodeQr([numericSegment('1'.repeat(7090))], { ecl: 'L' }));
  assert.equal(capacity(40, 'L', 0), 7083);
});

test('bytes as decimal digits: 12 bytes in 29 digits, any length back', () => {
  for (const n of [0, 1, 2, 5, 11, 12, 13, 24, 100, 1001]) {
    const b = new Uint8Array(n).map((_, i) => (i * 37 + 255 * (i % 3 === 0)) & 255);
    const d = bytesToDigits(b);
    assert.match(d, /^\d*$/);
    assert.deepEqual(digitsToBytes(d), b, `${n} bytes`);
    // numeric mode stores the digits in 99 % of the bits of the bytes themselves (bytes 8 bits)
    if (n >= 12) assert.ok((d.length * 10) / 3 <= n * 8 * 1.03);
  }
  assert.throws(() => digitsToBytes('1234')); // no chunk is 4 digits long
});

test('settings as a difference from the defaults, genes as text', () => {
  const c = defaultConfig();
  applyEnsemble(c, 'trio');
  c.weights.heuristics = 3;
  const d = configDiff(c, defaultConfig());
  assert.ok(JSON.stringify(d).length < JSON.stringify(c).length / 3);
  assert.deepEqual(mergeConfig(defaultConfig(), d), c);
  const genes = Array.from({ length: 75 }, (_, i) => i);
  assert.deepEqual(textToGenes(genesToText(genes)), genes);
  assert.ok(!/[\\"]/.test(genesToText(genes)));
});

test('the MIDI file carries the record of the piece; the link carries the MIDI file', async () => {
  const genes = EXAMPLES[0].genes;
  const song = { title: 'Peça · teste', genes, barLen: 16, meter: '4/4', key: { tonic: 7, mode: 'major' }, bpm: 84, allVoices: true, config: configDiff(defaultConfig(), defaultConfig()) };
  const events = toEvents(genes).filter((e) => e.pitch !== null);
  const voices = [{ events, program: 40 }, { events: events.map((e) => ({ ...e, start: e.start + 16 })), program: 40 }];
  const plain = writeMidi(voices, { bpm: 84, text: songText(song) });
  const small = writeMidi(voices, { bpm: 84, text: songText(song), compact: true });
  assert.ok(small.length < plain.length);
  for (const bytes of [plain, small]) {
    const res = readMidi(bytes);
    assert.equal(res.tracks.length, 2);
    assert.equal(res.tracks[1].notes.length, events.length);
    assert.equal(Math.round(res.bpm), 84);
    const rec = parseSongText(res.texts.find((x) => parseSongText(x)));
    assert.deepEqual(rec.genes, genes);
    assert.equal(rec.title, song.title);
  }
  // compressed in the link, and back
  assert.ok((await packMidi(small)).length < small.length);
  assert.deepEqual(await unpackMidi(await packMidi(small)), small);
  const link = await midiLink('https://example.org/ondas/', small);
  assert.ok(link.url.startsWith('https://example.org/ondas/#M'));
  assert.deepEqual(await midiFromLink(link.url), small);
  assert.equal(await midiFromLink('https://example.org/ondas/'), null);
  // and in a QR code that reads back to the same link
  const qr = encodeQr([byteSegment(link.prefix), numericSegment(link.digits)], { ecl: 'L', boost: false });
  assert.equal(readQr(qr).text, link.url);
});

test('files attached to a PDF are read back', async () => {
  const doc = createPdf({ title: 'Teste' });
  doc.addPage().fillText('Olá', 40, 40);
  const midi = writeMidi([{ events: [{ pitch: 60, start: 0, dur: 4 }] }], { text: 'endobj stream' });
  doc.attach({ name: 'peça.mid', mime: 'audio/midi', data: midi, description: 'MIDI' });
  doc.attach({ name: 'notas.txt', mime: 'text/plain', data: new TextEncoder().encode('endstream endobj') });
  const bytes = doc.toBytes();
  assert.equal(String.fromCharCode(...bytes.subarray(0, 8)), '%PDF-1.7');
  const files = await readPdfAttachments(bytes);
  assert.deepEqual(files.map((f) => f.name).sort(), ['notas.txt', 'peça.mid']);
  assert.deepEqual(files.find((f) => f.name === 'peça.mid').data, midi);
  // the same with the stream compressed and its length given as a reference, as other programs save it
  const z = new Uint8Array(await new Response(new Blob([midi]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
  const latin = (b) => String.fromCharCode(...b);
  const pdf = `%PDF-1.7\n1 0 obj\n<< /Type /Filespec /F (x.mid) /EF << /F 2 0 R >> >>\nendobj\n2 0 obj\n<</Length 3 0 R/Filter/FlateDecode/Type/EmbeddedFile>>\nstream\n${latin(z)}\nendstream\nendobj\n3 0 obj\n${z.length}\nendobj\n%%EOF\n`;
  const again = await readPdfAttachments(new Uint8Array([...pdf].map((c) => c.charCodeAt(0))));
  assert.equal(again[0].name, 'x.mid');
  assert.deepEqual(again[0].data, midi);
});

test('the player a QR code opens reads every voice of the MIDI file, and its page has its texts', async () => {
  const { songOfMidiFile, instrumentOfProgram } = await import('../src/player/player.js');
  const { TEXTS } = await import('../src/i18n/texts.js');
  const { readFileSync } = await import('node:fs');
  const lead = [{ pitch: 67, start: 0, dur: 4 }, { pitch: 69, start: 4, dur: 2 }, { pitch: 71, start: 6, dur: 10 }];
  const voices = [
    { events: lead, program: 40, name: 'Violino 1' },
    { events: lead.map((e) => ({ ...e, start: e.start + 16, pitch: e.pitch - 12 })), program: 42, name: 'Violoncelo 2' },
  ];
  const song = { title: 'Ronda', genes: [40, 74, 74, 74], barLen: 16, meter: '3/4' };
  const midi = writeMidi(voices, { bpm: 100, numerator: 3, denominator: 4, text: songText(song), compact: true });
  const s = songOfMidiFile(midi);
  assert.equal(s.title, 'Ronda');
  assert.equal(Math.round(s.bpm), 100);
  assert.deepEqual([s.numerator, s.denominator, s.barLen], [3, 4, 12]);
  assert.deepEqual(s.voices.map((v) => v.instrument), ['violin', 'cello']);
  assert.deepEqual(s.voices[1].events, voices[1].events);
  assert.equal(s.length, 32);
  // programs shared by several of the page's instruments: the range decides
  assert.equal(instrumentOfProgram(52, [43, 45, 47]), 'bassVoice');
  assert.equal(instrumentOfProgram(52, [72, 74]), 'soprano');
  assert.equal(instrumentOfProgram(99), 'piano');
  const html = readFileSync(new URL('../tocar.html', import.meta.url), 'utf8');
  const keys = [...html.matchAll(/data-i18n(?:-html|-title|-aria-label)?="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(keys.length >= 8);
  for (const k of keys) assert.ok(TEXTS[k], `tocar.html uses ${k}`);
});
