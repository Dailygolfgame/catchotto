import { createRequire } from 'node:module';
const C = createRequire(import.meta.url)('../engine.js');
let maxT = 0;
for (let d = 0; d < 21; d++) {
  const ds = new Date(Date.parse('2026-11-03T12:00:00Z') + d * 864e5).toISOString().slice(0, 10);
  const t = Date.now(); const p = C.daily(ds); const dt = Date.now() - t; maxT = Math.max(maxT, dt);
  let pl = p.player, cr = p.creature, caught = false;
  for (const dir of p.path) { const s = C.step(p.block, pl, cr, dir, p.val); pl = s.player; cr = s.creature; caught = s.caught; }
  let walls = 0; for (const b of p.block) for (let k = 1; k <= 4; k++) if (b & (1 << k)) walls++;
  console.log(ds, '#' + C.dayNumber(ds), 'perfect', p.par, 'path', p.path.length, 'walls', walls / 2, 'caught', caught, dt + 'ms');
}
console.log('max ms', maxT);
