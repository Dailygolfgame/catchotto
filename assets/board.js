/* Draws a Catch Otto board as SVG and plays back a route. Used by the
   archive pages and the hint page, in the browser and at build time. */
(function (root) {
  'use strict';
  const N = 8, CELL = 40, PAD = 6, LAB = 18, SIZE = N * CELL + PAD * 2;
  const xy = (i) => [LAB + PAD + (i % N) * CELL, LAB + PAD + Math.floor(i / N) * CELL];
  const square = (i) => 'ABCDEFGH'[i % N] + (Math.floor(i / N) + 1);
  const ARROWS = ['', '↑', '→', '↓', '←'];
  const WORDS = ['', 'up', 'right', 'down', 'left'];

  function svg(p, ottoHref) {
    const W = SIZE + LAB;
    let s = `<svg class="board-svg" viewBox="0 0 ${W} ${W}" role="img" aria-label="Catch Otto board: you start on ${square(p.player)}, Otto starts on ${square(p.creature)}">`;
    for (let k = 0; k < N; k++) {
      s += `<text x="${LAB + PAD + k * CELL + CELL / 2}" y="12" text-anchor="middle" font-size="11" font-family="Inter Tight, Helvetica, Arial, sans-serif" fill="#6f6e69">${'ABCDEFGH'[k]}</text>`;
      s += `<text x="8" y="${LAB + PAD + k * CELL + CELL / 2 + 4}" text-anchor="middle" font-size="11" font-family="Inter Tight, Helvetica, Arial, sans-serif" fill="#6f6e69">${k + 1}</text>`;
    }
    s += `<rect x="${LAB + 1}" y="${LAB + 1}" width="${SIZE - 2}" height="${SIZE - 2}" fill="#efeeea" stroke="#1a1a19" stroke-width="2"/>`;
    for (let i = 0; i < N * N; i++) {
      const [x, y] = xy(i), r = Math.floor(i / N);
      s += `<rect x="${x + 1.5}" y="${y + 1.5}" width="${CELL - 3}" height="${CELL - 3}" rx="1.5" fill="${(r + i) % 2 ? '#e6e4df' : '#f7f6f3'}"/>`;
    }
    for (let i = 0; i < N * N; i++) {
      const [x, y] = xy(i), r = Math.floor(i / N), c = i % N;
      if (r < N - 1 && (p.block[i] & (1 << 3))) s += `<rect x="${x - 2}" y="${y + CELL - 2.5}" width="${CELL + 4}" height="5" rx="2.5" fill="#1a1a19"/>`;
      if (c < N - 1 && (p.block[i] & (1 << 2))) s += `<rect x="${x + CELL - 2.5}" y="${y - 2}" width="5" height="${CELL + 4}" rx="2.5" fill="#1a1a19"/>`;
    }
    const [ox, oy] = xy(p.creature), [yx, yy] = xy(p.player);
    s += `<g class="tok otto" style="transform:translate(${ox}px,${oy}px)"><image href="${ottoHref}" x="2" y="1" width="36" height="36"/></g>`;
    s += `<g class="tok you" style="transform:translate(${yx}px,${yy}px)"><circle cx="20" cy="20" r="11" fill="#1a1a19"/><circle cx="16.5" cy="18" r="1.8" fill="#efeeea"/><circle cx="23.5" cy="18" r="1.8" fill="#efeeea"/></g>`;
    return s + '</svg>';
  }

  // Animate the route inside an element that holds svg(p).
  function play(el, p, C, onDone) {
    const you = el.querySelector('.you'), otto = el.querySelector('.otto');
    const put = (g, i) => { const [x, y] = xy(i); g.style.transform = `translate(${x}px,${y}px)`; };
    let pl = p.player, ot = p.creature, k = 0;
    put(you, pl); put(otto, ot); otto.style.opacity = 1;
    const tick = () => {
      if (k >= p.path.length) { if (onDone) onDone(); return; }
      const s = C.step(p.block, pl, ot, p.path[k++], p.val);
      pl = s.player; put(you, pl);
      if (s.caught) { setTimeout(() => { otto.style.opacity = 0; if (onDone) onDone(); }, 250); return; }
      ot = s.creature; setTimeout(() => put(otto, ot), 140);
      setTimeout(tick, 450);
    };
    setTimeout(tick, 300);
  }

  function catchSquare(p, C) {
    let pl = p.player, ot = p.creature;
    for (const d of p.path) { const s = C.step(p.block, pl, ot, d, p.val); pl = s.player; if (s.caught) return pl; ot = s.creature; }
    return pl;
  }

  const api = { svg, play, square, catchSquare, ARROWS, WORDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.OttoBoard = api;
})(typeof window !== 'undefined' ? window : globalThis);
