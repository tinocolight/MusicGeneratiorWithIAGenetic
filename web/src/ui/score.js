// Engraved score, drawn with VexFlow 4 and the Gonville music font (designed as a replacement for
// LilyPond's Feta font), laid out the way LilyPond does by default: justified systems, instrument
// names on the first system, bar numbers at the start of each line, a bracket joining the voices,
// tempo mark above and a final bar line. The same drawing code writes the page (SVG) and the PDF
// (io/pdf.js, A4 pages).
//
// Two layouts (io/notation.js): one staff per voice, or the whole canon on one line with
// numbered entry marks (as rounds are printed: when the first voice reaches mark 2, the second
// voice starts from the beginning), repeat signs for a round and a legend of the voices.
// VexFlow (MIT) is vendored in web/vendor/ and loaded the first time the score is shown.

import { spell, vexKey, VEX_DURATION, tempoMark } from '../io/notation.js';
import { createPdf, A4 } from '../io/pdf.js';

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
const ENTRY_GAP = 18; // extra room above a staff that carries entry marks
const LEGEND_LINE = 17;

function naturalWidth(model, b) {
  let w = 0;
  for (const st of model.staves) {
    const bar = st.bars[b];
    const sw = bar.length === 1 && bar[0].full ? 64 : bar.reduce((a, it) => a + SPACE[it.dur], 0);
    w = Math.max(w, sw);
  }
  return 26 + w;
}

/** Height of the title block: title, subtitle and, for the one-line canon, the legend. */
export function titleHeight(model) {
  return 64 + (model.legend?.length ? model.legend.length * LEGEND_LINE + 26 : 0);
}

/** Line breaking for a width: the fewest lines that fit, then bars spread evenly over them. */
export function layoutScore(model, width) {
  const W = Math.max(320, Math.floor(width));
  const n = model.staves.length;
  const accidentals = Object.values(model.spelling.signature).filter((a) => a !== 0).length;
  const names = model.staves.map((s) => s.name || '');
  const nameW = Math.min(W * 0.3, Math.max(...names.map((s) => s.length)) * 7 + (n > 1 ? 26 : 18));
  const hasNames = names.some(Boolean);
  const indentFirst = hasNames ? nameW : 14;
  const indent = n > 1 ? 18 : 10;
  const right = 8;
  const header = (first) => 34 + accidentals * 10 + 8 + (first ? 30 : 0);
  const widths = Array.from({ length: model.nBars }, (_, b) => naturalWidth(model, b));
  const availOf = (first) => W - (first ? indentFirst : indent) - right - header(first);
  // (as LilyPond's line breaker does, instead of a full first line and a short last one)
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
  const entryRoom = model.entries?.length ? ENTRY_GAP : 0;
  const sysH = n * STAFF_STEP + SYSTEM_GAP + entryRoom;
  // how far the last system on a page reaches (its lowest staff and notes below it)
  const sysFoot = (n - 1) * STAFF_STEP + 70 + entryRoom;
  return { W, n, names, nameW, hasNames, indentFirst, indent, right, header, widths, systems, sysH, sysFoot, entryRoom, titleH: titleHeight(model) };
}

function drawTitle(ctx, model, W, top, { ink, muted }) {
  ctx.save();
  ctx.setFillStyle(ink);
  ctx.setFont('Georgia, "IM Fell English", serif', 19, 'normal');
  const tw = ctx.measureText(model.title).width;
  ctx.fillText(model.title, (W - tw) / 2, top + 24);
  if (model.subtitle) {
    ctx.setFont('Georgia, serif', 12, 'normal', 'italic');
    ctx.setFillStyle(muted);
    const sw = ctx.measureText(model.subtitle).width;
    ctx.fillText(model.subtitle, Math.max(4, (W - sw) / 2), top + 44);
  }
  if (model.legend?.length) {
    ctx.setFillStyle(ink);
    let y = top + 70;
    for (const line of model.legend) {
      if (line.mark) {
        drawMarkBox(ctx, 14, y - 12, line.mark, ink);
        ctx.setFont('Georgia, serif', 11, 'normal');
        ctx.fillText(line.text, 40, y);
      } else {
        ctx.setFont('Georgia, serif', 11, 'normal', 'italic');
        ctx.fillText(line.text, 14, y);
      }
      y += LEGEND_LINE;
    }
  }
  ctx.restore();
}

/** Boxed rehearsal-style number (LilyPond's \mark \markup \box). */
function drawMarkBox(ctx, x, y, label, ink) {
  ctx.save();
  ctx.setFont('Georgia, serif', 11, 'bold');
  const w = Math.max(16, ctx.measureText(String(label)).width + 8);
  ctx.setStrokeStyle(ink);
  ctx.setLineWidth(1.2);
  ctx.beginPath();
  ctx.rect(x, y, w, 16);
  ctx.stroke();
  ctx.setFillStyle(ink);
  ctx.fillText(String(label), x + (w - ctx.measureText(String(label)).width) / 2, y + 12.5);
  ctx.restore();
  return w;
}

/**
 * Draws some systems of a laid-out score. `place(si)` gives {ctx, top} for system `si` (so the
 * systems can go to different PDF pages). Returns [{note, start, end, rest}] for highlighting.
 */
function drawSystems(VF, model, lay, systemsToDraw, place, { ink, muted }) {
  const m = model.meter;
  const { n, names, hasNames, indentFirst, indent, header, widths, systems, entryRoom } = lay;
  const beamGroups = m.compound && m.den === 8 ? [new VF.Fraction(3, 8)] : [new VF.Fraction(1, 4)];
  const tempo = tempoMark(m, model.bpm);
  const tempoDur = { 4: ['q', 0], 6: ['q', 1], 12: ['h', 1], 8: ['h', 0] }[tempo.unit] ?? ['q', 0];
  const out = [];
  const chains = model.staves.map(() => []); // per staff: [{note, tie, sys}] for ties
  const ctxOf = {};
  const entriesAt = {};
  for (const e of model.entries ?? []) (entriesAt[Math.floor(e.step / m.barLen)] ||= []).push(e);

  for (const si of systemsToDraw) {
    const sys = systems[si];
    const { ctx, top } = place(si);
    ctxOf[si] = ctx;
    ctx.setFillStyle(ink);
    ctx.setStrokeStyle(ink);
    const y0 = top + entryRoom - 22;
    const x0 = sys.first ? indentFirst : indent;
    // justify every line except a short last one (LilyPond's ragged-last would leave it short)
    const last = si === systems.length - 1;
    const scale = last && sys.used < sys.avail * 0.6 ? 1 : sys.avail / sys.used;
    let x = x0;
    const firstStaves = [];
    sys.bars.forEach((bar, k) => {
      const w = widths[bar] * scale + (k === 0 ? header(sys.first) : 0);
      const staves = model.staves.map((st, i) => {
        const stave = new VF.Stave(x, y0 + i * STAFF_STEP, w, { fill_style: ink });
        if (k === 0) {
          stave.addClef(st.clef, 'default', st.octave < 0 ? '8vb' : undefined);
          stave.addKeySignature(model.keyNames.vex);
          if (sys.first) stave.addTimeSignature(`${m.num}/${m.den}`);
        }
        if (model.repeat && bar === 0) stave.setBegBarType(VF.Barline.type.REPEAT_BEGIN);
        if (bar === model.nBars - 1) stave.setEndBarType(model.repeat ? VF.Barline.type.REPEAT_END : VF.Barline.type.END);
        if (i === 0 && k === 0 && !sys.first) stave.setMeasure(bar + 1);
        if (i === 0 && k === 0 && sys.first) stave.setTempo({ duration: tempoDur[0], dots: tempoDur[1], bpm: tempo.value }, -14);
        return stave.setContext(ctx);
      });
      if (staves.length > 1) VF.Stave.formatBegModifiers(staves);
      const start = Math.max(...staves.map((s) => s.getNoteStartX()));
      staves.forEach((s) => s.setNoteStartX(start));
      staves.forEach((s) => s.draw());

      const voices = [];
      const beams = [];
      const barNotes = [];
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
          if (i === 0) barNotes.push({ note, start: it.start });
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

      // entry marks of the one-line canon, above the note where the voice comes in
      for (const e of entriesAt[bar] ?? []) {
        const off = e.step - bar * m.barLen;
        let target = barNotes[0];
        for (const bn of barNotes) if (bn.start <= off) target = bn;
        // the first voice's mark goes over the clef, as rounds are printed (the tempo mark is
        // over the first note); the others over the note where the voice comes in
        const atStart = e.step === 0;
        const nx = atStart ? staves[0].getX() + 2 : target ? target.note.getAbsoluteX() - 4 : staves[0].getNoteStartX();
        const by = staves[0].getYForLine(0) - 36;
        const bw = drawMarkBox(ctx, nx, by, e.number, ink);
        if (atStart) continue;
        if (e.short) {
          ctx.save();
          ctx.setFont('Georgia, serif', 10, 'normal', 'italic');
          ctx.setFillStyle(muted);
          ctx.fillText(e.short, nx + bw + 4, by + 12);
          ctx.restore();
        }
      }

      if (staves.length > 1) {
        const type = bar === model.nBars - 1 ? 'boldDoubleRight' : 'singleRight';
        new VF.StaveConnector(staves[0], staves[staves.length - 1]).setType(type).setContext(ctx).draw();
      }
      if (k === 0) firstStaves.push(...staves);
      x += w;
    });

    if (n > 1) {
      const topSt = firstStaves[0];
      const bottom = firstStaves[n - 1];
      new VF.StaveConnector(topSt, bottom).setType('bracket').setContext(ctx).draw();
      new VF.StaveConnector(topSt, bottom).setType('singleLeft').setContext(ctx).draw();
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
  }

  // ---- ties (split in two halves across a line or page break)
  for (const chain of chains) {
    for (let i = 0; i + 1 < chain.length; i++) {
      const a = chain[i];
      const c = chain[i + 1];
      if (!a.note || !a.tie || !c.note) continue;
      const tie = (ctx, first, lastN) => new VF.StaveTie({ first_note: first, last_note: lastN, first_indices: [0], last_indices: [0] }).setContext(ctx).draw();
      if (a.sys === c.sys) tie(ctxOf[a.sys], a.note, c.note);
      else {
        tie(ctxOf[a.sys], a.note, null);
        tie(ctxOf[c.sys], null, c.note);
      }
    }
  }
  return out;
}

/**
 * Draws `model` (io/notation.js scoreModel) into `container` as SVG.
 * Returns {notes: [{el, start, end, rest}], height} so the page can light up sounding notes.
 */
export function renderScore(container, model, { width, ink = '#111', muted = '#666' } = {}) {
  const VF = window.Vex.Flow;
  container.innerHTML = '';
  const lay = layoutScore(model, width);
  const height = lay.titleH + lay.systems.length * lay.sysH + 10;
  const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
  renderer.resize(lay.W, height);
  const ctx = renderer.getContext();
  drawTitle(ctx, model, lay.W, 0, { ink, muted });
  const all = lay.systems.map((_, i) => i);
  const out = drawSystems(VF, model, lay, all, (si) => ({ ctx, top: lay.titleH + si * lay.sysH }), { ink, muted });
  const notes = out.map((o) => ({ el: o.note.getSVGElement(), start: o.start, end: o.end, rest: o.rest }));
  return { notes, height };
}

// A4 pages: the score at 0.6 pt per px (a staff space of 6 pt, a little larger than LilyPond's
// default 20-pt staff), 15 mm margins, page numbers at the foot.
const PDF_SCALE = 0.6;
const MARGIN_X = 42;
const MARGIN_TOP = 44;
const MARGIN_BOTTOM = 38;

/** The score as a PDF (Uint8Array), on as many A4 pages as needed. */
export function scorePdf(model, { VF = window.Vex.Flow, footer = 'Ondas Atratoras · algoritmo genético' } = {}) {
  const doc = createPdf({ title: model.title });
  const s = PDF_SCALE;
  const width = (A4.width - 2 * MARGIN_X) / s;
  const usable = (A4.height - MARGIN_TOP - MARGIN_BOTTOM) / s;
  const lay = layoutScore(model, width);
  // systems per page (the first page also carries the title block)
  const pages = [];
  let cur = [];
  let used = lay.titleH;
  lay.systems.forEach((_, si) => {
    if (cur.length && used + lay.sysFoot > usable) {
      pages.push(cur);
      cur = [];
      used = 0;
    }
    cur.push({ si, top: used });
    used += lay.sysH;
  });
  if (cur.length) pages.push(cur);

  const colors = { ink: '#000', muted: '#444' };
  const ctxs = pages.map((pg, pi) => {
    const ctx = doc.addPage({ scale: s });
    ctx.translate(MARGIN_X / s, MARGIN_TOP / s);
    if (pi === 0) drawTitle(ctx, model, lay.W, 0, colors);
    return ctx;
  });
  const where = {};
  pages.forEach((pg, pi) => pg.forEach(({ si, top }) => (where[si] = { ctx: ctxs[pi], top })));
  drawSystems(VF, model, lay, lay.systems.map((_, i) => i), (si) => where[si], colors);

  // page numbers and the footer
  ctxs.forEach((ctx, pi) => {
    ctx.save();
    ctx.setFillStyle('#555');
    ctx.setFont('Georgia, serif', 9, 'normal', 'italic');
    const foot = pages.length > 1 ? `${pi + 1} / ${pages.length}` : '';
    const y = (A4.height - MARGIN_TOP - 22) / s;
    if (foot) ctx.fillText(foot, (lay.W - ctx.measureText(foot).width) / 2, y);
    if (pi === 0 && footer) ctx.fillText(footer, lay.W - ctx.measureText(footer).width, y);
    ctx.restore();
  });
  return { bytes: doc.toBytes(), pages: pages.length };
}
