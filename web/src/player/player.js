// The light page a QR code opens (tocar.html): it reads the MIDI file carried in the address
// (#M<digits>, io/song.js), plays it with the page's synthesizer, draws its notes, offers the
// .mid file to save, and opens the piece in the full application. No composing engine is loaded,
// so it opens quickly on a phone, from any static host (GitHub Pages, raw.githack.com…) or from disk.

import { midiFromLink, parseSongText, LINK_MARK } from '../io/song.js';
import { parseMidi } from '../io/midi.js';
import { INSTRUMENTS } from '../core/instruments.js';
import { createPlayer } from '../ui/audio.js';
import { t, tn, applyTexts, setLang, getLang, onLangChange, initialLang, startLang, LANGUAGES } from '../i18n/i18n.js';

const $ = (id) => document.getElementById(id);
const player = createPlayer();
const state = { song: null, step: null };

/** The instrument of a General MIDI program (the closest of the page's own), for the synthesizer. */
export function instrumentOfProgram(program, pitches = []) {
  const ids = Object.keys(INSTRUMENTS).filter((k) => INSTRUMENTS[k].program === program);
  if (!ids.length) return program >= 40 && program < 48 ? 'violin' : program >= 56 && program < 64 ? 'trumpet' : program >= 64 && program < 80 ? 'flute' : 'piano';
  if (ids.length === 1 || !pitches.length) return ids[0];
  // several share the program (the voices): the one whose range holds the middle of the notes
  const mid = pitches.slice().sort((a, b) => a - b)[Math.floor(pitches.length / 2)];
  return ids.find((k) => mid >= INSTRUMENTS[k].range[0] && mid <= INSTRUMENTS[k].range[1]) ?? ids[0];
}

/**
 * The tracks of a MIDI file as the synthesizer plays them: voices of events in 16ths, the tempo,
 * the meter and the record of the piece (title) when the file was made by this application.
 */
export function songOfMidiFile(bytes) {
  const midi = parseMidi(bytes);
  const q = midi.division / 4;
  const voices = midi.tracks
    .filter((tr) => !tr.drums)
    .map((tr) => ({
      name: tr.name,
      instrument: instrumentOfProgram(tr.program ?? 0, tr.notes.map((n) => n.pitch)),
      events: tr.notes.map((n) => ({ pitch: n.pitch, start: n.on / q, dur: Math.max(0.25, (n.off - n.on) / q) })),
    }));
  let record = null;
  for (const text of midi.texts) {
    try {
      record = parseSongText(text) ?? record;
    } catch (e) {
      /* not ours */
    }
  }
  const length = Math.max(0, ...voices.flatMap((v) => v.events.map((e) => e.start + e.dur)));
  const barLen = Math.round((midi.numerator * 16) / midi.denominator);
  return { voices, bpm: midi.bpm ?? 90, numerator: midi.numerator, denominator: midi.denominator, length, barLen, title: record?.title ?? null };
}

// ------------------------------------------------------------------ page

function fillLanguages() {
  const sel = $('langSelect');
  sel.innerHTML = '';
  for (const l of LANGUAGES) {
    const o = document.createElement('option');
    o.value = l.id;
    o.textContent = l.name;
    o.selected = l.id === getLang();
    sel.append(o);
  }
}

function describe(song) {
  const seconds = Math.round(((song.length / 4) * 60) / Number($('plBpm').value));
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  return t('player.meta', { meter: `${song.numerator}/${song.denominator}`, bars: Math.ceil(song.length / song.barLen), voices: tn('player.voices', song.voices.length), time });
}

function render() {
  const song = state.song;
  if (!song) return;
  $('plTitle').textContent = song.title || t('player.untitled');
  document.title = `${song.title || t('player.untitled')} · ${t('app.title')}`;
  $('plMeta').textContent = describe(song);
  $('plVoices').innerHTML = song.voices.map((v, i) => `<li><i class="v${Math.min(i, 2)}"></i>${INSTRUMENTS[v.instrument] ? t(`instrument.${v.instrument}`) : v.name}</li>`).join('');
  drawRoll();
}

/** The notes of every voice, a line for the playhead. */
function drawRoll() {
  const song = state.song;
  const c = $('plRoll');
  const w = c.clientWidth;
  const h = c.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const colors = ['--note', '--follower', '--voice-3'].map((k) => css.getPropertyValue(k).trim() || '#17212b');
  g.fillStyle = css.getPropertyValue('--roll-bg').trim() || '#fbfcfd';
  g.fillRect(0, 0, w, h);
  const pitches = song.voices.flatMap((v) => v.events.map((e) => e.pitch));
  if (!pitches.length) return;
  const lo = Math.min(...pitches) - 1;
  const hi = Math.max(...pitches) + 1;
  const x = (s) => 6 + (s / song.length) * (w - 12);
  const rowH = (h - 8) / (hi - lo + 1);
  const y = (p) => 4 + (hi - p) * rowH;
  // bar lines
  g.strokeStyle = css.getPropertyValue('--grid').trim() || '#e3e8ee';
  g.lineWidth = 1;
  for (let b = 0; b <= song.length; b += song.barLen) {
    g.beginPath();
    g.moveTo(Math.round(x(b)) + 0.5, 0);
    g.lineTo(Math.round(x(b)) + 0.5, h);
    g.stroke();
  }
  song.voices.forEach((v, i) => {
    g.fillStyle = colors[Math.min(i, 2)];
    for (const e of v.events) g.fillRect(x(e.start), y(e.pitch), Math.max(1.5, x(e.start + e.dur) - x(e.start) - 1), Math.max(2, rowH - 1));
  });
  if (state.step !== null) {
    g.fillStyle = css.getPropertyValue('--wave-1').trim() || '#d9481c';
    g.fillRect(x(state.step) - 1, 0, 2, h);
  }
}

function setProgress(step) {
  state.step = step;
  const song = state.song;
  $('plProgress').style.width = step === null ? '0' : `${Math.min(100, (step / song.length) * 100)}%`;
  drawRoll();
}

function togglePlay() {
  if (player.playing) {
    player.stop();
    $('plPlay').textContent = t('play.play');
    setProgress(null);
    return;
  }
  const song = state.song;
  const n = song.voices.length;
  const pans = n === 1 ? [0] : n === 2 ? [-0.35, 0.35] : [-0.45, 0.45, 0];
  $('plPlay').textContent = t('play.stop');
  player.play(song.voices.map((v, i) => ({ events: v.events, instrument: v.instrument, pan: pans[i] ?? 0, gain: i ? 0.9 : 1 })), {
    bpm: Number($('plBpm').value),
    onStep: (s) => setProgress(s),
    onEnd: () => {
      $('plPlay').textContent = t('play.play');
      setProgress(null);
    },
  });
}

function saveMidi() {
  const blob = new Blob([state.midi], { type: 'audio/midi' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const name = (state.song.title || 'ondas-atratoras').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60) || 'ondas-atratoras';
  a.download = `${name}.mid`;
  document.body.append(a);
  a.click();
  a.remove();
  $('plStatus').textContent = t('player.saved');
}

/** The full application next to this page: dist/ondas-atratoras.html or web/index.html. */
function appAddress() {
  const here = window.location.pathname;
  const file = /\/dist\/[^/]*$/.test(here) ? 'ondas-atratoras.html' : 'index.html';
  return new URL(file, window.location.href).href.split('#')[0] + window.location.hash;
}

async function load() {
  if (!window.location.hash.startsWith(LINK_MARK)) {
    $('plTitle').textContent = t('player.none');
    $('plStatus').textContent = t('player.noneHint');
    return;
  }
  try {
    const midi = await midiFromLink(window.location.hash);
    state.midi = midi;
    state.song = songOfMidiFile(midi);
    $('plBpm').value = String(Math.round(Math.max(40, Math.min(240, state.song.bpm))));
    $('plBpmVal').textContent = $('plBpm').value;
    $('plPlay').disabled = false;
    $('plMidi').disabled = false;
    $('plPlay').classList.add('pulse');
    $('plStatus').textContent = t('player.ready');
    render();
  } catch (e) {
    $('plTitle').textContent = t('player.error');
    $('plStatus').textContent = typeof DecompressionStream !== 'function' ? t('player.oldBrowser') : e.message;
  }
}

function start() {
  startLang(initialLang());
  applyTexts();
  fillLanguages();
  $('langSelect').addEventListener('change', () => setLang($('langSelect').value));
  onLangChange(() => {
    applyTexts();
    fillLanguages();
    if (!player.playing) $('plPlay').textContent = t('play.play');
    if (state.song) render();
  });
  $('plPlay').addEventListener('click', () => {
    $('plPlay').classList.remove('pulse');
    togglePlay();
  });
  $('plBpm').addEventListener('input', () => {
    $('plBpmVal').textContent = $('plBpm').value;
    if (state.song) $('plMeta').textContent = describe(state.song);
  });
  $('plMidi').addEventListener('click', saveMidi);
  $('plApp').href = appAddress();
  window.addEventListener('resize', () => state.song && drawRoll());
  window.addEventListener('hashchange', () => {
    player.stop();
    $('plApp').href = appAddress();
    load();
  });
  load();
}

if (typeof document !== 'undefined') start();
