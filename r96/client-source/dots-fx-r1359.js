/* R1359 Dots SW-R1352 D08 몹 사망 연기·재 + D09 영웅 피격 (코디네이터 배정 2026-11-27).
 *  D08: R462 15세 '어둠·재로 소멸'(R1054)이 몹 몸 위에 그리던 R108 eden smoke(검게 물들인 16칸)를 Dots 재 구름 16칸 시트로 바꾼다.
 *   · 크기 3종(작은·중간·보스판)을 몸 키(줌 1 기준 look.h)로 고른다: <62 작은, <120 중간, 그 위 보스판(R462 는 보스·중간보스 죽음을 맡지 않으므로 큰 일반 몹용).
 *   · 각 판의 구름 가로(가장 넓은 칸 ≈ 55·90·140px)가 몸 키의 약 1.15배(vis 48·78·122). 색: 밝기 .78·채도 .7·대비 1.15(QA 1차 7.66: .95 는 밝은 회갈 바닥과 같은 톤이라 안 읽힘. 더 검게 누르면 어두운 바닥에서 사라지고 원래 R108 검은 연기와 같아짐). 칸 기준 (128,128) = 몸 아래쪽 가운데(발에서 키 .38 위).
 *   · R462 sheet() 로 그린다(재생 시간·투명·사라짐·재 조각은 R462 그대로). 시트를 아직 못 받았으면 예전 R108 연기.
 *  D09: 영웅이 근접 기본 공격이 아닌 것(투사체·스킬·보스 패턴)에 실제로 맞았을 때 영웅 가슴에 Dots 피격 8칸(R163 hit-flash 치비 그림 대체 요청분).
 *   · 근접 기본 공격은 R169 돌·R1340 할퀴기·작은 타격이 이미 맡으므로 그리지 않는다. 출처 없는 피해(도트·환경)·안 맞음(무적·막음·회피)도 안 그림.
 *   · R163 pixelfx 표에 한 줄(r1359/hero-hit-8f.webp, 8칸 16fps 1회)로 넣고 play — 이름에 'mob'(R350 이 영웅 몸 위 이펙트를 85% 옅게 하지 않게, R1340 과 같음).
 *   · 이펙트 층이 영웅 몸보다 먼저 그려져 몸 한가운데에 두면 몸에 가린다(헤드리스 큰 장면) → 맞은 쪽(출처 방향) 몸 가장자리로 .4칸, 높이 키 .55, 알파 .95, 시트는 Dots 원본 RGB×1.25(알파 그대로, QA 1차: 어두운 적갈이라 영웅 몸 위에서 안 읽힘), 출처 쪽으로 좌우, .3초에 한 번. 판정·피해·경직은 그대로(그림만).
 *  끄기: localStorage['storyworld.r1359']='{"on":false}'. 점검: window.__STORYWORLD_DOTS_FX_R1359__.inspect()
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_DOTS_FX_R1359__)return;
const REV='R1359-dots-fx-1',KEY='storyworld.r1359';
const ASH=Object.freeze({small:{p:'assets/r1359/death-ash-small-16.webp',vis:48},medium:{p:'assets/r1359/death-ash-medium-16.webp',vis:78},boss:{p:'assets/r1359/death-ash-boss-16.webp',vis:122}});
const ASH_SMALL=62,ASH_MED=120,ASH_LIFT=.38,ASH_FILTER='brightness(.78) saturate(.7) contrast(1.15)';
const HIT='mob-r1359-herohit',HIT_ROW=Object.freeze({file:'r1359/hero-hit-8f.webp',frame:[256,256],pivot:[128,128],columns:8,frames:8,fps:16,loop:false,r1359:'Dots SW-R1352-D09 영웅 피격 8칸'});
const HIT_K=1.3,HIT_Z=.55,HIT_SIDE=.4,HIT_ALPHA=.95,HIT_GAP=.3;/* 헤드리스: k .8·알파 .6 은 영웅 몸(밝은 테두리) 위에서 거의 안 보임(그림 평균색 135,81,66 어두운 적갈) → 가로 약 영웅 키 .78, 알파 .8 */
const prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={ash:{small:0,medium:0,boss:0},hits:0,meleeSkip:0,noSource:0,notHit:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>{try{return typeof time==='number'&&Number.isFinite(time)?time:0;}catch(_){return 0;}};
const H=()=>{try{const h=typeof actorHeight==='function'?Number(actorHeight()):60;return Number.isFinite(h)&&h>0?h:60;}catch(_){return 60;}};
const fin=(v,d=0)=>Number.isFinite(v)?v:d;
/* D08: R462 drawDyingAsh 가 묻는다 — 몸 키(줌 1)에 맞는 시트 정의. 끄면 null(예전 R108 연기) */
function ash(h){if(!prefs.on)return null;try{const v=!(h>=ASH_SMALL)?'small':h<ASH_MED?'medium':'boss',A=ASH[v];stats.ash[v]++;
 return{p:A.p,cell:256,cols:16,frames:16,pivot:[128,128],vis:A.vis,lift:ASH_LIFT,filter:ASH_FILTER,variant:v};}catch(err){fail(err);return null;}}
/* D09 */
const PX=()=>window.__STORYWORLD_PIXELFX_R163__;
function register(){try{const m=PX()?.meta?.();if(m&&!m[HIT])m[HIT]={...HIT_ROW,frame:HIT_ROW.frame.slice(),pivot:HIT_ROW.pivot.slice()};}catch(err){fail(err);}}
/* 첫 적중 때 그림이 아직 안 받아져 안 보이는 일 없게 미리 받는다(R163 warm, 지역마다 한 번) — D08 재 구름 세 장도 같이 */
let warmed='';function warm(){try{const id=typeof room==='object'&&room?room.id:'';const X=PX();if(!id||id===warmed||!X?.meta?.())return;warmed=id;X.warm?.([HIT]);if(prefs.on&&typeof ensureImages==='function')Promise.resolve(ensureImages(Object.values(ASH).map(a=>a.p))).catch(()=>{});}catch(_){}}
const melee=src=>!!(src&&src.attack&&src.attack.committed&&src.lastAttackKind==='melee'&&!src.attack.r52Charge);
const NOT_HIT=new Set(['ignored','invulnerable','parried','missed','blocked']);
let last=-9;
function onHit(src,r){if(!prefs.on)return;if(NOT_HIT.has(r)){stats.notHit++;return;}
 if(!src||typeof src!=='object'){stats.noSource++;return;}if(melee(src)){stats.meleeSkip++;return;}
 const t=T();if(t-last<HIT_GAP&&t>=last)return;const p=typeof player==='object'&&player?player:null;if(!p||!Number.isFinite(p.x+p.y))return;
 const X=PX();register();if(!X||typeof X.play!=='function')return;last=t;
 const sx=fin(src.x,NaN),sy=fin(src.y,NaN),flip=Number.isFinite(sx+sy)?(sx-sy)<(p.x-p.y):false;
 let hx=p.x,hy=p.y;if(Number.isFinite(sx+sy)){const dx=sx-p.x,dy=sy-p.y,L=Math.hypot(dx,dy);if(L>1e-6){hx+=dx/L*HIT_SIDE;hy+=dy/L*HIT_SIDE;}}
 X.play(HIT,hx,hy,{k:HIT_K,z:H()*HIT_Z,alpha:HIT_ALPHA,rate:1,flip,enemy:true});stats.hits++;}
try{if(typeof hurt==='function'){const base=hurt;hurt=function(d,src,...a){const r=base.call(this,d,src,...a);try{onHit(src,r);}catch(err){fail(err);}return r;};}}catch(err){fail(err);}
try{if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{register();warm();}catch(err){fail(err);}return r;};}}catch(err){fail(err);}
register();
function set(p={}){if(typeof p.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_DOTS_FX_R1359__=Object.freeze({revision:REV,ash,HIT,set,inspect:()=>({revision:REV,prefs:{...prefs},...stats,ash:{...stats.ash},lastError})});
})();
