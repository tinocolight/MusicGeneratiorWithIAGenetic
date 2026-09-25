// Chromosome representation — identical to the original C# program so that the
// classic fitness can be ported rule by rule:
//   * one gene per 16th note (MidiFile.SEMIBREVE / SEMIQUAVER = 16 steps per bar)
//   * 0      -> pause (rest)
//   * 1..73  -> chromatic pitches, 37 = A4 (MIDI 69), i.e. MIDI = gene + 32
//   * 74     -> prolongation of the previous figure (note or rest)

export const REST = 0;
export const HOLD = 74;
export const GENE_A4 = 37;
export const MIDI_A4 = 69;
export const MIDI_OFFSET = MIDI_A4 - GENE_A4; // 32
export const LOWEST_NOTE_GENE = 1;
export const HIGHEST_NOTE_GENE = 73;
export const STEPS_PER_BAR = 16;

export const isNote = (g) => g !== REST && g !== HOLD;
export const geneToMidi = (g) => g + MIDI_OFFSET;
export const midiToGene = (m) => m - MIDI_OFFSET;

/**
 * Convert a genome into note events {pitch (MIDI) | null for rest, start, dur}.
 * A prolongation after a rest extends the rest (as in TranslateChromosomeToMidiSequence).
 * A prolongation in the very first step is treated as a rest (the C# code turned it
 * into an out-of-range note, MIDI 106).
 */
export function toEvents(genome) {
  const events = [];
  for (let i = 0; i < genome.length; i++) {
    const g = genome[i];
    if (g === HOLD && events.length) {
      events[events.length - 1].dur += 1;
    } else if (g === REST || g === HOLD) {
      const last = events[events.length - 1];
      if (last && last.pitch === null) last.dur += 1;
      else events.push({ pitch: null, start: i, dur: 1 });
    } else {
      events.push({ pitch: geneToMidi(g), start: i, dur: 1 });
    }
  }
  return events;
}

/** Inverse of toEvents: events -> genome of the given length (truncates / pads with rests). */
export function fromEvents(events, length) {
  const genome = new Array(length).fill(REST);
  let pos = 0;
  for (const ev of events) {
    const start = ev.start ?? pos;
    for (let k = 0; k < ev.dur && start + k < length; k++) {
      const i = start + k;
      if (ev.pitch === null || ev.pitch === undefined) genome[i] = k === 0 ? REST : HOLD;
      else genome[i] = k === 0 ? clampGene(midiToGene(ev.pitch)) : HOLD;
    }
    pos = start + ev.dur;
  }
  return genome;
}

export function clampGene(g) {
  return Math.max(LOWEST_NOTE_GENE, Math.min(HIGHEST_NOTE_GENE, Math.round(g)));
}

/** Compact [[midi | -1, dur], ...] (corpus format) -> events with start times. */
export function compactToEvents(compact) {
  let t = 0;
  return compact.map(([p, d]) => {
    const ev = { pitch: p < 0 ? null : p, start: t, dur: d };
    t += d;
    return ev;
  });
}

export function eventsToCompact(events) {
  return events.map((e) => [e.pitch === null ? -1 : e.pitch, e.dur]);
}

export const noteEvents = (events) => events.filter((e) => e.pitch !== null);

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export function midiName(m) {
  return NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
}

/** Human readable dump, one bar per line (handy in tests and reports). */
export function genomeToText(genome, barLen = STEPS_PER_BAR) {
  const lines = [];
  for (let b = 0; b < genome.length; b += barLen) {
    const cells = [];
    for (let i = b; i < Math.min(b + barLen, genome.length); i++) {
      const g = genome[i];
      cells.push(g === REST ? '.' : g === HOLD ? '-' : midiName(geneToMidi(g)));
    }
    lines.push(cells.join(' '));
  }
  return lines.join('\n');
}
