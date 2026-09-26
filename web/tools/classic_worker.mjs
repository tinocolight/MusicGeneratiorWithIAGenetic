// Worker for tools/classic_study.mjs: runs the original GA with a parameter set and measures it.
import { parentPort } from 'node:worker_threads';
import { realStyles, styleStats, measure, runClassic } from './classic_lib.mjs';

const R = realStyles();
const stats = Object.fromEntries(Object.entries(R).map(([k, v]) => [k, styleStats(v.train)]));

parentPort.on('message', ({ id, params, seed, keep }) => {
  const r = runClassic(params, seed, { keep });
  parentPort.postMessage({ id, metrics: measure(r.best, stats), best: r.best, population: r.population });
});
