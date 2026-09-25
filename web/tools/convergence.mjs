// Convergence from a musical vs a fully random initial population (no predefined patterns).
//   node tools/convergence.mjs [seeds=4] [generations=2000]
// Writes results/convergence.json and results/convergence.md.
import { writeFileSync, mkdirSync } from 'node:fs';
import { createGA } from '../src/ga/ga.js';
import { createRng } from '../src/core/rng.js';
import { toEvents, eventsToCompact, STEPS_PER_BAR } from '../src/core/score.js';
import { loadCritic } from '../src/eval/critic.js';
import criticData from '../src/data/critic-data.js';
import { defaultConfig, applyEnsemble, autoConfigure, buildFitness } from '../src/ui/config.js';

const here = new URL('.', import.meta.url).pathname;
const SEEDS = Number(process.argv[2] || 4);
const GENS = Number(process.argv[3] || 2000);
const CHECKPOINTS = [0, 10, 50, 100, 300, 600, 1000, 1500, 2000].filter((g) => g <= GENS);
const critic = loadCritic(criticData);

// critic on the first 8 bars, like the corpus
function criticOf(genes) {
  const out = [];
  let t = 0;
  for (const [p, d] of eventsToCompact(toEvents(genes))) if (t < 128) (out.push([p, Math.min(d, 128 - t)]), (t += d));
  return critic.evaluate(out, { barLen: STEPS_PER_BAR }).humanLike;
}

const RUNS = [
  { ensemble: 'solo', label: 'Só a melodia' },
  { ensemble: 'telemann', label: '2 violinos (c. 2)' },
  { ensemble: 'trio', label: 'Trio' },
];
const INITS = [
  { id: 'auto', label: 'com padrões musicais' },
  { id: 'random', label: 'aleatória, sem padrões' },
];

const results = [];
const t0 = Date.now();
for (const run of RUNS) {
  for (const init of INITS) {
    const at = Object.fromEntries(CHECKPOINTS.map((g) => [g, { fitness: 0, critic: 0 }]));
    for (let s = 1; s <= SEEDS; s++) {
      const cfg = applyEnsemble(defaultConfig(), run.ensemble);
      if (run.ensemble !== 'solo') autoConfigure(cfg);
      cfg.ga.seed = s;
      const b = buildFitness(cfg);
      const ga = createGA({
        fitness: b.fit, rng: createRng(s), length: b.fit.length, env: b.env, generations: GENS,
        popSize: 80, mutationRate: 0.9, strategy: 'tournament', operators: 'musical', initMode: init.id,
      });
      const take = () => {
        if (!(ga.generation in at)) return;
        at[ga.generation].fitness += ga.best.fitness / SEEDS;
        at[ga.generation].critic += criticOf(ga.best.decoded) / SEEDS;
      };
      take();
      while (!ga.done) {
        ga.step(1);
        take();
      }
    }
    results.push({ run: run.label, init: init.label, at });
    console.error(`${run.ensemble}/${init.id} done (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
}

mkdirSync(`${here}../results`, { recursive: true });
writeFileSync(`${here}../results/convergence.json`, JSON.stringify({ seeds: SEEDS, generations: GENS, results }, null, 1));
const f = (x) => x.toFixed(2);
let md = `# Convergência a partir de uma população musical ou aleatória\n\nGerado por \`node tools/convergence.mjs ${SEEDS} ${GENS}\`. Melhor indivíduo em cada geração, média de ${SEEDS} sementes; configurações de «Auto-configurar» (a melodia só com a configuração por omissão). Crítico nos primeiros 8 compassos.\n\n`;
md += `| Conjunto | População inicial | ${CHECKPOINTS.map((g) => `g. ${g}`).join(' | ')} |\n|---|---|${CHECKPOINTS.map(() => '---').join('|')}|\n`;
for (const r of results) md += `| ${r.run} | ${r.init} | ${CHECKPOINTS.map((g) => `${f(r.at[g].fitness)} · ${f(r.at[g].critic)}`).join(' | ')} |\n`;
md += '\nCada célula: aptidão · crítico.\n';
writeFileSync(`${here}../results/convergence.md`, md);
console.log(md);
