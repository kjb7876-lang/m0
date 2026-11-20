// R1253 — 사몽 첫 장면 GPU 텍스처 올림 남은 몫(사용자 2026-11-20 01:40Z "남은 렉 후보는 텍스처 업로드와 셰이더 첫 사용입니다 - 이것도 검토").
//  헤드리스 측정(qa/r1253/gpu-probe.mjs, 960×540):
//   · 꿈 층 직접 각성은 R1199·R1217 이 준비(대기 3초 이하) 때 미리 올려 6형상은 각성 장면 3~27ms. 남은 것은 기본 목록에 없던 그림:
//     라우렌 95ms(중력 붕괴 소용돌이 157만·반발 88만 화소), 네온 44ms(burst-impact), 미카엘라 22~64ms(barrier 61만·heart-hit6·time-ring).
//   · 스토리 층 보스방의 대본 각성(교주 최종 단계·페르소나 충돌, 엔진 awaken('story'))은 R1199 가 꿈 층만 다뤄 예열이 없다:
//     첫 장면에 382~681만 화소, 76~119ms 를 한꺼번에 올렸다.
//   · 남김: 네온 확률 패시브 창 시트 r951/neon-lance.webp 는 한 장 472만 화소(첫 사용 146ms)라 R1199 한 장 상한(400만)을 넘어 미리 올리지 않는다(쥐면 GPU 19MB). 시트를 나누거나 줄이는 일은 따로.
//   · 셰이더 첫 사용: 각성 때 새로 링크되는 프로그램은 미카엘라 1개(4~5ms)뿐이라 손대지 않는다(R1217 흑백 미리 굽기가 이미 준비 때 만든다).
//  고친 방법:
//   ① R1217 기본 목록 뒤에 측정한 그림을 더한다(형상별 40장 상한은 R1199 가 그대로 지킨다).
//   ② 스토리 층에서 살아 있는 보스가 있는 방이면(각성 아님·불러오는 중 아님·살아 있음·성능 단계 2 이상) R1199 목록 그림을
//      (+ 대본 각성 공통 보호막 1장) 0.5초에 PC 50만·저사양 25만 화소(최소 1장)씩 GPU 에 미리 올리고 쥔다. 보스가 없어지거나 방이 바뀌면 놓는다(그 뒤는 R89 규칙대로 20초 뒤 정리).
//      각성 중에는 쥔 채로 둔다. 화면에 보이는 것은 같다(같은 그림을 더 일찍 올릴 뿐). 판정·피해·대기·세이브는 건드리지 않는다.
//  끄기: localStorage 'storyworld.r1253.gpuWarm' = '0'.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SAMONG_GPU_WARM_R1253__)return;
const REV='R1253-samong-gpu-warm-1',KEY='storyworld.r1253.gpuWarm',GAP=500,BUDGET=5e5,BUDGET_LOW=2.5e5,MAX=40;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const stats={merged:0,uploads:0,loads:0,held:0,released:0,scenes:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const on=()=>G(()=>localStorage.getItem(KEY),null)!=='0';
// ① 측정한 그림(qa/r1253 꿈 층 각성 장면에 처음 올라간 영웅·사몽·확률 패시브 그림, 측정 세 번 모음)
const EXTRA=Object.freeze({
 lauren:['assets/r561/lauren/lauren-crush-vortex.webp','assets/r946/lauren-repulse.webp','assets/r946/lauren-red.webp'],
 neon:['assets/vfx/generated/v300/burst-impact.webp','assets/r951/neon-hazard-sign.webp','assets/r951/neon-lance-impact.webp'],
 michaela:['assets/r1027/barrier.webp','assets/r948/heart-hit6.webp','assets/vfx/generated/v300/time-ring.webp','assets/r948/heart-fly8.webp']});
// 스토리 대본 각성(awaken('story'))은 형상과 상관없이 보호막(r1027 barrier, 61만 화소)을 처음 올렸다.
//  (각성 연출 아틀라스 final42 효과 246·몹 사망 연기 r108 eden smoke 도 처음 올라가지만, 각자 따로 만든 그림 객체를 써서 경로로 미리 올려도 맞지 않아 뺐다 — 헤드리스로 확인)
const STORY_EXTRA=Object.freeze(['assets/r1027/barrier.webp']);
const DKEY='__STORYWORLD_SAMONG_WARM_DEFAULTS_R1217__';
function merge(){try{const D=window[DKEY];if(!D||typeof D!=='object'||D.__r1253)return false;const out={};
  for(const k of Object.keys(D))out[k]=Array.isArray(D[k])?D[k].slice():D[k];
  for(const k of Object.keys(EXTRA)){const L=Array.isArray(out[k])?out[k]:(out[k]=[]);for(const p of EXTRA[k])if(L.length<MAX&&!L.includes(p)){L.push(p);stats.merged++;}}
  for(const k of Object.keys(out))if(Array.isArray(out[k]))Object.freeze(out[k]);
  Object.defineProperty(out,'__r1253',{value:true});window[DKEY]=Object.freeze(out);return true;}catch(e){fail(e);return false;}}
// ② 스토리 층 보스방 예열
const P=()=>G(()=>typeof player==='object'&&player?player:null,null);
const W=()=>G(()=>window.__STORYWORLD_SAMONG_WARM_R1199__||null,null);
const perfStep=()=>G(()=>{const n=Number(window.__STORYWORLD_PERF7_R1043__?.step?.());return Number.isFinite(n)?n:5;},5);
const lowFx=()=>G(()=>!!(typeof settings!=='undefined'&&settings?.lowFx),false);
const isImg=im=>!!im&&typeof HTMLImageElement!=='undefined'&&im instanceof HTMLImageElement;
const px=im=>(im.naturalWidth||im.width||0)*(im.naturalHeight||im.height||0);
function bossRoom(){return G(()=>{if(typeof layer!=='undefined'&&layer==='DREAM')return false;const r=room;return !!(r&&Array.isArray(r.enemies)&&r.enemies.some(e=>e&&e.boss&&+e.hp>0));},false);}
function want(p){return on()&&!!p&&+p.hp>0&&!G(()=>loading,false)&&perfStep()>1&&bossRoom();}
let owner=null,heldKey='';const held=new Map();/* image → path */const asked=new Set();
function releaseAll(){const S=owner;for(const im of held.keys()){try{S?.release?.(im);stats.released++;}catch(e){fail(e);}}held.clear();stats.held=0;}
function tick(){try{merge();const three=G(()=>window.__STORYWORLD_PHASE1__.controller.state.three,null),S=three?.commands,R=three?.renderer;if(!S||typeof S.texture!=='function')return;
  if(S!==owner){held.clear();stats.held=0;asked.clear();owner=S;stats.scenes++;}
  const p=P();if(p&&+p.samong>0&&+p.hp>0)return;/* 각성 중엔 쥔 채로 */
  if(!want(p)){if(held.size)releaseAll();return;}
  const w=W();if(!w||typeof w.list!=='function')return;const key=G(()=>w.heroKey(),'');if(!key)return;if(key!==heldKey){releaseAll();heldKey=key;}
  const list=[...STORY_EXTRA,...(G(()=>w.list(key),[])||[]).filter(x=>!STORY_EXTRA.includes(x))];const done=new Set(held.values());let budget=lowFx()?BUDGET_LOW:BUDGET,n=0;
  for(const path of list){if(done.has(path))continue;const row=G(()=>readyImage(path),null);
   if(!row||!isImg(row.image)){if(!asked.has(path)){asked.add(path);stats.loads++;G(()=>{const a=addImage(path);a?.promise?.catch?.(()=>{});});}continue;}
   const im=row.image,cost=px(im);if(n>0&&cost>budget)break;
   try{const tex=S.texture(im,false);held.set(im,path);stats.held=held.size;R?.initTexture?.(tex);stats.uploads++;}catch(e){fail(e);}
   budget-=cost;n++;if(budget<=0)break;}}catch(e){fail(e);}}
merge();G(()=>setInterval(tick,GAP));
window.__STORYWORLD_SAMONG_GPU_WARM_R1253__=Object.freeze({revision:REV,extra:EXTRA,storyExtra:STORY_EXTRA,on,bossRoom,tick,
 set:v=>{G(()=>localStorage.setItem(KEY,v?'1':'0'));if(!v)releaseAll();return on();},
 inspect:()=>({revision:REV,on:on(),...stats,heldPaths:[...held.values()],heldKey,lastError,gameplayChanged:false,presentationOnly:true})});
})();
