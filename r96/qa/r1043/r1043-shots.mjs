// R1043 전후 사진(헤드리스): 설정 창 간이설정(PC·휴대폰) + 게임 장면 1·5·7단계. SW_URL, SW_OUT, SW_TAG(before/after)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const E=process.env,URL=E.SW_URL||'http://127.0.0.1:4410/m0/',OUT=E.SW_OUT||'/tmp/',TAG=E.SW_TAG||'after';
const b=await chromium.launch();
for(const mob of [false,true]){const ctx=mob?await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}):await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();await p.goto(URL,{timeout:180000,waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof booted!=='undefined'&&booted&&document.getElementById('campaignNew54'),null,{timeout:240000});
 await p.evaluate(()=>document.getElementById('campaignNew54').click());await p.waitForTimeout(300);await p.evaluate(()=>{[...document.querySelectorAll('button')].find(x=>/새 게임 시작/.test(x.textContent))?.click();});
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.evaluate(()=>{while(storyScene)advanceScene();closePanel(true);});await p.waitForTimeout(1500);
 await p.evaluate(()=>showSettings());await p.waitForTimeout(1200);
 await p.screenshot({path:OUT+TAG+'-settings-'+(mob?'phone':'pc')+'.png'});
 await p.evaluate(()=>{const d=document.getElementById('gfxDetailR1043');if(d)d.open=true;});await p.waitForTimeout(300);
 if(!mob&&TAG==='after'){await p.evaluate(()=>document.getElementById('perf7RowR1043')?.scrollIntoView());await p.screenshot({path:OUT+TAG+'-settings-pc-gfx.png'});
  for(const s of [1,5,7]){await p.evaluate(s=>{closePanel(true);window.__STORYWORLD_PERF7_R1043__.setStep(s);},s);await p.waitForTimeout(2500);await p.screenshot({path:OUT+TAG+'-scene-step'+s+'.png'});}
  await p.evaluate(()=>window.__STORYWORLD_PERF7_R1043__.setStep(5));}
 await ctx.close();}
await b.close();console.log('ok');
