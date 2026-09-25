// Minimal Standard MIDI File writer (format 1, several tracks) and reader (monophonic line).
// Writer: tempo, time signature, one track per voice (for a canon: two players, the second
// entering `delay` steps later), 16th = TICKS/4.

const TICKS = 96; // per quarter note

function vlq(n) {
  const bytes = [n & 0x7f];
  while ((n >>= 7)) bytes.unshift((n & 0x7f) | 0x80);
  return bytes;
}
const str = (s) => [...s].map((c) => c.charCodeAt(0));
const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const u16 = (n) => [(n >>> 8) & 255, n & 255];

function trackChunk(events) {
  // events: [{tick, bytes}] sorted
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const data = [];
  let last = 0;
  for (const e of events) {
    data.push(...vlq(e.tick - last), ...e.bytes);
    last = e.tick;
  }
  data.push(0, 0xff, 0x2f, 0x00);
  return [...str('MTrk'), ...u32(data.length), ...data];
}

/**
 * @param voices [{events: [{pitch|null, start, dur}], offset (16ths), program, channel, name}]
 * @param opts {bpm, numerator, denominator}
 */
export function writeMidi(voices, { bpm = 90, numerator = 4, denominator = 4 } = {}) {
  const tempo = Math.round(60000000 / bpm);
  const meta = [
    { tick: 0, order: 0, bytes: [0xff, 0x51, 0x03, (tempo >> 16) & 255, (tempo >> 8) & 255, tempo & 255] },
    { tick: 0, order: 0, bytes: [0xff, 0x58, 0x04, numerator, Math.log2(denominator), 24, 8] },
  ];
  const tracks = [trackChunk(meta)];
  voices.forEach((v, i) => {
    const ch = (v.channel ?? i) & 15;
    const evs = [
      { tick: 0, order: 0, bytes: [0xff, 0x03, ...vlq((v.name || `Voice ${i + 1}`).length), ...str(v.name || `Voice ${i + 1}`)] },
      { tick: 0, order: 1, bytes: [0xc0 | ch, v.program ?? 40] },
    ];
    const q = TICKS / 4;
    for (const e of v.events) {
      if (e.pitch === null) continue;
      const on = (e.start + (v.offset || 0)) * q;
      const off = on + e.dur * q;
      evs.push({ tick: on, order: 3, bytes: [0x90 | ch, e.pitch, v.velocity ?? 88] });
      evs.push({ tick: off, order: 2, bytes: [0x80 | ch, e.pitch, 0] });
    }
    tracks.push(trackChunk(evs));
  });
  const header = [...str('MThd'), ...u32(6), ...u16(1), ...u16(tracks.length), ...u16(TICKS)];
  return new Uint8Array([...header, ...tracks.flat()]);
}

/**
 * Read a MIDI file and return a monophonic line as compact events [[midi|-1, dur16], ...]
 * quantised to 16ths. Polyphony is reduced to the highest sounding note ("skyline").
 * Returns {compact, barLen, tracks: [{index, name, notes}]}; `track` selects one track (-1 = all).
 */
export function readMidi(bytes, { track = -1 } = {}) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let p = 0;
  const readStr = (n) => String.fromCharCode(...bytes.slice(p, (p += n)));
  const readVlq = () => {
    let v = 0;
    let b;
    do {
      b = bytes[p++];
      v = (v << 7) | (b & 0x7f);
    } while (b & 0x80);
    return v;
  };
  if (readStr(4) !== 'MThd') throw new Error('not a MIDI file');
  const hlen = dv.getUint32(p);
  p += 4;
  const ntracks = dv.getUint16(p + 2);
  const division = dv.getUint16(p + 4);
  p += hlen;
  if (division & 0x8000) throw new Error('SMPTE time division is not supported');
  let numerator = 4;
  let denominator = 4;
  const tracks = [];
  for (let t = 0; t < ntracks && p < bytes.length; t++) {
    if (readStr(4) !== 'MTrk') break;
    const len = dv.getUint32(p);
    p += 4;
    const end = p + len;
    let tick = 0;
    let status = 0;
    const open = new Map();
    const notes = [];
    let name = `Track ${t + 1}`;
    while (p < end) {
      tick += readVlq();
      let b = bytes[p];
      if (b & 0x80) {
        status = b;
        p++;
      }
      const type = status & 0xf0;
      if (status === 0xff) {
        const mt = bytes[p++];
        const ml = readVlq();
        if (mt === 0x58) {
          numerator = bytes[p];
          denominator = 2 ** bytes[p + 1];
        }
        if (mt === 0x03) name = String.fromCharCode(...bytes.slice(p, p + ml));
        p += ml;
      } else if (status === 0xf0 || status === 0xf7) {
        p += readVlq();
      } else if (type === 0x90 || type === 0x80) {
        const key = bytes[p++];
        const vel = bytes[p++];
        const k = `${status & 15}:${key}`;
        if (type === 0x90 && vel > 0) open.set(k, tick);
        else if (open.has(k)) {
          notes.push({ pitch: key, on: open.get(k), off: tick, channel: status & 15 });
          open.delete(k);
        }
      } else if (type === 0xc0 || type === 0xd0) p += 1;
      else p += 2;
    }
    p = end;
    const drums = notes.length && notes.every((n) => n.channel === 9);
    if (notes.length && !drums) tracks.push({ index: t, name, notes });
  }
  const chosen = track < 0 ? tracks.flatMap((t) => t.notes) : (tracks.find((t) => t.index === track)?.notes ?? []);
  const q = division / 4;
  const barLen = Math.round((numerator * 16) / denominator);
  if (!chosen.length) return { compact: [], barLen, tracks };
  const first = Math.min(...chosen.map((n) => n.on));
  const startStep = Math.floor(first / q / barLen) * barLen; // keep bar alignment
  const lastStep = Math.max(...chosen.map((n) => Math.round(n.off / q)));
  const grid = new Array(lastStep - startStep + 1).fill(null);
  const onset = new Array(grid.length).fill(false);
  for (const n of chosen) {
    const a = Math.round(n.on / q) - startStep;
    const b = Math.max(a + 1, Math.round(n.off / q) - startStep);
    for (let s = a; s < b && s < grid.length; s++) {
      if (grid[s] === null || n.pitch > grid[s]) {
        grid[s] = n.pitch;
        onset[s] = s === a || onset[s];
      }
    }
  }
  const compact = [];
  for (let s = 0; s < grid.length; s++) {
    const prev = compact[compact.length - 1];
    if (grid[s] === null) {
      if (prev && prev[0] === -1) prev[1]++;
      else compact.push([-1, 1]);
    } else if (onset[s] || !prev || prev[0] !== grid[s]) compact.push([grid[s], 1]);
    else prev[1]++;
  }
  // a leading rest is kept so that the bar lines stay where they are in the file
  while (compact.length && compact[compact.length - 1][0] === -1) compact.pop();
  return { compact, barLen, tracks, numerator, denominator };
}
