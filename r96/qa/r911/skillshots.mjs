// R911 영웅 공격·스킬 화면 캡처(눈 판정용). 키마다 누른 뒤 게임 시간 0.15·0.4초에 화면을 찍는다.
//  실행: node r96/qa/r911/skillshots.mjs <영웅…>
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));const {chromium}=createRequire(import.meta.url)('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const HELPER=fs.readFileSync(path.join(HERE,'../r795/page-helper.js'),'utf8');
const MOD=fs.readFileSync(path.join(HERE,'../../client-source/projectile-size-r911.js'),'utf8');
const OUT=path.join(HERE,'skillshots');fs.mkdirSync(OUT,{recursive:true});const ZONE=process.env.SW_ZONE||'ep1a08';
const b=await chromium.launch();
for(const hero of process.argv.slice(2)){
 const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r663.skillgrowth',JSON.stringify({on:false}));});
 const p=await ctx.newPage();p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
 const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(600);await skip();
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
 await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},ZONE);await p.waitForFunction(z=>!loading&&zone===z,ZONE,{timeout:150000});await skip();
 await p.addScriptTag({content:HELPER});if(!(await p.evaluate(()=>!!window.__STORYWORLD_PROJ_SIZE_R911__)))await p.addScriptTag({content:MOD});
 const rect=await p.evaluate(()=>{const r=document.getElementById('game').getBoundingClientRect();return {x:r.left,y:r.top,width:r.width,height:r.height};});
 for(const k of ['a','s','d','f','q','w','e','r']){
  await p.evaluate(()=>{player.hp=maxHP();__HQ795.engage(false);for(const s of ['attackCD','specialCD','blinkCD','egoCD','samongCD'])if(s in player)player[s]=0;__HQ795.step(.3,6);});
  await p.keyboard.down(k);await p.evaluate(()=>__HQ795.step(.15,1));await p.keyboard.up(k);
  await p.evaluate(()=>draw());await p.screenshot({path:path.join(OUT,`${hero}-${k}-1.png`),clip:rect});
  await p.evaluate(()=>{__HQ795.step(.25,1);draw();});await p.screenshot({path:path.join(OUT,`${hero}-${k}-2.png`),clip:rect});}
 await ctx.close();console.log('done',hero);}
await b.close();
