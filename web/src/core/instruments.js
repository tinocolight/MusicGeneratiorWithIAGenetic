// Instruments for the voices: General MIDI program (for the exported file), practical range
// (MIDI, sounding pitch; used by the fitness so every voice stays playable) and the synthesis
// preset used by the page's own player.

export const INSTRUMENTS = {
  violin: { label: 'Violino', family: 'Cordas', program: 40, range: [55, 93], synth: 'bowed', bright: 4.5 },
  viola: { label: 'Viola', family: 'Cordas', program: 41, range: [48, 84], synth: 'bowed', bright: 4 },
  cello: { label: 'Violoncelo', family: 'Cordas', program: 42, range: [36, 76], synth: 'bowed', bright: 3.5 },
  bass: { label: 'Contrabaixo', family: 'Cordas', program: 43, range: [28, 60], synth: 'bowed', bright: 3 },
  flute: { label: 'Flauta transversal', family: 'Sopros', program: 73, range: [60, 93], synth: 'flute' },
  recorder: { label: 'Flauta de bisel (contralto)', family: 'Sopros', program: 74, range: [65, 91], synth: 'recorder' },
  oboe: { label: 'Oboé', family: 'Sopros', program: 68, range: [58, 89], synth: 'double-reed', bright: 6 },
  clarinet: { label: 'Clarinete', family: 'Sopros', program: 71, range: [50, 89], synth: 'single-reed' },
  bassoon: { label: 'Fagote', family: 'Sopros', program: 70, range: [34, 72], synth: 'double-reed', bright: 4 },
  horn: { label: 'Trompa', family: 'Metais', program: 60, range: [41, 77], synth: 'brass' },
  trumpet: { label: 'Trompete', family: 'Metais', program: 56, range: [55, 84], synth: 'brass', bright: 7 },
  harpsichord: { label: 'Cravo', family: 'Teclas', program: 6, range: [29, 89], synth: 'pluck' },
  piano: { label: 'Piano', family: 'Teclas', program: 0, range: [21, 108], synth: 'piano' },
  organ: { label: 'Órgão', family: 'Teclas', program: 19, range: [36, 96], synth: 'organ' },
  soprano: { label: 'Soprano', family: 'Vozes', program: 52, range: [60, 81], synth: 'voice', vowel: 'a' },
  alto: { label: 'Contralto', family: 'Vozes', program: 52, range: [53, 76], synth: 'voice', vowel: 'o' },
  tenor: { label: 'Tenor', family: 'Vozes', program: 52, range: [48, 69], synth: 'voice', vowel: 'a' },
  bassVoice: { label: 'Baixo', family: 'Vozes', program: 52, range: [40, 64], synth: 'voice', vowel: 'o' },
};

export const instrument = (id) => INSTRUMENTS[id] ?? INSTRUMENTS.violin;

/** Voice presets for the "Vozes" control (leader + followers). */
export const ENSEMBLES = {
  solo: { label: 'Só a melodia', voices: [{ instrument: 'violin' }] },
  telemann: {
    label: 'Telemann: 2 violinos, 2.º entra no c. 2',
    voices: [{ instrument: 'violin' }, { instrument: 'violin', delayBars: 1, interval: 'unison' }],
  },
  flutes: {
    label: 'Telemann: 2 flautas, 2.º entra no c. 2',
    voices: [{ instrument: 'flute' }, { instrument: 'flute', delayBars: 1, interval: 'unison' }],
  },
  trio: {
    label: 'Trio: violino, viola (c. 3), violoncelo 8.ª abaixo (c. 5)',
    voices: [
      { instrument: 'violin' },
      { instrument: 'viola', delayBars: 2, interval: 'unison' },
      { instrument: 'cello', delayBars: 4, interval: 'octaveDown' },
    ],
  },
  round: {
    label: 'Ronda a 3 vozes (soprano, contralto, tenor), entradas a cada 2 c.',
    voices: [
      { instrument: 'soprano' },
      { instrument: 'alto', delayBars: 2, interval: 'unison' },
      { instrument: 'tenor', delayBars: 4, interval: 'octaveDown' },
    ],
    circular: true,
  },
  fifth: {
    label: 'Cânone à 5.ª: oboé e fagote (5.ª abaixo, c. 2)',
    voices: [{ instrument: 'oboe' }, { instrument: 'bassoon', delayBars: 1, interval: 'fifthDown' }],
  },
};
