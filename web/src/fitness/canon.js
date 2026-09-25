// Canon ("self-harmonisation"): the melody must sound good against itself delayed by
// whole bars, so several players can read the same part, each one starting x bars later —
// as in Telemann's "XIIX Canons mélodieux" (Sonates en canon, TWV 40:118-123, 1738) or in
// rounds such as "Frère Jacques". Each voice may also play the part transposed (an octave
// lower for a cello, a diatonic fifth below for a canon at the fifth).
//
// The original rules ScoreMSelfHarmonizationPreviousMeasures (distance 1 and 2 bars) aimed
// at this, but (a) they compare *genes*, so when the other voice is holding a note the
// "interval" is computed against the code 74 (or 0 for a rest), (b) they reward perfect
// fourths (+2) and penalise sixths (-0.5), the opposite of two-voice counterpoint practice,
// and (c) they ignore parallel fifths/octaves and dissonance treatment.
//
// This analysis uses the sounding pitch of every voice at every 16th and the rules of
// two-voice counterpoint (Fux 1725, as derived perceptually by Huron 2001, "Tone and Voice"),
// applied to every pair of voices:
//   * imperfect consonances (3rds, 6ths, 10ths) are best; 5ths/8ves good but not in parallel;
//     unisons fuse the voices (Huron's tonal fusion) and are only welcome occasionally;
//   * the perfect 4th counts as a (mild) dissonance in two voices;
//   * dissonances are acceptable on weak positions when they are passing notes (entered and
//     left by step) and on strong positions only as suspensions (held note resolving down by
//     step);
//   * parallel perfect consonances are penalised; contrary / oblique motion rewarded;
//   * rhythmic complementarity (one voice moves while the other holds) helps independence.
// With three voices, complete triads on strong beats are rewarded, and every voice is
// checked against the range of its instrument.

const IMPERFECT = new Set([3, 4, 8, 9]);

export function metricWeightFor(step, barLen) {
  const p = step % barLen;
  if (p === 0) return 1;
  if (barLen === 12) return p === 6 ? 0.8 : p % 2 === 0 ? 0.4 : 0.2; // 6/8
  if (barLen === 24) return p === 12 ? 0.85 : p % 4 === 0 ? 0.7 : p % 2 === 0 ? 0.4 : 0.2; // 6/4
  if (barLen === 6) return p % 2 === 0 ? 0.45 : 0.2; // 3/8: one beat per bar
  if (p === barLen / 2) return 0.85;
  if (p % 4 === 0) return 0.7;
  if (p % 2 === 0) return 0.4;
  return 0.2;
}

export function intervalQuality(iv) {
  const a = Math.abs(iv);
  const ic = a % 12;
  if (a === 0) return { kind: 'unison', value: 0.15 };
  if (ic === 0) return { kind: 'perfect', value: 0.55 };
  if (ic === 7) return { kind: 'perfect', value: 0.65 };
  if (IMPERFECT.has(ic)) return { kind: 'imperfect', value: 1 };
  if (ic === 5) return { kind: 'fourth', value: -0.35 };
  return { kind: 'dissonant', value: -1 };
}

// ------------------------------------------------------------------ voice transformations

export const INTERVALS = {
  unison: { label: 'Uníssono', semitones: 0 },
  octaveUp: { label: '8.ª acima', semitones: 12 },
  octaveDown: { label: '8.ª abaixo', semitones: -12 },
  twoOctavesDown: { label: '2 oitavas abaixo', semitones: -24 },
  fifthDown: { label: '5.ª abaixo (diatónica)', degrees: -4 },
  fifthUp: { label: '5.ª acima (diatónica)', degrees: 4 },
  fourthDown: { label: '4.ª abaixo (diatónica)', degrees: -3 },
};

/** Pitch map of a voice: chromatic transposition, or diatonic (degrees inside the key). */
export function intervalMap(name, key) {
  const iv = INTERVALS[name] ?? INTERVALS.unison;
  if (iv.degrees === undefined) {
    const s = iv.semitones;
    return s === 0 ? (p) => p : (p) => p + s;
  }
  const dir = Math.sign(iv.degrees);
  const steps = Math.abs(iv.degrees);
  const inKey = (m) => key.diatonic[((m % 12) + 12) % 12];
  return (p) => {
    if (!inKey(p)) return p + (dir > 0 ? 7 : -7); // chromatic note: a plain perfect fifth
    let m = p;
    for (let k = 0; k < steps; k++) {
      m += dir;
      while (!inKey(m)) m += dir;
    }
    return m;
  };
}

// ------------------------------------------------------------------ one pair of voices

/**
 * Counterpoint between two voices that play the same line.
 * @param line {pitch: (number|null)[], onset: boolean[]} of the melody (n steps)
 * @param a, b {delay (steps), map (pitch => pitch)}
 * @param opts {circular (round), barLen, end (absolute step where the analysis stops)}
 */
export function analyzePair(line, a, b, { circular = false, barLen = 16, end = null } = {}) {
  const n = line.pitch.length;
  const mapA = a.map || ((p) => p);
  const mapB = b.map || ((p) => p);
  const voice = (v, map) => (t) => {
    let s = t - v.delay;
    if (circular) s = ((s % n) + n) % n;
    else if (s < 0 || s >= n) return { p: null, on: false };
    const p = line.pitch[s];
    return { p: p === null ? null : map(p), on: line.onset[s] };
  };
  const A = voice(a, mapA);
  const B = voice(b, mapB);
  const start = circular ? 0 : Math.max(a.delay, b.delay);
  let stop = circular ? n : Math.min(a.delay, b.delay) + n;
  if (end !== null) stop = Math.min(stop, end);

  let wSum = 0;
  let cSum = 0;
  let strongTotal = 0;
  let strongConsonant = 0;
  let both = 0;
  let unisons = 0;
  let parallels = 0;
  let moves = 0;
  let contrary = 0;
  let oblique = 0;
  let onsetsBoth = 0;
  let onsetsOne = 0;
  let prev = null;

  for (let t = start; t < stop; t++) {
    const x = A(t);
    const y = B(t);
    if (x.on && y.on) onsetsBoth++;
    else if (x.on || y.on) onsetsOne++;
    if (x.p === null || y.p === null) {
      prev = null;
      continue;
    }
    both++;
    const iv = x.p - y.p;
    const q = intervalQuality(iv);
    const w = metricWeightFor(t, barLen);
    let value = q.value;
    if (q.kind === 'unison') unisons++;

    if ((q.kind === 'dissonant' || q.kind === 'fourth') && x.on !== y.on) {
      const mover = x.on ? A : B;
      const held = x.on ? B : A;
      if (w <= 0.4) {
        // passing / neighbour note on a weak position: entered by step
        const prevP = previousPitch(mover, t);
        const curP = mover(t).p;
        if (prevP !== null && Math.abs(curP - prevP) <= 2) value = 0.1;
      } else {
        // suspension: the *held* voice is dissonant and must resolve down by step
        const heldP = held(t).p;
        const next = nextPitchChange(held, t, stop);
        if (next !== null && heldP - next >= 1 && heldP - next <= 2) value = 0.4;
      }
    }

    if (w >= 0.7) {
      strongTotal++;
      if (q.kind === 'imperfect' || q.kind === 'perfect' || q.kind === 'unison') strongConsonant++;
    }

    if (prev && (x.on || y.on)) {
      const dA = x.p - prev.a;
      const dB = y.p - prev.b;
      if (dA !== 0 && dB !== 0) {
        moves++;
        if (Math.sign(dA) !== Math.sign(dB)) contrary++;
        const pq = intervalQuality(prev.a - prev.b);
        if ((pq.kind === 'perfect' || pq.kind === 'unison') && (q.kind === 'perfect' || q.kind === 'unison')
            && Math.abs(prev.a - prev.b) % 12 === Math.abs(iv) % 12 && Math.sign(dA) === Math.sign(dB)) {
          parallels++;
          value -= 1;
        }
      } else if (dA !== 0 || dB !== 0) oblique++;
    }
    wSum += w;
    cSum += w * value;
    prev = { a: x.p, b: y.p };
  }

  // activity: share of beats in which at least one of the two voices starts a note
  let beats = 0;
  let activeBeats = 0;
  const beat = barLen === 12 || barLen === 6 ? 6 : 4;
  for (let s = start; s + beat <= stop; s += beat) {
    beats++;
    for (let k = s; k < s + beat; k++) {
      if (A(k).on || B(k).on) {
        activeBeats++;
        break;
      }
    }
  }
  const activity = beats ? activeBeats / beats : 0;
  const overlap = Math.max(1, stop - start);
  const consonance = wSum ? cSum / wSum : -1;
  const unisonRatio = both ? unisons / both : 0;
  const contraryRatio = moves ? contrary / moves : 0;
  const obliqueRatio = moves + oblique ? oblique / (moves + oblique) : 0;
  const complementarity = onsetsBoth + onsetsOne ? onsetsOne / (onsetsBoth + onsetsOne) : 0;
  const bars = overlap / barLen;
  const score = consonance
    - 0.25 * Math.max(0, unisonRatio - 0.08) * 4
    - 0.15 * (parallels / Math.max(1, bars))
    + 0.15 * (contraryRatio + obliqueRatio - 0.5)
    + 0.1 * (complementarity - 0.5)
    - 0.5 * Math.max(0, 0.6 - both / overlap) // both voices should actually sound
    - 1.5 * Math.max(0, 0.9 - activity); // and keep moving (no long static chords)
  return {
    score,
    consonance,
    strongConsonance: strongTotal ? strongConsonant / strongTotal : 0,
    parallels,
    parallelsPerBar: parallels / Math.max(1, bars),
    unisonRatio,
    contraryRatio,
    obliqueRatio,
    complementarity,
    coverage: both / overlap,
    activity,
  };
}

/** Two voices, the second `delay` steps later and `transpose` semitones away (leader = voice 1). */
export function analyzeCanon(line, { delay, transpose = 0, circular = false, barLen = 16, end = null }) {
  return analyzePair(line, { delay: 0 }, { delay, map: (p) => p + transpose }, { circular, barLen, end });
}

// ------------------------------------------------------------------ whole ensemble

const TRIADS = [[0, 4, 7], [0, 3, 7]]; // major, minor (root position sets, any inversion)

function isTriad(pcs) {
  const set = [...new Set(pcs.map((p) => ((p % 12) + 12) % 12))];
  if (set.length !== 3) return false;
  return set.some((root) => TRIADS.some((tr) => tr.every((iv) => set.includes((root + iv) % 12))));
}

/**
 * All voices of the canon, including the leader.
 * @param voices [{delay (steps), map, range: [lo, hi]}] — voices[0] is the leader (delay 0)
 * @returns {score, pairs, strongConsonance, parallels, parallelsPerBar, unisonRatio, contraryRatio,
 *           triadRatio, outOfRange}
 */
export function analyzeEnsemble(line, voices, { circular = false, barLen = 16, end = null } = {}) {
  const pairs = [];
  for (let i = 0; i < voices.length; i++) {
    for (let j = i + 1; j < voices.length; j++) {
      pairs.push({ i, j, ...analyzePair(line, voices[i], voices[j], { circular, barLen, end }) });
    }
  }
  const n = line.pitch.length;
  const avg = (k) => pairs.reduce((a, p) => a + p[k], 0) / Math.max(1, pairs.length);

  // instrument ranges: share of notes a voice cannot play
  let notes = 0;
  let outside = 0;
  for (const v of voices) {
    if (!v.range) continue;
    const map = v.map || ((p) => p);
    for (let s = 0; s < n; s++) {
      if (!line.onset[s]) continue;
      notes++;
      const p = map(line.pitch[s]);
      if (p < v.range[0] || p > v.range[1]) outside++;
    }
  }
  const outOfRange = notes ? outside / notes : 0;

  // three or more voices: complete triads on the beats where every voice sounds
  let triadRatio = 0;
  if (voices.length >= 3) {
    let full = 0;
    let triads = 0;
    const lastDelay = Math.max(...voices.map((v) => v.delay));
    const stop = Math.min(end ?? Infinity, circular ? n : n);
    for (let t = circular ? 0 : lastDelay; t < stop; t += 4) {
      if (metricWeightFor(t, barLen) < 0.7) continue;
      const ps = [];
      for (const v of voices) {
        let s = t - v.delay;
        if (circular) s = ((s % n) + n) % n;
        if (s < 0 || s >= n || line.pitch[s] === null) break;
        ps.push((v.map || ((p) => p))(line.pitch[s]));
      }
      if (ps.length !== voices.length) continue;
      full++;
      if (isTriad(ps)) triads++;
    }
    triadRatio = full ? triads / full : 0;
  }

  const score = avg('score') + (voices.length >= 3 ? 0.3 * triadRatio : 0) - 3 * outOfRange;
  return {
    score,
    pairs,
    strongConsonance: avg('strongConsonance'),
    parallels: pairs.reduce((a, p) => a + p.parallels, 0),
    parallelsPerBar: avg('parallelsPerBar'),
    unisonRatio: avg('unisonRatio'),
    contraryRatio: avg('contraryRatio'),
    triadRatio,
    outOfRange,
  };
}

function previousPitch(voice, t) {
  const cur = voice(t).p;
  for (let k = t - 1; k >= 0; k--) {
    const p = voice(k).p;
    if (p !== null && p !== cur) return p;
  }
  return null;
}

function nextPitchChange(voice, t, stop) {
  const cur = voice(t).p;
  for (let k = t + 1; k < stop; k++) {
    const p = voice(k).p;
    if (p === null) return null;
    if (p !== cur) return p;
  }
  return null;
}
