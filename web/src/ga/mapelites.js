// MAP-Elites (Mouret & Clune 2015, "Illuminating search spaces by mapping elites").
//
// A plain GA with elitist selection converges to one melody (the original program keeps the
// single best chromosome), so the "variations" it offers are few and similar. MAP-Elites keeps
// the best melody for every cell of a grid of *behaviour descriptors* — e.g. calm vs busy
// rhythm x stepwise vs leaping melody — and returns a whole map of good but different pieces.

import { toEvents } from '../core/score.js';
import { musicalMutate, beatCrossover, randomMusicalGenome } from './operators.js';

export const DESCRIPTORS = {
  density: {
    label: 'Notas por tempo',
    range: [0.5, 3],
    compute: (notes, length) => notes.length / (length / 4),
  },
  leaps: {
    label: 'Intervalo médio (semitons)',
    range: [0.5, 5],
    compute: (notes) => {
      let s = 0;
      for (let i = 1; i < notes.length; i++) s += Math.abs(notes[i].pitch - notes[i - 1].pitch);
      return notes.length > 1 ? s / (notes.length - 1) : 0;
    },
  },
  range: {
    label: 'Âmbito (semitons)',
    range: [4, 24],
    compute: (notes) => (notes.length ? Math.max(...notes.map((n) => n.pitch)) - Math.min(...notes.map((n) => n.pitch)) : 0),
  },
  register: {
    label: 'Altura média (MIDI)',
    range: [60, 80],
    compute: (notes) => notes.reduce((a, n) => a + n.pitch, 0) / Math.max(1, notes.length),
  },
};

export function createMapElites({ fitness, env, rng, x = 'density', y = 'leaps', bins = 8, initial = 120 }) {
  const dx = DESCRIPTORS[x];
  const dy = DESCRIPTORS[y];
  const cells = new Array(bins * bins).fill(null);
  let evaluations = 0;
  let insertions = 0;

  const binOf = (d, v) => Math.max(0, Math.min(bins - 1, Math.floor(((v - d.range[0]) / (d.range[1] - d.range[0])) * bins)));

  function place(genes) {
    const res = fitness.evaluate(genes);
    evaluations++;
    const notes = toEvents(genes).filter((e) => e.pitch !== null);
    const vx = dx.compute(notes, genes.length);
    const vy = dy.compute(notes, genes.length);
    const idx = binOf(dy, vy) * bins + binOf(dx, vx);
    const cur = cells[idx];
    if (!cur || res.score > cur.fitness) {
      cells[idx] = { genes, fitness: res.score, parts: res.parts, vx, vy, idx };
      insertions++;
      return true;
    }
    return false;
  }

  for (let i = 0; i < initial; i++) place(randomMusicalGenome(env, rng));

  const filled = () => cells.filter(Boolean);
  return {
    x,
    y,
    bins,
    cells,
    get evaluations() { return evaluations; },
    get insertions() { return insertions; },
    step(n = 100) {
      for (let i = 0; i < n; i++) {
        const pool = filled();
        const a = rng.pick(pool);
        let genes = a.genes.slice();
        if (pool.length > 1 && rng.chance(0.3)) genes = beatCrossover(genes, rng.pick(pool).genes, rng);
        genes = musicalMutate(genes, env, rng, 1.5);
        place(genes);
      }
    },
    coverage: () => filled().length / cells.length,
    qdScore: () => filled().reduce((a, c) => a + c.fitness, 0),
    best: () => filled().reduce((a, c) => (!a || c.fitness > a.fitness ? c : a), null),
  };
}
