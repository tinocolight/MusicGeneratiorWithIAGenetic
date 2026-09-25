// Engraved score in the page, drawn with VexFlow 4 and the Gonville music font (designed as a
// replacement for LilyPond's Feta font), laid out the way LilyPond does by default: justified
// systems, instrument names on the first system, bar numbers at the start of each line, a
// bracket joining the voices, tempo mark above and a final bar line.
// VexFlow (MIT) is vendored in web/vendor/ and loaded the first time the score is shown.

import { spell, vexKey, VEX_DURATION, tempoMark } from '../io/notation.js';

let loading = null;

export function loadVexFlow() {
  if (window.Vex?.Flow) return Promise.resolve(window.Vex);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'vendor/vexflow-gonville.js';
      s.onload = () => (window.Vex?.Flow ? resolve(window.Vex) : reject(new Error('VexFlow não inicializou')));
      s.onerror = () => {
        loading = null;
        reject(new Error('não foi possível carregar vendor/vexflow-gonville.js'));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

const REST_KEY = { treble: 'b/4', bass: 'd/3', alto: 'c/4' };
// horizontal space a value needs (px), before justification
const SPACE = { 1: 22, 2: 25, 3: 28, 4: 30, 6: 33, 8: 37, 12: 42, 16: 46, 24: 50 };
const STAFF_STEP = 92; // from one staff to the next inside a system
const SYSTEM_GAP = 34;
const TITLE_H = 64;

function naturalWidth(model, b) {
  let w = 0;
  for (const st of model.staves) {
    const bar = st.bars[b];
    const sw = bar.length === 1 && bar[0].full ? 64 : bar.reduce((a, it) => a + SPACE[it.dur], 0);
    w = Math.max(w, sw);
  }
  return 26 + w;
}

/**
 * Draws `model` (io/notation.js scoreModel) into `container`.
 * Returns {notes: [{el, start, end, rest}], height} so the page can light up sounding notes.
 */
export function renderScore(container, model, { width, ink = '#111', muted = '#666' } = {}) {
  const VF = window.Vex.Flow;
  container.innerHTML = '';
  const m = model.meter;
  const W = Math.max(320, Math.floor(width));
  const n = model.staves.length;
  const accidentals = Object.values(model.spelling.signature).filter((a) => a !== 0).length;
  const names = model.staves.map((s) => s.name || '');
  const nameW = Math.min(120, Math.max(...names.map((s) => s.length)) * 7.2 + (n > 1 ? 22 : 16));
  const hasNames = names.some(Boolean);
  const indentFirst = hasNames ? nameW : 14;
  const indent = n > 1 ? 18 : 10;
  const right = 8;
  const header = (first) => 34 + accidentals * 10 + 8 + (first ? 30 : 0);

  // ---- line breaking: the fewest lines that fit, then bars spread evenly over them (as
  // LilyPond's line breaker does, instead of a full first line and a short last one)
  const widths = Array.from({ length: model.nBars }, (_, b) => naturalWidth(model, b));
  const availOf = (first) => W - (first ? indentFirst : indent) - right - header(first);
  const breakLines = (target) => {
    const out = [];
    let b = 0;
    while (b < model.nBars) {
      const first = out.length === 0;
      const avail = availOf(first);
      const bars = [b];
      let used = widths[b];
      b++;
      while (b < model.nBars && used + widths[b] <= Math.min(avail, target ?? avail)) {
        used += widths[b];
        bars.push(b);
        b++;
      }
      out.push({ bars, used, avail, first });
    }
    return out;
  };
  let systems = breakLines(null);
  if (systems.length > 1) {
    const total = widths.reduce((a, w) => a + w, 0);
    for (let slack = 1.02; slack < 1.6; slack += 0.04) {
      const even = breakLines((total / systems.length) * slack);
      if (even.length === systems.length) {
        systems = even;
        break;
      }
    }
  }

  const sysH = n * STAFF_STEP + SYSTEM_GAP;
  const height = TITLE_H + systems.length * sysH + 10;
  const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
  renderer.resize(W, height);
  const ctx = renderer.getContext();
  ctx.setFillStyle(ink);
  ctx.setStrokeStyle(ink);

  // ---- title block
  ctx.save();
  ctx.setFont('Georgia, "IM Fell English", serif', 19, 'normal');
  const tw = ctx.measureText(model.title).width;
  ctx.fillText(model.title, (W - tw) / 2, 24);
  if (model.subtitle) {
    ctx.setFont('Georgia, serif', 12, 'normal', 'italic');
    ctx.setFillStyle(muted);
    const sw = ctx.measureText(model.subtitle).width;
    ctx.fillText(model.subtitle, Math.max(4, (W - sw) / 2), 44);
  }
  ctx.restore();

  const beamGroups = m.compound && m.den === 8 ? [new VF.Fraction(3, 8)] : [new VF.Fraction(1, 4)];
  const tempo = tempoMark(m, model.bpm);
  const tempoDur = { 4: ['q', 0], 6: ['q', 1], 12: ['h', 1], 8: ['h', 0] }[tempo.unit] ?? ['q', 0];
  const out = [];
  const chains = model.staves.map(() => []); // per staff: [{note, tie, sys}] for ties

  systems.forEach((sys, si) => {
    const y0 = TITLE_H + si * sysH - 22;
    const x0 = sys.first ? indentFirst : indent;
    // justify every line except a short last one (LilyPond's ragged-last would leave it short)
    const last = si === systems.length - 1;
    const scale = last && sys.used < sys.avail * 0.6 ? 1 : sys.avail / sys.used;
    let x = x0;
    const firstStaves = [];
    const lastStaves = [];
    sys.bars.forEach((bar, k) => {
      const w = widths[bar] * scale + (k === 0 ? header(sys.first) : 0);
      const staves = model.staves.map((st, i) => {
        const stave = new VF.Stave(x, y0 + i * STAFF_STEP, w, { fill_style: ink });
        if (k === 0) {
          stave.addClef(st.clef, 'default', st.octave < 0 ? '8vb' : undefined);
          stave.addKeySignature(model.keyNames.vex);
          if (sys.first) stave.addTimeSignature(`${m.num}/${m.den}`);
        }
        if (bar === model.nBars - 1) stave.setEndBarType(VF.Barline.type.END);
        if (i === 0 && k === 0 && !sys.first) stave.setMeasure(bar + 1);
        if (i === 0 && k === 0 && sys.first) stave.setTempo({ duration: tempoDur[0], dots: tempoDur[1], bpm: tempo.value }, -2);
        return stave.setContext(ctx);
      });
      if (staves.length > 1) VF.Stave.formatBegModifiers(staves);
      const start = Math.max(...staves.map((s) => s.getNoteStartX()));
      staves.forEach((s) => s.setNoteStartX(start));
      staves.forEach((s) => s.draw());

      const voices = [];
      const beams = [];
      model.staves.forEach((st, i) => {
        const items = st.bars[bar];
        const notes = items.map((it) => {
          const dur = VEX_DURATION[it.full ? 16 : it.dur];
          const note = new VF.StaveNote({
            clef: st.clef,
            keys: [it.rest ? REST_KEY[st.clef] ?? 'b/4' : vexKey(spell(it.pitch, model.spelling), -st.octave)],
            duration: dur + (it.rest ? 'r' : ''),
            auto_stem: true,
            align_center: !!it.full,
          });
          if (dur.endsWith('d')) VF.Dot.buildAndAttach([note], { all: true });
          const s0 = bar * m.barLen + it.start;
          out.push({ note, start: s0, end: s0 + (it.full ? m.barLen : it.dur), rest: it.rest });
          if (!it.rest) chains[i].push({ note, tie: it.tie, sys: si });
          else chains[i].push({ note: null, tie: false, sys: si });
          return note;
        });
        const voice = new VF.Voice({ num_beats: m.num, beat_value: m.den }).setMode(VF.Voice.Mode.SOFT).addTickables(notes);
        VF.Accidental.applyAccidentals([voice], model.keyNames.vex);
        beams.push(...VF.Beam.generateBeams(notes, { groups: beamGroups, beam_rests: false }));
        voices.push(voice);
      });
      const fmt = new VF.Formatter();
      voices.forEach((v) => fmt.joinVoices([v]));
      fmt.format(voices, Math.max(20, staves[0].getNoteEndX() - start - 10));
      voices.forEach((v, i) => v.draw(ctx, staves[i]));
      beams.forEach((bm) => bm.setContext(ctx).draw());

      if (staves.length > 1) {
        const type = bar === model.nBars - 1 ? 'boldDoubleRight' : 'singleRight';
        new VF.StaveConnector(staves[0], staves[staves.length - 1]).setType(type).setContext(ctx).draw();
      }
      if (k === 0) firstStaves.push(...staves);
      lastStaves.splice(0, lastStaves.length, ...staves);
      x += w;
    });

    if (n > 1) {
      const top = firstStaves[0];
      const bottom = firstStaves[n - 1];
      new VF.StaveConnector(top, bottom).setType('bracket').setContext(ctx).draw();
      new VF.StaveConnector(top, bottom).setType('singleLeft').setContext(ctx).draw();
    }
    if (sys.first && hasNames) {
      ctx.save();
      ctx.setFont('Georgia, serif', 13, 'normal');
      firstStaves.forEach((st, i) => {
        const label = names[i];
        const lw = ctx.measureText(label).width;
        ctx.fillText(label, x0 - (n > 1 ? 18 : 8) - lw, st.getYForLine(2) + 4);
      });
      ctx.restore();
    }
  });

  // ---- ties (split in two halves across a line break)
  for (const chain of chains) {
    for (let i = 0; i + 1 < chain.length; i++) {
      const a = chain[i];
      const c = chain[i + 1];
      if (!a.note || !a.tie || !c.note) continue;
      const tie = (first, lastN) => new VF.StaveTie({ first_note: first, last_note: lastN, first_indices: [0], last_indices: [0] }).setContext(ctx).draw();
      if (a.sys === c.sys) tie(a.note, c.note);
      else {
        tie(a.note, null);
        tie(null, c.note);
      }
    }
  }

  const notes = out.map((o) => ({ el: o.note.getSVGElement(), start: o.start, end: o.end, rest: o.rest }));
  return { notes, height };
}
