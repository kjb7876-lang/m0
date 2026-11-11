// R701 브라우저 검사(헤드리스·소프트웨어 렌더링 — 그래픽/실기기/자연 플레이 검증 아님)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SHOTS=process.env.SHOTS||'';let fail=0;
const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,240):'');if(!c)fail++;};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const shot=async n=>{if(SHOTS)await p.screenshot({path:SHOTS+'/'+n+'.png'});};const A=f=>p.evaluate(f);
await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});await p.locator('#survivalStartR600').click();
ok('difficulty panel first',await A(()=>document.querySelectorAll('[data-r600diff]').length===4&&!document.querySelector('[data-r600hero]')));await shot('r701-1-difficulty');
await p.locator('[data-r600diff="hard"]').click();
ok('hero picker with portrait and description',await A(()=>document.querySelectorAll('[data-r600hero]').length>=7&&!!document.querySelector('#r600Stage .pt img')&&/패시브/.test(document.querySelector('#r600Stage').textContent)&&/어려움/.test(document.body.textContent)));await shot('r701-2-hero-hwando');
await p.locator('[data-r600hero="seoha"]').click();
ok('picking another hero swaps the description',await A(()=>/윤서하/.test(document.querySelector('#r600Stage .nm').textContent)));await shot('r701-3-hero-seoha');
await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
const Z=()=>A(()=>{const z=window.__STORYWORLD_SURVIVAL_R600__,s=z.state();return {diff:s.diff,hero:s.hero,choiceQ:s.choiceQ,playT:s.playT,pickRem:s.pickRem,modal:!!modal,cards:document.querySelectorAll('.r600Card').length};});
let s=await Z();ok('started with hard difficulty',s.diff==='hard',s);
await A(()=>{const z=window.__STORYWORLD_SURVIVAL_R600__;z.qaCredit(2000);});
await p.waitForTimeout(1500);s=await Z();ok('levels queue up with no window before 77 s',s.choiceQ>=3&&!s.modal&&s.cards===0,s);
await A(()=>window.__STORYWORLD_SURVIVAL_R600__.qaPlayT(76));await p.waitForTimeout(1200);s=await Z();ok('still no window at 76 s',!s.modal&&s.cards===0,s);
const q0=s.choiceQ;await A(()=>window.__STORYWORLD_SURVIVAL_R600__.qaPlayT(77.5));await p.waitForFunction(()=>modal&&document.querySelectorAll('.r600Card').length===3,null,{timeout:60000});
s=await Z();ok('one window opens past 77 s and holds all queued picks',s.pickRem===Math.min(q0,10)&&s.modal,{q0,...s});await shot('r701-4-choice-window');
const total=s.pickRem;for(let i=0;i<total;i++){await p.waitForFunction(()=>!!document.getElementById('r600Pick0'),null,{timeout:20000});await A(()=>document.getElementById('r600Pick0').click());await p.waitForTimeout(150);}
await p.waitForTimeout(500);s=await Z();ok('after all picks the window closes and the game resumes',!s.modal&&s.pickRem===0&&s.choiceQ===1,s);
ok('no page errors',errs.length===0,errs);await b.close();console.log(fail?'FAIL '+fail:'ALL PASS');process.exit(fail?1:0);
