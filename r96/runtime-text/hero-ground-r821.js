// R821 밝은 무늬 바닥 위 영웅 가독성 — 실플레이 점검(R800, 2026-11-11) 넘김:
//  "사몽 '찻잔 안의 집'(rosehouse 흑백 마름모 바닥)이 밝은 옷 영웅(환도)을 삼킨다. 바닥은 R323·R435 가 일부러 보존한 그림이니
//   바닥을 바꾸지 말고 영웅 발밑 그림자·외곽선으로".
//  원인(1280×720 헤드리스 촬영): 영웅 테(R409·R434)는 영웅 고유색의 '밝은' 빛이다 — 갈색·회색 바닥에서는 서지만
//   흰 칸이 절반인 이 바닥에서는 테와 몸이 흰 칸에 함께 녹는다. 엔진 발 그림자(알파 .22)도 흑백 칸 사이에서 안 읽힌다.
//  고침(바닥·벽·조형물·몹은 손대지 않는다. R118 바닥 그림이 LOOKS 안인 방에서, 밝은 옷·옅은 테 영웅(PALE)에게만):
//   ① 테를 어둡게·조금 굵게 — R409 의 영웅 테 고르기(heroLook)가 rim() 을 물어 어두운 잉크 테를 굽는다(굽는 길·캐시·칼날 빼기는 R409 그대로).
//   ② 발 그림자를 짙고 넓게 — drawHero 동안 엔진 shadow 를 감싸 같은 자리에 한 겹 더(1.45배, 영웅 소유 명령이라 3D 에서 발밑에 붙는다).
//  다른 방에서는 아무 일도 하지 않는다. 판정·저장·자산 원본은 바꾸지 않는다.
//  다른 덧씌우기가 나중에 drawHero 를 감싸도 한 번만 돌게 load 뒤에 한 번 더 감싼다(R619 와 같은 방식).
//  끄기: localStorage storyworld.r821.heroGround {on:false} 또는 __STORYWORLD_HERO_GROUND_R821__.set(false).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HERO_GROUND_R821__)return;
const REV='R821-hero-ground-2',KEY='storyworld.r821.heroGround',LOOKS=new Set(['rosehouse']);
// 밝은 옷 + 옅은 테 영웅만(환도·미카엘라) — 전후 촬영(1280×720, 8명 중 7명)으로 정했다:
//  · 환도(회백 망토, 회색 테)·미카엘라(흰 옷, 은색 테): 테와 몸이 흰 칸에 녹는다 → 어두운 테가 뚜렷이 낫다.
//  · 윤서하·기억사수: 옷은 밝은 편이지만 고유색 테가 짙은 파랑이라 이미 선다 → 평소 테 유지(어두운 테는 고유색만 잃는다).
//  · 네온·라우렌·헌터·슬레이어(어두운 옷): 어두운 테는 검은 칸에 묻힌다 → 평소의 밝은 고유색 테 유지.
//  남쪽 대기 그림(assets/r93/idle/idle-<영웅>-s.png) 불투명 픽셀 평균 밝기(0~255): 환도 132 · 미카엘라 122 · 기억사수 110 · 윤서하 98 | 네온 71 · 라우렌 62 · 헌터 47 · 슬레이어 45.
const PALE=new Set(['hwando','michaela']);
// 색채: 따뜻한 먹빛(바닥의 검은 칸·벽 장미 무늬와 같은 계열) — 순검정보다 그림에 붙는다.
let RIM={outer:'rgba(20,10,14,0.80)',inner:'rgba(6,3,5,0.96)',k:1.5},SHADOW={scale:1.45,alpha:1,times:2};
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={frames:0,shadows:0,rims:0,errors:0};let lastError=null,lastLook=null,depth=0;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const g=f=>{try{return f();}catch(_){return undefined;}};
/* R118 은 방의 exploration.surface.art.r118Tiles 에 바닥 그림을 적는다(사몽 구역은 호스트 지역 id 를 쓰므로 방 id 로는 못 찾는다) */
function look(){const r=g(()=>room);if(!r)return null;const l=r.exploration?.surface?.art?.r118Tiles?.file||r.terrainArt?.r118Tiles?.file||r.r118TileLook||null;return l&&LOOKS.has(l)?l:null;}
function active(){lastLook=on&&PALE.has(String(g(()=>player.hero)||''))?look():null;return !!lastLook;}
/* R409 가 묻는다: 이 방에서 쓸 영웅 테. 아니면 null(R409 는 평소 테를 쓴다). */
function rim(){if(!active())return null;stats.rims++;return {key:'r821:'+lastLook,outer:RIM.outer,inner:RIM.inner,k:RIM.k};}
function wrap(){if(typeof drawHero!=='function'||drawHero.__r821)return;const base=drawHero;
 const w=function(...a){if(depth>0||!active()||typeof shadow!=='function')return base.apply(this,a);
  depth++;stats.frames++;const sBase=shadow;let done=false;
  shadow=function(x,y,radius,opt,...q){const r=sBase.call(this,x,y,radius,opt,...q);
   if(!done){done=true;try{for(let i=0;i<SHADOW.times;i++){sBase.call(this,x,y,radius,{...(opt||{}),scale:(Number(opt?.scale)||1)*SHADOW.scale,alpha:SHADOW.alpha});stats.shadows++;}}catch(e){fail(e);}}
   return r;};
  try{return base.apply(this,a);}finally{shadow=sBase;depth--;}};
 w.__r821=true;drawHero=w;}
wrap();
if(typeof addEventListener==='function')addEventListener('load',()=>{try{wrap();}catch(e){fail(e);}},{once:true});
function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
/* 조율용(실기기에서 세기를 맞춰 볼 때) — 저장하지 않는다 */
function tune(o){if(o?.rim)RIM={...RIM,...o.rim};if(o?.shadow)SHADOW={...SHADOW,...o.shadow,times:Math.max(0,Math.min(4,Number(o.shadow.times??SHADOW.times)|0))};return {rim:{...RIM},shadow:{...SHADOW}};}
window.__STORYWORLD_HERO_GROUND_R821__=Object.freeze({revision:REV,looks:[...LOOKS],pale:[...PALE],set,active,rim,tune,rewrap:wrap,
 inspect:()=>({revision:REV,on,look:lastLook,rim:{...RIM},shadow:{...SHADOW},stats:{...stats},lastError})});
})();
