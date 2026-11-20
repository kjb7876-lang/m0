// R1275 심사용 휴대폰 크기(844×390, 헤드리스) P 창 사진 — 그래픽 검증 아님(임시).
import {chromium,URL,skip} from '../r444/lib.mjs';
const out=process.env.SHOT||'r1275';const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
await p.evaluate(()=>{window.__STORYWORLD_AUTOLEVEL_R237__.set(false);player.level=7;player.points=30;});await p.waitForTimeout(1500);
await p.evaluate(()=>{showUpgrades();});await p.waitForTimeout(500);
await p.evaluate(()=>{[...document.querySelectorAll('#r115Book section')].find(x=>/특수 패시브/.test(x.querySelector('h4')?.textContent||''))?.scrollIntoView({block:'start'});});await p.waitForTimeout(300);
await p.screenshot({path:out+'-pwindow-mobile.jpg',quality:85});await b.close();console.log('ok');
