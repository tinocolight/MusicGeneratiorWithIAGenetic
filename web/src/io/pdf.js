// A small vector PDF writer and a drawing context with the interface VexFlow draws with (the
// canvas-like RenderContext), so the same engraving code that draws the score in the page writes
// it into a PDF: notes, beams and the music font's glyphs as vector paths, text in the standard
// PDF fonts (Times, Helvetica), which every reader has, so nothing is embedded.
//
//   const doc = createPdf({ title });
//   const ctx = doc.addPage();          // A4 portrait, units: points, origin at the top left
//   ctx.moveTo(...); ctx.fillText(...); // or hand ctx to VexFlow
//   doc.attach({ name, mime, data });    // a file inside the PDF (embedded file, ISO 32000 7.11.4)
//   const bytes = doc.toBytes();        // Uint8Array
//   readPdfAttachments(bytes)           // the attached files back (async)

import FONT_WIDTHS from '../data/pdf-fonts.js';

export const A4 = { width: 595.28, height: 841.89 };

// WinAnsi (cp1252) codes 0x80-0x9F; 0xA0-0xFF are Latin-1
const CP1252 = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
  0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91,
  0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98,
  0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
};
/** Text as WinAnsi codes; characters outside it become similar ones or '?'. */
export function winAnsi(text) {
  const out = [];
  for (const ch of String(text).normalize('NFC')) {
    const c = ch.codePointAt(0);
    if (c >= 32 && c < 127) out.push(c);
    else if (c >= 0xa0 && c <= 0xff) out.push(c);
    else if (CP1252[c]) out.push(CP1252[c]);
    else if (c === 0x2212) out.push(0x2d); // minus
    else if (c === 0x2192) out.push(0x3e); // arrow
    else out.push(0x3f);
  }
  return out;
}

const FONTS = ['Times-Roman', 'Times-Italic', 'Times-Bold', 'Helvetica', 'Helvetica-Bold'];

/** CSS-like font -> one of the standard PDF fonts. */
export function pdfFontName(family = '', weight = 'normal', style = 'normal') {
  const f = String(family).toLowerCase();
  const serif = /georgia|times|serif|garamond|fell|petaluma/.test(f) && !/sans/.test(f);
  const bold = /bold|[6-9]00/.test(String(weight));
  const italic = /italic|oblique/.test(String(style));
  if (serif) return bold ? 'Times-Bold' : italic ? 'Times-Italic' : 'Times-Roman';
  return bold ? 'Helvetica-Bold' : 'Helvetica';
}

/** Width of `text` in `font` at `size` (same units as size). */
export function textWidth(text, font, size) {
  const w = FONT_WIDTHS[font] ?? FONT_WIDTHS.Helvetica;
  let sum = 0;
  for (const c of winAnsi(text)) sum += w[c - 32] ?? 500;
  return (sum * size) / 1000;
}

const NAMED = { black: [0, 0, 0], white: [1, 1, 1], red: [1, 0, 0], gray: [0.5, 0.5, 0.5], grey: [0.5, 0.5, 0.5] };
/** CSS colour -> [r, g, b] in 0..1, or null for none/transparent. */
export function parseColor(c) {
  if (c === undefined || c === null) return [0, 0, 0];
  const s = String(c).trim().toLowerCase();
  if (!s || s === 'none' || s === 'transparent') return null;
  if (NAMED[s]) return NAMED[s];
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map((x) => x + x).join('');
    if (h.length === 8 && parseInt(h.slice(6, 8), 16) === 0) return null;
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  }
  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const v = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (v.length > 3 && v[3] === 0) return null;
    return v.slice(0, 3).map((x) => Math.max(0, Math.min(1, x / 255)));
  }
  return [0, 0, 0];
}

const num = (x) => {
  const r = Math.round(x * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
};
const pdfString = (codes) => {
  let s = '(';
  for (const c of codes) {
    if (c === 0x28 || c === 0x29 || c === 0x5c) s += `\\${String.fromCharCode(c)}`;
    else s += String.fromCharCode(c);
  }
  return `${s})`;
};

/** Parse a VexFlow/CSS font: setFont(family, size, weight, style) or setFont('italic 12pt Georgia'). */
function parseFont(f, size, weight, style) {
  if (f && typeof f === 'object') return parseFont(f.family, f.size, f.weight, f.style);
  let family = f ?? 'Arial';
  if (typeof f === 'string' && size === undefined) {
    const m = f.match(/^\s*((?:(?:italic|oblique|normal|bold|bolder|lighter|[1-9]00)\s+)*)([\d.]+)(pt|px)?\s+(.+)$/i);
    if (m) {
      const words = m[1].toLowerCase();
      style = /italic|oblique/.test(words) ? 'italic' : 'normal';
      weight = /bold|[6-9]00/.test(words) ? 'bold' : 'normal';
      size = m[3] === 'px' ? `${m[2]}px` : Number(m[2]);
      family = m[4];
    }
  }
  // VexFlow sizes are points (the SVG gets font-size="12pt"); the drawing units here are CSS px
  let px = 13.33;
  if (typeof size === 'number' && Number.isFinite(size)) px = (size * 4) / 3;
  else if (typeof size === 'string') {
    const m = size.match(/([\d.]+)\s*(pt|px|em)?/);
    if (m) px = m[2] === 'px' ? Number(m[1]) : m[2] === 'em' ? Number(m[1]) * 16 : (Number(m[1]) * 4) / 3;
  }
  return { family, size: px, weight: weight ?? 'normal', style: style ?? 'normal', pdf: pdfFontName(family, weight, style) };
}

/**
 * Drawing context for one page. Coordinates: CSS px from the top-left corner of the page, as
 * VexFlow uses them; `scale` pt per px (the page is drawn at that scale).
 */
class PdfContext {
  constructor(page) {
    this.page = page;
    this.ops = page.ops;
    this.path = [];
    this.pen = { x: 0, y: 0 };
    this.start = { x: 0, y: 0 };
    this.state = { fill: [0, 0, 0], stroke: [0, 0, 0], lineWidth: 1, font: parseFont('Arial', 10) };
    this.stack = [];
    this.width = page.width;
    this.height = page.height;
  }

  // --- state
  save() {
    this.stack.push({ ...this.state });
    this.ops.push('q');
    return this;
  }
  restore() {
    const s = this.stack.pop();
    if (s) {
      this.state = s;
      this.ops.push('Q');
    }
    return this;
  }
  setFillStyle(c) {
    this.state.fill = parseColor(c);
    return this;
  }
  setBackgroundFillStyle() {
    return this;
  }
  setStrokeStyle(c) {
    this.state.stroke = parseColor(c);
    return this;
  }
  set fillStyle(c) {
    this.setFillStyle(c);
  }
  get fillStyle() {
    return this.state.fill;
  }
  set strokeStyle(c) {
    this.setStrokeStyle(c);
  }
  get strokeStyle() {
    return this.state.stroke;
  }
  setShadowColor() {
    return this;
  }
  setShadowBlur() {
    return this;
  }
  setLineWidth(w) {
    this.state.lineWidth = w;
    this.ops.push(`${num(w)} w`);
    return this;
  }
  setLineCap(cap) {
    this.ops.push(`${{ butt: 0, round: 1, square: 2 }[cap] ?? 0} J`);
    return this;
  }
  setLineDash(dash) {
    this.ops.push(`[${(dash || []).map(num).join(' ')}] 0 d`);
    return this;
  }
  scale(x, y) {
    this.ops.push(`${num(x)} 0 0 ${num(y)} 0 0 cm`);
    return this;
  }
  translate(x, y) {
    this.ops.push(`1 0 0 1 ${num(x)} ${num(y)} cm`);
    return this;
  }
  resize() {
    return this;
  }
  setViewBox() {
    return this;
  }
  clear() {
    return this;
  }

  // --- groups (VexFlow keeps SVG elements for them; a PDF has nothing to keep)
  openGroup() {
    return { classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, style: {} };
  }
  closeGroup() {}
  add() {}

  // --- paths (canvas semantics: the path stays until beginPath, fill and stroke both use it)
  beginPath() {
    this.path = [];
    return this;
  }
  moveTo(x, y) {
    this.path.push(`${num(x)} ${num(y)} m`);
    this.pen = { x, y };
    this.start = { x, y };
    return this;
  }
  lineTo(x, y) {
    this.path.push(`${num(x)} ${num(y)} l`);
    this.pen = { x, y };
    return this;
  }
  bezierCurveTo(x1, y1, x2, y2, x, y) {
    this.path.push(`${num(x1)} ${num(y1)} ${num(x2)} ${num(y2)} ${num(x)} ${num(y)} c`);
    this.pen = { x, y };
    return this;
  }
  quadraticCurveTo(cx, cy, x, y) {
    const p = this.pen;
    const c1x = p.x + ((cx - p.x) * 2) / 3;
    const c1y = p.y + ((cy - p.y) * 2) / 3;
    const c2x = x + ((cx - x) * 2) / 3;
    const c2y = y + ((cy - y) * 2) / 3;
    return this.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
  }
  arc(x, y, r, a0, a1, ccw = false) {
    let d = a1 - a0;
    if (!ccw && d < 0) d += 2 * Math.PI;
    if (ccw && d > 0) d -= 2 * Math.PI;
    if (Math.abs(d) > 2 * Math.PI) d = Math.sign(d) * 2 * Math.PI;
    const n = Math.max(1, Math.ceil(Math.abs(d) / (Math.PI / 2)));
    const step = d / n;
    const sx = x + r * Math.cos(a0);
    const sy = y + r * Math.sin(a0);
    if (this.path.length) this.lineTo(sx, sy);
    else this.moveTo(sx, sy);
    const k = (4 / 3) * Math.tan(step / 4);
    for (let i = 0; i < n; i++) {
      const t0 = a0 + i * step;
      const t1 = t0 + step;
      const [c0, s0, c1, s1] = [Math.cos(t0), Math.sin(t0), Math.cos(t1), Math.sin(t1)];
      this.bezierCurveTo(x + r * (c0 - k * s0), y + r * (s0 + k * c0), x + r * (c1 + k * s1), y + r * (s1 - k * c1), x + r * c1, y + r * s1);
    }
    return this;
  }
  closePath() {
    this.path.push('h');
    this.pen = { ...this.start };
    return this;
  }
  rect(x, y, w, h) {
    this.path.push(`${num(x)} ${num(y)} ${num(w)} ${num(h)} re`);
    return this;
  }
  fill() {
    const c = this.state.fill;
    if (c && this.path.length) this.ops.push(`${c.map(num).join(' ')} rg`, ...this.path, 'f');
    return this;
  }
  stroke() {
    const c = this.state.stroke;
    if (c && this.path.length) this.ops.push(`${c.map(num).join(' ')} RG`, ...this.path, 'S');
    return this;
  }
  fillRect(x, y, w, h) {
    const c = this.state.fill;
    if (c) this.ops.push(`${c.map(num).join(' ')} rg`, `${num(x)} ${num(y)} ${num(w)} ${num(h)} re`, 'f');
    return this;
  }
  clearRect() {
    return this;
  }
  pointerRect() {
    return this;
  }

  // --- text
  setFont(f, size, weight, style) {
    this.state.font = parseFont(f, size, weight, style);
    return this;
  }
  setRawFont(f) {
    return this.setFont(f);
  }
  getFont() {
    const f = this.state.font;
    return `${f.style} ${f.weight} ${f.size}px ${f.family}`;
  }
  set font(f) {
    this.setFont(f);
  }
  get font() {
    return this.getFont();
  }
  measureText(text) {
    const f = this.state.font;
    const width = textWidth(text, f.pdf, f.size);
    return { x: 0, y: -0.8 * f.size, width, height: f.size };
  }
  fillText(text, x, y) {
    const f = this.state.font;
    const c = this.state.fill;
    if (!c || text === undefined || text === null || text === '') return this;
    this.page.fonts.add(f.pdf);
    // the page is flipped (y down); the text matrix flips the glyphs back up
    this.ops.push('BT', `${c.map(num).join(' ')} rg`, `/${fontKey(f.pdf)} ${num(f.size)} Tf`, `1 0 0 -1 ${num(x)} ${num(y)} Tm`, `${pdfString(winAnsi(text))} Tj`, 'ET');
    return this;
  }
}

const fontKey = (name) => `F${FONTS.indexOf(name) + 1}`;

/** A PDF document; pages are A4 portrait unless given. */
export function createPdf({ title = '', author = 'Ondas Atratoras', size = A4 } = {}) {
  const pages = [];
  const files = [];
  return {
    pages,
    /**
     * Attach a file (Uint8Array): it is listed in the reader's attachments panel and can be
     * saved from there; `relationship` as in PDF/A-3 (Source: the file the document was made from).
     */
    attach({ name, mime = 'application/octet-stream', data, description = '', relationship = 'Source' }) {
      files.push({ name, mime, data, description, relationship });
    },
    /** New page; returns a drawing context in px units scaled by `scale` pt/px, origin top left. */
    addPage({ scale = 1, width = size.width, height = size.height } = {}) {
      const page = { width, height, ops: [], fonts: new Set() };
      // PDF y goes up: flip it once so that everything above can use screen coordinates
      page.ops.push(`1 0 0 -1 0 ${num(height)} cm`, `${num(scale)} 0 0 ${num(scale)} 0 0 cm`);
      pages.push(page);
      const ctx = new PdfContext(page);
      ctx.width = width / scale;
      ctx.height = height / scale;
      return ctx;
    },
    toBytes() {
      const objects = [];
      const add = (body) => {
        objects.push(body);
        return objects.length; // object number
      };
      const catalogId = add(null);
      const pagesId = add(null);
      const fontIds = Object.fromEntries(FONTS.map((f) => [f, add(`<< /Type /Font /Subtype /Type1 /BaseFont /${f} /Encoding /WinAnsiEncoding >>`)]));
      const fontDict = `<< ${FONTS.map((f) => `/${fontKey(f)} ${fontIds[f]} 0 R`).join(' ')} >>`;
      const pageIds = [];
      for (const pg of pages) {
        const content = pg.ops.join('\n');
        const contentId = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
        pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${num(pg.width)} ${num(pg.height)}] /Resources << /Font ${fontDict} >> /Contents ${contentId} 0 R >>`));
      }
      // attached files: an embedded file stream and its file specification, named in the catalog
      const specs = files.map((f) => {
        const date = pdfDate(new Date());
        const sub = f.mime.replace(/\//g, '#2F');
        const fileId = add(`<< /Type /EmbeddedFile /Subtype /${sub} /Length ${f.data.length} /Params << /Size ${f.data.length} /ModDate ${date} >> >>\nstream\n${latin1(f.data)}\nendstream`);
        const name = pdfString(winAnsi(f.name));
        return { name, id: add(`<< /Type /Filespec /F ${name} /UF ${name} /Desc ${pdfString(winAnsi(f.description))} /AFRelationship /${f.relationship} /EF << /F ${fileId} 0 R /UF ${fileId} 0 R >> >>`) };
      });
      specs.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)); // a name tree is sorted
      const names = specs.length ? ` /Names << /EmbeddedFiles << /Names [${specs.map((x) => `${x.name} ${x.id} 0 R`).join(' ')}] >> >> /AF [${specs.map((x) => `${x.id} 0 R`).join(' ')}]` : '';
      objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R${names} >>`;
      objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((i) => `${i} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
      const infoId = add(`<< /Title ${pdfString(winAnsi(title))} /Author ${pdfString(winAnsi(author))} /Producer (Ondas Atratoras) >>`);
      let out = `%PDF-${files.length ? '1.7' : '1.4'}\n%\xe2\xe3\xcf\xd3\n`;
      const offsets = [];
      objects.forEach((body, i) => {
        offsets.push(out.length);
        out += `${i + 1} 0 obj\n${body}\nendobj\n`;
      });
      const xref = out.length;
      out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
      for (const o of offsets) out += `${String(o).padStart(10, '0')} 00000 n \n`;
      out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
      const bytes = new Uint8Array(out.length);
      for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
      return bytes;
    },
  };
}

/** Bytes as a string of the same char codes (the PDF is assembled as such a string). */
function latin1(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return s;
}
const pdfDate = (d) => `(D:${d.toISOString().replace(/[-:T]/g, '').slice(0, 14)}Z)`;

/**
 * The files attached to a PDF: [{name, data}]. Reads the embedded file streams of the PDFs this
 * page writes and of PDFs saved again by other programs (a length given as a reference, the
 * FlateDecode filter); encrypted PDFs are not read.
 */
export async function readPdfAttachments(bytes) {
  const text = latin1(bytes);
  const objects = new Map();
  for (const m of text.matchAll(/(?:^|[\r\n\s])(\d+)\s+\d+\s+obj\b/g)) objects.set(Number(m[1]), m.index + m[0].length);
  const bodyOf = (n) => {
    const at = objects.get(n);
    if (at === undefined) return '';
    const end = text.indexOf('endobj', at);
    return text.slice(at, end < 0 ? undefined : end);
  };
  // file specifications name the embedded file streams (/EF << /F n 0 R >>)
  const names = new Map();
  for (const n of objects.keys()) {
    const body = bodyOf(n);
    const ef = /\/EF\s*<<[^>]*?\/(?:UF|F)\s+(\d+)\s+\d+\s+R/.exec(body);
    if (!ef) continue;
    const nm = /\/UF\s*\(((?:\\.|[^\\)])*)\)/.exec(body) || /\/F\s*\(((?:\\.|[^\\)])*)\)/.exec(body);
    names.set(Number(ef[1]), nm ? nm[1].replace(/\\(.)/g, '$1') : `file-${ef[1]}`);
  }
  const out = [];
  for (const [n, at] of objects) {
    const head = text.slice(at, at + 2000);
    const st = /stream\r?\n/.exec(head);
    const dict = st ? head.slice(0, st.index) : '';
    if (!st || dict.includes('endobj') || !/\/Type\s*\/EmbeddedFile\b/.test(dict)) continue;
    const start = at + st.index + st[0].length;
    let len = -1;
    const ref = /\/Length\s+(\d+)\s+\d+\s+R/.exec(dict);
    if (ref) {
      const v = /^\s*(\d+)/.exec(bodyOf(Number(ref[1])));
      if (v) len = Number(v[1]);
    } else {
      const v = /\/Length\s+(\d+)/.exec(dict);
      if (v) len = Number(v[1]);
    }
    if (len < 0) len = Math.max(0, text.indexOf('endstream', start) - start);
    let data = bytes.slice(start, start + len);
    if (/\/Filter\s*(?:\[\s*)?\/FlateDecode/.test(dict)) data = await inflateBytes(data);
    out.push({ name: names.get(n) ?? `file-${n}`, data });
  }
  return out;
}

async function inflateBytes(bytes) {
  const res = new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')));
  return new Uint8Array(await res.arrayBuffer());
}
