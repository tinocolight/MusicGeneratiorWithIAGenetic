// Which default for a single melody? The candidates of results/openings.md that keep the
// rules capped ("não maximizar"), with more seeds, and with the spread between seeds.
//   node tools/solo_defaults.mjs [seeds=24]
// Writes results/solo-defaults.md.
import { writeFileSync } from 'node:fs';
import { createGA } from '../src/ga/ga.js';
import { createRng } from '../src/core/rng.js';
import { toEvents, eventsToCompact } from '../src/core/score.js';
import { loadCritic } from '../src/eval/critic.js';
import criticData from '../src/data/critic-data.js';
import { dposOf } from '../src/ga/blocks.js';
import { defaultConfig, buildFitness } from '../src/ui/config.js';

const here = new URL('.', import.meta.url).pathname;
const SEEDS = Number(process.argv[2] || 24);
const critic = loadCritic(criticData);
const mod = (a, n) => ((a % n) + n) % n;
const VARIANTS = [
  ['Padrões musicais, sem idioma', (c) => ((c.ga.init = 'auto'), (c.weights.idiom = 0))],
  ['**Blocos do corpus, sem idioma** (omissão)', (c) => ((c.ga.init = 'blocks'), (c.weights.idiom = 0))],
  ['Blocos + idioma 0,75', (c) => ((c.ga.init = 'blocks'), (c.weights.idiom = 0.75))],
  ['Blocos + idioma 1,5', (c) => ((c.ga.init = 'blocks'), (c.weights.idiom = 1.5))],
];

const f2 = (x) => x.toFixed(2).replace('.', ',');
const f1 = (x) => x.toFixed(1).replace('.', ',');
let md = `# Melodia só: que omissão?\n\nGerado por \`node tools/solo_defaults.mjs ${SEEDS}\`. Configuração por omissão (arco de frase, 8 compassos, 600 gerações) com «não maximizar»; ${SEEDS} sementes; média ± desvio-padrão entre sementes. Crítico nos primeiros 8 compassos.\n\n`;
md += '| População inicial e regra «idioma» | Crítico | Típicas /26 | 1.ª nota tónica / dominante / mediante |\n|---|---|---|---|\n';
for (const [label, set] of VARIANTS) {
  const rows = [];
  for (let s = 1; s <= SEEDS; s++) {
    const cfg = defaultConfig();
    cfg.capRules = true;
    set(cfg);
    cfg.ga.seed = s;
    const b = buildFitness(cfg);
    const ga = createGA({
      fitness: b.fit, rng: createRng(s), length: b.fit.length, env: b.env, generations: cfg.ga.generations,
      popSize: 80, mutationRate: 0.9, strategy: 'tournament', operators: 'musical', initMode: cfg.ga.init,
    });
    ga.step(Infinity);
    const ev = toEvents(ga.best.decoded);
    const first = [];
    let t = 0;
    for (const [p, d] of eventsToCompact(ev)) if (t < 128) (first.push([p, Math.min(d, 128 - t)]), (t += d));
    const c = critic.evaluate(first, { barLen: 16 });
    rows.push({ critic: c.humanLike, typical: c.typicality * criticData.features.length, deg: mod(dposOf(ev.find((e) => e.pitch !== null).pitch, b.key), 7) });
  }
  const mean = (k) => rows.reduce((a, r) => a + r[k], 0) / rows.length;
  const sd = (k) => Math.sqrt(rows.reduce((a, r) => a + (r[k] - mean(k)) ** 2, 0) / (rows.length - 1));
  const deg = (d) => `${Math.round((100 * rows.filter((r) => r.deg === d).length) / rows.length)} %`;
  md += `| ${label} | ${f2(mean('critic'))} ± ${f2(sd('critic'))} | ${f1(mean('typical'))} ± ${f1(sd('typical'))} | ${deg(0)} / ${deg(4)} / ${deg(2)} |\n`;
  console.error(`${label} done`);
}
md += '\nA regra «idioma» na aptidão baixa o crítico à medida que o peso sobe, sem tornar as melodias mais típicas; os blocos na população inicial e na mutação dão ~2 características típicas a mais com o crítico praticamente igual. Por isso a omissão é «blocos, sem idioma», e o idioma fica disponível nos pesos.\n';
writeFileSync(`${here}../results/solo-defaults.md`, md);
console.log(md);
