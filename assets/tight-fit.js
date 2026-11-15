/* Tight Fit: pack identical pieces into the dark frame. Each level has exactly one solution. */
(function () {
'use strict';
const LEVELS=[{"piece":[[0,0],[0,1],[0,2],[1,2]],"n":5,"tray":[[1,0],[2,0],[4,0],[1,1],[2,1],[3,1],[4,1],[0,2],[1,2],[2,2],[3,2],[4,2],[0,3],[1,3],[2,3],[3,3],[4,3],[0,4],[1,4],[3,4]]},{"piece":[[0,0],[1,0],[0,1],[1,1],[0,2]],"n":6,"tray":[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[0,3],[1,3],[2,3],[3,3],[4,3],[1,4],[2,4],[3,4],[4,4],[3,5],[4,5],[5,5]]},{"piece":[[0,0],[0,1],[1,1],[1,2],[1,3]],"n":6,"tray":[[0,0],[1,0],[2,0],[4,0],[1,1],[2,1],[3,1],[4,1],[5,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[0,4],[1,4],[2,4],[3,4],[4,4],[1,5],[3,5],[4,5],[5,5]]},{"piece":[[0,0],[0,1],[1,1],[0,2],[0,3]],"n":7,"tray":[[1,0],[3,0],[4,0],[5,0],[6,0],[0,1],[1,1],[5,1],[6,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[0,4],[1,4],[2,4],[3,4],[6,4],[0,5],[1,5],[2,5],[3,5],[4,5],[2,6],[3,6]]},{"piece":[[0,0],[0,1],[1,1],[1,2],[2,2]],"n":7,"tray":[[4,0],[5,0],[3,1],[4,1],[5,1],[6,1],[1,2],[2,2],[3,2],[4,2],[5,2],[2,3],[3,3],[4,3],[5,3],[6,3],[0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[0,5],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[1,6],[2,6],[3,6],[4,6],[5,6]]},{"piece":[[0,0],[0,1],[1,1],[1,2],[2,2],[1,3]],"n":6,"tray":[[1,0],[3,0],[4,0],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[1,3],[2,3],[3,3],[4,3],[5,3],[1,4],[2,4],[3,4],[4,4],[5,4],[0,5],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[0,6],[2,6],[3,6],[4,6]]}];
const COLS=10,TABLE=9,NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
const norm=c=>{const mx=Math.min(...c.map(p=>p[0])),my=Math.min(...c.map(p=>p[1]));return c.map(p=>[p[0]-mx,p[1]-my]);};
function orients(base){const out=[];for(let f=0;f<2;f++){let c=f?base.map(([x,y])=>[-x,y]):base;for(let r=0;r<4;r++){out.push(norm(c));c=c.map(([x,y])=>[-y,x]);}}return out;}
let store={lvl:0,solved:[],pos:{}};
try{const s=JSON.parse(localStorage.getItem('tightfit')||'null');if(s&&typeof s.lvl==='number')store=Object.assign(store,s);}catch(e){}
const save=()=>{try{localStorage.setItem('tightfit',JSON.stringify(store));}catch(e){}};
let L,ors,pcs,els,sel=0,rows,traySet,tx,ty;
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
function status(){const n=pcs.filter(inTray).length,won=n===L.n;
  $('st').textContent=won?'Solved':'Level '+(store.lvl+1);$('cnt').textContent=n+' of '+L.n+' pieces in the frame';
  if(won&&!store.solved.includes(store.lvl))store.solved.push(store.lvl);
  $('next').hidden=!(won&&store.lvl<LEVELS.length-1);
  [...$('levels').children].forEach((b,i)=>{b.classList.toggle('done',store.solved.includes(i));b.setAttribute('aria-pressed',i===store.lvl);
    b.setAttribute('aria-label','Level '+(i+1)+(store.solved.includes(i)?', solved':''));});
  store.pos[store.lvl]=pcs.map(p=>[p.x,p.y,p.o]);save();}
function select(i){sel=i;els.forEach((g,j)=>g.classList.toggle('sel',j===i));}
function turn(i,o){const p=pcs[i],a=ors[p.o],b=ors[o];const c=(cs,k)=>Math.max(...cs.map(q=>q[k]))/2;
  const x=Math.round(p.x+c(a,0)-c(b,0)),y=Math.round(p.y+c(a,1)-c(b,1));const n=nearest(i,o,x,y);if(!n)return;
  pcs[i]={x:n[0],y:n[1],o};draw(i);status();}
const rotate=i=>turn(i,(pcs[i].o&4)|((pcs[i].o+1)&3));
const flip=i=>turn(i,pcs[i].o^4);
function load(n,fresh){store.lvl=n;L=LEVELS[n];ors=orients(L.piece);
  const tw=Math.max(...L.tray.map(c=>c[0]))+1,th=Math.max(...L.tray.map(c=>c[1]))+1;tx=Math.floor((COLS-tw)/2);ty=1;rows=th+2+TABLE;
  traySet=new Set(L.tray.map(([x,y])=>(x+tx)+','+(y+ty)));
  board.setAttribute('viewBox',`-0.15 -0.15 ${COLS+.3} ${rows+.3}`);board.textContent='';
  for(let y=0;y<=rows;y++)for(let x=0;x<=COLS;x++)el('circle',{cx:x,cy:y,r:.035,class:'dot'},board);
  let d='';for(const [x,y] of L.tray)d+=`M${x+tx} ${y+ty}h1v1h-1z`;
  el('path',{d,class:'tray','stroke-width':.2,'stroke-linejoin':'round'},board);el('path',{d,class:'trayline'},board);
  pcs=[];const sv=store.pos[n];
  if(!fresh&&sv&&sv.length===L.n){pcs=[];let ok=true;for(const [x,y,o] of sv){if(!ors[o]||!legal(-1,o,x,y)){ok=false;break;}pcs.push({x,y,o});}if(!ok)scatter();}else scatter();
  els=pcs.map((p,i)=>{const gEl=el('g',{class:'pc',tabindex:0,role:'button','aria-label':'Piece '+(i+1)},board);el('path',{class:'f'},gEl);el('path',{class:'e'},gEl);
    gEl.addEventListener('pointerdown',ev=>down(ev,i));gEl.addEventListener('focus',()=>select(i));
    gEl.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();rotate(i);}
      const m={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[ev.key];
      if(m){ev.preventDefault();const q=pcs[i];if(legal(i,q.o,q.x+m[0],q.y+m[1])){q.x+=m[0];q.y+=m[1];draw(i);status();}}});
    return gEl;});
  sel=0;pcs.forEach((_,i)=>draw(i));status();}
function pt(ev){const r=board.getBoundingClientRect(),vb=board.viewBox.baseVal;return [vb.x+(ev.clientX-r.left)/r.width*vb.width,vb.y+(ev.clientY-r.top)/r.height*vb.height];}
function down(ev,i){ev.preventDefault();const g=els[i],p=pcs[i];select(i);board.appendChild(g);g.setPointerCapture(ev.pointerId);
  const [sx,sy]=pt(ev),ox=sx-p.x,oy=sy-p.y;let moved=false,fx=p.x,fy=p.y;
  const move=e=>{const [x,y]=pt(e);if(!moved&&Math.hypot(x-sx,y-sy)<.2)return;moved=true;g.classList.add('drag');fx=x-ox;fy=y-oy;g.style.transform=`translate(${fx}px,${fy}px)`;};
  const up=()=>{g.removeEventListener('pointermove',move);g.removeEventListener('pointerup',up);g.removeEventListener('pointercancel',up);g.classList.remove('drag');
    if(!moved){rotate(i);return;}const n=nearest(i,p.o,fx,fy);if(n){p.x=n[0];p.y=n[1];}draw(i);status();};
  g.addEventListener('pointermove',move);g.addEventListener('pointerup',up);g.addEventListener('pointercancel',up);}
LEVELS.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.textContent=i+1;b.id='lvl'+i;b.onclick=()=>load(i);$('levels').appendChild(b);});
$('rot').onclick=()=>rotate(sel);$('flip').onclick=()=>flip(sel);$('reset').onclick=()=>load(store.lvl,true);$('next').onclick=()=>load(store.lvl+1);
document.addEventListener('keydown',e=>{if(e.target.tagName==='BUTTON'||e.target.tagName==='INPUT')return;if(e.key==='r'||e.key==='R')rotate(sel);if(e.key==='f'||e.key==='F')flip(sel);});
load(Math.min(store.lvl,LEVELS.length-1));
})();
