// Generational GA that can run either like the original program (GeneticSharp defaults)
// or with tournament selection + musically meaningful operators.
//
// strategy "geneticsharp": EliteSelection picks all MinSize parents ordered by fitness,
//   consecutive pairs are crossed with probability 0.75, children mutate with
//   MutationProbability, ElitistReinsertion fills the population with the best parents.
// strategy "tournament": k-tournament selection, E elites copied, crossover + mutation.
//
// The GA is a stepper (step(n) runs n generations) so the browser can run it in slices
// without blocking the UI, and Node can run it synchronously for the benchmarks.

import {
  decodeByte, randomClassicGenome, uniformBitCrossover, partialShuffleBits,
  randomMusicalGenome, musicalMutate, beatCrossover,
} from './operators.js';

export function createGA(cfg) {
  const {
    fitness, rng, length, env,
    popSize = 60,
    generations = 1000,
    strategy = 'geneticsharp',
    operators = 'binary',
    mutationRate = operators === 'binary' ? 0.1 : 0.9,
    crossoverRate = 0.75,
    elitism = 2,
    tournament = 3,
    immigrants = operators === 'binary' ? 0 : 0.04,
    init = null,
  } = cfg;

  const decode = operators === 'binary' ? (g) => g.map(decodeByte) : (g) => g;
  const newGenome = init
    ? () => init(rng)
    : operators === 'binary'
      ? () => randomClassicGenome(length, rng)
      : () => randomMusicalGenome(env, rng);

  let evaluationCount = 0;
  let generation = 0;
  let phase = null;
  const history = [];

  const ctx = () => ({ generation, maxGenerations: generations, evaluationCount });
  function evaluate(ind) {
    const res = fitness.evaluate(decode(ind.genes), ctx());
    evaluationCount++;
    ind.fitness = res.score;
    ind.parts = res.parts;
    return ind;
  }
  const make = (genes) => evaluate({ genes, fitness: -Infinity, parts: null });

  let population = Array.from({ length: popSize }, () => make(newGenome()));
  sortPop(population);
  let best = clone(population[0]);

  function mutateGenes(genes) {
    if (operators === 'binary') return partialShuffleBits(genes, rng);
    return musicalMutate(genes.slice(), env, rng);
  }

  function stepGeneticSharp() {
    const parents = population; // already sorted: Elite selection of MinSize = everyone
    const offspring = [];
    for (let i = 0; i + 1 < parents.length; i += 2) {
      if (rng.float() < crossoverRate) {
        if (operators === 'binary') {
          const [a, b] = uniformBitCrossover(parents[i].genes, parents[i + 1].genes, rng);
          offspring.push(a, b);
        } else {
          offspring.push(beatCrossover(parents[i].genes, parents[i + 1].genes, rng));
          offspring.push(beatCrossover(parents[i + 1].genes, parents[i].genes, rng));
        }
      }
    }
    const children = offspring.map((g) => make(rng.float() <= mutationRate ? mutateGenes(g) : g));
    const next = children.concat(parents.slice(0, Math.max(0, popSize - children.length)));
    return next.slice(0, popSize);
  }

  function pickTournament() {
    let bestInd = null;
    for (let k = 0; k < tournament; k++) {
      const c = population[rng.int(0, population.length - 1)];
      if (!bestInd || c.fitness > bestInd.fitness) bestInd = c;
    }
    return bestInd;
  }

  function stepTournament() {
    const next = population.slice(0, elitism);
    const nImm = Math.round(immigrants * popSize);
    for (let k = 0; k < nImm; k++) next.push(make(newGenome()));
    while (next.length < popSize) {
      const a = pickTournament();
      let genes;
      if (rng.float() < crossoverRate) {
        const b = pickTournament();
        genes = operators === 'binary' ? uniformBitCrossover(a.genes, b.genes, rng)[0] : beatCrossover(a.genes, b.genes, rng);
      } else genes = a.genes.slice();
      if (rng.float() < mutationRate) genes = mutateGenes(genes);
      next.push(make(genes));
    }
    return next;
  }

  function diversity() {
    // mean fraction of positions in which an individual differs from the best
    const ref = population[0].genes;
    let diff = 0;
    for (const ind of population) for (let i = 0; i < ref.length; i++) if (ind.genes[i] !== ref[i]) diff++;
    return diff / (population.length * ref.length);
  }

  function step(n = 1) {
    for (let s = 0; s < n && generation < generations; s++) {
      // a phase switch changes the fitness function: re-score the survivors
      const ph = fitness.phaseOf ? fitness.phaseOf(ctx()) : 1;
      if (phase !== null && ph !== phase) {
        population.forEach(evaluate);
        sortPop(population);
        best = clone(population[0]);
      }
      phase = ph;
      population = strategy === 'geneticsharp' ? stepGeneticSharp() : stepTournament();
      sortPop(population);
      generation++;
      if (population[0].fitness >= best.fitness || ph !== best.phase) {
        best = clone(population[0]);
        best.phase = ph;
      }
      if (generation % 5 === 0 || generation === generations) {
        let mean = 0;
        for (const ind of population) mean += Number.isFinite(ind.fitness) ? ind.fitness : 0;
        history.push({ generation, best: population[0].fitness, mean: mean / population.length, diversity: diversity() });
      }
    }
    return api;
  }

  const api = {
    step,
    decode,
    get generation() { return generation; },
    get done() { return generation >= generations; },
    get best() { return { ...best, decoded: decode(best.genes) }; },
    get population() { return population; },
    get evaluations() { return evaluationCount; },
    history,
  };
  return api;
}

function sortPop(pop) {
  pop.sort((a, b) => (b.fitness === a.fitness ? 0 : b.fitness > a.fitness ? 1 : -1));
}

const clone = (ind) => ({ genes: ind.genes.slice(), fitness: ind.fitness, parts: ind.parts, phase: ind.phase });
