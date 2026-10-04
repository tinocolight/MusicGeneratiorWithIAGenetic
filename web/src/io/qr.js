// QR code encoder (ISO/IEC 18004), written for this page: no library to load.
//
// A symbol is built from segments, each in its own mode, so that the address of the page goes in
// byte mode and the music that follows it in numeric mode, the densest one (10 bits for three
// digits, 3.33 bits per digit: bytes written as decimal digits fill 99 % of it, against 75 % for
// Base64 in byte mode). Versions 1–40, error correction L/M/Q/H, the eight masks scored with the
// standard penalty rules. The construction follows the standard step by step (the same steps as
// Nayuki's reference description, https://www.nayuki.io/page/creating-a-qr-code-step-by-step).
//
//   const qr = encodeQr([byteSegment(url), numericSegment(digits)], { ecl: 'L' });
//   qr.size, qr.get(x, y)   // true = dark module

const ECL = { L: { bits: 1, i: 0 }, M: { bits: 0, i: 1 }, Q: { bits: 3, i: 2 }, H: { bits: 2, i: 3 } };
const ECL_ORDER = ['L', 'M', 'Q', 'H'];

// error correction codewords per block and number of blocks, per level (L, M, Q, H) and version
// (index 0 unused)
const ECC_PER_BLOCK = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];
const BLOCKS = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];

const MODES = {
  numeric: { indicator: 0x1, count: [10, 12, 14] },
  alphanumeric: { indicator: 0x2, count: [9, 11, 13] },
  byte: { indicator: 0x4, count: [8, 16, 16] },
};
const countBits = (mode, version) => MODES[mode].count[version <= 9 ? 0 : version <= 26 ? 1 : 2];
const ALNUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

/** Bits appended to an array of 0/1. */
function pushBits(out, value, n) {
  for (let i = n - 1; i >= 0; i--) out.push((value >>> i) & 1);
}

/** A segment of bytes (a string is written as UTF-8). */
export function byteSegment(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const bits = [];
  for (const b of bytes) pushBits(bits, b, 8);
  return { mode: 'byte', count: bytes.length, bits };
}

/** A segment of decimal digits: three digits in 10 bits. */
export function numericSegment(digits) {
  if (!/^\d*$/.test(digits)) throw new Error('numeric segment: digits only');
  const bits = [];
  for (let i = 0; i < digits.length; i += 3) {
    const chunk = digits.slice(i, i + 3);
    pushBits(bits, Number(chunk), chunk.length * 3 + 1);
  }
  return { mode: 'numeric', count: digits.length, bits };
}

/** A segment in the alphanumeric set (upper-case letters, digits, space and $%*+-./:). */
export function alphanumericSegment(text) {
  const bits = [];
  for (let i = 0; i < text.length; i += 2) {
    const a = ALNUM.indexOf(text[i]);
    if (a < 0) throw new Error(`alphanumeric segment: '${text[i]}'`);
    if (i + 1 < text.length) {
      const b = ALNUM.indexOf(text[i + 1]);
      if (b < 0) throw new Error(`alphanumeric segment: '${text[i + 1]}'`);
      pushBits(bits, a * 45 + b, 11);
    } else pushBits(bits, a, 6);
  }
  return { mode: 'alphanumeric', count: text.length, bits };
}

/** Modules of a version that carry data and error correction (all but the function patterns). */
function rawDataModules(ver) {
  let n = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const align = Math.floor(ver / 7) + 2;
    n -= (25 * align - 10) * align - 55;
    if (ver >= 7) n -= 36;
  }
  return n;
}
/** Data codewords of a version and level. */
export function dataCodewords(ver, ecl) {
  const e = ECL[ecl].i;
  return Math.floor(rawDataModules(ver) / 8) - ECC_PER_BLOCK[e][ver] * BLOCKS[e][ver];
}

/** Bits the segments take in a version (or Infinity if a count does not fit its field). */
function segmentBits(segs, ver) {
  let n = 0;
  for (const s of segs) {
    const cb = countBits(s.mode, ver);
    if (s.count >= 2 ** cb) return Infinity;
    n += 4 + cb + s.bits.length;
  }
  return n;
}

/** Largest number of bytes (decimal digits) that fit after `prefixBytes` in byte mode. */
export function capacity(ver, ecl, prefixBytes) {
  const free = dataCodewords(ver, ecl) * 8 - (4 + countBits('byte', ver) + 8 * prefixBytes) - (4 + countBits('numeric', ver));
  if (free <= 0) return 0;
  const digits = Math.floor(free / 10) * 3 + (free % 10 >= 7 ? 2 : free % 10 >= 4 ? 1 : 0);
  return digits;
}

// ---------------------------------------------------------------- Reed–Solomon over GF(256), x^8+x^4+x^3+x^2+1

function gfMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}
function rsDivisor(degree) {
  const r = new Array(degree).fill(0);
  r[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < r.length; j++) {
      r[j] = gfMul(r[j], root);
      if (j + 1 < r.length) r[j] ^= r[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return r;
}
function rsRemainder(data, divisor) {
  const r = divisor.map(() => 0);
  for (const b of data) {
    const f = b ^ r.shift();
    r.push(0);
    divisor.forEach((c, i) => (r[i] ^= gfMul(c, f)));
  }
  return r;
}

/** Data codewords split into blocks, each followed by its error correction, interleaved. */
function addEcc(data, ver, ecl) {
  const e = ECL[ecl].i;
  const nBlocks = BLOCKS[e][ver];
  const eccLen = ECC_PER_BLOCK[e][ver];
  const raw = Math.floor(rawDataModules(ver) / 8);
  const nShort = nBlocks - (raw % nBlocks);
  const shortLen = Math.floor(raw / nBlocks);
  const divisor = rsDivisor(eccLen);
  const blocks = [];
  for (let i = 0, k = 0; i < nBlocks; i++) {
    const len = shortLen - eccLen + (i < nShort ? 0 : 1);
    const dat = data.slice(k, k + len);
    k += len;
    const ecc = rsRemainder(dat, divisor);
    if (i < nShort) dat.push(0); // placeholder: short blocks are one data codeword shorter
    blocks.push(dat.concat(ecc));
  }
  const out = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((b, j) => {
      if (i !== shortLen - eccLen || j >= nShort) out.push(b[i]);
    });
  }
  return out;
}

// ---------------------------------------------------------------- the symbol

function alignmentPositions(ver) {
  if (ver === 1) return [];
  const n = Math.floor(ver / 7) + 2;
  const step = Math.floor((ver * 8 + n * 3 + 5) / (n * 4 - 4)) * 2;
  const out = [6];
  for (let pos = ver * 4 + 10; out.length < n; pos -= step) out.splice(1, 0, pos);
  return out;
}

function buildSymbol(ver, ecl, codewords, forcedMask) {
  const size = ver * 4 + 17;
  const dark = Array.from({ length: size }, () => new Array(size).fill(false));
  const fixed = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, v) => {
    dark[y][x] = v;
    fixed[y][x] = true;
  };
  // timing patterns
  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  // finder patterns with their separators
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
      }
    }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);
  // alignment patterns
  const al = alignmentPositions(ver);
  al.forEach((ay, i) => al.forEach((ax, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));
  // format bits are reserved now and drawn with the mask
  const drawFormat = (mask) => {
    const data = (ECL[ecl].bits << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    const bit = (i) => ((bits >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6));
    set(8, 8, bit(7));
    set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true); // the dark module
  };
  drawFormat(0);
  // version information (versions 7 and up)
  if (ver >= 7) {
    let rem = ver;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (ver << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const b = ((bits >>> i) & 1) !== 0;
      const a = size - 11 + (i % 3);
      const c = Math.floor(i / 3);
      set(a, c, b);
      set(c, a, b);
    }
  }
  // data in the zigzag, two columns at a time from the bottom right, skipping the timing column
  let k = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < size; v++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - v : v;
        if (!fixed[y][x] && k < codewords.length * 8) {
          dark[y][x] = ((codewords[k >>> 3] >>> (7 - (k & 7))) & 1) !== 0;
          k++;
        }
      }
    }
  }
  const MASKS = [
    (x, y) => (x + y) % 2 === 0,
    (x, y) => y % 2 === 0,
    (x) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];
  const applyMask = (m) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fixed[y][x] && MASKS[m](x, y)) dark[y][x] = !dark[y][x];
  };
  let mask = forcedMask;
  if (mask === undefined || mask === null) {
    let best = Infinity;
    for (let m = 0; m < 8; m++) {
      applyMask(m);
      drawFormat(m);
      const p = penalty(dark, size);
      if (p < best) {
        best = p;
        mask = m;
      }
      applyMask(m); // undo (XOR)
    }
  }
  applyMask(mask);
  drawFormat(mask);
  return { size, dark, mask };
}

/** Penalty of a masked symbol (rules N1–N4 of the standard). */
function penalty(dark, size) {
  let score = 0;
  const finderLike = (run) => {
    // 1:1:3:1:1 dark-light pattern with 4 light modules on either side
    const n = run[1];
    const core = n > 0 && run[2] === n && run[3] === n * 3 && run[4] === n && run[5] === n;
    return (core && run[0] >= n * 4 && run[6] >= n ? 1 : 0) + (core && run[6] >= n * 4 && run[0] >= n ? 1 : 0);
  };
  const line = (get) => {
    let s = 0;
    let color = false;
    let runLen = 0;
    const hist = [0, 0, 0, 0, 0, 0, 0];
    const addHist = (len) => {
      if (hist[0] === 0) len += size; // the light border before the first run
      hist.pop();
      hist.unshift(len);
    };
    for (let i = 0; i < size; i++) {
      if (get(i) === color) {
        runLen++;
        if (runLen === 5) s += 3;
        else if (runLen > 5) s++;
      } else {
        addHist(runLen);
        if (!color) s += finderLike(hist) * 40;
        color = get(i);
        runLen = 1;
      }
    }
    // the end of the line, counted with the light border after it
    if (color) {
      addHist(runLen);
      runLen = 0;
    }
    runLen += size;
    addHist(runLen);
    s += finderLike(hist) * 40;
    return s;
  };
  for (let y = 0; y < size; y++) score += line((x) => dark[y][x]);
  for (let x = 0; x < size; x++) score += line((y) => dark[y][x]);
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = dark[y][x];
      if (c === dark[y][x + 1] && c === dark[y + 1][x] && c === dark[y + 1][x + 1]) score += 3;
    }
  }
  let darkCount = 0;
  for (const row of dark) for (const v of row) if (v) darkCount++;
  const total = size * size;
  const k = Math.ceil(Math.abs(darkCount * 20 - total * 10) / total) - 1;
  return score + k * 10;
}

/**
 * Encode the segments in the smallest version (minVersion..maxVersion) at level `ecl`; with
 * `boost` the level is raised while the data still fits the same version.
 * Returns {version, ecl, mask, size, get(x, y), rows} or throws when the data does not fit.
 */
export function encodeQr(segments, { ecl = 'L', minVersion = 1, maxVersion = 40, boost = true, mask } = {}) {
  let ver = minVersion;
  let used;
  for (; ver <= maxVersion; ver++) {
    used = segmentBits(segments, ver);
    if (used <= dataCodewords(ver, ecl) * 8) break;
  }
  if (ver > maxVersion) throw new Error('QR: the data does not fit');
  let level = ecl;
  if (boost) for (const l of ECL_ORDER.slice(ECL_ORDER.indexOf(ecl) + 1)) if (used <= dataCodewords(ver, l) * 8) level = l;
  const bits = [];
  for (const s of segments) {
    pushBits(bits, MODES[s.mode].indicator, 4);
    pushBits(bits, s.count, countBits(s.mode, ver));
    for (const b of s.bits) bits.push(b);
  }
  const capBits = dataCodewords(ver, level) * 8;
  pushBits(bits, 0, Math.min(4, capBits - bits.length)); // terminator
  pushBits(bits, 0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capBits; pad ^= 0xec ^ 0x11) pushBits(bits, pad, 8);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    data.push(b);
  }
  const sym = buildSymbol(ver, level, addEcc(data, ver, level), mask);
  return { version: ver, ecl: level, mask: sym.mask, size: sym.size, rows: sym.dark, get: (x, y) => x >= 0 && y >= 0 && x < sym.size && y < sym.size && sym.dark[y][x] };
}

/** Dark runs of each row: [{y, x, w}], to draw the symbol with few rectangles. */
export function qrRuns(qr) {
  const runs = [];
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; ) {
      if (!qr.rows[y][x]) {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < qr.size && qr.rows[y][x + w]) w++;
      runs.push({ y, x, w });
      x += w;
    }
  }
  return runs;
}
