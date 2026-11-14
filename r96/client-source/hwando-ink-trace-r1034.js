// R1034b 환도 수묵 검흔 — 사용자 2026-11-14 14:50Z "환도수묵화감성 많이살려줘 검흔".
//  환도가 벤 자리에 먹 붓 획(Dots CX-0086HI HI-07 assets/r945/hwando-ink-sweep.webp, 한지 흰 테두리를 구워 넣은 16칸 시트)을 남긴다.
//  붓이 그어지며(1~6칸) 머물렀다가(7~12칸) 먹이 갈라져 흩어진다(13~16칸) — 시트 한 바퀴가 검흔 한 번.
//  ① 기본 공격: 휘두름이 나간 순간 조준한 적(없으면 3.4칸 안 가장 가까운 적)을 비스듬히 가로지르는 획 한 줄(영웅→적 방향에 거의 수직, 번갈아 기울기).
//  ② W 월섬 회천(R348): 원 안 정십자가와 분신마다의 정십자가 자리에 먹 세로 획·가로 획을 은빛 칼 아래에 깐다.
//     R348 과 같은 비율(교차점이 위에서 33.85%, 가로 반폭 0.667·arm) — 똑바른 십자만(회전은 0°·90° 뿐, 역십자 없음).
//     분신 자리·시각은 R348 inspect() 를 읽어 따른다(R348 이 없으면 원 안 십자만).
//  그림만 — 피해·판정·쿨다운·키는 건드리지 않는다. 세 모드 공유. 렉: 동시 검흔 10(저사양 5), 할 일이 없으면 표지를 effects 에서 뺀다.
//  필터 없음(시트 그대로, Three.js 기록기 안전). 검흔 명령은 R350 영웅 가림에서 뺀다(owner.r350) — 영웅 몸과 겹친 붓 획이 옅어지지 않게.
//  끄기: localStorage['storyworld.r1034.inkTrace']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_HWANDO_INK_TRACE_R1034__)return;
const REV='R1034-hwando-ink-trace-1',KEY='storyworld.r1034.inkTrace';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const SWEEP=Object.freeze({path:'assets/r945/hwando-ink-sweep.webp',cw:512,ch:128,cols:4,frames:16,pivot:[20,70],len:334});
const CFG=Object.freeze({max:10,maxLow:5,fps:16,atkLen:3.2,atkTilt:.42,atkSy:1.15,crossSy:1.2,wFps:24,lift:.42});
const fin=v=>typeof v==='number'&&Number.isFinite(v),clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const T=()=>typeof time==='number'?time:0;
const H=()=>typeof actorHeight==='function'?actorHeight():60;
const unit=()=>(typeof TILE==='number'?TILE:32)*(typeof zoom==='number'?zoom:1);
const low=()=>!!(typeof settings!=='undefined'&&settings?.lowFx)||!!window.__STORYWORLD_MOBILE_PERF_R298__?.inspect?.().mobile;
const P=()=>{try{return typeof player!=='undefined'?player:null;}catch(_){return null;}};
const isHw=p=>!!p&&p.hero==='hwando'&&p.hp>0;
const W348=()=>window.__STORYWORLD_HWANDO_W_CROSS_R348__||null;
const stats={attack:0,wCasts:0,wMain:0,wClone:0,draws:0,frames:0,capped:0};let errors=0,lastError=null;const fail=e=>{errors++;lastError=String(e?.message||e).slice(0,200);};
let lastSegs=[];
// ---- 시트 ----
const asked=new Map();
function sheet(){try{const got=typeof readyImage==='function'?readyImage(SWEEP.path):null;if(got?.image)return got.image;const t=Date.now();if(t-(asked.get(SWEEP.path)||0)>1500){asked.set(SWEEP.path,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([SWEEP.path])).catch(()=>{});}}catch(e){fail(e);}return null;}
function cell(im,fr,x,y,ang,sc,sy,alpha,flip){if(!im||!(sc>0)||!fin(x)||!fin(y)||!fin(ang))return false;fr=clamp(Math.floor(fr),0,SWEEP.frames-1);ctx.save();
 try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=clamp(alpha,0,1);ctx.translate(x,y);if(ang)ctx.rotate(ang);ctx.scale(sc,sc*sy*(flip?-1:1));
  ctx.drawImage(im,(fr%SWEEP.cols)*SWEEP.cw,Math.floor(fr/SWEEP.cols)*SWEEP.ch,SWEEP.cw,SWEEP.ch,-SWEEP.pivot[0],-SWEEP.pivot[1],SWEEP.cw,SWEEP.ch);stats.draws++;}catch(e){fail(e);}finally{ctx.restore();}return true;}
// ---- 검흔 목록 ----
//  {k:'atk', x,y(적 월드), ang(화면 각), flip, t0}  ·  {k:'w', id, x,y, t0, clones:Set(이미 받은 분신 자리)}
const marks=[];const seenW=new Set();
const SENT={type:'r1034-hwando-ink-trace',x:0,y:0,age:0,life:Infinity,r1034Sentinel:true};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;
  /* R348 은빛 칼 아래에 깔리도록 R348 표지 앞에 넣는다 */const i=effects.findIndex(e=>e&&e.r348Sentinel);if(i>=0)effects.splice(i,0,SENT);else effects.push(SENT);}}catch(_){}}
function disarm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(_){}}
function cap(){const m=low()?CFG.maxLow:CFG.max;while(marks.length>m){marks.shift();stats.capped++;}}
let flipSeq=0;
function addAttack(p,e){if(!fin(e?.x)||!fin(e?.y)||!fin(p?.x)||!fin(p?.y)||typeof project!=='function')return;
 const a=project(p.x,p.y),b=project(e.x,e.y);let ang=Math.atan2(b.y-a.y,b.x-a.x);if(!fin(ang))ang=0;flipSeq^=1;
 // 영웅→적 방향에 수직에 가깝게 비스듬히(번갈아 ±), 화면에서 내려긋는 획
 ang=ang+Math.PI/2+(flipSeq?CFG.atkTilt:-CFG.atkTilt);if(Math.sin(ang)<0)ang+=Math.PI;
 marks.push({k:'atk',x:e.x,y:e.y,ang,flip:!!flipSeq,t0:T(),life:SWEEP.frames/CFG.fps});stats.attack++;cap();arm();}
function addW(x,y,id){if(seenW.has(id))return;seenW.add(id);if(seenW.size>64)seenW.delete(seenW.values().next().value);
 const C=W348()?.config||{};marks.push({k:'w',id,x,y,t0:T(),life:Math.max(1.6,(C.cloneIn||.2)+(C.hold||.7)+SWEEP.frames/CFG.wFps+.1)});stats.wCasts++;cap();arm();}
// ---- 그리기 ----
const BAR_UP=1-2*.3385,BAR_HALF=256/384;
// 정십자가 먹 획: 세로(위→아래) 먼저, 가로(왼→오른) 0.06초 뒤. 회전은 90°·0° 뿐.
function crossInk(im,cx,cy,arm,age,segs,al){const by=cy-arm*BAR_UP,hw=arm*BAR_HALF;
 const V={x0:cx,y0:cy-arm,x1:cx,y1:cy+arm},Hh={x0:cx-hw,y0:by,x1:cx+hw,y1:by};
 for(const [k,s] of [[0,V],[1,Hh]]){const f=(age-k*.06)*CFG.wFps;if(f<0||f>=SWEEP.frames)continue;const L=Math.hypot(s.x1-s.x0,s.y1-s.y0),ang=k?0:Math.PI/2;
  if(cell(im,f,s.x0,s.y0,ang,L/SWEEP.len,CFG.crossSy,al,false))segs.push(s);}}
function draw(){const im=sheet();if(!im||typeof project!=='function')return;const t=T(),h=H(),u=unit(),segs=[];stats.frames++;
 const cm=typeof ctx!=='undefined'&&Array.isArray(ctx?.commands)?ctx.commands:null,n0=cm?cm.length:0;
 for(const m of marks){const age=t-m.t0;if(age<0)continue;
  if(m.k==='atk'){const f=age*CFG.fps;if(f>=SWEEP.frames)continue;const q=project(m.x,m.y);if(!q||!fin(q.x)||!fin(q.y))continue;
   const L=CFG.atkLen*u,cx=q.x,cy=q.y-h*CFG.lift,x0=cx-Math.cos(m.ang)*L/2,y0=cy-Math.sin(m.ang)*L/2;
   if(cell(im,f,x0,y0,m.ang,L/SWEEP.len,CFG.atkSy,1,m.flip))segs.push({x0,y0,x1:x0+Math.cos(m.ang)*L,y1:y0+Math.sin(m.ang)*L});}
  else{const W=W348(),C=W?.config||{},q=project(m.x,m.y);if(!q||!fin(q.x)||!fin(q.y))continue;
   const ringPx=(fin(C.ringCell)?C.ringCell:115/384*10)*u;crossInk(im,q.x,q.y-h*.3,ringPx*.97,age,segs,.95);
   // 분신 자리: R348 이 그 시전에 정한 자리(cast id 로 찾음), 분신 베기 시각 = 등장 0.2 + 서 있기 0.7
   let cast=null;try{cast=(W?.inspect?.().casts||[]).find(c=>c&&c.id===m.id)||null;}catch(e){fail(e);}
   if(cast&&Array.isArray(cast.clones)){if(!m.spots)m.spots=[];for(const s of cast.clones)if(fin(s?.x)&&fin(s?.y)&&!m.spots.some(o=>o.x===s.x&&o.y===s.y))m.spots.push({x:s.x,y:s.y});}
   const sAge=age-((C.cloneIn??.2)+(C.hold??.7));if(sAge>=0&&m.spots)for(const s of m.spots){const g=project(s.x,s.y);if(!g||!fin(g.x)||!fin(g.y))continue;const n=segs.length;
    crossInk(im,g.x,g.y-h*.45,(fin(C.splash)?C.splash:1.5)*u*.95,sAge,segs,.92);if(segs.length>n&&!m.counted){m.counted=true;stats.wClone++;}}
   if(age<.6&&!m.mainCounted){m.mainCounted=true;stats.wMain++;}}}
 if(cm)for(let i=n0;i<cm.length;i++){const c=cm[i];if(c&&c.owner)c.owner={...c.owner,r350:true,r1034Ink:true};}
 lastSegs=segs;}
// ---- 설치 ----
// 기본 공격 성공 = attackCD 가 0 에서 올라감(R945 와 같은 감지). 엔진 안쪽 hitEnemy 는 전역 감싸기를 안 타므로(헤드리스 실측) 맞은 적은
//  조준 대상(target)이 손닿는 곳(3.4칸)이면 그것, 아니면 가장 가까운 3.4칸 안 적으로 본다.
const REACH=3.4;
function victim(p){const ok=e=>e&&e.hp>0&&fin(e.x)&&fin(e.y)&&Math.hypot(e.x-p.x,e.y-p.y)<=REACH+(e.radius||0);
 try{if(typeof target!=='undefined'&&ok(target))return target;}catch(_){}
 let b=null,bd=1e9;try{for(const e of (typeof liveEnemies==='function'?liveEnemies():[])){if(!ok(e))continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<bd){bd=d;b=e;}}}catch(e){fail(e);}return b;}
try{
 if(typeof basicAttack==='function'){const base=basicAttack;basicAttack=function(...a){const p=P();if(!on||!isHw(p))return base.apply(this,a);const cd0=p.attackCD,r=base.apply(this,a);
   try{if(!(cd0>0)&&p.attackCD>0&&P()===p){const e=victim(p);if(e)addAttack(p,e);}}catch(e){fail(e);}return r;};}
 if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt){const r=base.apply(this,arguments);
  try{const o=opt||{};if(on&&type==='storySourceSkill'&&o.storyWER&&o.stage==='release'&&o.sourceHero==='hwando'&&String(o.sourceSlot)==='w'&&o.castId!=null&&fin(x)&&fin(y)&&isHw(P()))addW(x,y,o.castId);}catch(e){fail(e);}return r;};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e===SENT){try{if(on&&marks.length)draw();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{const t=T();for(let i=marks.length-1;i>=0;i--){const m=marks[i];if(t-m.t0>m.life||t<m.t0-1)marks.splice(i,1);}
   if(marks.length)arm();else disarm();}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){marks.length=0;disarm();return base.apply(this,a);};}
 try{if(typeof ensureImages==='function')Promise.resolve(ensureImages([SWEEP.path])).catch(()=>{});}catch(_){}
}catch(e){fail(e);}
function set(v){on=v!==false;if(!on){marks.length=0;disarm();}try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_HWANDO_INK_TRACE_R1034__=Object.freeze({revision:REV,config:CFG,sheet:SWEEP,on:()=>on,set,
 inspect:()=>({revision:REV,on,live:marks.length,stats:{...stats},errors,lastError,lastSegs:lastSegs.map(s=>({...s})),marks:marks.map(m=>({k:m.k,age:+(T()-m.t0).toFixed(3)}))})});
})();
