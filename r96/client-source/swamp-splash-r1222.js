// R1222 — 늪지대 '늪에서 되살아난 혼령체' 근접 공격의 물 튐을 늪 물빛으로.
//  사용자 2026-11-19 10:12Z "늪지대 혼령체 공격시 물나오는거 녹색 색 넣어서 늪같아보이게"
//  · 원인: R169 잡몹 타격 이펙트는 늪 지역(swamp)에 해안 모양(PXFAM swamp→coast)을 함께 쓰고, R1177d 가 그 칸을 Dots 파란 물 튐(mob-coast)으로 바꿨다.
//  · 바꾸는 것: 이 몹(이름에 '늪에서 되살아난 혼령체' — 증원·추격대·우두머리·중간보스 포함)의 타격일 때만 mob-coast 를
//    같은 Dots 그림을 늪색(먹 → 탁한 녹 → 이끼 → 녹황 거품, 1px 먹 테두리)으로 다시 칠한 시트(mob-swamp-r1222)로 재생한다(scripts/r1222-swamp-splash.py).
//    같은 늪의 다른 몹·해안 지역 물 튐은 그대로. 칸 크기·기준점·12칸·재생 속도·크기·판정·피해·타이밍은 그대로.
//  · 방법: pixelfx(R163) play 가 먼저 묻는 R1177 route 를 감싼다. 누가 쳤는지는 R169 가 부르는 자리(e.x+cos(a)·r·.45·sc)로 맞춰 본다.
//  끄기: localStorage['storyworld.r1222.swamp']='{"on":false}'. 점검: window.__STORYWORLD_SWAMP_SPLASH_R1222__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_SWAMP_SPLASH_R1222__)return;
const REV='R1222-swamp-splash-1',KEY='storyworld.r1222.swamp',NAME='mob-swamp-r1222',FROM='mob-coast';
const ROW=Object.freeze({file:'r1222/mob-swamp-dots-12.webp',frame:[175,105],pivot:[87,83],columns:4,frames:12,fps:12,loop:false,r1222:'Dots D coast-water-splash12 → 늪색 다시 칠함(R1222)'});
const WHO=/늪에서 되살아난 혼령체/,SCS=[1,1.6,1.8,2];
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={swapped:0,passed:0,added:0,warmed:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const fin=Number.isFinite;
const PX=()=>window.__STORYWORLD_PIXELFX_R163__;
const roomNow=()=>{try{return typeof room!=='undefined'?room:null;}catch(_){return null;}};
// 표에 늪 칸을 넣는다(표는 index.json 이 늦게 오므로 매 tick 확인, 이미 있으면 그대로)
function ensureRow(){const m=PX()?.meta?.();if(!m)return false;if(!m[NAME]){m[NAME]={...ROW,frame:ROW.frame.slice(),pivot:ROW.pivot.slice()};stats.added++;}return true;}
// R169 mobTick 이 mob-coast 를 부르는 자리와 맞는 살아 있는 혼령체가 있는가
function owner(x,y){if(!fin(x)||!fin(y))return null;const r=roomNow(),L=r&&Array.isArray(r.enemies)?r.enemies:[];
 for(const e of L){if(!e||!(e.hp>0)||!WHO.test(String(e.name||'')))continue;const a=e.attack;if(!a||!a.committed||!fin(a.angle)||!fin(e.x)||!fin(e.y))continue;
  const rr=Math.min(2.4,Math.max(.8,Number(a.shape154?.range)||1.3)),c=Math.cos(a.angle)*rr*.45,s=Math.sin(a.angle)*rr*.45;
  for(const sc of SCS)if(Math.abs(e.x+c*sc-x)<.02&&Math.abs(e.y+s*sc-y)<.02)return e;}
 return null;}
function wrapRoute(base){return function(name,x,y,o){let r=null;if(typeof base==='function'){try{r=base.call(this,name,x,y,o);}catch(e){fail(e);}}
 try{if(!prefs.on)return r;const nm=r&&typeof r.name==='string'?r.name:name,oo=(r&&r.o)||o||{};
  if(nm!==FROM)return r;if(!PX()?.meta?.()?.[NAME]||!owner(x,y)){stats.passed++;return r;}
  stats.swapped++;return {name:NAME,o:{...oo,tint:null}};}catch(e){fail(e);return r;}};}
// R1177 이 있으면 그 route 를 감싼 새 객체로, 없으면(옛 빌드) route 만 가진 객체로 둔다(R163 play 가 부를 때마다 이 전역을 읽는다)
let installed=null;
function install(){try{const cur=window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__;if(cur&&cur===installed)return;
 const next=Object.freeze({...(cur||{}),route:wrapRoute(cur&&cur.route),r1222Base:cur||null});window.__STORYWORLD_SAMONG_PIXEL_ART_R1177__=next;installed=next;}catch(e){fail(e);}}
let warmedRoom=null;
function step(){if(!prefs.on)return;install();if(!ensureRow())return;const r=roomNow();if(!r||r===warmedRoom||!Array.isArray(r.enemies))return;
 if(r.enemies.some(e=>e&&WHO.test(String(e.name||'')))){warmedRoom=r;try{PX()?.warm?.([NAME]);stats.warmed++;}catch(e){fail(e);}}}
install();
try{if(typeof tick==='function'){const base=tick;tick=function(...a){const out=base.apply(this,a);try{step();}catch(e){fail(e);}return out;};}}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_SWAMP_SPLASH_R1222__=Object.freeze({revision:REV,set,row:ROW,name:NAME,owner,inspect:()=>({revision:REV,prefs:{...prefs},...stats,lastError,hasRow:!!PX()?.meta?.()?.[NAME]})});
})();
