// A piece written so that it can be read back: inside the MIDI file, as a text event, and from
// there inside the PDF (an attached file) and inside a link or a QR code.
//
// The MIDI file is the carrier: any player plays it, and this page also finds in it the record
// of the piece (its genes, the settings it was composed with, tempo and title), so that opening
// the MIDI, the PDF or the link brings back the same piece, with its canon voices and evaluation.
//
// Link: <page>#M<digits>. The digits are the bytes of the MIDI file compressed with DEFLATE,
// 12 bytes for every 29 digits. Digits are what a QR code stores most densely (numeric mode:
// 3.33 bits per digit, against 8 per character in byte mode), and they need no escaping in a
// URL; the fragment (after #) never leaves the phone, so the address can be of any length.

export const SONG_MARK = 'ondas-atratoras/1 ';
export const LINK_MARK = '#M';

// ---------------------------------------------------------------- settings as a difference

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isObject = (x) => x && typeof x === 'object' && !Array.isArray(x);

/** The fields of `c` that differ from `base` (objects field by field, arrays whole). */
export function configDiff(c, base) {
  const out = {};
  for (const [k, v] of Object.entries(c)) {
    if (same(v, base?.[k])) continue;
    if (isObject(v) && isObject(base?.[k])) {
      const d = configDiff(v, base[k]);
      if (Object.keys(d).length) out[k] = d;
    } else out[k] = v;
  }
  return out;
}

/** `base` with the fields of `diff` written over it (a new object). */
export function mergeConfig(base, diff) {
  const out = JSON.parse(JSON.stringify(base));
  const into = (o, d) => {
    for (const [k, v] of Object.entries(d || {})) {
      if (isObject(v) && isObject(o[k])) into(o[k], v);
      else o[k] = JSON.parse(JSON.stringify(v));
    }
  };
  into(out, diff);
  return out;
}

// ---------------------------------------------------------------- genes as text

// genes are 0..74 (0 rest, 74 hold, else a pitch): one printable character each, without the
// backslash and the quote marks that JSON would escape
const ALPHABET = Array.from({ length: 92 }, (_, i) => String.fromCharCode(35 + i)).filter((c) => c !== '\\').slice(0, 75).join('');

export function genesToText(genes) {
  return genes.map((g) => ALPHABET[Math.max(0, Math.min(74, g))]).join('');
}
export function textToGenes(text) {
  return [...text].map((c) => {
    const g = ALPHABET.indexOf(c);
    if (g < 0) throw new Error(`gene '${c}'`);
    return g;
  });
}

// ---------------------------------------------------------------- the record

/**
 * Text of a piece for the MIDI file. `song`: {title, genes, length, barLen, meter, key:{tonic,
 * mode}, bpm, allVoices, config (difference from the defaults) or voices [{instrument, delay,
 * interval}], circular, end}.
 */
export function songText(song) {
  const r = { ...song, genes: genesToText(song.genes) };
  for (const k of Object.keys(r)) if (r[k] === undefined || r[k] === null) delete r[k];
  return SONG_MARK + JSON.stringify(r);
}

/** The record back from songText, or null if the text is not one. */
export function parseSongText(text) {
  if (typeof text !== 'string' || !text.startsWith(SONG_MARK)) return null;
  const r = JSON.parse(text.slice(SONG_MARK.length));
  if (typeof r.genes !== 'string') throw new Error('song: no genes');
  return { ...r, genes: textToGenes(r.genes) };
}

// ---------------------------------------------------------------- compression

async function pipe(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}
export const canCompress = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
export const deflateRaw = (bytes) => pipe(bytes, new CompressionStream('deflate-raw'));
export const inflateRaw = (bytes) => pipe(bytes, new DecompressionStream('deflate-raw'));
export const inflate = (bytes) => pipe(bytes, new DecompressionStream('deflate'));

// ---------------------------------------------------------------- bytes as digits

const CHUNK = 12; // bytes
const DIGITS = 29; // 10^29 > 2^96
// digits of a last, shorter chunk of k bytes (all different, so the length tells k back)
const TAIL = Array.from({ length: CHUNK }, (_, k) => (k ? Math.ceil((8 * k) / Math.log2(10)) : 0));

export function bytesToDigits(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const part = bytes.subarray(i, i + CHUNK);
    let n = 0n;
    for (const b of part) n = (n << 8n) | BigInt(b);
    s += n.toString().padStart(part.length === CHUNK ? DIGITS : TAIL[part.length], '0');
  }
  return s;
}

export function digitsToBytes(digits) {
  if (!/^\d*$/.test(digits)) throw new Error('digits only');
  const out = [];
  const full = Math.floor(digits.length / DIGITS);
  const rest = digits.length - full * DIGITS;
  const k = TAIL.indexOf(rest);
  if (rest && k < 0) throw new Error('the number of digits does not match');
  const take = (s, n) => {
    let v = BigInt(s);
    const bytes = new Array(n);
    for (let j = n - 1; j >= 0; j--) {
      bytes[j] = Number(v & 255n);
      v >>= 8n;
    }
    if (v) throw new Error('digits out of range');
    out.push(...bytes);
  };
  for (let i = 0; i < full; i++) take(digits.slice(i * DIGITS, (i + 1) * DIGITS), CHUNK);
  if (rest) take(digits.slice(full * DIGITS), k);
  return new Uint8Array(out);
}

// ---------------------------------------------------------------- the link

// first byte of the payload: how the MIDI file follows it
const RAW = 0;
const DEFLATE = 1;

/** Payload of a MIDI file: compressed when that makes it smaller. */
export async function packMidi(midi) {
  let body = midi;
  let how = RAW;
  if (canCompress()) {
    const z = await deflateRaw(midi);
    if (z.length < midi.length) {
      body = z;
      how = DEFLATE;
    }
  }
  const out = new Uint8Array(body.length + 1);
  out[0] = how;
  out.set(body, 1);
  return out;
}

export async function unpackMidi(payload) {
  const body = payload.subarray(1);
  if (payload[0] === RAW) return body;
  if (payload[0] === DEFLATE) return inflateRaw(body);
  throw new Error('unknown payload');
}

/** {prefix, digits, url}: the link of a MIDI file on the page at `base`. */
export async function midiLink(base, midi) {
  const prefix = `${String(base).split('#')[0]}${LINK_MARK}`;
  const digits = bytesToDigits(await packMidi(midi));
  return { prefix, digits, url: prefix + digits };
}

/** The MIDI file of a link (or of its fragment), or null if it has none. */
export async function midiFromLink(href) {
  const i = String(href).indexOf(LINK_MARK);
  if (i < 0) return null;
  const digits = String(href).slice(i + LINK_MARK.length).replace(/[^\d]/g, '');
  if (!digits) return null;
  return unpackMidi(digitsToBytes(digits));
}
