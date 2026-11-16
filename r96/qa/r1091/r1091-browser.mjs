// R1091 헤드리스 확인: 새 게임 → 감은 채 로딩 → 세계가 보이면 눈뜨기 → 숨김 / 쓰러짐 → 눈감기 → 창 아래 감은 채 → 쉼터로 → 다시 눈뜨기.
// 실행: node r1091-browser.mjs <out dir>  (SW_URL 기본 http://127.0.0.1:4410/m0/?eye1091=1). 헤드리스 소프트웨어 렌더링이라 GPU·실기기 확인이 아니다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('/opt/node-tools/node_modules/playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/?eye1091=1',out=process.argv[2]||'.';let n=0,bad=0;
const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d):''));};
const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.goto(URL);
const S=()=>p.evaluate(()=>window.__STORYWORLD_EYELID_R1091__.inspect());
await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
const armed=await S();ok('new game arms the lids shut',armed.phase==='shut'&&armed.stats.arms===1,armed);
// 서사창·장면을 넘기며 세계가 보일 때까지 — 눈뜨기 시작을 잡는다
const seen=[];const t0=Date.now();
while(Date.now()-t0<240000){const s=await p.evaluate(()=>{const I=window.__STORYWORLD_EYELID_R1091__.inspect();if(started&&!loading&&I.phase==='shut'){for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);}return {phase:I.phase==='idle'&&I.stats.opens>0?'opened':I.phase,o:I.openness,loading,modal}});
 if(!seen.includes(s.phase))seen.push(s.phase);if(s.phase==='opening'||(seen.includes('shut')&&s.phase==='idle'))break;await p.waitForTimeout(150);}
ok('lids stay shut through loading, then start opening when the world is visible',seen.includes('shut')&&(seen.includes('opening')||seen.includes('opened'))&&seen.indexOf('shut')<Math.max(seen.indexOf('opening'),seen.indexOf('opened')),seen);
const shots=[];for(let i=0;i<9;i++){const s=await S();shots.push(+s.openness.toFixed(2));await p.screenshot({path:`${out}/open-${i}.png`});if(s.phase==='idle')break;await p.waitForTimeout(150);}
await p.waitForTimeout(2500);const done=await S();
ok('opening finishes: idle, canvas hidden, one open counted',done.phase==='idle'&&done.stats.opens===1&&await p.evaluate(()=>document.getElementById('eyelidR1091').style.display==='none'),{done,shots});
await p.screenshot({path:`${out}/open-done.png`});
// 쓰러짐
await p.evaluate(()=>{player.invincible=0;player.guard=false;player.shield=0;player.revived[layerKey()]=true;hurt(1e7,{forcedStory:true});});
await p.waitForTimeout(250);const c1=await S();ok('death starts closing within 0.25s (watcher ticks every 0.1s; or already shut on a slow machine)',c1.phase==='closing'||(c1.phase==='shut'&&c1.stats.closes===1),c1);
for(let i=0;i<8;i++){await p.screenshot({path:`${out}/close-${i}.png`});await p.waitForTimeout(170);}
await p.waitForTimeout(1500);const c2=await S();const panel=await p.evaluate(()=>!!document.getElementById('reviveHome')&&modal);
ok('after closing: shut and the death panel is up over it',c2.phase==='shut'&&c2.stats.closes===1&&panel,{c2,panel});
await p.screenshot({path:`${out}/death-panel.png`});
await p.evaluate(()=>document.getElementById('reviveHome').click());
let reopened=false;const t1=Date.now();while(Date.now()-t1<120000){const s=await p.evaluate(()=>{if(started&&!loading&&player.hp>0){for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);}return window.__STORYWORLD_EYELID_R1091__.inspect().phase;});if(s==='opening'||s==='idle'){reopened=true;break;}await p.waitForTimeout(200);}
await p.waitForTimeout(3000);const c3=await S();ok('return to refuge → eyes open again and hide',reopened&&c3.phase==='idle'&&c3.stats.opens===2,c3);
ok('no errors in the module, no page errors',c3.stats.errors===0&&errs.length===0,{e:c3.lastError,errs});
ok('renderer still Three',await p.evaluate(()=>!!window.__STORYWORLD_PHASE1__?.controller?.state?.three));
// 자동 검사 주소(?eye1091 없음)에서는 하지 않음
const q=await ctx.newPage();await q.goto(URL.replace(/\?eye1091=1/,''));await q.locator('#campaignNew54').click({timeout:180000});await q.locator('#slotConfirmR73').click();
const w=await q.evaluate(()=>window.__STORYWORLD_EYELID_R1091__.inspect());ok('plain automation URL: skipped (CI screenshots unaffected)',w.phase==='idle'&&w.stats.skipped>0,w);
console.log(`\nR1091 browser: ${n-bad}/${n} pass`);await b.close();process.exit(bad?1:0);
