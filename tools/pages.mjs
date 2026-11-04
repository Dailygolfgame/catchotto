// Builds the text pages (how to play, about, contact, thanks, privacy) with a shared layout.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const C = require('../engine.js');
const B = require('../assets/board.js');
const SITE = 'https://catchotto.com';
const GOAT = '<script data-goatcounter="https://catchotto.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>';
const ADS = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4913143800554205" crossorigin="anonymous"></script>';
const NAV = [['/how-to-play/', 'How to play'], ['/hint/', 'Hint'], ['/board/', 'Archive']];
const FOOT = [['/', 'Play today’s board'], ['/how-to-play/', 'How to play'], ['/hint/', 'Today’s hint'], ['/board/', 'Past boards'], ['/about/', 'About'], ['/contact/', 'Contact'], ['/privacy/', 'Privacy policy']];

function page({ path, title, description, label, h1, body, noindex, ads = true, scripts = '', jsonld = '' }) {
  const nav = NAV.map(([h, t]) => `<a href="${h}"${h === path ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  const foot = FOOT.map(([h, t]) => `<a href="${h}">${t}</a>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">
<link rel="canonical" href="${SITE}${path}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Catch Otto">
<meta property="og:title" content="${title}"><meta property="og:description" content="${description}">
<meta property="og:url" content="${SITE}${path}"><meta property="og:image" content="${SITE}/og-image.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${SITE}/og-image.png">
<meta name="theme-color" content="#efeeea">
<meta name="google-adsense-account" content="ca-pub-4913143800554205">
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/assets/page.css">
${jsonld}${ads ? ADS + '\n' : ''}${GOAT}
</head>
<body>
<div class="wrap">
<header><a class="brand" href="/"><img src="/assets/otto.svg" alt=""><span class="mark">Catch<br>Otto</span></a><nav aria-label="Site">${nav}</nav></header>
<main>
<span class="label">${label}</span>
<h1>${h1}</h1>
${body}
</main>
<footer><nav aria-label="Site pages">${foot}</nav><span>Catch Otto © 2026. A small daily logic puzzle.</span></footer>
</div>
${scripts}</body>
</html>
`;
}

const pages = [
  { path: '/how-to-play/', title: 'How to Play Catch Otto – Rules, Tips and Strategy', label: 'How to play',
    description: 'Learn the rules of Catch Otto, the daily logic puzzle. How Otto escapes, what Perfect means, why weekends are hard, and tips to catch him in fewer moves.',
    h1: 'How to play Catch Otto.', body: `
<p class="lead">Catch Otto is a daily logic puzzle on an 8×8 board. You move one square at a time. Otto moves after you, every time, and he always picks his best escape.</p>
<h2>The rules</h2>
<ol>
<li><strong>Move one square</strong> up, down, left or right. Use the arrow buttons, swipe, tap a square next to you, or use the arrow keys.</li>
<li><strong>Walls</strong> run between some squares. Neither of you can step through them.</li>
<li><strong>Otto answers every move.</strong> He steps one square to wherever keeps him free the longest. When two escapes are equally good he picks the square farthest from you.</li>
<li><strong>Catch him</strong> by stepping onto his square.</li>
</ol>
<h2>Moves, time and Perfect</h2>
<p>Every board has a number called <strong>Perfect</strong>: the fewest moves that catch Otto however well he runs. A solver checks every board before it goes live, so Perfect is always possible.</p>
<p>Catch Otto in Perfect moves for three stars. Within three extra moves earns two stars. Anything more is one star.</p>
<p>There is no undo. You can restart as often as you like, but the clock keeps running, and every restart counts as a new try in your result.</p>
<h2>When Otto gets away</h2>
<p>Make a careless step and Otto can run circles around the walls forever. The game never stops you. If he keeps slipping away, that is your hint to restart and think again.</p>
<h2>The week</h2>
<ul>
<li><strong>Monday</strong> is the easiest board, around 11 to 15 moves with a few tricky moments.</li>
<li><strong>Tuesday to Friday</strong> get longer and harder. Every board has several trap moves, where only one choice keeps the perfect catch alive.</li>
<li><strong>Saturday and Sunday</strong> are expert boards. They have few walls, and the first three moves are a trap: each has one right answer. Get one wrong and Otto slips away.</li>
</ul>
<h2>Tips</h2>
<ul>
<li>Do not chase Otto head-on. He will always step away.</li>
<li>Look for dead ends and corners made by walls, and work out how to push him into one.</li>
<li>Walls are your friends. A long wall lets you cut off half of the board.</li>
<li>On weekends, stop before the first move. Count where Otto can go after each of your options.</li>
</ul>
<p><a class="cta" href="/">Play today’s board</a></p>` },
  { path: '/about/', title: 'About Catch Otto – A Small Daily Logic Puzzle', label: 'About',
    description: 'Catch Otto is a free daily logic puzzle. One new board a day, the same for everyone, made to be solved over a coffee break.',
    h1: 'A small puzzle for every day.', body: `
<p class="lead">Catch Otto is a free logic puzzle with one new board every day. It takes a couple of minutes, and everyone in the world plays the same board.</p>
<p>The idea is simple. Otto is a clever little guy in jeans and a white T-shirt. He always takes his best escape, so chasing him never works. You have to read the walls, think a few moves ahead and trap him.</p>
<h2>Fair by design</h2>
<p>Every board is generated by a program and then checked by a solver that plays every possible game. That is how we know the Perfect number is the true minimum, and that every board can be solved. Otto is never random, so your time can be compared with anyone else’s.</p>
<h2>Free to play</h2>
<p>The daily board is free and always will be. Ads help pay for running the site. A subscription with unlimited boards is on the way for people who want more.</p>
<h2>Say hello</h2>
<p>Ideas, bugs or a time you are proud of: <a href="/contact/">send us a message</a>.</p>` },
  { path: '/contact/', title: 'Contact Catch Otto', label: 'Contact',
    description: 'Get in touch with Catch Otto. Report a bug, suggest an idea or tell us about a board you loved.',
    h1: 'Say hi.', body: `
<p class="lead">Found a bug, have an idea or a board that drove you crazy? Send us a message.</p>
<form id="contact-form" method="POST" action="https://formspree.io/f/mvkkdawj">
<input type="hidden" name="_subject" value="Catch Otto: new message">
<input type="hidden" name="site" value="catchotto.com">
<p style="display:none"><label>Don't fill this out: <input name="_gotcha" tabindex="-1" autocomplete="off"></label></p>
<label for="n">Your name</label><input id="n" name="name" autocomplete="name" required>
<label for="e">Your email, so we can reply</label><input id="e" name="email" type="email" autocomplete="email" required>
<label for="m">Message</label><textarea id="m" name="message" rows="6" required></textarea>
<button class="cta" type="submit">Send message</button>
<p id="form-error" class="error" role="alert" hidden>The message could not be sent. Check your connection and try again.</p>
</form>
<script>
// Sent with fetch so we can show our own thank-you page.
(function () {
  var f = document.getElementById('contact-form'), err = document.getElementById('form-error');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var b = f.querySelector('button'); b.disabled = true; err.hidden = true;
    fetch(f.action, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw 0; location.href = '/thanks/'; })
      .catch(function () { err.hidden = false; b.disabled = false; });
  });
})();
</script>
<h2>Good things to tell us</h2>
<ul><li>A bug. Tell us your device and browser, and which board.</li><li>An idea for a new feature or a new game.</li><li>Anything that felt unfair or confusing.</li></ul>` },
  { path: '/thanks/', title: 'Message sent – Catch Otto', label: 'Contact', noindex: true, ads: false,
    description: 'Your message to Catch Otto has been sent.',
    h1: 'Thank you.', body: `<p class="lead">Your message has been sent. We read everything and reply when we can.</p><p><a class="cta" href="/">Back to the game</a></p>` },
  { path: '/privacy/', title: 'Privacy Policy – Catch Otto', label: 'Privacy',
    description: 'How Catch Otto handles your data: what is stored on your device, the contact form, analytics and advertising.',
    h1: 'Privacy policy.', body: `
<p class="meta">Last updated: 3 November 2026</p>
<p>This policy explains what information Catch Otto (catchotto.com) collects when you visit, how it is used, and what choices you have. We collect very little.</p>
<h2>What we do not collect</h2>
<p>Catch Otto has no accounts or sign-in. We do not ask for your name, email or location to play.</p>
<h2>Data stored on your device</h2>
<p>To remember your progress, the game stores a small amount of information in your browser’s local storage: your moves on today’s board, your statistics (boards played, perfect catches and streaks) and the look you chose for your character. This data stays on your device. We do not receive it. You can remove it at any time by clearing your site data in your browser settings.</p>
<h2>Contact form</h2>
<p>If you send us a message through the contact page, we receive the name, email address and message you enter. We use it only to read and reply to your message. The form is processed by Formspree, which delivers the message to us by email.</p>
<h2>Hosting and analytics</h2>
<p>The site is hosted on GitHub Pages, which may process technical information such as your IP address and browser type to deliver the site and keep it secure. We count visits with GoatCounter, a privacy-friendly analytics service that does not use cookies and does not collect personal data. It tells us which pages are visited and roughly where visitors come from, so we know what to improve.</p>
<h2>Advertising and cookies</h2>
<p>We use Google AdSense to show advertising, which helps pay for running the site. Google and its partners may use cookies and similar technologies to show ads, including ads based on your previous visits to this or other websites. Google’s use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the internet.</p>
<p>You can manage or opt out of personalised advertising through <a href="https://adssettings.google.com/">Google Ads Settings</a>. You can also opt out of some third-party vendors’ use of cookies for personalised advertising at <a href="https://www.aboutads.info/">aboutads.info</a>. You can find out how Google uses information from sites that use its services at <a href="https://policies.google.com/technologies/partner-sites">policies.google.com/technologies/partner-sites</a>.</p>
<p>Where required by law, such as for visitors in the European Economic Area, the United Kingdom and Switzerland, you will be asked for consent before personalised ads are shown.</p>
<h2>Children</h2>
<p>Catch Otto is a general audience site and is not directed at children under 13. We do not knowingly collect personal information from children.</p>
<h2>Your rights</h2>
<p>Depending on where you live, you may have the right to ask what personal data we hold about you, to have it corrected or deleted, or to object to its use. Because we collect very little, this mostly applies to messages sent through the contact form. Use the <a href="/contact/">contact page</a> to make a request.</p>
<h2>Changes</h2>
<p>We may update this policy from time to time. The date at the top shows when it was last changed.</p>` },
];
// ---------- daily board pages ----------
// A day's board is published once that day is over everywhere (UTC-12).
const EPOCH = C.EPOCH;
const finishedBefore = process.env.BUILD_DATE || new Date(Date.now() - 12 * 3600e3).toISOString().slice(0, 10);
const days = [];
for (let t = Date.parse(EPOCH + 'T12:00:00Z'); ; t += 864e5) {
  const ds = new Date(t).toISOString().slice(0, 10);
  if (ds >= finishedBefore) break;
  days.push(ds);
}
const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const longDate = (ds) => { const d = new Date(ds + 'T12:00:00Z'); return `${WEEKDAY[d.getUTCDay()]} ${d.getUTCDate()} ${d.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' })} ${d.getUTCFullYear()}`; };
const boards = days.map((ds) => {
  const p = C.daily(ds), n = C.dayNumber(ds), level = C.dailyLevel(ds).name;
  return { ds, n, p, level, caught: B.catchSquare(p, C) };
});
for (const b of boards) {
  const { ds, n, p, level } = b;
  const route = p.path.map((d) => B.ARROWS[d]).join(' ');
  const words = p.path.map((d) => B.WORDS[d]);
  const prev = boards.find((x) => x.n === n - 1), next = boards.find((x) => x.n === n + 1);
  pages.push({
    path: `/board/${n}/`, label: `Board #${n} · ${level}`,
    title: `Catch Otto #${n} Answer – Perfect Route for ${longDate(ds)}`,
    description: `The perfect route for Catch Otto #${n} (${longDate(ds)}): ${p.par} moves. You start on ${B.square(p.player)}, Otto starts on ${B.square(p.creature)}. Step by step solution.`,
    h1: `Catch Otto #${n}.`,
    body: `
<p class="lead">${longDate(ds)}. ${/^[AEIOU]/.test(level) ? 'An' : 'A'} ${level.toLowerCase()} board. You start on ${B.square(p.player)} and Otto starts on ${B.square(p.creature)}. Columns are A to H, rows are 1 to 8 from the top.</p>
<div class="facts"><div><span class="label">Perfect</span><b>${p.par}</b></div><div><span class="label">Level</span><b>${level}</b></div><div><span class="label">Caught on</span><b>${B.square(b.caught)}</b></div></div>
<div id="viewer">${B.svg(p, '/assets/otto.svg')}</div>
<p><button class="cta" id="play-route" type="button">Watch the perfect route</button></p>
<h2>The perfect route</h2>
<p class="route">${route}</p>
<p>In words: ${words.join(', ')}. That catches Otto in ${p.par} moves, the fewest possible however well he runs.</p>
<h2>How the catch works</h2>
<p>Otto always takes the escape that keeps him free the longest, so the route has to cut off his options one by one. Watch how each move leaves him fewer ways out until he is trapped on ${B.square(b.caught)}.</p>
<p><a class="cta" href="/">Play today’s board</a></p>
<nav class="pager" aria-label="More boards">${prev ? `<a href="/board/${prev.n}/">← #${prev.n}</a>` : '<span></span>'}<a href="/board/">All boards</a>${next ? `<a href="/board/${next.n}/">#${next.n} →</a>` : '<span></span>'}</nav>`,
    scripts: `<script src="/engine.js"></script><script src="/assets/board.js"></script>
<script>
(function () {
  var p = Cornered.daily('${ds}'), btn = document.getElementById('play-route'), el = document.getElementById('viewer');
  btn.addEventListener('click', function () { btn.disabled = true; OttoBoard.play(el, p, Cornered, function () { btn.disabled = false; btn.textContent = 'Watch again'; }); });
})();
</script>
`,
  });
}
pages.push({
  path: '/board/', label: 'Archive', title: 'Catch Otto Archive – All Past Boards and Answers',
  description: 'Every past Catch Otto board with its Perfect move count and the step by step solution.',
  h1: 'Every board so far.',
  body: `<p class="lead">Each board is published here once its day is over everywhere in the world, with the perfect route.</p>
${boards.length ? `<ul class="archive">${boards.slice().reverse().map((b) => `<li><a href="/board/${b.n}/">#${b.n} · ${longDate(b.ds)}</a><span>${b.level} · perfect ${b.p.par}</span></li>`).join('')}</ul>` : '<p>The first board appears here tomorrow.</p>'}
<p><a class="cta" href="/">Play today’s board</a></p>`,
});
pages.push({
  path: '/hint/', label: 'Hint', title: 'Catch Otto Hint Today – Clues and Answer for Today’s Board',
  description: 'Stuck on today’s Catch Otto? Get a gentle hint, the first moves, or the full perfect route for today’s board.',
  h1: 'Stuck on today’s board?',
  body: `<p class="lead" id="hint-intro">Pick how much help you want. Each hint reveals a little more.</p>
<div class="facts"><div><span class="label">Board</span><b id="h-n">–</b></div><div><span class="label">Level</span><b id="h-level">–</b></div><div><span class="label">Perfect</span><b id="h-par">–</b></div></div>
<div class="spoiler"><span class="label">Hint 1 · Where it ends</span><button class="reveal" data-k="1">Show hint</button><p id="hint-1" hidden></p></div>
<div class="spoiler"><span class="label">Hint 2 · The first three moves</span><button class="reveal" data-k="2">Show hint</button><p id="hint-2" class="route" hidden></p></div>
<div class="spoiler"><span class="label">Hint 3 · The full answer</span><button class="reveal" data-k="3">Show the answer</button><div id="hint-3" hidden><p id="hint-3-route" class="route"></p><div id="viewer"></div><p><button class="cta" id="play-route" type="button">Watch the perfect route</button></p></div></div>
<p style="margin-top:28px"><a class="cta" href="/">Back to the game</a></p>
<h2>About these hints</h2>
<p>This page always shows the board for today in your own time zone, the same board you get on the game page. Past boards and their answers are in the <a href="/board/">archive</a>.</p>`,
  scripts: `<script src="/engine.js"></script><script src="/assets/board.js"></script>
<script>
(function () {
  var d = new Date(), pad = function (x) { return String(x).padStart(2, '0'); };
  var ds = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  var p = Cornered.daily(ds), lvl = Cornered.dailyLevel(ds).name, end = OttoBoard.catchSquare(p, Cornered);
  var r = Math.floor(end / 8), c = end % 8;
  var area = (r < 3 ? 'top' : r > 4 ? 'bottom' : 'middle') + (c < 3 ? ' left' : c > 4 ? ' right' : '');
  document.getElementById('h-n').textContent = '#' + Cornered.dayNumber(ds);
  document.getElementById('h-level').textContent = lvl;
  document.getElementById('h-par').textContent = p.par;
  document.getElementById('hint-1').textContent = 'Otto gets caught in the ' + (area === 'middle' ? 'middle of the board' : area + ' part of the board') + ', on square ' + OttoBoard.square(end) + '.';
  document.getElementById('hint-2').textContent = p.path.slice(0, 3).map(function (k) { return OttoBoard.ARROWS[k]; }).join(' ');
  document.getElementById('hint-3-route').textContent = p.path.map(function (k) { return OttoBoard.ARROWS[k]; }).join(' ');
  var el = document.getElementById('viewer'); el.innerHTML = OttoBoard.svg(p, '/assets/otto.svg');
  document.querySelectorAll('.reveal').forEach(function (b) {
    b.addEventListener('click', function () { document.getElementById('hint-' + b.dataset.k).hidden = false; b.hidden = true; });
  });
  var btn = document.getElementById('play-route');
  btn.addEventListener('click', function () { btn.disabled = true; OttoBoard.play(el, p, Cornered, function () { btn.disabled = false; btn.textContent = 'Watch again'; }); });
})();
</script>
`,
});

for (const p of pages) {
  const dir = new URL('..' + p.path, import.meta.url);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('index.html', dir), page(p));
}
const urls = ['/', ...pages.filter((p) => !p.noindex).map((p) => p.path)];
const today = new Date().toISOString().slice(0, 10);
writeFileSync(new URL('../sitemap.xml', import.meta.url), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => { const b = boards.find((x) => u === `/board/${x.n}/`); return `  <url><loc>${SITE}${u}</loc><lastmod>${b ? b.ds : today}</lastmod></url>`; }).join('\n')}
</urlset>
`);
console.log('built', pages.length, 'pages (', boards.length, 'board pages ) and sitemap');
