// Critic: logistic regression that separates real melodies (Essen folksongs, O'Neill's Irish
// tunes, Bach chorale sopranos) from null-model "melodies" (white / brown / 1/f noise,
// shuffled real melodies), on the standardised features of metrics.js.
// It estimates how *human-like* a melody is; together with the corpus percentiles it gives
// an evaluation that is independent from the fitness rules used to generate the music.

import { melodyFeatures } from './metrics.js';
import { makeModel } from './ngram.js';

export const CRITIC_FEATURES = [
  'pitchVariety', 'pitchRange', 'keyCentred', 'nonScale', 'dissonantIntervals', 'contourDirection',
  'contourStability', 'stepMovement', 'leapReturns', 'climaxStrength', 'repeatedPitch', 'meanAbsInterval',
  'noteDensity', 'restRatio', 'rhythmicVariety', 'syncopation', 'repeatedIntervalPatterns',
  'repeatedRhythmPatterns', 'pcEntropy', 'intervalEntropy', 'lzComplexity', 'zipfPitch', 'zipfInterval',
  'spectralSlope', 'icPitch', 'icRhythm',
];

const sigmoid = (z) => 1 / (1 + Math.exp(-z));

export function standardize(rows, stats) {
  return rows.map((r) => stats.features.map((f, j) => {
    const v = r[f];
    return stats.sd[j] ? (v - stats.mean[j]) / stats.sd[j] : 0;
  }));
}

export function trainLogistic(X, y, { l2 = 0.05, iters = 3000, lr = 0.1 } = {}) {
  const d = X[0].length;
  const w = new Array(d).fill(0);
  let b = 0;
  const n = X.length;
  for (let it = 0; it < iters; it++) {
    const gw = new Array(d).fill(0);
    let gb = 0;
    for (let i = 0; i < n; i++) {
      let z = b;
      for (let j = 0; j < d; j++) z += w[j] * X[i][j];
      const e = sigmoid(z) - y[i];
      for (let j = 0; j < d; j++) gw[j] += e * X[i][j];
      gb += e;
    }
    for (let j = 0; j < d; j++) w[j] -= lr * (gw[j] / n + l2 * w[j]);
    b -= lr * (gb / n);
  }
  return { w, b };
}

export function predict(model, x) {
  let z = model.b;
  for (let j = 0; j < x.length; j++) z += model.w[j] * x[j];
  return sigmoid(z);
}

export function auc(scores, labels) {
  const pos = [];
  const neg = [];
  scores.forEach((s, i) => (labels[i] ? pos : neg).push(s));
  let wins = 0;
  for (const p of pos) for (const q of neg) wins += p > q ? 1 : p === q ? 0.5 : 0;
  return wins / (pos.length * neg.length);
}

/** Build an evaluator from the serialised critic (data/critic.json). */
export function loadCritic(json) {
  const model = makeModel(json.ngram);
  const stats = { features: json.features, mean: json.mean, sd: json.sd };
  return {
    json,
    features(compact, info) {
      return melodyFeatures(compact, info, model);
    },
    evaluate(compact, info = {}) {
      const f = melodyFeatures(compact, info, model);
      const x = standardize([f], stats)[0];
      const p = predict(json.logistic, x);
      // typicality: share of descriptors that fall between the 10th and 90th corpus percentiles
      let inside = 0;
      const perFeature = {};
      json.features.forEach((name, j) => {
        const [p10, p50, p90] = json.percentiles[j];
        const ok = f[name] >= p10 && f[name] <= p90;
        if (ok) inside++;
        perFeature[name] = { value: f[name], p10, p50, p90, ok, z: x[j] };
      });
      return { humanLike: p, typicality: inside / json.features.length, features: f, perFeature };
    },
  };
}
