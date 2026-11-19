// R1230 — 위치 고정 적(조형물·탑·제자리 원거리 몹)의 공격 모션 — 사용자 2026-11-19 "조형물들 위치고정 타워형몹및 적들 공격모션 2-3프레임정도는
//  있도록 일관성있게 발광을한다던가 해서 아니면 위에다가 프레임애니메이션이펙트를 얹어서 뭔가 모션이 있게 생동감있게".
//  대상(전수, qa/r1230/fixed-census.mjs): 엔진 R75 무리의 제자리 원거리 몹(r75Tower, 53지역 × 3), R170 피의 육망성 조형물·사몽 '세뇌당한 기억의 조각'·
//   R446 일곱 기둥(r170Tower), R251 발록의 소환진(r251Circle), R1229 소환진 검은기둥 등 stationary/turret/immobile 표시가 붙은 적.
//  모든 고정형에 같은 규칙 하나:
//   ① 몸 키프레임(발밑 기준 배율, 끊어지는 프레임): 충전 앞 절반 '모음'(가로 1.03·세로 .97) → 뒤 절반 '웅크림'(1.06·.93)
//      → 발사 0.12초 '뻗음'(.94·1.10) → 0.14초 '되돌림'(1.02·.985) → 제자리. 공격 한 번에 4프레임.
//   ② 발광: 충전하는 동안 몸 둘레 고유색 빛이 3단으로 차오르고(R106 glow), 발사 순간 한 번 번쩍.
//   ③ 프레임 이펙트: 몸 위에 충전 소용돌이 8칸 시트(assets/r1210/laser-charge8.webp, Dots MR-01)를 그 적의 고유색으로 물들여 충전 진행에 맞춰 넘기고,
//      발사 순간 마지막 칸이 1.5배로 커지며 사라진다.
//  공격 시점은 읽기만 한다: r170Tower.next/casts, r251Circle.next/casts, 엔진 rangedWindup·attack. 판정·피해·시간·위치·투사체는 건드리지 않는다.
//  끄기: localStorage['storyworld.r1230.fixedAttack']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_FIXED_ATTACK_R1230__)return;
const REV='R1230-fixed-attack-1',KEY='storyworld.r1230.fixedAttack';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={draws:0,charging:0,releases:0,sheets:0,glows:0,wraps:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:0;
const AH=()=>{try{const h=typeof actorHeight==='function'?Number(actorHeight()):60;return Number.isFinite(h)&&h>0?h:60;}catch(_){return 60;}};
const SPR=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s&&typeof s.on==='function'&&s.on()?s:null;};
const SHEET='assets/r1210/laser-charge8.webp',N=8,CELL=128,WARN=1.3,REL=.12,REC=.14;
const KEYS=Object.freeze({gather:[1.03,.97],crouch:[1.06,.93],release:[.94,1.10],recover:[1.02,.985]});
const fixed=e=>!!(e&&!e.hero&&(e.r75Tower||e.r170Tower||e.r446Pillar||e.r251Circle||e.stationary||e.turret||e.immobile));
const clamp01=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;

// ---- 공격 단계 읽기 ----------------------------------------------------------------------------
const st=new WeakMap();
function stOf(e){let s=st.get(e);if(!s){s={casts:null,was:false,relAt:-9,wind:0,atkAt:-9,lastT:-9};st.set(e,s);}return s;}
/* 충전 진행 0..1(충전 아님 = -1) */
function chargeOf(e,now){
 if(e.r170Tower){const t=e.r170Tower,left=Number(t.next)-now;let near=true;try{near=Math.hypot(player.x-e.x,player.y-e.y)<=11;}catch(_){}return near&&left>0&&left<=WARN?1-left/WARN:-1;}
 if(e.r251Circle){const t=e.r251Circle,left=Number(t.next)-now;let near=true;try{near=Math.hypot(player.x-e.x,player.y-e.y)<=11;}catch(_){}return near&&left>0&&left<=WARN?1-left/WARN:-1;}
 const s=stOf(e),w=Number(e.rangedWindup)||0;
 if(w>0){if(!(s.wind>0)||w>s.wind)s.wind=Math.max(w,.3);return clamp01(1-w/s.wind);}
 s.wind=0;
 if(e.attack&&!e.attack.storyWorldPose5){if(!s.was||s.atkAt<0)s.atkAt=now;return clamp01((now-s.atkAt)/.5);}
 return -1;}
function castsOf(e){return e.r170Tower?Number(e.r170Tower.casts)||0:e.r251Circle?Number(e.r251Circle.casts)||0:null;}
/* 지금 단계: {k:'gather'|'crouch'|'release'|'recover'|null,u,rel} */
function phase(e){const now=T(),s=stOf(e);if(!(e.hp>0))return{k:null};
 if(now<s.lastT-1){s.relAt=-9;s.was=false;}s.lastT=now;
 const c=castsOf(e);if(c!=null){if(s.casts!=null&&c>s.casts){s.relAt=now;stats.releases++;}s.casts=c;}
 const u=chargeOf(e,now),on=u>=0;
 if(c==null&&s.was&&!on){s.relAt=now;stats.releases++;}// 엔진 원거리·근접: 충전이 끝나는 순간이 발사
 s.was=on;
 const since=now-s.relAt;
 if(since>=0&&since<REL)return{k:'release',u:since/REL,rel:since};
 if(since>=REL&&since<REL+REC)return{k:'recover',u:(since-REL)/REC,rel:since};
 if(on){stats.charging++;return{k:u<.5?'gather':'crouch',u};}
 return{k:null};}

// ---- 색 ---------------------------------------------------------------------------------------
const BLOOD={a:[120,8,18],b:[255,96,96]};
function palOf(e){try{if(e.r170Tower?.pal)return e.r170Tower.pal.main||BLOOD;if(e.r251Circle)return BLOOD;const P=window.__STORYWORLD_COMBAT_R114__?.palette;const p=P?P(e):null;
  if(p&&Array.isArray(p.p)&&Array.isArray(p.gp))return{a:p.p,b:p.gp};}catch(err){fail(err);}return BLOOD;}
/* 회색빛 소용돌이 시트를 고유색으로: 밝기 → 어두운 주색 → 주색 → 발광색 → 흰색(R163 tint 와 같은 사다리). 16 단위로 묶어 캐시 24장. */
const tinted=new Map();
function sheetFor(F){let im=null;try{const r=typeof readyImage==='function'?readyImage(SHEET):null;im=r?.image||null;if(!im&&typeof ensureImages==='function')Promise.resolve(ensureImages([SHEET])).catch(()=>{});}catch(err){fail(err);}
 if(!im)return null;const q=c=>(c||[0,0,0]).map(v=>Math.max(0,Math.min(255,Math.round(v/16)*16))),A=q(F.a),B=q(F.b),key=A+'|'+B;let c=tinted.get(key);if(c)return c;
 try{const w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;if(!(w>0&&h>0))return null;c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);
  const d=g.getImageData(0,0,w,h),px=d.data;
  for(let i=0;i<px.length;i+=4){if(!px[i+3])continue;const l=Math.max(px[i],px[i+1],px[i+2])/255;let r,gg,b;
   if(l<.45){const k=l/.45;r=A[0]*(.35+.65*k);gg=A[1]*(.35+.65*k);b=A[2]*(.35+.65*k);}
   else if(l<.8){const k=(l-.45)/.35;r=A[0]+(B[0]-A[0])*k;gg=A[1]+(B[1]-A[1])*k;b=A[2]+(B[2]-A[2])*k;}
   else{const k=(l-.8)/.2;r=B[0]+(255-B[0])*k*.7;gg=B[1]+(255-B[1])*k*.7;b=B[2]+(255-B[2])*k*.7;}
   px[i]=r;px[i+1]=gg;px[i+2]=b;}
  g.putImageData(d,0,0);c.__storyworldStaticTint=true;c.__r1230Sheet='r1230:'+key;
  if(tinted.size>=24)tinted.delete(tinted.keys().next().value);tinted.set(key,c);}catch(err){fail(err);return null;}return c;}

// ---- 크기 -------------------------------------------------------------------------------------
function bodyH(e){const z=typeof zoom==='number'&&Number.isFinite(zoom)?zoom:1;
 if(e.r170Tower)return Math.max(20,(Number(e.r170Tower.h)||90)*z);
 if(e.r251Circle)return AH()*.6;
 return AH()*(e.boss?1.5:e.midboss?1.25:.85);}

// ---- 그리기 -----------------------------------------------------------------------------------
function overlay(e,ph,q,h){const F=palOf(e),S=SPR(),cy=q.y-h*(e.r251Circle?.35:.62);
 if(ph.k==='gather'||ph.k==='crouch'){const step=ph.k==='gather'?(ph.u<.25?0:1):(ph.u<.8?2:3),glow=[.22,.34,.5,.7][step];
  if(S){S.draw('glow',F,q.x,cy,h*(.9+.15*step),h*(.55+.1*step),{alpha:glow});stats.glows++;}
  const sh=sheetFor(F);if(sh){const fr=Math.min(N-1,Math.floor(ph.u*(N-.01))),sz=h*(.42+.3*ph.u);ctx.save();try{ctx.globalAlpha*=.62+.38*ph.u;ctx.drawImage(sh,fr*CELL,0,CELL,CELL,q.x-sz/2,cy-sz/2,sz,sz);}finally{ctx.restore();}stats.sheets++;}}
 else if(ph.k==='release'||ph.k==='recover'){const v=clamp01(ph.rel/(REL+REC)),a=1-v;
  if(S&&ph.k==='release'){S.draw('glow',F,q.x,cy,h*1.6,h*.95,{alpha:.85*a});stats.glows++;}
  const sh=sheetFor(F);if(sh){const fr=ph.k==='release'?N-1:N-2,sz=h*.72*(1+.8*v);ctx.save();try{ctx.globalAlpha*=a;ctx.drawImage(sh,fr*CELL,0,CELL,CELL,q.x-sz/2,cy-sz/2,sz,sz);}finally{ctx.restore();}stats.sheets++;}}}
function drawFixed(base,self,e,a){const ph=phase(e);if(!ph.k)return base.apply(self,[e,...a]);
 let q;try{q=project(e.x,e.y);}catch(err){fail(err);return base.apply(self,[e,...a]);}
 if(!q||!Number.isFinite(q.x)||!Number.isFinite(q.y))return base.apply(self,[e,...a]);
 const [sx,sy]=KEYS[ph.k],h=bodyH(e);let out;stats.draws++;
 ctx.save();try{ctx.translate(q.x,q.y);ctx.scale(sx,sy);ctx.translate(-q.x,-q.y);out=base.apply(self,[e,...a]);}finally{ctx.restore();}
 try{const f=()=>overlay(e,ph,q,h);if(typeof ctx.scope==='function')ctx.scope({id:'r1230:fx:'+e.id,kind:'effect',x:e.x,y:e.y},f);else f();}catch(err){fail(err);}
 return out;}

// ---- 설치: drawEnemy 맨 바깥(다른 덧씌우기가 나중에 다시 감싸면 0.7초마다 다시, 안쪽 사본은 busy 로 그냥 지나간다) ----
let mine=null,busy=false;
/* 다른 덧씌우기처럼 표시(__r1230)로 본다 — 감싼 함수에 안쪽 표시(__r981·__r764m 등)를 옮겨 적어, 서로 '내가 맨 바깥 아님'으로 번갈아 다시 감싸며 사슬이 자라지 않게 */
function wrap(){if(typeof drawEnemy!=='function'||drawEnemy===mine||drawEnemy.__r1230)return;if(stats.wraps>=16)return;const base=drawEnemy;
 const w=function(e,...a){if(busy||!prefs.on||!fixed(e))return base.apply(this,[e,...a]);busy=true;try{return drawFixed(base,this,e,a);}catch(err){fail(err);return base.apply(this,[e,...a]);}finally{busy=false;}};
 try{for(const k of Object.keys(base))if(!(k in w))w[k]=base[k];}catch(_){}w.__r1230=true;try{drawEnemy=w;mine=w;stats.wraps++;}catch(err){fail(err);}}
try{wrap();setInterval(wrap,700);}catch(err){fail(err);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_FIXED_ATTACK_R1230__=Object.freeze({revision:REV,set,fixed,phase:e=>{try{return phase(e);}catch(err){fail(err);return{k:null};}},keys:KEYS,sheet:SHEET,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},tinted:tinted.size,lastError})});
})();
