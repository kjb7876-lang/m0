// R1030 영웅 조화 전후 촬영 — 같은 장면에서 게임 시간을 멈추고 R1030 끔/켬 두 번 그린다(헤드리스 소프트웨어 렌더링).
// 사용: SW_URL=http://127.0.0.1:4411/m0/ OUT=dir node scene.mjs [hero:zone ...]
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));const {chromium}=createRequire(import.meta.url)('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4411/m0/';const HELPER=fs.readFileSync(path.join(HERE,'../r795/page-helper.js'),'utf8');
const OUT=process.env.OUT||path.join(HERE,'shots');fs.mkdirSync(OUT,{recursive:true});
const VP=process.env.VP==='mobile'?{width:844,height:390}:{width:1280,height:720};
const jobs=(process.argv.slice(2).length?process.argv.slice(2):['hwando:dist00']).map(s=>s.split(':'));
const b=await chromium.launch();
for(const [hero,z] of jobs){
 const ctx=await b.newContext({viewport:VP,deviceScaleFactor:1});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.goto(URL,{timeout:240000});await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
 const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(600);await skip();
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
 await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&zone===z,z,{timeout:150000});await skip();
 await p.addScriptTag({content:HELPER});if(process.env.INJECT)await p.addScriptTag({content:fs.readFileSync(process.env.INJECT,'utf8')});await p.evaluate(()=>window.__STORYWORLD_HERO_HARMONY_R1030__?.rewrap?.());await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
 await p.evaluate(()=>{player.hp=maxHP();__HQ795.engage(false);});await p.evaluate(()=>__HQ795.step(.6,3));
 // 가장 가까운 살아 있는 몹 2마리를 영웅 옆으로(같은 화면에서 비교)
 await p.evaluate(()=>{const live=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y)).slice(0,2);
  live.forEach((e,i)=>{e.x=player.x+(i?-1.6:1.7);e.y=player.y+(i?.9:-.5);});player.hp=maxHP();});
 await p.evaluate(()=>__HQ795.step(.15,3));await p.evaluate(()=>{window.__SLOW=1e-5;});
 const has=await p.evaluate(()=>!!window.__STORYWORLD_HERO_HARMONY_R1030__);
 for(const [k,on] of [['before',false],['after',true]]){if(!has&&on)break;
  await p.evaluate(on=>{window.__STORYWORLD_HERO_HARMONY_R1030__?.setEnabled(on);draw();draw();draw();},on);
  await p.screenshot({path:path.join(OUT,`${hero}-${z}-${process.env.VP||'pc'}-${k}.png`),timeout:120000});
  const info=await p.evaluate(()=>({hero:player.hero,stats:window.__STORYWORLD_HERO_HARMONY_R1030__?.stats?.()||null}));console.log(k,JSON.stringify(info));}
 console.log('ok',hero,z,'errors',errs.length,errs.slice(0,2).join(' | '));await ctx.close();}
await b.close();
