// How do real melodies end? The original program meant to reward the usual ways in which songs
// resolve their last bars, but its ending rule only asks for a long last note. This tool learns
// the ending formulas from the 6758 melodies of data/corpus-large.json:
//   * the last three notes as degrees of the key (e.g. 3-2-1), with the size and direction of the
//     last move, separately for major and minor;
//   * where the last note falls in the bar and how long it lasts (4/4 melodies).
//   node tools/build_cadences.mjs
// Writes src/data/cadence-data.js, results/cadences.json and results/cadences.md.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { cadenceModel, cadenceLogP } from '../src/fitness/cadence.js';

const here = new URL('.', import.meta.url).pathname;
const corpus = JSON.parse(readFileSync(`${here}../data/corpus-large.json`, 'utf8')).melodies;
const mod = (a, n) => ((a % n) + n) % n;
const DEG = ['1', '♭2', '2', '♭3', '3', '4', '♯4', '5', '♭6', '6', '♭7', '7'];
const STYLE = { essen: 'Canções (Essen)', oneills: 'Danças irlandesas/escocesas', ryans: 'Danças irlandesas/escocesas', airds: 'Danças irlandesas/escocesas', 'bach-chorale': 'Corais (Bach)' };

function endingOf(m) {
  const notes = [];
  let t = 0;
  for (const [p, d] of m.events) {
    if (p >= 0) notes.push({ p, on: t, d });
    t += d;
  }
  if (notes.length < 3) return null;
  const [a, b, c] = notes.slice(-3);
  const rel = (n) => mod(n.p - m.tonic, 12);
  return {
    mode: m.mode, style: STYLE[m.source] ?? m.source, barLen: m.barLen,
    pcs: [rel(a), rel(b), rel(c)], // antepenultimate, penultimate, last
    last: Math.max(-12, Math.min(12, c.p - b.p)),
    pos: mod(c.on - m.pickup, m.barLen),
    dur: Math.min(16, c.d),
  };
}

const endings = corpus.map(endingOf).filter(Boolean);
const zeros = (n) => new Array(n).fill(0);
function tableCounts(mode) {
  const E = endings.filter((e) => e.mode === mode);
  const p1 = zeros(12);
  const p2 = Array.from({ length: 12 }, () => zeros(12));
  const p3 = {};
  const pint = Array.from({ length: 12 }, () => zeros(25));
  for (const e of E) {
    const [x, y, z] = e.pcs;
    p1[z]++;
    p2[z][y]++;
    (p3[z * 12 + y] ||= zeros(12))[x]++;
    pint[z][e.last + 12]++;
  }
  return { n: E.length, p1, p2, p3, pint };
}
// metric position and length of the last note, from the 4/4 melodies
const four = endings.filter((e) => e.barLen === 16);
const pos = zeros(16);
const dur = zeros(17);
for (const e of four) {
  pos[e.pos]++;
  dur[e.dur]++;
}
const counts = { major: tableCounts('major'), minor: tableCounts('minor'), pos, dur };
const data = cadenceModel(counts);

const lp = four.map((e) => cadenceLogP(data, e.mode, e.pcs, e.last, e.pos, e.dur)).sort((a, b) => a - b);
const q = (f) => lp[Math.floor(f * (lp.length - 1))];
counts.ref = data.ref = { p10: q(0.1), p50: q(0.5), p90: q(0.9) };

// ------------------------------------------------------------------ report: the formulas
const pct = (x) => `${(100 * x).toFixed(1).replace('.', ',')} %`;
function formulas(E, k = 12) {
  const c = new Map();
  for (const e of E) {
    const key = e.pcs.map((x) => DEG[x]).join('–');
    c.set(key, (c.get(key) || 0) + 1);
  }
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(([f, n]) => ({ formula: f, share: n / E.length }));
}
const styles = [...new Set(endings.map((e) => e.style))];
const report = {
  n: endings.length,
  finalDegree: Object.fromEntries(['major', 'minor'].map((m) => [m, data[m].p1.map((v, i) => [DEG[i], v]).sort((a, b) => b[1] - a[1]).slice(0, 5)])),
  formulas: Object.fromEntries(['major', 'minor'].map((m) => [m, formulas(endings.filter((e) => e.mode === m))])),
  byStyle: Object.fromEntries(styles.map((s) => [s, { n: endings.filter((e) => e.style === s).length, formulas: formulas(endings.filter((e) => e.style === s && e.mode === 'major'), 6) }])),
  pos: data.pos.map((v, i) => [i, v]).sort((a, b) => b[1] - a[1]).slice(0, 5),
  dur: data.dur.map((v, i) => [i, v]).sort((a, b) => b[1] - a[1]).slice(0, 6),
  lastMove: Object.fromEntries(['major'].map((m) => {
    const c = new Map();
    for (const e of endings.filter((x) => x.mode === m)) c.set(e.last, (c.get(e.last) || 0) + 1);
    return [m, [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => [k, n / endings.filter((x) => x.mode === m).length])];
  })),
  ref: data.ref,
};

mkdirSync(`${here}../results`, { recursive: true });
writeFileSync(`${here}../results/cadences.json`, JSON.stringify(report, null, 1));
const POS = ['1.º tempo', '', '', '', '2.º tempo', '', '', '', '3.º tempo', '', '', '', '4.º tempo'];
let md = `# Como acabam as melodias reais\n\nGerado por \`node tools/build_cadences.mjs\` a partir de ${endings.length} melodias (corpus grande, sem as 480 do crítico). Graus relativos à tónica da tonalidade estimada; as três últimas notas.\n\n`;
for (const m of ['major', 'minor']) {
  md += `## ${m === 'major' ? 'Maior' : 'Menor'} (${data[m].n} melodias)\n\nÚltima nota: ${report.finalDegree[m].map(([d, v]) => `${d} ${pct(v)}`).join(' · ')}\n\n| Fórmula (antepenúltima–penúltima–última) | Melodias |\n|---|---|\n`;
  for (const f of report.formulas[m]) md += `| ${f.formula} | ${pct(f.share)} |\n`;
  md += '\n';
}
md += `## Por estilo (maior)\n\n| Estilo | Fórmulas mais comuns |\n|---|---|\n`;
for (const [s, v] of Object.entries(report.byStyle)) md += `| ${s} (${v.n}) | ${v.formulas.map((f) => `${f.formula} ${pct(f.share)}`).join(' · ')} |\n`;
md += `\n## Ritmo da última nota (4/4, ${four.length} melodias)\n\n`;
md += `Onde começa: ${report.pos.map(([p, v]) => `${POS[p] || `semicolcheia ${p + 1}`} ${pct(v)}`).join(' · ')}\n\n`;
md += `Duração (semicolcheias): ${report.dur.map(([d, v]) => `${d === 16 ? '≥ 16' : d} ${pct(v)}`).join(' · ')}\n\n`;
md += `Último movimento (meios-tons, maior): ${report.lastMove.major.map(([k, v]) => `${k > 0 ? '+' : ''}${k} ${pct(v)}`).join(' · ')}\n\n`;
md += `Log-probabilidade de um final real: P10 ${data.ref.p10.toFixed(2)}, mediana ${data.ref.p50.toFixed(2)}, P90 ${data.ref.p90.toFixed(2)}.\n`;
writeFileSync(`${here}../results/cadences.md`, md);

writeFileSync(`${here}../src/data/cadence-data.js`, `// Generated by tools/build_cadences.mjs from data/corpus-large.json. Do not edit.
// How real melodies end: last three degrees (p1 last, p2 penultimate | last, p3 antepenultimate |
// last two), last move in semitones (pint | last degree), position and length of the last note.
// Raw counts: src/fitness/cadence.js smooths and normalises them.
export default ${JSON.stringify({ ...counts, ref: data.ref })};
`);
console.log(md);
