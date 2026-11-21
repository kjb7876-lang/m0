// R1296 브라우저 확인(헤드리스 소프트웨어 렌더링 — GPU·실기기·자연 플레이 아님):
//  실제 게임에서 영웅 그리기(drawHero)가 한 프레임 동안 끝없이 재귀하게 만들어 3D 장면 캡처가 '호출 스택 초과'로 실패하게 한 뒤
//  ① 설정의 '저장된 오류 기록'에 [3D capture] Maximum call stack size exceeded 가 스택(재귀 함수 이름·접힌 반복 줄)과 함께 남는지
//  ② 지역·영웅이 함께 남는지 ③ R1228 이 3D 를 다시 시작해 게임이 이어지는지(멈춤 없음) ④ 새로고침 뒤에도 남는지 본다.
//  URL=http://127.0.0.1:4410/new/ node r96/qa/r1296/r1296-browser.mjs
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.URL||'http://127.0.0.1:4410/m0/';let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,700):''));};
const b=await chromium.launch({headless:true});const p=await (await b.newContext({viewport:{width:960,height:540}})).newPage();
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(()=>{window.__STORYWORLD_ERROR_LOG_R1288__.clear();player.invincible=1e9;});
const t1=await p.evaluate(()=>time);
await p.evaluate(()=>{const base=drawHero;let left=1;
 function r1296LoopB(){return r1296LoopA.apply(this,arguments);}
 function r1296LoopA(){if(left>0&&window.__r1296go){return r1296LoopB.apply(this,arguments);}return base.apply(this,arguments);}
 drawHero=r1296LoopA;window.__r1296go=true;setTimeout(()=>{window.__r1296go=false;},60);});
await p.waitForTimeout(4000);
const r=await p.evaluate(()=>({rows:window.__STORYWORLD_ERROR_LOG_R1288__.list(),rec:window.__STORYWORLD_THREE_RECOVER_R1228__.inspect(),zone:room?.id,hero:player.hero,modal:!!modal,time}));
const x=r.rows.find(v=>v.kind==='three')||{};
ok(/^\[3D capture\] Maximum call stack size exceeded/.test(x.message||''),'① 기록: [3D capture] Maximum call stack size exceeded',{message:x.message,count:x.count,all:r.rows.map(v=>v.kind+':'+v.message.slice(0,60))});
ok(/r1296LoopA/.test(x.stack||'')&&/r1296LoopB/.test(x.stack||'')&&/반복/.test(x.stack||''),'① 스택에 재귀 함수 이름과 접힌 반복 줄',String(x.stack||'').split('\n').slice(0,12));
ok(x.zone===r.zone&&x.hero===r.hero&&!!x.zone,'② 지역·영웅 함께 남음',{zone:x.zone,hero:x.hero});
ok(r.rec.logged>=1&&r.rec.recovered>=1&&r.rec.gaveUp===0&&!r.modal&&r.time>t1,'③ 3D 다시 시작, 게임 계속(멈춤 없음)',r.rec);
await p.evaluate(()=>{try{showSettings();}catch(_){}});await p.waitForTimeout(500);
const txt=await p.evaluate(()=>document.querySelector('#errorLogR1288 pre')?.textContent||'');
ok(/\[three\]/.test(txt)&&/3D capture/.test(txt),'① 설정 창 오류 기록 칸에 보임',txt.slice(0,300));
await p.reload();await p.waitForFunction(()=>!!window.__STORYWORLD_ERROR_LOG_R1288__,null,{timeout:180000});
const after=await p.evaluate(()=>window.__STORYWORLD_ERROR_LOG_R1288__.list().filter(v=>v.kind==='three').length);ok(after>=1,'④ 새로고침 뒤에도 남음',after);
console.log(`${n-bad}/${n} ${bad?'FAIL':'PASS'}`);await b.close();process.exit(bad?1:0);
