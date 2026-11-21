// R1228 3D(Three.js) 일시 오류 복구.
// 사용자 2026-11-19: 추락(dist06) 보스방 들어가기 전, PC·슬레이어에서 "Three.js 실행 실패 · PC 테스트를 중단합니다." 가 뜨고 게임이 멈춤.
// 원인 구조: dist/phase1.js createController 는 3D 그리기·장면 캡처·조각 받기 중 예외를 한 번만 받아도 fallback() 으로 failed=true 가 되고
//  다시 시도하지 않는다. 그러면 hospital-pc-test.js 가 failed 를 보고 modal=true 로 플레이를 멈춘다(Canvas 대체 금지 규칙).
//  예외 한 번(그림 한 장 받기 실패·WebGL 문맥 잃음·그리기 명령 하나의 NaN 등)이 게임 전체를 끝내는 셈이다.
// 고침: WebGL2 가 있는 브라우저에서 생긴 일시 오류면 그 자리에서 실패 상태를 풀고(멈춤 없음) 새 캔버스·새 렌더러로 3D 를 다시 시작한다.
//  1분에 3번까지만 한다. 넘으면(진짜 고장) 예전처럼 알리되 상태 줄에 이유를 붙여 다음 보고에 원인이 남게 한다.
//  WebGL2 자체가 없으면 손대지 않는다(R221 안내 그대로). 이유는 localStorage storyworld.r1228.threeFail 에 최근 5개 남긴다.
// dist/phase1.js → webgl-fallback-r221.js 바로 뒤에 읽혀 createController 를 감싼다.
(()=>{'use strict';
if(window.__STORYWORLD_THREE_RECOVER_R1228__)return;
const REV='R1228-recover-1',WINDOW_MS=60000,MAX=3,DELAY_MS=250,KEY='storyworld.r1228.threeFail';
const NO_GL=/WebGL2 context unavailable|WebGL2.*(unavailable|not supported)|Error creating WebGL/i;
const stats={wrapped:false,failures:0,recovered:0,gaveUp:0,last:null,attempts:[],logged:0,unlogged:0};
// R1296 (사용자 2026-11-21 "Three.js 실행 실패 … (이유: Maximum call stack size exceeded)" 인데 설정 오류 기록엔 "저장된 오류 없음"):
//  phase1 은 장면 캡처(captureVisual)·3D 렌더·브리지 캡처의 예외를 삼키고 메시지만 fallback 에 넘긴다 → R1288 기록기(엔진 logError·window error)에 안 닿았다.
//  세 자리를 한 번씩만 감싸 '던진 오류 객체'를 잡아 두고(다시 던짐, 동작 그대로), 실패 알림이 올 때 R1288 기록에 종류 three·단계·스택으로 남긴다(복구된 실패도).
//  호출 스택 초과는 V8 기본 스택 10줄이 모두 재귀 한 고리라 어디서 들어왔는지 안 보인다 → 스택 줄 수를 60 으로 올리고, 되풀이되는 고리는 한 번만 쓰고 '×횟수'로 접는다.
try{if(!(Error.stackTraceLimit>=60))Error.stackTraceLimit=60;}catch(_){}
let caught=null;const keep=(phase,e)=>{caught={phase,err:e};};
function fold(stack){const L=String(stack||'').split('\n'),head=L.shift()||'',out=[];
 for(let i=0;i<L.length;){let done=false;for(let k=1;k<=12&&i+2*k<=L.length;k++){let r=1;while(i+(r+1)*k<=L.length&&L.slice(i+r*k,i+(r+1)*k).join('\n')===L.slice(i,i+k).join('\n'))r++;
  if(r>1){out.push(...L.slice(i,i+k));out.push('    … (위 '+k+'줄 ×'+r+' 반복)');i+=r*k;done=true;break;}}
  if(!done)out.push(L[i++]);}
 return [head,...out].join('\n').slice(0,1900);}
function logFail(reason){try{const E=window.__STORYWORLD_ERROR_LOG_R1288__;const c=caught;caught=null;
 if(!E||typeof E.record!=='function'){stats.unlogged++;return;}
 const msg=String(reason),e=c&&c.err,same=e&&msg===String(e&&e.message!=null?e.message:e);
 const phase=same?c.phase:'init';
 E.record('three',{message:'[3D '+phase+'] '+msg,stack:same&&e&&e.stack?fold(e.stack):''});stats.logged++;}catch(_){stats.unlogged++;}}
const once=new WeakSet();
function guard(c){try{const T=c&&c.state&&c.state.three;if(T&&!once.has(T)&&typeof T.render==='function'){once.add(T);const base=T.render;
  T.render=function renderR1296(){try{return base.apply(this,arguments);}catch(e){keep('render',e);throw e;}};}
 const B=c&&c.bridge;if(B&&!once.has(B)&&typeof B.capture==='function'){once.add(B);const base=B.capture;B.capture=function captureR1296(){try{return base.apply(this,arguments);}catch(e){keep('bridge',e);throw e;}};}}catch(_){}}
const now=()=>{try{return performance.now();}catch(_){return Date.now();}};
const gl2=()=>{try{const f=window.__STORYWORLD_WEBGL_FALLBACK_R221__;if(f&&typeof f.probe==='function')return !!f.probe();const c=document.createElement('canvas');return !!c.getContext('webgl2');}catch(_){return false;}};
function remember(reason){try{const s=window.localStorage;if(!s)return;let rows=[];try{rows=JSON.parse(s.getItem(KEY)||'[]');}catch(_){rows=[];}if(!Array.isArray(rows))rows=[];
 rows.push({at:new Date().toISOString?.()||'',zone:typeof zone!=='undefined'?zone:null,hero:typeof player!=='undefined'&&player?player.hero:null,reason:String(reason).slice(0,300)});s.setItem(KEY,JSON.stringify(rows.slice(-5)));}catch(_){}}
function wrapHooks(hooks,ref){return Object.assign({},hooks,typeof hooks.captureVisual==='function'?{captureVisual(){try{return hooks.captureVisual.apply(hooks,arguments);}catch(e){keep('capture',e);throw e;}}}:{},{notice(message){const m=String(message);
 if(!m.includes('시작하지 못해'))return hooks.notice?.call(hooks,message);
 const c=ref.c,reason=c?.state?.reason||m;stats.failures++;stats.last=String(reason);remember(reason);logFail(reason);
 const t=now();stats.attempts=stats.attempts.filter(a=>t-a<WINDOW_MS);
 const can=!!c&&!c.state.disposed&&stats.attempts.length<MAX&&!NO_GL.test(m)&&gl2();
 if(can){stats.attempts.push(t);
  // 실패 상태를 그 자리에서 푼다 → hospital-pc-test 가 멈춤(modal)을 걸지 않는다. 3D 가 다시 뜰 때까지는 요구 경로대로 빈 3D 화면.
  c.state.failed=false;c.state.reason='R1228 3D 다시 시작 중 · '+String(reason).slice(0,160);
  setTimeout(async()=>{try{if(c.state.disposed||c.state.three||c.state.failed)return;await c.initialize();if(c.state.three&&!c.state.failed)stats.recovered++;}catch(_){}},DELAY_MS);
  return;}
 stats.gaveUp++;const r=hooks.notice?.call(hooks,message);
 try{const n=document.getElementById('phase1-status');if(n&&!String(n.textContent).includes('이유:'))n.textContent+=' (이유: '+String(reason).slice(0,140)+')';}catch(_){}
 return r;}});}
const api=window.StoryPhase1;
if(api&&typeof api.createController==='function'){
 const create=api.createController;
 const next=Object.freeze({...api,createController(hooks,opts){const ref={c:null};ref.c=create.call(api,wrapHooks(hooks,ref),opts);const c=ref.c;if(c&&typeof c.draw==='function'){const d=c.draw;c.draw=function(){guard(c);return d.apply(this,arguments);};}return c;}});
 try{window.StoryPhase1=next;stats.wrapped=window.StoryPhase1===next;}catch(_){stats.wrapped=false;}}
window.__STORYWORLD_THREE_RECOVER_R1228__=Object.freeze({revision:REV,limits:{windowMs:WINDOW_MS,max:MAX,delayMs:DELAY_MS},
 inspect:()=>({revision:REV,wrapped:stats.wrapped,failures:stats.failures,recovered:stats.recovered,gaveUp:stats.gaveUp,last:stats.last,recent:stats.attempts.length,logged:stats.logged,unlogged:stats.unlogged,stored:(()=>{try{return JSON.parse(window.localStorage?.getItem(KEY)||'[]');}catch(_){return [];}})()})});
})();
