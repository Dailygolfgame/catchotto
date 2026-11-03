/* Catch Otto engine: maze-style walls between squares, Otto's escape rule,
   optimal-catch solver and the daily board generator.
   Works in the browser (window.Cornered) and in Node (module.exports). */
(function (root) {
  'use strict';
  const N = 8, S = N * N;
  // Order matters for Otto's tie-break: (unused stay), up, right, down, left.
  const DIRS = [[0, 0], [-1, 0], [0, 1], [1, 0], [0, -1]];
  const OPP = [0, 3, 4, 1, 2];
  const INF = 9999;

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const rc = (i) => [Math.floor(i / N), i % N];

  // block[i] has bit (1 << d) set when a wall stops you leaving square i in direction d.
  function target(block, i, d) {
    const [r, c] = rc(i), rr = r + DIRS[d][0], cc = c + DIRS[d][1];
    if (rr < 0 || rr >= N || cc < 0 || cc >= N || (block[i] & (1 << d))) return -1;
    return rr * N + cc;
  }
  function neighbours(block, i) {
    const out = [];
    for (let d = 1; d <= 4; d++) { const j = target(block, i, d); if (j >= 0) out.push(j); }
    return out;
  }
  function addWall(block, i, d) {
    const [r, c] = rc(i), rr = r + DIRS[d][0], cc = c + DIRS[d][1];
    if (rr < 0 || rr >= N || cc < 0 || cc >= N) return false;
    if (block[i] & (1 << d)) return false;
    block[i] |= 1 << d; block[rr * N + cc] |= 1 << OPP[d];
    return true;
  }

  // Game value of every (you, Otto) position with you to move: the fewest moves
  // that force a catch when Otto always takes his best escape. INF: he can run
  // circles forever from there.
  function analyse(block) {
    const val = new Int16Array(S * S).fill(INF);
    const nb = []; for (let i = 0; i < S; i++) nb.push(neighbours(block, i));
    let changed = true;
    while (changed) {
      changed = false;
      for (let p = 0; p < S; p++) {
        for (let c = 0; c < S; c++) {
          if (c === p) continue;
          let best = INF;
          for (const p2 of nb[p]) {
            if (p2 === c) { best = 1; break; }
            let worst = -1, any = false;
            for (const c2 of nb[c]) { if (c2 === p2) continue; any = true; const v = val[p2 * S + c2]; if (v > worst) worst = v; }
            if (!any) worst = val[p2 * S + c];
            if (worst < INF && worst + 1 < best) best = worst + 1;
          }
          if (best < val[p * S + c]) { val[p * S + c] = best; changed = true; }
        }
      }
    }
    return val;
  }
  const valueAt = (val, _moves, p, c) => val[p * S + c];

  // Otto's reply: the escape that keeps him free longest; ties go to the
  // square farthest from you, then up, right, down, left.
  function flee(block, player, creature, val) {
    const opts = neighbours(block, creature).filter((x) => x !== player);
    if (!opts.length) return creature;
    const [pr, pc] = rc(player);
    let best = opts[0], bestV = -1, bestD = -1;
    for (const c2 of opts) {
      const v = val ? val[player * S + c2] : 0;
      const [r, c] = rc(c2); const d = (r - pr) ** 2 + (c - pc) ** 2;
      if (v > bestV || (v === bestV && d > bestD)) { best = c2; bestV = v; bestD = d; }
    }
    return best;
  }

  function step(block, player, creature, dir, val) {
    const p = target(block, player, dir);
    if (p < 0) return null;
    if (p === creature) return { player: p, creature, caught: true };
    return { player: p, creature: flee(block, p, creature, val), caught: false };
  }

  function solve(block, player, creature, val) {
    val = val || analyse(block);
    const par = val[player * S + creature];
    if (par >= INF) return null;
    const path = []; let p = player, c = creature;
    for (let m = 0; m < 200; m++) {
      const need = val[p * S + c];
      let moved = false;
      for (let d = 1; d <= 4; d++) {
        const s = step(block, p, c, d, val);
        if (!s) continue;
        if (s.caught) { path.push(d); return { par, path, val }; }
        if (val[s.player * S + s.creature] + 1 === need) { path.push(d); p = s.player; c = s.creature; moved = true; break; }
      }
      if (!moved) break;
    }
    return { par, path, val };
  }

  // A player who just walks straight at Otto. Boards where that works are rejected.
  function naiveMoves(block, player, creature, cap, val) {
    let p = player, c = creature;
    for (let m = 1; m <= cap; m++) {
      const [cr, cc] = rc(c);
      let best = -1, bestD = Infinity;
      for (let d = 1; d <= 4; d++) {
        const j = target(block, p, d); if (j < 0) continue;
        const [r, col] = rc(j); const dist = Math.abs(r - cr) + Math.abs(col - cc);
        if (dist < bestD) { bestD = dist; best = d; }
      }
      const s = step(block, p, c, best, val);
      if (s.caught) return m;
      p = s.player; c = s.creature;
    }
    return Infinity;
  }

  const LEVELS = {
    1: { min: 10, max: 12, walls: [16, 22], name: 'Easy' },
    2: { min: 11, max: 13, walls: [16, 22], name: 'Medium' },
    3: { min: 12, max: 14, walls: [16, 24], name: 'Medium' },
    4: { min: 13, max: 15, walls: [16, 24], name: 'Hard' },
    5: { min: 13, max: 16, walls: [14, 24], name: 'Hard' },
    // Weekends: open boards, and the first moves are a trap. Each of the first
    // `forced` moves has exactly one right answer; anything else lets Otto run
    // forever or costs at least `penalty` extra moves.
    6: { min: 14, max: 20, walls: [8, 13], forced: 3, penalty: 4, name: 'Expert' },
    0: { min: 15, max: 22, walls: [7, 12], forced: 3, penalty: 4, name: 'Expert' },
  };

  // True when each of the first `n` moves along the perfect line is the only good one.
  function forcedStart(block, player, creature, val, n, penalty) {
    let p = player, c = creature;
    for (let m = 0; m < n; m++) {
      const need = val[p * S + c];
      let good = 0, next = null;
      for (let d = 1; d <= 4; d++) {
        const s = step(block, p, c, d, val);
        if (!s) continue;
        if (s.caught) return false;               // catch too early to be a trap
        const after = val[s.player * S + s.creature];
        if (after + 1 === need) { good++; next = s; }
        else if (after < INF && after + 1 < need + penalty) return false;
      }
      if (good !== 1) return false;
      p = next.player; c = next.creature;
    }
    return true;
  }

  function connected(block) {
    const seen = new Uint8Array(S); seen[0] = 1; const st = [0]; let n = 1;
    while (st.length) for (const j of neighbours(block, st.pop())) if (!seen[j]) { seen[j] = 1; n++; st.push(j); }
    return n === S;
  }

  function generate(seed, level) {
    const rnd = rng(seed);
    for (let attempt = 0; attempt < 3000; attempt++) {
      const block = new Uint8Array(S);
      const want = level.walls[0] + Math.floor(rnd() * (level.walls[1] - level.walls[0] + 1));
      let placed = 0, guard = 0;
      // walls come as straight runs of 1-3 square edges
      while (placed < want && guard++ < 500) {
        let i = Math.floor(rnd() * S);
        const d = 1 + Math.floor(rnd() * 4);            // which side of the square
        const along = d === 1 || d === 3 ? 2 : 3;       // run continues sideways along that line
        const len = 1 + Math.floor(rnd() * 3);
        for (let q = 0; q < len && placed < want; q++) {
          if (addWall(block, i, d)) placed++;
          const j = target(new Uint8Array(S), i, along); if (j < 0) break; i = j;
        }
      }
      if (!connected(block)) continue;
      const val = analyse(block);
      const cands = [];
      for (let k = 0; k < S * S; k++) {
        if (val[k] < level.min || val[k] > level.max) continue;
        const p = Math.floor(k / S), c = k % S; const [pr, pc] = rc(p), [cr, cc] = rc(c);
        if (Math.abs(pr - cr) + Math.abs(pc - cc) >= 4) cands.push(k);
      }
      for (let t = 0; t < (level.forced ? 400 : 30) && cands.length; t++) {
        const k = cands.splice(Math.floor(rnd() * cands.length), 1)[0];
        const player = Math.floor(k / S), creature = k % S, par = val[k];
        if (naiveMoves(block, player, creature, par + 4, val) <= par + 4) continue;
        if (level.forced && !forcedStart(block, player, creature, val, level.forced, level.penalty)) continue;
        const sol = solve(block, player, creature, val);
        return { block, walls: new Array(S).fill(false), player, creature, par, path: sol.path, val };
      }
    }
    throw new Error('generation failed');
  }

  const EPOCH = '2026-11-03';
  function dayNumber(dateStr) { return Math.round((Date.parse(dateStr + 'T12:00:00Z') - Date.parse(EPOCH + 'T12:00:00Z')) / 864e5) + 1; }
  function dailyLevel(dateStr) { return LEVELS[new Date(dateStr + 'T12:00:00Z').getUTCDay()]; }
  function daily(dateStr) { return generate(hashString('otto-maze:' + dateStr), dailyLevel(dateStr)); }

  const api = { forcedStart, N, DIRS, INF, rng, hashString, target, neighbours, analyse, valueAt, flee, step, solve, naiveMoves, generate, daily, dailyLevel, dayNumber, LEVELS, EPOCH };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Cornered = api;
})(typeof window !== 'undefined' ? window : globalThis);
