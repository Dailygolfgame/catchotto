// Simulated human players. A board is hard when none of them gets close to Perfect.
import { createRequire } from 'node:module';
const C = createRequire(import.meta.url)('../engine.js');
const N = 8, S = 64;

function bfs(block, from) {
  const d = new Int8Array(S).fill(-1); d[from] = 0; const q = [from];
  for (let h = 0; h < q.length; h++) for (const j of C.neighbours(block, q[h])) if (d[j] < 0) { d[j] = d[q[h]] + 1; q.push(j); }
  return d;
}
const manhattan = (a, b) => Math.abs((a >> 3) - (b >> 3)) + Math.abs((a & 7) - (b & 7));
// Squares Otto reaches strictly before you: his room to run.
function territory(block, p, c) {
  const dp = bfs(block, p), dc = bfs(block, c); let n = 0;
  for (let i = 0; i < S; i++) if (dc[i] < dp[i]) n++;
  return n;
}
const EVALS = {
  manhattan: (b, p, c) => manhattan(p, c),
  path: (b, p, c) => bfs(b, p)[c],
  territory: (b, p, c) => territory(b, p, c) * 100 + bfs(b, p)[c],
  mobility: (b, p, c) => C.neighbours(b, c).filter((x) => x !== p).length * 100 + bfs(b, p)[c],
};
// Look `depth` moves ahead (Otto's replies are known), pick the move with the best leaf score.
function choose(pz, p, c, evalFn, depth) {
  let best = null, bestScore = Infinity;
  for (let d = 1; d <= 4; d++) {
    const s = C.step(pz.block, p, c, d, pz.val); if (!s) continue;
    const sc = s.caught ? -1e9 : score(pz, s.player, s.creature, evalFn, depth - 1);
    if (sc < bestScore) { bestScore = sc; best = d; }
  }
  return best;
}
function score(pz, p, c, evalFn, depth) {
  if (depth === 0) return evalFn(pz.block, p, c);
  let best = Infinity;
  for (let d = 1; d <= 4; d++) {
    const s = C.step(pz.block, p, c, d, pz.val); if (!s) continue;
    best = Math.min(best, s.caught ? -1e9 + 1 : score(pz, s.player, s.creature, evalFn, depth - 1) + 0.001);
  }
  return best;
}
export const PLAYERS = [];
for (const name of Object.keys(EVALS)) for (const depth of [1, 2, 3]) PLAYERS.push({ name: `${name}-${depth}`, evalFn: EVALS[name], depth });

export function play(pz, player, cap) {
  let p = pz.player, c = pz.creature; const seen = new Map();
  for (let m = 1; m <= cap; m++) {
    const d = choose(pz, p, c, player.evalFn, player.depth);
    const s = C.step(pz.block, p, c, d, pz.val);
    if (s.caught) return m;
    p = s.player; c = s.creature;
    const k = p * S + c; seen.set(k, (seen.get(k) || 0) + 1); if (seen.get(k) > 2) return Infinity; // stuck in a loop
  }
  return Infinity;
}
// Best result by any simulated player, as moves over Perfect (Infinity = nobody catches him).
export function bestExcess(pz) {
  let best = Infinity, who = null;
  for (const pl of PLAYERS) { const m = play(pz, pl, pz.par + 12); if (m - pz.par < best) { best = m - pz.par; who = pl.name; } }
  return { best, who };
}

if (process.argv[1].endsWith('difficulty.mjs')) {
  const from = process.argv[2] || '2026-11-03', days = +(process.argv[3] || 21);
  const hist = {};
  for (let d = 0; d < days; d++) {
    const ds = new Date(Date.parse(from + 'T12:00:00Z') + d * 864e5).toISOString().slice(0, 10);
    const pz = C.daily(ds), r = bestExcess(pz), lvl = C.dailyLevel(ds).name;
    (hist[lvl] = hist[lvl] || []).push(r.best);
    console.log(ds, lvl.padEnd(6), 'perfect', String(pz.par).padStart(2), 'best sim', r.best === Infinity ? 'never' : '+' + r.best, r.who || '');
  }
  for (const k in hist) console.log(k.padEnd(6), 'perfect by a sim player:', hist[k].filter((x) => x === 0).length, '/', hist[k].length);
}
