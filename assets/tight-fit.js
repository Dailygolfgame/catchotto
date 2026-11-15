/* Tight Fit: pack identical pieces into the dark frame. Daily and Unlimited modes.
   Every puzzle has exactly one solution. */
(function () {
'use strict';
const G = window.TightFitGen;
const COLS=10,NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
const pad2=x=>String(x).padStart(2,'0');
const localDate=d=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const TODAY=localDate(new Date());
const norm=c=>{const mx=Math.min(...c.map(p=>p[0])),my=Math.min(...c.map(p=>p[1]));return c.map(p=>[p[0]-mx,p[1]-my]);};
function orients(base){const out=[];for(let f=0;f<2;f++){let c=f?base.map(([x,y])=>[-x,y]):base;for(let r=0;r<4;r++){out.push(norm(c));c=c.map(([x,y])=>[-y,x]);}}return out;}

let store={mode:'daily',lvl:0,solved:[],pos:{},daily:{},unl:{level:'medium',seed:1,solved:0}};
try{const s=JSON.parse(localStorage.getItem('tightfit')||'null');if(s&&typeof s==='object'){store=Object.assign(store,s);store.unl=Object.assign({level:'medium',seed:1,solved:0},s.unl||{});store.daily=s.daily||{};}}catch(e){}
const save=()=>{try{localStorage.setItem('tightfit',JSON.stringify(store));}catch(e){}};

let L,KEY,ors,pcs,els,sel=0,rows,traySet,tx,ty,won=false;
const board=$('board');
const cellsOf=(p)=>ors[p.o].map(([x,y])=>[x+p.x,y+p.y]);
function legal(i,o,x,y){let inT=0;const cs=ors[o];
  for(const [cx,cy] of cs){const X=cx+x,Y=cy+y;if(X<0||Y<0||X>=COLS||Y>=rows)return false;if(traySet.has(X+','+Y))inT++;
    for(let j=0;j<pcs.length;j++){if(j===i||!pcs[j])continue;for(const [a,b] of cellsOf(pcs[j]))if(a===X&&b===Y)return false;}}
  return inT===0||inT===cs.length;}
function nearest(i,o,x,y){let best=null,bd=1e9;for(let Y=0;Y<rows;Y++)for(let X=0;X<COLS;X++){const d=(X-x)**2+(Y-y)**2;if(d<bd&&legal(i,o,X,Y)){bd=d;best=[X,Y];}}return best;}
const inTray=p=>traySet.has((ors[p.o][0][0]+p.x)+','+(ors[p.o][0][1]+p.y));
function scatter(){pcs=[];const top=ty+Math.max(...L.tray.map(c=>c[1]))+2;
  for(let i=0;i<L.n;i++){let placed=null;
    for(const gap of [1,0]){for(let t=0;t<8&&!placed;t++){const o=(i*3+t)%8;
      for(let Y=top;Y<rows&&!placed;Y++)for(let X=0;X<COLS&&!placed;X++){if(!legal(i,o,X,Y))continue;
        let ok=true;if(gap)for(const [cx,cy] of ors[o])for(const q of pcs)for(const [a,b] of cellsOf(q))if(Math.abs(a-cx-X)<=1&&Math.abs(b-cy-Y)<=1)ok=false;
        if(ok)placed={x:X,y:Y,o};}}
      if(placed)break;}
    pcs.push(placed||{x:0,y:top,o:0});}}
function shape(o){const cs=ors[o],s=new Set(cs.map(c=>c+''));let f='',e='';
  for(const [x,y] of cs){f+=`M${x} ${y}h1v1h-1z`;
    if(!s.has(x+','+(y-1)))e+=`M${x} ${y}h1`;if(!s.has(x+','+(y+1)))e+=`M${x} ${y+1}h1`;
    if(!s.has((x-1)+','+y))e+=`M${x} ${y}v1`;if(!s.has((x+1)+','+y))e+=`M${x+1} ${y}v1`;}
  return [f,e];}
function el(n,a,parent){const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);if(parent)parent.appendChild(e);return e;}
function draw(i){const p=pcs[i],g=els[i],[f,e]=shape(p.o);g.children[0].setAttribute('d',f);g.children[1].setAttribute('d',e);
  g.style.transform=`translate(${p.x}px,${p.y}px)`;g.classList.toggle('sel',i===sel);}

// ---------- daily clock ----------
let runningSince=null,unlRun={elapsed:0,solved:false};
const day=()=>store.daily[TODAY]||(store.daily[TODAY]={elapsed:0,solved:false});
const cur=()=>store.mode==='daily'?day():unlRun;
const clock=()=>cur().elapsed+(runningSince?Date.now()-runningSince:0);
const fmt=ms=>{const t=Math.floor(ms/1000);return `${Math.floor(t/60)}:${pad2(t%60)}`;};
function startClock(){if(!cur().solved&&!runningSince)runningSince=Date.now();}
function stopClock(){if(runningSince){cur().elapsed+=Date.now()-runningSince;runningSince=null;save();}}
setInterval(()=>{$('clock').textContent=fmt(clock());},500);

document.addEventListener('visibilitychange',()=>{if(document.hidden)stopClock();});

function status(){const n=pcs.filter(inTray).length,was=won;won=n===L.n;
  $('cnt').textContent=n+'/'+L.n;
  const m=store.mode;
  if(m==='unlimited'){
    $('st').textContent=won?'Solved':L.level[0].toUpperCase()+L.level.slice(1);
    if(won&&!was){stopClock();unlRun.solved=true;store.unl.solved++;}
    $('next').hidden=false;$('daynum').textContent='Unlimited / '+L.level;
  }else{
    $('st').textContent=won?'Solved':L.level[0].toUpperCase()+L.level.slice(1);
    $('daynum').textContent=String(G.dayNumber(TODAY)).padStart(3,'0')+' / '+L.level;
    if(won&&!day().solved){stopClock();day().solved=true;day().time=day().elapsed;}
    $('next').hidden=true;
  }
  $('result').hidden=!won;
  store.pos[KEY]=pcs.map(p=>[p.x,p.y,p.o]);save();
  if(won&&!was&&!loading)setTimeout(showWin,450);}
function shareText(){return `Tight Fit #${G.dayNumber(TODAY)} 🧩\nSolved in ${fmt(day().time||day().elapsed)}\ncatchotto.com/tight-fit`;}
function select(i){sel=i;els.forEach((g,j)=>g.classList.toggle('sel',j===i));}
function turn(i,o){const p=pcs[i],a=ors[p.o],b=ors[o];const c=(cs,k)=>Math.max(...cs.map(q=>q[k]))/2;
  const x=Math.round(p.x+c(a,0)-c(b,0)),y=Math.round(p.y+c(a,1)-c(b,1));const n=nearest(i,o,x,y);if(!n)return;
  pcs[i]={x:n[0],y:n[1],o};startClock();draw(i);status();}
const rotate=i=>{if(!won)turn(i,(pcs[i].o&4)|((pcs[i].o+1)&3));};
const flip=i=>{if(!won)turn(i,pcs[i].o^4);};

let loading=false;
function load(puzzle,key,fresh){loading=true;L=puzzle;KEY=key;won=false;ors=orients(L.piece);
  const tw=Math.max(...L.tray.map(c=>c[0]))+1,th=Math.max(...L.tray.map(c=>c[1]))+1;tx=Math.floor((COLS-tw)/2);ty=1;
  rows=th+2+Math.max(9,L.n*2-2);
  traySet=new Set(L.tray.map(([x,y])=>(x+tx)+','+(y+ty)));
  board.setAttribute('viewBox',`-0.15 -0.15 ${COLS+.3} ${rows+.3}`);board.textContent='';
  for(let y=0;y<=rows;y++)for(let x=0;x<=COLS;x++)el('circle',{cx:x,cy:y,r:.035,class:'dot'},board);
  let d='';for(const [x,y] of L.tray)d+=`M${x+tx} ${y+ty}h1v1h-1z`;
  el('path',{d,class:'tray','stroke-width':.2,'stroke-linejoin':'round'},board);el('path',{d,class:'trayline'},board);
  pcs=[];const sv=store.pos[key];
  if(!fresh&&sv&&sv.length===L.n){let ok=true;for(const [x,y,o] of sv){if(!ors[o]||!legal(-1,o,x,y)){ok=false;break;}pcs.push({x,y,o});}if(!ok)scatter();}else scatter();
  els=pcs.map((p,i)=>{const gEl=el('g',{class:'pc',tabindex:0,role:'button','aria-label':'Piece '+(i+1)},board);el('path',{class:'f'},gEl);el('path',{class:'e'},gEl);
    gEl.addEventListener('pointerdown',ev=>down(ev,i));gEl.addEventListener('focus',()=>select(i));
    gEl.addEventListener('keydown',ev=>{if(won)return;if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();rotate(i);}
      const m={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[ev.key];
      if(m){ev.preventDefault();const q=pcs[i];if(legal(i,q.o,q.x+m[0],q.y+m[1])){q.x+=m[0];q.y+=m[1];startClock();draw(i);status();}}});
    return gEl;});
  sel=0;pcs.forEach((_,i)=>draw(i));status();loading=false;}
function pt(ev){const r=board.getBoundingClientRect(),vb=board.viewBox.baseVal;return [vb.x+(ev.clientX-r.left)/r.width*vb.width,vb.y+(ev.clientY-r.top)/r.height*vb.height];}
function down(ev,i){ev.preventDefault();if(won)return;const g=els[i],p=pcs[i];select(i);board.appendChild(g);g.setPointerCapture(ev.pointerId);
  const [sx,sy]=pt(ev),ox=sx-p.x,oy=sy-p.y;let moved=false,fx=p.x,fy=p.y;
  const move=e=>{const [x,y]=pt(e);if(!moved&&Math.hypot(x-sx,y-sy)<.2)return;moved=true;g.classList.add('drag');fx=x-ox;fy=y-oy;g.style.transform=`translate(${fx}px,${fy}px)`;};
  const up=()=>{g.removeEventListener('pointermove',move);g.removeEventListener('pointerup',up);g.removeEventListener('pointercancel',up);g.classList.remove('drag');
    if(!moved){rotate(i);return;}const n=nearest(i,p.o,fx,fy);if(n){p.x=n[0];p.y=n[1];}startClock();draw(i);status();};
  g.addEventListener('pointermove',move);g.addEventListener('pointerup',up);g.addEventListener('pointercancel',up);}

// ---------- win dialog ----------
function close(){$('dlg-win').hidden=true;}
function countdown(){const n=new Date(),t=new Date(n);t.setHours(24,0,0,0);const s=Math.max(0,Math.floor((t-n)/1000));
  return `${pad2(Math.floor(s/3600))}:${pad2(Math.floor(s%3600/60))}:${pad2(s%60)}`;}
function showWin(){
  const daily=store.mode==='daily';
  $('win-title').textContent=daily?`Tight Fit #${G.dayNumber(TODAY)} solved`:'Solved';
  $('win-time').textContent=fmt(daily?(day().time||day().elapsed):unlRun.elapsed);
  $('win-sub').textContent=daily?`Every piece fits. ${L.level[0].toUpperCase()+L.level.slice(1)} puzzle, ${L.n} pieces.`:`${L.level[0].toUpperCase()+L.level.slice(1)} puzzle, ${L.n} pieces.`;
  $('share-text').hidden=!daily;$('copy').hidden=!daily;
  if(daily)$('share-text').textContent=shareText();
  $('win-next').textContent=daily?'Play Unlimited':'New puzzle';
  $('win-next').className=daily?'ghost':'cta';
  $('win-countdown').hidden=!daily;
  if(daily)$('win-countdown').textContent='Next puzzle in '+countdown();
  $('dlg-win').hidden=false;$('win-next').focus();}
setInterval(()=>{if(!$('dlg-win').hidden&&store.mode==='daily')$('win-countdown').textContent='Next puzzle in '+countdown();},1000);
$('win-close').onclick=close;
$('dlg-win').addEventListener('click',e=>{if(e.target.id==='dlg-win')close();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
$('result').onclick=showWin;
$('win-next').onclick=()=>{close();if(store.mode==='daily')setMode('unlimited');else newUnlimited();};

// ---------- modes ----------
function setMode(m,fresh){stopClock();store.mode=m;save();
  document.querySelectorAll('.tf-tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.mode===m));
  $('unl-levels').hidden=m!=='unlimited';close();if(m==='unlimited')unlRun={elapsed:0,solved:false};$('clock').textContent=fmt(clock());
  if(m==='daily'){load(G.daily(TODAY),'daily:'+TODAY,fresh);}
  else if(m==='unlimited'){load(G.generate(store.unl.seed,store.unl.level),'unl:'+store.unl.level+':'+store.unl.seed,fresh);
    document.querySelectorAll('#unl-levels button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.level===store.unl.level));}}
function newUnlimited(level){if(level)store.unl.level=level;store.unl.seed=(Math.random()*2**32)>>>0;save();setMode('unlimited',true);}

document.querySelectorAll('.tf-tabs button').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
document.querySelectorAll('#unl-levels button').forEach(b=>b.onclick=()=>newUnlimited(b.dataset.level));
$('rot').onclick=()=>rotate(sel);$('flip').onclick=()=>flip(sel);
$('reset').onclick=()=>{if(store.mode==='daily'&&day().solved)return;setMode(store.mode,true);};
$('next').onclick=()=>newUnlimited();
$('copy').onclick=()=>{const t=shareText(),ok=()=>{$('copy').textContent='Copied';setTimeout(()=>$('copy').textContent='Copy result',1500);};
  try{navigator.clipboard.writeText(t).then(ok,()=>{});}catch(e){}};
document.addEventListener('keydown',e=>{if(e.target.tagName==='BUTTON'||e.target.tagName==='INPUT')return;if(e.key==='r'||e.key==='R')rotate(sel);if(e.key==='f'||e.key==='F')flip(sel);});
setMode(store.mode==='unlimited'?'unlimited':'daily');
})();
