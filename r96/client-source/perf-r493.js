// R493 렉 개선 — 같은 셰이더 프로그램을 버렸다 다시 컴파일하지 않게 붙잡아 두기(사용자 2026-11-09 밤 "렉도 최대한 없도록 렉개선").
//  재현(헤드리스 640×360, 777 → 길잡이 켬, 게임 약 14초): gl.linkProgram 이 dist00 53번·ep1a08 88번·ep1b04 168번 불렸는데
//   그 순간 살아 있는 프로그램은 25·38·56개뿐이었다. 같은 열쇠(대부분 'basic,highp…' = 장면 명령 그림 재질)의 프로그램이
//   그 재질을 쓰던 줄이 모두 사라질 때 three 가 프로그램을 지우고(usedTimes 0 → destroy), 다음 장면에 같은 재질이 다시 나오면 새로 컴파일했다.
//   셰이더 컴파일·링크는 GPU 드라이버 일이라(특히 Windows ANGLE·휴대폰) 한 번에 수~수십 ms 멈춘다 — 이펙트·몹이 나타나는 순간의 '멈칫'.
//  고침: 렌더러의 프로그램 목록(renderer.info.programs = three WebGLPrograms 의 programs 배열)에 새 프로그램이 들어올 때
//   usedTimes 를 1 올려 붙잡아 둔다 → 재질이 모두 버려져도 프로그램은 남고, 같은 열쇠의 새 재질은 three 가 그대로 다시 쓴다(새 링크 없음).
//   상한 256개(지역 하나에 25~60개, 프로그램 하나는 GPU 메모리 수십 KB) — 넘으면 더 붙잡지 않고 예전처럼 둔다. 렌더러가 바뀌면 새 목록에 붙는다.
//  그림·순서·판정·저장은 바꾸지 않는다(같은 열쇠 = 같은 셰이더). 끄기: localStorage['storyworld.r493.perf']='{"pinPrograms":false}' (다시 불러온 뒤부터)
(()=>{'use strict';
if(window.__STORYWORLD_PERF_R493__)return;
const REV='R493-perf-1',KEY='storyworld.r493.perf',CAP=256;
let prefs={pinPrograms:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
let errors=0,lastError=null,attached=0,reuse=0;const fail=e=>{errors++;lastError=String(e?.message||e).slice(0,160);};
const pinned=new Set();let list=null;
// 직접 짠 셰이더(ShaderMaterial)의 열쇠는 셰이더 글 번호('12,13,…')로 시작한다 — 그 글을 쓰는 재질이 모두 사라지면 three 가 번호를 버려
//  다음엔 새 번호(새 열쇠)가 된다. 장면 명령의 그라디언트 칠(CommandScene.gradientMaterial — 어둠·빛 원 등)이 바로 이 경우라
//  ep1b04 25초에 같은 글의 재질이 25번 새로 만들어지며 그때마다 새 번호로 다시 컴파일했다.
//  → 같은 글의 '지킴이' 재질 하나를 한 번 컴파일해 두고 버리지 않는다(셰이더 글 번호 고정 → 열쇠 고정 → 위 붙잡기로 다시 씀).
//  지킴이가 지키는 번호의 열쇠만 붙잡고, 그 밖의 직접 짠 셰이더 열쇠는 붙잡지 않는다(번호가 매번 새로워 상한만 먹음).
const CUSTOM=/^(\d+,\d+),/;let skipped=0;const kept=new Set();let keepers=0,keeperFor=null,keeperTries=0;
function pin(p){if(!p||typeof p!=='object'||pinned.has(p)||pinned.size>=CAP||typeof p.usedTimes!=='number')return;const m=CUSTOM.exec(String(p.cacheKey));if(m&&!kept.has(m[1])){skipped++;return;}p.usedTimes++;pinned.add(p);}
function keepGradient(three){const R=three?.renderer,T=three?.T||R?.T,S=three?.commands;if(!R||!T||typeof S?.gradientMaterial!=='function'||typeof R.compile!=='function'||!R.properties)return false;
 const mat=S.gradientMaterial({kind:'linear',matrix:[1,0,0,1,0,0],args:[0,0,1,0],stops:[{offset:0,color:'rgba(0,0,0,1)'},{offset:1,color:'rgba(255,255,255,1)'}]});
 const scene=new T.Scene(),mesh=new T.Mesh(new T.BufferGeometry(),mat);scene.add(mesh);R.compile(scene,three.camera||new T.OrthographicCamera());
 const key=String(R.properties.get(mat)?.currentProgram?.cacheKey||''),m=CUSTOM.exec(key);if(!m)return false;kept.add(m[1]);keepers++;
 for(const q of R.info.programs)if(String(q.cacheKey).startsWith(m[1]+','))pin(q);/* 지킴이 프로그램(이미 목록에 들어감) */
 three.__r493Keeper=mesh;return true;}
function attach(arr){if(!Array.isArray(arr)||arr.__r493)return false;const push=arr.push;
 Object.defineProperty(arr,'push',{configurable:true,writable:true,value:function(...items){try{if(prefs.pinPrograms)for(const p of items)pin(p);}catch(e){fail(e);}return push.apply(this,items);}});
 Object.defineProperty(arr,'__r493',{value:true});pinned.clear();/* 새 렌더러: 예전 목록의 붙잡음은 그 렌더러와 함께 버려진다 */if(prefs.pinPrograms)for(const p of arr)pin(p);list=arr;attached++;return true;}
function tick(){try{if(!prefs.pinPrograms)return;const three=window.__STORYWORLD_PHASE1__?.controller?.state?.three,arr=three?.renderer?.info?.programs;if(arr&&arr!==list){attach(arr);kept.clear();keeperFor=null;keeperTries=0;}
  if(arr&&keeperFor!==three.renderer&&keeperTries<40){keeperFor=three.renderer;keeperTries++;try{if(!keepGradient(three))keeperFor=null;}catch(e){fail(e);keeperFor=null;}}}catch(e){fail(e);}}
setInterval(tick,250);
function set(p){if(typeof p?.pinPrograms==='boolean')prefs.pinPrograms=p.pinPrograms;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_PERF_R493__=Object.freeze({revision:REV,tick,set,inspect:()=>({revision:REV,prefs:{...prefs},pinned:pinned.size,skipped,keepers,cap:CAP,attached,live:list?list.length:0,errors,lastError})});
})();
