// R225 스킬 이펙트 강화 — 사용자 2026-11-02 "스킬이펙트강화"(앞서 "밋밋한 스킬 이펙트 강화, 다크에덴·다크판타지 느낌, 프레임 애니메이션 위주").
// 헤드리스 캡처(8영웅·dist03, 표적 4) 비교: 환도·슬레이어는 Z·C·F 가 모두 굵고, 네온 Z·C·F, 미카엘라 C·F, 거너 Z·F, 라우렌 Z·F, 서하 Z, 헌터 F 는 작거나 흐렸다 → 그 칸만 강화.
// 바꾼 것(판정·피해·쿨다운은 그대로, 그림만 덧입힘 — R163 pixelfx 프레임 애니메이션, 영웅 고유색을 어둡게 눌러 다크 판타지 톤):
//  · Z(본편 W): 가까운 적(최대 3)마다 핏빛 어둠 폭발(dark-explosion-blood) + 겨눈 방향 땅 균열 한 줄.
//  · C(본편 R): 발밑 안으로 무너짐(pvfx-void-implosion) → 0.22초 뒤 같은 자리 바깥으로 터짐(pvfx-warm-explosion).
//  · F(EGO): R178 공명 깨짐 위에 발밑 어둠 폭발 + 둘레 땅 균열 셋(영웅 고유색).
//  · 한 번에 너무 많이 쌓이지 않게 0.35초 안의 같은 키는 한 번만.
// 끄기: localStorage['storyworld.r225.fx']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_FX_BOOST_R225__)return;
const REV='R225-fx-1',KEY='storyworld.r225.fx';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={z:0,c:0,f:0,plays:0,skipped:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const P=()=>window.__STORYWORLD_PIXELFX_R163__;
const pal=()=>{try{const T=window.__STORYWORLD_HERO_FX_R102__?.PALETTE;const c=T?.[player?.hero]||T?.hwando;return c?{a:c.a.map(v=>Math.round(v*.5)),b:c.b}:null;}catch(_){return null;}};
const H=()=>typeof actorHeight==='function'?actorHeight():60;
const T=()=>typeof time==='number'?time:performance.now()/1000;
// 영웅·스킬별로 원래 연출이 약한 칸만 강화(8영웅 헤드리스 비교: 환도·슬레이어는 이미 굵어 그대로, 미카엘라 W 는 R209 에서 지움).
const WEAK={neon:'zcf',michaela:'cf',gunner:'zf',lauren:'zf',seoha:'z',hunter:'f'};
const weak=k=>{try{return (WEAK[player?.hero]||'').includes(k);}catch(_){return false;}};
const last={};const gate=k=>{const t=T();if(last[k]!=null&&t-last[k]<.35){stats.skipped++;return false;}last[k]=t;return true;};
function play(n,x,y,o){const p=P();if(!on||!p?.has?.(n))return false;p.play(n,x,y,{tint:pal()||undefined,...o});stats.plays++;return true;}
function near(n,r){try{return (room?.enemies||[]).filter(e=>e&&e.hp>0&&e.spawnState!=='hidden'&&Math.hypot(e.x-player.x,e.y-player.y)<r).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y)).slice(0,n);}catch(_){return [];}}
const aim=()=>Number.isFinite(player?.skillAngle)?player.skillAngle:Number.isFinite(player?.attackAngle)?player.attackAngle:0;
function zFx(){const es=near(3,7.5),a=aim();
 if(es.length)es.forEach((e,i)=>play('dark-explosion-blood',e.x,e.y,{k:1.05,delay:.06*i,z:H()*.25}));else play('dark-explosion-blood',player.x+Math.cos(a)*2.4,player.y+Math.sin(a)*2.4,{k:1.1});
 play('pvfx-earth-rupture',player.x+Math.cos(a)*1.3,player.y+Math.sin(a)*1.3,{k:.9,delay:.04});stats.z++;}
function cFx(){play('pvfx-void-implosion',player.x,player.y,{k:1.5,z:H()*.3});play('pvfx-warm-explosion',player.x,player.y,{k:1.45,delay:.22});stats.c++;}
function fFx(){play('dark-explosion-blood',player.x,player.y,{k:1.35,delay:.05});const a=aim();for(let i=0;i<3;i++){const t=a+i*2.094;play('pvfx-earth-rupture',player.x+Math.cos(t)*1.6,player.y+Math.sin(t)*1.6,{k:.85,delay:.1+.05*i});}stats.f++;}
// 본편 W/E/R(Z/X/C) — R209 가 다시 감쌀 수 있으므로 몇 번 다시 바깥에 선다.
function wrapWer(){const W=window.__STORYWORLD_WER__;if(!W||typeof W.cast!=='function'||W.__r225)return !!W?.__r225;
 window.__STORYWORLD_WER__=Object.freeze({...W,__r225:true,cast(slot,...a){const r=W.cast.call(this,slot,...a);try{if(on&&r){const s=String(slot).toLowerCase();if(s==='w'&&weak('z')&&gate('z'))zFx();else if(s==='r'&&weak('c')&&gate('c'))cFx();}}catch(e){fail(e);}return r;}});return true;}
let tries=0;(function arm(){try{wrapWer();}catch(e){fail(e);}if(++tries<80&&typeof setTimeout==='function')setTimeout(arm,250);})();
if(typeof ego==='function'){const base=ego;ego=function(...a){const e0=player?.ego||0;const r=base.apply(this,a);try{if(on&&player&&(player.ego||0)>e0&&weak('f')&&gate('f'))fFx();}catch(e){fail(e);}return r;};}
window.__STORYWORLD_FX_BOOST_R225__=Object.freeze({revision:REV,inspect:()=>({revision:REV,on,stats:{...stats},lastError}),set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},zFx,cFx,fFx,WEAK});
})();
