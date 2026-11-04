// Builds the public index.html from src/index.html (which is written as a
// page body, the format used for previews) by adding a full document head.
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
const split = src.indexOf('<div class="wrap">');
const headPart = src.slice(0, split)
  .replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
  .replace('<title>Catch Otto</title>', '<title>Catch Otto – A Daily Logic Puzzle Game</title>');
const bodyPart = src.slice(split);
const extra = `<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#efeeea">
<link rel="canonical" href="https://catchotto.com/">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Catch Otto">
<meta property="og:title" content="Catch Otto – A Daily Logic Puzzle">
<meta property="og:description" content="A small daily logic puzzle. Catch Otto in as few moves as you can. New board every day.">
<meta property="og:url" content="https://catchotto.com/">
<meta property="og:image" content="https://catchotto.com/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://catchotto.com/og-image.png">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"VideoGame","name":"Catch Otto","url":"https://catchotto.com/","description":"A free daily logic puzzle. Catch Otto, a clever little guy, on an 8×8 board in as few moves as you can.","genre":"Puzzle","gamePlatform":"Web browser","applicationCategory":"Game","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}</script>
<script data-goatcounter="https://catchotto.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
`;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}</style>
${headPart}${extra}</head>
<body>
${bodyPart}</body>
</html>
`;
writeFileSync(new URL('../index.html', import.meta.url), html);
console.log('built index.html', html.length, 'bytes');
