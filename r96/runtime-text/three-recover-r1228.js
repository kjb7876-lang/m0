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
const stats={wrapped:false,failures:0,recovered:0,gaveUp:0,last:null,attempts:[]};
const now=()=>{try{return performance.now();}catch(_){return Date.now();}};
const gl2=()=>{try{const f=window.__STORYWORLD_WEBGL_FALLBACK_R221__;if(f&&typeof f.probe==='function')return !!f.probe();const c=document.createElement('canvas');return !!c.getContext('webgl2');}catch(_){return false;}};
function remember(reason){try{const s=window.localStorage;if(!s)return;let rows=[];try{rows=JSON.parse(s.getItem(KEY)||'[]');}catch(_){rows=[];}if(!Array.isArray(rows))rows=[];
 rows.push({at:new Date().toISOString?.()||'',zone:typeof zone!=='undefined'?zone:null,hero:typeof player!=='undefined'&&player?player.hero:null,reason:String(reason).slice(0,300)});s.setItem(KEY,JSON.stringify(rows.slice(-5)));}catch(_){}}
function wrapHooks(hooks,ref){return Object.assign({},hooks,{notice(message){const m=String(message);
 if(!m.includes('시작하지 못해'))return hooks.notice?.call(hooks,message);
 const c=ref.c,reason=c?.state?.reason||m;stats.failures++;stats.last=String(reason);remember(reason);
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
 const next=Object.freeze({...api,createController(hooks,opts){const ref={c:null};ref.c=create.call(api,wrapHooks(hooks,ref),opts);return ref.c;}});
 try{window.StoryPhase1=next;stats.wrapped=window.StoryPhase1===next;}catch(_){stats.wrapped=false;}}
window.__STORYWORLD_THREE_RECOVER_R1228__=Object.freeze({revision:REV,limits:{windowMs:WINDOW_MS,max:MAX,delayMs:DELAY_MS},
 inspect:()=>({revision:REV,wrapped:stats.wrapped,failures:stats.failures,recovered:stats.recovered,gaveUp:stats.gaveUp,last:stats.last,recent:stats.attempts.length,stored:(()=>{try{return JSON.parse(window.localStorage?.getItem(KEY)||'[]');}catch(_){return [];}})()})});
})();
