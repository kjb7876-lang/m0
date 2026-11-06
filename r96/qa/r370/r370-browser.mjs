// R370 headless — 숨은 서사창(storyScene 남음·창 닫힘) 자동 풀림, 정상 서사창은 그대로. 실제 사몽 777 저장→재실행 경로는 미검증(Dots 실플레이로 확인).
//   STORYWORLD_URL=http://127.0.0.1:4436/m0/ node r96/qa/r370/r370-browser.mjs
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);let chromium;
for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4436/m0/';let fails=0,n=0;const check=(m,c,i)=>{n++;if(!c)fails++;console.log((c?'PASS ':'FAIL ')+m+(i===undefined?'':' '+JSON.stringify(i).slice(0,300)));};
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:1280,height:720}});
await ctx.addInitScript(()=>localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false})));const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await p.waitForTimeout(800);await skip();
// 정상 서사창: 3초 동안 그대로
await p.evaluate(()=>playScenes([{id:room.id,key:'r370-a',title:'시험',text:'첫 장면',narrator:''},{id:room.id,key:'r370-b',title:'시험',text:'둘째 장면',narrator:''}],()=>{window.__r370done=(window.__r370done||0)+1;}));
await p.waitForTimeout(3000);let s=await p.evaluate(()=>({story:storyScene?.key,modal}));check('정상 서사창은 자동으로 넘기지 않음',s.story==='r370-a'&&s.modal,s);
// PLAY-08 상태: 서사가 남은 채 창만 닫힘 → Esc 무반응이던 것
await p.evaluate(()=>closePanel(true));s=await p.evaluate(()=>({story:storyScene?.key,modal}));check('재현 상태: storyScene 남고 창 닫힘',s.story==='r370-a'&&!s.modal,s);
await p.waitForTimeout(1000);s=await p.evaluate(()=>({story:storyScene?.key,modal,orph:window.__STORYWORLD_SAVE_TRANSITION_R320__.inspect().orphanStory}));
check('0.6초 뒤 남은 장면(둘째)을 창으로 다시 보여 줌',s.story==='r370-b'&&s.modal&&s.orph===1,s);
await p.evaluate(()=>closePanel(true));await p.waitForTimeout(1000);s=await p.evaluate(()=>({story:!!storyScene,modal,done:window.__r370done||0}));
check('마지막 장면이 숨으면 끝 처리까지(storyDone 1번)',!s.story&&!s.modal&&s.done===1,s);
await p.keyboard.press('Escape');await p.waitForTimeout(400);s=await p.evaluate(()=>({modal,menu:!!document.getElementById('menuClose')}));check('그 뒤 Esc 로 메뉴가 열림',s.modal&&s.menu,s);
check('페이지 오류 없음',!errors.length,errors);await b.close();console.log(fails?`FAIL ${fails}`:`ALL ${n} PASS`);process.exit(fails?1:0);
