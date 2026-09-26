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
import { describeBlock } from '../ga/blocks.js';
import { getBlockModel } from '../fitness/attractor.js';
import { createMapElites, DESCRIPTORS } from '../ga/mapelites.js';
import { chaoticVariation, divergencePoint, similarityToTheme } from '../variation/dabby.js';
import { analyzePiece, waveToSpec, hz } from '../analysis/wavefit.js';
import { loadCritic } from '../eval/critic.js';
import { FEATURE_LABELS } from '../eval/metrics.js';
import { writeMidi, readMidi } from '../io/midi.js';
import { scoreModel, toLilyPond } from '../io/notation.js';
import { estimateKey } from '../core/theory.js';
import { makeZip } from '../io/zip.js';
import { REFERENCE_CANONS, referenceEvents, compactToLine } from '../data/references.js';
import criticData from '../data/critic-data.js';
import corpus from '../data/corpus-data.js';
import { EXAMPLES } from '../data/examples.js';
import { drawRoll } from './pianoroll.js';
import { lineChart, spectrumChart, eliteMap } from './charts.js';
import { createPlayer } from './audio.js';
import { loadVexFlow, renderScore } from './score.js';
import { ABOUT_HTML } from './about.js';
import {
  defaultConfig, cloneConfig, voiceSpecs, applyEnsemble, buildFitness, autoConfigure, autoWaves,
  presetWaves, wavesFromRealMelody, surprise, describe, activeVoices, keyOf, adaptToVoices,
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

function initControls() {
  controls.bind();
  controls.renderAll();
  for (const [k, d] of Object.entries(DESCRIPTORS)) {
    option($('mx'), k, d.label, k === 'density');
    option($('my'), k, d.label, k === 'leaps');
  }
  option($('anSource'), 'current', 'Peça atual');
  option($('anSource'), 'telemann', 'Telemann — Sonata I (TWV 40:118), Vivace', true);
  option($('anSource'), 'telemann2', 'Telemann — Sonata II (TWV 40:119), Vivace');
  option($('anSource'), 'telemann3', 'Telemann — Sonata III (TWV 40:120), Spirituoso');
  option($('anSource'), 'frereJacques', 'Frère Jacques (ronda)');
  option($('anSource'), 'rowYourBoat', 'Row, Row, Row Your Boat (ronda)');
  option($('anSource'), 'corpus', 'Melodia do corpus');
  option($('anSource'), 'midi', 'Ficheiro MIDI carregado');
  corpus.forEach((m, i) => option($('anCorpus'), i, `${sourceName(m.source)} — ${m.title}`));
  $('bpm').addEventListener('input', () => ($('bpmVal').textContent = $('bpm').value));
  $('divergence').addEventListener('input', showDivergence);
  $('anK').addEventListener('input', () => ($('anKVal').textContent = `${$('anK').value} parte${$('anK').value === '1' ? '' : 's'}`));
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
    configReplaced('Auto-configurado a partir das vozes: ondas no registo comum dos instrumentos, forma, pesos e algoritmo por omissão.');
  });
  $('surpriseBtn').addEventListener('click', () => {
    surprise(state.config, createRng(1 + Math.floor(Math.random() * 1e9)));
    configReplaced(`Surpresa: ${describe(state.config)}. Carregue em Gerar.`);
  });
  $('resetBtn').addEventListener('click', () => {
    state.config = defaultConfig();
    configReplaced('Configuração por omissão.');
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
    $('wavesHint').textContent = `Ondas ajustadas a «${res.title}» (${sourceName(res.source)}), transpostas para a tonalidade e o registo atuais. ${$('wavesHint').textContent}`;
  });
  $('configBox').addEventListener('toggle', () => $('configBox').open && fillConfigText());
  $('copyConfig').addEventListener('click', copyConfig);
  $('applyConfig').addEventListener('click', applyConfigText);
  $('playBtn').addEventListener('click', togglePlay);
  $('viewRoll').addEventListener('click', () => setView('roll'));
  $('viewScore').addEventListener('click', () => setView('score'));
  $('lilyBtn').addEventListener('click', downloadLily);
  $('lilyBox').addEventListener('toggle', () => $('lilyBox').open && fillLily());
  $('copyLily').addEventListener('click', async () => {
    fillLily();
    try {
      await navigator.clipboard.writeText($('lilyText').value);
      $('lilyNote').textContent = 'Copiado.';
    } catch (e) {
      $('lilyText').select();
      $('lilyNote').textContent = 'Selecionado: use Ctrl+C / ⌘C para copiar.';
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
  $('aboutBox').innerHTML = ABOUT_HTML;
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
  $('divVal').textContent = `perturbação inicial ${v.toFixed(3)} (x₀ = ${(1 - v).toFixed(3)})`;
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
  if (kind === 'voices' || kind === 'piece') controls.renderWaves();
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
  $('configNote').textContent = 'Guarde este texto para repetir a experiência mais tarde, ou cole outro e carregue em «Aplicar o texto».';
}

async function copyConfig() {
  fillConfigText();
  try {
    await navigator.clipboard.writeText($('configText').value);
    $('configNote').textContent = 'Copiado.';
  } catch (e) {
    $('configText').select();
    $('configNote').textContent = 'Selecionado: use Ctrl+C / ⌘C para copiar.';
  }
}

function applyConfigText() {
  try {
    const parsed = JSON.parse($('configText').value);
    const def = defaultConfig();
    const c = { ...def, ...parsed, ga: { ...def.ga, ...(parsed.ga || {}) } };
    if (!Array.isArray(c.voices) || !c.voices[0]?.instrument) throw new Error('faltam as vozes');
    while (c.voices.length < 3) c.voices.push(def.voices[c.voices.length]);
    if (!Array.isArray(c.waves) || !c.waves.length) throw new Error('é precisa pelo menos uma onda');
    c.waves = c.waves.slice(0, 4);
    state.config = c;
    configReplaced(`Configuração aplicada: ${describe(c)}.`);
    $('configNote').textContent = 'Aplicada.';
  } catch (e) {
    $('configNote').textContent = `Texto inválido (${e.message}).`;
  }
}

// ------------------------------------------------------------------ pieces

/** A piece made of genes under a configuration: events, waves, voices of the canon. */
function pieceFromGenes(genes, built, cfg, extra = {}) {
  return {
    events: toEvents(genes),
    genes,
    length: genes.length,
    barLen: STEPS_PER_BAR,
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
  return { length, barLen: p.barLen, voices, waves, segments, key: p.key, playhead: state.playhead, title: p.title };
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
    const txt = i === 0 ? `${inst} (melodia)` : `${inst} · entra no c. ${1 + s.delay / p.barLen}${s.interval && s.interval !== 'unison' ? ` · ${INTERVALS[s.interval]?.label ?? ''}` : ''}`;
    legend.push(`<span><i style="background:${colours[i]}"></i>${txt}</span>`);
  });
  const analyzing = state.tab === 'analyze' && state.analysis && p === state.analysisPiece;
  if (!analyzing) {
    scene.waves.forEach((w, i) => legend.push(`<span><i style="background:var(--wave-${(i % 4) + 1})"></i>onda ${i + 1} · ${w.shape === 'step' ? `bacia ±${Number(w.basin)} meios-tons` : `bacia σ ${Number(w.basin).toFixed(1)}`}${w.preview ? ' (tracejado: configuração atual, ainda por gerar)' : ''}</span>`));
  } else legend.push('<span><i style="background:var(--wave-1)"></i>onda de frequência mais baixa</span><span><i style="background:var(--wave-2)"></i>ondas mais rápidas</span><span>faixas: partes</span>');
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

/** Score model of what is on the stage: the voices as they sound, one staff each. */
function scoreModelFor(p) {
  const { voices, total } = soundingVoices(p);
  const count = {};
  voices.forEach((v) => (count[v.instrument] = (count[v.instrument] || 0) + 1));
  const seen = {};
  const named = voices.map((v) => {
    const label = instrument(v.instrument).label;
    seen[v.instrument] = (seen[v.instrument] || 0) + 1;
    return { events: v.events, instrument: v.instrument, name: count[v.instrument] > 1 ? `${label} ${seen[v.instrument]}` : label };
  });
  let key = p.key;
  if (!key || !key.mode) {
    const notes = p.events.filter((e) => e.pitch !== null);
    key = notes.length ? estimateKey(notes.map((e) => e.pitch), notes.map((e) => e.dur)) : { tonic: 0, mode: 'major' };
  }
  return scoreModel({
    voices: named,
    total,
    barLen: p.barLen,
    key,
    title: p.title.replace(/ · geração \d+ \(a evoluir…\)$/, '').replace(/ \(a evoluir…\)$/, ''),
    subtitle: p.config ? describe(p.config) : '',
    bpm: Number($('bpm').value),
  });
}

// redraws only when the piece, the voices shown or the width change; at most ~3 times a second
function renderScoreView() {
  const p = stagePiece();
  const box = $('score');
  const width = box.clientWidth || 800;
  const cs = getComputedStyle(document.documentElement);
  const theme = cs.getPropertyValue('--paper').trim();
  const sig = { p, all: $('canonPlay').checked, width, theme, bpm: $('bpm').value };
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
      box.innerHTML = `<p class="msg">Não foi possível mostrar a partitura (${e.message}). O código LilyPond continua disponível.</p>`;
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

async function downloadLily() {
  const p = stagePiece();
  if (!p) return;
  const text = toLilyPond(scoreModelFor(p));
  await saveFile(`ondas-atratoras-${Date.now()}.ly`, new TextEncoder().encode(text), 'text/x-lilypond', 'Guardado: ZIP com o ficheiro LilyPond (.ly).');
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
  p.ensemble = analyzeEnsemble(lineOf(p), p.voices, { circular: !!p.circular, barLen: p.barLen, end: p.end ?? null });
  return p.ensemble;
}

function evaluationOf(p) {
  if (!p.evaluation) p.evaluation = critic.evaluate(sliceSteps(eventsToCompact(p.events), 128), { barLen: p.barLen });
  return p.evaluation;
}

function renderChips(p) {
  state.chipsFor = p;
  const chips = [];
  if (p.fitness !== undefined) chips.push(`<span class="chip">aptidão <b>${p.fitness.toFixed(1)}</b></span>`);
  const ev = evaluationOf(p);
  const cls = ev.humanLike >= 0.7 ? 'good' : ev.humanLike >= 0.4 ? 'warn' : 'bad';
  chips.push(`<span class="chip ${cls}" title="Probabilidade de ser uma melodia real segundo o crítico">crítico <b>${pct(ev.humanLike)}</b></span>`);
  chips.push(`<span class="chip" title="Características dentro do intervalo P10–P90 das melodias reais">típico <b>${Math.round(ev.typicality * criticData.features.length)}/${criticData.features.length}</b></span>`);
  chips.push(`<span class="chip">pausas <b>${pct(ev.features.restRatio)}</b></span>`);
  const ens = ensembleOf(p);
  if (ens) {
    const good = ens.strongConsonance >= 0.75 ? 'good' : ens.strongConsonance >= 0.6 ? 'warn' : 'bad';
    chips.push(`<span class="chip ${good}" title="Consonâncias nos tempos fortes entre todas as vozes (média dos pares)">${p.voices.length} vozes · consonância <b>${pct(ens.strongConsonance)}</b></span>`);
    chips.push(`<span class="chip" title="Quintas e oitavas paralelas entre quaisquer duas vozes">paralelas <b>${ens.parallels}</b></span>`);
    if (p.voices.length >= 3) chips.push(`<span class="chip" title="Tempos fortes em que as três vozes formam um acorde perfeito">tríades <b>${pct(ens.triadRatio)}</b></span>`);
    if (ens.outOfRange > 0) chips.push(`<span class="chip bad" title="Notas fora do alcance de algum instrumento">fora do registo <b>${pct(ens.outOfRange)}</b></span>`);
  } else {
    const c = analyzeCanon(lineOf(p), { delay: p.barLen, barLen: p.barLen });
    chips.push(`<span class="chip" title="Se fosse tocada em cânone com uma 2.ª voz a 1 compasso">como cânone a 1 c. <b>${pct(c.strongConsonance)}</b></span>`);
  }
  $('pieceChips').innerHTML = chips.join('');
}

function renderParts() {
  const p = state.piece;
  const box = $('partsBars');
  box.innerHTML = '';
  if (!p || !p.parts) return;
  const labels = p.mode === 'classic' ? CLASSIC_LABELS : FIELD_LABELS;
  const entries = Object.keys(labels).filter((k) => p.mode === 'classic' || !['canon', 'idiom'].includes(k) || (p.weights?.[k] ?? 0) !== 0).map((k) => [k, (p.weights?.[k] ?? 0) * (p.parts[k] ?? 0)]);
  const maxAbs = Math.max(1e-9, ...entries.map(([, v]) => Math.abs(v)));
  $('partsHint').textContent = p.mode === 'classic'
    ? 'Regras originais: somas (não médias) multiplicadas pelo peso do grupo ativo; barras relativas à maior.'
    : 'Cada regra é uma média em [−1, 1] multiplicada pelo seu peso; barras relativas à maior contribuição.';
  for (const [k, v] of entries) {
    const w = (Math.abs(v) / maxAbs) * 50;
    box.insertAdjacentHTML('beforeend', `<span>${labels[k]}</span><span class="track"><span class="fill ${v < 0 ? 'neg' : ''}" style="${v < 0 ? `right:50%;width:${w}%` : `left:50%;width:${w}%`}"></span></span><span class="num">${v.toFixed(1)}</span>`);
  }
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
  ], { xLabel: 'geração' });
}

// ------------------------------------------------------------------ GA runs and experiments

const MODE_LABEL = { field: 'Campo de atratores', classic: 'Clássico' };

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
    $('playBtn').textContent = '▶ Tocar';
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
      $('runStatus').textContent = `Configuração inválida: ${e.message}`;
      resolve(null);
      return;
    }
    const seed = cfg.ga.seed || 1;
    const binary = cfg.ga.operators === 'binary';
    const last = state.lastPopulation;
    const continuing = start === 'continue' && last && last.length === built.fit.length;
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
    const title = (final) => `${MODE_LABEL[built.mode]} · ${nVoices > 1 ? `${nVoices} vozes · ` : ''}semente ${seed}${continuing ? ` · continua a exp. ${last.from}` : ''}${final ? '' : ` · geração ${ga.generation} (a evoluir…)`}`;
    const show = (final) => {
      const best = ga.best;
      const weights = built.mode === 'classic'
        ? (built.fit.phaseOf({ generation: ga.generation, maxGenerations: cfg.ga.generations }) === 1 ? cfg.classicG1 : cfg.classicG2)
        : built.fit.weights;
      setPiece(pieceFromGenes(best.decoded, built, cfg, { fitness: best.fitness, parts: best.parts, weights, title: title(final) }));
    };
    const finish = (stopped) => {
      state.running = null;
      setRunning(false);
      state.history = ga.history.slice();
      if (!snapshots.some((x) => x.generation === ga.generation)) snapshots.push({ generation: ga.generation, genes: ga.best.decoded, fitness: ga.best.fitness });
      show(true);
      drawHistory();
      $('runStatus').textContent += stopped ? ' · parado' : ' · concluído';
      const population = ga.population.map((ind) => Uint8Array.from(ga.decode(ind.genes)));
      const exp = recordExperiment(cfg, stopped, { snapshots, population, ...origin });
      state.lastPopulation = { genomes: population.map((g) => Array.from(g)), length: built.fit.length, from: exp.n };
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
      $('runStatus').textContent = `Geração ${ga.generation} · avaliações ${ga.evaluations.toLocaleString('pt-PT')} · aptidão ${ga.best.fitness.toFixed(2)} · ${((performance.now() - t0) / 1000).toFixed(1)} s`;
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
  const box = $('snapshots');
  box.innerHTML = '';
  $('snapBox').hidden = !exp?.snapshots?.length;
  if (!exp?.snapshots?.length) return;
  exp.snapshots.forEach((sn) => {
    if (sn.critic === undefined) sn.critic = critic.evaluate(sliceSteps(eventsToCompact(toEvents(sn.genes)), 128), { barLen: STEPS_PER_BAR }).humanLike;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.title = `Melhor indivíduo na geração ${sn.generation}: aptidão ${sn.fitness.toFixed(1)}, crítico ${pct(sn.critic)}`;
    b.innerHTML = `ger. ${sn.generation}<small>crítico ${pct(sn.critic)}</small>`;
    b.addEventListener('click', () => {
      if (state.running) return;
      box.querySelectorAll('.btn').forEach((x) => x.classList.toggle('primary', x === b));
      const built = buildFitness(exp.config);
      const res = built.fit.evaluate(sn.genes, { generation: sn.generation, maxGenerations: exp.config.ga.generations, evaluationCount: 0 });
      setPiece(pieceFromGenes(sn.genes, built, exp.config, {
        fitness: res.score, parts: res.parts,
        weights: built.mode === 'classic' ? exp.config.classicG2 : built.fit.weights,
        title: `Experiência ${exp.n} · geração ${sn.generation}`,
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
  if (start === 'seed') parts.push('Cada «Gerar» parte do zero. A mesma semente dá a mesma população inicial e as mesmas escolhas ao acaso, por isso definições parecidas dão resultados parecidos.');
  else if (start === 'newSeed') parts.push('Cada «Gerar» parte do zero com uma semente nova (fica registada na experiência, para a poder repetir).');
  else if (!last) parts.push('Ainda não há população anterior: a próxima geração parte do zero e as seguintes continuam dela.');
  else if (last.length !== c.bars * STEPS_PER_BAR) parts.push(`A população da experiência ${last.from} tem outro número de compassos: a próxima geração parte do zero.`);
  else parts.push(`A próxima geração continua da população final da experiência ${last.from}, reavaliada com as definições atuais.`);
  if (c.ga.operators === 'binary') parts.push('Com operadores de bits a população inicial é sempre a do programa original (genes ao acaso entre 0 e 74).');
  else if (c.ga.init === 'random') parts.push('População inicial sem padrões: cada semicolcheia é, ao acaso, pausa, prolongamento ou uma nota cromática do registo. Parte do ruído (crítico ≈ 0) e precisa de 2–3 vezes mais gerações para chegar ao mesmo nível.');
  else if (c.ga.init === 'musical') parts.push('População inicial com células rítmicas e graus da escala, sem ter em conta o cânone.');
  else if (c.ga.init === 'blocks') parts.push('População inicial escrita com os blocos das melodias reais: cada tempo segue o anterior com as probabilidades do corpus, os blocos associados aos já usados ficam mais prováveis, e a 1.ª nota segue a distribuição real (5.ª 49 %, tónica 28 %, 3.ª 13 %). Uma mutação reescreve tempos da mesma forma.');
  else parts.push(activeVoices(c).length > 1 ? 'População inicial com células rítmicas e graus da escala, já escrita em cânone com as outras vozes.' : 'População inicial com células rítmicas e graus da escala: já soa a melodia antes de evoluir.');
  $('startHint').textContent = parts.join(' ');
}

function renderExperiments() {
  const box = $('experiments');
  if (!state.experiments.length) {
    box.innerHTML = '<p class="hint">Ainda sem experiências.</p>';
    return;
  }
  const rows = state.experiments.map((e) => `<tr class="${e.n === state.selectedExperiment ? 'sel' : ''}"><td class="num">${e.n}</td><td>${e.desc} · semente ${e.seed}${e.stopped ? ' · parada' : ''}</td><td class="num">${e.fitness.toFixed(1)}</td><td class="num">${pct(e.critic)}</td><td class="num">${e.consonance === null ? '—' : pct(e.consonance)}</td><td><button class="btn" type="button" data-exp="${e.n}">Carregar</button></td></tr>`);
  box.innerHTML = `<table class="data"><thead><tr><th>#</th><th>Configuração</th><th>aptidão</th><th>crítico</th><th>consonância entre vozes</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
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
  if (e.population) state.lastPopulation = { genomes: e.population.map((g) => Array.from(g)), length: e.genes.length, from: n };
  renderSnapshots(e);
  updateStartHint();
  setPiece(pieceFromGenes(e.genes, built, state.config, {
    fitness: res.score, parts: res.parts,
    weights: built.mode === 'classic' ? state.config.classicG2 : built.fit.weights,
    title: `Experiência ${n} · semente ${e.seed}`,
  }));
  updatePreview();
  drawHistory();
  renderExperiments();
  $('runStatus').textContent = `Experiência ${n} carregada: ${e.desc}. «Gerar» repete-a com a mesma semente.`;
}

async function runBatch() {
  const base = cloneConfig(state.config);
  const results = [];
  state.batch = true;
  for (let k = 0; k < 5 && state.batch; k++) {
    const cfg = cloneConfig(base);
    cfg.ga.seed = (base.ga.seed || 1) + k;
    $('batchSummary').innerHTML = `<p class="hint">A testar a semente ${cfg.ga.seed} (${k + 1} de 5)…</p>`;
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
  $('batchSummary').innerHTML = `<div class="seg"><h4>Resumo de ${results.length} sementes · ${base.ga.seed}–${base.ga.seed + results.length - 1}</h4><dl class="kv"><dt>aptidão</dt><dd>${f.m.toFixed(1)} ± ${f.sd.toFixed(1)} (${f.lo.toFixed(1)}–${f.hi.toFixed(1)})</dd><dt>crítico</dt><dd>${pct(c.m)} ± ${Math.round(c.sd * 100)} (${pct(c.lo)}–${pct(c.hi)})</dd>${cons ? `<dt>consonância entre vozes</dt><dd>${pct(cons.m)} (${pct(cons.lo)}–${pct(cons.hi)})</dd>` : ''}<dt>melhor pelo crítico</dt><dd>experiência ${bestR.n} (semente ${bestR.seed})</dd></dl><p class="hint">Uma configuração é robusta quando o crítico fica alto em todas as sementes, não só na melhor. Compare dois resumos antes de concluir que uma mudança ajudou.</p></div>`;
  loadExperiment(bestR.n);
}

// ------------------------------------------------------------------ playback & export

function togglePlay() {
  if (player.playing) {
    player.stop();
    state.playhead = null;
    $('playBtn').textContent = '▶ Tocar';
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
  $('playBtn').textContent = '■ Parar';
  player.play(voices.map((v, i) => ({ events: v.events, instrument: v.instrument, pan: pans[i], gain: i ? 0.9 : 1 })), {
    bpm: Number($('bpm').value),
    onStep: (s) => {
      state.playhead = s;
      render();
    },
    onEnd: () => {
      state.playhead = null;
      $('playBtn').textContent = '▶ Tocar';
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
  const [num, den] = TIME_SIGNATURES[p.barLen] ?? [4, 4];
  const bytes = writeMidi(tracks, { bpm: Number($('bpm').value), numerator: num, denominator: den });
  await saveFile(`ondas-atratoras-${Date.now()}.mid`, bytes, 'audio/midi', `Guardado: ZIP com o ficheiro MIDI (${tracks.length} pista${tracks.length > 1 ? 's' : ''}).`);
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
      $('midiNote').textContent = code === 'declined' ? 'Download cancelado.'
        : code === 'rate_limited' ? 'Já há um pedido de download aberto; tente daqui a pouco.'
          : 'Este visualizador não permite downloads; use web/dist/ondas-atratoras.html do repositório.';
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
  $('mxLabel').textContent = `→ ${DESCRIPTORS[archive.x].label} (${DESCRIPTORS[archive.x].range.join('–')})`;
  $('myLabel').textContent = `↑ ${DESCRIPTORS[archive.y].label} (${DESCRIPTORS[archive.y].range.join('–')})`;
  const slice = () => {
    const end = performance.now() + 14;
    while (performance.now() < end && archive.evaluations < total && state.meRunning === token) archive.step(20);
    $('meProgress').value = archive.evaluations / total;
    $('meStatus').textContent = `${archive.evaluations.toLocaleString('pt-PT')} avaliações · ${Math.round(archive.coverage() * 100)} % do mapa preenchido · melhor ${archive.best().fitness.toFixed(1)}`;
    drawMap();
    if (archive.evaluations < total && state.meRunning === token) setTimeout(slice, 0);
    else {
      state.meRunning = null;
      $('meRun').disabled = false;
      $('meStop').disabled = true;
      $('meStatus').textContent += ' · clique numa célula para a ouvir';
    }
  };
  setTimeout(slice, 0);
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
  setPiece(pieceFromGenes(cell.genes, a.built, a.config, {
    fitness: cell.fitness,
    parts: cell.parts,
    weights: a.built.fit.weights,
    title: `Mapa · ${DESCRIPTORS[a.x].label.toLowerCase()} ${cell.vx.toFixed(2)} · ${DESCRIPTORS[a.y].label.toLowerCase()} ${cell.vy.toFixed(2)}`,
  }));
  $('cellInfo').textContent = `Célula selecionada: aptidão ${cell.fitness.toFixed(1)} · crítico ${pct(evaluationOf(state.piece).humanLike)}`;
  drawMap();
  playPiece(state.piece);
}

// ------------------------------------------------------------------ variations

function renderVariationsPlaceholder() {
  $('varList').innerHTML = '<p class="hint">Tema carregado. Carregue em «Gerar 3 variações».</p>';
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
    play.setAttribute('aria-label', `Tocar ${label}`);
    play.addEventListener('click', () => playPiece(variant()));
    const load = document.createElement('button');
    load.className = 'btn';
    load.type = 'button';
    load.textContent = 'Ver na partitura';
    load.addEventListener('click', () => {
      const v = variant();
      state.piece = { ...v, title: `${label} de «${theme.title}»`, fitness: undefined, parts: null };
      renderChips(state.piece);
      render();
      renderParts();
    });
    div.append(play, load);
    box.appendChild(div);
  };
  addItem('Tema', theme.events, 'original');
  list.forEach((v, i) => addItem(`Variação ${i + 1}`, v.events, `perturbação ${v.divergence.toFixed(3)} · igual até à nota ${v.from + 1} · ${Math.round(v.sim * 100)} % das notas iguais`));
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
  setPiece({ ...A, events: toEvents(genes), genes, length, waves: [], circular: false, config: null, ensemble: null, evaluation: null, title: 'Forma A A′ B A″ (variações de Dabby)', fitness: undefined, parts: null });
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
    return { compact: eventsToCompact(p.events), barLen: p.barLen, title: p.title, key: p.key, voices: p.voices, circular: p.circular };
  }
  if (REFERENCE_CANONS[src]) {
    const r = REFERENCE_CANONS[src];
    return { compact: referenceEvents(r), barLen: r.barLen, title: r.title, key: { tonic: r.tonic, mode: r.mode }, voices: referenceVoices(src, r), circular: !!r.circular, end: r.endStep };
  }
  if (src === 'corpus') {
    const m = corpus[Number($('anCorpus').value)];
    return { compact: m.events, barLen: m.barLen, title: `${sourceName(m.source)} — ${m.title}`, key: { tonic: m.tonic, mode: m.mode }, voices: solo(state.config.voices[0].instrument) };
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
    if (!res.compact.length) throw new Error('sem notas');
    state.midiUpload = { compact: res.compact, barLen: res.barLen, title: f.name, key: null };
    $('anSource').value = 'midi';
    $('anCorpusRow').hidden = true;
    $('anStatus').textContent = `${f.name}: ${res.tracks.length} pista(s), compasso ${res.numerator}/${res.denominator}. Polifonia reduzida à nota mais aguda.`;
  } catch (e) {
    $('anStatus').textContent = `Não foi possível ler o MIDI (${e.message}). Use um ficheiro .mid padrão.`;
  }
}

function runAnalysis() {
  const src = analysisSource();
  if (!src) {
    $('anStatus').textContent = 'Carregue primeiro um ficheiro MIDI.';
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
  const events = compactToEvents(src.compact);
  state.analysisPiece = {
    events, length: res.total, barLen: src.barLen, title: `Análise · ${src.title}`, key: src.key, waves: [],
    voices: src.voices, circular: !!src.circular, end: src.end, tonic: src.key?.tonic,
  };
  $('anStatus').textContent = `Análise em ${Math.round(performance.now() - t0)} ms.`;
  $('anUse').disabled = !res.segments[0]?.fit;
  renderAnalysis(res, src);
  render();
}

const fmtF = (f) => (f === 0 ? 'constante' : f < 1 ? `${f.toFixed(3)} (1 ciclo em ${(1 / f).toFixed(1)} c.)` : `${f.toFixed(2)} ciclos/compasso`);
// a mean value is rarely a note: name it, or say between which notes it lies
const noteHz = (m) => {
  const r = Math.round(m);
  const name = Math.abs(m - r) <= 0.25 ? midiName(r) : `entre ${midiName(Math.floor(m))} e ${midiName(Math.ceil(m))}`;
  return `${name} · ${m.toFixed(1)} · ${hz(m).toFixed(0)} Hz`;
};

function waveRows(w) {
  return `<dt>frequência</dt><dd>${fmtF(w.freq)}</dd><dt>valor médio</dt><dd>${noteHz(w.mean)}</dd><dt>amplitude</dt><dd>±${w.amplitude.toFixed(1)} semitons</dd><dt>bacia (σ)</dt><dd>${w.basin.toFixed(1)} semitons</dd><dt>notas atraídas</dt><dd>${Math.round(w.share * 100)} %</dd>`;
}

function renderAnalysis(res, src) {
  const box = $('anSegments');
  box.innerHTML = '';
  res.segments.forEach((s, i) => {
    const bars = `c. ${(s.start / res.barLen + 1).toFixed(s.start % res.barLen ? 1 : 0)}–${(s.end / res.barLen).toFixed(s.end % res.barLen ? 1 : 0)}`;
    const lowW = s.lowestWave;
    const div = document.createElement('div');
    div.className = 'seg';
    let html = `<h4>Parte ${i + 1} · ${bars}</h4>`;
    html += `<dl class="kv"><dt>notas</dt><dd>${s.notes}</dd><dt>ondas (BIC)</dt><dd>${s.fit ? s.fit.M : '—'} · R² ${s.fit ? s.fit.r2.toFixed(2) : '—'}</dd><dt>nota mais grave</dt><dd>${noteHz(s.register.lowest)}</dd><dt>média das graves (¼)</dt><dd>${noteHz(s.register.lowMean)}</dd><dt>nota mais aguda</dt><dd>${noteHz(s.register.highest)}</dd><dt>média das agudas (¼)</dt><dd>${noteHz(s.register.highMean)}</dd></dl>`;
    if (lowW) html += `<div><span class="wave-tag" style="background:var(--wave-1)"></span><strong>Onda de frequência mais baixa</strong></div><dl class="kv">${waveRows(lowW)}</dl>`;
    s.highestWaves.forEach((w, k) => {
      html += `<div><span class="wave-tag" style="background:var(--wave-${k + 2})"></span><strong>${k === 0 ? 'Onda de frequência mais alta' : 'Onda seguinte'}</strong></div><dl class="kv">${waveRows(w)}</dl>`;
    });
    html += `<canvas class="chart spec" data-seg="${i}" aria-label="Espectro do contorno da parte ${i + 1}"></canvas>`;
    const sig = s.significant.length
      ? `Oscilações significativas (p < 0,05, permutação): ${s.significant.slice(0, 5).map((p) => p.freq.toFixed(3)).join(', ')} ciclos/compasso.`
      : 'Nenhuma oscilação do contorno acima do limiar de permutação (p < 0,05).';
    html += `<p class="hint">${sig}</p>`;
    div.innerHTML = html;
    box.appendChild(div);
  });
  drawSpectra();
  // summary across segments
  const lows = res.segments.map((s) => s.lowestWave).filter(Boolean);
  const highs = res.segments.flatMap((s) => s.highestWaves.slice(0, 1));
  const avg = (arr, f) => arr.reduce((a, x) => a + f(x), 0) / Math.max(1, arr.length);
  let html = `<dl class="kv"><dt>peça</dt><dd>${src.title}</dd><dt>partes</dt><dd>${res.segments.length}</dd>`;
  if (lows.length) html += `<dt>freq. mais baixa (média)</dt><dd>${fmtF(avg(lows, (w) => w.freq))}</dd><dt>valor médio dessa onda</dt><dd>${noteHz(avg(lows, (w) => w.mean))}</dd>`;
  if (highs.length) html += `<dt>freq. mais alta (média)</dt><dd>${fmtF(avg(highs, (w) => w.freq))}</dd><dt>valor médio dessa onda</dt><dd>${noteHz(avg(highs, (w) => w.mean))}</dd>`;
  html += `<dt>R² médio</dt><dd>${avg(res.segments.filter((s) => s.fit), (s) => s.fit.r2).toFixed(2)}</dd></dl>`;
  html += '<p class="hint">R² mede quanto da altura das notas as ondas explicam. Com poucas notas por parte o R² sobe sempre; compare com uma melodia baralhada (README) antes de concluir.</p>';
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
  $('anStatus').textContent = `${c.waves.length} onda(s) copiadas para Compor → Ondas atratoras${shift ? `, transpostas ${shift > 0 ? '+' : ''}${shift} semitons para a tonalidade escolhida` : ''}. Pode editá-las lá.`;
}

// ------------------------------------------------------------------ corpus building blocks (analyser)

function renderBlocksBox() {
  const data = getBlockModel().data;
  const pct = (x) => `${(x * 100).toFixed(1)} %`;
  const total = data.blocks.reduce((a, [, c]) => a + c, 0);
  const top = data.blocks.slice(0, 12).map(([id, c]) => `<tr><td>${describeBlock(id)}</td><td class="num">${pct(c / total)}</td></tr>`).join('');
  const degTot = Object.values(data.firstDeg).reduce((a, b) => a + b, 0);
  const DEG = ['1 (tónica)', '2', '3 (mediante)', '4', '5 (dominante)', '6', '7'];
  const degs = Object.entries(data.firstDeg).sort((a, b) => b[1] - a[1]).map(([d, c]) => `<tr><td>${DEG[d]}</td><td class="num">${pct(c / degTot)}</td></tr>`).join('');
  const rules = [];
  for (const [a, list] of Object.entries(data.assoc)) for (const [b, lift, nab, conf] of list) if (!a.startsWith('?') && !b.startsWith('?')) rules.push([a, b, lift, nab, conf]);
  // strong and frequent: lift weighted by how many melodies have both; one line per pair
  const seen = new Set();
  const pos = rules.filter((r) => r[2] >= 1 && r[3] >= 25).sort((x, y) => y[2] * Math.log(y[3]) - x[2] * Math.log(x[3])).filter((r) => {
    const k = [r[0], r[1]].sort().join('|');
    return !seen.has(k) && seen.add(k);
  }).slice(0, 10);
  const neg = rules.filter((r) => r[2] < 1).sort((x, y) => x[2] - y[2]).slice(0, 6);
  const row = ([a, b, l, , conf]) => `<tr><td>${describeBlock(a)}</td><td>${describeBlock(b)}</td><td class="num">${l >= 1 ? `${Math.round(conf * 100)} % · ` : ''}${l.toFixed(2)}</td></tr>`;
  $('blocksTables').innerHTML = `<div><h4>Blocos mais frequentes</h4><table class="data"><thead><tr><th>bloco (um tempo)</th><th>dos tempos</th></tr></thead><tbody>${top}</tbody></table>
    <h4>1.ª nota das melodias reais</h4><table class="data"><thead><tr><th>grau</th><th>melodias</th></tr></thead><tbody>${degs}</tbody></table></div>
    <div><h4>Se aparece A, B aparece com probabilidade p (lift &gt; 1)</h4><table class="data"><thead><tr><th>A</th><th>B</th><th>p · lift</th></tr></thead><tbody>${pos.map(row).join('')}</tbody></table>
    <h4>Raramente juntos (lift &lt; 1)</h4><table class="data"><thead><tr><th>A</th><th>B</th><th>lift</th></tr></thead><tbody>${neg.map(row).join('')}</tbody></table>
    <p class="hint">Lift = quantas vezes mais (ou menos) B aparece numa melodia que tem A do que numa melodia qualquer. Ritmo: ♩ semínima, ♪ colcheia, ♪. colcheia com ponto, sc semicolcheia. Contornos em graus da escala: «sobe 1» é um grau acima.</p></div>`;
}

// ------------------------------------------------------------------ evaluation tab

let referenceRows = null;
function referenceCanonRows() {
  if (referenceRows) return referenceRows;
  referenceRows = ['telemann', 'telemann2', 'telemann3'].map((k) => {
    const r = REFERENCE_CANONS[k];
    const c = analyzeCanon(compactToLine(referenceEvents(r)), { delay: r.delayBars * r.barLen, barLen: r.barLen, end: r.endStep });
    const roman = { telemann: 'I', telemann2: 'II', telemann3: 'III' }[k];
    return canonRow(`<span title="${r.title}">Telemann ${roman} · ${r.delayBars} c.</span>`, c);
  });
  return referenceRows;
}

const canonHead = (first) => `<tr><th>${first}</th><th title="Consonâncias nos tempos fortes">consonância</th><th title="Quintas e oitavas paralelas">paralelas</th><th>uníssonos</th><th title="Movimento contrário">contrário</th><th>pontuação</th></tr>`;
const canonRow = (label, c) => `<tr><td>${label}</td><td class="num">${pct(c.strongConsonance)}</td><td class="num">${c.parallels}</td><td class="num">${pct(c.unisonRatio)}</td><td class="num">${pct(c.contraryRatio)}</td><td class="num">${c.score.toFixed(2)}</td></tr>`;

function renderEvaluation(p) {
  const ev = evaluationOf(p);
  $('evalSummary').innerHTML = `<dl class="kv"><dt>crítico (melodia real?)</dt><dd>${pct(ev.humanLike)}</dd><dt>características típicas</dt><dd>${Math.round(ev.typicality * criticData.features.length)} de ${criticData.features.length}</dd><dt>surpresa melódica</dt><dd>${ev.features.icPitch.toFixed(2)} bits/nota (real: ${criticData.percentiles[criticData.features.indexOf('icPitch')].map((v) => v.toFixed(2)).join(' / ')})</dd><dt>complexidade LZ</dt><dd>${ev.features.lzComplexity.toFixed(2)}</dd><dt>validação do crítico</dt><dd>AUC ${criticData.cv.auc.toFixed(3)} (5-fold)</dd></dl><p class="hint">Avaliado nos primeiros 8 compassos de 4/4 (128 semicolcheias), como as melodias de referência. Todas as vozes tocam a mesma melodia, por isso o crítico avalia-a uma vez.</p>`;
  const line = lineOf(p);
  let html = '';
  const ens = ensembleOf(p);
  if (ens) {
    const vrows = p.voices.map((v, i) => {
      const ps = [];
      for (let s = 0; s < line.pitch.length; s++) if (line.onset[s]) ps.push(v.map(line.pitch[s]));
      const out = ps.filter((q) => q < v.range[0] || q > v.range[1]).length / Math.max(1, ps.length);
      return `<tr><td>${i + 1}</td><td>${instrument(v.instrument).label}</td><td>c. ${1 + v.delay / p.barLen}</td><td>${i ? INTERVALS[v.interval]?.label ?? '—' : 'melodia'}</td><td>${midiName(Math.min(...ps))}–${midiName(Math.max(...ps))}</td><td class="num ${out ? 'off' : 'ok'}">${pct(out)}</td></tr>`;
    });
    html += `<h4>Vozes</h4><table class="data"><thead><tr><th>#</th><th>instrumento</th><th>entrada</th><th>intervalo</th><th>registo</th><th>fora do alcance</th></tr></thead><tbody>${vrows.join('')}</tbody></table>`;
    const prows = ens.pairs.map((pr) => canonRow(`${pr.i + 1} e ${pr.j + 1}`, pr));
    html += `<h4>Pares de vozes</h4><table class="data"><thead>${canonHead('vozes')}</thead><tbody>${prows.join('')}</tbody><tfoot><tr><td>todas</td><td class="num">${pct(ens.strongConsonance)}</td><td class="num">${ens.parallels}</td><td class="num">${pct(ens.unisonRatio)}</td><td class="num">${pct(ens.contraryRatio)}</td><td class="num">${ens.score.toFixed(2)}</td></tr></tfoot></table>${p.voices.length >= 3 ? `<p class="hint">Tempos fortes em que as três vozes formam um acorde perfeito: ${pct(ens.triadRatio)}.</p>` : ''}`;
  }
  const rows = [1, 2, 3].map((d) => canonRow(`a ${d} c.`, analyzeCanon(line, { delay: d * p.barLen, barLen: p.barLen })));
  html += `<h4>A melodia contra si própria, em uníssono</h4><table class="data"><thead>${canonHead('2.ª voz')}</thead><tbody>${rows.join('')}</tbody><tfoot>${referenceCanonRows().join('')}</tfoot></table>`;
  $('canonTable').innerHTML = html;
  const frows = criticData.features.map((f) => {
    const pf = ev.perFeature[f];
    return `<tr><td>${FEATURE_LABELS[f] || f}</td><td class="num ${pf.ok ? 'ok' : 'off'}">${fmtNum(pf.value)}</td><td class="num">${fmtNum(pf.p10)} – ${fmtNum(pf.p90)}</td></tr>`;
  });
  $('featureTable').innerHTML = `<table class="data"><thead><tr><th>Característica</th><th>Peça</th><th>Reais P10–P90</th></tr></thead><tbody>${frows.join('')}</tbody></table>`;
}

const fmtNum = (v) => (Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2));

// ------------------------------------------------------------------ start

function start() {
  initControls();
  try {
    if (localStorage.getItem('ondas-view') === 'score') state.view = 'score';
  } catch (e) {
    /* storage unavailable */
  }
  const ex = EXAMPLES[0];
  const cfg = cloneConfig(state.config);
  cfg.ga.seed = ex.seed;
  const built = buildFitness(cfg);
  const res = built.fit.evaluate(ex.genes);
  setPiece(pieceFromGenes(ex.genes, built, cfg, { fitness: res.score, parts: res.parts, weights: built.fit.weights, title: ex.title }));
  state.history = ex.history || [];
  updatePreview();
  updateStartHint();
  drawHistory();
  $('runStatus').textContent = `Pronto. ${describe(state.config)}.`;
  if (state.view === 'score') setView('score');
}

start();
