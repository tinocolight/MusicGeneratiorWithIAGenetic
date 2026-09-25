// Canon ("self-harmonisation"): the melody must sound good against itself delayed by
// `delay` steps, so two players can read the same part, the second one starting x bars
// later — as in Telemann's "XIIX Canons mélodieux" (Sonates en canon, TWV 40:118-123, 1738)
// or in rounds such as "Frère Jacques".
//
// The original rules ScoreMSelfHarmonizationPreviousMeasures (distance 1 and 2 bars) aimed
// at this, but (a) they compare *genes*, so when the other voice is holding a note the
// "interval" is computed against the code 74 (or 0 for a rest), (b) they reward perfect
// fourths (+2) and penalise sixths (-0.5), the opposite of two-voice counterpoint practice,
// and (c) they ignore parallel fifths/octaves and dissonance treatment.
//
// This analysis uses the sounding pitch of both voices at every 16th and the rules of
// two-voice counterpoint (Fux 1725, as derived perceptually by Huron 2001, "Tone and Voice"):
//   * imperfect consonances (3rds, 6ths, 10ths) are best; 5ths/8ves good but not in parallel;
//     unisons fuse the voices (Huron's tonal fusion) and are only welcome occasionally;
//   * the perfect 4th counts as a (mild) dissonance in two voices;
//   * dissonances are acceptable on weak positions when they are passing notes (entered and
//     left by step) and on strong positions only as suspensions (held note resolving down by
//     step);
//   * parallel perfect consonances are penalised; contrary / oblique motion rewarded;
//   * rhythmic complementarity (one voice moves while the other holds) helps independence.

const IMPERFECT = new Set([3, 4, 8, 9]);

export function metricWeightFor(step, barLen) {
  const p = step % barLen;
  if (p === 0) return 1;
  if (barLen === 12) return p === 6 ? 0.8 : p % 2 === 0 ? 0.4 : 0.2; // 6/8
  if (barLen === 24) return p === 12 ? 0.85 : p % 4 === 0 ? 0.7 : p % 2 === 0 ? 0.4 : 0.2; // 6/4
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

/**
 * @param line {pitch: (number|null)[], onset: boolean[]} of the melody
 * @param opts {delay (steps), transpose (semitones for the follower), circular (round: the
 *   leader wraps around), barLen, end (last analysed step, e.g. where the follower stops)}
 */
export function analyzeCanon(line, { delay, transpose = 0, circular = false, barLen = 16, end = null }) {
  const n = end ?? line.pitch.length;
  const follower = (t) => {
    let s = t - delay;
    if (s < 0) {
      if (!circular) return { p: null, on: false };
      s += n;
    }
    const p = line.pitch[s];
    return { p: p === null ? null : p + transpose, on: line.onset[s] };
  };

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
  const start = circular ? 0 : delay;

  for (let t = start; t < n; t++) {
    const L = line.pitch[t];
    const lOn = line.onset[t];
    const f = follower(t);
    if (lOn && f.on) onsetsBoth++;
    else if (lOn || f.on) onsetsOne++;
    if (L === null || f.p === null) {
      prev = null;
      continue;
    }
    both++;
    const iv = L - f.p;
    const q = intervalQuality(iv);
    const w = metricWeightFor(t, barLen);
    let value = q.value;
    if (q.kind === 'unison') unisons++;

    if (q.kind === 'dissonant' || q.kind === 'fourth') {
      // which voice just moved into the dissonance?
      const movedL = lOn;
      const movedF = f.on;
      if (w <= 0.4 && (movedL !== movedF)) {
        // passing / neighbour note on a weak position: entered by step
        const mover = movedL ? line.pitch : null;
        const prevP = movedL ? prevPitch(line.pitch, t) : prevPitchFollower(follower, t);
        const curP = movedL ? L : f.p;
        if (prevP !== null && Math.abs(curP - prevP) <= 2) value = 0.1;
        void mover;
      } else if (w > 0.4 && (movedL !== movedF)) {
        // suspension: the *held* voice is dissonant and must resolve down by step
        const heldIsL = !movedL;
        const nextHeld = nextPitchChange(heldIsL ? (k) => line.pitch[k] : (k) => follower(k).p, t, n);
        const heldP = heldIsL ? L : f.p;
        if (nextHeld !== null && heldP - nextHeld >= 1 && heldP - nextHeld <= 2) value = 0.4;
      }
    }

    if (w >= 0.7) {
      strongTotal++;
      if (q.kind === 'imperfect' || q.kind === 'perfect' || q.kind === 'unison') strongConsonant++;
    }

    if (prev && (lOn || f.on)) {
      const dL = L - prev.L;
      const dF = f.p - prev.F;
      if (dL !== 0 && dF !== 0) {
        moves++;
        if (Math.sign(dL) !== Math.sign(dF)) contrary++;
        const pq = intervalQuality(prev.L - prev.F);
        if ((pq.kind === 'perfect' || pq.kind === 'unison') && (q.kind === 'perfect' || q.kind === 'unison')
            && Math.abs(prev.L - prev.F) % 12 === Math.abs(iv) % 12 && Math.sign(dL) === Math.sign(dF)) {
          parallels++;
          value -= 1;
        }
      } else if (dL !== 0 || dF !== 0) oblique++;
    }
    wSum += w;
    cSum += w * value;
    prev = { L, F: f.p };
  }

  // activity: share of beats in which at least one of the two voices starts a note
  let beats = 0;
  let activeBeats = 0;
  const beat = barLen === 12 ? 6 : 4;
  for (let b = start; b + beat <= n; b += beat) {
    beats++;
    for (let k = b; k < b + beat; k++) {
      if (line.onset[k] || follower(k).on) {
        activeBeats++;
        break;
      }
    }
  }
  const activity = beats ? activeBeats / beats : 0;
  const overlap = n - start;
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
    - 0.5 * Math.max(0, 0.6 - both / Math.max(1, overlap)) // both voices should actually sound
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
    coverage: both / Math.max(1, overlap),
    activity,
  };
}

function prevPitch(pitch, t) {
  for (let k = t - 1; k >= 0; k--) if (pitch[k] !== null && pitch[k] !== pitch[t]) return pitch[k];
  return null;
}
function prevPitchFollower(follower, t) {
  const cur = follower(t).p;
  for (let k = t - 1; k >= 0; k--) {
    const p = follower(k).p;
    if (p !== null && p !== cur) return p;
  }
  return null;
}
function nextPitchChange(get, t, n) {
  const cur = get(t);
  for (let k = t + 1; k < n; k++) {
    const p = get(k);
    if (p === null) return null;
    if (p !== cur) return p;
  }
  return null;
}
