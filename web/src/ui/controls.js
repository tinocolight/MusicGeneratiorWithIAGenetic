// "Compor" controls bound to the configuration object: voices, wave editor, weights, GA.
// Every edit mutates the config and calls onChange(kind) — kind = 'waves' | 'voices' |
// 'piece' | 'weights' | 'ga' — so the page can refresh the preview and the chips.

import { midiName } from '../core/score.js';
import { SCALE_LABELS } from '../core/theory.js';
import { INSTRUMENTS, ENSEMBLES, instrument } from '../core/instruments.js';
import { WAVE_TYPES } from '../core/waves.js';
import { INTERVALS } from '../fitness/canon.js';
import { FORMS } from '../fitness/attractor.js';
import { WAVE_PRESETS } from '../fitness/presets.js';
import { hz } from '../analysis/wavefit.js';
import { activeVoices, playableRange, presetWaves, defaultClassicWaves, WEIGHT_PRESETS } from './config.js';

const $ = (id) => document.getElementById(id);

export const FIELD_LABELS = {
  key: 'Tonalidade (perfil K-K)',
  attractor: 'Bacias das ondas',
  proximity: 'Proximidade (Temperley)',
  regression: 'Retorno após salto',
  forces: 'Forças melódicas',
  metric: 'Hierarquia métrica',
  cadence: 'Cadências',
  rhythm: 'Ritmo e pausas',
  form: 'Forma',
  tension: 'Onda de tensão',
  variety: 'Variedade',
  canon: 'Contraponto entre as vozes',
};

export const CLASSIC_LABELS = {
  rhythmicPatterns: 'Padrões rítmicos',
  selfHarm1: 'Auto-harmonização (2.ª voz)',
  selfHarm2: 'Auto-harmonização (3.ª voz)',
  aba: 'Repetição a 4 compassos',
  leitmotif: 'Leitmotiv rítmico',
  wave1: 'Onda 1',
  wave2: 'Onda 2',
  range: 'Âmbito',
  scale: 'Escala',
  pauseProlongation: 'Pausas e prolongamentos',
  reduceRepetitions: 'Repetições excessivas',
  intervals: 'Intervalos',
  niceRepetitions: 'Repetições interessantes',
  ending: 'Final',
  balance: 'Equilíbrio notas/pausas',
};

const BASIN_LABELS = { gaussian: 'Gaussiana', gravity: 'Gravitacional 1/(1+d²)', step: 'Degraus (C#)' };
const noteLabel = (m) => {
  const r = Math.round(m);
  const name = Math.abs(m - r) <= 0.25 ? midiName(r) : `${midiName(Math.floor(m))}–${midiName(Math.ceil(m))}`;
  return `${name} · ${hz(m).toFixed(0)} Hz`;
};

function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c) e.append(c);
  return e;
}

function options(sel, entries, value) {
  sel.innerHTML = '';
  for (const [v, label] of entries) {
    const o = el('option', { value: v, text: label });
    if (String(v) === String(value)) o.selected = true;
    sel.append(o);
  }
}

function instrumentSelect(id, value, onChange) {
  const sel = el('select', { id, 'aria-label': 'Instrumento' });
  const byFamily = {};
  for (const [k, v] of Object.entries(INSTRUMENTS)) (byFamily[v.family] ||= []).push([k, v.label]);
  for (const [fam, list] of Object.entries(byFamily)) {
    const g = el('optgroup', { label: fam });
    for (const [k, label] of list) {
      const o = el('option', { value: k, text: label });
      if (k === value) o.selected = true;
      g.append(o);
    }
    sel.append(g);
  }
  sel.addEventListener('change', () => onChange(sel.value));
  return sel;
}

export function createControls(getConfig, onChange) {
  const cfg = () => getConfig();

  // ---------------------------------------------------------------- piece
  function renderPiece() {
    const c = cfg();
    $('mode').value = c.mode;
    options($('scale'), SCALE_LABELS.map((l, i) => [i, l]), c.scale);
    $('major').value = c.major ? '1' : '0';
    $('bars').value = String(c.bars);
    options($('form'), Object.keys(FORMS).map((k) => [k, k === 'none' ? 'Livre' : k.replace(/'/g, '′')]), c.form);
    $('phraseBars').value = String(c.phraseBars);
    const classic = c.mode === 'classic';
    $('wavesSection').hidden = classic;
    $('classicWavesSection').hidden = !classic;
    $('formRow').hidden = classic;
    $('phraseRow').hidden = classic;
  }

  // ---------------------------------------------------------------- voices
  function renderVoices() {
    const c = cfg();
    options($('ensemble'), [...Object.entries(ENSEMBLES).map(([k, e]) => [k, e.label]), ['custom', 'Personalizado']], c.ensemble);
    const box = $('voiceRows');
    box.innerHTML = '';
    const entryOptions = Array.from({ length: 8 }, (_, i) => [i + 1, `entra no c. ${i + 2}`]);
    const intervalOptions = Object.entries(INTERVALS).map(([k, v]) => [k, v.label]);
    c.voices.forEach((v, i) => {
      const colour = ['var(--note)', 'var(--follower)', 'var(--voice-3)'][i];
      const name = el('span', { class: 'vname' }, [el('span', { class: 'swatch', style: `background:${colour}` }), i === 0 ? 'Voz 1 (melodia)' : `Voz ${i + 1}`]);
      const inst = instrumentSelect(`voice${i}-inst`, v.instrument, (val) => {
        v.instrument = val;
        c.ensemble = 'custom';
        onChange('voices');
      });
      const row = el('div', { class: 'voice-row' }, [name, inst]);
      if (i > 0) {
        const on = el('input', { type: 'checkbox', id: `voice${i}-on` });
        on.checked = !!v.enabled;
        on.addEventListener('change', () => {
          v.enabled = on.checked;
          if (i === 2 && on.checked && !c.voices[1].enabled) c.voices[1].enabled = true;
          if (i === 1 && !on.checked) c.voices[2].enabled = false;
          c.ensemble = 'custom';
          renderVoices();
          onChange('voices');
        });
        const delay = el('select', { id: `voice${i}-delay`, 'aria-label': `Entrada da voz ${i + 1}` });
        options(delay, entryOptions, v.delayBars);
        delay.addEventListener('change', () => {
          v.delayBars = Number(delay.value);
          c.ensemble = 'custom';
          onChange('voices');
        });
        const interval = el('select', { id: `voice${i}-interval`, 'aria-label': `Intervalo da voz ${i + 1}` });
        options(interval, intervalOptions, v.interval);
        interval.addEventListener('change', () => {
          v.interval = interval.value;
          c.ensemble = 'custom';
          onChange('voices');
        });
        delay.disabled = interval.disabled = inst.disabled = !v.enabled;
        row.append(el('div', { class: 'vsub' }, [el('label', { for: on.id }, [on, ' tocar']), delay, interval]));
      }
      box.append(row);
    });
    $('circular').checked = !!c.circular;
    voicesHint();
  }

  function voicesHint() {
    const c = cfg();
    const voices = activeVoices(c);
    const [lo, hi] = playableRange(c);
    let txt = `Registo possível para a melodia com estes instrumentos: ${midiName(lo)}–${midiName(hi)}.`;
    if (voices.length >= 2) {
      txt += ' O contraponto entre as vozes entra na aptidão e na população inicial desde a 1.ª geração.';
      const d = voices.slice(1).map((v) => v.delayBars);
      if (new Set(d).size < d.length) txt += ' Atenção: duas vozes entram no mesmo compasso (dobram-se).';
      if (Math.max(...d) >= c.bars) txt += ' Atenção: há uma voz que entra depois de a melodia acabar; aumente o número de compassos.';
    }
    $('voicesHint').textContent = txt;
  }

  // ---------------------------------------------------------------- waves
  function renderWaves() {
    const c = cfg();
    options($('preset'), [...Object.entries(WAVE_PRESETS).map(([k, p]) => [k, p.label]), ['custom', 'Personalizado']], c.wavePreset);
    $('waveDef').value = c.waveDef;
    const box = $('waveCards');
    box.innerHTML = '';
    c.waves.forEach((w, i) => box.append(waveCard(w, i)));
    $('addWave').disabled = c.waves.length >= 4;
    wavesHint();
  }

  function numberInput(id, value, step, onInput, extra = {}) {
    const inp = el('input', { type: 'number', id, step: String(step), value: String(+(+value).toFixed(3)), ...extra });
    inp.addEventListener('input', () => {
      const v = Number(inp.value);
      if (Number.isFinite(v)) onInput(v);
    });
    return inp;
  }

  function waveCard(w, i) {
    const c = cfg();
    const changed = () => {
      c.wavePreset = 'custom';
      $('preset').value = 'custom';
      onChange('waves');
      wavesHint();
    };
    const type = el('select', { id: `w${i}-type`, 'aria-label': `Tipo da onda ${i + 1}` });
    options(type, Object.entries(WAVE_TYPES), w.type);
    type.addEventListener('change', () => {
      w.type = type.value;
      renderWaves();
      changed();
    });
    const remove = el('button', { class: 'x', type: 'button', title: 'Remover onda', 'aria-label': `Remover onda ${i + 1}`, text: '×' });
    remove.disabled = c.waves.length <= 1;
    remove.addEventListener('click', () => {
      c.waves.splice(i, 1);
      renderWaves();
      changed();
    });
    const head = el('div', { class: 'wave-head' }, [el('span', { class: 'wave-tag', style: `background:var(--wave-${(i % 4) + 1})` }), el('strong', { text: `Onda ${i + 1}` }), type, remove]);

    const cycles = el('small');
    const setCycles = () => (cycles.textContent = w.type === 'flat' ? 'sem oscilação' : `1 ciclo em ${(1 / w.freq).toFixed(2)} c.`);
    setCycles();
    const freq = numberInput(`w${i}-freq`, w.freq, 0.05, (v) => {
      w.freq = Math.max(0.01, v);
      setCycles();
      changed();
    }, { min: '0.01', max: '8' });
    freq.disabled = w.type === 'flat';
    const phase = numberInput(`w${i}-phase`, (w.phase ?? 0) / 4, 0.25, (v) => {
      w.phase = v * 4;
      changed();
    });
    const randomPhase = w.type === 'pink' || w.type === 'rossler' || w.type === 'lorenz';
    phase.disabled = randomPhase || w.type === 'flat';

    const noteHint = (m) => el('small', { text: noteLabel(m) });
    let heightFields;
    if (c.waveDef === 'minMax') {
      const minHint = noteHint(w.mean - w.amplitude);
      const maxHint = noteHint(w.mean + w.amplitude);
      const lo = numberInput(`w${i}-min`, w.mean - w.amplitude, 0.5, (v) => {
        const hi = w.mean + w.amplitude;
        w.mean = (v + hi) / 2;
        w.amplitude = Math.abs(hi - v) / 2;
        minHint.textContent = noteLabel(v);
        changed();
      });
      const hi = numberInput(`w${i}-max`, w.mean + w.amplitude, 0.5, (v) => {
        const low = w.mean - w.amplitude;
        w.mean = (low + v) / 2;
        w.amplitude = Math.abs(v - low) / 2;
        maxHint.textContent = noteLabel(v);
        changed();
      });
      heightFields = [
        el('label', { for: lo.id }, ['Mínimo (MIDI)', lo, minHint]),
        el('label', { for: hi.id }, ['Máximo (MIDI)', hi, maxHint]),
      ];
    } else {
      const meanHint = noteHint(w.mean);
      const mean = numberInput(`w${i}-mean`, w.mean, 0.5, (v) => {
        w.mean = v;
        meanHint.textContent = noteLabel(v);
        changed();
      });
      const amp = numberInput(`w${i}-amp`, w.amplitude, 0.5, (v) => {
        w.amplitude = Math.max(0, v);
        changed();
      }, { min: '0' });
      heightFields = [
        el('label', { for: mean.id }, ['Valor médio (MIDI)', mean, meanHint]),
        el('label', { for: amp.id }, ['Amplitude (± semitons)', amp, el('small', { text: 'metade da variação' })]),
      ];
    }
    const basin = numberInput(`w${i}-basin`, w.basin ?? 3, 0.5, (v) => {
      w.basin = Math.max(0.5, v);
      changed();
    }, { min: '0.5' });
    const shape = el('select', { id: `w${i}-shape` });
    options(shape, Object.entries(BASIN_LABELS), w.shape ?? 'gaussian');
    shape.addEventListener('change', () => {
      w.shape = shape.value;
      changed();
    });
    const grid = el('div', { class: 'wave-grid' }, [
      el('label', { for: freq.id }, ['Frequência (ciclos/compasso)', freq, cycles]),
      el('label', { for: phase.id }, ['Desfasamento (tempos)', phase, el('small', { text: randomPhase ? 'início aleatório (atrator)' : 'desloca a onda no tempo' })]),
      ...heightFields,
      el('label', { for: basin.id }, ['Bacia σ (semitons)', basin, el('small', { text: 'alcance da atração' })]),
      el('label', { for: shape.id }, ['Forma da bacia', shape, el('small', { text: 'como a atração decai' })]),
    ]);
    return el('div', { class: 'wave-card' }, [head, grid]);
  }

  function wavesHint() {
    const c = cfg();
    const [lo, hi] = playableRange(c);
    const out = c.waves.filter((w) => w.mean - w.amplitude < lo - 2 || w.mean + w.amplitude > hi + 2);
    const el2 = $('wavesHint');
    el2.className = out.length ? 'hint warn-text' : 'hint';
    el2.textContent = out.length
      ? `Onda fora do registo possível (${midiName(lo)}–${midiName(hi)}): as notas vão ser puxadas para fora do alcance dos instrumentos.`
      : `As ondas cabem no registo possível (${midiName(lo)}–${midiName(hi)}). A linha tracejada na partitura mostra-as antes de gerar.`;
  }

  // ---------------------------------------------------------------- classic waves (C# form)
  function renderClassicWaves() {
    const c = cfg();
    c.classicWaves ||= defaultClassicWaves();
    const box = $('classicWaveCards');
    box.innerHTML = '';
    c.classicWaves.forEach((w, i) => {
      const changed = () => onChange('waves');
      const periodHint = el('small');
      const setPeriod = () => (periodHint.textContent = `1 ciclo em ${(1 / Math.max(0.01, w.periods)).toFixed(2)} c.`);
      setPeriod();
      const meanHint = el('small');
      const setMean = () => (meanHint.textContent = noteLabel(69 + Math.round(w.meanA4)));
      setMean();
      const shiftHint = el('small');
      const setShift = () => (shiftHint.textContent = `fase de ${Math.round((Math.round(w.shift) / 16) * 360)}°`);
      setShift();
      const periods = numberInput(`cw${i}-periods`, w.periods, 0.25, (v) => {
        w.periods = Math.max(0.01, v);
        setPeriod();
        changed();
      }, { min: '0.01' });
      const mean = numberInput(`cw${i}-mean`, w.meanA4, 1, (v) => {
        w.meanA4 = v;
        setMean();
        changed();
      });
      const amp = numberInput(`cw${i}-amp`, w.amplitude, 1, (v) => {
        w.amplitude = Math.max(0, v);
        changed();
      }, { min: '0' });
      const basin = numberInput(`cw${i}-basin`, w.basin, 1, (v) => {
        w.basin = Math.max(0, v);
        changed();
      }, { min: '0' });
      const shift = numberInput(`cw${i}-shift`, w.shift, 1, (v) => {
        w.shift = v;
        setShift();
        changed();
      });
      const head = el('div', { class: 'wave-head' }, [el('span', { class: 'wave-tag', style: `background:var(--wave-${i + 1})` }), el('strong', { text: `Onda ${i + 1} (W${i + 1})` })]);
      const grid = el('div', { class: 'wave-grid' }, [
        el('label', { for: periods.id }, ['Períodos por compasso', periods, periodHint]),
        el('label', { for: mean.id }, ['Valor médio (meios-tons, Lá4 = 0)', mean, meanHint]),
        el('label', { for: amp.id }, ['Amplitude (meios-tons)', amp, el('small', { text: 'a onda vai de −A a +A' })]),
        el('label', { for: basin.id }, ['Bacia de atração (meios-tons)', basin, el('small', { text: 'nota a ≤ ½: +3, ≤ 1: +1, ≤ 1½: −4,1, além: −6,2' })]),
        el('label', { for: shift.id }, ['Desfasamento horizontal', shift, shiftHint]),
      ]);
      box.append(el('div', { class: 'wave-card' }, [head, grid]));
    });
    $('classicFirstRun').checked = !!c.classicFirstRun;
  }

  // ---------------------------------------------------------------- weights & GA
  function renderWeights() {
    const c = cfg();
    const presets = $('weightPresets');
    presets.innerHTML = '';
    if (c.mode !== 'classic') {
      for (const [k, p] of Object.entries(WEIGHT_PRESETS)) {
        const b = el('button', { class: 'btn', type: 'button', text: p.label });
        if (c.weightsPreset === k) b.classList.add('primary');
        b.addEventListener('click', () => {
          c.weightsPreset = k;
          const w = p.weights();
          c.canonWeight = w.canon || 6;
          delete w.canon;
          c.weights = w;
          renderWeights();
          onChange('weights');
        });
        presets.append(b);
      }
    }
    const box = $('weights');
    box.innerHTML = '';
    const add = (label, obj, k, id) => {
      const inp = el('input', { type: 'number', step: '0.5', id, value: String(obj[k]) });
      inp.addEventListener('input', () => {
        obj[k] = Number(inp.value);
        if (obj === c.weights) c.weightsPreset = 'custom';
        onChange('weights');
      });
      box.append(el('label', { for: id, text: label }), inp);
    };
    if (c.mode === 'classic') {
      box.append(el('span', { class: 'hint', text: 'Grupo 1 (primeiros 25 % das gerações)' }), el('span'));
      for (const k of Object.keys(CLASSIC_LABELS)) add(CLASSIC_LABELS[k], c.classicG1, k, `w1-${k}`);
      box.append(el('span', { class: 'hint', text: 'Grupo 2 (resto)' }), el('span'));
      for (const k of Object.keys(CLASSIC_LABELS)) add(CLASSIC_LABELS[k], c.classicG2, k, `w2-${k}`);
    } else {
      for (const k of Object.keys(FIELD_LABELS)) {
        if (k === 'canon') {
          const inp = el('input', { type: 'number', step: '0.5', id: 'w-canon', value: String(c.canonWeight) });
          inp.addEventListener('input', () => {
            c.canonWeight = Number(inp.value);
            onChange('weights');
          });
          box.append(el('label', { for: 'w-canon', text: `${FIELD_LABELS.canon} (com 2+ vozes)` }), inp);
        } else add(FIELD_LABELS[k], c.weights, k, `w-${k}`);
      }
    }
  }

  function renderGA() {
    const c = cfg();
    $('generations').value = c.ga.generations;
    $('popSize').value = c.ga.popSize;
    $('mutation').value = c.ga.mutation;
    $('operators').value = c.ga.operators;
    $('seed').value = c.ga.seed;
    $('startMode').value = c.ga.start ?? 'seed';
    $('initMode').value = c.ga.init ?? 'auto';
    $('initMode').disabled = c.ga.operators === 'binary';
  }

  function renderAll() {
    renderPiece();
    renderVoices();
    renderWaves();
    renderClassicWaves();
    renderWeights();
    renderGA();
  }

  // ---------------------------------------------------------------- static listeners
  function bind() {
    $('mode').addEventListener('change', () => {
      const c = cfg();
      c.mode = $('mode').value;
      if (c.mode === 'classic') c.ga = { ...c.ga, generations: 1500, popSize: 60, mutation: 0.1, operators: 'binary' };
      else {
        const canon = activeVoices(c).length >= 2;
        const generations = c.ga.init === 'random' ? (canon ? 2000 : 1500) : canon ? 800 : 600;
        c.ga = { ...c.ga, generations, popSize: 80, mutation: 0.9, operators: 'musical' };
      }
      renderAll();
      onChange('piece');
    });
    $('scale').addEventListener('change', () => {
      cfg().scale = Number($('scale').value);
      onChange('piece');
    });
    $('major').addEventListener('change', () => {
      cfg().major = $('major').value === '1';
      onChange('piece');
    });
    $('bars').addEventListener('change', () => {
      cfg().bars = Number($('bars').value);
      voicesHint();
      onChange('piece');
    });
    $('form').addEventListener('change', () => {
      cfg().form = $('form').value;
      onChange('piece');
    });
    $('phraseBars').addEventListener('change', () => {
      cfg().phraseBars = Number($('phraseBars').value);
      onChange('piece');
    });
    $('ensemble').addEventListener('change', () => {
      const c = cfg();
      if ($('ensemble').value === 'custom') return;
      onChange('ensemble', $('ensemble').value);
      renderVoices();
      if (c.wavePreset === 'canon') {
        c.waves = presetWaves(c, 'canon');
        renderWaves();
      }
    });
    $('circular').addEventListener('change', () => {
      cfg().circular = $('circular').checked;
      onChange('voices');
    });
    $('preset').addEventListener('change', () => {
      const c = cfg();
      if ($('preset').value === 'custom') return;
      c.wavePreset = $('preset').value;
      c.waves = presetWaves(c, c.wavePreset);
      renderWaves();
      onChange('waves');
    });
    $('classicFirstRun').addEventListener('change', () => {
      cfg().classicFirstRun = $('classicFirstRun').checked;
      onChange('waves');
    });
    $('classicWavesReset').addEventListener('click', () => {
      const c = cfg();
      c.classicWaves = defaultClassicWaves();
      c.classicFirstRun = false;
      renderClassicWaves();
      onChange('waves');
    });
    $('waveDef').addEventListener('change', () => {
      cfg().waveDef = $('waveDef').value;
      renderWaves();
    });
    $('addWave').addEventListener('click', () => {
      const c = cfg();
      const [lo, hi] = playableRange(c);
      c.waves.push({ type: 'sine', freq: 1, mean: Math.round((lo + hi) / 2) - 5, amplitude: 3, basin: 2.5, shape: 'gaussian', phase: 0 });
      c.wavePreset = 'custom';
      renderWaves();
      onChange('waves');
    });
    for (const [id, key, parse] of [['generations', 'generations', Number], ['popSize', 'popSize', Number], ['mutation', 'mutation', Number], ['operators', 'operators', String], ['seed', 'seed', Number], ['startMode', 'start', String], ['initMode', 'init', String]]) {
      $(id).addEventListener('change', () => {
        const c = cfg();
        c.ga[key] = parse($(id).value);
        // from noise the GA needs more generations to reach the same level
        if (key === 'init' && c.ga.init === 'random' && c.ga.generations < 1500) c.ga.generations = activeVoices(c).length >= 2 ? 2000 : 1500;
        renderGA();
        onChange('ga');
      });
    }
  }

  return { renderAll, renderVoices, renderWaves, renderClassicWaves, renderWeights, renderGA, bind };
}
