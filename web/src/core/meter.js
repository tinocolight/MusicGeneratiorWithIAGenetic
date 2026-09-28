// Meters. The genome keeps one gene per 16th note (score.js); the meter says how those 16ths
// group into beats and bars:
//   * simple meters (2/4, 3/4, 4/4): the beat is a quarter note, 4 sixteenths, split in two
//     eighths (ta-di in the Takadimi syllables of Hoffman, Pelto & White 1996);
//   * compound meters (3/8, 6/8, 9/8, 12/8): the beat is a dotted quarter, 6 sixteenths, split
//     in three eighths (ta-ki-da).
// 3/4 and 6/8 both last 12 sixteenths, so the length of the bar alone cannot tell them apart:
// the meter is carried explicitly (`meter: '6/8'`) wherever it matters.

export const METERS = {
  '2/4': { id: '2/4', num: 2, den: 4, barLen: 8, beat: 4, beats: 2, compound: false },
  '3/4': { id: '3/4', num: 3, den: 4, barLen: 12, beat: 4, beats: 3, compound: false },
  '4/4': { id: '4/4', num: 4, den: 4, barLen: 16, beat: 4, beats: 4, compound: false },
  '3/8': { id: '3/8', num: 3, den: 8, barLen: 6, beat: 6, beats: 1, compound: true },
  '6/8': { id: '6/8', num: 6, den: 8, barLen: 12, beat: 6, beats: 2, compound: true },
  '9/8': { id: '9/8', num: 9, den: 8, barLen: 18, beat: 6, beats: 3, compound: true },
  '12/8': { id: '12/8', num: 12, den: 8, barLen: 24, beat: 6, beats: 4, compound: true },
};

export const METER_IDS = Object.keys(METERS);
export const DEFAULT_METER = '4/4';

export const METER_LABELS = {
  '2/4': '2/4 · dois tempos de semínima',
  '3/4': '3/4 · três tempos de semínima (valsa, minueto)',
  '4/4': '4/4 · quatro tempos de semínima',
  '3/8': '3/8 · composto, um tempo de semínima com ponto',
  '6/8': '6/8 · composto, dois tempos de três colcheias (jiga)',
  '9/8': '9/8 · composto, três tempos de três colcheias (slip jig)',
  '12/8': '12/8 · composto, quatro tempos de três colcheias',
};

/**
 * The meter for an id ('6/8'), an object already resolved, or (for old callers that only know
 * the bar length) a number of 16ths per bar: 8 -> 2/4, 16 -> 4/4, 6 -> 3/8, 24 -> 12/8 and
 * 12 -> 6/8 unless `hint` says '3/4'.
 */
export function meterOf(m, hint = null) {
  if (m && typeof m === 'object' && m.barLen) return m;
  if (typeof m === 'string' && METERS[m]) return METERS[m];
  if (hint && METERS[hint]) return METERS[hint];
  switch (Number(m)) {
    case 6: return METERS['3/8'];
    case 8: return METERS['2/4'];
    case 12: return METERS['6/8'];
    case 18: return METERS['9/8'];
    case 24: return METERS['12/8'];
    default: return METERS['4/4'];
  }
}

/** Meter from a time signature (MIDI, MusicXML); 2/2 is written like 4/4 on the 16th grid. */
export function meterFromSignature(num, den) {
  const id = `${num}/${den}`;
  if (METERS[id]) return METERS[id];
  if (id === '2/2') return METERS['4/4'];
  return null;
}

/**
 * Weight of a 16th-note position: 1 on the downbeat, 0.85 in the middle of a bar with an even
 * number of beats (beat 3 of 4/4, beat 2 of 2/4 and 6/8), 0.7 on the other beats, 0.4 on the
 * eighths inside a beat and 0.2 on the sixteenths — in simple and compound meters alike.
 */
export function metricWeight(step, meter) {
  const m = meterOf(meter);
  const p = ((step % m.barLen) + m.barLen) % m.barLen;
  if (p === 0) return 1;
  if (p % m.beat === 0) {
    if (m.beats % 2 === 0 && p === m.barLen / 2) return m.id === '6/8' ? 0.8 : 0.85;
    return 0.7;
  }
  return (p % m.beat) % 2 === 0 ? 0.4 : 0.2;
}

/** Beat of the bar (0-based) at a step, and whether the step starts it. */
export function beatAt(step, meter) {
  const m = meterOf(meter);
  const p = ((step % m.barLen) + m.barLen) % m.barLen;
  return { beat: Math.floor(p / m.beat), onBeat: p % m.beat === 0, offset: p % m.beat };
}

/** Strength class of a beat: 's' downbeat, 'm' the middle of a 4-beat bar, 'w' the others. */
export function beatClass(beatInBar, meter) {
  const m = meterOf(meter);
  if (beatInBar === 0) return 's';
  if (m.beats === 4 && beatInBar === 2) return 'm';
  return 'w';
}

/** Bars per phrase: about eight beats (2 bars of 4/4, 4 of 3/4 or 6/8, 8 of 3/8). */
export function phraseBarsFor(meter) {
  const m = meterOf(meter);
  return m.beats >= 4 ? 2 : m.beats === 1 ? 8 : 4;
}

/** Where the final note starts in the last bar: the middle of a 4-beat bar, else the downbeat. */
export function finalOnsetIn(meter) {
  const m = meterOf(meter);
  return m.beats === 4 ? m.barLen / 2 : 0;
}

/** Durations (16ths) that a single note can have and still be written as one readable value. */
export function plainDurations(meter) {
  return meterOf(meter).compound ? [1, 2, 3, 4, 6, 12, 18, 24] : [1, 2, 3, 4, 6, 8, 12, 16];
}
