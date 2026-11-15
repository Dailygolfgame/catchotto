/* Tight Fit puzzle generator: builds a frame out of n copies of one piece and
   keeps it only when the frame can be filled in exactly one way.
   Works in the browser (window.TightFitGen) and in Node (module.exports). */
(function (root) {
  'use strict';
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // Pieces with no easy symmetry (no straight lines or squares).
  const PIECES = {
    4: [[[0,0],[0,1],[0,2],[1,2]], [[0,0],[1,0],[2,0],[1,1]], [[0,0],[1,0],[1,1],[2,1]]],
    5: [[[1,0],[2,0],[0,1],[1,1],[1,2]], [[0,0],[0,1],[0,2],[0,3],[1,3]], [[0,0],[0,1],[1,1],[1,2],[1,3]],
        [[0,0],[1,0],[0,1],[1,1],[0,2]], [[0,0],[1,0],[2,0],[1,1],[1,2]], [[0,0],[0,1],[1,1],[2,1],[2,0]],
        [[0,0],[0,1],[0,2],[1,2],[2,2]], [[0,0],[0,1],[1,1],[1,2],[2,2]], [[0,0],[0,1],[1,1],[0,2],[0,3]],
        [[0,0],[1,0],[1,1],[1,2],[2,2]]],
    6: [[[0,0],[0,1],[1,1],[1,2],[2,2],[1,3]], [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2]], [[0,0],[0,1],[0,2],[1,2],[1,3],[2,3]],
        [[1,0],[0,1],[1,1],[2,1],[1,2],[1,3]], [[0,0],[1,0],[1,1],[1,2],[2,2],[2,3]]],
  };
  const norm = (c) => { const mx = Math.min(...c.map((p) => p[0])), my = Math.min(...c.map((p) => p[1])); return c.map((p) => [p[0] - mx, p[1] - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); };
  function orients(base) {
    const seen = new Set(), out = [];
    for (let f = 0; f < 2; f++) { let c = f ? base.map(([x, y]) => [-x, y]) : base;
      for (let r = 0; r < 4; r++) { const n = norm(c), k = JSON.stringify(n); if (!seen.has(k)) { seen.add(k); out.push(n); } c = c.map(([x, y]) => [-y, x]); } }
    return out;
  }

  // Number of ways to fill the cells with the piece (stops at `limit`).
  function countTilings(cells, piece, limit) {
    const set = new Set(cells.map((c) => c + '')), ors = orients(piece), places = new Map();
    for (const k of set) places.set(k, []);
    for (const o of ors) for (const [ax, ay] of cells) {
      const dx = ax - o[0][0], dy = ay - o[0][1], cs = o.map(([x, y]) => (x + dx) + ',' + (y + dy));
      if (cs.every((c) => set.has(c))) places.get(cs[0]).push(cs); // indexed by its first cell (top-left in reading order)
    }
    const order = [...set].sort((a, b) => { const [ax, ay] = a.split(',').map(Number), [bx, by] = b.split(',').map(Number); return ay - by || ax - bx; });
    const used = new Set(); let count = 0;
    (function rec() {
      if (count >= limit) return;
      const first = order.find((c) => !used.has(c)); if (!first) { count++; return; }
      for (const p of places.get(first)) { if (p.some((c) => used.has(c))) continue; p.forEach((c) => used.add(c)); rec(); p.forEach((c) => used.delete(c)); if (count >= limit) return; }
    })();
    return count;
  }

  // Grow a compact frame from n placed copies, inside a box of size `box`.
  function grow(rnd, piece, n, box) {
    const ors = orients(piece), occ = new Set(), cells = [];
    const fits = (cs) => cs.every(([x, y]) => x >= 0 && y >= 0 && x < box && y < box && !occ.has(x + ',' + y));
    const put = (cs) => cs.forEach(([x, y]) => { occ.add(x + ',' + y); cells.push([x, y]); });
    const o0 = ors[Math.floor(rnd() * ors.length)], start = Math.floor(box / 2) - 1;
    put(o0.map(([x, y]) => [x + start, y + start]));
    for (let k = 1; k < n; k++) {
      const cands = [];
      for (const o of ors) for (let y = -4; y < box; y++) for (let x = -4; x < box; x++) {
        const cs = o.map(([a, b]) => [a + x, b + y]); if (!fits(cs)) continue;
        let touch = 0; for (const [a, b] of cs) for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if (occ.has((a + dx) + ',' + (b + dy))) touch++;
        if (touch) cands.push({ cs, touch });
      }
      if (!cands.length) return null;
      cands.sort((a, b) => b.touch - a.touch);
      const top = cands.slice(0, Math.max(3, Math.ceil(cands.length * 0.25)));
      put(top[Math.floor(rnd() * top.length)].cs);
    }
    return norm(cells);
  }

  const LEVELS = {
    easy: { sizes: [4, 5], n: [5, 6] },
    medium: { sizes: [5], n: [6, 7] },
    hard: { sizes: [5, 6], n: [7, 8] },
  };
  function generate(seed, levelName) {
    const L = LEVELS[levelName] || LEVELS.medium, rnd = rng(seed);
    for (let attempt = 0; attempt < 600; attempt++) {
      const size = L.sizes[Math.floor(rnd() * L.sizes.length)], list = PIECES[size];
      const piece = list[Math.floor(rnd() * list.length)], n = L.n[0] + Math.floor(rnd() * (L.n[1] - L.n[0] + 1));
      const cells = grow(rnd, piece, n, 8);
      if (!cells) continue;
      const w = Math.max(...cells.map((c) => c[0])) + 1, h = Math.max(...cells.map((c) => c[1])) + 1;
      if (w > 8 || h > 8) continue;
      if (countTilings(cells, piece, 2) !== 1) continue;
      return { piece, n, tray: cells, level: levelName };
    }
    throw new Error('no puzzle');
  }
  // Monday easiest, weekend hardest.
  const DAY_LEVEL = ['hard', 'easy', 'easy', 'medium', 'medium', 'hard', 'hard'];
  const EPOCH = '2026-11-15';
  const dayNumber = (ds) => Math.round((Date.parse(ds + 'T12:00:00Z') - Date.parse(EPOCH + 'T12:00:00Z')) / 864e5) + 1;
  const dayLevel = (ds) => DAY_LEVEL[new Date(ds + 'T12:00:00Z').getUTCDay()];
  const daily = (ds) => generate(hash('tightfit:' + ds), dayLevel(ds));

  const api = { generate, daily, dayLevel, dayNumber, countTilings, orients, hash, EPOCH };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TightFitGen = api;
})(typeof window !== 'undefined' ? window : globalThis);
