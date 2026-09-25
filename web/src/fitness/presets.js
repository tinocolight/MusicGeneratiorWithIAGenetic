// Attractor-wave presets, in the editor's terms: type, frequency (cycles per bar), mean value,
// amplitude (the wave spans mean ± amplitude), basin width (sigma, semitones) and basin shape. `offset` means are relative to the
// tonic of the chosen key (tonic placed between F#4 and F5), `mean` values are absolute MIDI.

export const WAVE_PRESETS = {
  original: {
    label: 'Original (2 senos do C#)',
    waves: [
      { type: 'sine', freq: 0.5, mean: 69, amplitude: 12, basin: 3, shape: 'step' },
      // amplitude 4: Form1's constructor copies the ConfigurationValues default over its "5"
      { type: 'sine', freq: 2, mean: 62, amplitude: 4, basin: 2, shape: 'step' },
    ],
  },
  arch: {
    label: 'Arco de frase (Huron)',
    waves: [{ type: 'arch', freq: 0.5, offset: 3.4, amplitude: 3.9, basin: 3 }],
  },
  pink: {
    label: 'Flutuação 1/f (Voss & Clarke)',
    waves: [{ type: 'pink', freq: 4, offset: 4, amplitude: 7, basin: 3 }],
  },
  rossler: {
    label: 'Atrator de Rössler',
    waves: [{ type: 'rossler', freq: 0.35, offset: 4, amplitude: 7, basin: 3 }],
  },
  lorenz: {
    label: 'Atrator de Lorenz (2 registos)',
    waves: [{ type: 'lorenz', freq: 0.5, offset: 4, amplitude: 8, basin: 3 }],
  },
  compound: {
    label: 'Melodia composta (2 vozes, cf. Bach)',
    waves: [
      { type: 'arch', freq: 0.5, offset: 7.8, amplitude: 2.8, basin: 2.5 },
      { type: 'rossler', freq: 0.35, offset: -3, amplitude: 4, basin: 2.5 },
    ],
  },
  canon: {
    label: 'Cânone: seno com período = nº de vozes × entrada',
    // the voices of the canon sit on different phases of the wave, hence in different registers
    waves: [{ type: 'sine', freq: 0.5, offset: 4, amplitude: 6, basin: 3, canonPeriod: true }],
  },
};

/** MIDI of the tonic placed in the octave F#4..F5 (66..77). */
export function tonicMidi(tonic) {
  let m = 60 + tonic;
  if (m < 66) m += 12;
  return m;
}

/**
 * Preset -> list of editable waves {type, freq, mean, amplitude, basin, shape, phase}.
 * `canon` = {voices: n, delayBars} adapts the "canon" wave's period to the entries.
 */
export function resolvePreset(name, tonic, canon = null) {
  const p = WAVE_PRESETS[name] ?? WAVE_PRESETS.arch;
  const base = tonicMidi(tonic);
  return p.waves.map((w) => {
    const out = {
      type: w.type,
      freq: w.freq,
      mean: w.mean ?? base + w.offset,
      amplitude: w.amplitude,
      basin: w.basin,
      shape: w.shape ?? 'gaussian',
      phase: w.phase ?? 0,
    };
    if (w.canonPeriod && canon && canon.voices >= 2) out.freq = 1 / (canon.voices * canon.delayBars);
    return out;
  });
}
