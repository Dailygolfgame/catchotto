// Builds the public index.html from src/index.html (which is written as a
// page body, the format used for previews) by adding a full document head.
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
const split = src.indexOf('<div class="wrap">');
const headPart = src.slice(0, split).replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '');
const bodyPart = src.slice(split);
const extra = `<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="canonical" href="https://catchotto.com/">
<meta property="og:title" content="Catch Otto">
<meta property="og:description" content="A small daily logic puzzle. Catch Otto in as few moves as you can.">
<meta property="og:url" content="https://catchotto.com/">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"VideoGame","name":"Catch Otto","url":"https://catchotto.com/","description":"A free daily logic puzzle. Catch Otto, a clever little guy, on an 8×8 board in as few moves as you can.","genre":"Puzzle","gamePlatform":"Web browser","applicationCategory":"Game","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}</script>
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
