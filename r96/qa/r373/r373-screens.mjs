// R373 비교 스크린샷 — 분대 끔(before) / 켬(after) × PC 1280×720 / 모바일 390×844, dist03.
//   STORYWORLD_URL=http://127.0.0.1:4436/m0/ OUT=r96/qa/r373/screens node r96/qa/r373/r373-screens.mjs
// Headless Chromium 임시 화면. GPU·실기기 모바일 미검증.
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);let chromium;
for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4436/m0/',OUT=process.env.OUT||'out/r373';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();
for(const [dev,vp,mob] of [['pc',{width:1280,height:720},false],['mobile',{width:390,height:844},true]])for(const on of [false,true]){
 const ctx=await b.newContext({viewport:vp,isMobile:mob,hasTouch:mob});await ctx.addInitScript(o=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r373.squads',JSON.stringify({on:o}));},on);
 const p=await ctx.newPage();const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
 await p.evaluate(()=>enterRegion('dist03',null,{layer:'STORY',restore:true}));await p.waitForFunction(()=>!loading&&room?.id==='dist03',null,{timeout:120000});
 await p.waitForTimeout(600);await skip();
 // 가장 가까운 우두머리(끔이면 가장 가까운 몹 무리) 쪽으로 플레이어를 옮겨 화면에 담는다.
 await p.evaluate(()=>{const es=room.enemies.filter(e=>e.hp>0&&!e.boss);const t=es.find(e=>e.squadLeaderR373)||es[0];if(!t)return;for(const R of (innerWidth<600?[4.2,3.6,3]:[2.6,3.2,2.2,3.8]))for(let k=0;k<16;k++){const x=t.x+Math.cos(k*Math.PI/8)*R,y=t.y+Math.sin(k*Math.PI/8)*R;if(!blocked(x,y,.3,room)){player.x=x;player.y=y;return;}}});
 await p.waitForTimeout(mob?150:350);await p.screenshot({path:`${OUT}/dist03-${dev}-${on?'after':'before'}.jpg`,quality:70});
 const n=await p.evaluate(()=>room.enemies.filter(e=>e.hp>0).length);console.log(dev,on?'after':'before','enemies',n);await ctx.close();}
await b.close();
