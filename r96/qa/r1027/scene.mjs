// R1027 전후 장면(헤드리스 소프트웨어 렌더 — GPU·실기기 그래픽 검증 아님). 같은 상황을 R1027 끔(전)/켬(후)으로 찍는다.
//  실행: SW_URL=… node r96/qa/r1027/scene.mjs <폴더> [영웅…]
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const OUT=process.argv[2]||'scenes';fs.mkdirSync(OUT,{recursive:true});
const HEROES=process.argv.slice(3).length?process.argv.slice(3):['hunter','neon','lauren','michaela'];
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const b=await chromium.launch();
for(const hero of HEROES)for(const mode of ['before','after']){
 const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
 await ctx.addInitScript(m=>{if(m==='before')localStorage.setItem('storyworld.r1027.paint','off');},mode);
 const p=await ctx.newPage();await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click();await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading&&(!modal||!!storyScene),null,{timeout:240000});await p.waitForTimeout(500);await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
 await p.evaluate(async()=>{await enterRegion('dist00',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading&&zone==='dist00',null,{timeout:150000});await skip(p);
 // 가까운 몹 옆으로
 await p.evaluate(()=>{const e=room.enemies.filter(e=>e.hp>0&&!e.boss).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];if(e){for(const [dx,dy] of [[1.4,0],[-1.4,0],[0,1.4],[0,-1.4]]){if(!blocked(e.x+dx,e.y+dy,.3)){player.x=e.x+dx;player.y=e.y+dy;target=e.id;break;}}}});
 await p.waitForTimeout(1500);
 const shot=async name=>{const q=await p.evaluate(()=>{const r=canvas.getBoundingClientRect(),q=project(player.x,player.y),sx=r.width/(canvas.width/(window.devicePixelRatio||1)||r.width);return {x:r.left+q.x*sx,y:r.top+q.y*sx};});
  const x=Math.max(0,Math.min(960-360,q.x-180)),y=Math.max(0,Math.min(540-240,q.y-150));await p.screenshot({path:path.join(OUT,name),clip:{x,y,width:360,height:240}});};
 // ① 막기(몸 보호막) + 회복 틱
 await p.evaluate(()=>{player.shield=20;try{guardStart();}catch(_){}fx('sigil',player.x,player.y,{asset:VFX.heal,size:.55,life:.24});});
 for(let i=0;i<4;i++){await p.waitForTimeout(110);await shot(`${hero}-guard${i}-${mode}.png`);}
 await p.evaluate(()=>{try{guardEnd();}catch(_){}player.shield=0;});
 // ② 자동 기본공격(휘두르기·적중) — 몹 옆에 서 있기만
 for(let i=0;i<10;i++){await p.waitForTimeout(150);await shot(`${hero}-attack${i}-${mode}.png`);}
 await ctx.close();console.log(hero,mode);}
await b.close();
