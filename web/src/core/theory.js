// Music-theory helpers: the original scale table plus the literature models used by
// the attractor-field fitness (Krumhansl-Kessler key profiles, Lerdahl's basic space
// and melodic attraction).

// Same table (and order) as ConfigurationValues.chromosome_possible_scales.
//            C   C#  D   D#  E   F   F#  G   G#  A   A#  B
export const SCALE_TABLE = [
  [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1], // C  / Am
  [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1], // G  / Em
  [0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1], // D  / Bm
  [0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1], // A  / F#m
  [0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1], // E  / C#m
  [0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1], // B  / G#m
  [0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1], // F# / D#m
  [1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0], // Db / Bbm
  [1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0], // Ab / Fm
  [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0], // Eb / Cm
  [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0], // Bb / Gm
  [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0], // F  / Dm
].map((row) => row.map(Boolean));

export const MAJOR_TONICS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
export const SCALE_LABELS = ['C / Am', 'G / Em', 'D / Bm', 'A / F#m', 'E / C#m', 'B / G#m',
  'F# / D#m', 'Db / Bbm', 'Ab / Fm', 'Eb / Cm', 'Bb / Gm', 'F / Dm'];

// Krumhansl & Kessler (1982) probe-tone profiles.
export const KK_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
export const KK_MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

const mod12 = (x) => ((x % 12) + 12) % 12;

/** Key description from the original (scaleIndex, major/minor) pair. */
export function keyFromScale(scaleIndex, major) {
  const majorTonic = MAJOR_TONICS[scaleIndex];
  const tonic = major ? majorTonic : mod12(majorTonic + 9);
  return makeKey(tonic, major ? 'major' : 'minor');
}

export function makeKey(tonic, mode) {
  const major = mode === 'major';
  const steps = major ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10];
  const diatonic = new Array(12).fill(false);
  steps.forEach((s) => (diatonic[mod12(tonic + s)] = true));
  if (!major) diatonic[mod12(tonic + 11)] = true; // raised leading tone is idiomatic in minor
  const third = major ? 4 : 3;
  // Lerdahl's (2001) basic space: octave(root) / fifth / triad / diatonic / chromatic.
  const anchoring = new Array(12).fill(1);
  for (let pc = 0; pc < 12; pc++) {
    const iv = mod12(pc - tonic);
    if (iv === 0) anchoring[pc] = 5;
    else if (iv === 7) anchoring[pc] = 4;
    else if (iv === third) anchoring[pc] = 3;
    else if (diatonic[pc]) anchoring[pc] = 2;
  }
  const prof = major ? KK_MAJOR : KK_MINOR;
  const sum = prof.reduce((a, b) => a + b, 0);
  const profile = new Array(12);
  for (let pc = 0; pc < 12; pc++) profile[pc] = prof[mod12(pc - tonic)] / sum;
  return { tonic, mode, major, diatonic, anchoring, profile };
}

export const pitchClass = (midi) => mod12(midi);
export const inKey = (midi, key) => key.diatonic[mod12(midi)];
/** Chord-tone of the tonic triad? (anchoring >= 3) */
export const isStable = (midi, key) => key.anchoring[mod12(midi)] >= 3;

/**
 * Lerdahl's melodic attraction of pitch p1 towards p2:  a = (s2 / s1) * 1 / n^2,
 * s = anchoring strength in the basic space, n = distance in semitones.
 */
export function melodicAttraction(p1, p2, key) {
  const n = Math.abs(p2 - p1);
  if (n === 0) return 0;
  return (key.anchoring[mod12(p2)] / key.anchoring[mod12(p1)]) / (n * n);
}

/** Nearest pitch (in semitones) with anchoring >= 3 (a tonic-triad member). */
export function nearestStable(midi, key) {
  for (let d = 0; d <= 6; d++) {
    if (isStable(midi - d, key)) return midi - d;
    if (isStable(midi + d, key)) return midi + d;
  }
  return midi;
}

/** Key-finding by correlation with the KK profiles (Krumhansl-Schmuckler). */
export function estimateKey(midis, durations = null) {
  const hist = new Array(12).fill(0);
  midis.forEach((m, i) => (hist[mod12(m)] += durations ? durations[i] : 1));
  let best = null;
  for (const mode of ['major', 'minor']) {
    const prof = mode === 'major' ? KK_MAJOR : KK_MINOR;
    for (let t = 0; t < 12; t++) {
      const rotated = hist.map((_, pc) => prof[mod12(pc - t)]);
      const r = pearson(hist, rotated);
      if (!best || r > best.r) best = { tonic: t, mode, r };
    }
  }
  return { ...makeKey(best.tonic, best.mode), r: best.r };
}

export function pearson(a, b) {
  const n = a.length;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < n; i++) {
    ma += a[i];
    mb += b[i];
  }
  ma /= n;
  mb /= n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}
