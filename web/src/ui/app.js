// Page controller: wires the engine (GA, fitness, MAP-Elites, variations, analyser, critic)
// to the interface. The composition settings live in one object (config.js) edited by the
// controls (controls.js); every run is kept as an experiment that can be reloaded.
// Everything runs in the page, in time slices, so the UI stays responsive.

import { toEvents, eventsToCompact, compactToEvents, fromEvents, STEPS_PER_BAR, midiName } from '../core/score.js';
import { soundingLine } from '../core/analysis.js';
import { createRng } from '../core/rng.js';
import { instrument } from '../core/instruments.js';
import { analyzeCanon, analyzeEnsemble, INTERVALS } from '../fitness/canon.js';
import { createGA } from '../ga/ga.js';
import { figureName, figureSyllables } from '../ga/blocks.js';
import { getBlockModel } from '../fitness/attractor.js';
import { METERS, meterOf, meterFromSignature } from '../core/meter.js';
import { createMapElites, DESCRIPTORS } from '../ga/mapelites.js';
import { chaoticVariation, divergencePoint, similarityToTheme } from '../variation/dabby.js';
import { analyzePiece, waveToSpec, hz } from '../analysis/wavefit.js';
import { loadCritic } from '../eval/critic.js';
import { FEATURE_LABELS } from '../eval/metrics.js';
import { writeMidi, readMidi } from '../io/midi.js';
import { scoreModel, canonLineModel, toLilyPond } from '../io/notation.js';
import { estimateKey } from '../core/theory.js';
import { makeZip } from '../io/zip.js';
import { REFERENCE_CANONS, referenceEvents, compactToLine } from '../data/references.js';
import criticData from '../data/critic-data.js';
import corpus from '../data/corpus-data.js';
import { EXAMPLES } from '../data/examples.js';
import { drawRoll } from './pianoroll.js';
import { lineChart, spectrumChart, eliteMap } from './charts.js';
import { createPlayer } from './audio.js';
import { loadVexFlow, renderScore, scorePdf } from './score.js';
import { aboutHtml } from './about.js';
import { t, tn, has, locale, applyTexts, setLang, getLang, onLangChange, initialLang, startLang, LANGUAGES } from '../i18n/i18n.js';
import { STYLES } from '../fitness/styles.js';
import {
  defaultConfig, cloneConfig, voiceSpecs, applyEnsemble, buildFitness, autoConfigure, autoWaves, meterOfConfig,
  presetWaves, wavesFromRealMelody, surprise, describe, activeVoices, keyOf, adaptToVoices, activeStyle,
} from './config.js';
import { createControls, FIELD_LABELS, CLASSIC_LABELS } from './controls.js';

const $ = (id) => document.getElementById(id);
const critic = loadCritic(criticData);
const player = createPlayer();
const pct = (x) => `${Math.round(x * 100)} %`;

const state = {
  config: defaultConfig(),
  piece: null,
  history: [],
  running: null,
  batch: false,
  experiments: [],
  selectedExperiment: -1,
  preview: null,
  archive: null,
  meRunning: null,
  selectedCell: -1,
  variations: [],
  analysis: null,
  analysisPiece: null,
  playhead: null,
  midiUpload: null,
  tab: 'compose',
  view: 'roll', // 'roll' | 'score'
  scoreLayout: null,
  scoreFor: null,
  scoreAt: 0,
  scoreTimer: 0,
};

const controls = createControls(() => state.config, onConfigChange);

// ------------------------------------------------------------------ setup

function option(sel, value, label, selected = false) {
  const o = document.createElement('option');
  o.value = value;
  o.textContent = label;
  if (selected) o.selected = true;
  sel.appendChild(o);
}

const sourceName = (s) => ({ essen: 'Essen', oneills: "O'Neill", 'bach-chorale': 'Bach' }[s] || s);

/** Menus whose options the script writes (MAP-Elites axes, pieces to analyse): in the current language. */
function fillMenus() {
  const keep = (sel, fallback) => (sel.value || fallback);
  const mx = keep($('mx'), 'density');
  const my = keep($('my'), 'leaps');
  const src = keep($('anSource'), 'telemann');
  $('mx').innerHTML = '';
  $('my').innerHTML = '';
  for (const [k, d] of Object.entries(DESCRIPTORS)) {
    option($('mx'), k, d.label, k === mx);
    option($('my'), k, d.label, k === my);
  }
  $('anSource').innerHTML = '';
  for (const k of ['current', 'telemann', 'telemann2', 'telemann3', 'frereJacques', 'rowYourBoat', 'corpus', 'midi']) option($('anSource'), k, t(`an.src.${k}`), k === src);
  $('anKVal').textContent = tn('an.partsCount', Number($('anK').value));
}

/** The language menu, and what the page redraws when the language changes. */
function initLanguage() {
  const sel = $('langSelect');
  for (const l of LANGUAGES) option(sel, l.id, l.name, l.id === getLang());
  sel.addEventListener('change', () => setLang(sel.value));
  onLangChange(() => {
    sel.value = getLang();
    applyTexts();
    fillMenus();
    controls.renderAll();
    updateStartHint();
    showDivergence();
    $('aboutBox').innerHTML = aboutHtml();
    $('playBtn').textContent = t(player.playing ? 'play.stop' : 'play.play');
    if (!state.running) $('runStatus').textContent = t('status.readyDesc', { desc: describe(state.config) });
    if (state.piece) {
      if (state.piece.titleOf) state.piece.title = state.piece.titleOf();
      renderChips(state.piece);
      renderParts();
    }
    renderExperiments();
    if (state.lastSnapshots) renderSnapshots(state.lastSnapshots);
    if (state.batchStats) renderBatchSummary(state.batchStats);
    if (state.variations.length) renderVariationList();
    else if (state.piece) renderVariationsPlaceholder();
    if (state.analysis) renderAnalysis(state.analysis, state.analysisSrc);
    if (state.archive) {
      axisLabels(state.archive);
      drawMap();
    }
    if ($('blocksBox').open) renderBlocksBox();
    if (state.tab === 'evaluate' && state.piece) renderEvaluation(state.piece);
    state.scoreFor = null;
    render();
    drawHistory();
  });
}

function initControls() {
  controls.bind();
  controls.renderAll();
  fillMenus();
  corpus.forEach((m, i) => option($('anCorpus'), i, `${sourceName(m.source)} — ${m.title}`));
  $('bpm').addEventListener('input', () => ($('bpmVal').textContent = $('bpm').value));
  $('divergence').addEventListener('input', showDivergence);
  $('anK').addEventListener('input', () => ($('anKVal').textContent = tn('an.partsCount', Number($('anK').value))));
  $('anSource').addEventListener('change', () => ($('anCorpusRow').hidden = $('anSource').value !== 'corpus'));
  $('anCorpusRow').hidden = true;
  showDivergence();

  document.querySelectorAll('nav.tabs button').forEach((b) => b.addEventListener('click', () => selectTab(b.dataset.panel)));
  $('runBtn').addEventListener('click', () => runGA(cloneConfig(state.config)));
  $('reseedBtn').addEventListener('click', () => {
    state.config.ga.seed = 1 + Math.floor(Math.random() * 99999);
    controls.renderGA();
    onConfigChange('ga');
    runGA(cloneConfig(state.config));
  });
  $('batchBtn').addEventListener('click', runBatch);
  $('stopBtn').addEventListener('click', () => {
    state.running = null;
    state.batch = false;
  });
  $('autoBtn').addEventListener('click', () => {
    autoConfigure(state.config);
    configReplaced(t('status.auto'));
  });
  $('surpriseBtn').addEventListener('click', () => {
    surprise(state.config, createRng(1 + Math.floor(Math.random() * 1e9)));
    configReplaced(t('status.surprise', { desc: describe(state.config) }));
  });
  $('resetBtn').addEventListener('click', () => {
    state.config = defaultConfig();
    configReplaced(t('status.reset'));
  });
  $('wavesAuto').addEventListener('click', () => {
    state.config.waves = autoWaves(state.config);
    state.config.wavePreset = 'custom';
    controls.renderWaves();
    onConfigChange('waves');
  });
  $('wavesReal').addEventListener('click', () => {
    const res = wavesFromRealMelody(state.config, corpus, createRng(1 + Math.floor(Math.random() * 1e9)));
    if (!res) return;
    state.config.waves = res.waves;
    state.config.wavePreset = 'custom';
    controls.renderWaves();
    onConfigChange('waves');
    $('wavesHint').textContent = t('waves.fromReal', { title: res.title, source: sourceName(res.source) }) + $('wavesHint').textContent;
  });
  $('configBox').addEventListener('toggle', () => $('configBox').open && fillConfigText());
  $('copyConfig').addEventListener('click', copyConfig);
  $('applyConfig').addEventListener('click', applyConfigText);
  $('playBtn').addEventListener('click', togglePlay);
  $('viewRoll').addEventListener('click', () => setView('roll'));
  $('viewScore').addEventListener('click', () => setView('score'));
  $('lilyBtn').addEventListener('click', downloadLily);
  $('pdfBtn').addEventListener('click', downloadPdf);
  $('scoreLayout').addEventListener('change', () => {
    try {
      localStorage.setItem('ondas-score-layout', $('scoreLayout').value);
    } catch (e) {
      /* storage unavailable */
    }
    state.scoreFor = null;
    render();
    if ($('lilyBox').open) fillLily();
  });
  $('lilyBox').addEventListener('toggle', () => $('lilyBox').open && fillLily());
  $('copyLily').addEventListener('click', async () => {
    fillLily();
    try {
      await navigator.clipboard.writeText($('lilyText').value);
      $('lilyNote').textContent = t('copy.done');
    } catch (e) {
      $('lilyText').select();
      $('lilyNote').textContent = t('copy.selected');
    }
  });
  $('midiBtn').addEventListener('click', downloadMidi);
  $('canonPlay').addEventListener('change', render);
  $('meRun').addEventListener('click', runMapElites);
  $('meStop').addEventListener('click', () => (state.meRunning = null));
  $('eliteMap').addEventListener('click', onMapClick);
  $('varRun').addEventListener('click', makeVariations);
  $('formRun').addEventListener('click', buildForm);
  $('anRun').addEventListener('click', runAnalysis);
  $('anUse').addEventListener('click', useAnalysisWaves);
  $('anFile').addEventListener('change', onMidiFile);
  $('blocksBox').addEventListener('toggle', () => $('blocksBox').open && renderBlocksBox());
  window.addEventListener('resize', () => {
    render();
    drawHistory();
    if (state.archive) drawMap();
    if (state.analysis) drawSpectra();
  });
  $('aboutBox').innerHTML = aboutHtml();
}

function selectTab(name) {
  state.tab = name;
  document.querySelectorAll('nav.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.panel === name)));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === `panel-${name}`));
  render();
  if (name === 'explore' && state.archive) drawMap();
  if (name === 'compose') drawHistory();
  if (name === 'analyze' && state.analysis) drawSpectra();
  if (name === 'evaluate' && state.piece) renderEvaluation(state.piece);
}

function showDivergence() {
  const v = 10 ** Number($('divergence').value);
  $('divVal').textContent = t('var.divergenceValue', { v: v.toFixed(3), x0: (1 - v).toFixed(3) });
}

// ------------------------------------------------------------------ configuration

function onConfigChange(kind, arg) {
  const c = state.config;
  if (kind === 'ensemble') {
    applyEnsemble(c, arg);
    controls.renderGA();
    controls.renderWeights();
    // instruments changed: keep a named preset inside the new register
    if (c.wavePreset !== 'custom' && c.mode === 'field') {
      c.waves = presetWaves(c, c.wavePreset);
      controls.renderWaves();
    }
  }
  if (kind === 'voices') {
    adaptToVoices(c);
    controls.renderGA();
    controls.renderWeights();
  }
  if (kind === 'style') {
    // the style's usual tempo for playing (quarter notes per minute)
    const bpm = arg?.settings?.bpm;
    if (bpm) {
      $('bpm').value = String(Math.max(Number($('bpm').min), Math.min(Number($('bpm').max), bpm)));
      $('bpmVal').textContent = $('bpm').value;
    }
    controls.renderWaves();
    if ($('blocksBox').open) renderBlocksBox();
  }
  if (kind === 'voices' || kind === 'piece') controls.renderWaves();
  // the corpus patterns shown are those of the chosen meter
  if (kind === 'piece' && $('blocksBox').open) renderBlocksBox();
  updateStartHint();
  updatePreview();
  if ($('configBox').open) fillConfigText();
}

function configReplaced(message) {
  controls.renderAll();
  updateStartHint();
  updatePreview();
  if ($('configBox').open) fillConfigText();
  $('runStatus').textContent = message;
}

// waves of the current settings, drawn dashed on the stage until the next run
function updatePreview() {
  try {
    const built = buildFitness(state.config);
    state.preview = {
      sig: waveSignature(state.config),
      length: built.fit.length,
      waves: built.waves.map((w) => ({ ...w, preview: true })),
    };
  } catch (e) {
    state.preview = null;
  }
  render();
}

// everything that changes the drawn waves
const waveSignature = (c) => JSON.stringify([c.mode, c.scale, c.major, c.bars, c.mode === 'classic' ? [c.classicWaves, !!c.classicFirstRun] : c.waves, c.ga.seed]);

function fillConfigText() {
  $('configText').value = JSON.stringify(state.config, null, 1);
  $('configNote').textContent = t('config.note');
}

async function copyConfig() {
  fillConfigText();
  try {
    await navigator.clipboard.writeText($('configText').value);
    $('configNote').textContent = t('copy.done');
  } catch (e) {
    $('configText').select();
    $('configNote').textContent = t('copy.selected');
  }
}

function applyConfigText() {
  try {
    const parsed = JSON.parse($('configText').value);
    const def = defaultConfig();
    const c = { ...def, ...parsed, ga: { ...def.ga, ...(parsed.ga || {}) } };
    if (!Array.isArray(c.voices) || !c.voices[0]?.instrument) throw new Error(t('config.missingVoices'));
    while (c.voices.length < 3) c.voices.push(def.voices[c.voices.length]);
    if (!Array.isArray(c.waves) || !c.waves.length) throw new Error(t('config.needWave'));
    c.waves = c.waves.slice(0, 4);
    c.weights = { ...def.weights, ...(c.weights || {}) };
    state.config = c;
    configReplaced(t('config.applied', { desc: describe(c) }));
    $('configNote').textContent = t('config.appliedShort');
  } catch (e) {
    $('configNote').textContent = t('config.invalid', { msg: e.message });
  }
}

// ------------------------------------------------------------------ pieces

/** A piece made of genes under a configuration: events, waves, voices of the canon. */
function pieceFromGenes(genes, built, cfg, extra = {}) {
  const meter = meterOfConfig(cfg);
  return {
    events: toEvents(genes),
    genes,
    length: genes.length,
    barLen: meter.barLen,
    meter: meter.id,
    waves: built.waves,
    key: built.key,
    mode: built.mode,
    voices: voiceSpecs(cfg),
    circular: !!cfg.circular,
    config: cfg,
    ...extra,
  };
}

/**
 * Voices as they sound: leader and followers with absolute onsets and transposed pitches.
 * A plain canon stops when fewer than two voices remain (like the fermata in Telemann, where
 * the second violin stops with the first); a round goes round twice and every voice stops
 * at the end of the second pass.
 */
function soundingVoices(p, all = $('canonPlay').checked) {
  const voices = all ? p.voices : p.voices.slice(0, 1);
  const delays = p.voices.map((v) => v.delay).sort((a, b) => b - a);
  const reps = p.circular && voices.length > 1 ? 2 : 1;
  const total = voices.length === 1 ? p.length : p.end ?? (p.circular ? reps * p.length : p.length + (delays[1] ?? 0));
  return {
    total,
    voices: voices.map((v, i) => {
      const map = v.map || ((x) => x);
      const events = [];
      for (let r = 0; v.delay + r * p.length < total; r++) {
        if (i === 0 && r >= reps) break;
        for (const e of p.events) {
          const s = e.start + r * p.length + v.delay;
          if (e.pitch === null || s >= total) continue;
          events.push({ pitch: map(e.pitch), start: s, dur: Math.min(e.dur, total - s) });
        }
      }
      return { events, instrument: v.instrument, kind: i === 0 ? 'lead' : i === 1 ? 'follower' : 'v3', spec: v };
    }),
  };
}

function setPiece(piece) {
  state.piece = piece;
  state.variations = [];
  renderChips(piece);
  if (state.tab === 'evaluate') renderEvaluation(piece);
  render();
  renderParts();
  renderVariationsPlaceholder();
}

const stagePiece = () => (state.tab === 'analyze' && state.analysisPiece ? state.analysisPiece : state.piece);

function stageScene() {
  const p = stagePiece();
  if (!p) return null;
  const analyzing = p === state.analysisPiece;
  const { voices, total } = soundingVoices(p);
  let waves = p.waves || [];
  let length = total;
  let segments = [];
  if (!analyzing && state.tab === 'compose' && state.preview && (!p.config || waveSignature(p.config) !== state.preview.sig)) {
    waves = state.preview.waves;
    length = Math.max(length, state.preview.length);
  }
  if (analyzing && state.analysis) {
    segments = state.analysis.segments.map((s) => [s.start, s.end]);
    waves = [];
    for (const s of state.analysis.segments) {
      if (!s.fit) continue;
      const sorted = s.fit.waves.slice().sort((a, b) => a.freq - b.freq);
      sorted.forEach((w, k) => {
        // same colours as the cards: lowest frequency = wave 1, highest = wave 2, others = 3, 4
        const colorIndex = k === 0 ? 0 : k === sorted.length - 1 ? 1 : 1 + k;
        const values = [];
        for (let t = 0; t < s.end - s.start; t++) values.push(w.mean + w.a * Math.sin((2 * Math.PI * w.freq * t) / p.barLen) + w.b * Math.cos((2 * Math.PI * w.freq * t) / p.barLen));
        waves.push({ values, basin: w.basin, shape: 'gaussian', start: s.start, colorIndex });
      });
    }
  } else if (p.circular && total > p.length) {
    // a round: the waves repeat with the melody
    waves = waves.map((w) => ({ ...w, values: Array.from({ length: total }, (_, t) => w.values[t % w.values.length]) }));
  }
  return { length, barLen: p.barLen, beat: meterOf(p.meter ?? p.barLen).beat, voices, waves, segments, key: p.key, playhead: state.playhead, title: p.title };
}

function render() {
  const scene = stageScene();
  if (!scene) return;
  if (state.view === 'score') renderScoreView();
  else drawRoll($('roll'), scene);
  const p = stagePiece();
  $('pieceTitle').textContent = p.title;
  if (state.chipsFor !== p) renderChips(p);
  const legend = [];
  const colours = ['var(--note)', 'var(--follower)', 'var(--voice-3)'];
  scene.voices.forEach((v, i) => {
    const s = v.spec;
    const inst = instrument(s.instrument).label;
    const txt = i === 0 ? t('legend.melody', { inst }) : `${t('legend.entry', { inst, bar: 1 + s.delay / p.barLen })}${s.interval && s.interval !== 'unison' ? ` · ${INTERVALS[s.interval]?.label ?? ''}` : ''}`;
    legend.push(`<span><i style="background:${colours[i]}"></i>${txt}</span>`);
  });
  const analyzing = state.tab === 'analyze' && state.analysis && p === state.analysisPiece;
  if (!analyzing) {
    scene.waves.forEach((w, i) => {
      const basin = w.shape === 'step' ? t('legend.basinStep', { b: Number(w.basin) }) : t('legend.basinSigma', { b: Number(w.basin).toFixed(1) });
      legend.push(`<span><i style="background:var(--wave-${(i % 4) + 1})"></i>${t('legend.wave', { n: i + 1, basin })}${w.preview ? t('legend.preview') : ''}</span>`);
    });
  } else legend.push(`<span><i style="background:var(--wave-1)"></i>${t('legend.low')}</span><span><i style="background:var(--wave-2)"></i>${t('legend.fast')}</span><span>${t('legend.bands')}</span>`);
  $('legend').innerHTML = legend.join('');
  $('legend').hidden = state.view === 'score';
}

// ------------------------------------------------------------------ engraved score (optional view)

function setView(view) {
  state.view = view;
  try {
    localStorage.setItem('ondas-view', view);
  } catch (e) {
    /* storage unavailable */
  }
  $('viewRoll').setAttribute('aria-pressed', String(view === 'roll'));
  $('viewScore').setAttribute('aria-pressed', String(view === 'score'));
  $('roll').hidden = view === 'score';
  $('score').hidden = view !== 'score';
  $('lilyBox').hidden = view !== 'score';
  state.scoreFor = null;
  render();
}

/** Names of the voices for the score: the instrument, numbered when two voices share it. */
function voiceNames(voices) {
  const count = {};
  voices.forEach((v) => (count[v.instrument] = (count[v.instrument] || 0) + 1));
  const seen = {};
  return voices.map((v) => {
    const label = instrument(v.instrument).label;
    seen[v.instrument] = (seen[v.instrument] || 0) + 1;
    return count[v.instrument] > 1 ? `${label} ${seen[v.instrument]}` : label;
  });
}

/** 'staves' (one staff per voice) or 'line' (the canon on one line with entry marks). */
const scoreLayoutOf = (p) => ($('scoreLayout').value === 'line' && p.voices?.length > 1 ? 'line' : 'staves');

/**
 * Score model of what is on the stage: the voices as they sound, one staff each, or the canon on
 * one line with a numbered mark where each voice comes in.
 */
function scoreModelFor(p, layout = scoreLayoutOf(p)) {
  let key = p.key;
  if (!key || !key.mode) {
    const notes = p.events.filter((e) => e.pitch !== null);
    key = notes.length ? estimateKey(notes.map((e) => e.pitch), notes.map((e) => e.dur)) : { tonic: 0, mode: 'major' };
  }
  const title = p.baseTitle ?? p.title;
  const subtitle = p.config ? describe(p.config) : '';
  const bpm = Number($('bpm').value);
  if (layout === 'line') {
    const names = voiceNames(p.voices);
    return canonLineModel({
      lead: { events: p.events.filter((e) => e.pitch !== null), instrument: p.voices[0].instrument, name: names[0] },
      entries: p.voices.map((v, i) => ({
        step: v.delay,
        name: names[i],
        intervalLabel: i && v.interval && v.interval !== 'unison' ? (has(`interval.${v.interval}.score`) ? t(`interval.${v.interval}.score`) : INTERVALS[v.interval]?.label) : '',
      })),
      length: p.length,
      barLen: p.barLen,
      meter: p.meter ?? null,
      key,
      title,
      subtitle,
      bpm,
      circular: !!p.circular,
    });
  }
  const { voices, total } = soundingVoices(p);
  const names = voiceNames(voices);
  return scoreModel({
    voices: voices.map((v, i) => ({ events: v.events, instrument: v.instrument, name: names[i] })),
    total,
    barLen: p.barLen,
    meter: p.meter ?? null,
    key,
    title,
    subtitle,
    bpm,
  });
}

// redraws only when the piece, the voices shown or the width change; at most ~3 times a second
function renderScoreView() {
  const p = stagePiece();
  const box = $('score');
  const width = box.clientWidth || 800;
  const cs = getComputedStyle(document.documentElement);
  const theme = cs.getPropertyValue('--paper').trim();
  const sig = { p, all: $('canonPlay').checked, width, theme, bpm: $('bpm').value, layout: $('scoreLayout').value };
  const same = state.scoreFor && Object.keys(sig).every((k) => state.scoreFor[k] === sig[k]);
  if (same) {
    highlightScore(state.playhead);
    return;
  }
  const wait = 300 - (performance.now() - state.scoreAt);
  if (state.scoreLayout && wait > 0) {
    clearTimeout(state.scoreTimer);
    state.scoreTimer = setTimeout(() => state.view === 'score' && renderScoreView(), wait);
    return;
  }
  state.scoreFor = sig;
  state.scoreAt = performance.now();
  loadVexFlow()
    .then(() => {
      if (state.scoreFor !== sig) return;
      const scroll = box.scrollTop;
      state.scoreLayout = renderScore(box, scoreModelFor(p), { width, ink: cs.getPropertyValue('--paper-ink').trim(), muted: cs.getPropertyValue('--paper-muted').trim() });
      box.scrollTop = scroll;
      highlightScore(state.playhead);
      if ($('lilyBox').open) fillLily();
    })
    .catch((e) => {
      state.scoreLayout = null;
      box.innerHTML = `<p class="msg">${t('score.error', { msg: e.message })}</p>`;
    });
}

function highlightScore(step) {
  const lay = state.scoreLayout;
  if (!lay) return;
  let first = null;
  for (const n of lay.notes) {
    const on = step !== null && step !== undefined && !n.rest && step >= n.start && step < n.end;
    if (n.el && n.on !== on) {
      n.el.classList.toggle('on', on);
      n.on = on;
    }
    if (on && !first) first = n.el;
  }
  // keep the sounding notes in view inside the score box
  const box = $('score');
  if (first && box.scrollHeight > box.clientHeight) {
    const r = first.getBoundingClientRect();
    const br = box.getBoundingClientRect();
    if (r.top < br.top + 20 || r.bottom > br.bottom - 20) box.scrollTop += r.top - br.top - box.clientHeight / 3;
  }
}

function fillLily() {
  const p = stagePiece();
  if (p) $('lilyText').value = toLilyPond(scoreModelFor(p));
}

async function downloadPdf() {
  const p = stagePiece();
  if (!p) return;
  const preparing = t('pdf.preparing');
  $('midiNote').textContent = preparing;
  try {
    await loadVexFlow();
    const layout = scoreLayoutOf(p);
    const { bytes, pages, scale } = scorePdf(scoreModelFor(p, layout));
    const what = t(layout === 'line' ? 'pdf.line' : 'pdf.staves');
    // the staff size is fitted to whole pages (score.js): say so when it differs from the usual
    const size = Math.round((scale / 0.6) * 100);
    const fit = size < 100 ? t('pdf.smaller', { size }) : size > 100 ? t('pdf.bigger', { size }) : '';
    const info = `${tn('pdf.pages', pages)}, ${what}${fit}`;
    await saveFile(`ondas-atratoras-${Date.now()}.pdf`, bytes, 'application/pdf', t('pdf.saved', { info }));
    if ($('midiNote').textContent === preparing) $('midiNote').textContent = t('pdf.done', { info });
  } catch (e) {
    $('midiNote').textContent = t('pdf.error', { msg: e.message });
  }
}

async function downloadLily() {
  const p = stagePiece();
  if (!p) return;
  const text = toLilyPond(scoreModelFor(p));
  await saveFile(`ondas-atratoras-${Date.now()}.ly`, new TextEncoder().encode(text), 'text/x-lilypond', t('lily.saved'));
}

function lineOf(p) {
  if (p.genes) return soundingLine(p.genes);
  const pitch = [];
  const onset = [];
  for (const e of p.events) for (let k = 0; k < e.dur; k++) {
    pitch.push(e.pitch);
    onset.push(e.pitch !== null && k === 0);
  }
  return { pitch, onset };
}

function sliceSteps(compact, n) {
  const out = [];
  let t = 0;
  for (const [p, d] of compact) {
    if (t >= n) break;
    out.push([p, Math.min(d, n - t)]);
    t += d;
  }
  return out;
}

/** Counterpoint of the piece's own voices (null for a single voice). */
function ensembleOf(p) {
  if (!p.voices || p.voices.length < 2) return null;
  if (p.ensemble) return p.ensemble;
  p.ensemble = analyzeEnsemble(lineOf(p), p.voices, { circular: !!p.circular, barLen: p.barLen, meter: p.meter ?? null, end: p.end ?? null });
  return p.ensemble;
}

function evaluationOf(p) {
  if (!p.evaluation) p.evaluation = critic.evaluate(sliceSteps(eventsToCompact(p.events), 128), { barLen: p.barLen, beat: meterOf(p.meter ?? p.barLen).beat });
  return p.evaluation;
}

function renderChips(p) {
  state.chipsFor = p;
  const chips = [];
  if (p.fitness !== undefined) chips.push(`<span class="chip">${t('chip.fitness')} <b>${p.fitness.toFixed(1)}</b></span>`);
  const ev = evaluationOf(p);
  const cls = ev.humanLike >= 0.7 ? 'good' : ev.humanLike >= 0.4 ? 'warn' : 'bad';
  chips.push(`<span class="chip ${cls}" title="${t('chip.critic.title')}">${t('chip.critic')} <b>${pct(ev.humanLike)}</b></span>`);
  chips.push(`<span class="chip" title="${t('chip.typical.title')}">${t('chip.typical')} <b>${Math.round(ev.typicality * criticData.features.length)}/${criticData.features.length}</b></span>`);
  chips.push(`<span class="chip">${t('chip.rests')} <b>${pct(ev.features.restRatio)}</b></span>`);
  const h = heuristicsOf(p);
  if (h) {
    const judged = h.rules.filter((r) => r.s !== null);
    const inside = judged.filter((r) => r.s === 1).length;
    const hcls = inside >= 0.85 * judged.length ? 'good' : inside >= 0.6 * judged.length ? 'warn' : 'bad';
    chips.push(`<span class="chip ${hcls}" title="${t('chip.heuristics.title', { style: styleNameOf(h) })}">${t('chip.heuristics')} <b>${inside}/${judged.length}</b></span>`);
  }
  const ens = ensembleOf(p);
  if (ens) {
    const good = ens.strongConsonance >= 0.75 ? 'good' : ens.strongConsonance >= 0.6 ? 'warn' : 'bad';
    chips.push(`<span class="chip ${good}" title="${t('chip.voices.title')}">${t('chip.voices', { n: p.voices.length })} <b>${pct(ens.strongConsonance)}</b></span>`);
    chips.push(`<span class="chip" title="${t('chip.parallels.title')}">${t('chip.parallels')} <b>${ens.parallels}</b></span>`);
    if (p.voices.length >= 3) chips.push(`<span class="chip" title="${t('chip.triads.title')}">${t('chip.triads')} <b>${pct(ens.triadRatio)}</b></span>`);
    if (ens.outOfRange > 0) chips.push(`<span class="chip bad" title="${t('chip.out.title')}">${t('chip.out')} <b>${pct(ens.outOfRange)}</b></span>`);
  } else {
    const c = analyzeCanon(lineOf(p), { delay: p.barLen, barLen: p.barLen });
    chips.push(`<span class="chip" title="${t('chip.asCanon.title')}">${t('chip.asCanon')} <b>${pct(c.strongConsonance)}</b></span>`);
  }
  $('pieceChips').innerHTML = chips.join('');
}

function renderParts() {
  const p = state.piece;
  const box = $('partsBars');
  box.innerHTML = '';
  if (!p || !p.parts) return;
  const labels = p.mode === 'classic' ? CLASSIC_LABELS : FIELD_LABELS;
  // rules added later than the original (and the canon) only when they are weighted
  const optional = p.mode === 'classic' ? ['cadence', 'heuristics'] : ['canon', 'idiom', 'heuristics'];
  const entries = Object.keys(labels).filter((k) => !optional.includes(k) || (p.weights?.[k] ?? 0) !== 0).map((k) => [k, (p.weights?.[k] ?? 0) * (p.parts[k] ?? 0)]);
  const maxAbs = Math.max(1e-9, ...entries.map(([, v]) => Math.abs(v)));
  $('partsHint').textContent = t(p.mode === 'classic' ? 'parts.hint.classic' : 'parts.hint.field');
  for (const [k, v] of entries) {
    const w = (Math.abs(v) / maxAbs) * 50;
    box.insertAdjacentHTML('beforeend', `<span>${labels[k]}</span><span class="track"><span class="fill ${v < 0 ? 'neg' : ''}" style="${v < 0 ? `right:50%;width:${w}%` : `left:50%;width:${w}%`}"></span></span><span class="num">${v.toFixed(1)}</span>`);
  }
  renderHeuristics(p);
}

// ------------------------------------------------------------------ composition heuristics of the piece

/** The heuristic rules of the piece's settings (style and meter) measured on its melody, or null. */
function heuristicsOf(p) {
  if (!p?.genes || !p.config) return null;
  if (p.heuristics !== undefined) return p.heuristics;
  try {
    const built = buildFitness(p.config);
    const res = built.fit.heuristics(p.genes);
    const style = activeStyle(p.config);
    p.heuristics = { ...res, style, rulesDef: built.fit.heuristicRules, weight: p.mode === 'classic' ? (p.weights?.heuristics ?? 0) : built.fit.weights.heuristics ?? 0 };
  } catch (e) {
    p.heuristics = null;
  }
  return p.heuristics;
}

const styleNameOf = (h) => (h.style ? t(`style.${h.style}`) : t('heur.general'));
const fmtRuleValue = (v) => (v === undefined || v === null || Number.isNaN(v) ? '—' : Number.isInteger(v) ? String(v) : v.toFixed(2));

/** Table of the heuristic rules: value in the melody, target, whether it is inside, sources. */
function renderHeuristics(p) {
  const box = $('heurBox');
  const h = heuristicsOf(p);
  box.hidden = !h;
  if (!h) return;
  const byId = new Map(h.rulesDef.map((r) => [r.id, r]));
  const judged = h.rules.filter((r) => r.s !== null);
  const rows = h.rules.map((r) => {
    const def = byId.get(r.id);
    const target = def.in ? def.in.join(', ') : `${fmtRuleValue(def.lo)}–${fmtRuleValue(def.hi)}`;
    const origin = t(def.calibrated ? 'heur.fromCorpus' : 'heur.fromLiterature');
    const cls = r.s === null ? '' : r.s === 1 ? 'ok' : 'off';
    return `<tr><td>${t(`rule.${r.id}`)}</td><td class="num ${cls}">${fmtRuleValue(r.value)}</td><td class="num">${target} <span class="muted">(${origin})</span></td><td>${(def.src || []).join(', ')}</td></tr>`;
  });
  const off = h.weight ? '' : `<p class="hint">${t('heur.off')}</p>`;
  box.querySelector('.heur-body').innerHTML = `<p class="hint">${t('heur.summary', { style: styleNameOf(h), inside: judged.filter((r) => r.s === 1).length, n: judged.length, score: h.score.toFixed(2) })}</p>${off}<div class="scroll"><table class="data"><thead><tr><th>${t('heur.col.rule')}</th><th>${t('heur.col.value')}</th><th>${t('heur.col.target')}</th><th>${t('heur.col.sources')}</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

function drawHistory() {
  const h = state.history;
  if (!h.length || state.tab !== 'compose') return;
  const cs = getComputedStyle(document.documentElement);
  const best = h.map((r) => [r.generation, r.best]);
  const mean = h.map((r) => [r.generation, r.mean]);
  const lo = Math.min(...best.map((p) => p[1]).concat(mean.map((p) => p[1])).filter(Number.isFinite));
  const hi = Math.max(...best.map((p) => p[1]));
  const div = h.map((r) => [r.generation, lo + r.diversity * (hi - lo)]);
  lineChart($('historyChart'), [
    { points: div, color: cs.getPropertyValue('--wave-3').trim(), width: 1.5, dash: [4, 3] },
    { points: mean.filter((p) => Number.isFinite(p[1])), color: cs.getPropertyValue('--grid-strong').trim(), width: 1.5 },
    { points: best, color: cs.getPropertyValue('--accent').trim(), width: 2.5 },
  ], { xLabel: t('chart.generation') });
}

// ------------------------------------------------------------------ GA runs and experiments


function setRunning(on) {
  $('runBtn').disabled = on;
  $('reseedBtn').disabled = on;
  $('batchBtn').disabled = on;
  $('stopBtn').disabled = !on;
}

// generations at which the best individual is kept, to show the convergence afterwards
const SNAP_GENS = new Set([0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]);

/**
 * Runs the GA in time slices; resolves with the experiment (or null if it could not start).
 * Every run starts from a new population unless the configuration says to continue from the
 * final population of the previous run (`ga.start = 'continue'`); `ga.init` chooses how the new
 * individuals are made (with musical patterns, or at random with no patterns at all).
 */
function runGA(cfg, { batch = false } = {}) {
  return new Promise((resolve) => {
    player.stop();
    $('playBtn').textContent = t('play.play');
    const start = batch ? 'seed' : cfg.ga.start ?? 'seed';
    if (start === 'newSeed') {
      cfg.ga.seed = 1 + Math.floor(Math.random() * 99999);
      state.config.ga.seed = cfg.ga.seed;
      controls.renderGA();
    }
    let built;
    try {
      built = buildFitness(cfg);
    } catch (e) {
      $('runStatus').textContent = t('run.invalid', { msg: e.message });
      resolve(null);
      return;
    }
    const seed = cfg.ga.seed || 1;
    const binary = cfg.ga.operators === 'binary';
    const last = state.lastPopulation;
    const continuing = start === 'continue' && last && last.length === built.fit.length && (last.meter ?? '4/4') === meterOfConfig(cfg).id;
    const ga = createGA({
      fitness: built.fit,
      rng: createRng(seed),
      length: built.fit.length,
      env: built.env,
      generations: cfg.ga.generations,
      popSize: cfg.ga.popSize,
      mutationRate: cfg.ga.mutation,
      strategy: binary ? 'geneticsharp' : 'tournament',
      operators: binary ? 'binary' : 'musical',
      initMode: cfg.ga.init ?? 'auto',
      initialPopulation: continuing ? last.genomes : null,
    });
    const origin = continuing ? { continuedFrom: last.from } : {};
    const token = {};
    state.running = token;
    state.history = [];
    setRunning(true);
    const t0 = performance.now();
    let lastDraw = 0;
    const snapshots = [];
    const snap = () => {
      if (SNAP_GENS.has(ga.generation) && !snapshots.some((x) => x.generation === ga.generation)) {
        snapshots.push({ generation: ga.generation, genes: ga.best.decoded, fitness: ga.best.fitness });
      }
    };
    snap();
    const nVoices = activeVoices(cfg).length;
    // titles are functions, so a piece can be named again in another language
    const baseTitle = () => `${t(`mode.label.${built.mode}`)} · ${nVoices > 1 ? t('run.voices', { n: nVoices }) : ''}${t('run.seed', { seed })}${continuing ? t('run.continues', { n: last.from }) : ''}`;
    const show = (final) => {
      const best = ga.best;
      const weights = built.mode === 'classic'
        ? (built.fit.phaseOf({ generation: ga.generation, maxGenerations: cfg.ga.generations }) === 1 ? cfg.classicG1 : cfg.classicG2)
        : built.fit.weights;
      const g = ga.generation;
      const titleOf = () => baseTitle() + (final ? '' : t('run.evolving', { g }));
      setPiece(pieceFromGenes(best.decoded, built, cfg, { fitness: best.fitness, parts: best.parts, weights, title: titleOf(), titleOf, baseTitle: baseTitle() }));
    };
    const finish = (stopped) => {
      state.running = null;
      setRunning(false);
      state.history = ga.history.slice();
      if (!snapshots.some((x) => x.generation === ga.generation)) snapshots.push({ generation: ga.generation, genes: ga.best.decoded, fitness: ga.best.fitness });
      show(true);
      drawHistory();
      $('runStatus').textContent += t(stopped ? 'run.stopped' : 'run.done');
      const population = ga.population.map((ind) => Uint8Array.from(ga.decode(ind.genes)));
      const exp = recordExperiment(cfg, stopped, { snapshots, population, ...origin });
      state.lastPopulation = { genomes: population.map((g) => Array.from(g)), length: built.fit.length, meter: meterOfConfig(cfg).id, from: exp.n };
      renderSnapshots(exp);
      updateStartHint();
      resolve(exp);
    };
    // "slowly": one generation per frame at the start, then a few; otherwise ~14 ms of work per slice
    const slow = () => $('slowRun').checked && !batch;
    const slice = () => {
      if (state.running !== token) return finish(true);
      if (slow()) {
        const n = ga.generation < 100 ? 1 : ga.generation < 400 ? 3 : 10;
        for (let k = 0; k < n && !ga.done; k++) {
          ga.step(1);
          snap();
        }
      } else {
        const end = performance.now() + 14;
        while (performance.now() < end && !ga.done) {
          ga.step(1);
          snap();
        }
      }
      $('progress').value = ga.generation / cfg.ga.generations;
      $('runStatus').textContent = t('run.status', { g: ga.generation, e: ga.evaluations.toLocaleString(locale()), f: ga.best.fitness.toFixed(2), s: ((performance.now() - t0) / 1000).toFixed(1) });
      if (slow() || performance.now() - lastDraw > 250) {
        lastDraw = performance.now();
        state.history = ga.history.slice();
        show(false);
        drawHistory();
      }
      if (ga.done) return finish(false);
      setTimeout(slice, slow() ? 40 : 0);
    };
    // the initial population is shown first, so the starting point is visible
    ga.step(0);
    state.history = ga.history.slice();
    show(false);
    drawHistory();
    if (slow()) document.querySelector('.stage').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(slice, slow() ? 1200 : 0);
  });
}

function recordExperiment(cfg, stopped, extra = {}) {
  const p = state.piece;
  const ev = evaluationOf(p);
  const ens = ensembleOf(p);
  const exp = {
    n: state.experiments.length + 1,
    config: cloneConfig(cfg),
    desc: describe(cfg),
    seed: cfg.ga.seed,
    fitness: p.fitness,
    critic: ev.humanLike,
    rests: ev.features.restRatio,
    consonance: ens ? ens.strongConsonance : null,
    parallels: ens ? ens.parallels : null,
    genes: p.genes.slice(),
    history: state.history.slice(),
    stopped,
    ...extra,
  };
  state.experiments.unshift(exp);
  if (state.experiments.length > 40) state.experiments.pop();
  state.selectedExperiment = exp.n;
  renderExperiments();
  return exp;
}

/** Buttons with the best individual at a few generations of an experiment (the convergence). */
function renderSnapshots(exp) {
  state.lastSnapshots = exp;
  const box = $('snapshots');
  box.innerHTML = '';
  $('snapBox').hidden = !exp?.snapshots?.length;
  if (!exp?.snapshots?.length) return;
  exp.snapshots.forEach((sn) => {
    const m = meterOfConfig(exp.config);
    if (sn.critic === undefined) sn.critic = critic.evaluate(sliceSteps(eventsToCompact(toEvents(sn.genes)), 128), { barLen: m.barLen, beat: m.beat }).humanLike;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.title = t('snap.title', { g: sn.generation, f: sn.fitness.toFixed(1), c: pct(sn.critic) });
    b.innerHTML = `${t('snap.label', { g: sn.generation })}<small>${t('snap.critic', { c: pct(sn.critic) })}</small>`;
    b.addEventListener('click', () => {
      if (state.running) return;
      box.querySelectorAll('.btn').forEach((x) => x.classList.toggle('primary', x === b));
      const built = buildFitness(exp.config);
      const res = built.fit.evaluate(sn.genes, { generation: sn.generation, maxGenerations: exp.config.ga.generations, evaluationCount: 0 });
      const titleOf = () => t('snap.pieceTitle', { n: exp.n, g: sn.generation });
      setPiece(pieceFromGenes(sn.genes, built, exp.config, {
        fitness: res.score, parts: res.parts,
        weights: built.mode === 'classic' ? exp.config.classicG2 : built.fit.weights,
        title: titleOf(), titleOf,
      }));
    });
    box.append(b);
  });
}

function updateStartHint() {
  const c = state.config;
  const last = state.lastPopulation;
  const parts = [];
  const start = c.ga.start ?? 'seed';
  if (start === 'seed') parts.push(t('start.hint.seed'));
  else if (start === 'newSeed') parts.push(t('start.hint.newSeed'));
  else if (!last) parts.push(t('start.hint.noPrev'));
  else if (last.length !== c.bars * meterOfConfig(c).barLen || (last.meter ?? '4/4') !== meterOfConfig(c).id) parts.push(t('start.hint.otherMeter', { n: last.from }));
  else parts.push(t('start.hint.continue', { n: last.from }));
  if (c.ga.operators === 'binary') parts.push(t('start.hint.binary'));
  else if (c.ga.init === 'random') parts.push(t('start.hint.random'));
  else if (c.ga.init === 'musical') parts.push(t('start.hint.musical'));
  else if (c.ga.init === 'blocks') parts.push(t('start.hint.blocks'));
  else parts.push(t(activeVoices(c).length > 1 ? 'start.hint.canon' : 'start.hint.auto'));
  $('startHint').textContent = parts.join(' ');
}

function renderExperiments() {
  const box = $('experiments');
  if (!state.experiments.length) {
    box.innerHTML = `<p class="hint">${t('exp.none')}</p>`;
    return;
  }
  const rows = state.experiments.map((e) => `<tr class="${e.n === state.selectedExperiment ? 'sel' : ''}"><td class="num">${e.n}</td><td>${describe(e.config)}${t('exp.seed', { s: e.seed })}${e.stopped ? t('exp.stoppedTag') : ''}</td><td class="num">${e.fitness.toFixed(1)}</td><td class="num">${pct(e.critic)}</td><td class="num">${e.consonance === null ? '—' : pct(e.consonance)}</td><td><button class="btn" type="button" data-exp="${e.n}">${t('exp.load')}</button></td></tr>`);
  box.innerHTML = `<table class="data"><thead><tr><th>#</th><th>${t('exp.col.config')}</th><th>${t('exp.col.fitness')}</th><th>${t('exp.col.critic')}</th><th>${t('exp.col.consonance')}</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
  box.querySelectorAll('button[data-exp]').forEach((b) => b.addEventListener('click', () => loadExperiment(Number(b.dataset.exp))));
}

function loadExperiment(n) {
  const e = state.experiments.find((x) => x.n === n);
  if (!e || state.running) return;
  state.config = cloneConfig(e.config);
  controls.renderAll();
  const built = buildFitness(state.config);
  const res = built.fit.evaluate(e.genes, { generation: state.config.ga.generations, maxGenerations: state.config.ga.generations, evaluationCount: 0 });
  state.history = e.history.slice();
  state.selectedExperiment = n;
  if (e.population) state.lastPopulation = { genomes: e.population.map((g) => Array.from(g)), length: e.genes.length, meter: meterOfConfig(e.config).id, from: n };
  renderSnapshots(e);
  updateStartHint();
  const titleOf = () => t('exp.loadedTitle', { n, s: e.seed });
  setPiece(pieceFromGenes(e.genes, built, state.config, {
    fitness: res.score, parts: res.parts,
    weights: built.mode === 'classic' ? state.config.classicG2 : built.fit.weights,
    title: titleOf(), titleOf,
  }));
  updatePreview();
  drawHistory();
  renderExperiments();
  $('runStatus').textContent = t('exp.loaded', { n, desc: describe(e.config) });
}

async function runBatch() {
  const base = cloneConfig(state.config);
  const results = [];
  state.batch = true;
  for (let k = 0; k < 5 && state.batch; k++) {
    const cfg = cloneConfig(base);
    cfg.ga.seed = (base.ga.seed || 1) + k;
    $('batchSummary').innerHTML = `<p class="hint">${t('batch.testing', { s: cfg.ga.seed, k: k + 1 })}</p>`;
    const r = await runGA(cfg, { batch: true });
    if (!r || r.stopped) break;
    results.push(r);
  }
  state.batch = false;
  if (!results.length) {
    $('batchSummary').innerHTML = '';
    return;
  }
  const stats = (xs) => {
    const m = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1));
    return { m, sd, lo: Math.min(...xs), hi: Math.max(...xs) };
  };
  const f = stats(results.map((r) => r.fitness));
  const c = stats(results.map((r) => r.critic));
  const cons = results[0].consonance === null ? null : stats(results.map((r) => r.consonance));
  const bestR = results.slice().sort((a, b) => b.critic - a.critic || b.fitness - a.fitness)[0];
  state.batchStats = { n: results.length, from: base.ga.seed, f, c, cons, best: { n: bestR.n, seed: bestR.seed } };
  renderBatchSummary(state.batchStats);
  loadExperiment(bestR.n);
}

function renderBatchSummary(b) {
  const { f, c, cons } = b;
  $('batchSummary').innerHTML = `<div class="seg"><h4>${t('batch.summary', { n: b.n, a: b.from, b: b.from + b.n - 1 })}</h4><dl class="kv"><dt>${t('exp.col.fitness')}</dt><dd>${f.m.toFixed(1)} ± ${f.sd.toFixed(1)} (${f.lo.toFixed(1)}–${f.hi.toFixed(1)})</dd><dt>${t('exp.col.critic')}</dt><dd>${pct(c.m)} ± ${Math.round(c.sd * 100)} (${pct(c.lo)}–${pct(c.hi)})</dd>${cons ? `<dt>${t('exp.col.consonance')}</dt><dd>${pct(cons.m)} (${pct(cons.lo)}–${pct(cons.hi)})</dd>` : ''}<dt>${t('batch.best')}</dt><dd>${t('batch.bestValue', { n: b.best.n, s: b.best.seed })}</dd></dl><p class="hint">${t('batch.hint')}</p></div>`;
}

// ------------------------------------------------------------------ playback & export

function togglePlay() {
  if (player.playing) {
    player.stop();
    state.playhead = null;
    $('playBtn').textContent = t('play.play');
    render();
    return;
  }
  playPiece(stagePiece());
}

function playPiece(p) {
  if (!p) return;
  const { voices } = soundingVoices(p);
  const n = voices.length;
  const pans = n === 1 ? [0] : n === 2 ? [-0.35, 0.35] : [-0.45, 0.45, 0];
  $('playBtn').textContent = t('play.stop');
  player.play(voices.map((v, i) => ({ events: v.events, instrument: v.instrument, pan: pans[i], gain: i ? 0.9 : 1 })), {
    bpm: Number($('bpm').value),
    onStep: (s) => {
      state.playhead = s;
      render();
    },
    onEnd: () => {
      state.playhead = null;
      $('playBtn').textContent = t('play.play');
      render();
    },
  });
}

// Inside the claude.ai viewer, downloads go through the `downloads` capability, which does not
// accept .mid: the file is handed over inside a .zip. Elsewhere a normal link is used.
const downloadsCap = window.claude?.use ? window.claude.use('downloads').catch(() => null) : Promise.resolve(null);

const TIME_SIGNATURES = { 6: [3, 8], 8: [2, 4], 12: [6, 8], 16: [4, 4], 24: [6, 4] };

async function downloadMidi() {
  const p = stagePiece();
  if (!p) return;
  const { voices } = soundingVoices(p);
  const tracks = voices.map((v, i) => ({
    events: v.events,
    name: `${instrument(v.instrument).label} ${i + 1}`,
    program: instrument(v.instrument).program,
  }));
  const [num, den] = p.meter && METERS[p.meter] ? [METERS[p.meter].num, METERS[p.meter].den] : TIME_SIGNATURES[p.barLen] ?? [4, 4];
  const bytes = writeMidi(tracks, { bpm: Number($('bpm').value), numerator: num, denominator: den });
  await saveFile(`ondas-atratoras-${Date.now()}.mid`, bytes, 'audio/midi', t('dl.midiSaved', { tracks: tn('dl.tracks', tracks.length) }));
}

/** Download a file; inside the claude.ai viewer it goes through the downloads capability, in a ZIP. */
async function saveFile(filename, bytes, mime, savedNote) {
  const dl = await downloadsCap;
  if (dl) {
    try {
      await dl.save({ filename: filename.replace(/\.[^.]+$/, '.zip'), data: makeZip([{ name: filename, data: bytes }]) });
      $('midiNote').textContent = savedNote;
    } catch (e) {
      const code = e && e.code;
      $('midiNote').textContent = t(code === 'declined' ? 'dl.declined' : code === 'rate_limited' ? 'dl.rate' : 'dl.unavailable');
    }
    return;
  }
  const blob = new Blob([bytes], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ------------------------------------------------------------------ MAP-Elites

function runMapElites() {
  const cfg = cloneConfig(state.config);
  cfg.mode = 'field'; // MAP-Elites uses the attractor field (the classic rules are not averaged)
  const built = buildFitness(cfg);
  const archive = createMapElites({ fitness: built.fit, env: built.env, rng: createRng((cfg.ga.seed || 1) + 17), x: $('mx').value, y: $('my').value });
  archive.built = built;
  archive.config = cfg;
  state.archive = archive;
  state.selectedCell = -1;
  const total = Number($('meEvals').value);
  const token = {};
  state.meRunning = token;
  $('meRun').disabled = true;
  $('meStop').disabled = false;
  axisLabels(archive);
  const slice = () => {
    const end = performance.now() + 14;
    while (performance.now() < end && archive.evaluations < total && state.meRunning === token) archive.step(20);
    $('meProgress').value = archive.evaluations / total;
    $('meStatus').textContent = t('me.progress', { e: archive.evaluations.toLocaleString(locale()), c: Math.round(archive.coverage() * 100), b: archive.best().fitness.toFixed(1) });
    drawMap();
    if (archive.evaluations < total && state.meRunning === token) setTimeout(slice, 0);
    else {
      state.meRunning = null;
      $('meRun').disabled = false;
      $('meStop').disabled = true;
      $('meStatus').textContent += t('me.click');
    }
  };
  setTimeout(slice, 0);
}

function axisLabels(archive) {
  $('mxLabel').textContent = `→ ${DESCRIPTORS[archive.x].label} (${DESCRIPTORS[archive.x].range.join('–')})`;
  $('myLabel').textContent = `↑ ${DESCRIPTORS[archive.y].label} (${DESCRIPTORS[archive.y].range.join('–')})`;
}

let mapGeom = null;
function drawMap() {
  if (!state.archive || state.tab !== 'explore') return;
  mapGeom = eliteMap($('eliteMap'), state.archive, state.selectedCell);
}

function onMapClick(ev) {
  if (!state.archive || !mapGeom) return;
  const r = ev.currentTarget.getBoundingClientRect();
  const idx = mapGeom.cellAt(ev.clientX - r.left, ev.clientY - r.top);
  const cell = state.archive.cells[idx];
  if (!cell) return;
  state.selectedCell = idx;
  const a = state.archive;
  const titleOf = () => t('me.cellTitle', { x: DESCRIPTORS[a.x].label.toLowerCase(), vx: cell.vx.toFixed(2), y: DESCRIPTORS[a.y].label.toLowerCase(), vy: cell.vy.toFixed(2) });
  setPiece(pieceFromGenes(cell.genes, a.built, a.config, {
    fitness: cell.fitness,
    parts: cell.parts,
    weights: a.built.fit.weights,
    title: titleOf(), titleOf,
  }));
  $('cellInfo').textContent = t('me.cellInfo', { f: cell.fitness.toFixed(1), c: pct(evaluationOf(state.piece).humanLike) });
  drawMap();
  playPiece(state.piece);
}

// ------------------------------------------------------------------ variations

function renderVariationsPlaceholder() {
  $('varList').innerHTML = `<p class="hint">${t('var.loaded')}</p>`;
}

function makeVariations() {
  const theme = state.piece;
  if (!theme) return;
  const base = 10 ** Number($('divergence').value);
  const list = [0.5, 1, 2].map((m) => {
    const events = chaoticVariation(theme.events, { divergence: Math.min(0.9, base * m), mode: $('varMode').value, rule: $('varRule').value });
    return { events, divergence: Math.min(0.9, base * m), sim: similarityToTheme(theme.events, events), from: divergencePoint(theme.events, events) };
  });
  state.variations = list;
  state.varTheme = theme;
  renderVariationList();
}

function renderVariationList() {
  const theme = state.varTheme;
  const list = state.variations;
  if (!theme) return;
  const box = $('varList');
  box.innerHTML = '';
  const addItem = (label, events, info) => {
    const div = document.createElement('div');
    div.className = 'varitem';
    div.innerHTML = `<strong>${label}</strong><span class="status">${info}</span>`;
    const variant = () => {
      const genes = fromEvents(events, theme.length);
      return { ...theme, events: toEvents(genes), genes, ensemble: null, evaluation: null };
    };
    const play = document.createElement('button');
    play.className = 'btn';
    play.type = 'button';
    play.textContent = '▶';
    play.setAttribute('aria-label', t('var.play', { label }));
    play.addEventListener('click', () => playPiece(variant()));
    const load = document.createElement('button');
    load.className = 'btn';
    load.type = 'button';
    load.textContent = t('var.view');
    load.addEventListener('click', () => {
      const v = variant();
      state.piece = { ...v, title: t('var.of', { label, title: theme.title }), titleOf: null, baseTitle: null, heuristics: undefined, fitness: undefined, parts: null };
      renderChips(state.piece);
      render();
      renderParts();
    });
    div.append(play, load);
    box.appendChild(div);
  };
  addItem(t('var.theme'), theme.events, t('var.original'));
  list.forEach((v, i) => addItem(t('var.n', { n: i + 1 }), v.events, t('var.info', { d: v.divergence.toFixed(3), k: v.from + 1, s: Math.round(v.sim * 100) })));
}

function buildForm() {
  const A = state.piece;
  if (!A) return;
  const base = 10 ** Number($('divergence').value);
  const A1 = chaoticVariation(A.events, { divergence: base, mode: 'pitch', rule: $('varRule').value });
  const B = chaoticVariation(A.events, { divergence: 0.6, mode: 'full', rule: $('varRule').value });
  const A2 = chaoticVariation(A.events, { divergence: Math.min(0.9, base * 3), mode: 'pitch', rule: $('varRule').value });
  const parts = [A.events, A1, B, A2];
  const events = [];
  parts.forEach((evs, k) => {
    for (const e of evs) events.push({ ...e, start: e.start + k * A.length });
  });
  const length = 4 * A.length;
  const genes = fromEvents(events, length);
  const titleOf = () => t('var.formTitle');
  setPiece({ ...A, events: toEvents(genes), genes, length, waves: [], circular: false, config: null, ensemble: null, evaluation: null, heuristics: undefined, title: titleOf(), titleOf, baseTitle: null, fitness: undefined, parts: null });
}

// ------------------------------------------------------------------ analyser

const REFERENCE_VOICES = { telemann: 'violin', telemann2: 'flute', telemann3: 'violin', frereJacques: 'soprano', rowYourBoat: 'soprano' };

function referenceVoices(key, r) {
  const inst = REFERENCE_VOICES[key] ?? 'violin';
  const second = inst === 'soprano' ? 'alto' : inst;
  const id = (x) => x;
  return [
    { instrument: inst, delay: 0, delayBars: 0, interval: 'unison', map: id, range: instrument(inst).range },
    { instrument: second, delay: r.delayBars * r.barLen, delayBars: r.delayBars, interval: 'unison', map: id, range: instrument(second).range },
  ];
}

function analysisSource() {
  const src = $('anSource').value;
  const solo = (inst) => [{ instrument: inst, delay: 0, delayBars: 0, interval: 'unison', map: (x) => x, range: instrument(inst).range }];
  if (src === 'current') {
    const p = state.piece;
    return { compact: eventsToCompact(p.events), barLen: p.barLen, meter: p.meter ?? null, title: p.title, key: p.key, voices: p.voices, circular: p.circular };
  }
  if (REFERENCE_CANONS[src]) {
    const r = REFERENCE_CANONS[src];
    return { compact: referenceEvents(r), barLen: r.barLen, title: r.title, key: { tonic: r.tonic, mode: r.mode }, voices: referenceVoices(src, r), circular: !!r.circular, end: r.endStep };
  }
  if (src === 'corpus') {
    const m = corpus[Number($('anCorpus').value)];
    // the critic's corpus has quarter-note beats only: a bar of 12 sixteenths is 3/4
    return { compact: m.events, barLen: m.barLen, meter: { 8: '2/4', 12: '3/4', 16: '4/4' }[m.barLen] ?? null, title: `${sourceName(m.source)} — ${m.title}`, key: { tonic: m.tonic, mode: m.mode }, voices: solo(state.config.voices[0].instrument) };
  }
  if (src === 'midi') return state.midiUpload && { ...state.midiUpload, voices: solo(state.config.voices[0].instrument) };
  return null;
}

async function onMidiFile() {
  const f = $('anFile').files[0];
  if (!f) return;
  try {
    const bytes = new Uint8Array(await f.arrayBuffer());
    const res = readMidi(bytes);
    if (!res.compact.length) throw new Error(t('an.midiNoNotes'));
    state.midiUpload = { compact: res.compact, barLen: res.barLen, meter: meterFromSignature(res.numerator, res.denominator)?.id ?? null, title: f.name, key: null };
    $('anSource').value = 'midi';
    $('anCorpusRow').hidden = true;
    $('anStatus').textContent = t('an.midiInfo', { name: f.name, n: res.tracks.length, num: res.numerator, den: res.denominator });
  } catch (e) {
    $('anStatus').textContent = t('an.midiError', { msg: e.message });
  }
}

function runAnalysis() {
  const src = analysisSource();
  if (!src) {
    $('anStatus').textContent = t('an.loadFirst');
    return;
  }
  const t0 = performance.now();
  const res = analyzePiece(src.compact, {
    segments: Number($('anK').value),
    mode: $('anMode').value,
    waves: Number($('anM').value),
    barLen: src.barLen,
    rng: createRng(99),
  });
  state.analysis = res;
  state.analysisSrc = src;
  const events = compactToEvents(src.compact);
  state.analysisPiece = {
    events, length: res.total, barLen: src.barLen, meter: src.meter ?? null, title: t('an.pieceTitle', { title: src.title }), key: src.key, waves: [],
    voices: src.voices, circular: !!src.circular, end: src.end, tonic: src.key?.tonic,
  };
  $('anStatus').textContent = t('an.time', { ms: Math.round(performance.now() - t0) });
  $('anUse').disabled = !res.segments[0]?.fit;
  renderAnalysis(res, src);
  render();
}

const fmtF = (f) => (f === 0 ? t('an.constant') : f < 1 ? t('an.cycleIn', { f: f.toFixed(3), b: (1 / f).toFixed(1) }) : t('an.cyclesPerBar', { f: f.toFixed(2) }));
// a mean value is rarely a note: name it, or say between which notes it lies
const noteHz = (m) => {
  const r = Math.round(m);
  const name = Math.abs(m - r) <= 0.25 ? midiName(r) : t('an.between', { a: midiName(Math.floor(m)), b: midiName(Math.ceil(m)) });
  return `${name} · ${m.toFixed(1)} · ${hz(m).toFixed(0)} Hz`;
};

function waveRows(w) {
  return `<dt>${t('an.freq')}</dt><dd>${fmtF(w.freq)}</dd><dt>${t('an.mean')}</dt><dd>${noteHz(w.mean)}</dd><dt>${t('an.amp')}</dt><dd>${t('an.ampValue', { a: w.amplitude.toFixed(1) })}</dd><dt>${t('an.basin')}</dt><dd>${t('an.basinValue', { b: w.basin.toFixed(1) })}</dd><dt>${t('an.share')}</dt><dd>${Math.round(w.share * 100)} %</dd>`;
}

function renderAnalysis(res, src) {
  const box = $('anSegments');
  box.innerHTML = '';
  res.segments.forEach((s, i) => {
    const bars = t('an.bars', { a: (s.start / res.barLen + 1).toFixed(s.start % res.barLen ? 1 : 0), b: (s.end / res.barLen).toFixed(s.end % res.barLen ? 1 : 0) });
    const lowW = s.lowestWave;
    const div = document.createElement('div');
    div.className = 'seg';
    let html = `<h4>${t('an.part', { n: i + 1, bars })}</h4>`;
    html += `<dl class="kv"><dt>${t('an.notes')}</dt><dd>${s.notes}</dd><dt>${t('an.wavesBic')}</dt><dd>${s.fit ? s.fit.M : '—'} · R² ${s.fit ? s.fit.r2.toFixed(2) : '—'}</dd><dt>${t('an.lowest')}</dt><dd>${noteHz(s.register.lowest)}</dd><dt>${t('an.lowMean')}</dt><dd>${noteHz(s.register.lowMean)}</dd><dt>${t('an.highest')}</dt><dd>${noteHz(s.register.highest)}</dd><dt>${t('an.highMean')}</dt><dd>${noteHz(s.register.highMean)}</dd></dl>`;
    if (lowW) html += `<div><span class="wave-tag" style="background:var(--wave-1)"></span><strong>${t('an.lowWave')}</strong></div><dl class="kv">${waveRows(lowW)}</dl>`;
    s.highestWaves.forEach((w, k) => {
      html += `<div><span class="wave-tag" style="background:var(--wave-${k + 2})"></span><strong>${t(k === 0 ? 'an.highWave' : 'an.nextWave')}</strong></div><dl class="kv">${waveRows(w)}</dl>`;
    });
    html += `<canvas class="chart spec" data-seg="${i}" aria-label="${t('an.specAria', { n: i + 1 })}"></canvas>`;
    const sig = s.significant.length
      ? t('an.sig', { list: s.significant.slice(0, 5).map((p) => p.freq.toFixed(3)).join(', ') })
      : t('an.noSig');
    html += `<p class="hint">${sig}</p>`;
    div.innerHTML = html;
    box.appendChild(div);
  });
  drawSpectra();
  // summary across segments
  const lows = res.segments.map((s) => s.lowestWave).filter(Boolean);
  const highs = res.segments.flatMap((s) => s.highestWaves.slice(0, 1));
  const avg = (arr, f) => arr.reduce((a, x) => a + f(x), 0) / Math.max(1, arr.length);
  let html = `<dl class="kv"><dt>${t('an.sum.piece')}</dt><dd>${src.title}</dd><dt>${t('an.sum.parts')}</dt><dd>${res.segments.length}</dd>`;
  if (lows.length) html += `<dt>${t('an.sum.lowFreq')}</dt><dd>${fmtF(avg(lows, (w) => w.freq))}</dd><dt>${t('an.sum.lowMean')}</dt><dd>${noteHz(avg(lows, (w) => w.mean))}</dd>`;
  if (highs.length) html += `<dt>${t('an.sum.highFreq')}</dt><dd>${fmtF(avg(highs, (w) => w.freq))}</dd><dt>${t('an.sum.lowMean')}</dt><dd>${noteHz(avg(highs, (w) => w.mean))}</dd>`;
  html += `<dt>${t('an.sum.r2')}</dt><dd>${avg(res.segments.filter((s) => s.fit), (s) => s.fit.r2).toFixed(2)}</dd></dl>`;
  html += `<p class="hint">${t('an.sum.hint')}</p>`;
  $('anSummary').innerHTML = html;
}

function drawSpectra() {
  if (!state.analysis || state.tab !== 'analyze') return;
  document.querySelectorAll('canvas.spec').forEach((c) => {
    const s = state.analysis.segments[Number(c.dataset.seg)];
    const sorted = s.fit ? s.fit.waves.slice().sort((a, b) => a.freq - b.freq) : [];
    const marks = sorted.map((w, k) => ({ freq: w.freq, colorIndex: k === 0 ? 0 : k === sorted.length - 1 ? 1 : 1 + k })).filter((m) => m.freq > 0);
    spectrumChart(c, s.spectrum, s.threshold, marks);
  });
}

// the waves of the 1st part become the generator's waves (frequency per 4/4 bar, current key)
function useAnalysisWaves() {
  const s = state.analysis?.segments[0];
  const ap = state.analysisPiece;
  if (!s?.fit || !ap) return;
  const c = state.config;
  let shift = 0;
  if (ap.tonic !== undefined && ap.tonic !== null) {
    shift = (((keyOf(c).tonic - ap.tonic) % 12) + 12) % 12;
    if (shift > 6) shift -= 12;
  }
  c.waves = s.fit.waves.slice(0, 4).map((w) => {
    const spec = waveToSpec(w, ap.barLen);
    return {
      ...spec,
      freq: +((spec.freq * STEPS_PER_BAR) / ap.barLen).toFixed(4),
      mean: +(spec.mean + shift).toFixed(1),
      amplitude: +spec.amplitude.toFixed(1),
      basin: +spec.basin.toFixed(1),
      phase: +spec.phase.toFixed(1),
    };
  });
  c.wavePreset = 'custom';
  c.mode = 'field';
  controls.renderAll();
  updatePreview();
  $('anStatus').textContent = t('an.used', { n: c.waves.length, shift: shift ? t('an.shift', { s: `${shift > 0 ? '+' : ''}${shift}` }) : '' });
}

// ------------------------------------------------------------------ corpus building blocks (analyser)

function renderBlocksBox() {
  const meter = meterOfConfig(state.config);
  const M = getBlockModel(meter);
  const pctx = (x) => `${(x * 100).toFixed(1)} %`;
  if (!M) {
    $('blocksTables').innerHTML = `<p class="hint">${t('blocks.noData')}</p>`;
    return;
  }
  const d = M.data;
  const fig = (c) => `${figureName(c)} <span class="muted">${figureSyllables(c)}</span>`;
  const top = M.topFigures(10).map(([c, x]) => `<tr><td>${fig(c)}</td><td class="num">${pctx(x)}</td></tr>`).join('');
  const after = M.topFigures(4).map(([c]) => {
    const fi = M.figIndex(c);
    const nx = M.nextFigures(fi, 1 % d.beats, 3).map(([n, x]) => `${figureName(n)} ${pctx(x)}`).join(' · ');
    return `<tr><td>${figureName(c)}</td><td>${nx || '—'}</td></tr>`;
  }).join('');
  const dirs = M.entryByDirection();
  const DIRS = ['ss', 'sg', 'r', 'dg', 'ds'];
  const dirRows = DIRS.filter((k) => dirs[k]?.n).map((k) => `<tr><td>${t(`dir.${k}`)}</td><td class="num">${pctx(dirs[k].up / dirs[k].n)}</td><td class="num">${pctx(dirs[k].same / dirs[k].n)}</td><td class="num">${pctx(dirs[k].down / dirs[k].n)}</td></tr>`).join('');
  const own = d.meter === meter.id ? meter.id : t('blocks.few', { meter: d.meter, own: meter.id });
  const model = t('blocks.model', { rhythm: d.rhythm.model, ctx: Math.max(...d.rhythm.levels.map((l) => l.length - 1)), entry: d.entry.model, contour: d.contour.model, n: d.melodies });
  $('blocksTables').innerHTML = `<div><h4>${t('blocks.top', { meter: own })}</h4><table class="data"><thead><tr><th>${t('blocks.col.figure')}</th><th>${t('blocks.col.share')}</th></tr></thead><tbody>${top}</tbody></table>
    <h4>${t('blocks.after')}</h4><table class="data"><thead><tr><th>${t('blocks.col.fig')}</th><th>${t('blocks.col.next')}</th></tr></thead><tbody>${after}</tbody></table></div>
    <div><h4>${t('blocks.dir')}</h4><table class="data"><thead><tr><th>${t('blocks.col.if')}</th><th>${t('blocks.col.up')}</th><th>${t('blocks.col.same')}</th><th>${t('blocks.col.down')}</th></tr></thead><tbody>${dirRows}</tbody></table>
    <p class="hint">${model}</p></div>`;
}

// ------------------------------------------------------------------ evaluation tab

let referenceRows = null;
function referenceCanonRows() {
  if (referenceRows && referenceRows.lang === getLang()) return referenceRows;
  referenceRows = ['telemann', 'telemann2', 'telemann3'].map((k) => {
    const r = REFERENCE_CANONS[k];
    const c = analyzeCanon(compactToLine(referenceEvents(r)), { delay: r.delayBars * r.barLen, barLen: r.barLen, end: r.endStep });
    const roman = { telemann: 'I', telemann2: 'II', telemann3: 'III' }[k];
    return canonRow(`<span title="${r.title}">Telemann ${roman} · ${t('ev.atBars', { d: r.delayBars })}</span>`, c);
  });
  referenceRows.lang = getLang();
  return referenceRows;
}

const canonHead = (first) => `<tr><th>${first}</th><th title="${t('ev.col.consonance.title')}">${t('ev.col.consonance')}</th><th title="${t('ev.col.parallels.title')}">${t('ev.col.parallels')}</th><th>${t('ev.col.unisons')}</th><th title="${t('ev.col.contrary.title')}">${t('ev.col.contrary')}</th><th>${t('ev.col.score')}</th></tr>`;
const canonRow = (label, c) => `<tr><td>${label}</td><td class="num">${pct(c.strongConsonance)}</td><td class="num">${c.parallels}</td><td class="num">${pct(c.unisonRatio)}</td><td class="num">${pct(c.contraryRatio)}</td><td class="num">${c.score.toFixed(2)}</td></tr>`;

function renderEvaluation(p) {
  const ev = evaluationOf(p);
  $('evalSummary').innerHTML = `<dl class="kv"><dt>${t('ev.critic')}</dt><dd>${pct(ev.humanLike)}</dd><dt>${t('ev.typical')}</dt><dd>${t('ev.typicalValue', { a: Math.round(ev.typicality * criticData.features.length), b: criticData.features.length })}</dd><dt>${t('ev.surprise')}</dt><dd>${t('ev.surpriseValue', { v: ev.features.icPitch.toFixed(2), r: criticData.percentiles[criticData.features.indexOf('icPitch')].map((v) => v.toFixed(2)).join(' / ') })}</dd><dt>${t('ev.lz')}</dt><dd>${ev.features.lzComplexity.toFixed(2)}</dd><dt>${t('ev.validation')}</dt><dd>AUC ${criticData.cv.auc.toFixed(3)} (5-fold)</dd></dl><p class="hint">${t('ev.note')}</p>`;
  const line = lineOf(p);
  let html = '';
  const ens = ensembleOf(p);
  if (ens) {
    const vrows = p.voices.map((v, i) => {
      const ps = [];
      for (let s = 0; s < line.pitch.length; s++) if (line.onset[s]) ps.push(v.map(line.pitch[s]));
      const out = ps.filter((q) => q < v.range[0] || q > v.range[1]).length / Math.max(1, ps.length);
      return `<tr><td>${i + 1}</td><td>${instrument(v.instrument).label}</td><td>${t('ev.entryBar', { n: 1 + v.delay / p.barLen })}</td><td>${i ? INTERVALS[v.interval]?.label ?? '—' : t('ev.melody')}</td><td>${midiName(Math.min(...ps))}–${midiName(Math.max(...ps))}</td><td class="num ${out ? 'off' : 'ok'}">${pct(out)}</td></tr>`;
    });
    html += `<h4>${t('ev.voices')}</h4><table class="data"><thead><tr><th>#</th><th>${t('ev.col.instrument')}</th><th>${t('ev.col.entry')}</th><th>${t('ev.col.interval')}</th><th>${t('ev.col.register')}</th><th>${t('ev.col.out')}</th></tr></thead><tbody>${vrows.join('')}</tbody></table>`;
    const prows = ens.pairs.map((pr) => canonRow(t('ev.pair', { a: pr.i + 1, b: pr.j + 1 }), pr));
    html += `<h4>${t('ev.pairs')}</h4><table class="data"><thead>${canonHead(t('ev.col.voices'))}</thead><tbody>${prows.join('')}</tbody><tfoot><tr><td>${t('ev.all')}</td><td class="num">${pct(ens.strongConsonance)}</td><td class="num">${ens.parallels}</td><td class="num">${pct(ens.unisonRatio)}</td><td class="num">${pct(ens.contraryRatio)}</td><td class="num">${ens.score.toFixed(2)}</td></tr></tfoot></table>${p.voices.length >= 3 ? `<p class="hint">${t('ev.triads', { p: pct(ens.triadRatio) })}</p>` : ''}`;
  }
  const rows = [1, 2, 3].map((d) => canonRow(t('ev.atBars', { d }), analyzeCanon(line, { delay: d * p.barLen, barLen: p.barLen })));
  html += `<h4>${t('ev.self')}</h4><table class="data"><thead>${canonHead(t('ev.secondVoice'))}</thead><tbody>${rows.join('')}</tbody><tfoot>${referenceCanonRows().join('')}</tfoot></table>`;
  $('canonTable').innerHTML = html;
  const frows = criticData.features.map((f) => {
    const pf = ev.perFeature[f];
    return `<tr><td>${FEATURE_LABELS[f] || f}</td><td class="num ${pf.ok ? 'ok' : 'off'}">${fmtNum(pf.value)}</td><td class="num">${fmtNum(pf.p10)} – ${fmtNum(pf.p90)}</td></tr>`;
  });
  $('featureTable').innerHTML = `<table class="data"><thead><tr><th>${t('ev.col.feature')}</th><th>${t('ev.col.piece')}</th><th>${t('ev.col.real')}</th></tr></thead><tbody>${frows.join('')}</tbody></table>`;
}

const fmtNum = (v) => (Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2));

// ------------------------------------------------------------------ start

function start() {
  startLang(initialLang());
  applyTexts();
  initLanguage();
  initControls();
  try {
    if (localStorage.getItem('ondas-view') === 'score') state.view = 'score';
    if (localStorage.getItem('ondas-score-layout') === 'line') $('scoreLayout').value = 'line';
  } catch (e) {
    /* storage unavailable */
  }
  const ex = EXAMPLES[0];
  const cfg = cloneConfig(state.config);
  cfg.ga.seed = ex.seed;
  const built = buildFitness(cfg);
  const res = built.fit.evaluate(ex.genes);
  const titleOf = () => t('example.title');
  setPiece(pieceFromGenes(ex.genes, built, cfg, { fitness: res.score, parts: res.parts, weights: built.fit.weights, title: titleOf(), titleOf }));
  state.history = ex.history || [];
  updatePreview();
  updateStartHint();
  drawHistory();
  $('runStatus').textContent = t('status.readyDesc', { desc: describe(state.config) });
  if (state.view === 'score') setView('score');
}

start();
