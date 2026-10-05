// Composition heuristics by style: which features of a melody matter in each style and the range
// they take. Every rule cites the rows of results/estilos/literatura.csv it comes from (src).
//
// A rule is {id, feature | figures (+ at), lo, hi, tol, in, weight, cal, src}:
//   feature   a value of melodyFeatures (heuristics.js), or
//   figures   a list of one-beat figures ('x' onset, '_' continuation, '.' rest; 4 characters in the
//             simple meters, 6 in the compound ones): the share of the beats with one of them,
//             optionally only at one beat of the bar (at: 0 = downbeat); a figure rule only applies to
//             the meters whose beat has its length;
//   lo, hi    the target range; `in` a set of allowed values instead;
//   tol       how far beyond the range the score falls to -1 (default by feature);
//   cal       the range is the P10–P90 of real melodies (tools/build_styles.mjs,
//             src/data/style-calibration.js): of the style's own melodies when the corpus has them
//             (`group`), otherwise of all the corpus melodies in the meter; lo/hi are the fallback.
// The general rules apply to every style, except where a style has a rule with the same id.
// Styles also suggest the settings of the piece that go with them (meter, phrase, form, length,
// pickup, tempo in quarter notes per minute, mode).

import calibration from '../data/style-calibration.js';
import { meterOf } from '../core/meter.js';

const R = (id, feature, src, o = {}) => ({ id, feature, src, ...o });
const F = (id, figures, src, o = {}) => ({ id, figures, src, ...o });

// default tolerance by feature: how far outside the range the rule reaches -1
const TOL = { range: 5, maxLeap: 4, density: 0.6, climaxCount: 3, finalLength: 0.6, syncBar: 0.6 };
const tolOf = (r) => r.tol ?? TOL[r.feature] ?? 0.25;

export const GENERAL_RULES = [
  R('stepDown', 'stepDown', ['G02'], { cal: true, lo: 0.4, hi: 0.8 }),
  R('inertia', 'inertia', ['G03'], { cal: true, lo: 0.45, hi: 0.9 }),
  R('leaps', 'leaps', ['G01', 'G06'], { cal: true, lo: 0.04, hi: 0.23 }),
  R('recovery', 'recovery', ['G04', 'G10'], { cal: true, lo: 0, hi: 0.6, weight: 0.5 }),
  R('leapChain', 'leapChain', ['G10'], { lo: 0, hi: 0.02, tol: 0.1 }),
  R('dissonant', 'dissonant', ['G10', 'G11'], { lo: 0, hi: 0.03, tol: 0.1 }),
  R('range', 'range', ['G10', 'G11'], { cal: true, lo: 9, hi: 19 }),
  R('climaxCount', 'climaxCount', ['G10', 'G15'], { cal: true, lo: 1, hi: 6, weight: 0.5 }),
  R('arch', 'arch', ['G05'], { cal: true, lo: 0, hi: 0.83, weight: 0.5 }),
  R('endLow', 'endLow', ['G08'], { cal: true, lo: 0.33, hi: 1 }),
  R('finalLength', 'finalLength', ['G07'], { cal: true, lo: 1.03, hi: 2.2 }),
  R('motifs', 'motifs', ['G09', 'G15'], { cal: true, lo: 0.29, hi: 0.82 }),
  R('longOnBeat', 'longOnBeat', ['G16'], { lo: 0.8, hi: 1, tol: 0.4 }),
  R('syncBar', 'syncBar', ['G16', 'G17'], { lo: 0, hi: 0.1 }),
];

// one-beat figures
const Q = 'x___'; // quarter
const EE = 'x_x_'; // two eighths
const SSSS = 'xxxx'; // four sixteenths
const DOT = 'x__x'; // dotted eighth + sixteenth
const SNAP = 'xx__'; // sixteenth + dotted eighth (Scotch snap)
const ESS = 'x_xx'; // eighth + two sixteenths
const SSE = 'xxx_'; // two sixteenths + eighth
const SES = 'xx_x'; // sixteenth, eighth, sixteenth (the tango "síncopa")
const HOLD4 = '____';
const EEE = 'x_x_x_'; // three eighths
const QE = 'x___x_'; // quarter + eighth
const DQ = 'x_____'; // dotted quarter
const SIC = 'x__xx_'; // dotted eighth, sixteenth, eighth (siciliana)

export const STYLE_FAMILIES = ['trad', 'fado', 'dance', 'baroque', 'classical', 'popular'];

export const STYLES = {
  // ------------------------------------------------------------------ songs
  folk: {
    family: 'trad', meters: ['4/4', '2/4', '3/4', '6/8', '3/8'], group: 'folk', bpm: 96,
    rules: [
      R('density', 'density', ['E42'], { cal: true, lo: 0.8, hi: 2.2 }),
      R('steps', 'steps', ['G01'], { cal: true, lo: 0.3, hi: 0.7 }),
      R('repeats', 'repeats', ['G09'], { cal: true, lo: 0.06, hi: 0.36, weight: 0.5 }),
      R('restShare', 'restShare', ['G07'], { cal: true, lo: 0, hi: 0.1, weight: 0.5 }),
    ],
  },
  children: {
    family: 'trad', perform: 'children', meters: ['2/4', '4/4'], bpm: 108,
    rules: [
      R('range', 'range', ['E21'], { lo: 5, hi: 9, tol: 4, weight: 2 }),
      R('pentatonic', 'pentatonic', ['E21'], { lo: 0.9, hi: 1, tol: 0.2, weight: 2 }),
      R('motifs', 'motifs', ['E21', 'G09'], { lo: 0.6, hi: 0.9, weight: 1.5 }),
      R('repeats', 'repeats', ['E21'], { lo: 0.15, hi: 0.45 }),
      R('bigLeaps', 'bigLeaps', ['E21'], { lo: 0, hi: 0.02, tol: 0.1 }),
    ],
  },
  lullaby: {
    family: 'trad', perform: 'lullaby', meters: ['6/8', '3/4', '2/4'], bpm: 84,
    rules: [
      R('steps', 'steps', ['E19', 'E20'], { lo: 0.55, hi: 0.9, weight: 1.5 }),
      R('leaps', 'leaps', ['E19', 'E20'], { lo: 0, hi: 0.08, tol: 0.15 }),
      R('dirChanges', 'dirChanges', ['E19'], { lo: 0.2, hi: 0.42, weight: 1.5 }),
      R('phraseDescent', 'phraseDescent', ['E19'], { lo: 0.5, hi: 1, weight: 1.5 }),
      R('range', 'range', ['E19'], { lo: 5, hi: 11 }),
      R('density', 'density', ['E20', 'E46'], { lo: 0.7, hi: 1.7 }),
      R('motifs', 'motifs', ['E19'], { lo: 0.5, hi: 0.9 }),
      F('fig:rocking', [QE, DQ], ['E46'], { lo: 0.5, hi: 1, weight: 1.5 }),
    ],
  },
  hymn: {
    family: 'trad', perform: 'chorale', meters: ['4/4', '3/4'], pickup: 4, bpm: 80,
    rules: [
      R('firstOnset', 'firstOnset', ['E33'], { pickupOnset: true, weight: 1.5 }),
      R('density', 'density', ['E33'], { lo: 0.8, hi: 1.2 }),
      F('fig:quarters', [Q], ['E33'], { lo: 0.55, hi: 0.9, weight: 1.5 }),
      R('steps', 'steps', ['E18', 'E33'], { lo: 0.5, hi: 0.8 }),
      R('range', 'range', ['E33'], { lo: 8, hi: 14 }),
    ],
  },
  pentatonic: {
    family: 'trad', meters: ['2/4', '4/4'], bpm: 84, mode: 'major',
    rules: [
      R('pentatonic', 'pentatonic', ['E43'], { lo: 0.97, hi: 1, tol: 0.15, weight: 2 }),
      R('chromatic', 'chromatic', ['E43'], { lo: 0, hi: 0, tol: 0.1 }),
      R('range', 'range', ['E43'], { lo: 9, hi: 16 }),
      R('bigLeaps', 'bigLeaps', ['E42', 'E43'], { lo: 0, hi: 0.08, tol: 0.15 }),
    ],
  },
  // ------------------------------------------------------------------ fado (results/fado.md)
  // Two groups, as the user suggested: the sad fados in minor and the happy ones in major (not
  // always so, but the safer split). The ranges come from five real fados measured next to the
  // 5727 corpus melodies in the same meters (tools/fado_study.mjs, results/fado/medidas-verso.csv).
  // Besides the rules, a fado style changes the fitness itself (attractor.js): breaths between the
  // verses (restTarget), held notes that may start half a beat early (anticipation), verse endings
  // alternating between suspension and rest (cadence), recitation on a repeated note
  // (recitation), the peak of each verse early in it (phrasePeak); and the page plays it with
  // dynamics (core/expression.js).
  fado: {
    family: 'fado', meters: ['4/4', '2/4'], form: 'AABB', bars: 8, bpm: 72, mode: 'minor',
    restTarget: [0.06, 0.22], anticipation: true, cadence: 'alternate', recitation: true, phrasePeak: 0.35, expression: 'sad',
    rules: [
      R('verseFinal', 'verseFinal', ['E32', 'F04'], { lo: 2.2, hi: 5, tol: 1.2, weight: 2 }),
      R('verseNotes', 'verseNotes', ['F02', 'F04'], { lo: 6, hi: 16, tol: 5 }),
      R('restShare', 'restShare', ['F05', 'F07'], { lo: 0.06, hi: 0.22, weight: 1.5 }),
      R('syncBar', 'syncBar', ['F02', 'F06'], { lo: 0.15, hi: 0.7, weight: 1.5 }),
      R('verseAnticip', 'verseAnticip', ['F06', 'F07'], { lo: 0.1, hi: 0.85 }),
      R('longOnBeat', 'longOnBeat', ['F06'], { lo: 0.2, hi: 1, weight: 0.5 }),
      R('verseEndStep', 'verseEndStep', ['F09'], { lo: 0.4, hi: 1 }),
      R('verseTonic', 'verseTonic', ['F03', 'F10'], { lo: 0, hi: 0.34 }),
      R('repeats', 'repeats', ['F08'], { lo: 0.15, hi: 0.42 }),
      R('stepDown', 'stepDown', ['G02', 'F08'], { lo: 0.55, hi: 0.85 }),
      R('quickRuns', 'quickRuns', ['F11'], { lo: 0, hi: 0.35 }),
      R('quickRunMax', 'quickRunMax', ['F11'], { lo: 0, hi: 6, tol: 3, weight: 0.5 }),
      R('runsIntoLong', 'runsIntoLong', ['F11'], { lo: 0.5, hi: 1, weight: 0.5 }),
      R('density', 'density', ['E32', 'F04'], { lo: 0.6, hi: 1.6 }),
      R('range', 'range', ['E32', 'F04'], { lo: 10, hi: 19 }),
      // measured on fixed two-bar windows, which a verse starting after the downbeat straddles:
      // the verse rules above judge the endings, these only keep the general ones from fighting them
      R('finalLength', 'finalLength', ['F04'], { lo: 0.5, hi: 2.6, weight: 0.5 }),
      R('arch', 'arch', ['F04'], { lo: 0, hi: 1, weight: 0.25 }),
      R('inertia', 'inertia', ['F04'], { lo: 0.3, hi: 1 }),
      R('recovery', 'recovery', ['F04'], { lo: 0, hi: 0.7, weight: 0.5 }),
      R('leapChain', 'leapChain', ['F04'], { lo: 0, hi: 0.08, tol: 0.1 }),
    ],
  },
  fadoAlegre: {
    family: 'fado', meters: ['2/4', '4/4'], form: 'AABB', bars: 8, bpm: 112, mode: 'major',
    restTarget: [0.03, 0.16], anticipation: true, cadence: 'alternate', recitation: true, phrasePeak: 0.5, expression: 'happy',
    rules: [
      R('verseFinal', 'verseFinal', ['F04', 'F14'], { lo: 1.8, hi: 4.5, tol: 1.2, weight: 1.5 }),
      R('verseNotes', 'verseNotes', ['F02', 'F14'], { lo: 6, hi: 18, tol: 5 }),
      R('restShare', 'restShare', ['F05', 'F14'], { lo: 0.03, hi: 0.16 }),
      R('syncBar', 'syncBar', ['F02', 'F06'], { lo: 0.1, hi: 0.6 }),
      R('longOnBeat', 'longOnBeat', ['F14', 'G16'], { lo: 0.6, hi: 1 }),
      R('verseTonic', 'verseTonic', ['F03', 'F10'], { lo: 0, hi: 0.4 }),
      R('verseEndStep', 'verseEndStep', ['F09'], { lo: 0.2, hi: 1, weight: 0.5 }),
      R('repeats', 'repeats', ['F08', 'F14'], { lo: 0.06, hi: 0.36 }),
      R('quickRuns', 'quickRuns', ['F11'], { lo: 0, hi: 0.4 }),
      R('runsIntoLong', 'runsIntoLong', ['F11'], { lo: 0.3, hi: 1, weight: 0.5 }),
      R('density', 'density', ['F04', 'F14'], { lo: 0.9, hi: 2.2 }),
      R('leaps', 'leaps', ['F04', 'F14'], { lo: 0.06, hi: 0.26 }),
      R('range', 'range', ['F04'], { lo: 9, hi: 17 }),
      R('finalLength', 'finalLength', ['F04'], { lo: 0.5, hi: 2.6, weight: 0.5 }),
      R('arch', 'arch', ['F04'], { lo: 0, hi: 1, weight: 0.25 }),
      R('inertia', 'inertia', ['F04'], { lo: 0.3, hi: 1 }),
    ],
  },
  // ------------------------------------------------------------------ dances
  reel: {
    family: 'dance', meters: ['4/4'], group: 'reel', form: 'AABB', bars: 16, bpm: 220,
    rules: [
      F('fig:eighths', [EE], ['E02'], { cal: true, lo: 0.6, hi: 0.9, weight: 2 }),
      R('density', 'density', ['E02'], { cal: true, lo: 1.7, hi: 2.1 }),
      R('arpeggio', 'arpeggio', ['E02'], { cal: true, lo: 0.3, hi: 0.65 }),
      R('restShare', 'restShare', ['E02'], { lo: 0, hi: 0.01, tol: 0.1 }),
    ],
  },
  jig: {
    family: 'dance', meters: ['6/8'], group: 'jig', form: 'AABB', bars: 16, bpm: 172,
    rules: [
      F('fig:threeEighths', [EEE], ['E03'], { cal: true, lo: 0.6, hi: 0.9, weight: 2 }),
      F('fig:longShort', [QE], ['E03', 'E04'], { cal: true, lo: 0.05, hi: 0.35 }),
      R('density', 'density', ['E03'], { cal: true, lo: 2.4, hi: 3 }),
    ],
  },
  singleJig: {
    family: 'dance', meters: ['6/8', '12/8'], form: 'AABB', bars: 16, bpm: 186,
    rules: [
      F('fig:longShort', [QE], ['E04'], { lo: 0.45, hi: 0.85, weight: 2 }),
      R('density', 'density', ['E04'], { lo: 1.8, hi: 2.4 }),
      R('motifs', 'motifs', ['E01', 'E04'], { lo: 0.6, hi: 0.9 }),
    ],
  },
  slipJig: {
    family: 'dance', meters: ['9/8'], group: 'slipJig', bars: 16, bpm: 170,
    rules: [
      F('fig:threeEighths', [EEE], ['E05'], { cal: true, lo: 0.45, hi: 0.75, weight: 2 }),
      F('fig:longShort', [QE], ['E05'], { cal: true, lo: 0.2, hi: 0.45 }),
      R('density', 'density', ['E05'], { cal: true, lo: 2.2, hi: 2.9 }),
    ],
  },
  hornpipe: {
    family: 'dance', meters: ['4/4'], group: 'hornpipe', form: 'AABB', bars: 16, bpm: 140,
    rules: [
      F('fig:dotted', [DOT], ['E06'], { cal: true, lo: 0.15, hi: 0.5, weight: 2 }),
      R('threeQuarterEnd', 'threeQuarterEnd', ['E06'], { lo: 0.5, hi: 1, tol: 0.5, weight: 1.5 }),
      R('density', 'density', ['E06'], { cal: true, lo: 1.65, hi: 1.95 }),
    ],
  },
  strathspey: {
    family: 'dance', meters: ['4/4'], group: 'strathspey', bars: 16, bpm: 128,
    rules: [
      F('fig:dotted', [DOT], ['E07'], { cal: true, lo: 0.25, hi: 0.55, weight: 2 }),
      F('fig:snap', [SNAP], ['E07'], { cal: true, lo: 0.05, hi: 0.3, weight: 1.5 }),
      R('density', 'density', ['E07'], { cal: true, lo: 1.85, hi: 2.25 }),
    ],
  },
  polka: {
    family: 'dance', meters: ['2/4'], phraseBars: 4, bars: 16, bpm: 120, mode: 'major',
    rules: [
      F('fig:quickQuick', [ESS, SSE], ['E08', 'E30'], { lo: 0.12, hi: 0.45, weight: 1.5 }),
      F('fig:eighths', [EE], ['E08'], { lo: 0.3, hi: 0.7 }),
      R('density', 'density', ['E08', 'E30'], { lo: 1.8, hi: 2.8 }),
      R('motifs', 'motifs', ['E08'], { lo: 0.6, hi: 0.9 }),
    ],
  },
  march: {
    family: 'dance', meters: ['2/4', '6/8', '4/4'], group: 'march', bars: 16, bpm: 116, mode: 'major',
    rules: [
      F('fig:dotted', [DOT], ['E09'], { cal: true, lo: 0.04, hi: 0.3, weight: 1.5 }),
      F('fig:longShort', [QE], ['E09'], { cal: true, lo: 0.15, hi: 0.45, weight: 1.5 }),
      R('arpeggio', 'arpeggio', ['E47'], { cal: true, lo: 0.2, hi: 0.5, weight: 1.5 }),
      R('density', 'density', ['E09'], { cal: true, lo: 1.2, hi: 2.6 }),
    ],
  },
  waltz: {
    family: 'dance', perform: 'waltz', meters: ['3/4'], phraseBars: 4, bars: 16, bpm: 180,
    rules: [
      R('downbeatLong', 'downbeatLong', ['E10'], { lo: 0.3, hi: 0.8, weight: 2 }),
      R('density', 'density', ['E10'], { lo: 0.6, hi: 1.3 }),
      R('leaps', 'leaps', ['E10'], { lo: 0.08, hi: 0.3 }),
      R('range', 'range', ['E10'], { lo: 10, hi: 19 }),
      R('motifs', 'motifs', ['E10'], { lo: 0.5, hi: 0.9 }),
    ],
  },
  mazurka: {
    family: 'dance', perform: 'mazurka', meters: ['3/4'], phraseBars: 4, bars: 16, bpm: 132,
    rules: [
      F('fig:shortShort', [DOT, EE, ESS], ['E26'], { at: 0, lo: 0.5, hi: 0.9, weight: 1.5 }),
      R('beat2Long', 'beat2Long', ['E26'], { lo: 0.15, hi: 0.5, weight: 1.5 }),
      R('density', 'density', ['E26'], { lo: 1.1, hi: 2 }),
    ],
  },
  polonaise: {
    family: 'dance', meters: ['3/4'], phraseBars: 4, bars: 16, bpm: 96,
    rules: [
      F('fig:polonaise', [ESS], ['E27'], { at: 0, lo: 0.35, hi: 0.8, weight: 2 }),
      R('finalBeat', 'finalBeat', ['E27'], { in: [1], weight: 1.5 }),
      R('density', 'density', ['E27'], { lo: 1.5, hi: 2.6 }),
    ],
  },
  tarantella: {
    family: 'dance', meters: ['6/8', '3/8'], bars: 16, bpm: 190, mode: 'minor',
    rules: [
      F('fig:threeEighths', [EEE], ['E28'], { lo: 0.75, hi: 1, weight: 2 }),
      R('density', 'density', ['E28'], { lo: 2.6, hi: 3 }),
      R('restShare', 'restShare', ['E28'], { lo: 0, hi: 0.02, tol: 0.1 }),
    ],
  },
  vira: {
    family: 'dance', meters: ['6/8', '3/4'], phraseBars: 4, bars: 16, bpm: 180,
    rules: [
      F('fig:longShort', [QE], ['E29'], { lo: 0.25, hi: 0.6, weight: 1.5 }),
      F('fig:threeEighths', [EEE], ['E29'], { lo: 0.25, hi: 0.6 }),
      R('density', 'density', ['E29'], { lo: 1.8, hi: 2.8 }),
      R('motifs', 'motifs', ['E29'], { lo: 0.55, hi: 0.9 }),
    ],
  },
  habanera: {
    family: 'dance', meters: ['2/4'], phraseBars: 4, bars: 16, bpm: 72,
    rules: [
      F('fig:habanera', [DOT], ['E25'], { at: 0, lo: 0.3, hi: 0.8, weight: 2 }),
      F('fig:sincopa', [SES], ['E25'], { lo: 0.05, hi: 0.3 }),
      R('syncBar', 'syncBar', ['E25'], { lo: 0.1, hi: 0.8, weight: 1.5 }),
      R('density', 'density', ['E25'], { lo: 1.5, hi: 2.5 }),
    ],
  },
  // ------------------------------------------------------------------ Renaissance and Baroque
  palestrina: {
    family: 'baroque', perform: 'song', meters: ['4/4'], bpm: 72,
    rules: [
      R('density', 'density', ['G11'], { lo: 0.5, hi: 1.1 }),
      R('steps', 'steps', ['G10', 'G11'], { lo: 0.6, hi: 0.9, weight: 1.5 }),
      R('dissonant', 'dissonant', ['G11'], { lo: 0, hi: 0.005, tol: 0.05, weight: 2 }),
      R('bigLeaps', 'bigLeaps', ['G11'], { lo: 0, hi: 0.03, tol: 0.1 }),
      R('leapChain', 'leapChain', ['G10'], { lo: 0, hi: 0.005, tol: 0.05 }),
      R('recovery', 'recovery', ['G10', 'G11'], { lo: 0.5, hi: 1, weight: 1.5 }),
      R('range', 'range', ['G10', 'G11'], { lo: 8, hi: 13 }),
      R('climaxCount', 'climaxCount', ['G10'], { lo: 1, hi: 2, tol: 2 }),
      F('fig:long', [Q, HOLD4], ['G11'], { lo: 0.8, hi: 1, weight: 1.5 }),
      R('syncBar', 'syncBar', ['G11'], { lo: 0, hi: 0.5 }),
    ],
  },
  chorale: {
    family: 'baroque', perform: 'chorale', meters: ['4/4', '3/4'], group: 'chorale', bpm: 72,
    rules: [
      R('density', 'density', ['E18'], { cal: true, lo: 0.8, hi: 1.15, weight: 1.5 }),
      F('fig:quarters', [Q], ['E18'], { cal: true, lo: 0.6, hi: 0.9, weight: 1.5 }),
      R('steps', 'steps', ['E18'], { cal: true, lo: 0.5, hi: 0.82, weight: 1.5 }),
      R('bigLeaps', 'bigLeaps', ['E18'], { cal: true, lo: 0, hi: 0.03 }),
      R('restShare', 'restShare', ['E18'], { cal: true, lo: 0, hi: 0.05, weight: 0.5 }),
    ],
  },
  minuet: {
    family: 'baroque', meters: ['3/4'], phraseBars: 4, form: 'AABB', bars: 16, bpm: 120,
    rules: [
      F('fig:quarters', [Q], ['E14', 'E17'], { lo: 0.4, hi: 0.75, weight: 1.5 }),
      R('density', 'density', ['E14'], { lo: 1, hi: 1.8 }),
      R('firstOnset', 'firstOnset', ['E14'], { in: [0] }),
      R('motifs', 'motifs', ['E14', 'G14'], { lo: 0.45, hi: 0.85 }),
      R('downbeatLong', 'downbeatLong', ['E14'], { lo: 0, hi: 0.3 }),
    ],
  },
  gavotte: {
    family: 'baroque', meters: ['4/4'], pickup: 8, form: 'AABB', bars: 16, bpm: 100,
    rules: [
      R('firstOnset', 'firstOnset', ['E11'], { pickupOnset: true, weight: 2 }),
      R('leaps', 'leaps', ['E11'], { lo: 0.1, hi: 0.3, weight: 1.5 }),
      R('density', 'density', ['E11'], { lo: 1.2, hi: 2 }),
      F('fig:quartersEighths', [Q, EE], ['E11'], { lo: 0.7, hi: 1 }),
    ],
  },
  bourree: {
    family: 'baroque', meters: ['4/4'], pickup: 4, form: 'AABB', bars: 16, bpm: 132,
    rules: [
      R('firstOnset', 'firstOnset', ['E12'], { pickupOnset: true, weight: 2 }),
      F('fig:eighths', [EE], ['E12'], { lo: 0.35, hi: 0.7 }),
      F('fig:quarters', [Q], ['E12'], { lo: 0.25, hi: 0.6 }),
      R('density', 'density', ['E12'], { lo: 1.4, hi: 2.1 }),
    ],
  },
  sarabande: {
    family: 'baroque', perform: 'sarabande', meters: ['3/4'], phraseBars: 4, form: 'AABB', bars: 16, bpm: 60,
    rules: [
      R('beat2Long', 'beat2Long', ['E13'], { lo: 0.3, hi: 0.8, weight: 2 }),
      R('density', 'density', ['E13'], { lo: 0.8, hi: 1.5 }),
      R('firstOnset', 'firstOnset', ['E13'], { in: [0] }),
      R('finalLength', 'finalLength', ['E13'], { lo: 1.2, hi: 3 }),
    ],
  },
  gigue: {
    family: 'baroque', meters: ['6/8', '12/8'], form: 'AABB', bars: 16, bpm: 150,
    rules: [
      F('fig:threeEighths', [EEE], ['E16'], { lo: 0.5, hi: 0.85, weight: 1.5 }),
      R('leaps', 'leaps', ['E16'], { lo: 0.12, hi: 0.35, weight: 1.5 }),
      R('arpeggio', 'arpeggio', ['E16'], { lo: 0.3, hi: 0.6 }),
      R('density', 'density', ['E16'], { lo: 2.3, hi: 3 }),
      R('range', 'range', ['E16'], { lo: 12, hi: 21 }),
    ],
  },
  siciliana: {
    family: 'baroque', meters: ['6/8', '12/8'], bpm: 75, mode: 'minor',
    rules: [
      F('fig:siciliana', [SIC], ['E15', 'E17'], { lo: 0.25, hi: 0.6, weight: 2 }),
      R('density', 'density', ['E15'], { lo: 1.5, hi: 2.6 }),
      R('steps', 'steps', ['E15'], { lo: 0.5, hi: 0.85 }),
      R('bigLeaps', 'bigLeaps', ['E15'], { lo: 0, hi: 0.05, tol: 0.15 }),
    ],
  },
  passepied: {
    family: 'baroque', meters: ['3/8'], pickup: 2, phraseBars: 8, bars: 16, bpm: 110,
    rules: [
      R('firstOnset', 'firstOnset', ['E38'], { pickupOnset: true, weight: 2 }),
      F('fig:threeEighths', [EEE], ['E38'], { lo: 0.5, hi: 0.9, weight: 1.5 }),
      R('density', 'density', ['E38'], { lo: 2.2, hi: 3 }),
    ],
  },
  allemande: {
    family: 'baroque', meters: ['4/4'], pickup: 1, bpm: 72,
    rules: [
      R('firstOnset', 'firstOnset', ['E37'], { pickupOnset: true, weight: 1.5 }),
      F('fig:sixteenths', [SSSS], ['E37'], { lo: 0.35, hi: 0.8, weight: 2 }),
      R('density', 'density', ['E37'], { lo: 2.3, hi: 3.6 }),
      R('steps', 'steps', ['E37'], { lo: 0.45, hi: 0.8 }),
    ],
  },
  fortspinnung: {
    family: 'baroque', meters: ['4/4', '3/4'], bpm: 90,
    rules: [
      R('sequences', 'sequences', ['E35'], { lo: 0.2, hi: 0.6, weight: 2 }),
      R('density', 'density', ['E35'], { lo: 2, hi: 3.8 }),
      F('fig:sixteenths', [SSSS], ['E35'], { lo: 0.3, hi: 0.8 }),
      R('range', 'range', ['E35'], { lo: 12, hi: 20 }),
    ],
  },
  // ------------------------------------------------------------------ Classical topics
  classical: {
    family: 'classical', meters: ['4/4', '2/4', '3/4'], bpm: 100,
    rules: [
      R('motifs', 'motifs', ['G12', 'G15'], { lo: 0.5, hi: 0.85, weight: 1.5 }),
      R('sequences', 'sequences', ['G12'], { lo: 0.05, hi: 0.4 }),
      R('finalLength', 'finalLength', ['G13', 'G14'], { lo: 1.3, hi: 2.5, weight: 1.5 }),
      R('range', 'range', ['G12'], { lo: 10, hi: 17 }),
      R('climaxCount', 'climaxCount', ['G15'], { lo: 1, hi: 2, tol: 2 }),
      R('steps', 'steps', ['G13'], { lo: 0.45, hi: 0.8 }),
    ],
  },
  hunt: {
    family: 'classical', perform: 'dance', meters: ['6/8'], bars: 16, bpm: 150, mode: 'major',
    rules: [
      R('arpeggio', 'arpeggio', ['E36'], { lo: 0.35, hi: 0.65, weight: 2 }),
      R('repeats', 'repeats', ['E36'], { lo: 0.12, hi: 0.35 }),
      F('fig:jigging', [QE, EEE], ['E36'], { lo: 0.8, hi: 1 }),
      R('density', 'density', ['E36'], { lo: 2, hi: 2.8 }),
    ],
  },
  // ------------------------------------------------------------------ popular music of the 20th century
  blues: {
    family: 'popular', perform: 'blues', meters: ['4/4'], form: 'AAB', bars: 12, phraseBars: 4, bpm: 90, mode: 'minor',
    rules: [
      R('restShare', 'restShare', ['E22'], { lo: 0.15, hi: 0.45, weight: 1.5 }),
      R('syncBar', 'syncBar', ['E22', 'G17'], { lo: 0.3, hi: 1.5, weight: 1.5 }),
      R('pentatonic', 'pentatonic', ['E22', 'G19'], { lo: 0.85, hi: 1, weight: 1.5 }),
      R('repeats', 'repeats', ['E22'], { lo: 0.1, hi: 0.4 }),
      R('motifs', 'motifs', ['E22'], { lo: 0.5, hi: 0.9 }),
      R('range', 'range', ['E22'], { lo: 7, hi: 15 }),
    ],
  },
  jazz: {
    family: 'popular', perform: 'jazz', meters: ['4/4'], bpm: 160,
    rules: [
      R('density', 'density', ['E23'], { lo: 1.8, hi: 2.6 }),
      R('syncBar', 'syncBar', ['E23', 'G17'], { lo: 0.4, hi: 1.8, weight: 1.5 }),
      R('offbeatEnds', 'offbeatEnds', ['E23'], { lo: 0.3, hi: 1, weight: 1.5 }),
      R('leaps', 'leaps', ['E23'], { lo: 0.1, hi: 0.3 }),
      R('arpeggio', 'arpeggio', ['E23'], { lo: 0.3, hi: 0.6 }),
      R('dissonant', 'dissonant', ['E23'], { lo: 0, hi: 0.1 }),
      R('range', 'range', ['E23'], { lo: 12, hi: 22 }),
    ],
  },
  pop: {
    family: 'popular', meters: ['4/4'], bpm: 100,
    rules: [
      R('syncBar', 'syncBar', ['G17', 'G18'], { lo: 0.4, hi: 1.8, weight: 1.5 }),
      R('motifs', 'motifs', ['E24', 'E45'], { lo: 0.6, hi: 0.95, weight: 1.5 }),
      R('repeats', 'repeats', ['E24'], { lo: 0.2, hi: 0.45 }),
      R('inertia', 'inertia', ['G03'], { lo: 0.3, hi: 0.6 }),
      R('pentatonic', 'pentatonic', ['G19'], { lo: 0.8, hi: 1 }),
      R('restShare', 'restShare', ['E24'], { lo: 0.08, hi: 0.3 }),
      R('range', 'range', ['E45'], { lo: 9, hi: 17 }),
    ],
  },
};

export const STYLE_IDS = Object.keys(STYLES);

/** Styles of one family, in the order above. */
export const stylesOf = (family) => STYLE_IDS.filter((id) => STYLES[id].family === family);

const beatLen = (meter) => meterOf(meter).beat;
const applies = (r, meter) => !r.figures || r.figures.every((c) => c.length === beatLen(meter));

/** Quantiles [P10, P50, P90] of a rule measured on real melodies (null if the corpus has none). */
export function calibrated(ruleId, meter, group = null, cal = calibration) {
  const m = meterOf(meter).id;
  const table = group ? cal.styles?.[group] : cal.general;
  if (!table) return null;
  const row = table[m] ?? (m === '12/8' ? table['6/8'] : null) ?? (group ? Object.values(table)[0] : null);
  return row?.[ruleId] ?? null;
}

/**
 * The rules that judge a melody in a meter, with numbers: the style's own rules plus the general
 * ones it does not replace (style = null or 'none': only the general rules).
 */
export function resolveRules(style, meter, cal = calibration) {
  const s = style && style !== 'none' ? STYLES[style] : null;
  const m = meterOf(meter);
  const own = (s?.rules ?? []).filter((r) => applies(r, m.id));
  const ids = new Set(own.map((r) => r.id));
  const all = [...own, ...GENERAL_RULES.filter((r) => !ids.has(r.id))];
  return all.map((r) => {
    const out = { ...r };
    if (r.pickupOnset) out.in = [(m.barLen - (s?.pickup ?? 0)) % m.barLen];
    if (r.cal) {
      // measured on the style's own melodies when the corpus has them; a general rule falls back
      // to every melody of the meter, a style rule to the values of the literature (lo, hi)
      const general = !ids.has(r.id);
      const q = (s?.group ? calibrated(r.id, m.id, s.group, cal) : null) ?? (general ? calibrated(r.id, m.id, null, cal) : null);
      if (q) {
        out.lo = q[0];
        out.hi = q[2];
        out.calibrated = true;
      }
    }
    if (!out.in) out.tol = Math.max(tolOf(r), 0.5 * (out.hi - out.lo));
    return out;
  });
}

/** The settings a style suggests for a meter: meter (kept if the style allows it), phrase, form... */
export function styleSettings(style, currentMeter) {
  const s = STYLES[style];
  if (!s) return null;
  const meter = s.meters.includes(currentMeter) ? currentMeter : s.meters[0];
  return { meter, phraseBars: s.phraseBars ?? null, form: s.form ?? null, bars: s.bars ?? null, bpm: s.bpm ?? null, mode: s.mode ?? null, pickup: s.pickup ?? 0 };
}

// How a style is played (core/expression.js, results/expressao.md): the family's profile unless
// the style names its own (perform), the fado by its expression ('sad' | 'happy'); with no style,
// the general one.
const FAMILY_EXPRESSION = { trad: 'song', dance: 'dance', baroque: 'baroque', classical: 'classical', popular: 'popular' };
export function expressionProfile(style) {
  const s = STYLES[style];
  if (!s) return 'general';
  return s.expression ?? s.perform ?? FAMILY_EXPRESSION[s.family] ?? 'general';
}

/** The style's own changes to the fitness and the playback (fado): {} for the other styles. */
export function styleTraits(style) {
  const s = STYLES[style];
  if (!s) return {};
  const { restTarget, anticipation, cadence, recitation, phrasePeak, expression } = s;
  return Object.fromEntries(Object.entries({ restTarget, anticipation, cadence, recitation, phrasePeak, expression }).filter(([, v]) => v !== undefined));
}
