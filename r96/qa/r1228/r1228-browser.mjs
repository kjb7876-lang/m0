// R1228 헤드리스 브라우저 검사: 실제 게임(dist06 추락, 슬레이어)에서 3D 그리기 중 예외 1번·WebGL 문맥 잃음 1번을 일부러 내고
//  ① PC 테스트가 멈추지 않는지(modal 아님, 실패 상태 아님) ② 3D 가 다시 그려지는지 ③ 게임 시간이 계속 흐르는지 본다.
// 실행: node r1228-browser.mjs  (SW_URL 기본 http://127.0.0.1:4410/m0/, R1228_OFF=1 이면 복구 모듈을 빼고 돌려 예전 멈춤을 확인)
// 헤드리스 소프트웨어 렌더링(SwiftShader) 결과다. GPU·실기기 확인이 아니다.
import {chromium,boot,go,skip} from '../r444/lib.mjs';
let n=0,bad=0;const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d).slice(0,400):''));};
const b=await chromium.launch();
const ctx0=process.env.R1228_OFF?{}:null;
const {p}=await (async()=>{if(!process.env.R1228_OFF)return boot(b,{vp:{width:960,height:540}});
 const c=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});await c.route('**/three-recover-r1228.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:'/* off */'}));
 const pg=await c.newPage();return boot({newContext:async()=>({addInitScript:(...a)=>c.addInitScript(...a),newPage:async()=>pg})},{vp:{width:960,height:540}});})();
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.evaluate(()=>{player.hero='slayer';});await go(p,'dist06');
await p.evaluate(()=>{hurt=function(){return 0;};player.x=19.5;player.y=24;});
const st=()=>p.evaluate(()=>{const c=window.__STORYWORLD_PHASE1__.controller;return {failed:c.state.failed,active:c.state.active,three:!!c.state.three,modal:!!modal,time:+time.toFixed(2),reason:c.state.reason,rec:window.__STORYWORLD_THREE_RECOVER_R1228__?.inspect?.()||null,status:document.getElementById('phase1-status')?.textContent||''};});
const settle=async()=>{for(let i=0;i<40;i++){await p.waitForTimeout(250);const s=await st();if(s.active==='three'&&s.three&&!s.failed)return s;}return st();};
const s0=await settle();ok('시작: 3D 로 그리는 중',s0.active==='three'&&!s0.failed,s0);
// 1) 그리기 중 예외 1번(예: 그리기 명령 NaN)
await p.evaluate(()=>{const t=window.__STORYWORLD_PHASE1__.controller.state.three,r=t.render;let once=true;t.render=function(){if(once){once=false;throw Error('R1228 test: Nonfinite original draw command');}return r.apply(this,arguments);};});
await p.waitForTimeout(300);const s1=await st();ok('예외 직후: 실패 상태·멈춤 아님',!s1.failed&&!s1.modal,s1);
const s1b=await settle();ok('예외 뒤 3D 다시 그림',s1b.active==='three'&&s1b.three&&!s1b.failed,s1b);
const t1=s1b.time;await p.waitForTimeout(3000);const s1c=await st();ok('게임 시간이 계속 흐름',s1c.time>t1&&!s1c.modal,{t1,t2:s1c.time});
ok('"PC 테스트를 중단" 문구 없음',!/중단/.test(s1c.status),s1c.status);
// 2) WebGL 문맥 잃음 1번
const lost=await p.evaluate(()=>{const g=document.getElementById('phase1-webgl');const gl=g?.getContext('webgl2');const x=gl?.getExtension('WEBGL_lose_context');if(!x)return false;x.loseContext();return true;});
ok('문맥 잃음 확장 있음',lost);
await p.waitForTimeout(600);const s2=await st();ok('문맥 잃음 뒤: 멈춤 아님',!s2.modal&&!s2.failed,s2);
const s2b=await settle();ok('문맥 잃음 뒤 3D 다시 그림(새 캔버스)',s2b.active==='three'&&s2b.three,s2b);
const cv=await p.evaluate(()=>document.querySelectorAll('#phase1-webgl').length);ok('3D 캔버스는 하나만',cv===1,cv);
await p.screenshot({path:(process.env.OUT||'/tmp')+'/r1228-after.png'});
ok('페이지 오류 없음',errs.length===0,errs);
console.log(`${n-bad}/${n} passed`);await b.close();process.exit(bad?1:0);
