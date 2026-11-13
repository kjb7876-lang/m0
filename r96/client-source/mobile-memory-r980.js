// R980 (사용자 2026-11-13 "모바일로 무한생존모드 슬레이어로 플레이하던중 갑자기 꺼지는 문제 … 렉이나 메모리쪽"):
//  모바일 전용 메모리 예산. 헤드리스 모바일 뷰포트(844×390, DPR2) 측정에서 렌더러 프로세스가 생존 시작 직후 약 1.2GB,
//  15분 뒤 약 1.65GB 까지 커졌다. 그중 상한 없이(또는 데스크톱 기준 상한으로) 쌓이던 것:
//   · 몹 물들인 픽셀 시트 R163(최대 40장, 시트 한 장 최대 약 9MB → 측정 140MB)
//   · R106 이펙트 색 사본(최대 220장 → 측정 54MB)
//   · 엔진 효과음 디코딩 캐시 buffers(상한 없음, 지역마다 새 몹·보스 소리 → 15분 51MB, 계속 증가)
//  고침(모바일만, 데스크톱 불변):
//   ① px(name, desktop) — 캐시별 픽셀 상한. R163·R106 이 이 값으로 오래 안 쓴 사본부터 버린다(데스크톱은 desktop 값 그대로).
//   ② 효과음 디코딩 캐시 — 쓸 때마다 맨 뒤로(LRU), 디코딩 합이 예산을 넘으면 오래 안 쓴 소리부터 캐시에서 뺀다.
//      재생 중인 소리는 재생 노드가 버퍼를 쥐고 있어 끊기지 않는다. 다시 필요하면 엔진이 평소처럼 다시 받아 디코딩한다.
//  그림·전투·세이브는 바꾸지 않는다(표시·소리 캐시만).
(()=>{'use strict';
if(window.__STORYWORLD_MOBILE_MEMORY_R980__)return;
const REV='R980-mobile-memory-1',KEY='storyworld.r980.mobileMemory';
// 모바일 예산(픽셀 수, 1픽셀 = 4바이트)
const MOBILE_PX={'r163-tint':12e6/* 약 48MB */,'r106-tint':6e6/* 약 24MB */};
const AUDIO_MB=24,EVERY_MS=2000;
let on=true,lastError=null;try{on=JSON.parse(localStorage.getItem(KEY)||'null')?.on!==false;}catch(_){}
const stats={checks:0,audioTrims:0,audioEvicted:0,audioEvictedMB:0,audioPeakMB:0,audioLastMB:0,errors:0};
function fail(e){stats.errors++;lastError=String(e?.stack||e).slice(0,300);}
function mobile(){
 try{const m=window.__STORYWORLD_MOBILE_R63__;if(typeof m?.isMobile==='function')return !!m.isMobile();}catch(_){}
 try{return typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;}catch(_){return false;}
}
const active=()=>on&&mobile();
function px(name,desktop){if(!active())return desktop;const v=MOBILE_PX[name];return Number.isFinite(v)?Math.min(v,desktop):desktop;}
function audioBudgetMB(){return active()?AUDIO_MB:Infinity;}

// 효과음 캐시(엔진 전역 buffers: 경로 → 디코딩 약속). 크기는 약속이 풀릴 때 WeakMap 에 적는다.
const sizeOf=new WeakMap();
const cacheMap=()=>{try{return typeof buffers!=='undefined'&&buffers instanceof Map?buffers:null;}catch(_){return null;}};
function note(pr){if(!pr||typeof pr.then!=='function'||sizeOf.has(pr))return;sizeOf.set(pr,-1);
 pr.then(a=>{try{sizeOf.set(pr,a&&a.length?a.length*a.numberOfChannels*4:0);}catch(_){sizeOf.set(pr,0);}},()=>sizeOf.set(pr,0));}
let wrapped=false;
function wrap(){if(wrapped||typeof audioBuffer!=='function')return;const orig=audioBuffer;
 const w=function(path){const r=orig.apply(this,arguments);try{const B=cacheMap();if(B&&active()){const k=typeof cleanPath==='function'?cleanPath(path):path;const v=B.get(k);if(v){B.delete(k);B.set(k,v);note(v);}}}catch(e){fail(e);}return r;};
 try{audioBuffer=w;wrapped=true;}catch(e){fail(e);}}
function trimAudio(){const B=cacheMap();if(!B)return;let total=0;for(const v of B.values()){note(v);const s=sizeOf.get(v);if(s>0)total+=s;}
 const mb=total/1e6;stats.audioLastMB=Math.round(mb);stats.audioPeakMB=Math.max(stats.audioPeakMB,stats.audioLastMB);if(mb<=AUDIO_MB)return;
 stats.audioTrims++;const goal=AUDIO_MB*1e6*.8;
 for(const [k,v] of [...B]){if(total<=goal)break;const s=sizeOf.get(v);if(!(s>0))continue;/* 아직 디코딩 중인 것은 두고 */B.delete(k);total-=s;stats.audioEvicted++;stats.audioEvictedMB+=s/1e6;}
 stats.audioEvictedMB=Math.round(stats.audioEvictedMB*10)/10;}
function check(){stats.checks++;try{if(!active())return;wrap();trimAudio();}catch(e){fail(e);}}
let timer=null;
function start(){wrap();if(!timer)timer=setInterval(check,EVERY_MS);}
if(document.readyState==='complete')start();else window.addEventListener('load',start,{once:true});
window.__STORYWORLD_MOBILE_MEMORY_R980__=Object.freeze({revision:REV,mobile,active,px,audioBudgetMB,check,
 set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;},
 inspect:()=>({revision:REV,on,mobile:mobile(),wrapped,budgets:{...MOBILE_PX,audioMB:AUDIO_MB},stats:{...stats},lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false})});
})();
