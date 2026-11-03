/* Otto UI: board rendering, input, daily state, stats and sharing. */
(function () {
  'use strict';
  const C = window.Cornered;
  const N = C.N;
  const SITE_URL = 'catchotto.com';
  const $ = (id) => document.getElementById(id);

  // ---------- storage (never required for the game to work) ----------
  const KEY = 'otto:v1';
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  let store = Object.assign({ days: {}, stats: { played: 0, inPar: 0, streak: 0, best: 0, last: null } }, load());
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* private mode */ } }

  // ---------- dates ----------
  const pad2 = (x) => String(x).padStart(2, '0');
  const localDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const TODAY = localDate(new Date());
  const YESTERDAY = localDate(new Date(Date.now() - 864e5));

  // ---------- game state ----------
  let mode = 'daily';
  let puzzle = null;      // {walls, player, creature, par, path}
  let moves = [];         // directions taken
  let pos = null;         // {player, creature}
  let visited = [];
  let solved = false;
  let busy = false;       // during perfect-route replay
  let escaped = false;    // creature can no longer be caught from here
  let tries = 1;          // restarts count as new tries
  let elapsed = 0;        // ms of active play, keeps running across restarts
  let runningSince = null;

  const board = $('board');
  let cells = [], jarEl, flyEl, trailLayer;
  // ---------- characters ----------
  const LOOK = {
    skin: ['#f6d7c3', '#eac09f', '#c98e62', '#9a6440', '#5e3b25'],
    hairColor: ['#2b211c', '#6b4226', '#c98a3c', '#e8d38a', '#b8463a', '#8a8f96'],
    hair: ['short', 'messy', 'long', 'bun', 'spiky', 'none'],
    shirt: ['#ff5b3a', '#1f3d7a', '#2e9e6b', '#f2c230', '#ffffff', '#1d2422', '#e56fa8'],
    pants: ['#3a5f9a', '#1d2422', '#8a6a48', '#c9c2b4'],
    hat: ['none', 'cap', 'beanie'],
  };
  const OTTO_LOOK = { skin: '#f6d7c3', hairColor: '#6b4226', hair: 'messy', shirt: '#ffffff', pants: '#3a5f9a', hat: 'none', shoes: '#ffffff' };
  const DEFAULT_YOU = { skin: '#eac09f', hairColor: '#2b211c', hair: 'short', shirt: '#1d2422', pants: '#c9c2b4', hat: 'none' };
  function hairSvg(style, col) {
    switch (style) {
      case 'short': return `<path d="M11 12 q0 -9 9 -9 q9 0 9 9 q-2 -4 -9 -4 q-7 0 -9 4z" fill="${col}"/>`;
      case 'messy': return `<path d="M10.5 13 q-1 -10 9.5 -10 q10 0 9.5 10 l-2 -4 l-2 2 l-1.5 -3.5 l-2.5 2 l-2 -3 l-2 3 l-2.5 -2 l-1.5 3.5 l-2 -2z" fill="${col}"/>`;
      case 'long': return `<path d="M10 22 q-1 -19 10 -19 q11 0 10 19 l-3 0 q1 -9 -1 -12 q-6 1 -12 0 q-2 3 -1 12z" fill="${col}"/>`;
      case 'bun': return `<circle cx="20" cy="2.6" r="3.2" fill="${col}"/><path d="M11 12 q0 -9 9 -9 q9 0 9 9 q-3 -5 -9 -5 q-6 0 -9 5z" fill="${col}"/>`;
      case 'spiky': return `<path d="M11 12 l-1 -6 l3.5 2 l1.5 -5 l3 3.5 l2 -5 l2 5 l3 -3.5 l1.5 5 l3.5 -2 l-1 6 q-4 -3 -9 -3 q-5 0 -9 3z" fill="${col}"/>`;
      default: return '';
    }
  }
  function hatSvg(hat, col) {
    if (hat === 'cap') return `<path d="M10.5 10 q0 -7.5 9.5 -7.5 q9.5 0 9.5 7.5z" fill="${col}"/><path d="M19 10 h14 q0 2 -3 2 h-11z" fill="${col}"/><path d="M10.5 10 h19" stroke="rgba(0,0,0,.2)" stroke-width="1"/>`;
    if (hat === 'beanie') return `<path d="M10.5 11 q0 -9 9.5 -9 q9.5 0 9.5 9z" fill="${col}"/><rect x="10" y="9.5" width="20" height="3.2" rx="1.6" fill="${col}" stroke="rgba(0,0,0,.18)" stroke-width="1"/><circle cx="20" cy="1.8" r="1.8" fill="${col}"/>`;
    return '';
  }
  function avatar(L, who) {
    const shoes = L.shoes || '#ffffff';
    const outline = L.shirt === '#ffffff' ? ' stroke="#1d2422" stroke-width="1"' : '';
    const hatCol = L.shirt === '#ffffff' || L.shirt === '#1d2422' ? '#ff5b3a' : L.shirt;
    return `<svg viewBox="0 0 40 40" aria-hidden="true">
      <ellipse cx="20" cy="38.3" rx="9" ry="1.6" fill="rgba(29,36,34,.18)"/>
      <rect x="14.3" y="28" width="5.2" height="8.5" rx="1.6" fill="${L.pants}"/><rect x="20.5" y="28" width="5.2" height="8.5" rx="1.6" fill="${L.pants}"/>
      <rect x="13.4" y="35.3" width="6.4" height="2.8" rx="1.4" fill="${shoes}" stroke="#1d2422" stroke-width=".8"/><rect x="20.2" y="35.3" width="6.4" height="2.8" rx="1.4" fill="${shoes}" stroke="#1d2422" stroke-width=".8"/>
      <rect x="9.6" y="20" width="4" height="8" rx="2" fill="${L.skin}"/><rect x="26.4" y="20" width="4" height="8" rx="2" fill="${L.skin}"/>
      <rect x="9.4" y="19" width="4.4" height="4.6" rx="2" fill="${L.shirt}"${outline}/><rect x="26.2" y="19" width="4.4" height="4.6" rx="2" fill="${L.shirt}"${outline}/>
      <rect x="13" y="18.5" width="14" height="11" rx="3.5" fill="${L.shirt}"${outline}/>
      ${who === 'otto' ? '<text x="20" y="26.6" text-anchor="middle" font-family="Inter Tight, Helvetica, sans-serif" font-weight="600" font-size="6.5" fill="#1d2422">O</text>' : ''}
      ${L.hair === 'long' ? hairSvg('long', L.hairColor) : ''}
      <circle cx="20" cy="11.5" r="8.6" fill="${L.skin}"/>
      ${L.hair !== 'long' && L.hat === 'none' ? hairSvg(L.hair, L.hairColor) : ''}
      ${L.hair === 'long' && L.hat === 'none' ? '<path d="M11.5 10 q1 -6 8.5 -6 q7.5 0 8.5 6 q-4 -3 -8.5 -3 q-4.5 0 -8.5 3z" fill="' + L.hairColor + '"/>' : ''}
      ${hatSvg(L.hat, hatCol)}
      <circle cx="16.8" cy="12.6" r="1.25" fill="#1d2422"/><circle cx="23.2" cy="12.6" r="1.25" fill="#1d2422"/>
      <path d="M17.6 15.6 q2.4 2 4.8 0" stroke="#1d2422" stroke-width="1.1" fill="none" stroke-linecap="round"/>
      <ellipse cx="14.6" cy="15" rx="1.4" ry=".8" fill="rgba(229,111,90,.35)"/><ellipse cx="25.4" cy="15" rx="1.4" ry=".8" fill="rgba(229,111,90,.35)"/>
    </svg>`;
  }
  let youLook = Object.assign({}, DEFAULT_YOU, store.look || {});
  const YOU_SVG_FN = () => avatar(youLook, 'you');
  const OTTO_SVG = avatar(OTTO_LOOK, 'otto');
  // icon for the rules: a square with a wall on one side
  const FENCE_SVG = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="6" y="6" width="28" height="28" fill="none" stroke="var(--line)" stroke-width="2"/><rect x="31" y="3" width="5" height="34" rx="1" fill="var(--ink)"/></svg>';
  function paintArt() { document.querySelectorAll('[data-art]').forEach((el) => (el.innerHTML = el.dataset.art === 'you' ? YOU_SVG_FN() : el.dataset.art === 'fence' ? FENCE_SVG : OTTO_SVG)); }
  paintArt();

  function buildBoard() {
    board.innerHTML = '';
    cells = [];
    for (let i = 0; i < N * N; i++) {
      const b = document.createElement('button');
      b.className = 'cell' + ((Math.floor(i / N) + i) % 2 ? ' alt' : '');
      b.setAttribute('aria-label', `Row ${Math.floor(i / N) + 1}, column ${(i % N) + 1}`);
      b.tabIndex = -1;
      b.dataset.i = i;
      board.appendChild(b); cells.push(b);
    }
    // walls sit in the gaps between squares; neighbouring pieces overlap so they join up
    const P = '((100% - 21px) / 8 + 3px)';
    for (let i = 0; i < N * N; i++) {
      const r = Math.floor(i / N), c = i % N;
      if (r < N - 1 && (puzzle.block[i] & (1 << 3))) {
        const w = document.createElement('div'); w.className = 'wall h';
        w.style.left = `calc(${c} * ${P} - 3px)`; w.style.top = `calc(${r + 1} * ${P} - 4px)`;
        board.appendChild(w);
      }
      if (c < N - 1 && (puzzle.block[i] & (1 << 2))) {
        const w = document.createElement('div'); w.className = 'wall v';
        w.style.left = `calc(${c + 1} * ${P} - 4px)`; w.style.top = `calc(${r} * ${P} - 3px)`;
        board.appendChild(w);
      }
    }
    trailLayer = document.createElement('div'); board.appendChild(trailLayer);
    flyEl = document.createElement('div'); flyEl.className = 'token otto'; flyEl.innerHTML = OTTO_SVG;
    jarEl = document.createElement('div'); jarEl.className = 'token you'; jarEl.innerHTML = YOU_SVG_FN();
    board.append(flyEl, jarEl);
  }

  function place(el, i) {
    const r = Math.floor(i / N), c = i % N;
    el.style.left = `calc(${c} * ((100% - 21px) / 8 + 3px))`;
    el.style.top = `calc(${r} * ((100% - 21px) / 8 + 3px))`;
  }

  function replay(list) {
    let p = puzzle.player, f = puzzle.creature, caught = false;
    visited = [p];
    for (let m = 0; m < list.length; m++) {
      const d = list[m];
      const s = C.step(puzzle.block, p, f, d, puzzle.val);
      if (!s) break;
      p = s.player; f = s.creature; caught = s.caught; visited.push(p);
      if (caught) break;
    }
    return { player: p, creature: f, caught };
  }

  function render() {
    place(jarEl, pos.player);
    place(flyEl, pos.creature);
    flyEl.classList.toggle('caught', solved);
    // no game over: if Otto is out of reach for a while, nudge towards Restart
    $('btn-reset').classList.toggle('nudge', escaped && !solved && !busy && moves.length >= puzzle.par + 8);
    $('moves').textContent = moves.length;
    showTime();
    $('par').textContent = puzzle.par;
    // squares you can step to next
    const [r, c] = [Math.floor(pos.player / N), pos.player % N];
    const reach = C.neighbours(puzzle.block, pos.player);
    cells.forEach((el, i) => {
      const rr = Math.floor(i / N), cc = i % N;
      el.classList.toggle('reach', !solved && !busy && reach.includes(i));
    });
    trailLayer.innerHTML = '';
    for (const v of visited.slice(0, -1)) {
      const t = document.createElement('div'); t.className = 'trail'; place(t, v); trailLayer.appendChild(t);
    }
    $('btn-result').hidden = !(solved && mode === 'daily');
    $('btn-daily').hidden = mode === 'daily';
  }

  function start(newMode, p, saved) {
    mode = newMode; puzzle = p;
    saved = saved || {};
    moves = saved.moves ? saved.moves.slice() : [];
    tries = saved.tries || 1;
    elapsed = saved.elapsed || 0;
    runningSince = null;
    buildBoard();
    pos = replay(moves);
    solved = pos.caught;
    escaped = isEscaped();
        $('daynum').textContent = mode === 'daily' ? `${String(C.dayNumber(TODAY)).padStart(3, '0')} / ${dayLabel()}` : 'Practice';
    render();
  }

  function dayLabel() {
    return C.dailyLevel(TODAY).name.toUpperCase();
  }

  // Only stop the game when Otto can never be caught from here.
  function isEscaped() {
    return !pos.caught && C.valueAt(puzzle.val, moves.length, pos.player, pos.creature) >= C.INF;
  }

  // ---------- clock: counts active play only, pauses when the tab is hidden ----------
  function now() { return elapsed + (runningSince ? Date.now() - runningSince : 0); }
  function startClock() { if (!runningSince && !solved) runningSince = Date.now(); }
  function stopClock() { if (runningSince) { elapsed += Date.now() - runningSince; runningSince = null; } }
  const fmt = (ms) => { const t = Math.floor(ms / 1000); return `${Math.floor(t / 60)}:${pad2(t % 60)}`; };
  function showTime() { $('time').textContent = fmt(now()); }
  setInterval(() => { if (runningSince) showTime(); }, 250);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stopClock(); persist(); } else if (moves.length && !solved) startClock(); });

  function persist() {
    if (mode !== 'daily') return;
    store.days[TODAY] = { moves, solved, tries, elapsed: now() };
    save();
  }

  function move(dir) {
    if (solved || busy) return;
    const s = C.step(puzzle.block, pos.player, pos.creature, dir, puzzle.val);
    if (!s) { board.classList.remove('shake'); void board.offsetWidth; board.classList.add('shake'); return; }
    startClock();
    moves.push(dir);
    pos = s; visited.push(s.player);
    jarEl.classList.remove('hop'); void jarEl.offsetWidth; jarEl.classList.add('hop');
    if (s.caught) { solved = true; stopClock(); onSolved(); }
    else { escaped = isEscaped(); maybeSqueak(); }
    persist();
    render();
  }

  const SQUEAKS = ['Nope!', 'Hehe', 'Too slow!', 'Catch me!', 'Not today'];
  function maybeSqueak() {
    const pr = Math.floor(pos.player / N), pc = pos.player % N, mr = Math.floor(pos.creature / N), mc = pos.creature % N;
    if (Math.abs(pr - mr) + Math.abs(pc - mc) > 2) return;
    const b = document.createElement('div'); b.className = 'squeak';
    b.textContent = escaped ? 'Bye!' : SQUEAKS[moves.length % SQUEAKS.length];
    place(b, pos.creature); board.appendChild(b);
    setTimeout(() => b.remove(), 1000);
  }

  function onSolved() {
    if (mode === 'daily') {
      const st = store.stats;
      if (st.last !== TODAY) {
        st.played++;
        if (moves.length <= puzzle.par) st.inPar++;
        st.streak = st.last === YESTERDAY ? st.streak + 1 : 1;
        st.best = Math.max(st.best, st.streak);
        st.last = TODAY;
        save();
      }
    }
    setTimeout(showWin, 750);
  }

  function starsFor(m, par) { return m <= par ? 3 : m <= par + 3 ? 2 : 1; }

  function shareText() {
    const s = starsFor(moves.length, puzzle.par);
    const head = mode === 'daily' ? `Otto #${C.dayNumber(TODAY)}` : 'Otto practice';
    const t = tries === 1 ? '1st try' : `${tries} tries`;
    return `${head} ⚪\n⏱ ${fmt(now())} · ${t}\n${moves.length} moves · perfect ${puzzle.par} ${'★'.repeat(s)}${'☆'.repeat(3 - s)}\n${SITE_URL}`;
  }

  function showWin() {
    const m = moves.length, par = puzzle.par, s = starsFor(m, par);
    $('win-moves').textContent = fmt(now());
    $('win-sub').textContent = `${m} moves · ${tries === 1 ? 'first try' : tries + ' tries'}`;
    $('win-stars').textContent = '★'.repeat(s) + '☆'.repeat(3 - s);
    $('win-title').textContent = m <= par ? 'Perfect catch' : 'Caught';
    $('win-note').textContent = m <= par ? 'Perfect. You caught Otto in the fewest moves possible.'
      : `Perfect is ${par}. Otto can be caught ${m - par} ${m - par === 1 ? 'move' : 'moves'} faster.`;
    $('share-text').textContent = shareText();
    $('next-wrap').hidden = mode !== 'daily';
    open('dlg-win');
  }

  // ---------- perfect route replay ----------
  function showParRoute() {
    close('dlg-win');
    busy = true;
    const keep = { moves: moves.slice(), solved };
    moves = []; solved = false; escaped = false; pos = replay([]); render();
    let k = 0;
    const tick = () => {
      if (k >= puzzle.path.length) {
        setTimeout(() => { moves = keep.moves; solved = keep.solved; pos = replay(moves); escaped = isEscaped(); busy = false; render(); }, 1200);
        return;
      }
      moves.push(puzzle.path[k++]);
      pos = replay(moves);
      if (pos.caught) solved = true;
      render();
      setTimeout(tick, 380);
    };
    setTimeout(tick, 400);
  }

  // ---------- dialogs ----------
  let lastFocus = null;
  function open(id) { lastFocus = document.activeElement; $(id).hidden = false; const b = $(id).querySelector('button'); if (b) b.focus(); }
  function close(id) { $(id).hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  document.querySelectorAll('.scrim').forEach((s) => s.addEventListener('click', (e) => { if (e.target === s) close(s.id); }));

  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 1800);
  }

  function showStats() {
    const st = store.stats;
    const streak = st.last === TODAY || st.last === YESTERDAY ? st.streak : 0;
    $('st-played').textContent = st.played; $('st-par').textContent = st.inPar;
    $('st-streak').textContent = streak; $('st-best').textContent = st.best;
    open('dlg-stats');
  }

  function countdown() {
    const now = new Date(), next = new Date(now); next.setHours(24, 0, 0, 0);
    const s = Math.max(0, Math.floor((next - now) / 1000));
    $('countdown').textContent = `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
  }
  setInterval(countdown, 1000); countdown();

  // ---------- input ----------
  document.querySelectorAll('.pad button').forEach((b) => b.addEventListener('click', () => move(+b.dataset.dir)));
  const KEYS = { ArrowUp: 1, ArrowRight: 2, ArrowDown: 3, ArrowLeft: 4, w: 1, d: 2, s: 3, a: 4, W: 1, D: 2, S: 3, A: 4 };
  document.addEventListener('keydown', (e) => {
    if (!document.querySelectorAll('.scrim:not([hidden])').length && KEYS[e.key]) { e.preventDefault(); move(KEYS[e.key]); }
    if ((e.key === 'r' || e.key === 'R') && !document.querySelectorAll('.scrim:not([hidden])').length) restart();
    if (e.key === 'Escape') document.querySelectorAll('.scrim:not([hidden])').forEach((s) => close(s.id));
  });
  // tap a neighbouring square, or swipe anywhere on the board
  let down = null;
  $('frame').addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  $('frame').addEventListener('pointerup', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y; down = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) {
      move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 4) : (dy > 0 ? 3 : 1));
      return;
    }
    const cell = e.target.closest && e.target.closest('.cell');
    if (!cell) return;
    const i = +cell.dataset.i;
    const dr = Math.floor(i / N) - Math.floor(pos.player / N), dc = (i % N) - (pos.player % N);
    if (Math.abs(dr) + Math.abs(dc) !== 1) return;
    move(dr === -1 ? 1 : dc === 1 ? 2 : dr === 1 ? 3 : 4);
  });

  function restart() {
    if (busy) return;
    if (solved) { if (mode === 'daily') toast('Today\u2019s board is done'); return; }
    if (!moves.length) return;
    tries++; moves = []; escaped = false; pos = replay(moves);
    persist(); render();
    toast(`Try ${tries}. The clock keeps running`);
  }
  $('btn-reset').addEventListener('click', restart);
  $('btn-help').addEventListener('click', () => open('dlg-help'));
  $('help-close').addEventListener('click', () => close('dlg-help'));
  $('btn-stats').addEventListener('click', showStats);
  $('stats-close').addEventListener('click', () => close('dlg-stats'));
  $('btn-result').addEventListener('click', showWin);
  $('win-close').addEventListener('click', () => close('dlg-win'));
  $('btn-replay').addEventListener('click', showParRoute);
  $('btn-share').addEventListener('click', () => {
    const text = shareText();
    const done = () => toast('Result copied');
    try {
      navigator.clipboard.writeText(text).then(done, selectShare);
    } catch (e) { selectShare(); }
  });
  function selectShare() {
    const r = document.createRange(); r.selectNodeContents($('share-text'));
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    toast('Text selected, copy it to share');
  }
  $('btn-unlimited').addEventListener('click', () => {
    const used = store.practiceDate === TODAY;
    $('btn-practice').textContent = used ? 'Free board used today' : 'Play a practice board';
    $('btn-practice').disabled = used;
    open('dlg-unl');
  });
  $('unl-close').addEventListener('click', () => close('dlg-unl'));
  // waitlist: sends the email to Formspree and confirms in place
  $('notify-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target, b = f.querySelector('button'), msg = $('notify-msg');
    b.disabled = true; msg.textContent = 'Sending…';
    fetch(f.action, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
      .then((r) => { if (!r.ok) throw 0; msg.textContent = 'Thanks. We will email you when Unlimited opens.'; f.querySelector('input[type=email]').value = ''; store.waitlist = true; save(); })
      .catch(() => { msg.textContent = 'That did not go through. Check your connection and try again.'; })
      .finally(() => { b.disabled = false; });
  });
  $('btn-practice').addEventListener('click', () => {
    store.practiceDate = TODAY; save();
    close('dlg-unl');
    const levels = [3, 4, 5, 6];
    const lvl = C.LEVELS[levels[Math.floor(Math.random() * levels.length)]];
    start('practice', C.generate((Math.random() * 2 ** 32) >>> 0, lvl));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('btn-daily').addEventListener('click', startDaily);

  const LOOK_ROWS = [['skin', 'Skin'], ['hair', 'Hair'], ['hairColor', 'Hair colour'], ['hat', 'Hat'], ['shirt', 'T-shirt'], ['pants', 'Trousers']];
  let draft = null;
  function renderLook() {
    $('look-preview').innerHTML = avatar(draft, 'you');
    const wrap = $('look-rows'); wrap.innerHTML = '';
    for (const [key, label] of LOOK_ROWS) {
      const row = document.createElement('div'); row.className = 'look-row';
      row.innerHTML = `<span class="look-label">${label}</span>`;
      const opts = document.createElement('div'); opts.className = 'look-opts';
      for (const v of LOOK[key]) {
        const b = document.createElement('button');
        const isColor = v[0] === '#';
        b.className = 'look-opt' + (isColor ? ' swatch' : '') + (draft[key] === v ? ' on' : '');
        b.setAttribute('aria-label', `${label}: ${isColor ? v : v}`);
        b.setAttribute('aria-pressed', draft[key] === v);
        if (isColor) b.style.setProperty('--sw', v);
        else b.innerHTML = avatar(Object.assign({}, draft, { [key]: v }, key === 'hair' ? { hat: 'none' } : {}), 'you');
        b.addEventListener('click', () => { draft[key] = v; renderLook(); });
        opts.appendChild(b);
      }
      row.appendChild(opts); wrap.appendChild(row);
    }
  }
  $('btn-look').addEventListener('click', () => { draft = Object.assign({}, youLook); renderLook(); open('dlg-look'); });
  $('look-random').addEventListener('click', () => { for (const k in LOOK) draft[k] = LOOK[k][Math.floor(Math.random() * LOOK[k].length)]; renderLook(); });
  $('look-save').addEventListener('click', () => {
    youLook = draft; store.look = youLook; save();
    jarEl.innerHTML = YOU_SVG_FN(); paintArt();
    close('dlg-look'); toast('Looking good');
  });
  $('look-cancel').addEventListener('click', () => close('dlg-look'));

  function startDaily() {
    const saved = store.days[TODAY];
    start('daily', C.daily(TODAY), saved);
  }


  // #expert opens a weekend-style board right away (for testing and sharing)
  function startExpert() {
    const lvl = C.LEVELS[new Date().getDay() === 0 ? 0 : 6];
    start('practice', C.generate((Math.random() * 2 ** 32) >>> 0, lvl));
    $('daynum').textContent = 'Expert practice';
  }
  window.addEventListener('hashchange', () => { if (location.hash === '#expert') startExpert(); });

  if (location.hash === '#expert') startExpert(); else startDaily();
  if (!store.seenHelp) { store.seenHelp = true; save(); open('dlg-help'); }
})();
