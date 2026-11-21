// R1288 오류 기록 보존 헤드리스 검사(소프트웨어 렌더 — GPU·실기기·자연 플레이 미검증)
//  실행: 정적 서버(/m0/ = 빌드 결과)를 띄우고  SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1288/r1288-browser.mjs
//  ① 비동기 오류·처리 안 된 Promise 거절·프레임 루프 오류가 모두 기록된다(스택·지역·영웅 포함)
//  ② 새로고침 뒤에도 남고 설정 '상태 및 진단'에 보이며 복사·지우기 단추가 있다
//  ③ 경계: 같은 오류는 한 줄로 합쳐 횟수만 늘고, 최대 20건, 한 건 2000자 이하
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
let pass=0,total=0;const ok=(n,c,d)=>{total++;if(c)pass++;console.log(c?'PASS':'FAIL',n,d===undefined?'':JSON.stringify(d).slice(0,600));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript(()=>{try{if(!sessionStorage.getItem('r1288.booted')){localStorage.removeItem('storyworld.r1288.errors');sessionStorage.setItem('r1288.booted','1');}}catch(_){}});
const p=await ctx.newPage();
const start=async()=>{await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});};
await p.goto(URL);await start();
const api=await p.evaluate(()=>!!window.__STORYWORLD_ERROR_LOG_R1288__);ok('API present',api);
const L=()=>p.evaluate(()=>window.__STORYWORLD_ERROR_LOG_R1288__?.list?.()||[]);
// ① 비동기 오류 3번(같은 오류 → 한 줄, count 3)
await p.evaluate(()=>{for(let i=0;i<3;i++)setTimeout(()=>{throw new Error('r1288-async-probe');},10*i);});await p.waitForFunction(()=>(window.__STORYWORLD_ERROR_LOG_R1288__?.list?.()||[]).some(r=>/r1288-async-probe/.test(r.message)&&r.count>=3),null,{timeout:5000}).catch(()=>{});
let rows=await L();const a=rows.find(r=>/r1288-async-probe/.test(r.message));
ok('async error recorded with stack, zone, hero',!!a&&/r1288-async-probe/.test(a.stack||'')&&!!a.zone&&!!a.hero&&!!a.at,a);
ok('same error collapsed into one row with count 3',rows.filter(r=>/r1288-async-probe/.test(r.message)).length===1&&a?.count===3,a);
await p.evaluate(()=>{Promise.reject(new Error('r1288-promise-probe'));});await p.waitForTimeout(300);
rows=await L();ok('unhandled promise rejection recorded',rows.some(r=>/r1288-promise-probe/.test(r.message)&&r.kind==='promise'),rows.map(r=>r.message));
// ③ 경계: 2000자 넘는 메시지 자르기, 30종 넣으면 20건만(새 것 남김)
await p.evaluate(()=>{setTimeout(()=>{throw new Error('r1288-long-'+'x'.repeat(5000));},0);for(let i=0;i<30;i++)setTimeout(()=>{throw new Error('r1288-many-'+i);},5+i);});await p.waitForTimeout(800);
rows=await L();const long=rows.find(r=>/r1288-long-/.test(r.message));
ok('max 20 rows kept, newest kept',rows.length===20&&rows.some(r=>/r1288-many-29\b/.test(r.message))&&!rows.some(r=>/r1288-async-probe/.test(r.message)),rows.length);
ok('each row ≤ 2000 chars of message+stack',rows.every(r=>(r.message||'').length<=2000&&(r.stack||'').length<=2000),rows.map(r=>(r.stack||'').length));
// 프레임 루프 오류(게임이 멈추는 쪽): updateHUD 가 한 번 던지게
await p.evaluate(()=>{const o=updateHUD;updateHUD=function(){updateHUD=o;throw new Error('r1288-frame-probe');};});
await p.waitForFunction(()=>!booted,null,{timeout:20000}).catch(()=>{});
rows=await L();const f=rows.find(r=>/r1288-frame-probe/.test(r.message));
ok('frame-loop error recorded as kind frame (game stopped)',!!f&&f.kind==='frame'&&await p.evaluate(()=>!booted),f);
// 기존 R63R2 알림·진단 회귀
ok('R63R2 toast summary still shown',await p.evaluate(()=>/상태 및 진단/.test(document.getElementById('fatal')?.textContent||'')));
// ② 새로고침 뒤
await p.reload();await start();
rows=await L();ok('rows persist after reload',rows.some(r=>/r1288-frame-probe/.test(r.message)),rows.length);
// R1288b: 사용자는 메뉴의 진단 창(showDiagnostics — 지금은 마지막 덧씌우기가 '적이 보이지 않을 때' 창을 연다)으로 갔다 — 그 창 제목 바로 뒤에도 같은 기록·복사 단추
await p.evaluate(()=>showDiagnostics());await p.waitForTimeout(300);
const dg=await p.evaluate(()=>{const s=document.querySelector('#panel #errorLogR1288');const h2=document.querySelector('#panel h2');return s?{text:s.textContent,copy:!!s.querySelector('[data-r1288="copy"]'),title:h2?.textContent||'',afterTitle:!!h2&&!!(h2.compareDocumentPosition(s)&Node.DOCUMENT_POSITION_FOLLOWING),beforeActions:(()=>{const a=document.querySelector('#panel #checkAgain');return !a||!!(s.compareDocumentPosition(a)&Node.DOCUMENT_POSITION_FOLLOWING);})()}:null;});
ok('메뉴 적 상태 창(showDiagnostics) 제목 바로 뒤에도 기록·복사 단추',!!dg&&/r1288-frame-probe/.test(dg.text)&&dg.copy&&dg.afterTitle&&dg.beforeActions,dg&&{...dg,text:dg.text.slice(0,40)});
await p.evaluate(()=>document.getElementById('enemyStatusAssets24')?.click());await p.waitForTimeout(400);
const dg2=await p.evaluate(()=>{const s=document.querySelector('#panel #errorLogR1288');const h2=document.querySelector('#panel h2');return {title:h2?.textContent||'',has:!!s,copy:!!s?.querySelector('[data-r1288="copy"]'),afterTitle:!!s&&!!h2&&!!(h2.compareDocumentPosition(s)&Node.DOCUMENT_POSITION_FOLLOWING),text:(s?.textContent||'').slice(0,40)};});
ok("'자산' 단추로 연 '상태·자산·전투 진단' 창에도 기록·복사 단추(제목 바로 뒤)",/상태·자산·전투 진단/.test(dg2.title)&&dg2.has&&dg2.copy&&dg2.afterTitle,dg2);
await p.evaluate(()=>closePanel(true));await p.waitForTimeout(200);
await p.evaluate(()=>showSettings());await p.waitForTimeout(300);
const ui=await p.evaluate(()=>{const s=document.getElementById('errorLogR1288');return s?{inDiag:!!s.closest('#statusDiagnosticsR63R2')||!!document.querySelector('#statusDiagnosticsR63R2 ~ #errorLogR1288, #statusDiagnosticsR63R2 #errorLogR1288')||!!s.parentElement?.querySelector('#statusDiagnosticsR63R2'),text:s.textContent,copy:!!s.querySelector('[data-r1288="copy"]'),clear:!!s.querySelector('[data-r1288="clear"]')}:null;});
ok('settings shows saved log with frame probe, copy and clear buttons',!!ui&&/r1288-frame-probe/.test(ui.text)&&ui.copy&&ui.clear,ui&&{...ui,text:ui.text.slice(0,200)});
await p.evaluate(()=>document.querySelector('#errorLogR1288 [data-r1288="clear"]')?.click());await p.waitForTimeout(200);
ok('clear button empties log',(await L()).length===0&&await p.evaluate(()=>/저장된 오류 없음/.test(document.getElementById('errorLogR1288')?.textContent||'')));
console.log(`R1288 browser ${pass}/${total}`);await b.close();process.exit(pass===total?0:1);
