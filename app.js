"use strict";
const APP_VERSION="1.1.0", APP_DATE="18/10/2026";
const THEMES={
 classic:{name:"Clássico",c:["#4a6b8a","#c9822f","#3f8a52","#a83838","#3a79b3"]},
 ocean:{name:"Oceano",c:["#0b6e8a","#1291b0","#2bb3c0","#0a4f73","#5ccfd6"]},
 sunset:{name:"Pôr do sol",c:["#d9534f","#e8973a","#f0c24b","#b8447a","#8e3b8f"]},
 forest:{name:"Floresta",c:["#2e7d4f","#4a9a5c","#7ab35a","#1f5c3a","#a3c764"]},
 candy:{name:"Doce",c:["#e85d9a","#6c8cff","#5fd1a5","#ffb347","#b180f0"]},
 mono:{name:"Monocromático",c:["#5b6674","#6c7886","#4c5662","#7d8896","#404953"]},
 dark:{name:"Escuro",c:["#2d3b4e","#33445a","#283546","#3b4e66","#223040"]},
 contrast:{name:"Alto contraste",c:["#000000","#1a1a8c","#8c1a1a","#1a6e1a","#6e4e00"]}
};
const SIZES=[[3,3],[3,4],[4,3],[4,4],[4,5],[5,4],[5,5],[5,6],[6,6],[7,7],[8,8],[10,10]];
const SHUF={easy:8,normal:30,hard:80,insane:200};
const MODE_NAMES={classic:"CLÁSSICO",snake:"COBRA",spiral:"ESPIRAL",fringe:"FRANJAS",hard:"DIFÍCIL",reverse:"INVERTIDO",columns:"COLUNAS",checker:"XADREZ"};
const $=s=>document.querySelector(s);
const defaults={mode:"classic",rows:4,cols:4,theme:"classic",shape:"round",shuffle:"normal",sound:true,vibe:true,anim:true,nums:true,multi:true};
let cfg=Object.assign({},defaults,JSON.parse(localStorage.getItem("sp_cfg")||"{}"));
let recs=JSON.parse(localStorage.getItem("sp_recs")||"{}");
let stats=JSON.parse(localStorage.getItem("sp_stats")||"{}");
let tops=JSON.parse(localStorage.getItem("sp_top")||"{}");
let lastId=localStorage.getItem("sp_lastId"),lastKey=localStorage.getItem("sp_lastKey");
Object.keys(recs).forEach(k=>{if(!tops[k])tops[k]=[{id:"m"+k,moves:recs[k].moves,time:recs[k].time,date:0}]});
let S={grid:[],goalPos:[],moves:0,t0:0,elapsed:0,running:false,paused:false,over:false,hist:[],started:false};
const save=()=>{
 localStorage.setItem("sp_cfg",JSON.stringify(cfg));localStorage.setItem("sp_recs",JSON.stringify(recs));
 localStorage.setItem("sp_stats",JSON.stringify(stats));localStorage.setItem("sp_top",JSON.stringify(tops));
 if(lastId){localStorage.setItem("sp_lastId",lastId);localStorage.setItem("sp_lastKey",lastKey)}else{localStorage.removeItem("sp_lastId");localStorage.removeItem("sp_lastKey")}
};

function pathFor(mode,R,C){
 const p=[];
 if(mode==="snake"){for(let r=0;r<R;r++){const cs=[...Array(C).keys()];if(r%2)cs.reverse();cs.forEach(c=>p.push(r*C+c))}}
 else if(mode==="spiral"){let t=0,b=R-1,l=0,rr=C-1;while(t<=b&&l<=rr){for(let c=l;c<=rr;c++)p.push(t*C+c);t++;for(let r=t;r<=b;r++)p.push(r*C+rr);rr--;if(t<=b){for(let c=rr;c>=l;c--)p.push(b*C+c);b--}if(l<=rr){for(let r=b;r>=t;r--)p.push(r*C+l);l++}}}
 else if(mode==="columns"){for(let c=0;c<C;c++)for(let r=0;r<R;r++)p.push(r*C+c)}
 else if(mode==="reverse"){for(let i=R*C-1;i>=0;i--)p.push(i)}
 else for(let i=0;i<R*C;i++)p.push(i);
 return p;
}
function tileColor(n){
 const c=THEMES[cfg.theme].c,{rows:R,cols:C,mode}=cfg,pos=S.goalPos[n];
 const r=Math.floor(pos/C),k=pos%C;
 if(mode==="fringe")return c[Math.min(r,k)%c.length];
 if(mode==="checker")return c[(r+k)%2?1:0];
 if(mode==="hard")return c[4%c.length];
 if(mode==="snake")return c[r%c.length];
 if(mode==="spiral")return c[Math.min(r,k,R-1-r,C-1-k)%c.length];
 if(mode==="columns")return c[k%c.length];
 return c[(Math.floor((n-1)/C))%c.length];
}
function newGame(){
 const {rows:R,cols:C,mode}=cfg,N=R*C,path=pathFor(mode,R,C);
 S.goalPos=new Array(N);S.grid=new Array(N).fill(0);
 path.forEach((cell,i)=>{if(i<N-1){S.grid[cell]=i+1;S.goalPos[i+1]=cell}});
 const empty=path[N-1];S.goalPos[0]=empty;S.grid[empty]=0;
 let steps=SHUF[cfg.shuffle]*Math.max(1,Math.round(N/4))*2,e=empty,prev=-1;
 for(let i=0;i<steps||isSolved();i++){
  const nb=neighbors(e).filter(x=>x!==prev),m=nb[Math.floor(Math.random()*nb.length)];
  S.grid[e]=S.grid[m];S.grid[m]=0;prev=e;e=m;
 }
 Object.assign(S,{moves:0,elapsed:0,running:false,paused:false,over:false,hist:[],started:false,t0:0});
 $("#overlay").classList.add("hidden");$("#pauseBtn").textContent="PAUSA";
 build();updateInfo();
}
function neighbors(i){const{rows:R,cols:C}=cfg,r=Math.floor(i/C),c=i%C,o=[];if(r>0)o.push(i-C);if(r<R-1)o.push(i+C);if(c>0)o.push(i-1);if(c<C-1)o.push(i+1);return o}
function isSolved(){return S.grid.every((v,i)=>v===0?i===S.goalPos[0]:S.goalPos[v]===i)}
function build(){
 const b=$("#board"),{rows:R,cols:C}=cfg;
 b.className="shape-"+cfg.shape;document.body.classList.toggle("noanim",!cfg.anim);
 b.innerHTML="";
 for(let n=1;n<R*C;n++){
  const d=document.createElement("div");d.className="tile";d.dataset.n=n;
  d.style.background=tileColor(n);
  if(cfg.nums&&cfg.mode!=="hard")d.textContent=n;
  b.appendChild(d);
 }
 layout();
}
function layout(){
 const{rows:R,cols:C}=cfg,gap=cfg.shape==="flat"?0:Math.max(2,Math.round(6-Math.max(R,C)/3));
 const b=$("#board"),W=b.clientWidth,H=b.clientHeight,pad=gap,cw=(W-pad*(C+1))/C,ch=(H-pad*(R+1))/R;
 const fs=Math.max(9,Math.min(cw,ch)*0.45);
 b.querySelectorAll(".tile").forEach(d=>{
  const n=+d.dataset.n,i=S.grid.indexOf(n),r=Math.floor(i/C),c=i%C;
  d.style.width=cw+"px";d.style.height=ch+"px";d.style.fontSize=fs+"px";
  d.style.transform=`translate(${pad+c*(cw+pad)}px,${pad+r*(ch+pad)}px)`;
 });
}
function tap(i){
 if(S.over||S.paused)return;
 const{cols:C}=cfg,e=S.grid.indexOf(0),r=Math.floor(i/C),c=i%C,er=Math.floor(e/C),ec=e%C;
 if(r!==er&&c!==ec)return;
 const dist=Math.abs(r-er)+Math.abs(c-ec);if(!dist)return;
 if(dist>1&&!cfg.multi)return;
 S.hist.push(S.grid.slice());
 const dr=Math.sign(r-er),dc=Math.sign(c-ec);let cr=er,cc=ec;
 while(cr!==r||cc!==c){const nr=cr+dr,nc=cc+dc;S.grid[cr*C+cc]=S.grid[nr*C+nc];cr=nr;cc=nc}
 S.grid[i]=0;
 if(!S.started){S.started=true;S.running=true;S.t0=performance.now()}
 S.moves++;feedback();layout();updateInfo();
 if(isSolved())win();
}
function feedback(){
 if(cfg.vibe&&navigator.vibrate)navigator.vibrate(12);
 if(cfg.sound)beep(420+Math.random()*60,.04);
}
let actx;function beep(f,d){try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=f;g.gain.value=.05;o.connect(g);g.connect(actx.destination);o.start();o.stop(actx.currentTime+d)}catch(e){}}
const key=()=>`${cfg.mode}_${cfg.rows}x${cfg.cols}`;
function fmt(ms){const t=Math.floor(ms/100),m=Math.floor(t/600),s=Math.floor(t/10)%60;return`${m}:${String(s).padStart(2,"0")}.${t%10}`}
function win(){
 S.over=true;S.running=false;S.elapsed=performance.now()-S.t0;
 const k=key(),r=recs[k]||{};let msg="";
 if(!r.moves||S.moves<r.moves){r.moves=S.moves;msg+="\nNovo recorde de movimentos!"}
 if(!r.time||S.elapsed<r.time){r.time=S.elapsed;msg+="\nNovo recorde de tempo!"}
 recs[k]=r;
 const entry={id:"g"+Date.now(),moves:S.moves,time:S.elapsed,date:Date.now()};
 const list=(tops[k]||[]).concat(entry).sort((a,b)=>a.moves-b.moves||a.time-b.time).slice(0,10);
 tops[k]=list;lastId=entry.id;lastKey=k;
 const pos=list.findIndex(x=>x.id===entry.id);
 if(pos>=0)msg+=`\n⭐ Entrou no Top 10: ${pos+1}º lugar`;
 const st=stats[k]||{games:0,moves:0,time:0};st.games++;st.moves+=S.moves;st.time+=S.elapsed;stats[k]=st;
 save();updateInfo();
 if(cfg.sound)[523,659,784].forEach((f,i)=>setTimeout(()=>beep(f,.15),i*120));
 const o=$("#overlay");o.textContent=`🎉 Resolvido!\n${S.moves} mov · ${fmt(S.elapsed)}${msg}`;o.classList.remove("hidden");
}
function updateInfo(){
 $("#moves").textContent=S.moves;$("#modeLabel").textContent=MODE_NAMES[cfg.mode]+" "+cfg.rows+"×"+cfg.cols;
 $("#time").textContent=fmt(S.elapsed);
}
setInterval(()=>{if(S.running&&!S.paused){S.elapsed=performance.now()-S.t0;$("#time").textContent=fmt(S.elapsed)}},100);

function pause(){
 if(S.over||!S.started)return;
 S.paused=!S.paused;const o=$("#overlay");
 if(S.paused){S.running=false;S.pausedAt=performance.now();o.textContent="⏸ PAUSADO\nToque em PAUSA para continuar";o.classList.remove("hidden");$("#pauseBtn").textContent="CONTINUAR"}
 else{S.t0+=performance.now()-S.pausedAt;S.running=true;o.classList.add("hidden");$("#pauseBtn").textContent="PAUSA"}
}
function undo(){if(S.over||S.paused||!S.hist.length)return;S.grid=S.hist.pop();S.moves++;layout();updateInfo()}
function peek(){
 if(S.over||S.paused)return;
 const tiles=[...document.querySelectorAll(".tile")];
 tiles.forEach(t=>{t.classList.add("peek");t.textContent=t.dataset.n});
 setTimeout(()=>tiles.forEach(t=>{t.classList.remove("peek");t.textContent=(cfg.nums&&cfg.mode!=="hard")?t.dataset.n:""}),1500);
}
function modal(html,init){const m=$("#modal"),c=$("#modalCard");c.innerHTML="";if(typeof html==="string")c.innerHTML=html;else c.appendChild(html);m.classList.remove("hidden");init&&init(c);c.querySelectorAll("[data-close]").forEach(b=>b.onclick=closeModal)}
function closeModal(){$("#modal").classList.add("hidden")}
$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
function settings(){
 modal(document.importNode($("#tplSettings").content,true),c=>{
  const sz=c.querySelector("#sSize");SIZES.forEach(([r,k])=>sz.add(new Option(`${r} × ${k}`,`${r}x${k}`)));
  const th=c.querySelector("#sTheme");Object.entries(THEMES).forEach(([k,v])=>th.add(new Option(v.name,k)));
  c.querySelector("#sMode").value=cfg.mode;sz.value=`${cfg.rows}x${cfg.cols}`;th.value=cfg.theme;
  c.querySelector("#sShape").value=cfg.shape;c.querySelector("#sShuffle").value=cfg.shuffle;
  c.querySelector("#sSound").checked=cfg.sound;c.querySelector("#sVibe").checked=cfg.vibe;
  c.querySelector("#sAnim").checked=cfg.anim;c.querySelector("#sNums").checked=cfg.nums;c.querySelector("#sMulti").checked=cfg.multi;
  c.querySelector("#verInfo").textContent=`v${APP_VERSION} — ${APP_DATE}`;
  c.querySelector("#applyBtn").onclick=()=>{
   const[r,k]=sz.value.split("x").map(Number);
   Object.assign(cfg,{mode:c.querySelector("#sMode").value,rows:r,cols:k,theme:th.value,shape:c.querySelector("#sShape").value,shuffle:c.querySelector("#sShuffle").value,
    sound:c.querySelector("#sSound").checked,vibe:c.querySelector("#sVibe").checked,anim:c.querySelector("#sAnim").checked,nums:c.querySelector("#sNums").checked,multi:c.querySelector("#sMulti").checked});
   save();closeModal();newGame();
  };
 });
}
const fmtDate=d=>d?new Date(d).toLocaleDateString("pt-BR")+" "+new Date(d).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}):"-";
const keyLabel=k=>{const[m,s]=k.split("_");return MODE_NAMES[m]+" "+s};
function top10Html(k){
 const list=tops[k]||[];
 const rows=list.map((e,i)=>`<tr class="${e.id===lastId?"hl":""}"><td>${e.id===lastId?"★ ":""}${i+1}º</td><td>${e.moves}</td><td>${fmt(e.time)}</td><td>${fmtDate(e.date)}</td></tr>`).join("")||'<tr><td colspan="4">Sem resultados ainda</td></tr>';
 return`<table><tr><th>#</th><th>Mov.</th><th>Tempo</th><th>Data</th></tr>${rows}</table>`;
}
function topBlock(sel,box){
 const keys=Object.keys(tops).sort();
 if(!keys.length){sel.classList.add("hidden");box.innerHTML="<p>Sem resultados ainda</p>";return}
 sel.innerHTML=keys.map(k=>`<option value="${k}">${keyLabel(k)}</option>`).join("");
 sel.value=keys.includes(lastKey)?lastKey:(keys.includes(key())?key():keys[0]);
 const draw=()=>box.innerHTML=top10Html(sel.value);sel.onchange=draw;draw();
}
function records(){
 modal(`<h2>Recordes - Top 10</h2><label>Modo / tamanho<select id="topSel"></select></label><div id="topBox"></div><div class="actions"><button class="btn red" id="clr">Apagar</button><button class="btn gray" data-close>Fechar</button></div>`,c=>{
  topBlock(c.querySelector("#topSel"),c.querySelector("#topBox"));
  c.querySelector("#clr").onclick=()=>{if(confirm("Apagar todos os recordes e estatísticas?")){recs={};stats={};tops={};lastId=null;lastKey=null;save();closeModal()}}});
}
function showStats(){
 const rows=Object.entries(stats).sort().map(([k,v])=>`<tr><td>${keyLabel(k)}</td><td>${v.games}</td><td>${Math.round(v.moves/v.games)}</td><td>${fmt(v.time/v.games)}</td></tr>`).join("")||'<tr><td colspan="4">Sem partidas ainda</td></tr>';
 modal(`<h2>Estatísticas</h2><table><tr><th>Modo</th><th>Jogos</th><th>Méd. mov.</th><th>Méd. tempo</th></tr>${rows}</table><h3>Top 10 melhores resultados</h3><label><select id="topSel"></select></label><div id="topBox"></div><div class="actions"><button class="btn gray" data-close>Fechar</button></div>`,c=>topBlock(c.querySelector("#topSel"),c.querySelector("#topBox")));
}
document.addEventListener("click",e=>{
 const a=e.target.closest("[data-act]");if(a){({new:newGame,settings,records,pause,undo,peek,stats:showStats})[a.dataset.act]();return}
 const t=e.target.closest(".tile");if(t)tap(S.grid.indexOf(+t.dataset.n));
});
let sx,sy;
$("#board").addEventListener("touchstart",e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
$("#board").addEventListener("touchend",e=>{
 const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
 if(Math.max(Math.abs(dx),Math.abs(dy))<30)return;
 const{cols:C}=cfg,eI=S.grid.indexOf(0),er=Math.floor(eI/C),ec=eI%C;let r=er,c=ec;
 if(Math.abs(dx)>Math.abs(dy))c+=dx>0?-1:1;else r+=dy>0?-1:1;
 if(r>=0&&r<cfg.rows&&c>=0&&c<cfg.cols)tap(r*C+c);
});
document.addEventListener("keydown",e=>{
 const{cols:C}=cfg,eI=S.grid.indexOf(0);let r=Math.floor(eI/C),c=eI%C;
 const m={ArrowUp:[1,0],ArrowDown:[-1,0],ArrowLeft:[0,1],ArrowRight:[0,-1]}[e.key];
 if(!m)return;r+=m[0];c+=m[1];if(r>=0&&r<cfg.rows&&c>=0&&c<cfg.cols)tap(r*C+c);
});
window.addEventListener("resize",layout);
document.addEventListener("visibilitychange",()=>{if(document.hidden&&S.running&&!S.paused)pause()});
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
newGame();
