// Attractor waves: target curves that pull the melody (pitch over time).
//
// The original work (Luz & Silva) used pure sinusoids — a *limit cycle*: perfectly
// periodic, so every period is identical. The extra families below come from the
// literature on melodic contour and on non-linear dynamics in composition:
//
//   sine    – original formulation (NoteAtractionFunction in AlgorithmFitness.cs)
//   arch    – phrase arch; the convex contour is the most frequent phrase shape in
//             Western folksongs (Huron 1996, "The melodic arch in Western folksongs")
//   pink    – 1/f fluctuation; pitch fluctuations in music have ~1/f spectra
//             (Voss & Clarke 1975), generated with the Voss dice algorithm
//   rossler – x(t) of the Rössler strange attractor: a quasi-periodic oscillation whose
//             amplitude and period never repeat exactly (Pressing 1988; Bidlack 1992)
//   lorenz  – x(t) of the Lorenz attractor: oscillation around two lobes with
//             irregular switching, i.e. two registers ("voices") (Dabby 1996)
//
// Every generator returns a Float64Array of `length` values in the same unit as `mean`
// (MIDI in the attractor-field fitness, genes in the classic fitness).

export const WAVE_TYPES = ['sine', 'arch', 'pink', 'rossler', 'lorenz'];

export function makeWave(spec, length, stepsPerBar, rng) {
  switch (spec.type) {
    case 'sine':
      return sineWave(length, stepsPerBar, spec);
    case 'arch':
      return archWave(length, stepsPerBar, spec);
    case 'pink':
      return pinkWave(length, stepsPerBar, spec, rng);
    case 'rossler':
    case 'lorenz':
      return strangeWave(length, stepsPerBar, spec, rng);
    default:
      throw new Error(`unknown wave type ${spec.type}`);
  }
}

/** mean + A sin(2*pi*i/period + shift), period = stepsPerBar / periodsPerBar. */
export function sineWave(length, stepsPerBar, { periodsPerBar = 0.5, amplitude = 12, mean = 0, shift = 0 }) {
  const period = stepsPerBar / periodsPerBar;
  const phase = (2 * Math.PI * shift) / stepsPerBar;
  const w = new Float64Array(length);
  for (let i = 0; i < length; i++) w[i] = mean + amplitude * Math.sin((2 * Math.PI * i) / period + phase);
  return w;
}

/**
 * Integer sine exactly as the C# NoteAtractionFunction (value cast with (int)).
 * `shift` is the horizontal shift in steps (the GUI's "Wave Horizontal Shift").
 */
export function classicSine(length, stepsPerBar, periodsPerBar, amplitude, mean, shift = 0) {
  const w = sineWave(length, stepsPerBar, { periodsPerBar, amplitude, mean, shift });
  return Int32Array.from(w, Math.trunc);
}

/**
 * Phrase arch: rises from (mean - A/2) to a climax at `peakAt` of the phrase and falls
 * back, ending `descent` semitones lower than it started (final cadence).
 */
export function archWave(length, stepsPerBar, { phraseBars = 2, amplitude = 7, mean = 0, peakAt = 0.62, descent = 2, shift = 0 }) {
  const phrase = Math.max(1, Math.round(phraseBars * stepsPerBar));
  const w = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    const t = (((i + shift) % phrase) + phrase) % phrase / phrase;
    const u = t < peakAt ? 0.5 * (t / peakAt) : 0.5 + 0.5 * ((t - peakAt) / (1 - peakAt));
    const hump = Math.sin(Math.PI * u);
    w[i] = mean - amplitude / 2 + amplitude * hump - descent * t;
  }
  return w;
}

/**
 * 1/f ("pink") wave with the Voss-McCartney dice algorithm: `rows` random generators,
 * row k re-drawn every 2^k samples; the sum has an approximately 1/f spectrum.
 * One sample per `resolution` steps, linearly interpolated.
 */
export function pinkWave(length, stepsPerBar, { amplitude = 9, mean = 0, rows = 5, resolution = 2 }, rng) {
  const n = Math.ceil(length / resolution) + 2;
  const vals = new Array(rows).fill(0).map(() => rng.float() * 2 - 1);
  const samples = new Float64Array(n);
  for (let s = 0; s < n; s++) {
    for (let k = 0; k < rows; k++) if (s % (1 << k) === 0) vals[k] = rng.float() * 2 - 1;
    samples[s] = vals.reduce((a, b) => a + b, 0);
  }
  return rescale(interpolate(samples, length, resolution), mean, amplitude);
}

// Lorenz: sigma=10, rho=28, beta=8/3 ; Rössler: a=b=0.2, c=5.7 (classic chaotic regimes)
const SYSTEMS = {
  lorenz: {
    f: ([x, y, z]) => [10 * (y - x), x * (28 - z) - y, x * y - (8 / 3) * z],
    period: 0.75, // mean time of one oscillation around a lobe
    start: [1, 1, 1],
  },
  rossler: {
    f: ([x, y, z]) => [-y - z, x + 0.2 * y, 0.2 + z * (x - 5.7)],
    period: 6.07,
    start: [1, 1, 0],
  },
};

function rk4(f, s, dt) {
  const k1 = f(s);
  const k2 = f(s.map((v, i) => v + (dt / 2) * k1[i]));
  const k3 = f(s.map((v, i) => v + (dt / 2) * k2[i]));
  const k4 = f(s.map((v, i) => v + dt * k3[i]));
  return s.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

/**
 * Trajectory of a strange attractor sampled every `sampleDt` time units.
 * Returns an array of [x, y, z] states. Used by the waves and by Dabby's variations.
 */
export function attractorTrajectory(system, count, sampleDt, start = null, warmup = 0) {
  const sys = SYSTEMS[system];
  let s = (start ?? sys.start).slice();
  const h = Math.min(0.01, sampleDt / 4);
  const substeps = Math.max(1, Math.round(sampleDt / h));
  const dt = sampleDt / substeps;
  for (let i = 0; i < warmup; i++) s = rk4(sys.f, s, 0.01);
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(s);
    for (let k = 0; k < substeps; k++) s = rk4(sys.f, s, dt);
  }
  return out;
}

export function strangeWave(length, stepsPerBar, { type, amplitude = 10, mean = 0, periodsPerBar = 0.5, warmup = 1500 }, rng) {
  const sys = SYSTEMS[type];
  const sampleDt = (sys.period * periodsPerBar) / stepsPerBar;
  // random point near the attractor's usual start, then a transient so we sit on the attractor
  const start = sys.start.map((v) => v + (rng ? rng.float() * 2 - 1 : 0));
  const traj = attractorTrajectory(type, length, sampleDt, start, warmup + (rng ? rng.int(0, 500) : 0));
  return rescale(Float64Array.from(traj, (s) => s[0]), mean, amplitude);
}

function interpolate(samples, length, resolution) {
  const out = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    const x = i / resolution;
    const k = Math.floor(x);
    const f = x - k;
    out[i] = samples[k] * (1 - f) + samples[Math.min(k + 1, samples.length - 1)] * f;
  }
  return out;
}

/** Affine map of a series onto [mean - amplitude, mean + amplitude]. */
function rescale(series, mean, amplitude) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of series) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const span = hi - lo || 1;
  return series.map((v) => mean + amplitude * (2 * (v - lo) / span - 1));
}
