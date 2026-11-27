/* R1357 보스 광폭화 오라 — Dots SW-R1352-D07 프레임 시트(16칸 반복, 4096×256, 칸 256, 알파 최대 144, 가운데 57px 비움).
 *  R205 광폭화(체력 30% 이하, 크기 +6%·능력치 +66%·초당 0.6% 재생 — 규칙은 R205 그대로)는 몸 뒤 바닥에 코드 붉은 타원(방사 그라데이션)을 그렸다.
 *  → 시트가 준비되면 그 타원 대신 이 시트를 몸 그림 바로 뒤(같은 그리기 순서에서 앞쪽)에 깐다. 판정·크기·능력치는 건드리지 않는다.
 *  · 기준점: 칸 (128,208) = 보스 발 가운데(불길 아래 끝), 불길 높이 139px 를 그린 몸 높이 × 1.1 에 맞춘다(가운데 빈 자리에 몸이 들어감).
 *  · 몸 높이는 drawEnemy 가 이번에 넣은 몸 그림 명령의 실제 테두리로 잰다(기록기). 몸 명령이 없으면 actorHeight×1.4 로 어림.
 *  · 12fps 반복(빈 칸 없음). 시트 자체 알파 ≤144(약 .56)라 반투명. R1357b(QA 1차 7.76 '광폭화가 한눈에 안 읽힘'): 진홍으로 돌리고(hue-rotate·saturate·brightness — 기록기 허용 필터)
 *    같은 칸을 알파 .35 로 한 번 더 겹쳐 불투명도 약 1.3배(최대 약 .69, 여전히 반투명).
 *  · 크기는 몸 그림(owner enemy:<id>) 칸의 보이는 테두리로 잼(바닥 고리 등 다른 owner 제외). 발록은 R1229 가 다시 놓는 키(영웅 키×2.04×1.66)로.
 *  · 기록기(ctx.commands)가 없으면 몸 그리기 전에 ctx.drawImage 로 직접 그린다.
 *  끄기: localStorage['storyworld.r1357']='{"on":false}' (R205 붉은 타원으로 돌아감). 점검: window.__STORYWORLD_ENRAGE_AURA_R1357__.inspect()
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_ENRAGE_AURA_R1357__)return;
const REV='R1357-enrage-aura-3',KEY='storyworld.r1357',SHEET='assets/r1357/boss-enrage-aura-d07-16.webp';
const N=16,CELL=256,FPS=12,PX=128,PY=208,FLAME_H=139,K_BODY=1.1,ALPHA=1,ALPHA2=.35,FILTER='hue-rotate(-12deg) saturate(3.4) contrast(1.2) brightness(1.1)';/* R1357b QA 1차(7.76): 연어·분홍빛 → 진홍, 같은 칸을 .35 로 한 번 더 겹쳐 불투명도 약 1.3배 */
/* 발록: R1229 가 렌더 단계에서 몸을 영웅 키 × 2.04(크게 켜면 × 1.66)로 다시 놓는다(motion-fx-r1229.js RATIO·BIG_K) → 오라도 그 키로 */
const BALROG_RATIO=2.04,BALROG_BIG=1.66;
const prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={drawn:0,direct:0,fallbackH:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:0;
const asked=new Map();
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;const im=r?.image;if(im&&(im.naturalWidth||im.width)>0)return im;
 const t=Date.now();if(t-(asked.get(p)||0)>1500&&typeof ensureImages==='function'){asked.set(p,t);Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
const enraged=e=>!!(e&&e.r205Enraged&&e.hp>0);
function r205On(){try{return window.__STORYWORLD_BOSS_R205__?.inspect?.()?.prefs?.enrage!==false;}catch(_){return true;}}
/* R205 가 붉은 타원을 그리기 전에 묻는다: 이 보스 오라를 R1357 이 그리면 true */
function covers(e){return prefs.on&&enraged(e)&&!!img(SHEET);}
const frameAt=t=>((Math.floor(t*FPS)%N)+N)%N;
/* 칸 안 보이는(알파>40) 위·아래·가운데 비율 — 그림·칸마다 한 번(R1229 frac 과 같은 방식). 캔버스가 없으면 null(사각형 그대로) */
const fracMemo=new Map();
function frac(im,sr){const k=(im?.src||'')+'|'+sr.join(',');if(fracMemo.has(k))return fracMemo.get(k);let f=null;
 try{const w=Math.max(1,Math.round(sr[2]/3)),h=Math.max(1,Math.round(sr[3]/3)),c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,sr[0],sr[1],sr[2],sr[3],0,0,w,h);
  const d=g.getImageData(0,0,w,h).data;let y0=h,y1=-1,x0=w,x1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>40){if(y<y0)y0=y;if(y>y1)y1=y;if(x<x0)x0=x;if(x>x1)x1=x;}
  if(y1>=y0)f={top:y0/h,bot:(y1+1)/h,cx:(x0+x1+1)/2/w};}catch(_){}
 fracMemo.set(k,f);if(fracMemo.size>400)fracMemo.delete(fracMemo.keys().next().value);return f;}
/* 이 보스 몸 그림(owner enemy:<id>) 중 가장 큰 것 — 바닥 고리·등급 표시 같은 다른 owner 는 빼고 잰다 */
function bboxOf(e,cs,from,to){const own='enemy:'+e.id;let best=null,bh=0;
 for(let i=from;i<to;i++){const c=cs[i];if(!c||c.kind!=='image'||!Array.isArray(c.points)||c.owner?.id!==own)continue;
  const xs=c.points.map(p=>p[0]),ys=c.points.map(p=>p[1]);if(!xs.concat(ys).every(Number.isFinite))continue;const h=Math.max(...ys)-Math.min(...ys);if(h>bh){bh=h;best={c,x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys),flip:c.points[1][0]<c.points[0][0]};}}
 if(!best)return null;const {c,x0,x1,y0,y1,flip}=best,f=Array.isArray(c.sourceRect)&&c.image?frac(c.image,c.sourceRect):null;
 if(!f)return {x:(x0+x1)/2,foot:y1,h:y1-y0,tpl:c};
 const cx=flip?x1-(x1-x0)*f.cx:x0+(x1-x0)*f.cx;return {x:cx,foot:y0+(y1-y0)*f.bot,h:(y1-y0)*(f.bot-f.top),tpl:c};}
function heroH(){try{const h=typeof actorHeight==='function'?Number(actorHeight()):60;return Number.isFinite(h)&&h>0?h:60;}catch(_){return 60;}}
/* 발록이면 R1229 가 다시 놓을 키 */
function balrogH(e){try{const M=window.__STORYWORLD_MOTION_FX_R1229__;if(!M?.isBalrog?.(e))return 0;const p=M.inspect?.()?.prefs||{};if(p.balrog===false)return 0;return BALROG_RATIO*heroH()*(p.balrogBig===false?1:BALROG_BIG);}catch(_){return 0;}}
function geo(cx,foot,h){const s=h*K_BODY/FLAME_H,x0=cx-PX*s,y0=foot-PY*s,w=CELL*s;return {s,x0,y0,w,pts:[[x0,y0],[x0+w,y0],[x0+w,y0+w],[x0,y0+w]]};}
function fallbackFoot(e){const q=project(e.x,e.y);stats.fallbackH++;return {x:q.x,foot:q.y,h:heroH()*1.4,tpl:null};}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){
 let use=false;try{use=covers(e)&&r205On()&&typeof project==='function';}catch(err){fail(err);}
 if(!use)return base.apply(this,arguments);
 const C=typeof ctx==='object'&&ctx?ctx:null,cs=C&&Array.isArray(C.commands)?C.commands:null,st=cs?cs.length:0,im=img(SHEET),fr=frameAt(T());
 if(!cs){/* 기록기 없음: 몸 앞에 직접 */try{const b=fallbackFoot(e),bh=balrogH(e),g=geo(b.x,b.foot,bh||b.h);C.save();C.globalAlpha=ALPHA;C.drawImage(im,fr*CELL,0,CELL,CELL,g.x0,g.y0,g.w,g.w);C.globalAlpha=ALPHA2;C.drawImage(im,fr*CELL,0,CELL,CELL,g.x0,g.y0,g.w,g.w);C.restore();stats.direct++;}catch(err){fail(err);}
  return base.apply(this,arguments);}
 let r;try{r=base.apply(this,arguments);}finally{try{const b=bboxOf(e,cs,st,cs.length)||fallbackFoot(e),bh=balrogH(e),g=geo(b.x,b.foot,bh||b.h),tpl=b.tpl||{};
  const mk=(al,tag)=>({...tpl,kind:'image',key:'r1357:aura'+tag+':'+e.id,image:im,sourcePath:SHEET,immutableTint:null,mutable:false,sourceRect:[fr*CELL,0,CELL,CELL],imageSize:[N*CELL,CELL],points:g.pts.map(p=>p.slice()),clips:[],
   owner:{...(tpl.owner||{}),id:'r1357:aura:'+e.id,kind:'effect',x:e.x,y:e.y,r1357:true},style:{...(tpl.style||{}),globalAlpha:al,globalCompositeOperation:'source-over',filter:FILTER},r1357Aura:fr});
  cs.splice(st,0,mk(ALPHA,''),mk(ALPHA2,':2'));
  stats.drawn++;}catch(err){fail(err);}}
 return r;};}
function set(p={}){if(typeof p.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_ENRAGE_AURA_R1357__=Object.freeze({revision:REV,sheet:SHEET,FPS,covers,frameAt,set,
 inspect:()=>({revision:REV,prefs:{...prefs},ready:!!img(SHEET),...stats,lastError})});
})();
