// R663 자동 배우기·아이콘 등장 브라우저 검사(헤드리스). 새 게임에서 점수가 들어올 때 Q→W→E→R 순서로 저절로 배워지는지, 아이콘이 숨었다 나타나는지 잰다.
import {chromium,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:720}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
await p.goto(process.env.SW_URL||'http://127.0.0.1:4410/m0/');await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
const snap=()=>p.evaluate(()=>({pts:player.points,ranks:window.__STORYWORLD_SKILL_GROWTH_R663__.inspect().ranks,hidden:['specialBtn','story-wer-w','story-wer-e','story-wer-r'].map(id=>{const e=document.getElementById(id);return e?e.classList.contains('r663hide')&&getComputedStyle(e).display==='none':null;}),pop:['specialBtn','story-wer-w'].map(id=>document.getElementById(id)?.classList.contains('r663pop'))}));
const out={};
await p.waitForFunction(()=>window.__STORYWORLD_SKILL_GROWTH_R663__.inspect().ranks.q>=1,null,{timeout:15000}).catch(()=>{});
out.afterStart=await snap();await p.screenshot({path:'/tmp/r663/learn-q.png'}).catch(()=>{});
await p.evaluate(()=>{player.points+=2;});await p.waitForTimeout(2500);out.afterW=await snap();
await p.evaluate(()=>{player.points+=3;});await p.waitForTimeout(2500);out.afterE=await snap();
await p.evaluate(()=>{player.points+=4;});await p.waitForTimeout(2500);out.afterR=await snap();
out.errors=errs.slice(0,5);console.log(JSON.stringify(out));await b.close();
