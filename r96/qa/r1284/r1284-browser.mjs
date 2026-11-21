// R1284 오류 기록 보존 헤드리스 검사(소프트웨어 렌더 — GPU·실기기·자연 플레이 미검증)
//  실행: 정적 서버(/m0/ = 빌드 결과)를 띄우고  SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1284/r1284-browser.mjs
//  ① 비동기 오류·처리 안 된 Promise 거절·프레임 루프 오류가 모두 기록된다(스택·지역·영웅 포함)
//  ② 새로고침 뒤에도 남고 설정 '상태 및 진단'에 보이며 복사·지우기 단추가 있다
//  ③ 경계: 같은 오류는 한 줄로 합쳐 횟수만 늘고, 최대 20건, 한 건 2000자 이하
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
let pass=0,total=0;const ok=(n,c,d)=>{total++;if(c)pass++;console.log(c?'PASS':'FAIL',n,d===undefined?'':JSON.stringify(d).slice(0,600));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{try{if(!sessionStorage.getItem('r1284.booted')){localStorage.removeItem('storyworld.r1284.errors');sessionStorage.setItem('r1284.booted','1');}}catch(_){}});
const p=await ctx.newPage();
const start=async()=>{await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});};
await p.goto(URL);await start();
const api=await p.evaluate(()=>!!window.__STORYWORLD_ERROR_LOG_R1284__);ok('API present',api);
const L=()=>p.evaluate(()=>window.__STORYWORLD_ERROR_LOG_R1284__?.list?.()||[]);
// ① 비동기 오류 3번(같은 오류 → 한 줄, count 3)
await p.evaluate(()=>{for(let i=0;i<3;i++)setTimeout(()=>{throw new Error('r1284-async-probe');},10*i);});await p.waitForTimeout(400);
let rows=await L();const a=rows.find(r=>/r1284-async-probe/.test(r.message));
ok('async error recorded with stack, zone, hero',!!a&&/r1284-async-probe/.test(a.stack||'')&&!!a.zone&&!!a.hero&&!!a.at,a);
ok('same error collapsed into one row with count 3',rows.filter(r=>/r1284-async-probe/.test(r.message)).length===1&&a?.count===3,a);
await p.evaluate(()=>{Promise.reject(new Error('r1284-promise-probe'));});await p.waitForTimeout(300);
rows=await L();ok('unhandled promise rejection recorded',rows.some(r=>/r1284-promise-probe/.test(r.message)&&r.kind==='promise'),rows.map(r=>r.message));
// ③ 경계: 2000자 넘는 메시지 자르기, 30종 넣으면 20건만(새 것 남김)
await p.evaluate(()=>{setTimeout(()=>{throw new Error('r1284-long-'+'x'.repeat(5000));},0);for(let i=0;i<30;i++)setTimeout(()=>{throw new Error('r1284-many-'+i);},5+i);});await p.waitForTimeout(800);
rows=await L();const long=rows.find(r=>/r1284-long-/.test(r.message));
ok('max 20 rows kept, newest kept',rows.length===20&&rows.some(r=>/r1284-many-29\b/.test(r.message))&&!rows.some(r=>/r1284-async-probe/.test(r.message)),rows.length);
ok('each row ≤ 2000 chars of message+stack',rows.every(r=>(r.message||'').length<=2000&&(r.stack||'').length<=2000),rows.map(r=>(r.stack||'').length));
// 프레임 루프 오류(게임이 멈추는 쪽): updateHUD 가 한 번 던지게
await p.evaluate(()=>{const o=updateHUD;updateHUD=function(){updateHUD=o;throw new Error('r1284-frame-probe');};});
await p.waitForFunction(()=>!booted,null,{timeout:20000}).catch(()=>{});
rows=await L();const f=rows.find(r=>/r1284-frame-probe/.test(r.message));
ok('frame-loop error recorded as kind frame (game stopped)',!!f&&f.kind==='frame'&&await p.evaluate(()=>!booted),f);
// 기존 R63R2 알림·진단 회귀
ok('R63R2 toast summary still shown',await p.evaluate(()=>/상태 및 진단/.test(document.getElementById('fatal')?.textContent||'')));
// ② 새로고침 뒤
await p.reload();await start();
rows=await L();ok('rows persist after reload',rows.some(r=>/r1284-frame-probe/.test(r.message)),rows.length);
await p.evaluate(()=>showSettings());await p.waitForTimeout(300);
const ui=await p.evaluate(()=>{const s=document.getElementById('errorLogR1284');return s?{inDiag:!!s.closest('#statusDiagnosticsR63R2')||!!document.querySelector('#statusDiagnosticsR63R2 ~ #errorLogR1284, #statusDiagnosticsR63R2 #errorLogR1284')||!!s.parentElement?.querySelector('#statusDiagnosticsR63R2'),text:s.textContent,copy:!!s.querySelector('[data-r1284="copy"]'),clear:!!s.querySelector('[data-r1284="clear"]')}:null;});
ok('settings shows saved log with frame probe, copy and clear buttons',!!ui&&/r1284-frame-probe/.test(ui.text)&&ui.copy&&ui.clear,ui&&{...ui,text:ui.text.slice(0,200)});
await p.evaluate(()=>document.querySelector('#errorLogR1284 [data-r1284="clear"]')?.click());await p.waitForTimeout(200);
ok('clear button empties log',(await L()).length===0&&await p.evaluate(()=>/저장된 오류 없음/.test(document.getElementById('errorLogR1284')?.textContent||'')));
console.log(`R1284 browser ${pass}/${total}`);await b.close();process.exit(pass===total?0:1);
