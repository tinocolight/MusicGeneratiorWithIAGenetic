// Page controller: wires the engine (GA, fitness, MAP-Elites, variations, analyser, critic)
// to the interface. Everything runs in the page, in time slices, so the UI stays responsive.

import { toEvents, eventsToCompact, compactToEvents, fromEvents, STEPS_PER_BAR, midiName } from '../core/score.js';
import { SCALE_LABELS, keyFromScale } from '../core/theory.js';
import { soundingLine } from '../core/analysis.js';
import { createRng } from '../core/rng.js';
import { createClassicFitness, CLASSIC_DEFAULTS } from '../fitness/classic.js';
import { createAttractorFitness, DEFAULT_WEIGHTS, FORMS } from '../fitness/attractor.js';
import { WAVE_PRESETS, resolvePreset, tonicMidi } from '../fitness/presets.js';
import { analyzeCanon } from '../fitness/canon.js';
import { createGA } from '../ga/ga.js';
import { createMapElites, DESCRIPTORS } from '../ga/mapelites.js';
import { chaoticVariation, divergencePoint, similarityToTheme } from '../variation/dabby.js';
import { analyzePiece, waveToSpec, hz } from '../analysis/wavefit.js';
import { loadCritic } from '../eval/critic.js';
import { FEATURE_LABELS } from '../eval/metrics.js';
import { writeMidi, readMidi } from '../io/midi.js';
import { makeZip } from '../io/zip.js';
import { REFERENCE_CANONS, referenceEvents } from '../data/references.js';
import criticData from '../data/critic-data.js';
import corpus from '../data/corpus-data.js';
import { EXAMPLES } from '../data/examples.js';
import { drawRoll } from './pianoroll.js';
import { lineChart, spectrumChart, eliteMap } from './charts.js';
import { createPlayer, TIMBRES } from './audio.js';
import { ABOUT_HTML } from './about.js';

const $ = (id) => document.getElementById(id);
const critic = loadCritic(criticData);
const player = createPlayer();

const FIELD_LABELS = {
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
  canon: 'Contraponto em cânone',
};
const CLASSIC_LABELS = {
  rhythmicPatterns: 'Padrões rítmicos',
  selfHarm1: 'Auto-harmonização 1 c.',
  selfHarm2: 'Auto-harmonização 2 c.',
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

const state = {
  piece: null,
  history: [],
  running: null,
  weights: { ...DEFAULT_WEIGHTS },
  canonWeights: { ...DEFAULT_WEIGHTS, canon: 6, form: 0 },
  classicG1: { ...CLASSIC_DEFAULTS.g1 },
  classicG2: { ...CLASSIC_DEFAULTS.g2 },
  customWaves: null,
  archive: null,
  meRunning: null,
  selectedCell: -1,
  variations: [],
  analysis: null,
  analysisPiece: null,
  playhead: null,
  midiUpload: null,
  tab: 'compose',
};

// ------------------------------------------------------------------ setup of controls

function option(sel, value, label, selected = false) {
  const o = document.createElement('option');
  o.value = value;
  o.textContent = label;
  if (selected) o.selected = true;
  sel.appendChild(o);
}

function initControls() {
  SCALE_LABELS.forEach((l, i) => option($('scale'), i, l, i === 1));
  for (const [k, p] of Object.entries(WAVE_PRESETS)) option($('preset'), k, p.label, k === 'arch');
  for (const k of Object.keys(FORMS)) option($('form'), k, k === 'none' ? 'Livre' : k.replace(/'/g, '′'), k === "AA'BA'");
  for (const [k, v] of Object.entries(TIMBRES)) option($('timbre'), k, v, k === 'violin');
  for (const [k, d] of Object.entries(DESCRIPTORS)) {
    option($('mx'), k, d.label, k === 'density');
    option($('my'), k, d.label, k === 'leaps');
  }
  option($('anSource'), 'current', 'Peça atual');
  option($('anSource'), 'telemann', 'Telemann — TWV 40:118, Vivace', true);
  option($('anSource'), 'frereJacques', 'Frère Jacques (ronda)');
  option($('anSource'), 'rowYourBoat', 'Row, Row, Row Your Boat (ronda)');
  option($('anSource'), 'corpus', 'Melodia do corpus');
  option($('anSource'), 'midi', 'Ficheiro MIDI carregado');
  corpus.forEach((m, i) => option($('anCorpus'), i, `${sourceName(m.source)} — ${m.title}`));
  $('bpm').addEventListener('input', () => ($('bpmVal').textContent = $('bpm').value));
  $('mode').addEventListener('change', onModeChange);
  $('divergence').addEventListener('input', showDivergence);
  $('anK').addEventListener('input', () => ($('anKVal').textContent = `${$('anK').value} parte${$('anK').value === '1' ? '' : 's'}`));
  $('anSource').addEventListener('change', () => ($('anCorpusRow').hidden = $('anSource').value !== 'corpus'));
  $('anCorpusRow').hidden = true;
  showDivergence();
  onModeChange();

  document.querySelectorAll('nav.tabs button').forEach((b) => b.addEventListener('click', () => selectTab(b.dataset.panel)));
  $('runBtn').addEventListener('click', () => runGA());
  $('reseedBtn').addEventListener('click', () => {
    $('seed').value = String(1 + Math.floor(Math.random() * 99999));
    runGA();
  });
  $('stopBtn').addEventListener('click', () => (state.running = null));
  $('playBtn').addEventListener('click', togglePlay);
  $('midiBtn').addEventListener('click', downloadMidi);
  $('canonPlay').addEventListener('change', render);
  $('canonPlayDelay').addEventListener('change', render);
  $('meRun').addEventListener('click', runMapElites);
  $('meStop').addEventListener('click', () => (state.meRunning = null));
  $('eliteMap').addEventListener('click', onMapClick);
  $('varRun').addEventListener('click', makeVariations);
  $('formRun').addEventListener('click', buildForm);
  $('anRun').addEventListener('click', runAnalysis);
  $('anUse').addEventListener('click', useAnalysisWaves);
  $('anFile').addEventListener('change', onMidiFile);
  window.addEventListener('resize', () => {
    render();
    drawHistory();
    if (state.archive) drawMap();
    if (state.analysis) drawSpectra();
  });
  if (window.self !== window.top) $('midiNote').textContent = '';
  $('aboutBox').innerHTML = ABOUT_HTML;
}

const sourceName = (s) => ({ essen: 'Essen', oneills: "O'Neill", 'bach-chorale': 'Bach' }[s] || s);

function selectTab(name) {
  state.tab = name;
  document.querySelectorAll('nav.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.panel === name)));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === `panel-${name}`));
  render();
  if (name === 'explore' && state.archive) drawMap();
  if (name === 'compose') drawHistory();
  if (name === 'analyze' && state.analysis) drawSpectra();
}

function onModeChange() {
  const mode = $('mode').value;
  $('fieldControls').hidden = mode === 'classic';
  $('canonControls').hidden = mode !== 'canon';
  if (mode === 'classic') {
    $('generations').value = 1500;
    $('popSize').value = 60;
    $('mutation').value = 0.1;
    $('operators').value = 'binary';
  } else {
    $('generations').value = 600;
    $('popSize').value = 80;
    $('mutation').value = 0.9;
    $('operators').value = 'musical';
    if (mode === 'canon') {
      $('preset').value = 'canon';
      $('form').value = 'none';
      $('canonPlay').checked = true;
    } else if ($('preset').value === 'canon') $('preset').value = 'arch';
  }
  buildWeightsUI();
}

function buildWeightsUI() {
  const mode = $('mode').value;
  const box = $('weights');
  box.innerHTML = '';
  const add = (label, obj, key) => {
    const l = document.createElement('label');
    l.textContent = label;
    l.htmlFor = `w-${key}-${obj === state.classicG1 ? 'g1' : 'x'}`;
    const inp = document.createElement('input');
    inp.type = 'number';
    inp.step = '0.5';
    inp.id = l.htmlFor;
    inp.value = obj[key];
    inp.addEventListener('change', () => (obj[key] = Number(inp.value)));
    box.append(l, inp);
  };
  if (mode === 'classic') {
    box.insertAdjacentHTML('beforeend', '<span class="hint">Grupo 1 (primeiros 25 % das gerações)</span><span></span>');
    for (const k of Object.keys(CLASSIC_LABELS)) add(CLASSIC_LABELS[k], state.classicG1, k);
    box.insertAdjacentHTML('beforeend', '<span class="hint">Grupo 2 (resto)</span><span></span>');
    for (const k of Object.keys(CLASSIC_LABELS)) {
      const l = document.createElement('label');
      l.textContent = CLASSIC_LABELS[k];
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.step = '0.5';
      inp.id = `w-${k}-g2`;
      l.htmlFor = inp.id;
      inp.value = state.classicG2[k];
      inp.addEventListener('change', () => (state.classicG2[k] = Number(inp.value)));
      box.append(l, inp);
    }
  } else {
    const w = mode === 'canon' ? state.canonWeights : state.weights;
    for (const k of Object.keys(FIELD_LABELS)) add(FIELD_LABELS[k], w, k);
  }
}

function showDivergence() {
  const v = 10 ** Number($('divergence').value);
  $('divVal').textContent = `perturbação inicial ${v.toFixed(3)} (x₀ = ${(1 - v).toFixed(3)})`;
}

// ------------------------------------------------------------------ fitness from the controls

function currentKey() {
  return keyFromScale(Number($('scale').value), $('major').value === '1');
}

function buildFitness(seed) {
  const mode = $('mode').value;
  const bars = Number($('bars').value);
  const key = currentKey();
  if (mode === 'classic') {
    const fit = createClassicFitness({ scale: Number($('scale').value), major: $('major').value === '1', bars, g1: state.classicG1, g2: state.classicG2 });
    return {
      mode, fit, key,
      waves: fit.waves.map((values, i) => ({ values, basin: CLASSIC_DEFAULTS.waves[i].threshold, shape: 'step' })),
    };
  }
  const presetName = $('preset').value;
  let waves;
  if (presetName === 'analyzer' && state.customWaves) waves = state.customWaves.map((w) => ({ ...w }));
  else waves = resolvePreset(presetName, key.tonic);
  const amp = Number($('ampScale').value);
  const basin = Number($('basin').value);
  const canonDelay = Number($('canonDelay').value);
  waves = waves.map((w) => ({
    ...w,
    amplitude: w.amplitude * amp,
    basin: presetName === 'analyzer' ? w.basin : basin * (w.basin / 3),
    ...(mode === 'canon' && presetName === 'canon' ? { periodsPerBar: 1 / (2 * canonDelay) } : {}),
  }));
  const fit = createAttractorFitness({
    bars,
    tonic: key.tonic,
    mode: key.mode,
    waves,
    basinShape: $('basinShape').value,
    form: $('form').value,
    phraseBars: Number($('phraseBars').value),
    weights: mode === 'canon' ? state.canonWeights : state.weights,
    canon: { delayBars: canonDelay, transpose: Number($('canonTranspose').value), circular: $('canonCircular').value === '1' },
    seed,
  });
  return {
    mode, fit, key,
    waves: fit.waves.map((values, i) => ({ values, basin: fit.basins[i], shape: $('basinShape').value })),
  };
}

// ------------------------------------------------------------------ GA run

function runGA() {
  player.stop();
  const seed = Number($('seed').value) || 1;
  const built = buildFitness(seed);
  const operators = $('operators').value;
  const ga = createGA({
    fitness: built.fit,
    rng: createRng(seed),
    length: built.fit.length,
    env: built.fit.env || envForClassic(built),
    generations: Number($('generations').value),
    popSize: Number($('popSize').value),
    mutationRate: Number($('mutation').value),
    strategy: built.mode === 'classic' && operators === 'binary' ? 'geneticsharp' : 'tournament',
    operators: built.mode === 'classic' ? operators : 'musical',
  });
  const token = {};
  state.running = token;
  state.history = [];
  $('runBtn').disabled = true;
  $('stopBtn').disabled = false;
  const t0 = performance.now();
  let lastDraw = 0;
  const slice = () => {
    if (state.running !== token) return finish(ga, built, true);
    const end = performance.now() + 14;
    while (performance.now() < end && !ga.done) ga.step(1);
    $('progress').value = ga.generation / Number($('generations').value);
    $('runStatus').textContent = `Geração ${ga.generation} · avaliações ${ga.evaluations.toLocaleString('pt-PT')} · aptidão ${ga.best.fitness.toFixed(2)} · ${((performance.now() - t0) / 1000).toFixed(1)} s`;
    if (performance.now() - lastDraw > 250) {
      lastDraw = performance.now();
      state.history = ga.history.slice();
      showBest(ga, built, false);
      drawHistory();
    }
    if (ga.done) return finish(ga, built, false);
    setTimeout(slice, 0);
  };
  setTimeout(slice, 0);
}

function envForClassic(built) {
  return { key: built.key, waves: built.waves.map((w) => w.values), basin: 3, lowMidi: 48, highMidi: 96, length: built.fit.length, stepsPerBar: STEPS_PER_BAR };
}

function showBest(ga, built, final) {
  const best = ga.best;
  const modeLabel = { field: 'Campo de atratores', canon: 'Cânone', classic: 'Clássico' }[built.mode];
  setPiece({
    events: toEvents(best.decoded),
    genes: best.decoded,
    length: best.decoded.length,
    barLen: STEPS_PER_BAR,
    waves: built.waves,
    key: built.key,
    fitness: best.fitness,
    parts: best.parts,
    mode: built.mode,
    weights: built.mode === 'classic' ? (built.fit.phaseOf({ generation: ga.generation, maxGenerations: Number($('generations').value) }) === 1 ? state.classicG1 : state.classicG2) : built.fit.weights,
    title: `${modeLabel} · semente ${$('seed').value}${final ? '' : ' (a evoluir…)'}`,
  }, final);
}

function finish(ga, built, stopped) {
  state.running = null;
  $('runBtn').disabled = false;
  $('stopBtn').disabled = true;
  state.history = ga.history.slice();
  showBest(ga, built, true);
  drawHistory();
  $('runStatus').textContent += stopped ? ' · parado' : ' · concluído';
}

// ------------------------------------------------------------------ piece & stage

function setPiece(piece, evaluate = true) {
  state.piece = piece;
  state.variations = state.variations.filter(() => false);
  if (evaluate) evaluatePiece();
  render();
  renderParts();
  if (evaluate) renderVariationsPlaceholder();
}

function stageScene() {
  const analyzing = state.tab === 'analyze' && state.analysisPiece;
  const p = analyzing ? state.analysisPiece : state.piece;
  if (!p) return null;
  const voices = [{ events: p.events, kind: 'lead' }];
  const delayBars = Number($('canonPlayDelay').value);
  if ($('canonPlay').checked) voices.push({ events: p.events, offset: delayBars * p.barLen, kind: 'follower' });
  let waves = p.waves || [];
  let segments = [];
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
  }
  return { length: p.length, barLen: p.barLen, voices, waves, segments, key: p.key, playhead: state.playhead, title: p.title };
}

function render() {
  const scene = stageScene();
  if (!scene) return;
  drawRoll($('roll'), scene);
  const p = state.tab === 'analyze' && state.analysisPiece ? state.analysisPiece : state.piece;
  $('pieceTitle').textContent = p.title;
  if (state.chipsFor !== p || state.chipsDelay !== $('canonPlayDelay').value) {
    state.chipsFor = p;
    state.chipsDelay = $('canonPlayDelay').value;
    renderChips(p);
  }
  const legend = [];
  legend.push('<span><i style="background:var(--note)"></i>melodia</span>');
  if ($('canonPlay').checked) legend.push(`<span><i style="background:var(--follower)"></i>2.º violino (entra ${$('canonPlayDelay').value} c. depois)</span>`);
  (scene.waves.length && !(state.tab === 'analyze' && state.analysis) ? scene.waves : []).forEach((w, i) => legend.push(`<span><i style="background:var(--wave-${(i % 4) + 1})"></i>onda ${i + 1} · bacia σ ${Number(w.basin).toFixed(1)}</span>`));
  if (state.tab === 'analyze' && state.analysis) legend.push('<span><i style="background:var(--wave-1)"></i>onda de frequência mais baixa</span><span><i style="background:var(--wave-2)"></i>ondas mais rápidas</span><span>faixas: partes</span>');
  $('legend').innerHTML = legend.join('');
}

function evaluatePiece() {
  renderChips(state.piece);
  renderEvaluation(state.piece.evaluation, state.piece);
}

function renderChips(p) {
  const chips = [];
  if (p.fitness !== undefined) chips.push(`<span class="chip">aptidão <b>${p.fitness.toFixed(1)}</b></span>`);
  const compact = eventsToCompact(p.events);
  const first = sliceSteps(compact, 128);
  const ev = critic.evaluate(first, { barLen: p.barLen });
  p.evaluation = ev;
  const cls = ev.humanLike >= 0.7 ? 'good' : ev.humanLike >= 0.4 ? 'warn' : 'bad';
  chips.push(`<span class="chip ${cls}" title="Probabilidade de ser uma melodia real segundo o crítico">crítico <b>${Math.round(ev.humanLike * 100)}%</b></span>`);
  chips.push(`<span class="chip" title="Características dentro do intervalo P10–P90 das melodias reais">típico <b>${Math.round(ev.typicality * criticData.features.length)}/${criticData.features.length}</b></span>`);
  chips.push(`<span class="chip">pausas <b>${Math.round(ev.features.restRatio * 100)}%</b></span>`);
  const line = lineOf(p);
  const c = analyzeCanon(line, { delay: Number($('canonPlayDelay').value) * p.barLen, barLen: p.barLen });
  chips.push(`<span class="chip" title="Consonância nos tempos fortes quando tocada em cânone">cânone <b>${Math.round(c.strongConsonance * 100)}%</b></span>`);
  $('pieceChips').innerHTML = chips.join('');
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

function renderParts() {
  const p = state.piece;
  const box = $('partsBars');
  box.innerHTML = '';
  if (!p || !p.parts) return;
  const labels = p.mode === 'classic' ? CLASSIC_LABELS : FIELD_LABELS;
  const entries = Object.keys(labels).map((k) => [k, (p.weights?.[k] ?? 0) * (p.parts[k] ?? 0)]);
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

// ------------------------------------------------------------------ playback & export

function togglePlay() {
  if (player.playing) {
    player.stop();
    state.playhead = null;
    $('playBtn').textContent = '▶ Tocar';
    render();
    return;
  }
  const analyzing = state.tab === 'analyze' && state.analysisPiece;
  const p = analyzing ? state.analysisPiece : state.piece;
  playEvents(p.events, p.barLen);
}

function playEvents(events, barLen) {
  const voices = [{ events, timbre: $('timbre').value, pan: $('canonPlay').checked ? -0.35 : 0 }];
  if ($('canonPlay').checked) voices.push({ events, offset: Number($('canonPlayDelay').value) * barLen, timbre: $('timbre').value, pan: 0.35, gain: 0.9 });
  $('playBtn').textContent = '■ Parar';
  player.play(voices, {
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

async function downloadMidi() {
  const analyzing = state.tab === 'analyze' && state.analysisPiece;
  const p = analyzing ? state.analysisPiece : state.piece;
  const voices = [{ events: p.events, name: 'Violino 1', program: 40 }];
  if ($('canonPlay').checked) voices.push({ events: p.events, offset: Number($('canonPlayDelay').value) * p.barLen, name: 'Violino 2', program: 40 });
  const num = p.barLen === 24 ? 6 : p.barLen === 12 ? 6 : 4;
  const den = p.barLen === 12 ? 8 : 4;
  const bytes = writeMidi(voices, { bpm: Number($('bpm').value), numerator: num, denominator: den });
  const name = `ondas-atratoras-${Date.now()}`;
  const dl = await downloadsCap;
  if (dl) {
    try {
      await dl.save({ filename: `${name}.zip`, data: makeZip([{ name: `${name}.mid`, data: bytes }]) });
      $('midiNote').textContent = 'Guardado: ZIP com o ficheiro MIDI.';
    } catch (e) {
      const code = e && e.code;
      $('midiNote').textContent = code === 'declined' ? 'Download cancelado.'
        : code === 'rate_limited' ? 'Já há um pedido de download aberto; tente daqui a pouco.'
          : 'Este visualizador não permite downloads; use web/dist/ondas-atratoras.html do repositório.';
    }
    return;
  }
  const blob = new Blob([bytes], { type: 'audio/midi' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.mid`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ------------------------------------------------------------------ MAP-Elites

function runMapElites() {
  if ($('mode').value === 'classic') $('mode').value = 'field';
  onModeChangeKeep();
  const seed = Number($('seed').value) || 1;
  const built = buildFitness(seed);
  const archive = createMapElites({ fitness: built.fit, env: built.fit.env, rng: createRng(seed + 17), x: $('mx').value, y: $('my').value });
  archive.built = built;
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

function onModeChangeKeep() {
  $('fieldControls').hidden = $('mode').value === 'classic';
  $('canonControls').hidden = $('mode').value !== 'canon';
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
  const built = a.built;
  setPiece({
    events: toEvents(cell.genes),
    genes: cell.genes,
    length: cell.genes.length,
    barLen: STEPS_PER_BAR,
    waves: built.waves,
    key: built.key,
    fitness: cell.fitness,
    parts: cell.parts,
    mode: built.mode,
    weights: built.fit.weights,
    title: `Mapa · ${DESCRIPTORS[a.x].label.toLowerCase()} ${cell.vx.toFixed(2)} · ${DESCRIPTORS[a.y].label.toLowerCase()} ${cell.vy.toFixed(2)}`,
  });
  $('cellInfo').textContent = `Célula selecionada: aptidão ${cell.fitness.toFixed(1)} · crítico ${Math.round(state.piece.evaluation.humanLike * 100)} %`;
  drawMap();
  playEvents(state.piece.events, STEPS_PER_BAR);
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
  const addItem = (label, events, info, idx) => {
    const div = document.createElement('div');
    div.className = 'varitem';
    div.innerHTML = `<strong>${label}</strong><span class="status">${info}</span>`;
    const play = document.createElement('button');
    play.className = 'btn';
    play.type = 'button';
    play.textContent = '▶';
    play.setAttribute('aria-label', `Tocar ${label}`);
    play.addEventListener('click', () => playEvents(events, theme.barLen));
    const load = document.createElement('button');
    load.className = 'btn';
    load.type = 'button';
    load.textContent = 'Ver na partitura';
    load.addEventListener('click', () => {
      const genes = fromEvents(events, theme.length);
      setPiece({ ...theme, events: toEvents(genes), genes, title: `${label} de «${theme.title}»`, fitness: undefined, parts: null });
      if (idx >= 0) makeVariationsKeep(list);
    });
    div.append(play, load);
    box.appendChild(div);
  };
  addItem('Tema', theme.events, 'original', -1);
  list.forEach((v, i) => addItem(`Variação ${i + 1}`, v.events, `perturbação ${v.divergence.toFixed(3)} · igual até à nota ${v.from + 1} · ${Math.round(v.sim * 100)} % das notas iguais`, i));
}

function makeVariationsKeep() {
  /* the list stays visible after loading one variation */
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
  setPiece({ ...A, events: toEvents(genes), genes, length, waves: [], title: 'Forma A A′ B A″ (variações de Dabby)', fitness: undefined, parts: null });
}

// ------------------------------------------------------------------ analyser

function analysisSource() {
  const src = $('anSource').value;
  if (src === 'current') {
    const p = state.piece;
    return { compact: eventsToCompact(p.events), barLen: p.barLen, title: p.title, key: p.key };
  }
  if (REFERENCE_CANONS[src]) {
    const r = REFERENCE_CANONS[src];
    return { compact: referenceEvents(r), barLen: r.barLen, title: r.title, key: { tonic: r.tonic }, canonDelay: r.delayBars };
  }
  if (src === 'corpus') {
    const m = corpus[Number($('anCorpus').value)];
    return { compact: m.events, barLen: m.barLen, title: `${sourceName(m.source)} — ${m.title}`, key: { tonic: m.tonic } };
  }
  if (src === 'midi') return state.midiUpload;
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
  state.analysisPiece = { events, length: res.total, barLen: src.barLen, title: `Análise · ${src.title}`, key: src.key, waves: [] };
  if (src.canonDelay) $('canonPlayDelay').value = String(src.canonDelay);
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
  html += '<p class="hint">R² mede quanto da altura das notas as ondas explicam. Com poucas notas por parte o R² sobe sempre; compare com uma melodia baralhada no separador Avaliar/README antes de concluir.</p>';
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

function useAnalysisWaves() {
  const s = state.analysis?.segments[0];
  if (!s?.fit) return;
  state.customWaves = s.fit.waves.map((w) => waveToSpec(w, state.analysisPiece.barLen));
  if (![...$('preset').options].some((o) => o.value === 'analyzer')) option($('preset'), 'analyzer', 'Do analisador (1.ª parte)');
  $('preset').value = 'analyzer';
  if ($('mode').value === 'classic') $('mode').value = 'field';
  onModeChangeKeep();
  $('anStatus').textContent = 'Ondas copiadas para o gerador (Compor → Ondas: «Do analisador»).';
}

// ------------------------------------------------------------------ evaluation tab

function renderEvaluation(ev, p) {
  const pct = (x) => `${Math.round(x * 100)} %`;
  $('evalSummary').innerHTML = `<dl class="kv"><dt>crítico (melodia real?)</dt><dd>${pct(ev.humanLike)}</dd><dt>características típicas</dt><dd>${Math.round(ev.typicality * criticData.features.length)} de ${criticData.features.length}</dd><dt>surpresa melódica</dt><dd>${ev.features.icPitch.toFixed(2)} bits/nota (real: ${criticData.percentiles[criticData.features.indexOf('icPitch')].map((v) => v.toFixed(2)).join(' / ')})</dd><dt>complexidade LZ</dt><dd>${ev.features.lzComplexity.toFixed(2)}</dd><dt>validação do crítico</dt><dd>AUC ${criticData.cv.auc.toFixed(3)} (5-fold)</dd></dl><p class="hint">Avaliado nos primeiros 8 compassos de 4/4 (128 semicolcheias), como as melodias de referência.</p>`;
  const line = lineOf(p);
  const rows = [1, 2, 3].map((d) => {
    const c = analyzeCanon(line, { delay: d * p.barLen, barLen: p.barLen });
    return `<tr><td>${d} c.</td><td class="num">${pct(c.strongConsonance)}</td><td class="num">${c.parallels}</td><td class="num">${pct(c.unisonRatio)}</td><td class="num">${pct(c.contraryRatio)}</td><td class="num">${c.score.toFixed(2)}</td></tr>`;
  });
  $('canonTable').innerHTML = `<table class="data"><thead><tr><th>2.ª voz</th><th>consonância (tempos fortes)</th><th>5.as/8.as paralelas</th><th>uníssonos</th><th>mov. contrário</th><th>pontuação</th></tr></thead><tbody>${rows.join('')}</tbody><tfoot><tr><td>Telemann</td><td class="num">83 %</td><td class="num">1</td><td class="num">6 %</td><td class="num">32 %</td><td class="num">0.61</td></tr></tfoot></table>`;
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
  const ex = EXAMPLES[0];
  const built = buildFitness(ex.seed);
  const res = built.fit.evaluate(ex.genes);
  setPiece({
    events: toEvents(ex.genes),
    genes: ex.genes,
    length: ex.genes.length,
    barLen: STEPS_PER_BAR,
    waves: built.waves,
    key: built.key,
    fitness: res.score,
    parts: res.parts,
    mode: built.mode,
    weights: built.fit.weights,
    title: ex.title,
  });
  state.history = ex.history || [];
  drawHistory();
  void tonicMidi;
}

start();
