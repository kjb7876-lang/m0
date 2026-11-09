// R433 — 사용자 2026-11-08 "너가 보고한 바 바탕으로 개선"(리니지·디아블로·이터널 리턴·이터널 시티 대비 시각 조사 1~3번).
//  다른 게임의 그림·코드는 쓰지 않고 원리만 따른다. 판정·피해·AI·저장·서사·맵 순서는 그대로(그림·HUD 표시만).
//  ① 등급 발밑 기운(디아블로 정예 표시·리니지 이름 색 원리): 살아 있는 중간보스(midboss·miniBoss·구역 수호·병원 강화 중간보스)는
//     발밑에 핏빛 암적(#641B25 계열) 고리, 보스(boss·r104Boss·persona)는 같은 고리 위에 선혈 적색(#D12835)이 1.6초마다 짧게 맥동.
//     ('glow' 는 물들여도 가운데가 하얗게 남아 바닥에 흰 점이 생겨 쓰지 않는다.)
//     빨강은 위협 신호로 아껴 쓴다는 9절 규칙대로 일반 몹에는 그리지 않는다. 마법진(육망성·룬)이 아니라 R106 칠한 'glow'·'ring' 을 바닥에 눕혀 그린다.
//     몹 그림보다 먼저(바닥 붙음 범위) 그려 몸을 가리지 않는다. 맘몬 금고(ep1b06)는 Codex 별도 작업이라 건드리지 않는다.
//  ② 고요할 때 아래 HUD 낮추기(디아블로 IV·리니지 M 의 '전투 밖 UI 물러나기'): R420 전투 집중 HUD(PC)가 켜져 있고
//     근처(12칸)에 살아 있는 적이 4초 넘게 없으면 아래 단축칸을 86% 크기·45% 밝기로 물린다. 체력·공명 구슬과 초상은 그대로.
//     적이 다가오거나, 키를 누르거나, 마우스를 HUD 에 올리면 곧바로 원래대로. 모바일·좁은 화면은 그대로.
//  ③ 곡 이름 한 곳만: 지역에 들어올 때 같은 곡 이름이 머리띠(R313)·아래 알림(R195/R308 toast)·곡 소개 쪽지(R331)에 세 번 겹쳤다
//     → 머리띠가 보이는 동안 '♪ ' 로 시작하는 알림 toast 만 건너뛴다(머리띠가 숨는 모바일 실플레이에서는 그대로).
//  끄기: localStorage['storyworld.r433.readability']='{"rank":false,"calm":false,"bgmOnce":false,"heroRim":false}'
//  (heroRim 은 combat-read-r409 영웅 테 — 고유색 차가운 테 — 를 예전 상아색으로 되돌린다).
(()=>{'use strict';
if(window.__STORYWORLD_READABILITY_R433__)return;
const REV='R433-readability-1',KEY='storyworld.r433.readability';
const DEF={rank:true,calm:true,bgmOnce:true,heroRim:true};
let prefs={...DEF};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')for(const k of Object.keys(DEF))if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={auras:0,bossAuras:0,calmOn:0,calmOff:0,toastsSkipped:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'?time:0;
const SKIP_REGION=new Set(['ep1b06']);/* 맘몬 금고 — 손대지 않음 */
const regionId=()=>{try{return typeof room!=='undefined'&&room?String(room.id||room.regionId||''):'';}catch(_){return '';}};

// ① 등급 -----------------------------------------------------------------------------------
const isBoss=e=>!!(e&&(e.boss||e.r104Boss||e.persona||e.elite==='boss'));
const isMid=e=>!!(e&&!isBoss(e)&&(e.midboss||e.miniBoss||e.wardChampionR81===true||e.mazeEliteR2===true));
const P={ink:{a:[6,4,6],b:[30,10,14]},deep:{a:[100,27,37],b:[160,40,52]},blood:{a:[150,20,32],b:[209,40,53]}};
function aura(e){const S=window.__STORYWORLD_FX_SPRITES_R106__;if(!S?.on?.()||typeof project!=='function'||typeof ctx==='undefined'||!ctx)return;
 if(!(e.hp>0)||e.visible===false||e.disabled===true||['hidden','inactive','disabled','despawned'].includes(e.spawnState))return;const boss=isBoss(e);if(!boss&&!isMid(e))return;
 /* 손전등 시야(R24) 밖이거나 몸 그림이 아직 준비 안 된 몹은 기운도 그리지 않는다(숨은 적 위치를 알려 주지 않게) */
 try{const SG=window.__STORYWORLD_SIGHT24__;if(SG?.enabled){if(typeof SG.visibleEnemy==='function'?!SG.visibleEnemy(e):typeof SG.pointVisible==='function'&&!SG.pointVisible(e.x,e.y))return;}}catch(err){fail(err);}
 try{if(typeof readyImage==='function'&&e.path&&!readyImage(e.path))return;}catch(_){}
 const q=project(e.x,e.y);if(!q||q.x<-200||q.x>(typeof W==='number'?W:4000)+200)return;
 const H=typeof actorHeight==='function'?actorHeight():60,size=H*(boss?2.05:1.15),R=size*(boss?.62:.6),t=T();
 const engaged=!boss||!!(typeof room!=='undefined'&&room?.engaged);
 const paint=()=>{
  S.draw('ring',P.deep,q.x,q.y,R*2,R*2,{squash:.5,alpha:boss?.95:.85,blend:'source-over'});/* 덧셈이면 갈색 바닥에서 분홍으로 떠 보였다 → 칠하기로 짙은 암적 유지 */
  if(boss&&engaged){const ph=(t%1.6)/1.6,k=Math.max(0,1-ph*1.6);/* 짧은 맥동, 나머지는 고요 */
   if(k>0)S.draw('ring',P.blood,q.x,q.y,R*2*(1+ph*.35),R*2*(1+ph*.35),{squash:.5,alpha:.55*k});}};
 const scope=ctx.scope;
 if(typeof scope==='function')scope.call(ctx,{id:'r433:rank:'+(e.id??Math.round(e.x*8)+','+Math.round(e.y*8)),kind:'effect',x:e.x,y:e.y,groundAligned:true,r433:true,enemy:true},paint);else paint();
 stats.auras++;if(boss)stats.bossAuras++;}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){if(prefs.rank&&e&&!SKIP_REGION.has(regionId())){try{aura(e);}catch(err){fail(err);}}return base.call(this,e,...a);};}

// ② 고요할 때 아래 HUD 낮추기 ------------------------------------------------------------------
const CALM_AFTER=4,NEAR=12;let quietSince=null,calm=false,pokeT=-1e9;
const nowS=()=>performance.now()/1000;
function enemyNear(){try{if(typeof room==='undefined'||!room||!Array.isArray(room.enemies)||typeof player==='undefined'||!player)return false;
 for(const e of room.enemies){if(!(e&&e.hp>0)||e.hero||e.ally||e.visible===false)continue;if(Math.hypot(e.x-player.x,e.y-player.y)<NEAR)return true;}}catch(e){fail(e);}return false;}
function tickCalm(){try{const b=document.body;if(!b)return;
 const want=prefs.calm&&b.classList.contains('r420-focus')&&!(typeof modal!=='undefined'&&modal)&&!(typeof storyScene!=='undefined'&&storyScene);
 let next=false;if(want){const n=nowS();if(enemyNear()||n-pokeT<CALM_AFTER){quietSince=null;}else{if(quietSince==null)quietSince=n;next=n-quietSince>=CALM_AFTER;}}else quietSince=null;
 if(next!==calm){calm=next;b.classList.toggle('r433-calm',calm);calm?stats.calmOn++:stats.calmOff++;}}catch(e){fail(e);}}
const poke=()=>{pokeT=nowS();if(calm){calm=false;quietSince=null;try{document.body.classList.remove('r433-calm');stats.calmOff++;}catch(_){}}};
addEventListener('keydown',poke,true);
function css(){if(document.getElementById('readabilityR433Css'))return;const s=document.createElement('style');s.id='readabilityR433Css';
 s.textContent='@media (min-width:781px) and (pointer:fine){'
  +'body.r420-focus footer .hotbar{transition:opacity .6s ease,transform .6s ease;transform-origin:50% 100%}'
  +'body.r420-focus.r433-calm footer:not(:hover) .hotbar{opacity:.45;transform:scale(.86)}'
  +'}';
 (document.head||document.documentElement).appendChild(s);}
css();setInterval(tickCalm,250);

// ③ 곡 이름 한 곳만 ---------------------------------------------------------------------------
function headerShowsBgm(){try{const H=window.__STORYWORLD_HUD_BGM_HWANDO_R313__;const txt=H?.currentText?.();if(!txt)return false;
 const h=document.querySelector('header');if(!h)return false;const r=h.getBoundingClientRect();return r.height>8&&getComputedStyle(h).display!=='none'&&getComputedStyle(h).visibility!=='hidden';}catch(e){fail(e);return false;}}
function wrapToast(){if(typeof toast!=='function'||toast.__r433)return;const base=toast;const w=function(msg,...a){if(prefs.bgmOnce&&typeof msg==='string'&&msg.startsWith('♪ ')&&headerShowsBgm()){stats.toastsSkipped++;return;}return base.call(this,msg,...a);};w.__r433=true;
 for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}toast=w;}
wrapToast();setInterval(wrapToast,1000);

function set(p){if(p&&typeof p==='object')for(const k of Object.keys(DEF))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.calm){calm=false;try{document.body.classList.remove('r433-calm');}catch(_){}}return{...prefs};}
window.__STORYWORLD_READABILITY_R433__=Object.freeze({revision:REV,set,isBoss,isMid,
 inspect:()=>({revision:REV,prefs:{...prefs},calm,stats:{...stats},lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false})});
})();
