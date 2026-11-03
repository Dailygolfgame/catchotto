// Builds the text pages (how to play, about, contact, thanks, privacy) with a shared layout.
import { mkdirSync, writeFileSync } from 'node:fs';
const SITE = 'https://catchotto.com';
const GOAT = '<script data-goatcounter="https://catchotto.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>';
const ADS = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4913143800554205" crossorigin="anonymous"></script>';
const NAV = [['/how-to-play/', 'How to play'], ['/about/', 'About'], ['/contact/', 'Contact']];
const FOOT = [['/', 'Play today’s board'], ['/how-to-play/', 'How to play'], ['/about/', 'About'], ['/contact/', 'Contact'], ['/privacy/', 'Privacy policy']];

function page({ path, title, description, label, h1, body, noindex, ads = true }) {
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
${ads ? ADS + '\n' : ''}${GOAT}
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
</body>
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
<li><strong>Monday</strong> is the easiest board, around 10 to 12 moves.</li>
<li><strong>Tuesday to Friday</strong> get longer and harder.</li>
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
<form id="contact-form" method="POST" action="https://formspree.io/f/mnppvezd">
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
for (const p of pages) {
  const dir = new URL('..' + p.path, import.meta.url);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('index.html', dir), page(p));
}
const urls = ['/', ...pages.filter((p) => !p.noindex).map((p) => p.path)];
writeFileSync(new URL('../sitemap.xml', import.meta.url), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>2026-11-03</lastmod></url>`).join('\n')}
</urlset>
`);
console.log('built', pages.length, 'pages and sitemap');
