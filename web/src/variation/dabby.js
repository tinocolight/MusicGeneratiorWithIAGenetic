// Variations by chaotic mapping (Dabby 1996, "Musical variations from a chaotic mapping",
// Chaos 6(2):95-107).
//
// 1. The notes of the theme are paired, in order, with the x-coordinates of a Lorenz
//    trajectory started at (1, 1, 1): this builds a "pitch axis" over the x values.
// 2. A second trajectory is started from a slightly different initial condition
//    (Dabby used (0.999, 1, 1): a smaller x, so the first notes coincide with the theme).
// 3. Each x' of the new trajectory triggers the theme note whose x is the smallest value
//    >= x' (Dabby's mapping). Because of the sensitivity to initial conditions the variation
//    starts like the theme and departs from it progressively, re-using its material — the
//    "attractor" now drives the *form* (theme -> variation) instead of the contour.
//
// mode "pitch": only the pitch sequence is varied, the rhythm of the theme is kept;
// mode "full" : whole events (pitch + duration, rests included) are re-ordered.
// rule "ceiling": Dabby's rule (smallest x >= x'). With short themes it switches note as soon
//   as the two trajectories swap order, whatever the size of the perturbation;
// rule "nearest" (default): the theme note with the closest x. The variation then stays on
//   the theme until the chaotic separation exceeds the gap between neighbouring x values, so
//   the `divergence` control really sets how early the variation departs.

import { attractorTrajectory } from '../core/waves.js';

export function chaoticVariation(events, { divergence = 0.01, mode = 'pitch', sampleDt = 0.25, rule = 'nearest' } = {}) {
  const items = mode === 'pitch' ? events.filter((e) => e.pitch !== null) : events.slice();
  const n = items.length;
  if (n < 2) return events.map((e) => ({ ...e }));
  const ref = attractorTrajectory('lorenz', n, sampleDt, [1, 1, 1]).map((s) => s[0]);
  const order = ref.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]);
  const pick = (x) => {
    if (rule === 'nearest') {
      let best = 0;
      for (let i = 1; i < ref.length; i++) if (Math.abs(ref[i] - x) < Math.abs(ref[best] - x)) best = i;
      return best;
    }
    // smallest reference x >= x'
    let lo = 0;
    let hi = order.length - 1;
    if (x > order[hi][0]) return order[hi][1];
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (order[mid][0] >= x) hi = mid;
      else lo = mid + 1;
    }
    return order[lo][1];
  };
  const total = events.reduce((a, e) => a + e.dur, 0);

  if (mode === 'pitch') {
    const traj = attractorTrajectory('lorenz', n, sampleDt, [1 - divergence, 1, 1]).map((s) => s[0]);
    const pitches = traj.map((x) => items[pick(x)].pitch);
    let k = 0;
    return events.map((e) => (e.pitch === null ? { ...e } : { ...e, pitch: pitches[k++] }));
  }

  // full mode: generate events until the length of the theme is filled
  const traj = attractorTrajectory('lorenz', n * 3, sampleDt, [1 - divergence, 1, 1]).map((s) => s[0]);
  const out = [];
  let t = 0;
  for (const x of traj) {
    if (t >= total) break;
    const src = items[pick(x)];
    const dur = Math.min(src.dur, total - t);
    const prev = out[out.length - 1];
    if (src.pitch === null && prev && prev.pitch === null) prev.dur += dur;
    else out.push({ pitch: src.pitch, start: t, dur });
    t += dur;
  }
  return out;
}

/** Fraction of theme notes kept at the same position and pitch (1 = identical). */
export function similarityToTheme(theme, variation) {
  const a = new Map(theme.filter((e) => e.pitch !== null).map((e) => [e.start, e.pitch]));
  const vs = variation.filter((e) => e.pitch !== null);
  let same = 0;
  for (const e of vs) if (a.get(e.start) === e.pitch) same++;
  return vs.length ? same / Math.max(vs.length, a.size) : 0;
}

/** First note index where the variation departs from the theme. */
export function divergencePoint(theme, variation) {
  const a = theme.filter((e) => e.pitch !== null);
  const b = variation.filter((e) => e.pitch !== null);
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i].pitch !== b[i].pitch || a[i].start !== b[i].start) return i;
  }
  return Math.min(a.length, b.length);
}
