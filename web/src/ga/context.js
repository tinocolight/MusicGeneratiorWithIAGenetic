// Variable-order context model: the probability of a symbol (a rhythmic figure, an interval...)
// given a chain of contexts from the most specific to the most general, each one blended with
// the next (interpolated smoothing):
//
//   P_k(y) = ( c_k(y) + (u_k + beta) * P_{k-1}(y) ) / ( n_k + u_k + beta )
//
// where n_k is how often the context was seen, c_k(y) how often y followed it and u_k how many
// different symbols followed it. With beta = 0 this is Witten-Bell smoothing, the escape method
// C of PPM (Cleary & Witten 1984; compared on melodies by Pearce & Wiggins 2004); beta adds a
// pseudo-count so that a context seen only a few times is not trusted too much (tuned by
// cross-validation in tools/build_meters.mjs). Below the most general context the probability is
// uniform over the V known symbols plus one for "something never seen".

/** Key of a context: the values of its features joined, e.g. "12|3|0" for (f2, f1, pos). */
export const contextKey = (names, f) => {
  let s = '';
  for (let i = 0; i < names.length; i++) s += (i ? '|' : '') + f[names[i]];
  return s;
};

export function createCounts(levels) {
  return { levels, rows: levels.map(() => new Map()) };
}

export function addCount(cm, f, y) {
  for (let i = 0; i < cm.levels.length; i++) {
    const k = contextKey(cm.levels[i], f);
    let r = cm.rows[i].get(k);
    if (!r) cm.rows[i].set(k, (r = { n: 0, u: 0, c: new Map() }));
    r.n++;
    const c = r.c.get(y) || 0;
    if (!c) r.u++;
    r.c.set(y, c + 1);
  }
}

/** P(y | f) with V known symbols. */
export function probOf(cm, f, y, V, beta) {
  let p = 1 / (V + 1);
  for (let i = cm.levels.length - 1; i >= 0; i--) {
    const r = cm.rows[i].get(contextKey(cm.levels[i], f));
    if (!r) continue;
    const a = r.u + beta;
    p = ((r.c.get(y) || 0) + a * p) / (r.n + a);
  }
  return p;
}

/** The whole distribution over the V known symbols (it sums to a little less than 1). */
export function distOf(cm, f, V, beta) {
  const p = new Float64Array(V).fill(1 / (V + 1));
  for (let i = cm.levels.length - 1; i >= 0; i--) {
    const r = cm.rows[i].get(contextKey(cm.levels[i], f));
    if (!r) continue;
    const a = r.u + beta;
    const z = r.n + a;
    for (let y = 0; y < V; y++) p[y] *= a / z;
    for (const [y, c] of r.c) if (y >= 0 && y < V) p[y] += c / z;
  }
  return p;
}

/** Which context of the chain decided most: the deepest one that was seen, with its counts. */
export function deepestContext(cm, f) {
  for (let i = 0; i < cm.levels.length; i++) {
    const r = cm.rows[i].get(contextKey(cm.levels[i], f));
    if (r) return { level: i, n: r.n, u: r.u };
  }
  return null;
}

/**
 * Tables for the browser: contexts seen fewer than `minN` times are left out (their weight in
 * the blend is small when beta is large), except in the two most general levels.
 */
export function countsToJSON(cm, minN = 1) {
  return {
    levels: cm.levels,
    rows: cm.rows.map((rows, i) => {
      const keep = i >= cm.levels.length - 2 ? 1 : minN;
      const out = {};
      for (const [k, r] of rows) if (r.n >= keep) out[k] = [r.n, r.u, [...r.c].sort((a, b) => b[1] - a[1]).flat()];
      return out;
    }),
  };
}

export function countsFromJSON(json) {
  return {
    levels: json.levels,
    rows: json.rows.map((obj) => {
      const m = new Map();
      for (const [k, [n, u, flat]] of Object.entries(obj)) {
        const c = new Map();
        for (let i = 0; i < flat.length; i += 2) c.set(flat[i], flat[i + 1]);
        m.set(k, { n, u, c });
      }
      return m;
    }),
  };
}
