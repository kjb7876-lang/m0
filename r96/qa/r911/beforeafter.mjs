// R911 7분야 심사용 같은 장면 전후(R911 끔/켬) — 게임 시간을 멈추고 같은 프레임을 두 번 그린다. PC 960×540, 모바일 가로 844×390.
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));const {chromium}=createRequire(import.meta.url)('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4411/m0/';const HELPER=fs.readFileSync(path.join(HERE,'../r795/page-helper.js'),'utf8');
const OUT=path.join(HERE,'review');fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();
for(const [hero,vp,tag] of [['gunner',{width:960,height:540},'pc'],['seoha',{width:844,height:390},'mobile'],['michaela',{width:960,height:540},'pc']]){
 const ctx=await b.newContext({viewport:vp,deviceScaleFactor:1});await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();await p.goto(URL,{timeout:240000});await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
 const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(600);await skip();
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
 await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},'dist00');await p.waitForFunction(()=>!loading&&zone==='dist00',null,{timeout:150000});await skip();
 await p.addScriptTag({content:HELPER});await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
 let best=0;for(let i=0;i<12;i++){await p.evaluate(()=>{player.hp=maxHP();__HQ795.engage(false);});await p.keyboard.down('a');await p.evaluate(()=>__HQ795.step(.25,3));const n=await p.evaluate(()=>projectiles.filter(b=>b.friendly&&!b.dead).length);await p.keyboard.up('a');if(n>=2)break;}
 await p.evaluate(()=>{window.__SLOW=1e-5;});
 for(const [k,on] of [['before',false],['after',true]]){await p.evaluate(on=>{window.__STORYWORLD_PROJ_SIZE_R911__.setEnabled(on);draw();draw();},on);await p.screenshot({path:path.join(OUT,`${hero}-${tag}-${k}.png`),timeout:120000});}
 await ctx.close();console.log('ok',hero,tag);}
await b.close();
