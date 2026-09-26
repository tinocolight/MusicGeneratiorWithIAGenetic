// Composition settings: one plain object that drives generation, playback, export and the
// experiment history, plus the optional "auto-configure" helpers.

import { STEPS_PER_BAR, GENE_A4 } from '../core/score.js';
import { keyFromScale, MAJOR_TONICS } from '../core/theory.js';
import { INSTRUMENTS, ENSEMBLES, instrument } from '../core/instruments.js';
import { INTERVALS, intervalMap } from '../fitness/canon.js';
import { createClassicFitness, CLASSIC_DEFAULTS } from '../fitness/classic.js';
import classicPresetsData from '../data/classic-presets.js';
import { createAttractorFitness, DEFAULT_WEIGHTS } from '../fitness/attractor.js';
import { WAVE_PRESETS, resolvePreset } from '../fitness/presets.js';
import { analyzePiece } from '../analysis/wavefit.js';
import { LEARNED_WEIGHTS } from '../data/learned-weights.js';

export const WEIGHT_PRESETS = {
  default: { label: 'Por omissão', weights: () => ({ ...DEFAULT_WEIGHTS }) },
  learned: { label: 'Aprendidos da música real', weights: () => ({ ...DEFAULT_WEIGHTS, ...LEARNED_WEIGHTS }) },
  counterpoint: { label: 'Ênfase no contraponto', weights: () => ({ ...DEFAULT_WEIGHTS, canon: 10 }) },
  waves: { label: 'Ênfase nas ondas', weights: () => ({ ...DEFAULT_WEIGHTS, attractor: 8 }) },
};

export function defaultConfig() {
  return {
    mode: 'field',
    scale: 1,
    major: true,
    bars: 8,
    form: "AA'BA'",
    phraseBars: 2,
    ensemble: 'solo',
    voices: [
      { instrument: 'violin' },
      { enabled: false, instrument: 'violin', delayBars: 1, interval: 'unison' },
      { enabled: false, instrument: 'cello', delayBars: 2, interval: 'octaveDown' },
    ],
    circular: false,
    wavePreset: 'arch',
    waveDef: 'meanAmp',
    waves: resolvePreset('arch', 7),
    weightsPreset: 'default',
    weights: { ...DEFAULT_WEIGHTS },
    canonWeight: 6,
    // reward each rule only up to its typical value in real melodies (results/blocks.md)
    capRules: true,
    classicG1: { ...CLASSIC_DEFAULTS.g1 },
    classicG2: { ...CLASSIC_DEFAULTS.g2 },
    // the two waves of the original form (Form1): periods per measure, mean in half tones
    // (A4 = 0), amplitude and attraction basin in half tones, horizontal shift (16 = one cycle)
    classicWaves: defaultClassicWaves(),
    classicFirstRun: false,
    // constants that the original hard-coded (Âmbito ±15 around A4, balance [7, 40] %) and the
    // correction of its lapses (src/fitness/classic.js); starting combination (results/classic-study.md)
    classicPreset: 'original',
    classicRange: CLASSIC_DEFAULTS.rangeAttractor,
    classicBalanceMin: CLASSIC_DEFAULTS.balanceMin,
    classicBalanceMax: CLASSIC_DEFAULTS.balanceMax,
    classicPhase1: CLASSIC_DEFAULTS.phase1Fraction,
    classicFixLapses: true,
    // start: 'seed' (from scratch with the seed), 'newSeed' (from scratch, new seed each time),
    // 'continue' (from the previous final population); init: 'auto' | 'musical' | 'random'
    ga: { generations: 600, popSize: 80, mutation: 0.9, operators: 'musical', seed: 7, start: 'seed', init: 'blocks' },
  };
}

// Measured (results/openings.md): for a single melody the corpus blocks (initial population and
// mutation) make the melodies more typical at almost no cost to the critic; the idiom rule in the
// fitness lowers the critic (24 seeds: 0.91 without it, 0.87 at 0.75, 0.84 at 1.5), so it stays
// at 0 unless chosen. In a canon the blocks cost counterpoint: the canon-aware population is kept.
/** Default initial population for the number of voices, unless the user chose another. */
export function adaptToVoices(c) {
  const canon = activeVoices(c).length >= 2;
  if (c.ga.init === 'blocks' || c.ga.init === 'auto') c.ga.init = canon ? 'auto' : 'blocks';
  return c;
}

const CLASSIC_PRESET_HINTS = {
  song: 'Calibrada em canções populares reais (Essen): notas mais longas, graus conjuntos, final na tónica.',
  dance: 'Calibrada em danças reais (reels e hornpipes irlandeses e escoceses): figuração mais rápida e âmbito maior.',
  chorale: 'Calibrada em sopranos de corais de Bach: semínimas e mínimas, movimento por grau, cadências 3–2–1.',
};

// Starting combinations for the original algorithm: its own values, and three calibrated on real
// songs, dances and chorales (tools/classic_study.mjs, results/classic-study.md).
export const CLASSIC_PRESETS = [
  {
    id: 'original', label: 'Original (2020)',
    hint: 'Os valores do programa original: muitas semicolcheias, saltos grandes, âmbito de várias oitavas.',
    g1: { ...CLASSIC_DEFAULTS.g1 }, g2: { ...CLASSIC_DEFAULTS.g2 },
    waves: null, rangeAttractor: CLASSIC_DEFAULTS.rangeAttractor, balanceMin: CLASSIC_DEFAULTS.balanceMin,
    balanceMax: CLASSIC_DEFAULTS.balanceMax, phase1Fraction: CLASSIC_DEFAULTS.phase1Fraction,
    ga: { generations: 1500, popSize: 60, mutation: 0.1, operators: 'binary' },
  },
  ...classicPresetsData.map((p) => ({ ...p, hint: CLASSIC_PRESET_HINTS[p.id] ?? '' })),
];
// the GA settings of the page for each kind of operators (the original values keep their weights)
const CLASSIC_GA = {
  binary: { generations: 1500, popSize: 60, mutation: 0.1, operators: 'binary' },
  musical: { generations: 600, popSize: 80, mutation: 0.9, operators: 'musical' },
};

/**
 * Apply a starting combination to the classic settings (the seed and the piece stay). Each style
 * has values tuned for the musical operators and for the original bit operators; the current
 * choice of operators picks them.
 */
export function applyClassicPreset(c, id, operators = c.ga?.operators === 'musical' ? 'musical' : 'binary') {
  const found = CLASSIC_PRESETS.find((x) => x.id === id) ?? CLASSIC_PRESETS[0];
  const p = operators === 'binary' && found.binary ? { ...found.binary, hint: found.hint } : found;
  c.classicPreset = p.id;
  c.classicG1 = { ...CLASSIC_DEFAULTS.g1, ...p.g1 };
  c.classicG2 = { ...CLASSIC_DEFAULTS.g2, ...p.g2 };
  c.classicWaves = p.waves ? p.waves.map((w) => ({ ...w })) : defaultClassicWaves();
  c.classicRange = p.rangeAttractor;
  c.classicBalanceMin = p.balanceMin;
  c.classicBalanceMax = p.balanceMax;
  c.classicPhase1 = p.phase1Fraction;
  if (p.id !== 'original') c.classicFixLapses = true; // calibrated with the lapses fixed
  c.classicFirstRun = false;
  c.ga = { ...c.ga, ...(p.id === 'original' ? CLASSIC_GA[operators] : { ...p.ga, operators }) };
  return c;
}

export function defaultClassicWaves() {
  return CLASSIC_DEFAULTS.waves.map((w) => ({ periods: w.periodsPerBar, meanA4: w.mean - GENE_A4, amplitude: w.amplitude, basin: w.threshold, shift: w.shift }));
}

/** Editor values -> the classic fitness' wave specs (integers where the C# form used int.Parse). */
export function classicWaveSpecs(c) {
  return (c.classicWaves ?? defaultClassicWaves()).map((w) => ({
    threshold: Math.max(0, Math.round(w.basin)),
    periodsPerBar: Math.max(0.01, w.periods),
    amplitude: Math.round(w.amplitude),
    mean: GENE_A4 + Math.round(w.meanA4),
    shift: Math.round(w.shift),
  }));
}

export const cloneConfig = (c) => JSON.parse(JSON.stringify(c));
export const keyOf = (c) => keyFromScale(c.scale, c.major);

/** Leader + enabled followers, in order. */
export function activeVoices(c) {
  return [c.voices[0], ...c.voices.slice(1).filter((v) => v.enabled)];
}

/** Voices ready for the analysis / player: delay in steps, pitch map, range. */
export function voiceSpecs(c, barLen = STEPS_PER_BAR) {
  const key = keyOf(c);
  return activeVoices(c).map((v, i) => ({
    instrument: v.instrument,
    delay: i === 0 ? 0 : Math.round(v.delayBars * barLen),
    delayBars: i === 0 ? 0 : v.delayBars,
    interval: i === 0 ? 'unison' : v.interval,
    map: i === 0 ? (p) => p : intervalMap(v.interval, key),
    range: instrument(v.instrument).range,
  }));
}

export function applyEnsemble(c, id) {
  const e = ENSEMBLES[id];
  if (!e) return c;
  c.ensemble = id;
  c.voices[0] = { instrument: e.voices[0].instrument };
  for (let i = 1; i < 3; i++) {
    const v = e.voices[i];
    c.voices[i] = v ? { enabled: true, ...v } : { ...c.voices[i], enabled: false };
  }
  c.circular = !!e.circular;
  return adaptToVoices(c);
}

// ------------------------------------------------------------------ fitness

export function buildFitness(c) {
  const key = keyOf(c);
  const seed = c.ga.seed || 1;
  const specs = voiceSpecs(c);
  if (c.mode === 'classic') {
    const followers = specs.slice(1);
    const waveSpecs = classicWaveSpecs(c);
    const fit = createClassicFitness({
      scale: c.scale, major: c.major, bars: c.bars, g1: c.classicG1, g2: c.classicG2,
      waves: waveSpecs,
      firstRunBug: !!c.classicFirstRun,
      rangeAttractor: c.classicRange ?? CLASSIC_DEFAULTS.rangeAttractor,
      balanceMin: c.classicBalanceMin ?? CLASSIC_DEFAULTS.balanceMin,
      balanceMax: c.classicBalanceMax ?? CLASSIC_DEFAULTS.balanceMax,
      phase1Fraction: c.classicPhase1 ?? CLASSIC_DEFAULTS.phase1Fraction,
      fixLapses: c.classicFixLapses ?? true,
      // the original self-harmonisation rules compare with the bars where the other voices enter
      selfHarmDistances: [followers[0]?.delayBars ?? 1, followers[1]?.delayBars ?? 2],
    });
    return {
      mode: 'classic', fit, key,
      waves: fit.waves.map((values, i) => ({ values, basin: waveSpecs[i].threshold, shape: 'step' })),
      env: { key, waves: fit.waves, basin: 3, lowMidi: 48, highMidi: 96, length: fit.length, stepsPerBar: STEPS_PER_BAR },
    };
  }
  const weights = { ...c.weights, canon: specs.length >= 2 ? c.canonWeight : 0 };
  const fit = createAttractorFitness({
    bars: c.bars,
    tonic: key.tonic,
    mode: key.mode,
    waves: c.waves,
    form: c.form,
    phraseBars: c.phraseBars,
    weights,
    voices: activeVoices(c),
    circular: c.circular,
    seed,
    caps: !!c.capRules,
    blocks: c.ga.init === 'blocks',
  });
  return {
    mode: 'field', fit, key,
    waves: fit.waves.map((values, i) => ({ values, basin: fit.basins[i], shape: c.waves[i].shape ?? 'gaussian' })),
    env: fit.env,
  };
}

// ------------------------------------------------------------------ auto-configuration

// approximate semitone size of each voice interval (diatonic ones vary by a semitone)
const intervalSemitones = (name) => {
  const iv = INTERVALS[name] ?? INTERVALS.unison;
  return iv.semitones ?? Math.round((iv.degrees * 12) / 7);
};

/** Pitch range the melody can use so that every active voice stays within its instrument. */
export function playableRange(c) {
  let lo = -Infinity;
  let hi = Infinity;
  activeVoices(c).forEach((v, i) => {
    const s = i === 0 ? 0 : intervalSemitones(v.interval);
    const [a, b] = instrument(v.instrument).range;
    lo = Math.max(lo, a - s);
    hi = Math.min(hi, b - s);
  });
  if (hi - lo < 7) [lo, hi] = instrument(c.voices[0].instrument).range;
  return [lo, hi];
}

/** Waves that fit the instruments: one phrase arch for a melody, a slow sine for a canon. */
export function autoWaves(c) {
  const [lo, hi] = playableRange(c);
  const a = lo + 0.15 * (hi - lo);
  const b = hi - 0.2 * (hi - lo);
  const center = (a + b) / 2;
  const voices = activeVoices(c);
  const basin = Math.max(2, Math.min(4, (b - a) / 6));
  if (voices.length >= 2) {
    const d = voices[1].delayBars || 1;
    return [{ type: 'sine', freq: +(1 / (voices.length * d)).toFixed(4), mean: Math.round(center), amplitude: Math.min(7, Math.round((b - a) * 0.4)), basin: +basin.toFixed(1), shape: 'gaussian', phase: 0 }];
  }
  return [{ type: 'arch', freq: +(1 / c.phraseBars).toFixed(4), mean: Math.round(center + 1), amplitude: Math.min(4, Math.max(2, Math.round((b - a) / 4))), basin: +basin.toFixed(1), shape: 'gaussian', phase: 0 }];
}

/** Everything from general criteria: waves, form, length, weights and GA settings. */
export function autoConfigure(c) {
  const voices = activeVoices(c);
  const canon = voices.length >= 2;
  c.mode = 'field';
  c.waves = autoWaves(c);
  c.wavePreset = 'custom';
  c.form = canon ? 'none' : "AA'BA'";
  c.phraseBars = 2;
  const last = voices.length ? Math.max(...voices.map((v) => v.delayBars || 0)) : 0;
  c.bars = canon ? Math.max(8, Math.ceil((2 * last + 4) / 2) * 2) : 8;
  if (c.bars > 16) c.bars = 16;
  c.weightsPreset = 'default';
  c.weights = { ...DEFAULT_WEIGHTS };
  c.capRules = true;
  if (c.ga.init === 'auto' || c.ga.init === 'blocks') c.ga.init = canon ? 'auto' : 'blocks';
  c.canonWeight = 6;
  // from noise the GA needs 2-3 times more generations to reach the same fitness
  const random = c.ga.init === 'random';
  c.ga = { ...c.ga, generations: random ? (canon ? 2000 : 1500) : canon ? 800 : 600, popSize: 80, mutation: 0.9, operators: 'musical' };
  return c;
}

/** Waves of a preset, moved into the playable range of the current instruments. */
export function presetWaves(c, name) {
  const key = keyOf(c);
  const voices = activeVoices(c);
  const waves = resolvePreset(name, key.tonic, { voices: voices.length, delayBars: voices[1]?.delayBars ?? 1 });
  return fitIntoRange(c, waves);
}

function fitIntoRange(c, waves) {
  const [lo, hi] = playableRange(c);
  const center = (lo + hi) / 2;
  const avg = waves.reduce((a, w) => a + w.mean, 0) / waves.length;
  let shift = 0;
  while (avg + shift < lo + 3) shift += 12;
  while (avg + shift > hi - 3) shift -= 12;
  if (Math.abs(avg + shift - center) > 9) shift += Math.round((center - (avg + shift)) / 12) * 12;
  return waves.map((w) => ({ ...w, mean: w.mean + shift }));
}

/** Waves copied from a real melody of the corpus (same mode), transposed to the current key. */
export function wavesFromRealMelody(c, corpus, rng) {
  const key = keyOf(c);
  const pool = corpus.filter((m) => m.mode === key.mode && m.barLen === 16);
  const m = rng.pick(pool.length ? pool : corpus);
  const res = analyzePiece(m.events, { segments: 1, mode: 'equal', barLen: m.barLen });
  const fit = res.segments[0].fit;
  if (!fit) return null;
  let shift = ((key.tonic - m.tonic) % 12 + 12) % 12;
  if (shift > 6) shift -= 12;
  const waves = fit.waves.map((w) => ({
    type: w.freq ? 'sine' : 'flat',
    freq: +(w.freq || 0.25).toFixed(4),
    mean: +(w.mean + shift).toFixed(1),
    amplitude: +w.amplitude.toFixed(1),
    basin: +Math.max(1.5, Math.min(4, w.basin)).toFixed(1),
    shape: 'gaussian',
    // sine phase in 16ths: value = mean + A sin(2*pi*f*t/bar + phi)
    phase: w.freq ? +((w.phase * STEPS_PER_BAR) / (2 * Math.PI * w.freq)).toFixed(1) : 0,
  }));
  return { waves: fitIntoRange(c, waves), title: m.title, source: m.source };
}

/** A random but sensible configuration, for exploring. */
export function surprise(c, rng) {
  c.scale = rng.int(0, 11);
  c.major = rng.chance(0.65);
  applyEnsemble(c, rng.pick(Object.keys(ENSEMBLES)));
  autoConfigure(c);
  const canon = activeVoices(c).length >= 2;
  const presets = ['arch', 'pink', 'rossler', 'lorenz', 'compound', ...(canon ? ['canon', 'canon'] : [])];
  c.wavePreset = rng.pick(presets);
  c.waves = presetWaves(c, c.wavePreset);
  if (!canon) c.form = rng.pick(["AA'BA'", "ABA'C", 'ABAB', 'AABA']);
  c.ga.seed = rng.int(1, 99999);
  return c;
}

/** One-line description, for the experiment list. */
export function describe(c) {
  const key = keyOf(c);
  const names = ['Dó', 'Dó#', 'Ré', 'Mib', 'Mi', 'Fá', 'Fá#', 'Sol', 'Láb', 'Lá', 'Sib', 'Si'];
  const voices = activeVoices(c);
  const vtxt = voices.map((v, i) => `${instrument(v.instrument).label}${i ? ` (c.${1 + v.delayBars}${v.interval !== 'unison' ? `, ${INTERVALS[v.interval].label}` : ''})` : ''}`).join(' + ');
  const wtxt = c.mode === 'classic' ? 'regras originais' : `${c.waves.length} onda${c.waves.length > 1 ? 's' : ''} (${c.waves.map((w) => w.type).join(', ')})`;
  return `${names[key.tonic]} ${key.mode === 'major' ? 'maior' : 'menor'} · ${vtxt} · ${wtxt}`;
}

export { INSTRUMENTS, ENSEMBLES, WAVE_PRESETS, INTERVALS, MAJOR_TONICS };
