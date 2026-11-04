// Counts "trap" moves along the perfect line: moves where exactly one choice
// keeps Perfect and every other choice lets Otto run forever or costs 3+ moves.
import { createRequire } from 'node:module';
const C = createRequire(import.meta.url)('../engine.js');
export function traps(p, penalty = 3) {
  const S = 64; let pl = p.player, ot = p.creature, n = 0;
  for (const dir of p.path) {
    const need = p.val[pl * S + ot]; let good = 0, soft = false;
    for (let d = 1; d <= 4; d++) {
      const s = C.step(p.block, pl, ot, d, p.val); if (!s) continue;
      if (s.caught) { good++; continue; }
      const after = p.val[s.player * S + s.creature];
      if (after + 1 === need) good++; else if (after < C.INF && after + 1 < need + penalty) soft = true;
    }
    if (good === 1 && !soft) n++;
    const s = C.step(p.block, pl, ot, dir, p.val); if (s.caught) break; pl = s.player; ot = s.creature;
  }
  return n;
}
if (process.argv[1].endsWith('traps.mjs')) {
  for (let d = 0; d < 14; d++) {
    const ds = new Date(Date.parse('2026-11-03T12:00:00Z') + d * 864e5).toISOString().slice(0, 10);
    const p = C.daily(ds);
    console.log(ds, C.dailyLevel(ds).name.padEnd(6), 'perfect', String(p.par).padStart(2), 'traps', traps(p));
  }
}
