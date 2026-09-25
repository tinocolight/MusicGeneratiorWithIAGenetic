// Canvas "piano roll" drawn like a score strip: one row per semitone, bar lines, the
// attractor waves with their basins (shaded by the basin's influence at each distance),
// the notes of the melody and, for a canon, the follower voice.

import { midiName } from '../core/score.js';

export function themeColors(el) {
  const cs = getComputedStyle(el);
  const v = (n) => cs.getPropertyValue(n).trim();
  return {
    bg: v('--roll-bg'),
    row: v('--row'),
    grid: v('--grid'),
    gridStrong: v('--grid-strong'),
    ink: v('--ink'),
    muted: v('--muted'),
    note: v('--note'),
    follower: v('--follower'),
    voice3: v('--voice-3'),
    waves: [v('--wave-1'), v('--wave-2'), v('--wave-3'), v('--wave-4')],
    playhead: v('--accent'),
    segment: v('--segment'),
  };
}

function hexToRgb(c) {
  const m = c.replace('#', '');
  if (m.length !== 6) return [120, 120, 120];
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}

const BASIN = {
  gaussian: (d, s) => Math.exp(-(d * d) / (2 * s * s)),
  gravity: (d, s) => 1 / (1 + (d / s) ** 2),
  step: (d, s) => (d <= 0.5 * s ? 1 : d <= s ? 0.75 : d <= 1.5 * s ? 0.2 : 0),
};

/**
 * scene = {
 *   length, barLen, voices: [{events, offset, kind: 'lead'|'follower'}],
 *   waves: [{values, basin, shape}], segments: [[a, b]], key: {tonic}, playhead: step|null,
 *   label
 * }
 */
export function drawRoll(canvas, scene) {
  const colors = themeColors(canvas);
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 800;
  const cssH = canvas.clientHeight || 300;
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const { length, barLen = 16 } = scene;
  const voices = scene.voices || [];
  const pitches = [];
  for (const v of voices) for (const e of v.events) if (e.pitch !== null) pitches.push(v.map ? v.map(e.pitch) : e.pitch);
  for (const w of scene.waves || []) for (let i = 0; i < w.values.length; i += 4) pitches.push(w.values[i]);
  let lo = pitches.length ? Math.floor(Math.min(...pitches)) - 2 : 55;
  let hi = pitches.length ? Math.ceil(Math.max(...pitches)) + 2 : 84;
  if (hi - lo < 18) {
    const c = (hi + lo) / 2;
    lo = Math.floor(c - 9);
    hi = Math.ceil(c + 9);
  }
  const gutter = 34;
  const top = 16;
  const W = cssW - gutter - 6;
  const H = cssH - top - 6;
  const rowH = H / (hi - lo + 1);
  const x = (s) => gutter + (s / length) * W;
  const y = (m) => top + (hi - m) * rowH;

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, cssW, cssH);
  // semitone rows: black-key rows shaded
  for (let m = lo; m <= hi; m++) {
    const pc = ((m % 12) + 12) % 12;
    if ([1, 3, 6, 8, 10].includes(pc)) {
      ctx.fillStyle = colors.row;
      ctx.fillRect(gutter, y(m) - rowH / 2, W, rowH);
    }
    if (pc === 0 || (scene.key && pc === scene.key.tonic)) {
      ctx.fillStyle = colors.muted;
      ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(midiName(m), 2, y(m));
      ctx.strokeStyle = pc === 0 ? colors.gridStrong : colors.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gutter, Math.round(y(m) + rowH / 2) + 0.5);
      ctx.lineTo(gutter + W, Math.round(y(m) + rowH / 2) + 0.5);
      ctx.stroke();
    }
  }
  // beats and bars
  for (let s = 0; s <= length; s += 4) {
    const bar = s % barLen === 0;
    if (!bar && W / (length / 4) < 8) continue;
    ctx.strokeStyle = bar ? colors.gridStrong : colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(x(s)) + 0.5, top);
    ctx.lineTo(Math.round(x(s)) + 0.5, top + H);
    ctx.stroke();
    if (bar && s < length) {
      ctx.fillStyle = colors.muted;
      ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(String(s / barLen + 1), x(s) + 3, top - 4);
    }
  }
  // segments (analyser)
  (scene.segments || []).forEach(([a, b], i) => {
    if (i % 2 === 1) {
      ctx.fillStyle = colors.segment;
      ctx.fillRect(x(a), top, x(b) - x(a), H);
    }
    ctx.strokeStyle = colors.playhead;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x(a) + 0.5, top);
    ctx.lineTo(x(a) + 0.5, top + H);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // basins then wave curves
  (scene.waves || []).forEach((w, k) => {
    const [r, g, b] = hexToRgb(colors.waves[(w.colorIndex ?? k) % colors.waves.length]);
    const shape = BASIN[w.shape] || BASIN.gaussian;
    const s = w.basin || 3;
    // stacked bands: the accumulated opacity at distance d follows the basin's influence(d)
    const levels = 10;
    const maxD = w.shape === 'step' ? 1.5 * s : 2.5 * s;
    for (let l = levels; l >= 1; l--) {
      const d = (l / levels) * maxD;
      const inner = ((l - 1) / levels) * maxD;
      const alpha = 0.3 * (shape(inner, s) - shape(d, s));
      if (alpha <= 0.002) continue;
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
      ctx.beginPath();
      const segStart = w.start ?? 0;
      const vals = w.values;
      for (let i = 0; i < vals.length; i++) ctx.lineTo(x(segStart + i), y(vals[i] + d));
      for (let i = vals.length - 1; i >= 0; i--) ctx.lineTo(x(segStart + i), y(vals[i] - d));
      ctx.closePath();
      ctx.fill();
    }
  });
  (scene.waves || []).forEach((w, k) => {
    ctx.strokeStyle = colors.waves[(w.colorIndex ?? k) % colors.waves.length];
    ctx.lineWidth = 2;
    ctx.setLineDash(w.preview ? [6, 4] : []);
    ctx.beginPath();
    const segStart = w.start ?? 0;
    w.values.forEach((v, i) => (i ? ctx.lineTo(x(segStart + i), y(v)) : ctx.moveTo(x(segStart + i), y(v))));
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // notes (followers are drawn in their own register: `map` applies their transposition)
  for (const v of voices) {
    const follower = v.kind !== 'lead';
    ctx.fillStyle = v.kind === 'v3' ? colors.voice3 : follower ? colors.follower : colors.note;
    ctx.globalAlpha = follower ? 0.75 : 1;
    const map = v.map || ((p) => p);
    for (const e of v.events) {
      if (e.pitch === null) continue;
      const pitch = map(e.pitch);
      const s = e.start + (v.offset || 0);
      if (s >= length) continue;
      const x0 = x(s) + 0.5;
      const x1 = Math.min(x(Math.min(length, s + e.dur)), gutter + W) - 0.5;
      const h = Math.max(3, rowH * (follower ? 0.55 : 0.8));
      const yy = y(pitch) - h / 2 + (follower ? rowH * 0.18 : 0);
      roundRect(ctx, x0, yy, Math.max(2, x1 - x0), h, Math.min(3, h / 2));
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (scene.playhead !== null && scene.playhead !== undefined && scene.playhead >= 0) {
    ctx.strokeStyle = colors.playhead;
    ctx.lineWidth = 2;
    const px = x(Math.min(length, scene.playhead));
    ctx.beginPath();
    ctx.moveTo(px, top);
    ctx.lineTo(px, top + H);
    ctx.stroke();
  }
  return { lo, hi, x, y };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
