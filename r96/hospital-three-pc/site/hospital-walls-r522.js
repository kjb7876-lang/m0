// R522 병원 얇은 벽 붙이기 — 사용자 2026-11-10 00:47Z "얇은벽은 항상 굵은 벽과 붙어있도록"(남쪽 병실 C 의 벽 끝에 표시), 01:46Z "지금 병합, 벽은 다음 PR".
//  원인(실측, qa/r521/hospital-layout.json): 병원 본관(ep1a08) 미로의 얇은 가림벽 20개 가운데 18개는 한쪽 끝이 굵은 벽(바닥 밖 덩어리)에 붙어 있는데,
//   2개는 양 끝이 다 바닥 한가운데 떠 있었다 — 남쪽 병실 C 가림벽(x48~57·y97)과 가운데 복도 가림벽(x31·y68~74).
//  고침: 길이·방향은 그대로 두고 자리만 옮겨 한쪽 끝을 굵은 벽에 붙인다.
//   · south-c-baffle  [[48,97],[57,97]] → [[53,97],[62,97]]  (오른쪽으로 5칸 — 사용자가 표시한 오른쪽 끝이 병실 C·D 사이 굵은 벽에 닿는다. 왼쪽 통로는 4 → 9칸)
//   · route-divider-middle [[31,68],[31,74]] → [[33,68],[33,74]] (동쪽으로 2칸 — 위쪽 끝이 진료실 a·b 사이 기둥 아래에 닿는다)
//  ※ 이 두 벽은 충돌·길찾기·시야·빛 가림도 함께 옮겨진다(그림과 판정이 같은 벽 자료를 쓴다). 몹·전투 수치·문·길잡이 마디·저장은 그대로.
//  하는 길: 가림벽 표(StoryPhase1.HOSPITAL_CORE_B2.mazeBarriers)는 엔진 묶음 안에 있고, 같은 표로 다른 지역의 병동 미로 틀(worldWardTemplateR81)도 만든다.
//   → 표의 값을 바꾸지 않고, 두 항목의 endpoints 를 '지금 병원 본관 지도를 짓는 중일 때만 옮긴 값을 주는' 읽기 속성으로 바꾼다.
//   짓는 중인지는 엔진 지도 얻기(get)가 지도를 짓기 직전에 부르는 __STORYWORLD_MAZE_R73__.seed(id)·__STORYWORLD_WORLD_R74__.version(id) 로 안다(같은 동기 흐름, 끝나면 마이크로태스크로 지움).
//   다른 지역·엔진 직접 호출(layout-validation 등)은 원래 끝점을 그대로 읽는다.
//  끄기: localStorage['storyworld.r522.walls']='{"on":false}' (다음 지도 짓기부터)
(()=>{'use strict';
if(window.__STORYWORLD_HOSPITAL_WALLS_R522__)return;
const REV='R522-hospital-walls-1',KEY='storyworld.r522.walls',ZONE='ep1a08';
const prefs={on:true};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={hospital:0,other:0,reads:0,errors:0};let lastError=null,installed=false,building=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,300);};
const MOVES=Object.freeze({'south-c-baffle':Object.freeze([Object.freeze([53,97]),Object.freeze([62,97])]),'route-divider-middle':Object.freeze([Object.freeze([33,68]),Object.freeze([33,74])])});
// 지금 짓는 지역 표시: 같은 동기 흐름 안에서만 유효
function mark(id){building=id;if(id===ZONE)stats.hospital++;else stats.other++;try{Promise.resolve().then(()=>{if(building===id)building=null;});}catch(_){}}
function hook(name,method){try{const O=window[name];if(!O||typeof O[method]!=='function')return false;const base=O[method];
 window[name]=Object.freeze({...O,[method]:function(id,...a){try{mark(id);}catch(e){fail(e);}return base.call(this,id,...a);}});return true;}catch(e){fail(e);return false;}}
try{const T=window.StoryPhase1?.HOSPITAL_CORE_B2?.mazeBarriers;
 if(Array.isArray(T)){let n=0;
  for(const b of T){const to=b&&MOVES[b.id];if(!to||!Array.isArray(b.endpoints))continue;const orig=b.endpoints;
   Object.defineProperty(b,'endpoints',{configurable:true,enumerable:true,get(){stats.reads++;return prefs.on&&building===ZONE?to.map(p=>[p[0],p[1]]):orig;}});n++;}
  const a=hook('__STORYWORLD_MAZE_R73__','seed'),v=hook('__STORYWORLD_WORLD_R74__','version');installed=n===2&&(a||v);}
}catch(e){fail(e);}
function set(o){if(o&&typeof o.on==='boolean')prefs.on=o.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_HOSPITAL_WALLS_R522__=Object.freeze({revision:REV,MOVES,set,inspect:()=>({revision:REV,prefs:{...prefs},installed,building,stats:{...stats},lastError,collisionChanged:true,zone:ZONE})});
})();
