// R1103 몹 공격 장면 찍기 — 몹 무리 옆에 영웅을 두고 게임 시간 0.2초마다 화면을 찍으며 탐침(orange-probe) 결과도 모은다.
// 실행: SW_URL=… node r96/qa/r1103/shots.mjs <영웅> <지역…>
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const [hero='hwando',...ZONES]=process.argv.slice(2);
const OUT=process.env.SW_OUT||path.join(HERE,'shots');fs.mkdirSync(OUT,{recursive:true});const N=+(process.env.SW_N||40);
const PROBE=fs.readFileSync(path.join(HERE,'orange-probe.js'),'utf8');
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});const p=await ctx.newPage();
p.on('pageerror',e=>console.error('PAGEERR',String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading&&(!modal||!!storyScene),null,{timeout:240000});await p.waitForTimeout(600);await skip(p);
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
await p.addScriptTag({content:PROBE});
for(const z of (ZONES.length?ZONES:['dist00'])){
 try{await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&zone===z,z,{timeout:150000});await skip(p);
 const info=await p.evaluate(()=>{const es=(room.enemies||[]).filter(e=>e.hp>0);if(!es.length)return {n:0};es.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));const e=es[0];player.x=e.x+1.4;player.y=e.y+.2;for(const o of es.slice(0,6)){o.aggro=true;o.awake=true;}return {n:es.length,names:[...new Set(es.slice(0,8).map(e=>e.name))]};});
 console.log(z,JSON.stringify(info));await p.evaluate(()=>__R1103P.reset());
 for(let i=0;i<N;i++){await p.evaluate(()=>{player.hp=Math.max(player.hp,maxHP()*.9);player.invincible=Math.max(player.invincible||0,.2);for(let j=0;j<12;j++){if(modal||loading)break;try{tick(1/60);}catch(_){}}try{draw();}catch(_){}});
  await p.screenshot({path:path.join(OUT,`${hero}-${z}-${String(i).padStart(3,'0')}.png`)});}
 fs.writeFileSync(path.join(OUT,`${hero}-${z}.json`),JSON.stringify(await p.evaluate(()=>__R1103P.dump()),null,1));
 }catch(e){console.log(z,'fail',String(e).slice(0,300));}}
await b.close();
