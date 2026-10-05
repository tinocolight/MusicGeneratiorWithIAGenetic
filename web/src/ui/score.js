// Engraved score, drawn with VexFlow 4 and the Gonville music font (designed as a replacement for
// LilyPond's Feta font), laid out the way LilyPond does by default: justified systems, instrument
// names on the first system, bar numbers at the start of each line, a bracket joining the voices,
// tempo mark above and a final bar line. The same drawing code writes the page (SVG) and the PDF
// (io/pdf.js, A4 pages).
//
// Two layouts (io/notation.js): one staff per voice, or the whole canon on one line with
// numbered entry marks (as rounds are printed: when the first voice reaches mark 2, the second
// voice starts from the beginning), repeat signs for a round and a legend of the voices.
// With dynamics (the fado styles), the marks go under each staff: the letters (pp…ff) in the
// music font, hairpins, and accents over the notes.
// VexFlow (MIT) is vendored in web/vendor/ and loaded the first time the score is shown.

import { t } from '../i18n/i18n.js';
import { spell, vexKey, VEX_DURATION, tempoMark } from '../io/notation.js';
import { createPdf, A4 } from '../io/pdf.js';
import { qrRuns } from '../io/qr.js';

let loading = null;

export function loadVexFlow() {
  if (window.Vex?.Flow) return Promise.resolve(window.Vex);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'vendor/vexflow-gonville.js';
      s.onload = () => (window.Vex?.Flow ? resolve(window.Vex) : reject(new Error(t('score.vexInit'))));
      s.onerror = () => {
        loading = null;
        reject(new Error(t('score.vexLoad')));
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
  // room for the tempo mark above the first staff, under a subtitle that can span the width
  return 64 + (model.subtitle ? 16 : 0) + (model.legend?.length ? model.legend.length * LEGEND_LINE + 26 : 0);
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
  // room above the first staff for the entry marks of a canon or the chord symbols of an accompaniment
  const entryRoom = model.entries?.length || model.chords?.length ? ENTRY_GAP : 0;
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
    let y = top + (model.subtitle ? 74 : 62);
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
  const placed = model.staves.map(() => []); // per staff: [{start, end, note, sys, stave}] for the dynamics
  const accents = model.staves.map((st) => new Set((st.dynamics ?? []).filter((d) => d.type === 'accent').map((d) => d.step)));
  const lineEnd = {};
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
        if (i === 0 && k === 0 && sys.first) stave.setTempo({ duration: tempoDur[0], dots: tempoDur[1], bpm: tempo.value }, model.chords?.length ? -30 : -14);
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
            keys: it.rest ? [REST_KEY[st.clef] ?? 'b/4'] : (it.pitches?.length ? it.pitches : [it.pitch]).map((p) => vexKey(spell(p, model.spelling), -st.octave)),
            duration: dur + (it.rest ? 'r' : ''),
            auto_stem: true,
            align_center: !!it.full,
          });
          if (dur.endsWith('d')) VF.Dot.buildAndAttach([note], { all: true });
          const s0 = bar * m.barLen + it.start;
          if (!it.rest && accents[i].has(s0)) note.addModifier(new VF.Articulation('a>').setPosition(VF.Modifier.Position.ABOVE), 0);
          if (i === 0 && !it.rest && model.marks?.fermata.includes(s0)) note.addModifier(new VF.Articulation('a@a').setPosition(VF.Modifier.Position.ABOVE), 0);
          placed[i].push({ start: s0, end: s0 + (it.full ? m.barLen : it.dur), note, sys: si, stave: null, i, full: !!it.full });
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
      model.staves.forEach((_, i) => {
        for (const pl of placed[i]) if (pl.stave === null) pl.stave = staves[i];
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
    lineEnd[si] = x;

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
  // ---- chord symbols over the first staff, at the note or rest where each chord starts
  if (model.chords?.length && placed[0].length) {
    for (const c of model.chords) {
      // over the note (of any staff) that starts with the chord: the voice may be resting there
      const all = placed.flat();
      // (a whole-bar rest is drawn in the middle of the bar, so it does not say where a chord starts)
      const at = (x) => x.start === c.step && !x.full;
      const pl = placed[0].find(at) ?? all.find(at) ?? placed[0].find((x) => x.start <= c.step && c.step < x.end);
      if (!pl) continue;
      const ctx = ctxOf[pl.sys];
      ctx.save();
      ctx.setFillStyle(ink);
      ctx.setFont('Georgia, serif', 12, 'bold');
      const top = placed[0].find((x) => x.sys === pl.sys)?.stave ?? pl.stave;
      ctx.fillText(c.name, pl.note.getAbsoluteX() - 2, top.getYForLine(0) - 12);
      ctx.restore();
    }
  }

  // ---- "rit." over the first staff where the singer slows into a held note (the rubato)
  for (const step of model.marks?.rit ?? []) {
    const pl = placed[0].find((x) => x.start <= step && step < x.end);
    if (!pl) continue;
    const ctx = ctxOf[pl.sys];
    ctx.save();
    ctx.setFillStyle(ink);
    ctx.setFont('Georgia, serif', 12, 'normal', 'italic');
    ctx.fillText('rit.', pl.note.getAbsoluteX(), pl.stave.getYForLine(0) - (model.chords?.length ? 26 : 12));
    ctx.restore();
  }

  // ---- dynamics under the staves: letters, then hairpins from the note where they start to the
  // next note after their end (or to the end of the line)
  model.staves.forEach((st, i) => {
    const items = placed[i];
    if (!st.dynamics?.length || !items.length) return;
    const at = (step) => items.find((pl) => pl.start <= step && step < pl.end) ?? items.find((pl) => pl.start >= step);
    const textEnd = new Map();
    for (const d of st.dynamics) {
      if (d.type !== 'text') continue;
      const a = at(d.step);
      if (!a) continue;
      const x = a.note.getAbsoluteX() - 3;
      const w = drawDynamic(VF, ctxOf[a.sys], d.text, x, a.stave.getYForLine(4) + 30, ink);
      textEnd.set(d.step, x + w + 4);
    }
    for (const d of st.dynamics) {
      if (d.type !== 'cresc' && d.type !== 'dim') continue;
      const a = at(d.step);
      if (!a) continue;
      const b = items.find((pl) => pl.start >= d.end);
      const x1 = textEnd.get(d.step) ?? a.note.getAbsoluteX();
      let x2 = b && b.sys === a.sys ? b.note.getAbsoluteX() - 6 : lineEnd[a.sys] - 6;
      if (x2 - x1 < 16) x2 = x1 + 16;
      drawHairpin(ctxOf[a.sys], x1, x2, a.stave.getYForLine(4) + 25, d.type, ink);
    }
  });
  return out;
}

// the dynamic letters in the music font (as LilyPond and VexFlow's TextDynamics draw them); in
// a font without them, bold italic letters
const DYNAMIC_GLYPHS = { p: 'dynamicPiano', m: 'dynamicMezzo', f: 'dynamicForte' };
function drawDynamic(VF, ctx, text, x, y, ink) {
  ctx.save();
  ctx.setFillStyle(ink);
  let w = 0;
  let glyphs = null;
  try {
    glyphs = [...text].map((ch) => new VF.Glyph(DYNAMIC_GLYPHS[ch], 34));
  } catch {
    glyphs = null;
  }
  if (glyphs) {
    for (const g of glyphs) {
      g.render(ctx, x + w, y);
      w += g.getMetrics().width;
    }
  } else {
    ctx.setFont('Georgia, serif', 14, 'bold', 'italic');
    ctx.fillText(text, x, y);
    w = ctx.measureText(text).width;
  }
  ctx.restore();
  return w;
}

/** A crescendo (opening) or diminuendo (closing) hairpin between x1 and x2, centred on y. */
function drawHairpin(ctx, x1, x2, y, type, ink) {
  const h = 4.5;
  ctx.save();
  ctx.setStrokeStyle(ink);
  ctx.setLineWidth(1.1);
  ctx.beginPath();
  if (type === 'cresc') {
    ctx.moveTo(x2, y - h);
    ctx.lineTo(x1, y);
    ctx.lineTo(x2, y + h);
  } else {
    ctx.moveTo(x1, y - h);
    ctx.lineTo(x2, y);
    ctx.lineTo(x1, y + h);
  }
  ctx.stroke();
  ctx.restore();
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

// A4 pages, 15 mm margins, page numbers at the foot. The score is drawn at 0.6 pt per px (a staff
// space of 6 pt, a little larger than LilyPond's default 20-pt staff) unless another size fills the
// pages better: when the last page would carry only a few lines, the staff shrinks (down to
// 0.45, an 18-pt staff) so that the piece fits one page fewer; when it would be left half empty,
// the staff grows (up to 0.75, a 30-pt staff) until the music fills the pages. Of the two, the
// one closer to the usual size wins, so a quarter of a second page is folded into one page and
// a page and a half becomes two full pages. Then the lines are shared evenly among the pages and
// spread down each page (LilyPond's page breaking and ragged-bottom = ##f do the same).
const PDF_SCALE = 0.6;
const PDF_MIN = 0.45;
const PDF_MAX = 0.75;
const PDF_STEP = 0.005;
const MARGIN_X = 42;
const MARGIN_TOP = 44;
const MARGIN_BOTTOM = 38;

/**
 * Line and page breaking of the score on A4 at `s` pt per px; `reserve` pt are kept free at the
 * foot of the last page (for the QR code).
 */
export function paginate(model, s, reserve = 0) {
  const width = (A4.width - 2 * MARGIN_X) / s;
  const usable = (A4.height - MARGIN_TOP - MARGIN_BOTTOM) / s;
  const lay = layoutScore(model, width);
  const k = lay.systems.length;
  // height of systems a..b-1 on one page (the first page also carries the title block, the last
  // one the reserved space)
  const heightOf = (a, b) => (a === 0 ? lay.titleH : 0) + (b - a - 1) * lay.sysH + lay.sysFoot + (b === k ? reserve / s : 0);
  const fits = (a, b) => b - a === 1 || heightOf(a, b) <= usable;
  // the fewest pages, filling each in turn
  let count = 0;
  for (let a = 0; a < k; count++) {
    let b = a + 1;
    while (b < k && fits(a, b + 1)) b++;
    a = b;
  }
  // the same number of pages with the lines shared evenly: least squared room left on the pages
  const cost = Array.from({ length: count + 1 }, () => new Array(k + 1).fill(Infinity));
  const from = Array.from({ length: count + 1 }, () => new Array(k + 1).fill(-1));
  cost[0][0] = 0;
  for (let p = 1; p <= count; p++) {
    for (let b = 1; b <= k; b++) {
      for (let a = b - 1; a >= 0 && fits(a, b); a--) {
        if (cost[p - 1][a] === Infinity) continue;
        const c = cost[p - 1][a] + ((usable - heightOf(a, b)) / usable) ** 2;
        if (c < cost[p][b]) {
          cost[p][b] = c;
          from[p][b] = a;
        }
      }
    }
  }
  const pages = [];
  for (let p = count, b = k; p > 0; p--) {
    const a = from[p][b];
    pages.unshift({ first: a, end: b, fill: heightOf(a, b) / usable });
    b = a;
  }
  return { lay, usable, pages };
}

/** Staff size (pt per px) for the PDF: see above. */
export function pdfScale(model, reserve = 0) {
  const pagesAt = (s) => paginate(model, s, reserve).pages.length;
  const n = pagesAt(PDF_SCALE);
  if (n === 1) return PDF_SCALE;
  let up = PDF_SCALE;
  for (let s = PDF_SCALE + PDF_STEP; s <= PDF_MAX + 1e-9; s += PDF_STEP) {
    if (pagesAt(s) > n) break;
    up = s;
  }
  let down = null;
  for (let s = PDF_SCALE - PDF_STEP; s >= PDF_MIN - 1e-9; s -= PDF_STEP) {
    if (pagesAt(s) < n) {
      down = s;
      break;
    }
  }
  const r = (x) => Math.round(x * 1000) / 1000;
  return down !== null && Math.log(PDF_SCALE / down) < Math.log(up / PDF_SCALE) ? r(down) : r(up);
}

// The QR code: modules of 0.55 mm at most, the whole symbol (with its quiet zone of 4 modules)
// 60 mm at most, so that a version 40 symbol still has modules of 0.32 mm, which a phone camera
// resolves at 10–15 cm from a laser print.
const MM = 72 / 25.4;
const QR_MODULE = 0.55 * MM;
const QR_SIDE = 60 * MM;
const QR_GAP = 14; // pt between the music and the QR block

/** Side (pt) of a QR code of `size` modules with its quiet zone, and the module (pt). */
export function qrBox(size) {
  const module = Math.min(QR_MODULE, QR_SIDE / (size + 8));
  return { module, side: module * (size + 8) };
}

/**
 * The score as a PDF (Uint8Array), on A4 pages. `attachments` [{name, mime, data, description}]
 * go inside the PDF; `qr` {qr (io/qr.js), lines: [title, text…]} is drawn at the foot of the
 * last page, in space kept free for it, with the lines beside it.
 */
export function scorePdf(model, { VF = window.Vex.Flow, footer = t('score.footer'), scale, attachments = [], qr = null } = {}) {
  const doc = createPdf({ title: model.title });
  for (const a of attachments) doc.attach(a);
  const box = qr ? qrBox(qr.qr.size) : null;
  const reserve = box ? box.side + QR_GAP : 0;
  const s = scale ?? pdfScale(model, reserve);
  const { lay, usable, pages } = paginate(model, s, reserve);
  const several = pages.length > 1;
  // spread the lines down the page when it is mostly full, or to fill every page of a longer piece
  const tops = pages.map(({ first, end, fill }) => {
    const lines = end - first;
    const start = first === 0 ? lay.titleH : 0;
    const extra = lines > 1 && (several || fill > 0.8) ? Math.min(((1 - fill) * usable) / (lines - 1), lay.sysH * 0.5) : 0;
    return Array.from({ length: lines }, (_, i) => start + i * (lay.sysH + extra));
  });

  const colors = { ink: '#000', muted: '#444' };
  const ctxs = pages.map((pg, pi) => {
    const ctx = doc.addPage({ scale: s });
    ctx.translate(MARGIN_X / s, MARGIN_TOP / s);
    if (pi === 0) drawTitle(ctx, model, lay.W, 0, colors);
    return ctx;
  });
  const where = {};
  pages.forEach(({ first }, pi) => tops[pi].forEach((top, i) => (where[first + i] = { ctx: ctxs[pi], top })));
  drawSystems(VF, model, lay, lay.systems.map((_, i) => i), (si) => where[si], colors);

  // page numbers and the footer, the same size whatever the staff size
  ctxs.forEach((ctx, pi) => {
    ctx.save();
    ctx.setFillStyle('#555');
    ctx.setFont('Georgia, serif', (9 * PDF_SCALE) / s, 'normal', 'italic');
    const foot = several ? `${pi + 1} / ${pages.length}` : '';
    const y = (A4.height - MARGIN_TOP - 22) / s;
    if (foot) ctx.fillText(foot, (lay.W - ctx.measureText(foot).width) / 2, y);
    if (pi === 0 && footer) ctx.fillText(footer, lay.W - ctx.measureText(footer).width, y);
    ctx.restore();
  });
  if (qr) drawQrBlock(ctxs[ctxs.length - 1], qr, box, { s, right: lay.W, bottom: usable });
  return { bytes: doc.toBytes(), pages: pages.length, scale: s, qrSide: box ? box.side : 0 };
}

/** The QR code at the bottom right of the page, its lines of text to the left of it. */
function drawQrBlock(ctx, { qr, lines = [] }, { module, side }, { s, right, bottom }) {
  const m = module / s;
  const w = side / s;
  const x0 = right - w;
  const y0 = bottom - w;
  ctx.save();
  // the light quiet zone is the page itself; the dark modules in one path, a rectangle per run
  ctx.setFillStyle('#000');
  ctx.beginPath();
  for (const r of qrRuns(qr)) ctx.rect(x0 + (4 + r.x) * m, y0 + (4 + r.y) * m, r.w * m, m);
  ctx.fill();
  // the text, wrapped to the room left of the symbol, aligned with its bottom
  const width = x0 - 12 / s;
  const size = (8 * PDF_SCALE) / s;
  const rows = [];
  lines.forEach((text, i) => {
    ctx.setFont('Georgia, serif', i ? size : size * 1.15, i ? 'normal' : 'bold', i ? 'italic' : 'normal');
    for (const row of wrap(ctx, text, width)) rows.push({ row, font: ctx.getFont(), h: (i ? size : size * 1.15) * 1.35 });
    rows.push({ row: '', h: size * 0.5 });
  });
  rows.pop();
  let y = bottom - 4 * m - rows.reduce((a, r) => a + r.h, 0) + rows[0].h * 0.8;
  ctx.setFillStyle('#333');
  for (const r of rows) {
    if (r.row) {
      ctx.setFont(r.font);
      ctx.fillText(r.row, 0, y);
    }
    y += r.h;
  }
  ctx.restore();
}

/** Words of `text` in lines no wider than `width` in the current font. */
function wrap(ctx, text, width) {
  const out = [];
  let line = '';
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}
