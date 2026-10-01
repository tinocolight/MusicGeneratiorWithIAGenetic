// Instruments for the voices: General MIDI program (for the exported file), practical range
// (MIDI, sounding pitch; used by the fitness so every voice stays playable) and the synthesis
// preset used by the page's own player. Names (label, familyLabel) come from src/i18n/texts.js.

import { withLabels, t } from '../i18n/i18n.js';

export const INSTRUMENTS = {
  violin: { family: 'strings', program: 40, range: [55, 93], synth: 'bowed', bright: 4.5 },
  viola: { family: 'strings', program: 41, range: [48, 84], synth: 'bowed', bright: 4 },
  cello: { family: 'strings', program: 42, range: [36, 76], synth: 'bowed', bright: 3.5 },
  bass: { family: 'strings', program: 43, range: [28, 60], synth: 'bowed', bright: 3 },
  flute: { family: 'winds', program: 73, range: [60, 93], synth: 'flute' },
  recorder: { family: 'winds', program: 74, range: [65, 91], synth: 'recorder' },
  oboe: { family: 'winds', program: 68, range: [58, 89], synth: 'double-reed', bright: 6 },
  clarinet: { family: 'winds', program: 71, range: [50, 89], synth: 'single-reed' },
  bassoon: { family: 'winds', program: 70, range: [34, 72], synth: 'double-reed', bright: 4 },
  horn: { family: 'brass', program: 60, range: [41, 77], synth: 'brass' },
  trumpet: { family: 'brass', program: 56, range: [55, 84], synth: 'brass', bright: 7 },
  harpsichord: { family: 'keys', program: 6, range: [29, 89], synth: 'pluck' },
  piano: { family: 'keys', program: 0, range: [21, 108], synth: 'piano' },
  organ: { family: 'keys', program: 19, range: [36, 96], synth: 'organ' },
  soprano: { family: 'voices', program: 52, range: [60, 81], synth: 'voice', vowel: 'a' },
  alto: { family: 'voices', program: 52, range: [53, 76], synth: 'voice', vowel: 'o' },
  tenor: { family: 'voices', program: 52, range: [48, 69], synth: 'voice', vowel: 'a' },
  bassVoice: { family: 'voices', program: 52, range: [40, 64], synth: 'voice', vowel: 'o' },
};

withLabels(INSTRUMENTS, 'instrument');
for (const inst of Object.values(INSTRUMENTS)) Object.defineProperty(inst, 'familyLabel', { get: () => t(`family.${inst.family}`), enumerable: true });

export const instrument = (id) => INSTRUMENTS[id] ?? INSTRUMENTS.violin;

/** Voice presets for the "Vozes" control (leader + followers). */
export const ENSEMBLES = withLabels({
  solo: { voices: [{ instrument: 'violin' }] },
  telemann: {
    voices: [{ instrument: 'violin' }, { instrument: 'violin', delayBars: 1, interval: 'unison' }],
  },
  flutes: {
    voices: [{ instrument: 'flute' }, { instrument: 'flute', delayBars: 1, interval: 'unison' }],
  },
  trio: {
    voices: [
      { instrument: 'violin' },
      { instrument: 'viola', delayBars: 2, interval: 'unison' },
      { instrument: 'cello', delayBars: 4, interval: 'octaveDown' },
    ],
  },
  round: {
    voices: [
      { instrument: 'soprano' },
      { instrument: 'alto', delayBars: 2, interval: 'unison' },
      { instrument: 'tenor', delayBars: 4, interval: 'octaveDown' },
    ],
    circular: true,
  },
  fifth: {
    voices: [{ instrument: 'oboe' }, { instrument: 'bassoon', delayBars: 1, interval: 'fifthDown' }],
  },
}, 'ensemble');
