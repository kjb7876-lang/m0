// R272 렉 근본 원인 둘(사용자 2026-11-03 "에피1 병원맵·칠죄종 질투 맵 렉이 매우 심함 — 근본 원인 찾아 고치고 다른 맵도").
//  프로파일(헤드리스 CDP 표본, 같은 빌드):
//  (1) 길 못 찾는 길 찾기의 반복. 문이 닫힌 보스방 제단처럼 닿지 않는 목표로 findPath 를 부르면 격자 전체를 뒤지고(엔진 래퍼가 목표 주변 고리 6겹을 또 뒤짐)
//      빈 길을 돌려준다. 길잡이(R75 navigate 0.6초마다)·polish-r101(문 찾기)·몹 AI 가 같은 목표로 계속 다시 묻는다.
//      ep1a08 한 번 290ms·ep1a10 660ms·ep1b03 183ms(헤드리스) → 병원 프레임 JS 의 대부분(navigate 아래 65ms/프레임).
//      → '못 찾음' 결과만 1.5초 기억한다. 열쇠 = 방 객체 + 문 세대(R74 generation) + 병원 단계 + 목표 칸(0.5) + 반지름.
//        길이 있는 결과는 기억하지 않는다(언제나 새로 계산). 문이 열리거나 단계가 바뀌면 열쇠가 바뀌어 곧바로 다시 찾는다.
//  (2) 3D 바닥이 있는 지역에서도 엔진 2D 바닥(ground:ground, materials.png 타일 40~100장)을 그리기 명령으로 넘겨 그리기 호출이 40~50 더 생긴다.
//      3D 바닥이 그 위를 덮어 보이는 차이는 바닥 밖 허공에 비치던 얼룩(화면 0.2~0.8%)뿐이다 → 3D 바닥 줄(floorRows)이 있을 때만 그 명령을 뺀다(R204 veil 과 같은 방식).
//  판정·충돌·진행·난이도는 그대로. 끄기: localStorage['storyworld.r272.perf']='{"paths":false,"ground":false}'
(()=>{'use strict';
if(window.__STORYWORLD_PERF_R272__)return;
const REV='R272-perf-1',KEY='storyworld.r272.perf',TTL=1500;
const prefs={paths:true,ground:true};try{Object.assign(prefs,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(_){}
const stats={pathCalls:0,pathMissCached:0,pathFailed:0,groundDropped:0,frames:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const neg=new WeakMap();
// 순수(QA): 열쇠 만들기
function pathKey(to,radius,gen,phase){return [Math.round(to.x*2),Math.round(to.y*2),Number(radius??.29).toFixed(2),gen,phase].join(':');}
function ctx(r){let gen=0,phase='';try{gen=window.__STORYWORLD_WORLD_R74__?.generation?.()||0;}catch(_){}try{if(r?.id==='ep1a08')phase=window.__STORYWORLD_HOSPITAL_MAZE_PROGRESSION__?.inspect?.()?.state?.phase||'';}catch(_){}return{gen,phase};}
try{const base=findPath;findPath=function(from,to,r,radius){if(!prefs.paths)return base.apply(this,arguments);stats.pathCalls++;
 let m,k;try{const rr=r||room;if(rr&&to&&Number.isFinite(to.x+to.y)){const c=ctx(rr);k=pathKey(to,radius,c.gen,c.phase);m=neg.get(rr);const t=m&&m.get(k);if(t!==undefined&&performance.now()-t<TTL){stats.pathMissCached++;return[];}}}catch(e){fail(e);k=null;}
 const out=base.apply(this,arguments);
 try{if(k&&Array.isArray(out)&&!out.length){const rr=r||room;if(!m){m=new Map();neg.set(rr,m);}if(m.size>256)m.clear();m.set(k,performance.now());stats.pathFailed++;}}catch(e){fail(e);}
 return out;};}catch(e){fail(e);}
// (2) 3D 바닥이 있으면 2D 바닥 명령 빼기
function before(r,frame){try{if(!prefs.ground||!Array.isArray(frame?.commands))return;stats.frames++;if(!(r?.floorRows?.size>0))return;
 const n0=frame.commands.length;frame.commands=frame.commands.filter(c=>!(c?.kind==='image'&&c.owner?.kind==='ground'&&c.owner?.id==='ground'));stats.groundDropped+=n0-frame.commands.length;}catch(e){fail(e);}}
const wrapFn=fn=>{if(fn.__r272)return fn;const w=function(frame){before(this,frame);return fn.apply(this,arguments);};w.__r272=true;return w;};
// perf-r97 이 인스턴스에 render 를 복사해 두므로 프로토타입과 인스턴스를 함께 감싼다.
const wrappedTargets=new WeakSet();
function wrapOnce(target){if(!target||wrappedTargets.has(target)||typeof target.render!=='function')return;wrappedTargets.add(target);target.render=wrapFn(target.render);}
function wrapAll(){try{const C=window.__STORYWORLD_PHASE1__?.controller,r=C?.state?.three;if(!r)return;wrapOnce(Object.getPrototypeOf(r));
 if(Object.prototype.hasOwnProperty.call(r,'render'))wrapOnce(r);}catch(e){fail(e);}}
setInterval(wrapAll,500);wrapAll();
function set(p){for(const k of ['paths','ground'])if(typeof p?.[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_PERF_R272__=Object.freeze({revision:REV,pathKey,set,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,browserVerified:false,GPUVerified:false})});
})();
