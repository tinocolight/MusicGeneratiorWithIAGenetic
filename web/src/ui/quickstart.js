// "Início rápido" / Quick start: a floating window with six questions — voices and canon, style,
// kind of music (meter and tempo), total length, attractor waves, key — from which a whole
// starting configuration is derived. The number of bars comes from the length asked for: for the
// meter and the tempo of the answers, the length in the menu that comes closest, with the tempo
// then nudged (at most 20 %) to land near the time asked. A canon counts the time its later
// voices take to finish, a round is heard twice.
//
// deriveQuickStart() is pure (tested in Node); createQuickStart() draws the window.

import { t } from '../i18n/i18n.js';
import { METERS, meterOf } from '../core/meter.js';
import { STYLES, STYLE_FAMILIES, stylesOf } from '../fitness/styles.js';
import { ENSEMBLES } from '../core/instruments.js';
import { SCALE_LABELS } from '../core/theory.js';
import {
  defaultConfig, cloneConfig, applyEnsemble, applyStyle, autoConfigure, autoWaves, presetWaves, BAR_OPTIONS,
} from './config.js';

export const QS_STEPS = ['voices', 'style', 'kind', 'duration', 'waves', 'key'];
export const CANON_ENSEMBLES = ['telemann', 'flutes', 'fifth', 'trio', 'round'];
export const DURATIONS = [15, 30, 45, 60, 90, 120, 180];
export const WAVE_CHOICES = ['auto', 'chaotic', 'two', 'three', 'original'];
export const TEMPI = { slow: 0.72, moderate: 1, lively: 1.3 };
// a moderate tempo when the style does not say (quarter notes per minute)
const METER_BPM = { '2/4': 100, '3/4': 108, '4/4': 96, '3/8': 132, '6/8': 120, '9/8': 132, '12/8': 112 };
const BPM_MIN = 40;
const BPM_MAX = 240;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export const defaultAnswers = () => ({
  voices: 'telemann', style: 'none', meter: '4/4', tempo: 'moderate', seconds: 30, waves: 'auto', scale: 1, mode: null,
});

/** Meters a style allows (every meter without a style). */
export const metersOf = (style) => (STYLES[style] ? STYLES[style].meters : ['2/4', '3/4', '4/4', '3/8', '6/8', '9/8', '12/8']);
/** The meter of the answers, or the style's first one if the style does not use it. */
export const meterFor = (style, meter) => (metersOf(style).includes(meter) ? meter : metersOf(style)[0]);
/** The mode of the answers: chosen, else the style's usual one, else major. */
export const modeFor = (a) => a.mode ?? STYLES[a.style]?.mode ?? 'major';

/** Tempo in quarter notes per minute: the style's (or the meter's) usual one, slower or livelier. */
export function tempoFor(style, meter, character = 'moderate') {
  const base = STYLES[style]?.bpm ?? METER_BPM[meter] ?? 96;
  return clamp(Math.round(base * (TEMPI[character] ?? 1)), BPM_MIN, BPM_MAX);
}

/** "♩ = 96", or "♩. = 80" in a compound meter (the beat is a dotted quarter). */
export function tempoLabel(bpm, meter) {
  return meterOf(meter).compound ? `♩. = ${Math.round((bpm * 2) / 3)}` : `♩ = ${bpm}`;
}

/** How a set of voices stretches the melody: bars added after it, times heard, bars it needs. */
export function canonShape(voices) {
  const e = ENSEMBLES[voices] ?? ENSEMBLES.solo;
  const n = e.voices.length;
  const delays = e.voices.map((v, i) => (i ? v.delayBars ?? i : 0)).sort((a, b) => b - a);
  const round = !!e.circular && n > 1;
  // as the player sounds it: a canon stops when fewer than two voices are left, a round goes round twice
  return { n, reps: round ? 2 : 1, extraBars: round || n < 2 ? 0 : delays[1] ?? 0, need: n > 1 ? Math.max(4, 2 * delays[0] + 4) : 4 };
}

/** Bars (from the menu), tempo and resulting length for a length asked for, in seconds. */
export function lengthFor({ seconds, bpm, meter, voices }) {
  const m = meterOf(meter);
  const shape = canonShape(voices);
  const steps = (seconds * bpm) / 15; // 16ths that fit in the time at this tempo
  const ideal = Math.max(1, (steps / m.barLen - shape.extraBars) / shape.reps);
  const options = BAR_OPTIONS.filter((b) => b >= shape.need);
  const bars = options.reduce((a, b) => (Math.abs(Math.log(b / ideal)) < Math.abs(Math.log(a / ideal)) ? b : a), options[0]);
  const total = (bars * shape.reps + shape.extraBars) * m.barLen;
  // nudge the tempo, at most 20 % either way, to land near the time asked
  const exact = Math.round((total * 15) / seconds);
  const tempo = exact >= bpm * 0.8 && exact <= bpm * 1.25 ? clamp(exact, BPM_MIN, BPM_MAX) : bpm;
  return { bars, bpm: tempo, seconds: (total * 15) / tempo, ideal, need: shape.need };
}

/** Waves for the answer, in the playable range of the voices already set in `c`. */
export function wavesFor(c, choice) {
  if (choice === 'chaotic') return { waves: presetWaves(c, 'rossler'), preset: 'rossler' };
  if (choice === 'two') return { waves: presetWaves(c, 'compound'), preset: 'compound' };
  if (choice === 'original') return { waves: presetWaves(c, 'original'), preset: 'original' };
  if (choice === 'three') {
    const w = presetWaves(c, 'compound');
    const mid = Math.round((w[0].mean + w[1].mean) / 2);
    return { waves: [...w, { type: 'sine', freq: 0.25, mean: mid, amplitude: 3, basin: 2.5, shape: 'gaussian', phase: 0 }], preset: 'custom' };
  }
  return { waves: autoWaves(c), preset: 'custom' };
}

/**
 * The configuration of the answers. Returns {config, bpm, seconds, bars, meter, style}: bpm is the
 * playing tempo of the page (quarter notes per minute), seconds the length it gives.
 */
export function deriveQuickStart(answers, base = defaultConfig()) {
  const a = { ...defaultAnswers(), ...answers };
  const c = cloneConfig(base);
  const style = STYLES[a.style] ? a.style : 'none';
  const meter = meterFor(style, a.meter);
  c.mode = 'field';
  c.style = 'none';
  applyEnsemble(c, ENSEMBLES[a.voices] ? a.voices : 'solo');
  c.meter = meter;
  c.scale = clamp(Math.round(a.scale), 0, 11);
  c.major = modeFor({ ...a, style }) === 'major';
  // waves, form, phrase, weights and GA settings for these voices and this meter...
  autoConfigure(c);
  // ...then the style's rules, phrase and form (its meter is already the one chosen)
  if (style !== 'none') {
    applyStyle(c, style);
    c.meter = meter;
  }
  const tempo = tempoFor(style, meter, a.tempo);
  const len = lengthFor({ seconds: a.seconds, bpm: tempo, meter, voices: a.voices });
  c.bars = len.bars;
  const w = wavesFor(c, a.waves);
  c.waves = w.waves;
  c.wavePreset = w.preset;
  c.ga = { ...c.ga, start: 'seed', ...(a.seed ? { seed: a.seed } : {}) };
  return { config: c, bpm: len.bpm, seconds: len.seconds, bars: len.bars, meter, style, need: len.need };
}

/** "45 s", "1 min", "1 min 30 s". */
export function timeLabel(sec) {
  const s = Math.round(sec);
  if (s < 60) return t('qs.time.s', { s });
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? t('qs.time.minS', { m, s: r }) : t('qs.time.min', { m });
}

// ------------------------------------------------------------------ the window

const STORE = 'ondas-quickstart';
function load() {
  try {
    const a = JSON.parse(localStorage.getItem(STORE) || 'null');
    return a && typeof a === 'object' ? { ...defaultAnswers(), ...a } : defaultAnswers();
  } catch (e) {
    return defaultAnswers();
  }
}
function save(a) {
  try {
    localStorage.setItem(STORE, JSON.stringify(a));
  } catch (e) {
    /* storage unavailable: the answers last until the page is closed */
  }
}

function h(tag, props = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'text') n.textContent = v;
    else if (k === 'className') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) if (c) n.append(c);
  return n;
}

/**
 * The quick-start window. `onApply(result, run)` receives deriveQuickStart's result and whether
 * to generate at once. Returns {open}.
 */
export function createQuickStart({ onApply }) {
  const dlg = document.getElementById('qsDialog');
  let step = 0;
  let a = load();
  // a new seed each time the window opens: the summary shows it and the piece uses it
  let seed = 1;

  const option = (name, value, title, desc, checked, onPick) => h('label', { className: `qs-opt${checked ? ' on' : ''}` }, [
    h('input', { type: 'radio', name: `qs-${name}`, value, checked, onchange: () => onPick(value) }),
    h('span', { className: 'qs-opt-t', text: title }),
    desc ? h('span', { className: 'qs-opt-d', text: desc }) : null,
  ]);
  const set = (k) => (v) => {
    a[k] = v;
    if (k === 'style') {
      a.meter = meterFor(a.style, a.meter);
      a.mode = null; // the style's usual mode until chosen
    }
    render();
  };

  const BODY = {
    voices() {
      return [
        h('p', { className: 'qs-note', text: t('qs.voices.note') }),
        h('div', { className: 'qs-group', text: t('qs.voices.canon') }),
        ...CANON_ENSEMBLES.map((id) => option('voices', id, t(`ensemble.${id}`), null, a.voices === id, set('voices'))),
        h('div', { className: 'qs-group', text: t('qs.voices.single') }),
        option('voices', 'solo', t('ensemble.solo'), t('qs.voices.solo.desc'), a.voices === 'solo', set('voices')),
      ];
    },
    style() {
      const sel = h('select', { id: 'qsStyle', onchange: (e) => set('style')(e.target.value) });
      sel.append(h('option', { value: 'none', text: t('style.none'), selected: a.style === 'none' }));
      for (const fam of STYLE_FAMILIES) {
        const g = h('optgroup', { label: t(`style.family.${fam}`) });
        for (const id of stylesOf(fam)) g.append(h('option', { value: id, text: t(`style.${id}`), selected: a.style === id }));
        sel.append(g);
      }
      const s = STYLES[a.style];
      return [
        h('p', { className: 'hint', text: t('qs.style.hint') }),
        h('label', { className: 'qs-field', for: 'qsStyle' }, [h('span', { text: t('style.label') }), sel]),
        s ? h('p', { className: 'qs-desc', text: t(`style.${a.style}.desc`) }) : null,
        s ? h('p', { className: 'hint', text: t('qs.style.meta', { meters: s.meters.join(', '), tempo: tempoLabel(s.bpm ?? METER_BPM[s.meters[0]], s.meters[0]) }) }) : null,
      ];
    },
    kind() {
      const meters = metersOf(a.style);
      const out = [];
      if (STYLES[a.style]) out.push(h('p', { className: 'hint', text: t('qs.kind.styleMeters', { meters: meters.join(', ') }) }));
      out.push(h('div', { className: 'qs-group', text: t('qs.kind.meter') }));
      for (const id of meters) out.push(option('meter', id, t(`meter.${id}`), t(METERS[id].compound ? 'qs.kind.compound' : 'qs.kind.simple'), a.meter === id, set('meter')));
      out.push(h('div', { className: 'qs-group', text: t('qs.kind.tempo') }));
      const row = h('div', { className: 'qs-row' });
      for (const k of Object.keys(TEMPI)) row.append(option('tempo', k, t(`qs.tempo.${k}`), tempoLabel(tempoFor(a.style, a.meter, k), a.meter), a.tempo === k, set('tempo')));
      out.push(row);
      return out;
    },
    duration() {
      const res = deriveQuickStart(a);
      const row = h('div', { className: 'qs-row wrap' });
      for (const s of DURATIONS) row.append(option('seconds', String(s), timeLabel(s), null, a.seconds === s, (v) => set('seconds')(Number(v))));
      const shape = canonShape(a.voices);
      return [
        h('p', { className: 'hint', text: t('qs.duration.hint') }),
        row,
        h('p', { className: 'qs-calc', text: t('qs.duration.calc', { bars: res.bars, meter: res.meter, tempo: tempoLabel(res.bpm, res.meter), time: timeLabel(res.seconds) }) }),
        shape.n > 1 ? h('p', { className: 'hint', text: t('qs.duration.canon', { need: res.need }) }) : null,
      ];
    },
    waves() {
      return [
        h('p', { className: 'hint', text: t('qs.waves.hint') }),
        ...WAVE_CHOICES.map((k) => option('waves', k, t(`qs.waves.${k}`), t(`qs.waves.${k}.desc`), a.waves === k, set('waves'))),
      ];
    },
    key() {
      const sel = h('select', { id: 'qsScale', onchange: (e) => set('scale')(Number(e.target.value)) });
      SCALE_LABELS.forEach((l, i) => sel.append(h('option', { value: String(i), text: l, selected: a.scale === i })));
      const mode = modeFor(a);
      const row = h('div', { className: 'qs-row two' });
      for (const m of ['major', 'minor']) row.append(option('mode', m, t(`qs.mode.${m}`), null, mode === m, set('mode')));
      const s = STYLES[a.style];
      return [
        h('label', { className: 'qs-field', for: 'qsScale' }, [h('span', { text: t('qs.key.scale') }), sel]),
        h('div', { className: 'qs-group', text: t('qs.key.mode') }),
        row,
        s?.mode ? h('p', { className: 'hint', text: t(`qs.key.styleMode.${s.mode}`) }) : null,
        summary(),
      ];
    },
  };

  function summary() {
    const res = deriveQuickStart({ ...a, seed });
    const c = res.config;
    const rows = [
      [t('qs.sum.voices'), t(`ensemble.${a.voices}`)],
      [t('qs.sum.style'), res.style === 'none' ? t('qs.sum.none') : t(`style.${res.style}`)],
      [t('qs.sum.meter'), `${res.meter} · ${tempoLabel(res.bpm, res.meter)}`],
      [t('qs.sum.length'), t('qs.sum.lengthValue', { bars: res.bars, time: timeLabel(res.seconds) })],
      [t('qs.sum.waves'), t(`qs.waves.${a.waves}`)],
      [t('qs.sum.key'), `${SCALE_LABELS[c.scale]} · ${t(`qs.mode.${c.major ? 'major' : 'minor'}`)}`],
      [t('qs.sum.ga'), t('qs.sum.gaValue', { gens: c.ga.generations, pop: c.ga.popSize, seed: c.ga.seed })],
    ];
    return h('div', { className: 'qs-summary' }, [
      h('div', { className: 'qs-group', text: t('qs.summary') }),
      h('dl', {}, rows.flatMap(([k, v]) => [h('dt', { text: k }), h('dd', { text: v })])),
    ]);
  }

  function render() {
    const id = QS_STEPS[step];
    dlg.querySelector('#qsStep').textContent = t('qs.step', { n: step + 1, total: QS_STEPS.length });
    dlg.querySelector('#qsTitle').textContent = t(`qs.${id}.title`);
    const dots = dlg.querySelector('#qsDots');
    dots.replaceChildren(...QS_STEPS.map((s, i) => h('button', {
      type: 'button', className: `qs-dot${i === step ? ' on' : i < step ? ' done' : ''}`,
      'aria-label': t('qs.goto', { n: i + 1, title: t(`qs.${s}.title`) }), 'aria-current': i === step ? 'step' : null,
      onclick: () => {
        step = i;
        render();
      },
    })));
    dlg.querySelector('#qsBody').replaceChildren(...BODY[id]().filter(Boolean));
    const last = step === QS_STEPS.length - 1;
    dlg.querySelector('#qsBack').disabled = step === 0;
    dlg.querySelector('#qsNext').hidden = last;
    dlg.querySelector('#qsApply').hidden = !last;
    dlg.querySelector('#qsRun').hidden = !last;
    const res = deriveQuickStart(a);
    dlg.querySelector('#qsLive').textContent = `${t(`ensemble.${a.voices}`).split(':')[0]} · ${res.meter} · ${tempoLabel(res.bpm, res.meter)} · ${res.bars} c. ≈ ${timeLabel(res.seconds)}`;
    save(a);
  }

  const finish = (run) => {
    const res = deriveQuickStart({ ...a, seed });
    dlg.close();
    onApply(res, run);
  };
  dlg.querySelector('#qsBack').addEventListener('click', () => {
    step = Math.max(0, step - 1);
    render();
  });
  dlg.querySelector('#qsNext').addEventListener('click', () => {
    step = Math.min(QS_STEPS.length - 1, step + 1);
    render();
    dlg.querySelector('#qsNext:not([hidden]), #qsRun:not([hidden])')?.focus();
  });
  dlg.querySelector('#qsApply').addEventListener('click', () => finish(false));
  dlg.querySelector('#qsRun').addEventListener('click', () => finish(true));
  dlg.querySelector('#qsClose').addEventListener('click', () => dlg.close());
  // a click on the backdrop (outside the window) closes it
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();
  });

  return {
    open() {
      step = 0;
      a = load();
      seed = 1 + Math.floor(Math.random() * 99999);
      render();
      dlg.showModal();
      dlg.querySelector('#qsNext').focus();
    },
    refresh() {
      if (dlg.open) render();
    },
  };
}
