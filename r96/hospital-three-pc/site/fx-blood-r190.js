// R190 — 몹 피격·쓰러짐 피 튐(사용자 2026-11-01 "무료 CC0 자산 검증·통합, 피격 충격·몬스터 사망 이펙트 가독성 개선", "적대적 효과는 핏빛").
//  자산: OpenGameArt 'Animated particle effects #2'(para, CC0) 피 튐 시트 3장 → scripts/r190-oga-blood-import.py → assets/r190/blood/*.webp + index.json(출처·라이선스·sha256).
//  · 영웅이 몹을 때릴 때(hitEnemy 가 실제로 피해를 줬을 때) 맞은 몸 높이에 작은 피 튐 한 장(같은 몹 0.18초에 한 번), 쓰러질 때 바닥에 큰 피 터짐 한 장.
//  · 보통 섞기(빛 더하기 아님)라 화면을 하얗게 덮지 않는다. 동시에 최대 10개, 보스는 피 튐만 조금 크게. 판정·피해·소리는 그대로.
//  storyworld.r190.blood {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_BLOOD_R190__)return;
const REV='R190-blood-1',KEY='storyworld.r190.blood',DIR='assets/r190/blood/',MAX=10;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={hits:0,deaths:0,draws:0,skipped:0,errors:0};let lastError=null,meta=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
fetch(DIR+'index.json').then(r=>r.ok?r.json():null).then(j=>{meta=j?.effects||null;}).catch(fail);
/* 게임이 시작된 뒤 시트를 미리 받아 둔다(첫 피격 때 빈 프레임 방지) */(function warm(n){try{if(meta&&typeof started!=='undefined'&&started){for(const m of Object.values(meta))image(m.file);return;}}catch(_){}if(n<120)setTimeout(()=>warm(n+1),1000);})(0);
const asked=new Map();/* R163 image() 와 같이: 준비 안 됐으면 1.5초마다 다시 부탁 */
function image(f){const p=DIR+f;try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return row.image;const t=Date.now();if(t-(asked.get(p)||0)>1500){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
const T=()=>performance.now()/1000,H=()=>typeof actorHeight==='function'?actorHeight():60;
const list=[],last=new WeakMap(),SENT={type:'r190-blood',x:0,y:0,age:0,life:Infinity,r190Sentinel:true};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(e){fail(e);}}
function play(name,x,y,o={}){if(!prefs.on||!meta?.[name]||!Number.isFinite(x+y))return null;if(list.length>=MAX){stats.skipped++;return null;}const e={name,x,y,t0:T(),k:o.k||1,z:o.z||0,flip:!!o.flip,rot:o.rot||0,alpha:o.alpha??1,rate:o.rate||1};list.push(e);arm();return e;}
function drawAll(){if(typeof ctx==='undefined'||!ctx||typeof project!=='function')return;const t=T();
 for(let i=list.length-1;i>=0;i--){const e=list[i],m=meta?.[e.name];if(!m){list.splice(i,1);continue;}const fps=24*e.rate,f=Math.floor((t-e.t0)*fps);if(f>=m.frames){list.splice(i,1);continue;}
  const im=image(m.file);if(!im)continue;const q=project(e.x,e.y),[fw,fh]=m.frame,s=H()*e.k/fh,sx=(f%m.columns)*fw,sy=Math.floor(f/m.columns)*fh,fade=f>m.frames*.7?1-(f-m.frames*.7)/(m.frames*.3):1;
  ctx.save();try{const run=()=>{ctx.globalAlpha*=e.alpha*fade;ctx.translate(q.x,q.y-e.z);if(e.rot)ctx.rotate(e.rot);ctx.scale(e.flip?-s:s,s);ctx.drawImage(im,sx,sy,fw,fh,-m.pivot[0],-m.pivot[1],fw,fh);};
   /* R163 과 같이 three 기록기 범위(scope)로 묶어야 그려진다 */if(typeof ctx.scope==='function')ctx.scope({id:'r190:'+e.name+':'+e.t0,kind:'effect',x:e.x,y:e.y,r190:true},run);else run();stats.draws++;}catch(err){fail(err);}finally{ctx.restore();}}
 if(!list.length){try{const k=effects.indexOf(SENT);if(k>=0)effects.splice(k,1);}catch(_){}}}
try{if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e===SENT){try{drawAll();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}}catch(e){fail(e);}
/* 효과 정리기가 SENT 를 지워도 틱마다 다시 넣는다(R163 과 같음), 지역을 옮기면 비운다 */
try{if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{if(list.length)arm();}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){const r=await base.apply(this,a);list.length=0;return r;};}}catch(e){fail(e);}
try{if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,...a){const r=base.apply(this,[e,...a]);
  try{if(r&&prefs.on&&e&&Number.isFinite(e.x)){const now=T(),big=!!(e.boss||e.miniBoss);
    if(e.hp<=0){play('blood-death',e.x,e.y,{k:big?1.6:1.1,z:H()*.05,flip:Math.random()<.5,alpha:.92});stats.deaths++;}
    else if(now-(last.get(e)||0)>.18){last.set(e,now);play(Math.random()<.6?'blood-splash':'blood-burst',e.x,e.y,{k:big?.95:.62,z:H()*(big?.75:.5),flip:Math.random()<.5,rot:(Math.random()-.5)*.6,alpha:.9,rate:1.25});stats.hits++;}}}catch(err){fail(err);}
  return r;};}}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_BLOOD_R190__=Object.freeze({revision:REV,set,play,inspect:()=>({revision:REV,prefs:{...prefs},loaded:!!meta,active:list.length,stats:{...stats},lastError})});
})();
