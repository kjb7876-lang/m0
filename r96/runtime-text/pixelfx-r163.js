// R163 — pixelfx(patch-gg/pixelfx, MIT) 이펙트 시트 재생기(사용자 2026-10-31 "불·폭발·…·아이템 획득·화면 전환 등 20가지 … 이것도 개선 활용").
//  scripts/r163-pixelfx-sheets.py 가 pixelfx 의 render.mjs --sheet 로 뽑아 assets/r163/pixelfx/<이름>.webp + index.json(출처 커밋·효과 id·팔레트·
//  칸 크기·기준점·sha256)으로 둔 시트를, 지정한 바닥 자리(기준점 = 효과의 바닥 중심)에 15장/초로 한 번(또는 반복) 재생한다.
//  쓰는 곳(각 파일에서 window.__STORYWORLD_PIXELFX_R163__.play 를 부른다):
//   · 사몽 보스 촉수 패턴 → 핏빛 촉수(tendrils-blood), 운석 패턴 → 운석 낙하·폭발(meteor), 분신 돌진 끝 → 핏빛 어둠 폭발(samong-play-r162)
//   · B 광장 중간보스 등장 → 핏빛 손(hands-blood)(samong-r103) · 단서조각 줍기 → 반짝 모임(collect-burst)
//   · 기본공격 5연타 폭발 → 치명타(crit-hit)(combat-r160) · 정화의 코어 → 청록 빛구슬(core-orb-teal, 반복), 코어 피격 → 번쩍(hit-flash)
//  그림이 아직 안 받아졌으면 조용히 건너뛰고(각 호출 쪽의 원래 그림이 남는다), 판정·피해·저장은 건드리지 않는다. storyworld.r163.pixelfx {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_PIXELFX_R163__)return;
const REV='R163-pixelfx-1',KEY='storyworld.r163.pixelfx',DIR='assets/r163/pixelfx/',MAX=64;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={plays:0,drawn:0,skipped:0,errors:0,loaded:0};let lastError=null,meta=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'?time:0;
const H=()=>typeof actorHeight==='function'?actorHeight():60;
fetch(DIR+'index.json').then(r=>r.ok?r.json():null).then(j=>{meta=j?.effects||null;}).catch(fail);
const asked=new Map();
function image(name){const p=DIR+(meta?.[name]?.file||name+'.webp');try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image){if(!asked.get(p+':ok')){asked.set(p+':ok',1);stats.loaded++;}return row.image;}const t=Date.now();if(t-(asked.get(p)||0)>1500){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
function warm(names){for(const n of names)image(n);}
const list=[],SENT={type:'r163-pixelfx',x:0,y:0,age:0,life:Infinity,r163Sentinel:true};
// R175: tint {a,b} — 회색으로 뽑은 시트를 그 몹의 고유색(a)·보조색/발광색(b)으로 물들인다(R106 스프라이트와 같은 밝기 → 어두운 주색 → 주색 → 보조색 → 흰색).
//  물들인 시트는 바뀌지 않는 캔버스(__storyworldStaticTint)라 three 렌더러가 한 번만 올린다. 색은 16 단위로 묶어 캐시(최대 40장).
const tinted=new Map();
function tintedSheet(name,im,t){const q=c=>(c||[0,0,0]).map(v=>Math.max(0,Math.min(255,Math.round(v/16)*16))),A=q(t.a),B=q(t.b),key=name+'|'+A+'|'+B;let c=tinted.get(key);if(c)return c;
 try{const w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);const d=g.getImageData(0,0,w,h),px=d.data,D=A.map(v=>v*.35);
  for(let i=0;i<px.length;i+=4){if(!px[i+3])continue;const l=(px[i]*.3+px[i+1]*.59+px[i+2]*.11)/255;let r,gg,b;
   if(l<.5){const k=l/.5;r=D[0]+(A[0]-D[0])*k;gg=D[1]+(A[1]-D[1])*k;b=D[2]+(A[2]-D[2])*k;}else if(l<.85){const k=(l-.5)/.35;r=A[0]+(B[0]-A[0])*k;gg=A[1]+(B[1]-A[1])*k;b=A[2]+(B[2]-A[2])*k;}else{const k=(l-.85)/.15;r=B[0]+(255-B[0])*k*.6;gg=B[1]+(255-B[1])*k*.6;b=B[2]+(255-B[2])*k*.6;}
   px[i]=r;px[i+1]=gg;px[i+2]=b;}
  g.putImageData(d,0,0);c.__storyworldStaticTint=true;}catch(e){fail(e);return im;}
 tinted.set(key,c);if(tinted.size>40)tinted.delete(tinted.keys().next().value);stats.tinted=(stats.tinted||0)+1;return c;}
// play(이름, 바닥 x, y, {h: 화면에서의 키(px, 기본 영웅 키 배수 k), k, delay(초), rate(재생 속도), alpha, flip, loop, key(같은 key 는 하나만), z(띄움 px)})
function play(name,x,y,o={}){if(!prefs.on||!meta?.[name]||!Number.isFinite(x+y))return null;image(name);
 if(o.key){const old=list.find(e=>e.key===o.key);if(old){old.x=x;old.y=y;if(o.until)old.until=o.until;return old;}}
 if(list.length>=MAX)list.shift();const e={name,x,y,t0:T()+(o.delay||0),rate:o.rate||1,k:o.k||1,h:o.h||0,alpha:o.alpha??1,flip:!!o.flip,loop:o.loop??!!meta[name].loop,key:o.key||null,z:o.z||0,until:o.until||0,tint:o.tint||null};list.push(e);stats.plays++;arm();return e;}
function stop(key){for(let i=list.length-1;i>=0;i--)if(list[i].key===key)list.splice(i,1);}
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function drawAll(){if(typeof ctx==='undefined'||!ctx||typeof project!=='function')return;const t=T();
 for(const e of list){const m=meta?.[e.name];if(!m)continue;const age=(t-e.t0)*e.rate;if(age<0)continue;const n=m.frames;let fr=Math.floor(age*m.fps);if(e.loop)fr%=n;else if(fr>=n)continue;
  const raw=image(e.name);if(!raw){stats.skipped++;continue;}const im=e.tint?tintedSheet(e.name,raw,e.tint):raw;const[fw,fh]=m.frame,[px,py]=m.pivot,want=e.h||H()*e.k*1.9,s=want/fh,q=project(e.x,e.y),sx=(fr%m.columns)*fw,sy=Math.floor(fr/m.columns)*fh;
  ctx.save();try{const run=()=>{ctx.globalAlpha*=e.alpha;ctx.translate(q.x,q.y-e.z);ctx.scale(e.flip?-s:s,s);ctx.drawImage(im,sx,sy,fw,fh,-px,-py,fw,fh);};
   if(typeof ctx.scope==='function')ctx.scope({id:'r163:'+e.name+':'+e.t0,kind:'effect',x:e.x,y:e.y,r163:true},run);else run();stats.drawn++;}catch(err){fail(err);}finally{ctx.restore();}}}
try{
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r163-pixelfx'){try{drawAll();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{const t=T();for(let i=list.length-1;i>=0;i--){const e=list[i],m=meta?.[e.name];if(!m){list.splice(i,1);continue;}
    if(e.until&&t>e.until){list.splice(i,1);continue;}if(!e.loop&&(t-e.t0)*e.rate*m.fps>=m.frames)list.splice(i,1);}
   if(list.length)arm();else if(typeof effects!=='undefined'){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){const r=await base.apply(this,a);list.length=0;return r;};}
}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_PIXELFX_R163__=Object.freeze({revision:REV,dir:DIR,set,play,stop,warm,ready:()=>!!meta,has:n=>!!meta?.[n],meta:()=>meta,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},active:list.map(e=>e.name),ready:!!meta,lastError})});
})();
