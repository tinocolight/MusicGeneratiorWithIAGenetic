// Small canvas charts: evolution curve, contour spectrum, MAP-Elites map.

import { themeColors } from './pianoroll.js';

function setup(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 300;
  const h = canvas.clientHeight || 160;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h, colors: themeColors(canvas) };
}

function niceTicks(lo, hi, n = 4) {
  const span = hi - lo || 1;
  const step0 = span / n;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) || step0;
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

const fmt = (v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(1));

/** series: [{points: [[x, y]], color, width, dash}] */
export function lineChart(canvas, series, { xLabel = '', yLabel = '' } = {}) {
  const { ctx, w, h, colors } = setup(canvas);
  const pts = series.flatMap((s) => s.points).filter((p) => Number.isFinite(p[1]));
  if (!pts.length) return;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  let y0 = Math.min(...ys);
  let y1 = Math.max(...ys);
  if (y1 - y0 < 1e-9) {
    y0 -= 1;
    y1 += 1;
  }
  const pad = { l: 40, r: 10, t: 10, b: 22 };
  const X = (v) => pad.l + ((v - Math.min(...xs)) / (Math.max(...xs) - Math.min(...xs) || 1)) * (w - pad.l - pad.r);
  const Y = (v) => h - pad.b - ((v - y0) / (y1 - y0)) * (h - pad.t - pad.b);
  ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
  ctx.fillStyle = colors.muted;
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  for (const t of niceTicks(y0, y1)) {
    ctx.beginPath();
    ctx.moveTo(pad.l, Math.round(Y(t)) + 0.5);
    ctx.lineTo(w - pad.r, Math.round(Y(t)) + 0.5);
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(fmt(t), pad.l - 4, Y(t));
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if (xLabel) ctx.fillText(xLabel, pad.l, h - 6);
  if (yLabel) ctx.fillText(yLabel, pad.l + 4, pad.t + 8);
  for (const s of series) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width || 2;
    ctx.setLineDash(s.dash || []);
    ctx.beginPath();
    s.points.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))));
    ctx.stroke();
    ctx.setLineDash([]);
    const last = s.points[s.points.length - 1];
    if (last) {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(X(last[0]), Y(last[1]), 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

/** Amplitude spectrum of the pitch contour; bars above the permutation threshold are coloured. */
export function spectrumChart(canvas, spectrum, threshold, marks = []) {
  const { ctx, w, h, colors } = setup(canvas);
  if (!spectrum.length) return;
  const pad = { l: 34, r: 8, t: 10, b: 24 };
  const maxF = Math.min(4, spectrum[spectrum.length - 1].freq);
  const data = spectrum.filter((s) => s.freq <= maxF + 1e-9);
  const maxA = Math.max(threshold || 0, ...data.map((s) => s.amplitude)) * 1.1 || 1;
  // log-frequency axis (cycles per bar)
  const f0 = data[0].freq;
  const X = (f) => pad.l + (Math.log(f / f0) / Math.log(maxF / f0 || 2)) * (w - pad.l - pad.r);
  const Y = (a) => h - pad.b - (a / maxA) * (h - pad.t - pad.b);
  ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
  ctx.fillStyle = colors.muted;
  ctx.textAlign = 'center';
  for (const f of [0.125, 0.25, 0.5, 1, 2, 4]) {
    if (f < f0 * 0.99 || f > maxF * 1.01) continue;
    ctx.fillText(f < 1 ? `1/${1 / f}` : String(f), X(f), h - 8);
    ctx.strokeStyle = colors.grid;
    ctx.beginPath();
    ctx.moveTo(Math.round(X(f)) + 0.5, pad.t);
    ctx.lineTo(Math.round(X(f)) + 0.5, h - pad.b);
    ctx.stroke();
  }
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const t of niceTicks(0, maxA, 3)) ctx.fillText(t.toFixed(1), pad.l - 4, Y(t));
  const bw = Math.max(2, (w - pad.l - pad.r) / data.length / 1.6);
  for (const s of data) {
    ctx.fillStyle = threshold && s.amplitude > threshold ? colors.playhead : colors.gridStrong;
    ctx.fillRect(X(s.freq) - bw / 2, Y(s.amplitude), bw, h - pad.b - Y(s.amplitude));
  }
  if (threshold) {
    ctx.strokeStyle = colors.muted;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pad.l, Y(threshold));
    ctx.lineTo(w - pad.r, Y(threshold));
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // marks: fitted wave frequencies, coloured like the waves (lowest = 1st colour, highest = 2nd)
  marks.forEach((m) => {
    ctx.strokeStyle = colors.waves[m.colorIndex % colors.waves.length];
    ctx.lineWidth = 2;
    const f = Math.max(f0, Math.min(maxF, m.freq));
    ctx.beginPath();
    ctx.moveTo(X(f), pad.t);
    ctx.lineTo(X(f), h - pad.b);
    ctx.stroke();
  });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = colors.muted;
  ctx.fillText('ciclos por compasso', pad.l, pad.t + 2);
}

/** MAP-Elites map: colour = fitness (sequential scale), empty cells hatched. */
export function eliteMap(canvas, archive, selected = -1) {
  const { ctx, w, h, colors } = setup(canvas);
  const { bins, cells } = archive;
  const pad = { l: 8, r: 8, t: 8, b: 8 };
  const cw = (w - pad.l - pad.r) / bins;
  const ch = (h - pad.t - pad.b) / bins;
  const vals = cells.filter(Boolean).map((c) => c.fitness);
  const lo = vals.length ? Math.min(...vals) : 0;
  const hi = vals.length ? Math.max(...vals) : 1;
  const [r1, g1, b1] = hex(colors.waves[2] || '#888888');
  const [r2, g2, b2] = hex(colors.playhead || '#1d3f6e');
  for (let row = 0; row < bins; row++) {
    for (let col = 0; col < bins; col++) {
      const c = cells[row * bins + col];
      const x = pad.l + col * cw;
      const y = h - pad.b - (row + 1) * ch;
      if (!c) {
        ctx.strokeStyle = colors.grid;
        ctx.strokeRect(x + 2.5, y + 2.5, cw - 5, ch - 5);
        continue;
      }
      const t = hi > lo ? (c.fitness - lo) / (hi - lo) : 1;
      const mix = (a, b) => Math.round(a + (b - a) * t);
      ctx.fillStyle = `rgb(${mix(r1, r2)},${mix(g1, g2)},${mix(b1, b2)})`;
      ctx.globalAlpha = 0.35 + 0.65 * t;
      ctx.fillRect(x + 2, y + 2, cw - 4, ch - 4);
      ctx.globalAlpha = 1;
      if (row * bins + col === selected) {
        ctx.strokeStyle = colors.ink;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, cw - 2, ch - 2);
        ctx.lineWidth = 1;
      }
    }
  }
  return { cellAt: (px, py) => {
    const col = Math.floor((px - pad.l) / cw);
    const row = Math.floor((h - pad.b - py) / ch);
    if (col < 0 || row < 0 || col >= bins || row >= bins) return -1;
    return row * bins + col;
  } };
}

function hex(c) {
  const m = (c || '').replace('#', '');
  if (m.length !== 6) return [128, 128, 128];
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}
