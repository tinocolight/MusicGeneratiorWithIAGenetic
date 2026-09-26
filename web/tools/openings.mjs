// How varied are the beginnings of the generated melodies, and at what cost?
// Compares the default generator with the corpus building blocks (initial population,
// mutation, idiom rule) and with rules capped at their typical value in real music.
//   node tools/openings.mjs [seeds=8]
// Writes results/openings.json and results/openings.md.
import { writeFileSync, readFileSync } from 'node:fs';
import { createGA } from '../src/ga/ga.js';
import { createRng } from '../src/core/rng.js';
import { toEvents, eventsToCompact } from '../src/core/score.js';
import { loadCritic } from '../src/eval/critic.js';
import criticData from '../src/data/critic-data.js';
import { dposOf, genesToLine, lineToBeats } from '../src/ga/blocks.js';
import { defaultConfig, applyEnsemble, autoConfigure, buildFitness } from '../src/ui/config.js';

const here = new URL('.', import.meta.url).pathname;
const SEEDS = Number(process.argv[2] || 8);
const critic = loadCritic(criticData);
const mod = (a, n) => ((a % n) + n) % n;

const VARIANTS = [
  { id: 'default', label: 'Atual (padrões musicais)', set: () => {} },
  { id: 'caps', label: 'Não maximizar (regras até ao P75 real)', set: (c) => (c.capRules = true) },
  { id: 'blocks', label: 'Blocos do corpus (população + mutação)', set: (c) => (c.ga.init = 'blocks') },
  { id: 'blocks-idiom', label: 'Blocos + regra «idioma»', set: (c) => ((c.ga.init = 'blocks'), (c.weights.idiom = 3)) },
  { id: 'blocks-idiom-caps', label: 'Blocos + idioma + não maximizar', set: (c) => ((c.ga.init = 'blocks'), (c.weights.idiom = 3), (c.capRules = true)) },
  { id: 'caps-idiom15', label: 'Não maximizar + idioma 1,5 (população musical)', set: (c) => ((c.weights.idiom = 1.5), (c.capRules = true)) },
  { id: 'caps-blocks', label: 'Não maximizar + população de blocos (sem idioma)', set: (c) => ((c.ga.init = 'blocks'), (c.capRules = true)) },
  { id: 'caps-blocks-idiom15', label: 'Não maximizar + blocos + idioma 1,5', set: (c) => ((c.ga.init = 'blocks'), (c.weights.idiom = 1.5), (c.capRules = true)) },
].filter((v) => !process.argv[3] || process.argv[3].split(',').includes(v.id));
const ENSEMBLES = [['solo', 'Melodia'], ['telemann', '2 violinos em cânone']];

// the pattern described by the user: long first note, rest, the same note, a lower note, back
function userPattern(ev) {
  const e = ev.filter((x) => x.start < 32);
  for (let i = 0; i + 4 < e.length; i++) {
    const [a, r, b, c, d] = e.slice(i, i + 5);
    if (a.pitch !== null && a.dur >= 4 && r.pitch === null && b.pitch === a.pitch && c.pitch !== null && c.pitch < b.pitch && d.pitch === b.pitch) return true;
  }
  return false;
}

const results = [];
for (const [ens, ensLabel] of ENSEMBLES) {
  for (const v of VARIANTS) {
    const rows = [];
    for (let s = 1; s <= SEEDS; s++) {
      const cfg = applyEnsemble(defaultConfig(), ens);
      if (ens !== 'solo') autoConfigure(cfg);
      v.set(cfg);
      cfg.ga.seed = s;
      const b = buildFitness(cfg);
      const ga = createGA({
        fitness: b.fit, rng: createRng(s), length: b.fit.length, env: b.env, generations: cfg.ga.generations,
        popSize: 80, mutationRate: 0.9, strategy: 'tournament', operators: 'musical', initMode: cfg.ga.init,
      });
      ga.step(Infinity);
      const genes = ga.best.decoded;
      const ev = toEvents(genes);
      const first = [];
      let t = 0;
      for (const [p, d] of eventsToCompact(ev)) if (t < 128) (first.push([p, Math.min(d, 128 - t)]), (t += d));
      const crit = critic.evaluate(first, { barLen: 16 });
      const line = genesToLine(genes);
      const beats = lineToBeats(line.pitch, line.onset, { barLen: 16, key: b.key });
      const fb = beats.slice(0, 4).map((x) => x.id).join(' ');
      const n0 = ev.find((e) => e.pitch !== null);
      rows.push({ critic: crit.humanLike, typical: crit.typicality * criticData.features.length, firstDeg: mod(dposOf(n0.pitch, b.key), 7), firstBar: fb, user: userPattern(ev), rests: crit.features.restRatio });
    }
    const mean = (k) => rows.reduce((a, r) => a + r[k], 0) / rows.length;
    const deg = (d) => rows.filter((r) => r.firstDeg === d).length / rows.length;
    results.push({
      ensemble: ensLabel, id: v.id, label: v.label,
      critic: mean('critic'), typical: mean('typical'), rests: mean('rests'),
      tonic: deg(0), dominant: deg(4), mediant: deg(2),
      distinctFirstBars: new Set(rows.map((r) => r.firstBar)).size / rows.length,
      userPattern: rows.filter((r) => r.user).length / rows.length,
    });
    console.error(`${ens}/${v.id} done`);
  }
}
const large = JSON.parse(readFileSync(`${here}../results/blocks.json`, 'utf8'));
const tot = Object.values(large.firstDeg).reduce((a, b) => a + b, 0);
const pct = (x) => `${Math.round(x * 100)} %`;
let md = `# Inícios das melodias geradas\n\nGerado por \`node tools/openings.mjs ${SEEDS}\` (${SEEDS} sementes por linha, configuração por omissão e «Auto-configurar» para o cânone). Primeiros compassos distintos = fração de sementes com um 1.º compasso (ritmo + contorno) diferente de todos os outros.\n\nReferência, ${large.melodies} melodias reais: 1.ª nota na tónica ${pct(large.firstDeg[0] / tot)}, na dominante ${pct(large.firstDeg[4] / tot)}, na mediante ${pct(large.firstDeg[2] / tot)}.\n\n`;
md += '| Conjunto | Variante | Crítico | Típicas /26 | Pausas | 1.ª nota tónica / dominante / mediante | 1.os compassos distintos | Padrão «nota longa, pausa, mesma, abaixo, mesma» |\n|---|---|---|---|---|---|---|---|\n';
for (const r of results) md += `| ${r.ensemble} | ${r.label} | ${r.critic.toFixed(2)} | ${r.typical.toFixed(1)} | ${pct(r.rests)} | ${pct(r.tonic)} / ${pct(r.dominant)} / ${pct(r.mediant)} | ${pct(r.distinctFirstBars)} | ${pct(r.userPattern)} |\n`;
if (!process.argv[3]) writeFileSync(`${here}../results/openings.json`, JSON.stringify({ seeds: SEEDS, results }, null, 1));
if (!process.argv[3]) writeFileSync(`${here}../results/openings.md`, md);
console.log(md);
