// Attractor-wave presets for the "attractor field" fitness. Means are given relative to the
// tonic of the chosen key (tonic placed between F#4 and F5), so every preset works in any key.

export const WAVE_PRESETS = {
  original: {
    label: 'Original (2 senos do C#)',
    waves: [
      { type: 'sine', periodsPerBar: 0.5, amplitude: 12, offset: 0, basin: 3 },
      { type: 'sine', periodsPerBar: 2, amplitude: 4, offset: -7, basin: 2 },
    ],
  },
  arch: {
    label: 'Arco de frase (Huron)',
    waves: [{ type: 'arch', phraseBars: 2, amplitude: 7, offset: 5, basin: 3 }],
  },
  pink: {
    label: 'Flutuação 1/f (Voss & Clarke)',
    waves: [{ type: 'pink', amplitude: 7, offset: 4, basin: 3, rows: 5, resolution: 2 }],
  },
  rossler: {
    label: 'Atrator de Rössler',
    waves: [{ type: 'rossler', periodsPerBar: 0.35, amplitude: 7, offset: 4, basin: 3 }],
  },
  lorenz: {
    label: 'Atrator de Lorenz (2 registos)',
    waves: [{ type: 'lorenz', periodsPerBar: 0.5, amplitude: 8, offset: 4, basin: 3 }],
  },
  compound: {
    label: 'Melodia composta (2 vozes, cf. Bach)',
    waves: [
      { type: 'arch', phraseBars: 2, amplitude: 5, offset: 9, basin: 2.5 },
      { type: 'rossler', periodsPerBar: 0.35, amplitude: 4, offset: -3, basin: 2.5 },
    ],
  },
  canon: {
    label: 'Cânone: onda com período = 2 × atraso',
    // with period 2*delay the follower sits half a period away: the voices keep different registers
    waves: [{ type: 'sine', periodsPerBar: 0.5, amplitude: 6, offset: 4, basin: 3 }],
  },
};

/** MIDI of the tonic placed in the octave F#4..F5 (66..77). */
export function tonicMidi(tonic) {
  let m = 60 + tonic;
  if (m < 66) m += 12;
  return m;
}

export function resolvePreset(name, tonic, overrides = {}) {
  const p = WAVE_PRESETS[name] ?? WAVE_PRESETS.arch;
  const base = tonicMidi(tonic);
  return p.waves.map((w) => ({ ...w, mean: base + w.offset, ...overrides }));
}
