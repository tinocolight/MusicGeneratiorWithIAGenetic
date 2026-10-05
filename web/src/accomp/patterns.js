// Melody + decoupled accompaniment for the styles other than the fado (results/acompanhamento.md):
// the melody is composed first, then the harmony it implies (accomp/harmony.js) is played in the
// texture of its style:
//   * waltz: "oom-pah-pah", the bass on the 1st beat and the chord on the 2nd and the 3rd;
//   * polka and march: "oom-pah", the bass on the beat (root and fifth in turn) and the chord on
//     the off-beat; in a march of 4/4 the bass on 1 and 3, the chord on 2 and 4;
//   * folk song: the guitar picking an alternating bass (root and fifth) with a chord note between
//     the bass notes (Travis picking, simplified to one line);
//   * children's song: a block chord, bass and triad, on each half bar (each bar in 3/4);
//   * blues: the twelve-bar form, the boogie-woogie bass (root, 3rd, 5th, 6th up, ♭7, 6th, 5th,
//     3rd down) and the chord on the 2nd and 4th beats.
// Each starts with a short introduction (a vamp on I–V7, the turnaround of the blues) and ends on
// the tonic chord held under the last note. Pure: melody events (16ths, from 0) in; chords and
// parts out, in the piece's time, where the melody starts after the introduction.

import { mod, chordPcs, implyChords, bluesChords, chordsOfSequence } from './harmony.js';

const PIANO = [{ id: 'piano', instrument: 'piano' }];
/** The styles with an accompaniment of their own: the harmony, the texture, the introduction. */
export const ACCOMP_PROFILES = {
  waltz: { vocab: 'dance', texture: 'waltz', parts: PIANO, intro: 2 },
  polka: { vocab: 'dance', texture: 'oompah', parts: PIANO, intro: 2 },
  march: { vocab: 'dance', texture: 'oompah', parts: PIANO, intro: 2 },
  folk: { vocab: 'folk', texture: 'picking', parts: [{ id: 'guitar', instrument: 'guitar' }], intro: 1 },
  children: { vocab: 'simple', texture: 'block', parts: PIANO, intro: 1 },
  blues: { vocab: 'blues', texture: 'boogie', parts: PIANO, intro: 2 },
};
/** Bars of the introduction of a style's accompaniment. */
export const accompIntroBars = (style) => ACCOMP_PROFILES[style]?.intro ?? 0;

// registers: the bass, the chords above it (the left hand of a piano, in the bass clef), the
// guitar's upper notes
const BASS = [40, 51];
const CHORD_LOW = 52;
const GUITAR_HIGH = [55, 69];

const inRange = (p, [lo, hi]) => {
  let q = p;
  while (q < lo) q += 12;
  while (q > hi) q -= 12;
  return q;
};
/** A closed chord from `low` up: for a seventh chord its 3rd, 5th and 7th, else the triad. */
function voicing(c, low = CHORD_LOW) {
  const order = c.pcs.length > 3 ? [1, 2, 3] : [0, 1, 2];
  const out = [];
  let floor = low;
  for (const pc of order.map((i) => c.pcs[i])) {
    const p = floor + mod(pc - floor, 12);
    out.push(p);
    floor = p + 1;
  }
  return out;
}
const x = (vel) => ({ vel, shape: null, end: 1, accent: false, pain: false, vib: 0 });

/** The chords of the introduction: the tonic and the dominant (the turnaround of the blues). */
function introChords(style, bars, barLen, tonic, mode) {
  if (!bars) return [];
  const I = style === 'blues' ? { id: 'I7', root: 0, q: '7' } : { id: mode === 'minor' ? 'i' : 'I', root: 0, q: mode === 'minor' ? 'm' : 'M' };
  const V = { id: 'V7', root: 7, q: '7' };
  const seq = bars === 1 ? [I] : [...Array(bars - 1).fill(I), V];
  return chordsOfSequence(seq, barLen, bars * barLen, tonic);
}

/**
 * The accompaniment of a melody in a style: {intro, total, chords, melodyChords, partList, parts}
 * (events {pitch, start, dur, x} in the piece's time), or null for a style without one.
 * ctx {style, length, barLen, beat, meter, key {tonic, mode}, phraseLen}
 */
export function styleAccompaniment(events, ctx) {
  const { style, length, barLen = 16, beat = 4, key = { tonic: 0, mode: 'major' }, phraseLen = null } = ctx;
  const P = ACCOMP_PROFILES[style];
  if (!P) return null;
  const mode = key.mode === 'minor' ? 'minor' : 'major';
  const tonic = key.tonic;
  const melody = P.vocab === 'blues' ? bluesChords(events, { length, barLen, beat, key }) : implyChords(events, { length, barLen, beat, key, vocab: P.vocab, phraseLen });
  const intro = (length >= 4 * barLen ? P.intro : 0) * barLen;
  const chords = [];
  for (const c of [...introChords(style, intro / barLen, barLen, tonic, mode), ...melody.map((ch) => ({ ...ch, start: ch.start + intro }))]) {
    // the introduction may end on the chord the melody starts with: one chord, not two
    const last = chords[chords.length - 1];
    if (last && last.id === c.id && last.start + last.dur === c.start) last.dur += c.dur;
    else chords.push({ ...c });
  }
  const total = intro + length;
  const notes = events.filter((e) => e.pitch !== null && e.pitch !== undefined);
  const lastNote = notes[notes.length - 1];
  // the last chord is held from the beat of the last note
  const holdFrom = lastNote ? intro + lastNote.start - (lastNote.start % beat) : total;
  const out = [];
  const bassOf = (pc) => inRange(pc, BASS);
  const push = (pitch, start, dur, vel) => {
    if (dur > 0 && start < holdFrom) out.push({ pitch, start, dur: Math.min(dur, holdFrom - start), x: x(vel) });
  };

  for (const c of chords) {
    const root = bassOf(c.root);
    const fifth = inRange(root + 7, BASS);
    const end = c.start + c.dur;
    for (let bar = Math.floor(c.start / barLen) * barLen; bar < end; bar += barLen) {
      const barNo = Math.floor(bar / barLen);
      const inChord = (t) => t >= c.start && t < end;
      const down = (t) => (mod(t, barLen) === 0 ? 0.05 : 0);
      if (P.texture === 'waltz') {
        // oom-pah-pah: bass on 1 (root, then the fifth in the next bar of the same chord), chord on 2 and 3
        const bassP = (barNo - Math.floor(c.start / barLen)) % 2 ? fifth : root;
        for (let t = bar; t < bar + barLen; t += beat) {
          if (!inChord(t)) continue;
          if (t === bar) push(bassP, t, beat, 0.52 + down(t));
          else for (const p of voicing(c)) push(p, t, beat, 0.4);
        }
      } else if (P.texture === 'oompah') {
        // oom-pah: a bass and a chord in each pulse (a beat; two beats in 4/4)
        const pulse = barLen === 16 ? 2 * beat : beat;
        const first = Math.floor(beat === 6 ? (2 * pulse) / 3 : pulse / 2);
        let k = 0;
        for (let t = bar; t < bar + barLen; t += pulse, k++) {
          if (!inChord(t)) continue;
          push(k % 2 ? fifth : root, t, first, 0.52 + down(t));
          for (const p of voicing(c)) push(p, t + first, pulse - first, 0.4);
        }
      } else if (P.texture === 'picking') {
        // the guitar: alternating bass on the beats, chord notes between (eighths; in 6/8 the
        // bass and two notes of the chord in each beat)
        const step = beat === 6 ? 2 : beat / 2;
        const highs = c.pcs.map((pc) => inRange(pc, GUITAR_HIGH)).sort((a, b) => a - b);
        let k = 0;
        for (let t = bar; t < bar + barLen; t += step, k++) {
          if (!inChord(t)) continue;
          const onBeat = mod(t, beat) === 0;
          if (onBeat) push(Math.floor((t - bar) / beat) % 2 ? fifth : root, t, step, 0.48 + down(t));
          else push(highs[(k + barNo) % highs.length], t, step, 0.38);
        }
      } else if (P.texture === 'block') {
        // block chords, bass and triad together, on each half bar (each bar in 3/4 and 3/8)
        const span = barLen === 12 || barLen === 6 ? barLen : barLen / 2;
        for (let t = bar; t < bar + barLen; t += span) {
          if (!inChord(t)) continue;
          push(root, t, span, 0.48 + down(t));
          for (const p of voicing(c)) push(p, t, span, 0.42);
        }
      } else if (P.texture === 'boogie') {
        // the boogie-woogie bass in quarters, a two-bar figure; the chord on 2 and 4
        const up = [0, 4, 7, 9];
        const downFig = [10, 9, 7, 4];
        const fig = barNo % 2 ? downFig : up;
        for (let i = 0; i < barLen / beat; i++) {
          const t = bar + i * beat;
          if (!inChord(t)) continue;
          push(inRange(mod(c.root + fig[i % 4], 12), BASS), t, beat, 0.5 + down(t));
          if (i % 2 === 1) for (const p of voicing(c)) push(p, t, beat, 0.4);
        }
      }
    }
  }
  // the end: the tonic chord (bass and chord) held under the last note
  if (lastNote) {
    const c = chords.find((ch) => ch.start <= holdFrom && holdFrom < ch.start + ch.dur) ?? chords[chords.length - 1];
    const fin = c.root === tonic ? c : { ...c, root: tonic, pcs: chordPcs({ root: 0, q: c.q }, tonic) };
    out.push({ pitch: bassOf(fin.root), start: holdFrom, dur: total - holdFrom, x: x(0.5) });
    for (const p of voicing(fin)) out.push({ pitch: p, start: holdFrom, dur: total - holdFrom, x: x(0.42) });
  }
  const parts = { [P.parts[0].id]: out.filter((e) => e.dur > 0 && e.start < total).sort((a, b) => a.start - b.start || a.pitch - b.pitch) };
  return { intro, total, chords, melodyChords: melody, partList: P.parts, parts };
}
